import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const adminPasswordHash = bcrypt.hashSync(env.adminPassword, 10);
const studentPasswordHash = bcrypt.hashSync(env.studentPassword, 10);

export function createSeedData() {
  return {
    users: [
      {
        id: 1,
        name: 'Administrator TRK',
        nim: '198503152010121002',
        email: env.adminEmail.toLowerCase(),
        passwordHash: adminPasswordHash,
        role: 'admin',
        roleName: 'Dosen / Admin TRK SV IPB'
      },
      {
        id: 2,
        name: 'Nabila Putri Utami',
        nim: 'J0304211015',
        email: env.studentEmail.toLowerCase(),
        passwordHash: studentPasswordHash,
        role: 'student',
        roleName: 'Mahasiswa TRK SV IPB',
        semester: 5,
        angkatan: '58 (2021)'
      }
    ],
    projects: [
      {
        id: 1,
        title: 'Sistem IoT Smart Farming & Monitoring Sensor ESP32',
        student: 'Ahmad Rizky Pratama',
        nim: 'J0304211088',
        prodi: 'Teknologi Rekayasa Komputer',
        prodiCode: 'TRK',
        course: 'PROYEK SISTEM IOT (INTERNET OF THINGS)',
        category: 'Internet of Things',
        semester: 4,
        techStack: ['ESP32', 'MQTT', 'Node.js'],
        videoUrl: 'https://www.youtube.com/embed/9KxU30uM3qM',
        supervisor: 'Prof. Dr. Ir. Kudang Boro Seminar, M.Sc.',
        year: '2025/2026',
        date: '18 Agustus 2026',
        description: 'Monitoring kondisi greenhouse menggunakan ESP32 dan protokol MQTT.',
        comments: [],
        createdAt: '2026-08-18T08:00:00.000Z',
        updatedAt: '2026-08-18T08:00:00.000Z'
      },
      {
        id: 2,
        title: 'Aplikasi Mobile Smart Home & Monitoring Energi',
        student: 'Nabila Putri Utami',
        nim: 'J0304211015',
        prodi: 'Teknologi Rekayasa Komputer',
        prodiCode: 'TRK',
        course: 'APLIKASI MOBILE',
        category: 'Aplikasi Mobile',
        semester: 5,
        techStack: ['Flutter', 'Firebase', 'ESP8266'],
        videoUrl: 'https://www.youtube.com/embed/ysz5S6PUM-U',
        supervisor: 'Guji Syaikhurrahman, S.Kom., M.T.',
        year: '2025/2026',
        date: '10 Agustus 2026',
        description: 'Kontrol perangkat rumah pintar dan monitoring energi berbasis Flutter.',
        comments: [],
        createdAt: '2026-08-10T08:00:00.000Z',
        updatedAt: '2026-08-10T08:00:00.000Z'
      }
    ],
    submissions: [
      {
        id: 101,
        title: 'Sistem Deteksi Suhu Otomatis Ruang Server TRK',
        student: 'Fajar Pratama',
        nim: 'J0304211099',
        course: 'SISTEM TERTANAM (EMBEDDED SYSTEM)',
        category: 'Embedded System',
        semester: 4,
        date: '24 Agustus 2026',
        status: 'pending',
        description: 'Implementasi sensor DHT22 dan NodeMCU dengan notifikasi Telegram.',
        techStack: ['DHT22', 'ESP8266', 'Telegram Bot'],
        videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
        createdAt: '2026-08-24T08:00:00.000Z',
        moderatedAt: null
      }
    ],
    courses: [
      'RANGKAIAN LOGIKA DAN TEKNIK DIGITAL',
      'TEKNOLOGI BENGKEL ELEKTROMEKANIK',
      'APLIKASI MOBILE',
      'SISTEM TERTANAM (EMBEDDED SYSTEM)',
      'PROYEK SISTEM IOT (INTERNET OF THINGS)'
    ],
    categories: [
      'Internet of Things',
      'Embedded System',
      'Aplikasi Mobile',
      'Jaringan Komputer',
      'Rangkaian Digital'
    ],
    moderators: [
      {
        id: 1,
        name: 'Administrator TRK',
        nip: '198503152010121002',
        email: env.adminEmail.toLowerCase(),
        status: 'active'
      }
    ],
    settings: {
      siteName: 'Showcase Projek TRK SV IPB',
      academicYear: '2026/2027',
      moderationRequired: true,
      allowGuestUploads: false,
      maintenanceMode: false
    },
    activityLogs: [
      {
        id: 1,
        type: 'system',
        message: 'Backend Showcase TRK siap digunakan.',
        actor: 'Sistem',
        timestamp: '2026-09-02T00:00:00.000Z'
      }
    ]
  };
}
