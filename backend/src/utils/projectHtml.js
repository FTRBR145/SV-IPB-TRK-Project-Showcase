export const siteOrigin = 'https://sv-ipb-trk-project-showcase.vercel.app';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export function projectHtml(html, project, pageUrl) {
  const title = `${project.title} | Showcase Projek TRK`;
  const description = String(project.description || `Projek ${project.title} oleh ${project.student}.`)
    .replace(/\s+/g, ' ').trim().slice(0, 180);
  const videoId = /^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})$/.exec(project.videoUrl || '')?.[1];
  const image = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `${siteOrigin}/sv_ipb_logo.png`;
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

export function unavailableProjectHtml(html) {
  return html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
}
