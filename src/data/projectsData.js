import { normalizeProjectVideo } from '../utils/projectInput.js';

export function getYouTubeThumbnail(videoUrl) {
  const embedUrl = normalizeProjectVideo(videoUrl);
  return embedUrl ? `https://i.ytimg.com/vi/${embedUrl.slice(-11)}/hqdefault.jpg` : '';
}

export function getYouTubeEmbedUrl(videoUrl) {
  return normalizeProjectVideo(videoUrl);
}

export const SV_COURSES = [
  "Semua Mata Kuliah",
  "RANGKAIAN LOGIKA DAN TEKNIK DIGITAL",
  "TEKNOLOGI BENGKEL ELEKTROMEKANIK",
  "APLIKASI MOBILE",
  "SISTEM TERTANAM (EMBEDDED SYSTEM)",
  "PROYEK SISTEM IOT (INTERNET OF THINGS)"
];
