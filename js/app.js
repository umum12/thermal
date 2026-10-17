import * as store from './storage.js';
import { buildLines, toText, toEscPos, rp } from './receipt.js';
import * as printer from './printer.js';

const $ = id => document.getElementById(id);
let settings = { ...store.DEFAULTS };
const num = v => { const n = Number(String(v).replace(/[.\s]/g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function readForm() {
  return { tgl: $('f-tgl').value, bank: $('f-bank').value.trim(), nama: $('f-nama').value.trim(),
    rek: $('f-rek').value.trim(), nominal: num($('f-nom').value), fee: $('f-fee').value === '' ? 0 : num($('f-fee').value), cat: $('f-cat').value.trim() };
}
function validate(t) {
  if (!t.tgl) return 'Isi tanggal dan jam.';
  if (!Number.isFinite(t.nominal) || t.nominal <= 0) return 'Nominal harus berupa angka lebih dari 0.';
  if (!Number.isFinite(t.fee) || t.fee < 0) return 'Biaya layanan harus berupa angka 0 atau lebih.';
  if (t.rek && !/^[0-9\s-]+$/.test(t.rek)) return 'No. rekening hanya boleh berisi angka.';
  return '';
}
function preview() {
  const t = readForm();
  $('preview').textContent = toText(buildLines({ ...t, nominal: Number.isFinite(t.nominal) ? t.nominal : 0, fee: Number.isFinite(t.fee) ? t.fee : 0 }, settings));
}
function resetForm() {
  ['f-bank', 'f-nama', 'f-rek', 'f-nom', 'f-cat'].forEach(i => $(i).value = '');
  $('f-tgl').value = nowLocal(); $('f-fee').value = settings.fee || ''; $('err').textContent = ''; preview();
}

async function save() {
  const t = readForm(), e = validate(t); $('err').textContent = e; if (e) return null;
  try { await store.addTx(t); $('err').textContent = ''; await renderList(); return t; }
  catch { $('err').textContent = 'Gagal menyimpan ke penyimpanan perangkat.'; return null; }
}

function setStatus(msg, cls = '') { const el = $('p-status'); el.textContent = msg; el.className = 'status ' + cls; }
async function doPrint(tx) {
  const e = validate(tx); if (e) { $('err').textContent = e; return; }
  try {
    await printer.send(toEscPos(buildLines(tx, settings)));
    setStatus('Data terkirim ke printer. Periksa kertas untuk memastikan hasil cetak.', 'ok');
    $('err').textContent = '';
  } catch (err) {
    setStatus('Gagal mengirim: ' + err.message, 'bad'); $('err').textContent = 'Cetak gagal: ' + err.message + ' Buka tab Printer untuk menghubungkan ulang.';
  }
}

async function renderList() {
  const ul = $('list'); ul.textContent = '';
  let rows = []; try { rows = await store.allTx(); } catch { $('empty').textContent = 'Riwayat tidak bisa dibaca dari penyimpanan perangkat.'; return; }
  $('empty').hidden = rows.length > 0; $('empty').textContent = 'Belum ada transaksi tersimpan.';
  for (const t of rows) {
    const li = document.createElement('li'), d = new Date(t.tgl);
    const head = document.createElement('div');
    head.innerHTML = '<b></b><small></small>';
    head.firstChild.textContent = `${t.nama || t.bank || 'Transaksi'} — ${rp((t.nominal || 0) + (t.fee || 0))}`;
    head.lastChild.textContent = isNaN(d) ? t.tgl : d.toLocaleString('id-ID');
    const row = document.createElement('div'); row.className = 'row';
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; row.append(b); };
    mk('Muat', () => { $('f-tgl').value = t.tgl; $('f-bank').value = t.bank || ''; $('f-nama').value = t.nama || ''; $('f-rek').value = t.rek || '';
      $('f-nom').value = t.nominal; $('f-fee').value = t.fee || ''; $('f-cat').value = t.cat || ''; preview(); show('struk'); });
    mk('Cetak ulang', () => doPrint(t));
    mk('Hapus', async () => { if (confirm('Hapus transaksi ini?')) { await store.delTx(t.id); renderList(); } });
    li.append(head, row); ul.append(li);
  }
}

function show(name) {
  document.querySelectorAll('main > section').forEach(s => s.hidden = s.id !== name);
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  if (name === 'riwayat') renderList();
}

async function init() {
  settings = await store.loadSettings();
  $('s-toko').value = settings.toko; $('s-alamat').value = settings.alamat; $('s-foot').value = settings.foot; $('s-fee').value = settings.fee || '';
  resetForm();
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => show(b.dataset.tab));
  document.querySelectorAll('#struk input').forEach(i => i.addEventListener('input', preview));
  $('b-save').onclick = save;
  $('b-reset').onclick = resetForm;
  $('b-print').onclick = () => { const t = readForm(); if (!printer.isConnected()) { $('err').textContent = 'Printer belum terhubung. Buka tab Printer.'; return; } doPrint(t); };
  $('s-save').onclick = async () => {
    const fee = num($('s-fee').value || 0);
    if (!Number.isFinite(fee) || fee < 0) { $('s-msg').textContent = 'Biaya layanan bawaan harus angka 0 atau lebih.'; return; }
    settings = { toko: $('s-toko').value.trim(), alamat: $('s-alamat').value.trim(), foot: $('s-foot').value.trim(), fee };
    try { await store.putSet('app', settings); $('s-msg').textContent = 'Pengaturan tersimpan.'; } catch { $('s-msg').textContent = 'Gagal menyimpan pengaturan.'; }
    preview();
  };
  $('x-out').onclick = async () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await store.exportJSON()], { type: 'application/json' }));
    a.download = 'trfbt-cadangan.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  $('x-in').onclick = () => $('x-file').click();
  $('x-file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const n = await store.importJSON(await f.text()); settings = await store.loadSettings(); $('s-msg').textContent = `${n} transaksi diimpor.`; preview(); }
    catch (err) { $('s-msg').textContent = err.message; }
    e.target.value = '';
  };

  // Printer
  const ok = printer.supported();
  $('p-support').textContent = ok ? 'Web Bluetooth tersedia. Fungsinya hanya jika printer memakai BLE GATT; Bluetooth Classic (SPP) tidak bisa diakses dari browser.'
    : 'Browser ini tidak mendukung Web Bluetooth (butuh Chrome di Android dan HTTPS).';
  ['p-conn', 'p-test', 'p-off'].forEach(i => $(i).disabled = !ok);
  $('p-conn').onclick = async () => {
    setStatus('Mencari perangkat…');
    try { $('p-report').textContent = await printer.connect(() => setStatus('Koneksi terputus.', 'bad')); setStatus('Terhubung (karakteristik tulis ditemukan).', 'ok'); }
    catch (err) { if (err.report) $('p-report').textContent = err.report; setStatus(err.name === 'NotFoundError' ? 'Pemilihan perangkat dibatalkan.' : 'Gagal: ' + err.message, 'bad'); }
  };
  $('p-test').onclick = () => doPrint({ tgl: nowLocal(), bank: 'TES PRINTER', nama: '', rek: '', nominal: 1000, fee: 0, cat: 'Cetak tes 58 mm' });
  $('p-off').onclick = () => { printer.disconnect(); setStatus('Diputuskan.'); };

  const net = () => { $('net').textContent = navigator.onLine ? 'online' : 'offline'; };
  addEventListener('online', net); addEventListener('offline', net); net();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
