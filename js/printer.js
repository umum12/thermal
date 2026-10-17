// Adaptor Web Bluetooth (BLE GATT). Tidak ada keberhasilan palsu: hasil nyata dari browser saja.
const SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
];
let dev = null, ch = null;
export const supported = () => !!(navigator.bluetooth && window.isSecureContext);
export const isConnected = () => !!(dev && dev.gatt.connected && ch);

export async function connect(onDrop) {
  dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
  dev.addEventListener('gattserverdisconnected', () => { ch = null; onDrop && onDrop(); });
  const srv = await dev.gatt.connect();
  const report = [`Perangkat: ${dev.name || '(tanpa nama)'}`];
  let pick = null;
  for (const s of await srv.getPrimaryServices()) {
    report.push(`Service ${s.uuid}`);
    for (const c of await s.getCharacteristics()) {
      const p = Object.keys(c.properties).filter(k => c.properties[k]).join(',');
      report.push(`  Char ${c.uuid} [${p}]`);
      if (!pick && (c.properties.write || c.properties.writeWithoutResponse)) pick = c;
    }
  }
  if (!pick) {
    report.push('', 'Tidak ada characteristic yang bisa ditulis. Printer kemungkinan memakai Bluetooth Classic (SPP) atau service di luar daftar yang diminta.');
    throw Object.assign(new Error('Tidak ada karakteristik tulis BLE.'), { report: report.join('\n') });
  }
  ch = pick;
  report.push('', `Dipakai untuk menulis: ${pick.uuid}`);
  return report.join('\n');
}

export async function send(bytes, size = 20) {
  if (!isConnected()) throw new Error('Printer belum terhubung.');
  const noResp = ch.properties.writeWithoutResponse;
  for (let i = 0; i < bytes.length; i += size) {
    const part = bytes.slice(i, i + size);
    await (noResp ? ch.writeValueWithoutResponse(part) : ch.writeValue(part));
    await new Promise(r => setTimeout(r, 25));
  }
}
export function disconnect() { if (dev && dev.gatt.connected) dev.gatt.disconnect(); ch = null; }
