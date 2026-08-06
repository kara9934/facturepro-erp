const fs = require('fs'), vm = require('vm'), path = require('path');
const jsQR = require('jsqr');

const ctx = { Math, Array, Number, String, console };
vm.createContext(ctx);
let src = fs.readFileSync(path.join(__dirname,'..','src','utils','QrCode.gs'),'utf8');
src += '\nglobalThis.__QR = QrCode;';
vm.runInContext(src, ctx);
const QrCode = ctx.__QR;

function rasterize(q, scale, quiet) {
  const n = q.size, dim = (n + quiet*2) * scale;
  const data = new Uint8ClampedArray(dim*dim*4).fill(255); // blanc
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
    if (!q.modules[r][c]) continue;
    for (let dy=0;dy<scale;dy++) for (let dx=0;dx<scale;dx++){
      const y=(r+quiet)*scale+dy, x=(c+quiet)*scale+dx, i=(y*dim+x)*4;
      data[i]=0;data[i+1]=0;data[i+2]=0;data[i+3]=255;
    }
  }
  return { data, dim };
}

const cas = [
  'https://simulation.fne.local/verification/019465c1-3f61-766c-9652-706e32dfb436',
  'http://54.247.95.108/fr/verification/019465c1-3f61-766c-9652-706e32dfb436',
  '9606123E26000000019',
  'A', 'Test court',
  'https://simulation.fne.local/verification/' + '0'.repeat(60),
];
let pass=0, fail=0;
cas.forEach((txt) => {
  const q = QrCode.encode(txt);
  const { data, dim } = rasterize(q, 6, 4);
  const res = jsQR(data, dim, dim);
  const ok = res && res.data === txt;
  console.log((ok?'✓':'✗') + ' v?=' + ((q.size-17)/4) + ' size=' + q.size + '  ' + (txt.length>45?txt.slice(0,45)+'…':txt));
  if (ok) pass++; else { fail++; console.log('   décodé: ' + (res?JSON.stringify(res.data):'null')); }
});
// Vérifie aussi le SVG (structure)
const s = QrCode.svg('https://simulation.fne.local/verification/019465c1', { taille: 132 });
const svgOk = s.indexOf('<svg')===0 && s.indexOf('viewBox')>0 && s.indexOf('<rect')>0;
console.log((svgOk?'✓':'✗') + ' svg() produit un SVG valide (' + s.length + ' caractères)');
if (!svgOk) fail++;
console.log('\nRésultat QR : ' + pass + '/' + cas.length + ' décodés' + (fail?(' — '+fail+' échec(s)'):''));
process.exit(fail?1:0);
