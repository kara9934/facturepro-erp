'use strict';
/**
 * Tests du bandeau de certification FNE dans le PDF (étape 4).
 * Charge les fichiers nécessaires dans un contexte vm et teste _bandeauFne
 * sans exécuter le constructeur de PdfService (Object.create).
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), jsQR = require('jsqr');
const SRC = path.join(__dirname, '..', 'src');
const FILES = [
  'config/Constants.gs', 'core/AppError.gs', 'core/Logger.gs', 'core/Result.gs',
  'utils/Validator.gs', 'utils/DateUtils.gs', 'utils/Formatter.gs', 'utils/QrCode.gs',
  'models/Client.gs', 'models/Facture.gs', 'models/Parametres.gs',
  'services/PdfService.gs',
];
const context = {
  console, JSON, Math, Date, Array, Object, Number, String, isNaN, parseInt,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => null }) },
  Utilities: { formatDate: (d) => new Date(d).toISOString() },
  MimeType: { HTML: 'html', PDF: 'pdf' },
};
vm.createContext(context);
let source = FILES.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n\n');
source += '\nglobalThis.__T = { PdfService, Facture, Parametres, FNE_STATUT, QrCode };';
vm.runInContext(source, context, { filename: 'pdf-merged.gs' });
const T = context.__T;

let pass = 0, fail = 0; const fails = [];
function ok(c, l) { if (c) pass++; else { fail++; fails.push(l); console.log('  ✗ ' + l); } }

const pdf = Object.create(T.PdfService.prototype); // instance sans constructeur
const params = new T.Parametres({ nomEntreprise: 'GBG', fneUrl: '' });

// 1. Facture NON certifiée -> bandeau vide
const fNon = new T.Facture({ idFacture: 'FAC-1', fneStatut: 'Non soumise' });
ok(pdf._bandeauFne(fNon, params) === '', 'facture non certifiée -> pas de bandeau');

// 2. Facture certifiée en SIMULATION
const tokenSim = 'https://simulation.fne.local/verification/019465c1-3f61-766c-9652-706e32dfb436';
const fSim = new T.Facture({ idFacture: 'FAC-2', fneStatut: T.FNE_STATUT.CERTIFIEE, numeroFiscal: '9606123E26000000019', fneToken: tokenSim });
const bandSim = pdf._bandeauFne(fSim, params);
ok(bandSim.indexOf('fne-band') !== -1, 'simulation -> bandeau présent');
ok(bandSim.indexOf('9606123E26000000019') !== -1, 'simulation -> numéro fiscal affiché');
ok(bandSim.indexOf('NON OPPOSABLE') !== -1, 'simulation -> marquage NON OPPOSABLE');
ok(bandSim.indexOf('fne-band sim') !== -1, 'simulation -> classe sim (rouge)');
ok(bandSim.indexOf('<table') !== -1 && bandSim.indexOf('background:#000') !== -1, 'simulation -> QR en table de cellules');
ok(bandSim.indexOf(tokenSim) !== -1, 'simulation -> URL de vérification affichée');

// 3. Facture certifiée en RÉEL (token DGI, params.fneUrl défini)
const tokenReel = 'http://54.247.95.108/fr/verification/019465c1-3f61-766c-9652-706e32dfb436';
const paramsReel = new T.Parametres({ nomEntreprise: 'GBG', fneUrl: 'https://api.dgi.ci' });
const fReel = new T.Facture({ idFacture: 'FAC-3', fneStatut: T.FNE_STATUT.CERTIFIEE, numeroFiscal: '9606123E26000000020', fneToken: tokenReel });
const bandReel = pdf._bandeauFne(fReel, paramsReel);
ok(bandReel.indexOf('fne-band') !== -1 && bandReel.indexOf('fne-band sim') === -1, 'réel -> bandeau vert (pas de classe sim)');
ok(bandReel.indexOf('NON OPPOSABLE') === -1, 'réel -> pas de marquage NON OPPOSABLE');

// 4. Le QR du bandeau encode bien le token (via QrCode.encode + décodage jsQR)
function decode(txt) {
  const q = T.QrCode.encode(txt), s = 6, quiet = 4, dim = (q.size + quiet * 2) * s;
  const d = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++) if (q.modules[r][c])
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = (((r + quiet) * s + y) * dim + ((c + quiet) * s + x)) * 4; d[i] = d[i + 1] = d[i + 2] = 0; }
  const res = jsQR(d, dim, dim); return res && res.data;
}
ok(decode(tokenSim) === tokenSim, 'QR simulation décode le bon token');
ok(decode(tokenReel) === tokenReel, 'QR réel décode le bon token');

console.log('\n=============================================');
console.log('Résultat PDF/bandeau : ' + pass + ' réussis, ' + fail + ' échoués');
if (fail) { fails.forEach((f) => console.log('  - ' + f)); process.exit(1); }
console.log('✅ Tous les tests du bandeau passent.');
