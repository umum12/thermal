const DB = 'trfbt', VER = 1;
let _db;
function open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('tx', { keyPath: 'id', autoIncrement: true });
      r.result.createObjectStore('settings');
    };
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror = () => rej(r.error);
  });
}
async function run(store, mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode), req = fn(t.objectStore(store));
    t.oncomplete = () => res(req && req.result);
    t.onerror = t.onabort = () => rej(t.error);
  });
}
export const addTx = d => run('tx', 'readwrite', s => s.add(d));
export const allTx = async () => (await run('tx', 'readonly', s => s.getAll())).reverse();
export const delTx = id => run('tx', 'readwrite', s => s.delete(id));
export const getSet = k => run('settings', 'readonly', s => s.get(k));
export const putSet = (k, v) => run('settings', 'readwrite', s => s.put(v, k));

export const DEFAULTS = { toko: 'TOKO SAYA', alamat: '', foot: 'Terima kasih', fee: 0 };
export async function loadSettings() {
  try { return { ...DEFAULTS, ...((await getSet('app')) || {}) }; } catch { return { ...DEFAULTS }; }
}

export async function exportJSON() {
  return JSON.stringify({ app: 'trfbt-pwa', version: 1, settings: await loadSettings(), tx: await allTx() }, null, 2);
}
// Mengembalikan jumlah transaksi yang diimpor; melempar Error jika berkas tidak valid.
export async function importJSON(text) {
  let d;
  try { d = JSON.parse(text); } catch { throw new Error('Berkas bukan JSON yang valid.'); }
  if (!d || d.app !== 'trfbt-pwa' || !Array.isArray(d.tx)) throw new Error('Berkas bukan cadangan TRFBT.');
  const ok = d.tx.filter(t => t && typeof t.nominal === 'number' && typeof t.tgl === 'string');
  for (const t of ok) { const { id, ...rest } = t; await addTx(rest); }
  if (d.settings && typeof d.settings === 'object') await putSet('app', { ...DEFAULTS, ...d.settings });
  return ok.length;
}
