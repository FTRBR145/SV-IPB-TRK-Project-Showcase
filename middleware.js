export const config = { matcher: '/project/:path*' };

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export function projectHtml(html, project, pageUrl) {
  const title = `${project.title} | Showcase Projek TRK`;
  const description = String(project.description || `Projek ${project.title} oleh ${project.student}.`)
    .replace(/\s+/g, ' ').trim().slice(0, 180);
  const videoId = /^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})$/.exec(project.videoUrl || '')?.[1];
  const image = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : new URL('/sv_ipb_logo.png', pageUrl).href;
  const tags = [
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    '<meta property="og:type" content="article" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />'
  ].join('\n    ');
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const id = /^\/project\/(\d+)\/?$/.exec(url.pathname)?.[1];
  try {
    const [htmlResponse, projectResponse] = await Promise.all([
      fetch(new URL('/index.html', url), { cache: 'no-store' }),
      id ? fetch(new URL(`/api/projects/${id}`, url), {
        headers: { accept: 'application/json' }, cache: 'no-store'
      }) : Promise.resolve(null)
    ]);
    if (!htmlResponse.ok) throw new Error('Frontend unavailable');
    const html = await htmlResponse.text();
    const project = projectResponse?.ok ? (await projectResponse.json()).data : null;
    const canonical = new URL(`/project/${id}`, url).href;
    return new Response(project ? projectHtml(html, project, canonical) : html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'), {
      status: project ? 200 : projectResponse?.status === 404 || !id ? 404 : 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
    });
  } catch {
    return new Response('Halaman belum tersedia.', { status: 503 });
  }
}
