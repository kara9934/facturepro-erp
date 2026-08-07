'use strict';
/**
 * Test de l'encodeur PNG du générateur QR (étape 4bis) : on décode le PNG
 * réellement produit (pngjs -> pixels -> jsqr) pour prouver sa lisibilité,
 * et on vérifie le base64 « maison ».
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), jsQR = require('jsqr');
const { PNG } = require('pngjs');
const ctx = { Math, Array, Number, String, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'QrCode.gs'), 'utf8') + '\nglobalThis.__QR = QrCode;', ctx);
const QrCode = ctx.__QR;

let pass = 0, fail = 0;
const cas = [
  'https://simulation.fne.local/verification/9ef268e2-2ec6-482b-bf84-5408a687db64',
  'http://54.247.95.108/fr/verification/019465c1-3f61-766c-9652-706e32dfb436',
  '1234567A26000000003',
  'Facture certifiée FNE — Côte d\u2019Ivoire',
];
cas.forEach((txt) => {
  const bytes = Buffer.from(QrCode.pngBytes(txt, { module: 4, marge: 2 }));
  const png = PNG.sync.read(bytes);
  const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  const ok = res && res.data === txt;
  console.log((ok ? '  ✓' : '  ✗') + ' PNG décodé : ' + (txt.length > 40 ? txt.slice(0, 40) + '…' : txt));
  if (ok) pass++; else fail++;
});
const b64 = QrCode.pngDataUri('test').split(',')[1];
const okB64 = Buffer.from(b64, 'base64').equals(Buffer.from(QrCode.pngBytes('test')));
console.log((okB64 ? '  ✓' : '  ✗') + ' base64 maison correct');
if (!okB64) fail++;

console.log('\n=============================================');
console.log('Résultat PNG : ' + pass + '/' + cas.length + ' décodés' + (fail ? (' — ' + fail + ' échec(s)') : ''));
if (fail) process.exit(1);
console.log('✅ Tous les tests PNG passent.');
