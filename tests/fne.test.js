'use strict';
/**
 * Tests unitaires du module FNE (étape 2).
 * Charge le code source .gs dans un contexte `vm` en simulant les services
 * Google App Script (PropertiesService, LockService, Utilities, UrlFetchApp).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', 'src');

/* --- Stubs des globals Google Apps Script ------------------------------ */
const propStore = {};
function makeProps() {
  return {
    getProperty: (k) => (Object.prototype.hasOwnProperty.call(propStore, k) ? propStore[k] : null),
    setProperty: (k, v) => { propStore[k] = String(v); },
    deleteProperty: (k) => { delete propStore[k]; },
  };
}
const noopLock = { waitLock: () => {}, releaseLock: () => {}, tryLock: () => true };

const context = {
  console: console,
  JSON: JSON, Math: Math, Date: Date, Array: Array, Object: Object,
  Number: Number, String: String, isNaN: isNaN, parseInt: parseInt,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => null }) },
  PropertiesService: { getDocumentProperties: makeProps, getScriptProperties: makeProps },
  LockService: { getScriptLock: () => noopLock, getDocumentLock: () => noopLock },
  Utilities: {
    getUuid: () => '019465c1-3f61-766c-9652-706e32dfb436',
    formatDate: (d) => new Date(d).toISOString(),
  },
  UrlFetchApp: { fetch: () => { throw new Error('UrlFetchApp non simulé pour ce test'); } },
  MimeType: { HTML: 'html', PDF: 'pdf' },
};
vm.createContext(context);

/* --- Chargement du code source (ordre de dépendances) ------------------ */
const FILES = [
  'config/Constants.gs',
  'core/AppError.gs', 'core/Logger.gs', 'core/Result.gs',
  'utils/Validator.gs', 'utils/DateUtils.gs', 'utils/Formatter.gs',
  'models/Client.gs', 'models/Facture.gs', 'models/Parametres.gs',
  'repositories/BaseRepository.gs', 'repositories/ClientRepository.gs',
  'repositories/FactureRepository.gs', 'repositories/ParametresRepository.gs',
  'services/ParametresService.gs', 'services/ClientService.gs',
  'services/FactureService.gs', 'services/FneService.gs',
];
let source = FILES.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n\n');
source += `
globalThis.__T = {
  FneService, FneError, Facture, Parametres,
  FNE_STATUT, FNE_TEMPLATE, FNE_CODE_PAIEMENT, FNE_DEFAULTS,
  AppError, ValidationError, ConflictError, NotFoundError, DateUtils,
};`;
vm.runInContext(source, context, { filename: 'facturepro-merged.gs' });
const T = context.__T;

/* --- Micro-framework d'assertions -------------------------------------- */
let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; fails.push(label); console.log('  ✗ ' + label); }
}
function eq(a, b, label) { ok(a === b, label + '  (attendu ' + JSON.stringify(b) + ', obtenu ' + JSON.stringify(a) + ')'); }
function throwsFne(fn, statusCode, label) {
  try { fn(); ok(false, label + ' (aucune erreur levée)'); }
  catch (e) {
    const isFne = e instanceof T.FneError;
    const codeOk = statusCode == null || (e.details && e.details.statusCode === statusCode);
    ok(isFne && codeOk, label + (isFne ? '' : ' (type ' + e.name + ')') + (codeOk ? '' : ' (code ' + (e.details && e.details.statusCode) + ')'));
  }
}
function section(name) { console.log('\n— ' + name); }

const svc = new T.FneService();

/* ===================================================================== */
section('Mapping des codes de TVA');
eq(T.FneService.codeTva(18), 'TVA', '18% -> TVA');
eq(T.FneService.codeTva(9), 'TVAB', '9% -> TVAB');
eq(T.FneService.codeTva(0), 'TVAC', '0% -> TVAC');
eq(T.FneService.codeTva('18'), 'TVA', 'chaîne "18" -> TVA');
eq(T.FneService.codeTva(7), 'TVA', 'taux non standard -> TVA (repli)');

