import ValidatedForm from '../components/common/ValidatedForm';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import useApp from '../hooks/useApp';

const inputClass = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:bg-slate-50 disabled:text-slate-500';
const buttonClass = 'min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-50';

function PasswordField({ id, label, value, onChange, disabled, autoComplete, minLength }) {
  const [visible, setVisible] = useState(false);
  return <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-800">{label}</label>
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} required minLength={minLength} maxLength={128} autoComplete={autoComplete} value={value} onChange={onChange} disabled={disabled} className={`${inputClass} pr-12`} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>;
}

export default function ProfilePage() {
  const { currentUser, isLoggedIn, courses, logout, saveProfile, changePassword } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(currentUser.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [busy, setBusy] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const role = { admin: 'Admin', student: 'Mahasiswa', lecturer: 'Dosen' }[currentUser.role] || currentUser.role;
  const backPath = currentUser.role === 'admin' ? '/admin' : currentUser.role === 'student' ? '/student' : '/';
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy('profile'); setProfileMessage(null);
    try { await saveProfile(name.trim()); setName(name.trim()); setProfileMessage({ success: true, text: 'Profil berhasil disimpan.' }); }
    catch (error) { setProfileMessage({ success: false, text: error.message }); }
    finally { setBusy(''); }
  };
  const updatePassword = async event => {
    event.preventDefault();
    if (busy) return;
    setPasswordError('');
    if (passwords.newPassword !== passwords.confirmation) { setPasswordError('Konfirmasi password belum sama dengan password baru.'); return; }
    if (new TextEncoder().encode(passwords.newPassword).length > 72) { setPasswordError('Password baru terlalu panjang. Gunakan maksimal 72 byte.'); return; }
    setBusy('password');
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirmation: '' });
      navigate('/?login=required', { replace: true });
    } catch (error) { setPasswordError(error.message); }
    finally { setBusy(''); }
  };
  const identity = [['Email', currentUser.email], ['Role', role], ...(currentUser.role === 'student'
    ? [['NIM', currentUser.nim], ['Angkatan', currentUser.angkatan || currentUser.year], ['Semester', currentUser.semester]]
    : [['NIP', currentUser.nip]])];
  return <div className="min-h-dvh bg-slate-50 text-slate-900">
    <Navbar currentPage="account" currentUser={currentUser} isLoggedIn={isLoggedIn} courses={courses} onLogout={logout} onBackToLanding={() => navigate('/')} onNavigateToAdmin={() => navigate('/admin')} onNavigateToStudent={() => navigate('/student')} />
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <button type="button" onClick={() => navigate(backPath)} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><ArrowLeft size={17} /> Kembali</button>
      <h1 className="text-3xl font-semibold tracking-tight">Akun Saya</h1>
      <p className="mt-2 text-sm text-slate-600">Kelola profil dan keamanan akun Showcase Anda.</p>
      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-8">
        <section aria-labelledby="profile-heading" className="grid gap-6 py-7 md:grid-cols-[220px_1fr] md:gap-10">
          <div><h2 id="profile-heading" className="text-lg font-semibold">Profil</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Informasi yang terhubung dengan akun Anda.</p></div>
          <div className="min-w-0">
            <ValidatedForm onSubmit={save} className="space-y-4">
              <div><label htmlFor="profile-name" className="text-sm font-medium">Nama lengkap</label><input id="profile-name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={event => setName(event.target.value)} disabled={!!busy} className={inputClass} /></div>
              {profileMessage && <p role={profileMessage.success ? 'status' : 'alert'} className={`text-sm ${profileMessage.success ? 'text-emerald-700' : 'text-rose-700'}`}>{profileMessage.text}</p>}
              <button disabled={!!busy || name.trim() === currentUser.name} className={buttonClass}>{busy === 'profile' ? 'Menyimpan...' : 'Simpan Profil'}</button>
            </ValidatedForm>
            <dl className="mt-7 grid gap-x-6 gap-y-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
              {identity.map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value || 'Belum dicantumkan'}</dd></div>)}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-slate-600">Hubungi admin untuk memperbaiki email atau data identitas akun.</p>
          </div>
        </section>
        <section aria-labelledby="security-heading" className="grid gap-6 py-7 md:grid-cols-[220px_1fr] md:gap-10">
          <div><h2 id="security-heading" className="text-lg font-semibold">Keamanan</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Gunakan password yang unik dan tidak dibagikan kepada orang lain.</p></div>
          <ValidatedForm onSubmit={updatePassword} className="min-w-0 space-y-5">
            <PasswordField id="current-password" label="Password saat ini" value={passwords.currentPassword} onChange={event => setPasswords({...passwords,currentPassword:event.target.value})} disabled={!!busy} autoComplete="current-password" />
            <PasswordField id="new-password" label="Password baru" value={passwords.newPassword} onChange={event => setPasswords({...passwords,newPassword:event.target.value})} disabled={!!busy} autoComplete="new-password" minLength={8} />
            <p className="text-xs text-slate-600">Minimal 8 karakter. Gunakan gabungan kata yang sulit ditebak.</p>
            <PasswordField id="confirm-password" label="Konfirmasi password baru" value={passwords.confirmation} onChange={event => setPasswords({...passwords,confirmation:event.target.value})} disabled={!!busy} autoComplete="new-password" minLength={8} />
            {passwordError && <p role="alert" className="text-sm text-rose-700">{passwordError}</p>}
            <p className="text-xs leading-relaxed text-slate-600">Setelah password diubah, Anda akan keluar dari semua sesi dan perlu masuk kembali.</p>
            <button disabled={!!busy} className={buttonClass}>{busy === 'password' ? 'Mengubah...' : 'Ubah Password'}</button>
          </ValidatedForm>
        </section>
      </div>
    </main>
    <Footer />
  </div>;
}

