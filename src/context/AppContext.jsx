import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ADMIN_SETTINGS,
  DEFAULT_CATEGORIES
} from '../data/adminData';
import { SV_COURSES } from '../data/projectsData';
import {
  ApiClientError,
  apiRequest
} from '../services/apiClient';
import AppContext from './AppContextStore';
import { loadProjectCatalog } from '../services/projectApi';
import { restoreCookieSession } from '../services/sessionApi';

const DEFAULT_COURSES = SV_COURSES.filter((course) => course !== 'Semua Mata Kuliah');

export function AppProvider({ children }) {
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const catalogController = useRef(null);
  const [publicDataError, setPublicDataError] = useState(false);
  const [publicDataLoading, setPublicDataLoading] = useState(true);
  const publicDataController = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [moderators, setModerators] = useState([]);
  const [adminSettings, setAdminSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    document.title = adminSettings.siteName;
  }, [adminSettings.siteName]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    catalogController.current?.abort();
    publicDataController.current?.abort();
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
      toastTimerRef.current = null;
    }, 4200);
  }, []);

  const refreshCatalog = useCallback(async () => {
    if (catalogController.current && !catalogController.current.signal.aborted) return;
    const controller = new AbortController();
    catalogController.current = controller;
    setCatalogStatus('loading');
    try {
      const result = await loadProjectCatalog({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setProjects(result);
        setCatalogStatus('ready');
      }
    } catch {
      if (!controller.signal.aborted) setCatalogStatus('error');
    } finally {
      if (catalogController.current === controller) catalogController.current = null;
    }
  }, []);

  const refreshPublicData = useCallback(async () => {
    if (publicDataController.current && !publicDataController.current.signal.aborted) return;
    const controller = new AbortController();
    publicDataController.current = controller;
    setPublicDataLoading(true);
    try {
      const results = await Promise.allSettled(
        [['/courses', setCourses], ['/categories', setCategories], ['/settings/public', setAdminSettings]]
          .map(async ([path, setter]) => {
            const data = await apiRequest(path, { signal: controller.signal });
            if (!controller.signal.aborted) setter(data);
          })
      );
      if (!controller.signal.aborted) setPublicDataError(results.some(result => result.status === 'rejected'));
    } finally {
      if (!controller.signal.aborted) setPublicDataLoading(false);
      if (publicDataController.current === controller) publicDataController.current = null;
    }
  }, []);

  const loadPublicData = useCallback(() => Promise.all([refreshCatalog(), refreshPublicData()]), [refreshCatalog, refreshPublicData]);

  const loadPrivateData = useCallback(async (role, signal) => {
    if (role === 'admin') {
      const [submissionResponse, moderatorResponse, logResponse, studentResponse] = await Promise.all([
        apiRequest('/submissions', { signal }),
        apiRequest('/moderators', { signal }),
        apiRequest('/activity-logs', { signal }),
        apiRequest('/students', { signal })
      ]);
      setStudentAccounts(studentResponse);
      setSubmissions(submissionResponse);
      setModerators(moderatorResponse);
      setActivityLogs(logResponse);
      return;
    }

    if (role === 'student') {
      const ownSubmissions = await apiRequest('/submissions/mine', { signal });
      setSubmissions(ownSubmissions);
    }
    setStudentAccounts([]);
    setModerators([]);
    setActivityLogs([]);
  }, []);

  const refreshActivityLogs = useCallback(async () => {
    try {
      const logs = await apiRequest('/activity-logs');
      setActivityLogs(logs);
      return true;
    } catch (error) {
      console.warn('Log aktivitas belum dapat disegarkan:', error);
      return false;
    }
  }, []);

  const endSession = useCallback(() => {
    setCurrentUser(null);
    setSubmissions([]);
    setStudentAccounts([]);
    setModerators([]);
    setActivityLogs([]);
  }, []);

  const reportApiError = useCallback((error, fallbackMessage) => {
    if (error instanceof ApiClientError && error.status === 401) endSession();
    showToast(error?.message || fallbackMessage, 'error');
    return false;
  }, [endSession, showToast]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadPublicData();
      } catch (error) {
        if (active) {
          showToast(error.message, 'error');
        }
      }

      try {
        const user = await restoreCookieSession({ signal: controller.signal });
        if (active && user) {
          setCurrentUser(user);
          await loadPrivateData(user.role, controller.signal);
        }
      } catch (error) {
        if (active) {
          endSession();
          showToast(error.message, 'error');
        }
      }

      if (active) {
        setIsLoading(false);
        setIsAuthReady(true);
      }
    };

    initialize();
    return () => {
      active = false;
      controller.abort();
    };
  }, [endSession, loadPrivateData, loadPublicData, showToast]);

  const loginForRole = async (expectedRole, credentials) => {
    let sessionCreated = false;
    setIsLoading(true);
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          identifier: credentials.username.trim(),
          password: credentials.password
        }
      });
      sessionCreated = true;
      if (session.user.role !== expectedRole) {
        throw new ApiClientError(
          expectedRole === 'admin'
            ? 'Akun tersebut bukan akun administrator.'
            : 'Akun tersebut bukan akun mahasiswa.',
          { status: 403, code: 'ROLE_MISMATCH' }
        );
      }
      setCurrentUser(session.user);
      await Promise.all([loadPublicData(), loadPrivateData(session.user.role)]);
      showToast(`Selamat datang, ${session.user.name}!`);
      return session.user;
    } catch (error) {
      if (sessionCreated) {
        try {
          await apiRequest('/auth/logout', { method: 'POST', timeout: 5000 });
        } catch {
          // Preserve the original login error; local auth state is still cleared below.
        }
      }
      endSession();
      throw error;
    } finally {
      setIsLoading(false);
      setIsAuthReady(true);
    }
  };

  const loginAsStudent = (credentials) => loginForRole('student', credentials);
  const loginAsAdmin = (credentials) => loginForRole('admin', credentials);

  const logoutInProgress = useRef(false);
  const logout = async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    try {
      await apiRequest('/auth/logout', { method: 'POST', timeout: 5000 });
    } catch {
      // Still clear local credentials when the backend is unreachable.
    } finally {
      endSession();
      window.location.replace('/');
      logoutInProgress.current = false;
    }
  };

  const addProject = async (projectData) => {
    try {
      const result = await apiRequest('/projects', { method: 'POST', body: projectData });
      if (result.type === 'submission') {
        setSubmissions((previous) => [result.item, ...previous]);
        showToast('Projek dikirim dan menunggu persetujuan admin.', 'info');
      } else {
        setProjects((previous) => [result.item, ...previous]);
        showToast('Video projek berhasil disimpan dan dipublikasikan!');
      }
      if (currentUser?.role === 'admin') await refreshActivityLogs();
      return result.item;
    } catch (error) {
      reportApiError(error, 'Projek belum dapat disimpan.');
      throw error;
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const project = await apiRequest(`/projects/${projectId}`, {
        method: 'PATCH',
        body: updates
      });
      setProjects((previous) => previous.map((item) => item.id === project.id ? project : item));
      await refreshActivityLogs();
      showToast('Perubahan projek berhasil disimpan.');
      return project;
    } catch (error) {
      return reportApiError(error, 'Perubahan projek gagal disimpan.');
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE' });
      setProjects((previous) => previous.filter((project) => project.id !== projectId));
      await refreshActivityLogs();
      showToast('Projek berhasil dihapus.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Projek gagal dihapus.');
    }
  };

  const approveSubmission = async (submissionId) => {
    try {
      const result = await apiRequest(`/submissions/${submissionId}/approve`, { method: 'POST' });
      setSubmissions((previous) => previous.map((item) =>
        item.id === result.submission.id ? result.submission : item
      ));
      setProjects((previous) => [result.project, ...previous]);
      await refreshActivityLogs();
      showToast(`Projek dari ${result.submission.student} berhasil disetujui dan dipublikasikan!`);
      return true;
    } catch (error) {
      return reportApiError(error, 'Pengajuan gagal disetujui.');
    }
  };

  const rejectSubmission = async (submissionId) => {
    try {
      const result = await apiRequest(`/submissions/${submissionId}/reject`, { method: 'POST' });
      setSubmissions((previous) => previous.map((item) =>
        item.id === result.submission.id ? result.submission : item
      ));
      await refreshActivityLogs();
      showToast('Pengajuan projek telah ditolak.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Pengajuan gagal ditolak.');
    }
  };

  const restoreSubmission = async (submissionId) => {
    try {
      const result = await apiRequest(`/submissions/${submissionId}/restore`, { method: 'POST' });
      setSubmissions((previous) => previous.map((item) =>
        item.id === result.submission.id ? result.submission : item
      ));
      await refreshActivityLogs();
      showToast('Pengajuan dikembalikan ke status menunggu.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Pengajuan gagal dipulihkan.');
    }
  };

  const addModerator = async (moderatorData) => {
    try {
      const moderator = await apiRequest('/moderators', { method: 'POST', body: moderatorData });
      setModerators((previous) => [...previous, moderator]);
      await refreshActivityLogs();
      showToast('Moderator berhasil ditambahkan.');
      return moderator;
    } catch (error) {
      return reportApiError(error, 'Moderator gagal ditambahkan.');
    }
  };

  const toggleModerator = async (moderatorId) => {
    try {
      const moderator = await apiRequest(`/moderators/${moderatorId}/status`, { method: 'PATCH' });
      setModerators((previous) => previous.map((item) => item.id === moderator.id ? moderator : item));
      await refreshActivityLogs();
      showToast('Status moderator berhasil diperbarui.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Status moderator gagal diperbarui.');
    }
  };

  const deleteModerator = async (moderatorId) => {
    try {
      await apiRequest(`/moderators/${moderatorId}`, { method: 'DELETE' });
      setModerators((previous) => previous.filter((moderator) => moderator.id !== moderatorId));
      await refreshActivityLogs();
      showToast('Moderator berhasil dihapus.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Moderator gagal dihapus.');
    }
  };

  const updateSubmission = async (submissionId, updates) => {
    try {
      const submission = await apiRequest(`/submissions/${submissionId}`, {
        method: 'PATCH',
        body: updates
      });
      setSubmissions((previous) => previous.map((item) => item.id === submission.id ? submission : item));
      showToast('Perubahan pengajuan berhasil disimpan dan tetap menunggu persetujuan.', 'success');
      return submission;
    } catch (error) {
      return reportApiError(error, 'Perubahan pengajuan gagal disimpan.');
    }
  };

  const deleteProjects = async (projectIds) => {
    try {
      const result = await apiRequest('/projects/bulk-delete', { method: 'POST', body: { ids: projectIds } });
      const deletedIds = new Set(result.ids);
      setProjects((previous) => previous.filter((project) => !deletedIds.has(project.id)));
      await refreshActivityLogs();
      showToast(`${result.deletedCount} projek berhasil dihapus.`, 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Projek terpilih gagal dihapus.');
    }
  };

  const updateStudent = async (studentId, updates) => {
    try {
      const student = await apiRequest(`/students/${studentId}`, { method: 'PATCH', body: updates });
      setStudentAccounts((previous) => previous.map((item) => item.id === student.id ? student : item));
      await refreshActivityLogs();
      showToast('Data mahasiswa berhasil diperbarui.');
      return student;
    } catch (error) {
      return reportApiError(error, 'Data mahasiswa gagal diperbarui.');
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      await apiRequest(`/students/${studentId}`, { method: 'DELETE' });
      setStudentAccounts((previous) => previous.filter((student) => student.id !== studentId));
      await refreshActivityLogs();
      showToast('Akun mahasiswa berhasil dihapus.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Akun mahasiswa gagal dihapus.');
    }
  };

  const deleteStudents = async (studentIds) => {
    try {
      const result = await apiRequest('/students/bulk-delete', { method: 'POST', body: { ids: studentIds } });
      const deletedIds = new Set(result.ids);
      setStudentAccounts((previous) => previous.filter((student) => !deletedIds.has(student.id)));
      await refreshActivityLogs();
      showToast(`${result.deletedCount} akun mahasiswa berhasil dihapus.`, 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Akun mahasiswa terpilih gagal dihapus.');
    }
  };

  const addCourse = async (courseName) => {
    try {
      const result = await apiRequest('/courses', { method: 'POST', body: { name: courseName } });
      setCourses((previous) => [...previous, result.name]);
      await refreshActivityLogs();
      showToast('Mata kuliah berhasil ditambahkan.');
      return true;
    } catch (error) {
      return reportApiError(error, 'Mata kuliah gagal ditambahkan.');
    }
  };

  const updateCourse = async (courseName, nextName) => {
    try {
      const result = await apiRequest(`/courses/${encodeURIComponent(courseName)}`, {
        method: 'PATCH',
        body: { name: nextName }
      });
      setCourses((previous) => previous.map((course) => course === courseName ? result.name : course));
      setProjects((previous) => previous.map((project) => project.course === courseName ? { ...project, course: result.name } : project));
      setSubmissions((previous) => previous.map((submission) => submission.course === courseName ? { ...submission, course: result.name } : submission));
      await refreshActivityLogs();
      showToast('Nama mata kuliah berhasil diperbarui.');
      return true;
    } catch (error) {
      return reportApiError(error, 'Nama mata kuliah gagal diperbarui.');
    }
  };

  const deleteCourse = async (courseName) => {
    try {
      await apiRequest(`/courses/${encodeURIComponent(courseName)}`, { method: 'DELETE' });
      setCourses((previous) => previous.filter((course) => course !== courseName));
      await refreshActivityLogs();
      showToast('Mata kuliah berhasil dihapus.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Mata kuliah gagal dihapus.');
    }
  };

  const updateAdminSettings = async (updates) => {
    try {
      const settings = await apiRequest('/settings', { method: 'PATCH', body: updates });
      setAdminSettings(settings);
      await refreshActivityLogs();
      showToast('Pengaturan berhasil disimpan.');
      return true;
    } catch (error) {
      return reportApiError(error, 'Pengaturan gagal disimpan.');
    }
  };

  const clearActivityLogs = async () => {
    try {
      await apiRequest('/activity-logs', { method: 'DELETE' });
      await refreshActivityLogs();
      showToast('Log aktivitas dibersihkan.', 'info');
      return true;
    } catch (error) {
      return reportApiError(error, 'Log aktivitas gagal dibersihkan.');
    }
  };

  return (
    <AppContext.Provider value={{
      projects,
      catalogStatus,
      refreshCatalog,
      publicDataError,
      publicDataLoading,
      refreshPublicData,
      studentAccounts,
      refreshStudents: async () => {
        setStudentAccounts(await apiRequest('/students'));
        await refreshActivityLogs();
      },
      currentUser,
      saveProfile: async (name) => {
        const user = await apiRequest('/auth/me', { method: 'PATCH', body: { name } });
        setCurrentUser(user);
        return user;
      },
      changePassword: async (passwords) => {
        await apiRequest('/auth/password', { method: 'POST', body: passwords });
        endSession();
        showToast('Password berhasil diubah. Silakan masuk dengan password baru.', 'success');
      },
      isLoggedIn: Boolean(currentUser),
      isAuthReady,
      submissions,
      courses,
      categories,
      moderators,
      adminSettings,
      activityLogs,
      refreshActivityLogs,
      toast,
      isLoading,
      showToast,
      loginAsStudent,
      loginAsAdmin,
      logout,
      addProject,
      updateProject,
      updateSubmission,
      deleteProject,
      deleteProjects,
      approveSubmission,
      rejectSubmission,
      restoreSubmission,
      addModerator,
      toggleModerator,
      deleteModerator,
      updateStudent,
      deleteStudent,
      deleteStudents,
      addCourse,
      updateCourse,
      deleteCourse,
      updateAdminSettings,
      clearActivityLogs
    }}>
      {children}
    </AppContext.Provider>
  );
}