section('Mapping des modes de paiement');
eq(T.FneService.codePaiement('Espèces'), 'cash', 'Espèces -> cash');
eq(T.FneService.codePaiement('Mobile Money'), 'mobile-money', 'Mobile Money -> mobile-money');
eq(T.FneService.codePaiement('Virement'), 'transfer', 'Virement -> transfer');
eq(T.FneService.codePaiement('Chèque'), 'check', 'Chèque -> check');
eq(T.FneService.codePaiement('Carte bancaire'), 'card', 'Carte bancaire -> card');
eq(T.FneService.codePaiement(''), 'deferred', 'vide -> deferred');
eq(T.FneService.codePaiement('Bitcoin'), 'deferred', 'inconnu -> deferred');

section('Format du numéro fiscal (contrat DGI)');
eq(T.FneService.formaterReference('9606123E', 2025, 19), '9606123E25000000019', 'exemple officiel exact');
eq(T.FneService.formaterReference('0000001B', 2026, 1), '0000001B26000000001', 'padding séquence sur 9 chiffres');
eq(T.FneService.formaterReference('9606123E', 2026, 123456789), '9606123E26123456789', 'séquence à 9 chiffres pleins');

section('Construction du payload — B2B (client avec NCC)');
const factureB2B = new T.Facture({
  client: 'KPMG', modePaiement: 'Mobile Money',
  lignes: [
    { designation: 'Conseil', quantite: 2, prixUnitaire: 150000, unite: 'jour', remise: 0, tauxTva: 18, reference: 'ref009' },
    { designation: 'Support', quantite: 1, prixUnitaire: 50000, unite: 'forfait', remise: 10, tauxTva: 9 },
  ],
});
const clientB2B = { nom: 'KPMG CI', numeroContribuable: '9502363N', telephone: '0709080765', email: 'info@kpmg.ci' };
const params = new T.Parametres({ nomEntreprise: 'GBG', fnePointVente: 'Siège', fneEtablissement: 'Abidjan', fneUrl: '' });
const pB2B = svc._construirePayload(factureB2B, clientB2B, params);
eq(pB2B.invoiceType, 'sale', 'invoiceType = sale');
eq(pB2B.template, 'B2B', 'template = B2B (NCC présent)');
eq(pB2B.clientNcc, '9502363N', 'clientNcc repris du client');
eq(pB2B.clientCompanyName, 'KPMG CI', 'clientCompanyName = nom du client');
eq(pB2B.clientPhone, '0709080765', 'clientPhone');
eq(pB2B.clientEmail, 'info@kpmg.ci', 'clientEmail');
eq(pB2B.pointOfSale, 'Siège', 'pointOfSale depuis Paramètres');
eq(pB2B.establishment, 'Abidjan', 'establishment depuis Paramètres');
eq(pB2B.paymentMethod, 'mobile-money', 'paymentMethod mappé');
eq(pB2B.items.length, 2, '2 items');
eq(pB2B.items[0].taxes[0], 'TVA', 'item0 taxe TVA');
eq(pB2B.items[0].description, 'Conseil', 'item0 description');
eq(pB2B.items[0].quantity, 2, 'item0 quantity');
eq(pB2B.items[0].amount, 150000, 'item0 amount = P.U. HT');
eq(pB2B.items[0].reference, 'ref009', 'item0 reference');
eq(pB2B.items[0].measurementUnit, 'jour', 'item0 unité');
ok(!('discount' in pB2B.items[0]), 'item0 sans remise -> pas de clé discount');
eq(pB2B.items[1].taxes[0], 'TVAB', 'item1 taxe TVAB (9%)');
eq(pB2B.items[1].discount, 10, 'item1 remise = 10');

section('Construction du payload — B2C (sans NCC)');
const pB2C = svc._construirePayload(
  new T.Facture({ client: 'Client Particulier', lignes: [{ designation: 'x', quantite: 1, prixUnitaire: 1000, tauxTva: 18 }] }),
  null, params);
