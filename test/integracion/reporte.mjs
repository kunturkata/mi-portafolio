// Reporter conciso: solo los fallos (con esperado/obtenido) y un resumen «n ok, n fallos, n omitidas».
export default async function* reporte(fuente) {
  let ok = 0, fallos = 0, omitidas = 0;
  const detalles = [];
  for await (const { type, data } of fuente) {
    if (type === 'test:stdout') yield data.message;
    else if (type === 'test:stderr') yield data.message.split('\n').filter(l => /^(Error|\w*Error:)/.test(l)).map(l => l + '\n').join('');
    else if (type === 'test:pass' && data.details?.type !== 'suite') {
      if (data.skip) { omitidas++; detalles.push(`  omitida: ${data.name} — ${data.skip === true ? 'sin motivo' : data.skip}\n`); } else ok++;
    } else if (type === 'test:fail' && data.details?.type !== 'suite') {
      fallos++;
      const e = data.details.error;
      const causa = e?.cause ?? e;
      const texto = String(causa?.message ?? e?.message ?? e).split('\n').slice(0, 14).join('\n    ');
      detalles.push(`\n✖ ${data.name}\n    ${texto}\n`);
    }
  }
  for (const d of detalles) yield d;
  yield `\n${ok} ok, ${fallos} fallos, ${omitidas} omitidas\n`;
}
