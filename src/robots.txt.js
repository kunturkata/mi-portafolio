export const onRequestGet = ({ request }) => {
  const origen = new URL(request.url).origin;
  const lineas = [
    'User-agent: *',
    'Allow: /api/image',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /carrito',
    '',
    `Sitemap: ${origen}/sitemap.xml`,
    '',
  ];

  return new Response(lineas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