eq(pB2C.template, 'B2C', 'template = B2C (pas de client/NCC)');
eq(pB2C.clientNcc, '', 'clientNcc vide');
eq(pB2C.clientCompanyName, 'Client Particulier', 'clientCompanyName = nom sur la facture');
ok(!('measurementUnit' in pB2C.items[0]), 'item sans unité -> pas de clé measurementUnit');

section('Fallback point de vente / établissement');
const pFallback = svc._construirePayload(
  factureB2B, clientB2B,
  new T.Parametres({ nomEntreprise: 'GLOBAL BUSINESS GROUP', fnePointVente: '', fneEtablissement: '', fneUrl: '' }));
eq(pFallback.pointOfSale, 'GLOBAL BUSINESS GROUP', 'pointOfSale -> nom entreprise si vide');
eq(pFallback.establishment, 'GLOBAL BUSINESS GROUP', 'establishment -> nom entreprise si vide');

section('Validation type DGI (erreurs 400)');
throwsFne(() => svc._validerPayloadDgi(Object.assign({}, pB2B, { clientNcc: '' })), 400, 'B2B sans NCC -> 400');
throwsFne(() => svc._validerPayloadDgi(Object.assign({}, pB2B, { pointOfSale: '' })), 400, 'pointOfSale manquant -> 400');
throwsFne(() => svc._validerPayloadDgi(Object.assign({}, pB2B, { items: [] })), 400, 'items vide -> 400');
throwsFne(() => svc._validerPayloadDgi(Object.assign({}, pB2B, { items: [{ description: '', quantity: 1, amount: 10 }] })), 400, 'item sans description -> 400');
throwsFne(() => svc._validerPayloadDgi(Object.assign({}, pB2B, { items: [{ description: 'x', quantity: 0, amount: 10 }] })), 400, 'item quantité 0 -> 400');
ok((() => { try { svc._validerPayloadDgi(pB2B); return true; } catch (e) { return false; } })(), 'payload valide -> pas d\'erreur');

section('Simulation — réponse au format contrat');
for (const k of Object.keys(propStore)) delete propStore[k]; // reset compteurs
const rSim = svc._simuler(pB2B, new T.Parametres({ numeroContribuable: '', fneUrl: '' }));
eq(rSim.mode, 'simulation', 'mode = simulation');
ok(/^0000001B\d{2}\d{9}$/.test(rSim.reference), 'référence au format {NCC_DEMO}{AA}{9} : ' + rSim.reference);
ok(rSim.token.indexOf(T.FNE_DEFAULTS.URL_VERIFICATION_SIMULEE) === 0, 'token = URL de vérification simulée');
eq(rSim.invoiceId, '019465c1-3f61-766c-9652-706e32dfb436', 'invoiceId = uuid');
eq(rSim.balanceSticker, 199, 'solde stickers décrémenté (200 -> 199)');
eq(rSim.warning, false, 'warning false (solde élevé)');

section('Simulation — NCC réel des Paramètres prioritaire');
for (const k of Object.keys(propStore)) delete propStore[k];
const rSimNcc = svc._simuler(pB2B, new T.Parametres({ numeroContribuable: '9606123E', fneUrl: '' }));
ok(rSimNcc.reference.indexOf('9606123E') === 0, 'référence commence par le NCC réel : ' + rSimNcc.reference);

section('Simulation — séquence et stickers persistants');
for (const k of Object.keys(propStore)) delete propStore[k];
const a = svc._simuler(pB2B, new T.Parametres({ numeroContribuable: '9606123E', fneUrl: '' }));
const b = svc._simuler(pB2B, new T.Parametres({ numeroContribuable: '9606123E', fneUrl: '' }));
ok(a.reference.endsWith('000000001'), '1re facture -> séquence 000000001');
ok(b.reference.endsWith('000000002'), '2e facture -> séquence 000000002');
eq(a.balanceSticker, 199, '1er appel -> 199 stickers');
eq(b.balanceSticker, 198, '2e appel -> 198 stickers');

