export const W = 32; // Font A, 384 dot / 12 dot = 32 kolom pada kertas 58 mm
export const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const ascii = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '?');
const center = s => ' '.repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
const pair = (l, r) => l + ' '.repeat(Math.max(1, W - l.length - r.length)) + r;
function wrap(s, w = W) {
  const out = []; let cur = '';
  for (const word of ascii(s).split(/\s+/).filter(Boolean)) {
    if ((cur + ' ' + word).trim().length > w) { if (cur) out.push(cur); cur = word; while (cur.length > w) { out.push(cur.slice(0, w)); cur = cur.slice(w); } }
    else cur = (cur + ' ' + word).trim();
  }
  if (cur) out.push(cur);
  return out;
}
const fmtTgl = iso => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }); };

// Menghasilkan daftar baris { t: teks, b: tebal } — dipakai bersama oleh pratinjau dan ESC/POS.
export function buildLines(tx, s) {
  const L = [], add = (t = '', b = false) => L.push({ t, b }), line = '-'.repeat(W);
  wrap(s.toko).forEach(t => add(center(t), true));
  wrap(s.alamat).forEach(t => add(center(t)));
  add(line);
  add(ascii(fmtTgl(tx.tgl)));
  if (tx.bank) wrap('Tujuan: ' + tx.bank).forEach(t => add(t));
  if (tx.nama) wrap('Nama: ' + tx.nama).forEach(t => add(t));
  if (tx.rek) add('Rek: ' + ascii(tx.rek));
  add(line);
  add(pair('Nominal', rp(tx.nominal)));
  add(pair('Biaya layanan', rp(tx.fee)));
  add(pair('TOTAL', rp((tx.nominal || 0) + (tx.fee || 0))), true);
  if (tx.cat) { add(line); wrap('Cat: ' + tx.cat).forEach(t => add(t)); }
  add(line);
  wrap(s.foot).forEach(t => add(center(t)));
  return L;
}
export const toText = L => L.map(l => l.t).join('\n');

// ESC/POS: hanya perintah dasar (init, bold, feed). Belum diverifikasi pada XP-58IIZ fisik.
export function toEscPos(L, feed = 4) {
  const b = [0x1b, 0x40];
  for (const l of L) {
    b.push(0x1b, 0x45, l.b ? 1 : 0);
    for (const c of ascii(l.t)) b.push(c.charCodeAt(0));
    b.push(0x0a);
  }
  b.push(0x1b, 0x45, 0, 0x1b, 0x64, feed);
  return new Uint8Array(b);
}
