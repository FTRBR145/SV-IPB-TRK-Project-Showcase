import { activityActor, studentActivity, settingsActivity } from '../utils/activity.js';
import { ApiError } from '../utils/http.js';

const entityTables = ['users', 'projects', 'submissions', 'moderators', 'activity_logs'];
const unpack = row => row ? { ...row.data, id: row.id } : null;
const now = () => new Date().toISOString();
const asId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

export function createPostgresRepository(pool) {
  const query = (sql, values) => pool.query(sql, values);
  const rows = async (sql, values) => (await query(sql, values)).rows;
  const find = async (table, id) => unpack((await rows(`select * from showcase.${table} where id=$1`, [asId(id)]))[0]);
  const transaction = async work => {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally { client.release(); }
  };
  const insert = async (client, table, data) => {
    const { id: _id, ...document } = data;
    return unpack((await client.query(`insert into showcase.${table}(data) values ($1) returning *`, [document])).rows[0]);
  };
  const log = async (client, message, type = 'info', actor = 'Sistem') => {
    const entry = await insert(client, 'activity_logs', { message, type, ...activityActor(actor), timestamp: now() });
    await client.query('delete from showcase.activity_logs where id in (select id from showcase.activity_logs order by id desc offset 200)');
    return entry;
  };
  const createProject = async (client, data, actor) => {
    const timestamp = now();
    const project = await insert(client, 'projects', { ...data, comments: data.comments || [], createdAt: timestamp, updatedAt: timestamp });
    await log(client, `Projek “${project.title}” dipublikasikan.`, 'project', actor);
    return project;
  };

  return {
    updateOwnProfile(id, name, actor) {
      return transaction(async client => {
        const user = unpack((await client.query("update showcase.users set data=data || $2::jsonb where id=$1 returning *", [asId(id), JSON.stringify({name})])).rows[0]);
        if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Akun tidak ditemukan.');
        await log(client, 'Memperbarui nama profil.', 'user', actor);
        return user;
      });
    },
    changeOwnPassword(id, previousHash, passwordHash, actor) {
      return transaction(async client => {
        const result = await client.query("update showcase.users set data=data || jsonb_build_object('passwordHash', $3::text, 'authVersion', coalesce((data->>'authVersion')::integer,0)+1) where id=$1 and data->>'passwordHash'=$2 returning id", [asId(id), previousHash, passwordHash]);
        if (!result.rows.length) return false;
        await log(client, 'Mengubah password akun.', 'user', actor);
        return true;
      });
    },
    async getPublicStatistics() {
      const [statistics] = await rows(`select
        (select count(*)::integer from showcase.projects) as projects,
        (select count(*)::integer from showcase.users where data->>'role'='student') as students,
        (select count(*)::integer from showcase.courses) as courses,
        (select count(*)::integer from showcase.moderators where data->>'role'='lecturer') as lecturers`);
      return statistics;
    },
    recordActivity: (message, type, actor) => transaction(client => log(client, message, type, actor)),
    async listStudents() {
      return (await rows("select id, data - 'passwordHash' as data from showcase.users where data->>'role'='student' order by lower(data->>'name'),id")).map(unpack);
    },
    async getUserIdentifiers() {
      return (await rows("select data->>'email' as email, data->>'nim' as nim from showcase.users"));
    },
    createStudents(students, actor) {
      return transaction(async client => {
        // Recheck under a lock: a preview may be stale or two admins may import together.
        await client.query('lock table showcase.users in share row exclusive mode');
        const existing = (await client.query("select data->>'email' as email, data->>'nim' as nim from showcase.users")).rows;
        const emails = new Set(existing.map(user => user.email?.toLowerCase()));
        const nims = new Set(existing.map(user => user.nim?.toUpperCase()));
        for (const student of students) {
          if (emails.has(student.email) || nims.has(student.nim)) throw new ApiError(409, 'STUDENT_EXISTS', `NIM atau email ${student.nim} sudah terdaftar. Periksa ulang data.`);
          emails.add(student.email); nims.add(student.nim);
        }
        const result = await client.query(
          "insert into showcase.users(data) select value from jsonb_array_elements($1::jsonb) returning id, data - 'passwordHash' as data",
          [JSON.stringify(students)]
        );
        const created = result.rows.map(unpack);
        await log(client, studentActivity(created), 'user', actor);
        return created;
      });
    },
    updateStudent(id, data, actor) {
      return transaction(async client => {
        const studentId = asId(id);
        await client.query('lock table showcase.users in share row exclusive mode');
        const existing = unpack((await client.query("select * from showcase.users where id=$1 and data->>'role'='student'", [studentId])).rows[0]);
        if (!existing) return { error: 'not_found' };
        const duplicate = (await client.query(
          "select 1 from showcase.users where id<>$1 and (lower(data->>'email')=$2 or upper(data->>'nim')=$3) limit 1",
          [studentId, data.email.toLowerCase(), data.nim.toUpperCase()]
        )).rows[0];
        if (duplicate) return { error: 'duplicate' };
        const updated = unpack((await client.query(
          "update showcase.users set data=data || $2::jsonb where id=$1 and data->>'role'='student' returning id, data - 'passwordHash' as data",
          [studentId, JSON.stringify(data)]
        )).rows[0]);
        await log(client, `Akun mahasiswa ${existing.name} (${existing.nim}) diperbarui.`, 'user', actor);
        return updated;
      });
    },
    deleteStudent(id, actor) {
      return transaction(async client => {
        const studentId = asId(id);
        const existing = unpack((await client.query("select * from showcase.users where id=$1 and data->>'role'='student'", [studentId])).rows[0]);
        if (!existing) return { error: 'not_found' };
        const removed = unpack((await client.query("delete from showcase.users where id=$1 and data->>'role'='student' returning id, data - 'passwordHash' as data", [studentId])).rows[0]);
        await log(client, `Akun mahasiswa ${existing.name} (${existing.nim}) dihapus.`, 'danger', actor);
        return { student: removed };
      });
    },
    deleteStudents(ids, actor) {
      return transaction(async client => {
        const studentIds = ids.map(asId);
        const existingRows = (await client.query(
          "select * from showcase.users where id=any($1::bigint[]) and data->>'role'='student' for update",
          [studentIds]
        )).rows;
        if (existingRows.length !== studentIds.length) return { error: 'not_found' };
        const removed = (await client.query(
          "delete from showcase.users where id=any($1::bigint[]) and data->>'role'='student' returning id, data - 'passwordHash' as data",
          [studentIds]
        )).rows.map(unpack);
        await log(client, `${removed.length} akun mahasiswa dihapus sekaligus.`, 'danger', actor);
        return { students: removed };
      });
    },
    async health() { await query('select 1 from showcase.settings where id=1'); },
    async close() { await pool.end(); },
    async seed(seed) {
      return transaction(async client => {
        // Two instances may initialize together; seed exactly once.
        await client.query('lock table showcase.settings in exclusive mode');
        if ((await client.query('select id from showcase.settings where id=1')).rows.length) return false;
        for (const table of entityTables) {
          const key = table === 'activity_logs' ? 'activityLogs' : table;
          for (const { id, ...data } of seed[key]) {
            await client.query(`insert into showcase.${table}(id,data) values ($1,$2)`, [id, data]);
          }
          await client.query(`select setval(pg_get_serial_sequence('showcase.${table}', 'id'), coalesce((select max(id) from showcase.${table}),0)+1, false)`);
        }
        for (const table of ['courses', 'categories']) {
          for (const [position, name] of seed[table].entries()) {
            await client.query(`insert into showcase.${table}(name,position) values ($1,$2)`, [name, position]);
          }
        }
        await client.query('insert into showcase.settings(id,data) values(1,$1)', [seed.settings]);
        return true;
      });
    },
    async reset() {
      // Persistent deployments must never expose the old demo-wide reset.
      throw new ApiError(403, 'RESET_DISABLED', 'Reset data demo tidak tersedia pada database permanen.');
    },
    async findUserByEmail(email) { return this.findUserByIdentifier(email); },
    async findUserByIdentifier(identifier) {
      return unpack((await rows("select * from showcase.users where lower(data->>'email')=$1 or lower(data->>'nim')=$1", [identifier.trim().toLowerCase()]))[0]);
    },
    findUserById: id => find('users', id),
    findProjectById: id => find('projects', id),
    findSubmissionById: id => find('submissions', id),
    async listProjects({ search = '', course, semester, nim, page = 1, limit = 12 } = {}) {
      const filters = []; const values = [];
      for (const [key, value] of Object.entries({ course, semester, nim })) {
        if (value) { values.push(String(value)); filters.push(`data->>'${key}'=$${values.length}`); }
      }
      if (search.trim()) {
        values.push(search.trim().toLowerCase());
        filters.push(`strpos(lower(concat_ws(' ', data->>'title',data->>'student',data->>'nim',data->>'course',data->>'supervisor',(data->'techStack')::text)), $${values.length}) > 0`);
      }
      const where = filters.length ? `where ${filters.join(' and ')}` : '';
      const safePage = Math.max(1, Math.floor(Number(page)) || 1);
      const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 12));
      // Count and items share one MVCC snapshot, including empty pages.
      const result = (await rows(`with filtered as (select * from showcase.projects ${where}),
        page_items as (select * from filtered order by id desc limit $${values.length+1} offset $${values.length+2})
        select (select count(*)::integer from filtered) as total,
        coalesce((select jsonb_agg(jsonb_build_object('id',id,'data',data) order by id desc) from page_items),'[]'::jsonb) as items`,
      [...values, safeLimit, (safePage-1)*safeLimit]))[0];
      return { items: result.items.map(unpack), total: result.total, page: safePage, limit: safeLimit, totalPages: Math.max(1, Math.ceil(result.total/safeLimit)) };
    },
    createProject: (data, actor = 'Sistem') => transaction(client => createProject(client, data, actor)),
    async updateProject(id, updates, actor) {
      return transaction(async client => {
        const { id: _id, ...safeUpdates } = updates;
        const project = unpack((await client.query('update showcase.projects set data=data || $2::jsonb where id=$1 returning *', [asId(id), { ...safeUpdates, updatedAt: now() }])).rows[0]);
        if (project) await log(client, `Projek “${project.title}” diperbarui.`, 'project', actor);
        return project;
      });
    },
    async deleteProject(id, actor) {
      return transaction(async client => {
        const project = unpack((await client.query('delete from showcase.projects where id=$1 returning *', [asId(id)])).rows[0]);
        if (project) await log(client, `Projek “${project.title}” dihapus.`, 'danger', actor);
        return project;
      });
    },
    deleteProjects(ids, actor) {
      return transaction(async client => {
        const projectIds = ids.map(asId);
        const existingRows = (await client.query(
          'select id from showcase.projects where id=any($1::bigint[]) for update',
          [projectIds]
        )).rows;
        if (existingRows.length !== projectIds.length) return { error: 'not_found' };
        const projects = (await client.query(
          'delete from showcase.projects where id=any($1::bigint[]) returning *',
          [projectIds]
        )).rows.map(unpack);
        await log(client, `${projects.length} projek dihapus sekaligus.`, 'danger', actor);
        return { projects };
      });
    },
    createSubmission(data, actor) {
      return transaction(async client => {
        const submission = await insert(client, 'submissions', { ...data, status: 'pending', createdAt: now(), moderatedAt: null });
        await log(client, `Pengajuan “${submission.title}” dari ${submission.student} diterima.`, 'submission', actor);
        return submission;
      });
    },
    async listSubmissions({ status, nim } = {}) {
      const values=[]; const filters=[];
      for (const [key,value] of Object.entries({status,nim})) {
        if(value) { values.push(String(value)); filters.push(`data->>'${key}'=$${values.length}`); }
      }
      return (await rows(`select * from showcase.submissions ${filters.length ? 'where '+filters.join(' and ') : ''} order by id desc`,values)).map(unpack);
    },
    approveSubmission(id, actor) {
      return transaction(async client => {
        const row = (await client.query('select * from showcase.submissions where id=$1 for update', [asId(id)])).rows[0];
        if (!row) return { error: 'not_found' };
        if (row.data.status !== 'pending') return { error: 'invalid_status' };
        const { status: _status, moderatedAt: _moderatedAt, createdAt: _createdAt, ...data } = row.data;
        const project = await createProject(client, data, actor);
        const submission = unpack((await client.query('update showcase.submissions set data=data || $2::jsonb, project_id=$3 where id=$1 returning *', [row.id, {status:'approved',moderatedAt:now()}, project.id])).rows[0]);
        await log(client, `Pengajuan “${submission.title}” dari ${submission.student} disetujui.`, 'success', actor);
        return { submission, project };
      });
    },
    rejectSubmission(id, actor) { return this.setSubmissionStatus(id, 'rejected', 'pending', actor); },
    restoreSubmission(id, actor) { return this.setSubmissionStatus(id, 'pending', 'rejected', actor); },
    setSubmissionStatus(id, status, expected, actor) {
      return transaction(async client => {
        const row = (await client.query('select * from showcase.submissions where id=$1 for update', [asId(id)])).rows[0];
        if (!row) return {error:'not_found'};
        if (row.data.status !== expected) return {error:'invalid_status'};
        const submission = unpack((await client.query('update showcase.submissions set data=data || $2::jsonb where id=$1 returning *',[row.id,{status,moderatedAt:status==='pending'?null:now()}])).rows[0]);
        await log(client, status==='pending' ? `Pengajuan “${submission.title}” dari ${submission.student} dikembalikan ke antrean.` : `Pengajuan “${submission.title}” dari ${submission.student} ditolak.`, 'submission', actor);
        return {submission};
      });
    },
    async getCourses() { return (await rows('select name from showcase.courses order by position,name')).map(row=>row.name); },
    async getCategories() { return (await rows('select name from showcase.categories order by position,name')).map(row=>row.name); },
    addCourse(name, actor) {
      return transaction(async client => {
        const result=await client.query('insert into showcase.courses(name,position) values($1,(select coalesce(max(position),0)+1 from showcase.courses)) on conflict do nothing returning name',[name.trim().toUpperCase()]);
        if(!result.rows.length) return null;
        await log(client,`Mata kuliah “${result.rows[0].name}” ditambahkan.`,'taxonomy',actor);
        return result.rows[0].name;
      });
    },
    deleteCourse(name, actor) {
      return transaction(async client => {
        // Prevent concurrent uploads from racing the in-use check.
        await client.query('lock table showcase.projects, showcase.submissions in share mode');
        const used=await client.query("select id from showcase.projects where data->>'course'=$1 union all select id from showcase.submissions where data->>'course'=$1 limit 1",[name]);
        if(used.rows.length) return {error:'in_use'};
        const result=await client.query('delete from showcase.courses where name=$1 returning name',[name]);
        if(!result.rows.length) return {error:'not_found'};
        await log(client,`Mata kuliah “${name}” dihapus.`,'taxonomy',actor);
        return {course:name};
      });
    },
    async getModerators() { return (await rows('select * from showcase.moderators order by id')).map(unpack); },
    addModerator(data, actor) {
      return transaction(async client => {
        const result=await client.query('insert into showcase.moderators(data) values($1) on conflict do nothing returning *',[{...data,email:data.email.toLowerCase(),status:'active'}]);
        const moderator=unpack(result.rows[0]);
        if(moderator) await log(client,`Moderator ${moderator.name} (${moderator.email}) ditambahkan.`,'user',actor);
        return moderator;
      });
    },
    toggleModerator(id,actor) { return this.changeModerator(id,actor,false); },
    deleteModerator(id,actor) { return this.changeModerator(id,actor,true); },
    changeModerator(id,actor,remove) {
      return transaction(async client => {
        await client.query('lock table showcase.moderators in exclusive mode');
        const moderators=(await client.query('select * from showcase.moderators')).rows;
        const row=moderators.find(item=>item.id===asId(id));
        if(!row) return {error:'not_found'};
        if(remove && moderators.length<=1) return {error:'last_moderator'};
        if(!remove && row.data.status==='active' && moderators.filter(item=>item.data.status==='active').length<=1) return {error:'last_active'};
        const result=remove
          ? await client.query('delete from showcase.moderators where id=$1 returning *',[row.id])
          : await client.query('update showcase.moderators set data=data || $2::jsonb where id=$1 returning *',[row.id,{status:row.data.status==='active'?'inactive':'active'}]);
        await log(client,remove?`Moderator ${row.data.name} dihapus.`:`Moderator ${row.data.name} (${row.data.email}) ${row.data.status === 'active' ? 'dinonaktifkan' : 'diaktifkan'}.`,'user',actor);
        return {moderator:unpack(result.rows[0])};
      });
    },
    async getSettings() {
      const row=(await rows('select data from showcase.settings where id=1'))[0];
      if(!row) throw new Error('Database belum diinisialisasi. Jalankan db:seed.');
      return row.data;
    },
    updateSettings(updates,actor) {
      return transaction(async client => {
        const before = (await client.query('select data from showcase.settings where id=1 for update')).rows[0].data;
        const result=await client.query('update showcase.settings set data=data || $1::jsonb where id=1 returning data',[updates]);
        const message = settingsActivity(before, result.rows[0].data);
        if (message) await log(client,message,'settings',actor);
        return result.rows[0].data;
      });
    },
    async getActivityLogs() { return (await rows('select * from showcase.activity_logs order by id desc limit 200')).map(unpack); },
    clearActivityLogs(actor) { return transaction(async client => { await client.query('delete from showcase.activity_logs'); return log(client,'Log aktivitas dibersihkan.','system',actor); }); }
  };
}