section('Bascule simulation / réel via l\'URL');
const rDispatchSim = svc._envoyer(pB2B, new T.Parametres({ numeroContribuable: '9606123E', fneUrl: '' }));
eq(rDispatchSim.mode, 'simulation', 'URL vide -> simulation');

const dgiReponse = {
  ncc: '9606123E', reference: '9606123E26000000042',
  token: 'http://54.247.95.108/fr/verification/abc', warning: false, balance_sticker: 150,
  invoice: { id: 'e2b2d8da-a532-4c08-9182-f5b428ca468d', reference: '9606123E26000000042' },
};
context.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(dgiReponse) }) };
const rReel = svc._envoyer(pB2B, new T.Parametres({ fneUrl: 'https://mock.example/ws', fneCleApi: 'KEY123' }));
eq(rReel.mode, 'reel', 'URL fournie -> appel réel');
eq(rReel.reference, '9606123E26000000042', 'référence normalisée depuis la réponse');
eq(rReel.invoiceId, 'e2b2d8da-a532-4c08-9182-f5b428ca468d', 'invoiceId depuis invoice.id');
eq(rReel.balanceSticker, 150, 'balance_sticker normalisé');

section('Réel — erreurs HTTP -> FneError');
context.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 401, getContentText: () => JSON.stringify({ message: 'Invalid API Key', error: 'unauthorized_exception', statusCode: 401 }) }) };
throwsFne(() => svc._envoyer(pB2B, new T.Parametres({ fneUrl: 'https://mock.example/ws' })), 401, '401 -> FneError 401');
context.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 500, getContentText: () => JSON.stringify({ message: 'Internal Server Error', error: 'internal_server_error', statusCode: 500 }) }) };
throwsFne(() => svc._envoyer(pB2B, new T.Parametres({ fneUrl: 'https://mock.example/ws' })), 500, '500 -> FneError 500');

section('Normalisation d\'une réponse DGI');
const norm = svc._normaliser(dgiReponse, 'reel');
eq(norm.token, 'http://54.247.95.108/fr/verification/abc', 'token (URL de vérification)');
eq(norm.warning, false, 'warning normalisé en booléen');

section('certifier() — idempotence');
const svc2 = new T.FneService();
svc2.factureService = { obtenir: () => new T.Facture({ idFacture: 'FAC-2026-0001', fneStatut: T.FNE_STATUT.CERTIFIEE, numeroFiscal: '9606123E26000000001' }) };
try { svc2.certifier('FAC-2026-0001'); ok(false, 'facture déjà certifiée -> devait lever ConflictError'); }
catch (e) { ok(e instanceof T.ConflictError, 'facture déjà certifiée -> ConflictError'); }

section('certifier() — chemin nominal (simulation)');
for (const k of Object.keys(propStore)) delete propStore[k];
const svc3 = new T.FneService();
const factureNominale = new T.Facture({ idFacture: 'FAC-2026-0002', client: 'KPMG', modePaiement: 'Mobile Money', lignes: factureB2B.lignes });
let updated = null;
svc3.factureService = { obtenir: () => factureNominale };
svc3.clientService = { rechercher: () => [clientB2B] };
svc3.parametresService = { obtenir: () => new T.Parametres({ numeroContribuable: '9606123E', fneUrl: '' }) };
svc3.factureRepo = { update: (id, f) => { updated = f; return f; } };
const resNominal = svc3.certifier('FAC-2026-0002');
eq(resNominal.mode, 'simulation', 'certifier -> mode simulation');
ok(resNominal.reference.indexOf('9606123E') === 0, 'certifier -> numéro fiscal formaté');
eq(updated.fneStatut, T.FNE_STATUT.CERTIFIEE, 'facture passée à Certifiée');
eq(updated.numeroFiscal, resNominal.reference, 'numéro fiscal stocké sur la facture');
ok(updated.fneToken.length > 0, 'token stocké sur la facture');

section('certifier() — chemin erreur (marque ERREUR et propage)');
for (const k of Object.keys(propStore)) delete propStore[k];
const svc4 = new T.FneService();
// Facture VALIDE (passe la pré-validation FR) ; on force l'échec côté envoi
// pour vérifier le traitement d'erreur de certifier() : marque ERREUR + propage.
const factErr = new T.Facture({ idFacture: 'FAC-2026-0003', client: 'KPMG CI', lignes: factureB2B.lignes });
let updatedErr = null;
svc4.factureService = { obtenir: () => factErr };
svc4.clientService = { rechercher: () => [clientB2B] };
svc4.parametresService = { obtenir: () => new T.Parametres({ numeroContribuable: '9606123E', fnePointVente: 'Siège', fneEtablissement: 'Abidjan', fneUrl: '' }) };
svc4.factureRepo = { update: (id, f) => { updatedErr = f; return f; } };
svc4._envoyer = () => { throw new T.FneError('panne plateforme', 'server_error', 500); };
try { svc4.certifier('FAC-2026-0003'); ok(false, 'échec envoi -> devait lever'); }
catch (e) { ok(e instanceof T.FneError, 'erreur propagée (FneError)'); }
ok(updatedErr && updatedErr.fneStatut === T.FNE_STATUT.ERREUR, 'facture marquée Erreur en base');

section('certifier() — pré-validation française (avant tout envoi)');
for (const k of Object.keys(propStore)) delete propStore[k];
// Client sans téléphone ni email -> ValidationError FR, sans marquage ERREUR.
const svc5 = new T.FneService();
let updated5 = null;
svc5.factureService = { obtenir: () => new T.Facture({ idFacture: 'FAC-2026-0004', client: 'ACME', lignes: factureB2B.lignes }) };
svc5.clientService = { rechercher: () => [{ nom: 'ACME', numeroContribuable: '', telephone: '', email: '' }] };
svc5.parametresService = { obtenir: () => new T.Parametres({ numeroContribuable: '9606123E', fnePointVente: 'Siège', fneEtablissement: 'Abidjan', fneUrl: '' }) };
svc5.factureRepo = { update: (id, f) => { updated5 = f; return f; } };
try { svc5.certifier('FAC-2026-0004'); ok(false, 'client sans tél/email -> devait lever'); }
catch (e) {
  ok(e instanceof T.ValidationError, 'pré-validation -> ValidationError (pas FneError)');
  ok(/t\u00e9l\u00e9phone/i.test(e.message) && /email/i.test(e.message), 'message FR mentionne téléphone et email');
}
ok(updated5 === null, 'facture NON marquée (pré-validation avant envoi)');

// Facture sans ligne -> ValidationError FR mentionnant "ligne".
const svc6 = new T.FneService();
svc6.factureService = { obtenir: () => new T.Facture({ idFacture: 'FAC-2026-0005', client: 'ACME', lignes: [] }) };
svc6.clientService = { rechercher: () => [clientB2B] };
svc6.parametresService = { obtenir: () => new T.Parametres({ numeroContribuable: '9606123E', fnePointVente: 'Siège', fneEtablissement: 'Abidjan', fneUrl: '' }) };
svc6.factureRepo = { update: () => {} };
try { svc6.certifier('FAC-2026-0005'); ok(false, 'facture sans ligne -> devait lever'); }
catch (e) { ok(e instanceof T.ValidationError && /ligne/i.test(e.message), 'sans ligne -> ValidationError FR (ligne)'); }

/* ===================================================================== */
console.log('\n=============================================');
console.log('Résultat : ' + pass + ' réussis, ' + fail + ' échoués');
if (fail) { console.log('Échecs :'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1); }
console.log('✅ Tous les tests passent.');
