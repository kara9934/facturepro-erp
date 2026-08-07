/**
 * FacturePro ERP — build fusionné (version facile).
 * Généré automatiquement par build.sh — ne pas éditer à la main.
 * Source de vérité : dépôt modulaire (src/**).
 */

// ====================================================================
// src/config/Constants.gs
// ====================================================================
/**
 * @file Constants.gs
 * @module config/Constants
 * @description Constantes globales et immuables de FacturePro ERP.
 *              Aucune logique : uniquement des valeurs de référence figées.
 *              Centraliser ces valeurs évite les "chaînes magiques" dispersées
 *              dans le code (renommer une feuille = 1 seul endroit à modifier).
 */

/** Métadonnées applicatives. */
const APP = Object.freeze({
  NAME: 'FacturePro ERP',
  VERSION: '1.0.0',
  AUTHOR: 'FacturePro',
  LOCALE: 'fr-FR',
  TIMEZONE: 'Africa/Abidjan',
});

/** Noms des feuilles du classeur Suivi_Factures. */
const SHEETS = Object.freeze({
  FACTURES: 'Factures',
  CLIENTS: 'Clients',
  PARAMETRES: 'Paramètres',
  DASHBOARD: 'Tableau_de_bord',
});

/**
 * Schémas de colonnes (ordre = ordre attendu à la création).
 * Le repository résout dynamiquement l'index réel via la ligne d'en-tête ;
 * ces listes servent de "source de vérité" et permettent l'auto-création.
 */
const SCHEMA = Object.freeze({
  FACTURES: Object.freeze([
    'ID_Facture', 'ID_Client', 'Date_Facture', 'Client', 'Objet', 'Lignes',
    'Montant_HT', 'TVA', 'Montant_TTC', 'Statut', 'Date_Echeance',
    'Date_Paiement', 'Mode_Paiement', 'Référence', 'Observations',
    // --- Certification FNE (DGI Côte d'Ivoire) ---
    'Numero_Fiscal', 'FNE_Token', 'FNE_Invoice_Id', 'FNE_Statut',
  ]),
  CLIENTS: Object.freeze([
    'ID_Client', 'Nom', 'Téléphone', 'Email', 'Adresse', 'Ville', 'Pays',
    'Contact', 'Numéro_Contribuable', 'Statut', 'Date_Création',
  ]),
  PARAMETRES: Object.freeze([
    'Nom_Entreprise', 'Adresse', 'Téléphone', 'Email', 'Site_Web',
    'Numéro_Contribuable', 'Taux_TVA', 'Devise', 'Délai_Paiement',
    // --- Configuration FNE (l'URL vide = mode simulation) ---
    'FNE_URL', 'FNE_Cle_API', 'FNE_Point_Vente', 'FNE_Etablissement',
  ]),
  DASHBOARD: Object.freeze(['Indicateur', 'Valeur']),
});

/** Statuts métier d'une facture (cycle de vie). */
const FACTURE_STATUT = Object.freeze({
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  EN_RETARD: 'En retard',
  ANNULEE: 'Annulée',
});

/** Statuts d'un client. */
const CLIENT_STATUT = Object.freeze({ ACTIF: 'Actif', INACTIF: 'Inactif' });

/** Modes de paiement acceptés. */
const MODE_PAIEMENT = Object.freeze({
  VIREMENT: 'Virement',
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  MOBILE_MONEY: 'Mobile Money',
  CARTE: 'Carte bancaire',
});

/* ==================================================================== */
/* FNE — Facture Normalisée Électronique (DGI Côte d'Ivoire)            */
/* Contrat de référence : « Procédure d'interfaçage des entreprises par */
/* API » (DGI, mai 2025), endpoint POST $url/external/invoices/sign.    */
/* ==================================================================== */

/** Statut de certification FNE d'une facture. */
const FNE_STATUT = Object.freeze({
  NON_CERTIFIEE: 'Non certifiée',
  CERTIFIEE: 'Certifiée',
  ERREUR: 'Erreur',
});

/** Templates FNE (nature du client), selon le lexique officiel. */
const FNE_TEMPLATE = Object.freeze({
  B2B: 'B2B', // client professionnel possédant un NCC
  B2C: 'B2C', // particulier
  B2G: 'B2G', // institution gouvernementale
  B2F: 'B2F', // client à l'international
});

/** Correspondance mode de paiement FacturePro -> code paiement DGI. */
const FNE_CODE_PAIEMENT = Object.freeze({
  'Espèces': 'cash',
  'Carte bancaire': 'card',
  'Chèque': 'check',
  'Mobile Money': 'mobile-money',
  'Virement': 'transfer',
});

/** Endpoints de l'API FNE (relatifs à l'URL de base configurée). */
const FNE_ENDPOINTS = Object.freeze({
  SIGN: '/external/invoices/sign', // certification d'une facture de vente
});

/** Valeurs par défaut du module FNE (mode simulation). */
const FNE_DEFAULTS = Object.freeze({
  // NCC de démonstration : format officiel (7 chiffres + 1 lettre) mais fictif.
  // Remplacé par le NCC réel dès qu'il est saisi dans les Paramètres.
  NCC_DEMO: '0000001B',
  STICKER_INITIAL: 200,       // stock de stickers simulé au premier appel
  STICKER_SEUIL_ALERTE: 20,   // en dessous, la réponse porte warning = true
  URL_VERIFICATION_SIMULEE: 'https://simulation.fne.local/verification/',
});

/** Clés de stockage PropertiesService (évite les collisions). */
const PROP_KEYS = Object.freeze({
  DRIVE_FOLDER_ID: 'FP_DRIVE_FOLDER_ID',
  FACTURE_SEQUENCE_PREFIX: 'FP_SEQ_FACTURE_',
  CLIENT_SEQUENCE: 'FP_SEQ_CLIENT',
  // Séquence fiscale FNE (série ininterrompue annuelle) et solde de stickers simulé.
  FNE_SEQUENCE_PREFIX: 'FP_FNE_SEQ_',
  FNE_STICKER_BALANCE: 'FP_FNE_STICKER',
});

/** Niveaux de log. */
const LOG_LEVEL = Object.freeze({ DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 });

/** Valeurs par défaut si les Paramètres sont incomplets. */
const DEFAULTS = Object.freeze({
  TAUX_TVA: 18,          // %
  DEVISE: 'XOF',
  DELAI_PAIEMENT: 30,    // jours
  DRIVE_FOLDER_NAME: 'FacturePro - Factures PDF',
});

// ====================================================================
// src/core/AppError.gs
// ====================================================================
/**
 * @file AppError.gs
 * @module core/AppError
 * @description Hiérarchie d'erreurs métier typées. Permet de distinguer une
 *              erreur de validation (à afficher à l'utilisateur) d'une erreur
 *              technique (à logger), et d'uniformiser le format renvoyé au client.
 */

/** Erreur applicative de base. */
class AppError extends Error {
  /**
   * @param {string} message  Message lisible.
   * @param {string} code     Code machine (ex: 'VALIDATION').
   * @param {Object} [details] Détails additionnels (champ fautif, etc.).
   */
  constructor(message, code, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'APP_ERROR';
    this.details = details || null;
  }

  /** Sérialisation sûre pour transport vers le client. */
  toJSON() {
    return { name: this.name, message: this.message, code: this.code, details: this.details };
  }
}

/** Donnée invalide fournie par l'utilisateur. */
class ValidationError extends AppError {
  constructor(message, details) { super(message, 'VALIDATION', details); }
}

/** Entité introuvable. */
class NotFoundError extends AppError {
  constructor(message, details) { super(message, 'NOT_FOUND', details); }
}

/** Conflit (doublon, état incohérent). */
class ConflictError extends AppError {
  constructor(message, details) { super(message, 'CONFLICT', details); }
}

// ====================================================================
// src/core/Logger.gs
// ====================================================================
/**
 * @file Logger.gs
 * @module core/Logger
 * @description Logger centralisé avec niveaux. Enrobe console.* pour offrir un
 *              format homogène, un préfixe applicatif et un seuil configurable.
 *              Point d'extension : brancher plus tard un log persistant (feuille
 *              "Logs", BigQuery, etc.) sans toucher au reste du code.
 */
const Log = (function () {
  let currentLevel = LOG_LEVEL.INFO;

  /** Définit le seuil minimal de log. @param {number} level */
  function setLevel(level) { currentLevel = level; }

  function write(level, label, message, context) {
    if (level < currentLevel) return;
    const ts = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const ctx = context ? ' | ' + safeStringify(context) : '';
    console.log('[' + ts + '] [' + label + '] ' + message + ctx);
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return String(obj); }
  }

  return {
    setLevel: setLevel,
    debug: (m, c) => write(LOG_LEVEL.DEBUG, 'DEBUG', m, c),
    info: (m, c) => write(LOG_LEVEL.INFO, 'INFO', m, c),
    warn: (m, c) => write(LOG_LEVEL.WARN, 'WARN', m, c),
    error: (m, c) => write(LOG_LEVEL.ERROR, 'ERROR', m, c),
  };
})();

// ====================================================================
// src/core/Result.gs
// ====================================================================
/**
 * @file Result.gs
 * @module core/Result
 * @description Enveloppe de réponse standardisée renvoyée par les contrôleurs
 *              vers le client (google.script.run). Format unique => le front
 *              traite succès et erreurs de façon homogène.
 *
 * Forme : { success: boolean, data?: *, error?: {message, code, details} }
 */
const Result = Object.freeze({
  /** @param {*} data @returns {{success:boolean,data:*}} */
  ok(data) { return { success: true, data: data === undefined ? null : data }; },

  /** @param {Error} error @returns {{success:boolean,error:Object}} */
  fail(error) {
    const isApp = error instanceof AppError;
    return {
      success: false,
      error: {
        message: error && error.message ? error.message : 'Erreur inconnue',
        code: isApp ? error.code : 'INTERNAL',
        details: isApp ? error.details : null,
      },
    };
  },
});

/**
 * Exécute une fonction contrôleur en capturant toute exception dans un Result.
 * Évite de répéter try/catch dans chaque point d'entrée exposé au client.
 * @param {string} action  Libellé pour les logs.
 * @param {Function} fn    Logique à exécuter.
 * @returns {Object} Result
 */
function guard(action, fn) {
  try {
    Log.info('Action: ' + action);
    return Result.ok(fn());
  } catch (err) {
    Log.error('Échec: ' + action + ' -> ' + err.message, { stack: err.stack });
    return Result.fail(err);
  }
}

// ====================================================================
// src/utils/Validator.gs
// ====================================================================
/**
 * @file Validator.gs
 * @module utils/Validator
 * @description Validation des données d'entrée. Lève ValidationError avec un
 *              message clair. Centraliser les règles ici garantit une
 *              validation cohérente entre l'UI, l'API et les triggers.
 */
const Validator = Object.freeze({
  EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** @param {*} v @param {string} champ */
  required(v, champ) {
    if (v === null || v === undefined || String(v).trim() === '') {
      throw new ValidationError('Le champ "' + champ + '" est obligatoire.', { champ: champ });
    }
    return v;
  },

  /** @param {*} v @param {string} champ */
  number(v, champ) {
    const n = Number(v);
    if (isNaN(n)) throw new ValidationError('"' + champ + '" doit être un nombre.', { champ: champ });
    return n;
  },

  /** @param {*} v @param {string} champ */
  positive(v, champ) {
    const n = this.number(v, champ);
    if (n < 0) throw new ValidationError('"' + champ + '" ne peut pas être négatif.', { champ: champ });
    return n;
  },

  /** @param {string} email @param {string} [champ] */
  email(email, champ) {
    if (email && !this.EMAIL_RE.test(String(email))) {
      throw new ValidationError('Email invalide.', { champ: champ || 'Email', valeur: email });
    }
    return email;
  },

  /** @param {*} v @param {Array} liste @param {string} champ */
  oneOf(v, liste, champ) {
    if (v && liste.indexOf(v) === -1) {
      throw new ValidationError('Valeur non autorisée pour "' + champ + '".', { champ: champ, autorise: liste });
    }
    return v;
  },
});

// ====================================================================
// src/utils/DateUtils.gs
// ====================================================================
/**
 * @file DateUtils.gs
 * @module utils/DateUtils
 * @description Fonctions utilitaires de dates (format homogène, calculs).
 */
const DateUtils = Object.freeze({
  /** @param {*} value @returns {Date|null} */
  parse(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  },

  /** ISO court "yyyy-MM-dd" ou null. @param {*} value @returns {string|null} */
  toISO(value) {
    const d = this.parse(value);
    return d ? Utilities.formatDate(d, APP.TIMEZONE, 'yyyy-MM-dd') : null;
  },

  /** Format lisible "dd/MM/yyyy". @param {*} value @returns {string} */
  toDisplay(value) {
    const d = this.parse(value);
    return d ? Utilities.formatDate(d, APP.TIMEZONE, 'dd/MM/yyyy') : '';
  },

  /** Ajoute des jours. @param {Date} date @param {number} jours @returns {Date} */
  addDays(date, jours) {
    const d = new Date(this.parse(date).getTime());
    d.setDate(d.getDate() + Number(jours || 0));
    return d;
  },

  /** Année courante. @returns {number} */
  currentYear() { return new Date().getFullYear(); },
});

// ====================================================================
// src/utils/Formatter.gs
// ====================================================================
/**
 * @file Formatter.gs
 * @module utils/Formatter
 * @description Formatage d'affichage (montants, devises).
 */
const Formatter = Object.freeze({
  /**
   * Formate un montant avec séparateur de milliers et devise.
   * @param {number} montant
   * @param {string} [devise]
   * @returns {string}
   */
  money(montant, devise) {
    const n = Number(montant) || 0;
    const s = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s + (devise ? ' ' + devise : '');
  },

  /** Coupe une chaîne à une longueur max. @param {string} str @param {number} max */
  truncate(str, max) {
    str = String(str || '');
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  },
});

// ====================================================================
// src/utils/QrCode.gs
// ====================================================================
/**
 * @file QrCode.gs
 * @module utils/QrCode
 * @description Générateur de QR code autonome (code pur, aucune dépendance ni
 *              appel réseau), pour encoder l'URL de vérification FNE sur le PDF.
 *              Implémente : encodage octet (byte mode), correction d'erreurs
 *              Reed-Solomon niveau M, sélection automatique de version (1 à 10),
 *              masquage optimal (8 masques + pénalités), info de format/version,
 *              et rendu SVG. Le SVG est net à l'impression et intégrable
 *              directement dans le template HTML du PDF.
 *
 *              Usage : QrCode.svg('https://…', { taille: 132, marge: 4 });
 */
const QrCode = (function () {
  /* --- Corps de Galois GF(256), polynôme primitif 0x11d ---------------- */
  const EXP = new Array(512);
  const LOG = new Array(256);
  (function initGf() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gfMul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* --- Tables par version, niveau M ------------------------------------ */
  // { ec: codewords EC par bloc, groupes: [[nbBlocs, codewords data par bloc], …] }
  const M = {
    1: { ec: 10, g: [[1, 16]] },
    2: { ec: 16, g: [[1, 28]] },
    3: { ec: 26, g: [[1, 44]] },
    4: { ec: 18, g: [[2, 32]] },
    5: { ec: 24, g: [[2, 43]] },
    6: { ec: 16, g: [[4, 27]] },
    7: { ec: 18, g: [[4, 31]] },
    8: { ec: 22, g: [[2, 38], [2, 39]] },
    9: { ec: 22, g: [[3, 36], [2, 37]] },
    10: { ec: 26, g: [[4, 43], [1, 44]] },
  };
  // Positions des motifs d'alignement par version.
  const ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };

  function dataCodewords(v) {
    return M[v].g.reduce((s, grp) => s + grp[0] * grp[1], 0);
  }

  /* --- Reed-Solomon : codewords de correction -------------------------- */
  function rsGenerator(n) {
    let poly = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], EXP[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }
  function rsEncode(data, n) {
    // rsGenerator renvoie les coefficients de x^0 à x^n (terme dominant en dernier).
    // Le registre à décalage ci-dessous attend les coefficients de x^(n-1) à x^0
    // (terme dominant exclu), d'où l'inversion.
    const div = rsGenerator(n).slice(0, n).reverse();
    const res = new Array(n).fill(0);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      if (factor !== 0) {
        for (let j = 0; j < n; j++) res[j] ^= gfMul(div[j], factor);
      }
    }
    return res;
  }

  /* --- Encodage des données (byte mode) -------------------------------- */
  function toBytes(text) {
    // Encodage UTF-8.
    const out = [];
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else if (c >= 0xd800 && c <= 0xdbff) {
        const c2 = text.charCodeAt(++i);
        c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
        out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      } else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return out;
  }

  function chooseVersion(nbBytes) {
    for (let v = 1; v <= 10; v++) {
      const countBits = v <= 9 ? 8 : 16;
      const capacityBits = dataCodewords(v) * 8 - 4 - countBits;
      if (nbBytes * 8 <= capacityBits) return v;
    }
    throw new Error('Données trop longues pour un QR code (max ~200 octets).');
  }

  function buildDataBits(bytes, v) {
    const bits = [];
    function push(val, len) { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(0x4, 4);                               // indicateur de mode : octet
    push(bytes.length, v <= 9 ? 8 : 16);        // compteur de caractères
    bytes.forEach((b) => push(b, 8));
    const totalBits = dataCodewords(v) * 8;
    // Terminateur (jusqu'à 4 bits) puis alignement octet.
    for (let i = 0; i < 4 && bits.length < totalBits; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    // Octets de remplissage alternés 0xEC / 0x11.
    const pads = [0xec, 0x11];
    let p = 0;
    while (bits.length < totalBits) { push(pads[p % 2], 8); p++; }
    // Regroupe en codewords.
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      cw.push(b);
    }
    return cw;
  }

  // Entrelacement data + EC selon la structure de blocs.
  function interleave(cw, v) {
    const spec = M[v];
    const blocks = [];
    let idx = 0;
    spec.g.forEach((grp) => {
      for (let b = 0; b < grp[0]; b++) {
        const data = cw.slice(idx, idx + grp[1]);
        idx += grp[1];
        blocks.push({ data: data, ec: rsEncode(data, spec.ec) });
      }
    });
    const maxData = Math.max.apply(null, blocks.map((b) => b.data.length));
    const out = [];
    for (let i = 0; i < maxData; i++) {
      blocks.forEach((b) => { if (i < b.data.length) out.push(b.data[i]); });
    }
    for (let i = 0; i < spec.ec; i++) {
      blocks.forEach((b) => out.push(b.ec[i]));
    }
    return out;
  }

  /* --- Construction de la matrice -------------------------------------- */
  function newMatrix(size) {
    const m = [], reserved = [];
    for (let r = 0; r < size; r++) { m.push(new Array(size).fill(0)); reserved.push(new Array(size).fill(false)); }
    return { m: m, res: reserved, size: size };
  }
  function setF(M2, r, c, val) { M2.m[r][c] = val ? 1 : 0; M2.res[r][c] = true; }

  function placeFinder(M2, r, c) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= M2.size || cc >= M2.size) continue;
        const inRing = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                       (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6));
        const inCore = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        setF(M2, rr, cc, inRing || inCore);
      }
    }
  }
  function placeAlignment(M2, v) {
    const pos = ALIGN[v];
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const r = pos[i], c = pos[j];
        if (M2.res[r][c]) continue; // évite les motifs de recherche
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const ring = Math.max(Math.abs(dr), Math.abs(dc));
            setF(M2, r + dr, c + dc, ring !== 1);
          }
        }
      }
    }
  }
  function placeTiming(M2) {
    for (let i = 8; i < M2.size - 8; i++) {
      if (!M2.res[6][i]) setF(M2, 6, i, i % 2 === 0);
      if (!M2.res[i][6]) setF(M2, i, 6, i % 2 === 0);
    }
  }
  function reserveFormat(M2, v) {
    const size = M2.size;
    for (let i = 0; i <= 8; i++) {
      if (!M2.res[8][i]) M2.res[8][i] = true;
      if (!M2.res[i][8]) M2.res[i][8] = true;
    }
    for (let i = 0; i < 8; i++) {
      M2.res[8][size - 1 - i] = true;
      M2.res[size - 1 - i][8] = true;
    }
    setF(M2, size - 8, 8, true); // module toujours noir
    if (v >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          M2.res[i][size - 11 + j] = true;
          M2.res[size - 11 + j][i] = true;
        }
      }
    }
  }

  function placeData(M2, codewords) {
    const bits = [];
    codewords.forEach((cw) => { for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1); });
    let idx = 0, up = true;
    for (let col = M2.size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5; // saute la colonne de timing
      for (let i = 0; i < M2.size; i++) {
        const row = up ? M2.size - 1 - i : i;
        for (let k = 0; k < 2; k++) {
          const c = col - k;
          if (!M2.res[row][c]) {
            M2.m[row][c] = idx < bits.length ? bits[idx] : 0;
            idx++;
          }
        }
      }
      up = !up;
    }
  }

  function maskFn(k) {
    return [
      (r, c) => (r + c) % 2 === 0,
      (r) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ][k];
  }
  function applyMask(M2, k) {
    const fn = maskFn(k);
    const out = { m: M2.m.map((row) => row.slice()), res: M2.res, size: M2.size };
    for (let r = 0; r < M2.size; r++) {
      for (let c = 0; c < M2.size; c++) {
        if (!M2.res[r][c] && fn(r, c)) out.m[r][c] ^= 1;
      }
    }
    return out;
  }

  // BCH pour info de format (15 bits) et version (18 bits).
  function bch(data, gen, glen) {
    let d = data;
    const dlen = Math.floor(Math.log2(gen)) + 1;
    d <<= (dlen - 1);
    let rem = d;
    while (Math.floor(Math.log2(rem)) + 1 >= dlen) {
      rem ^= gen << (Math.floor(Math.log2(rem)) + 1 - dlen);
    }
    return d ^ rem;
  }
  function placeFormat(M2, mask) {
    const data = (0b00 << 3) | mask; // niveau M = 00
    let fmt = bch(data, 0b10100110111, 10);
    fmt ^= 0b101010000010010;
    const size = M2.size;
    const bit = (i) => (fmt >> i) & 1;
    for (let i = 0; i < 15; i++) {
      const b = bit(i);
      // Bande verticale (colonne 8), en sautant la ligne de timing (6).
      if (i < 6) M2.m[i][8] = b;
      else if (i < 8) M2.m[i + 1][8] = b;
      else M2.m[size - 15 + i][8] = b;
      // Bande horizontale (ligne 8), en sautant la colonne de timing (6).
      if (i < 8) M2.m[8][size - 1 - i] = b;
      else if (i < 9) M2.m[8][7] = b;
      else M2.m[8][14 - i] = b;
    }
    M2.m[size - 8][8] = 1; // module toujours noir
  }
  function placeVersion(M2, v) {
    if (v < 7) return;
    let ver = bch(v, 0b1111100100101, 12);
    ver |= v << 12;
    const size = M2.size;
    for (let i = 0; i < 18; i++) {
      const bit = (ver >> i) & 1;
      const r = Math.floor(i / 3), c = i % 3;
      M2.m[r][size - 11 + c] = bit;
      M2.m[size - 11 + c][r] = bit;
    }
  }

  /* --- Pénalités (choix du meilleur masque) ---------------------------- */
  function penalty(M2) {
    const n = M2.size, m = M2.m;
    let p = 0;
    // Règle 1 : séries de même couleur.
    for (let r = 0; r < n; r++) {
      let runC = 1, runR = 1;
      for (let c = 1; c < n; c++) {
        runC = m[r][c] === m[r][c - 1] ? runC + 1 : 1;
        if (runC === 5) p += 3; else if (runC > 5) p += 1;
        runR = m[c][r] === m[c - 1][r] ? runR + 1 : 1;
        if (runR === 5) p += 3; else if (runR > 5) p += 1;
      }
    }
    // Règle 2 : blocs 2x2.
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        const v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
      }
    }
    // Règle 3 : motif 1011101 (0000 avant/après).
    const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function match(line, i, pat) { for (let k = 0; k < 11; k++) if (line[i + k] !== pat[k]) return false; return true; }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n - 11; c++) {
        const row = m[r], col = m.map((x) => x[c]); // col recalculé, ok pour POC
        if (match(m[r], c, pat1) || match(m[r], c, pat2)) p += 40;
      }
    }
    for (let c = 0; c < n; c++) {
      const col = m.map((x) => x[c]);
      for (let r = 0; r <= n - 11; r++) {
        if (match(col, r, pat1) || match(col, r, pat2)) p += 40;
      }
    }
    // Règle 4 : proportion de modules noirs.
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) dark += m[r][c];
    const ratio = (dark * 100) / (n * n);
    p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return p;
  }

  /* --- Encodage complet -> matrice booléenne --------------------------- */
  function encode(text) {
    const bytes = toBytes(String(text));
    const v = chooseVersion(bytes.length);
    const size = 17 + 4 * v;
    const cw = interleave(buildDataBits(bytes, v), v);

    const base = newMatrix(size);
    placeFinder(base, 0, 0);
    placeFinder(base, 0, size - 7);
    placeFinder(base, size - 7, 0);
    placeAlignment(base, v);
    placeTiming(base);
    reserveFormat(base, v);
    placeData(base, cw);

    let best = null, bestPen = Infinity;
    for (let k = 0; k < 8; k++) {
      const masked = applyMask(base, k);
      placeFormat(masked, k);
      placeVersion(masked, v);
      const pen = penalty(masked);
      if (pen < bestPen) { bestPen = pen; best = masked; }
    }
    return { size: size, modules: best.m.map((row) => row.map((x) => x === 1)) };
  }

  /* --- Rendu SVG ------------------------------------------------------- */
  function svg(text, opts) {
    opts = opts || {};
    const q = encode(text);
    const marge = opts.marge != null ? opts.marge : 4;
    const total = q.size + marge * 2;
    const taille = opts.taille || 132;
    const fond = opts.fond || '#ffffff';
    const couleur = opts.couleur || '#000000';
    let rects = '';
    for (let r = 0; r < q.size; r++) {
      for (let c = 0; c < q.size; c++) {
        if (q.modules[r][c]) rects += '<rect x="' + (c + marge) + '" y="' + (r + marge) + '" width="1" height="1"/>';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + fond + '"/>' +
      '<g fill="' + couleur + '">' + rects + '</g></svg>';
  }

  /* --- Rendu en table HTML (pour le convertisseur PDF de GAS) ---------- */
  /**
   * Rend le QR sous forme de table HTML (une cellule par module). Contrairement
   * au SVG, cette forme est rendue de façon fiable par le convertisseur
   * HTML -> PDF de Google Apps Script. Fournir la classe CSS `qrDark` (fond noir)
   * et une largeur/hauteur de cellule via le <style> du document.
   * @param {string} text
   * @param {{module?:number, marge?:number, couleur?:string}} [opts]
   * @returns {string} HTML (conteneur blanc + table)
   */
  function htmlTable(text, opts) {
    opts = opts || {};
    const q = encode(text);
    const px = opts.module || 3;
    const quiet = opts.marge != null ? opts.marge : 4;
    const dark = opts.couleur || '#000';
    let rows = '';
    for (let r = 0; r < q.size; r++) {
      let cells = '';
      for (let c = 0; c < q.size; c++) {
        cells += q.modules[r][c]
          ? '<td style="width:' + px + 'px;height:' + px + 'px;padding:0;line-height:0;font-size:0;background:' + dark + '"></td>'
          : '<td style="width:' + px + 'px;height:' + px + 'px;padding:0;line-height:0;font-size:0"></td>';
      }
      rows += '<tr>' + cells + '</tr>';
    }
    const pad = quiet * px;
    return '<table cellpadding="0" cellspacing="0" border="0" '
      + 'style="border-collapse:collapse;table-layout:fixed;background:#fff;'
      + 'padding:' + pad + 'px;">' + rows + '</table>';
  }

  /* --- Rendu en PNG (data-URI) — le plus fiable pour le PDF de GAS ------ */
  // Le convertisseur HTML -> PDF de Google rend les <img> (data-URI) de façon
  // fiable, contrairement au SVG ou à une table de cellules. On encode donc le
  // QR en PNG « maison » (aucune dépendance) : DEFLATE stocké + zlib + CRC32.

  const CRC_TABLE = (function () {
    const t = new Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function adler32(bytes) {
    let a = 1, b = 0;
    for (let i = 0; i < bytes.length; i++) { a = (a + bytes[i]) % 65521; b = (b + a) % 65521; }
    return ((b << 16) | a) >>> 0;
  }
  function u32be(arr, v) { arr.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); }
  function chunk(out, type, data) {
    u32be(out, data.length);
    const td = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
    const body = td.concat(data);
    for (let i = 0; i < body.length; i++) out.push(body[i]);
    u32be(out, crc32(body));
  }
  // Enveloppe zlib avec blocs DEFLATE non compressés (« stored »).
  function zlibStore(raw) {
    const out = [0x78, 0x01];
    let i = 0;
    while (i < raw.length) {
      const len = Math.min(65535, raw.length - i);
      out.push(i + len >= raw.length ? 1 : 0);
      out.push(len & 255, (len >> 8) & 255);
      const nlen = (~len) & 0xffff;
      out.push(nlen & 255, (nlen >> 8) & 255);
      for (let j = 0; j < len; j++) out.push(raw[i + j]);
      i += len;
    }
    u32be(out, adler32(raw));
    return out;
  }
  function base64(bytes) {
    const ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
      const h1 = i + 1 < bytes.length, h2 = i + 2 < bytes.length;
      out += ch[b0 >> 2];
      out += ch[((b0 & 3) << 4) | (h1 ? (b1 >> 4) : 0)];
      out += h1 ? ch[((b1 & 15) << 2) | (h2 ? (b2 >> 6) : 0)] : '=';
      out += h2 ? ch[b2 & 63] : '=';
    }
    return out;
  }

  /**
   * Encode le QR en octets PNG (niveaux de gris, un module = `module` pixels).
   * @param {string} text
   * @param {{module?:number, marge?:number}} [opts]
   * @returns {number[]} octets PNG
   */
  function pngBytes(text, opts) {
    opts = opts || {};
    const q = encode(text);
    const scale = opts.module || 4;
    const quiet = opts.marge != null ? opts.marge : 4;
    const dim = (q.size + quiet * 2) * scale;
    const raw = [];
    for (let y = 0; y < dim; y++) {
      raw.push(0); // filtre None
      const my = Math.floor(y / scale) - quiet;
      for (let x = 0; x < dim; x++) {
        const mx = Math.floor(x / scale) - quiet;
        const dark = (my >= 0 && my < q.size && mx >= 0 && mx < q.size) && q.modules[my][mx];
        raw.push(dark ? 0 : 255);
      }
    }
    const out = [137, 80, 78, 71, 13, 10, 26, 10];
    const ihdr = [];
    u32be(ihdr, dim); u32be(ihdr, dim);
    ihdr.push(8, 0, 0, 0, 0); // 8 bits, niveaux de gris
    chunk(out, 'IHDR', ihdr);
    chunk(out, 'IDAT', zlibStore(raw));
    chunk(out, 'IEND', []);
    return out;
  }

  /**
   * QR en data-URI PNG, prêt à insérer dans un <img src="...">.
   * @param {string} text
   * @param {{module?:number, marge?:number}} [opts]
   * @returns {string}
   */
  function pngDataUri(text, opts) {
    return 'data:image/png;base64,' + base64(pngBytes(text, opts));
  }

  return { svg: svg, encode: encode, htmlTable: htmlTable, pngBytes: pngBytes, pngDataUri: pngDataUri };
})();

// ====================================================================
// src/models/Client.gs
// ====================================================================
/**
 * @file Client.gs
 * @module models/Client
 * @description Modèle métier "Client".
 */
class Client {
  constructor(data) {
    data = data || {};
    this.idClient = data.idClient || '';
    this.nom = data.nom || '';
    this.telephone = data.telephone || '';
    this.email = data.email || '';
    this.adresse = data.adresse || '';
    this.ville = data.ville || '';
    this.pays = data.pays || '';
    this.contact = data.contact || '';
    this.numeroContribuable = data.numeroContribuable || '';
    this.statut = data.statut || CLIENT_STATUT.ACTIF;
    this.dateCreation = data.dateCreation || null;
  }

  static fromRow(row) {
    return new Client({
      idClient: row['ID_Client'],
      nom: row['Nom'],
      telephone: row['Téléphone'],
      email: row['Email'],
      adresse: row['Adresse'],
      ville: row['Ville'],
      pays: row['Pays'],
      contact: row['Contact'],
      numeroContribuable: row['Numéro_Contribuable'],
      statut: row['Statut'],
      dateCreation: row['Date_Création'],
    });
  }

  toRow() {
    return {
      'ID_Client': this.idClient,
      'Nom': this.nom,
      'Téléphone': this.telephone,
      'Email': this.email,
      'Adresse': this.adresse,
      'Ville': this.ville,
      'Pays': this.pays,
      'Contact': this.contact,
      'Numéro_Contribuable': this.numeroContribuable,
      'Statut': this.statut,
      'Date_Création': this.dateCreation,
    };
  }

  toDTO() {
    return {
      idClient: this.idClient, nom: this.nom, telephone: this.telephone,
      email: this.email, adresse: this.adresse, ville: this.ville, pays: this.pays,
      contact: this.contact, numeroContribuable: this.numeroContribuable, statut: this.statut,
      dateCreation: DateUtils.toISO(this.dateCreation),
    };
  }
}

// ====================================================================
// src/models/Facture.gs
// ====================================================================
/**
 * @file Facture.gs
 * @module models/Facture
 * @description Modèle métier "Facture". Encapsule la logique intrinsèque à
 *              l'entité (calcul TVA/TTC, détection de retard, sérialisation
 *              vers/depuis une ligne de feuille). Ne connaît NI le stockage
 *              NI l'UI : c'est un objet de domaine pur et testable.
 */
class Facture {
  constructor(data) {
    data = data || {};
    this.idFacture = data.idFacture || '';
    this.idClient = data.idClient || '';
    this.dateFacture = data.dateFacture || null;
    this.client = data.client || '';
    this.objet = data.objet || '';
    this.lignes = Facture._parseLignes(data.lignes);
    this.ventilationTVA = data.ventilationTVA || [];
    this.montantHT = Number(data.montantHT) || 0;
    this.tva = Number(data.tva) || 0;            // montant de TVA (devise)
    this.montantTTC = Number(data.montantTTC) || 0;
    this.statut = data.statut || FACTURE_STATUT.BROUILLON;
    this.dateEcheance = data.dateEcheance || null;
    this.datePaiement = data.datePaiement || null;
    this.modePaiement = data.modePaiement || '';
    this.reference = data.reference || '';
    this.observations = data.observations || '';
    // Certification FNE (DGI). Renseignés après appel à FneService.certifier().
    this.numeroFiscal = data.numeroFiscal || '';
    this.fneToken = data.fneToken || '';
    this.fneInvoiceId = data.fneInvoiceId || '';
    this.fneStatut = data.fneStatut || FNE_STATUT.NON_CERTIFIEE;
  }

  /**
   * Recalcule TVA et TTC à partir du HT et d'un taux (%).
   * Source unique de vérité pour le calcul monétaire.
   * @param {number} tauxTvaPourcent
   * @returns {Facture} this (chaînable)
   */
  calculerMontants(tauxTvaPourcent) {
    const taux = Number(tauxTvaPourcent) || 0;
    this.tva = Math.round(this.montantHT * (taux / 100) * 100) / 100;
    this.montantTTC = Math.round((this.montantHT + this.tva) * 100) / 100;
    return this;
  }

  /**
   * Recalcule les totaux à partir des lignes de la facture, avec TVA ventilée
   * par taux. Chaque ligne : quantité × prix unitaire, moins remise (%),
   * puis TVA au taux de la ligne. Source unique de vérité multi-lignes.
   * Garantit que la ventilation par taux somme exactement aux totaux.
   * @returns {Facture} this (chaînable)
   */
  calculerDepuisLignes() {
    const parTaux = {};
    (this.lignes || []).forEach(function (l) {
      const q = Number(l.quantite) || 0;
      const pu = Number(l.prixUnitaire) || 0;
      const remise = Number(l.remise) || 0;
      const taux = Number(l.tauxTva) || 0;
      const base = q * pu;
      const ligneHT = base - base * (remise / 100);
      parTaux[taux] = (parTaux[taux] || 0) + ligneHT;
    });
    const ventilation = Object.keys(parTaux).map(function (t) {
      const taux = Number(t);
      const base = Math.round(parTaux[t] * 100) / 100;
      const tva = Math.round(base * (taux / 100) * 100) / 100;
      return { taux: taux, base: base, tva: tva };
    }).sort(function (a, b) { return b.taux - a.taux; });

    this.ventilationTVA = ventilation;
    this.montantHT = Math.round(ventilation.reduce(function (s, v) { return s + v.base; }, 0) * 100) / 100;
    this.tva = Math.round(ventilation.reduce(function (s, v) { return s + v.tva; }, 0) * 100) / 100;
    this.montantTTC = Math.round((this.montantHT + this.tva) * 100) / 100;
    return this;
  }

  /**
   * Parse les lignes qu'elles arrivent en tableau (client) ou en JSON (feuille).
   * @param {Array|string} v @returns {Array} @private
   */
  static _parseLignes(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
    }
    return [];
  }

  /** @returns {boolean} true si payée. */
  estPayee() { return this.statut === FACTURE_STATUT.PAYEE; }

  /**
   * @param {Date} [now]
   * @returns {boolean} true si non payée et échéance dépassée.
   */
  estEnRetard(now) {
    if (this.estPayee() || this.statut === FACTURE_STATUT.ANNULEE) return false;
    if (!this.dateEcheance) return false;
    const ref = now || new Date();
    return new Date(this.dateEcheance) < ref;
  }

  /** Reste à encaisser pour cette facture. @returns {number} */
  resteAEncaisser() { return this.estPayee() ? 0 : this.montantTTC; }

  /**
   * Construit une Facture depuis une ligne brute de la feuille (clés = en-têtes).
   * @param {Object} row
   * @returns {Facture}
   */
  static fromRow(row) {
    return new Facture({
      idFacture: row['ID_Facture'],
      idClient: row['ID_Client'],
      dateFacture: row['Date_Facture'],
      client: row['Client'],
      objet: row['Objet'],
      lignes: row['Lignes'],
      montantHT: row['Montant_HT'],
      tva: row['TVA'],
      montantTTC: row['Montant_TTC'],
      statut: row['Statut'],
      dateEcheance: row['Date_Echeance'],
      datePaiement: row['Date_Paiement'],
      modePaiement: row['Mode_Paiement'],
      reference: row['Référence'],
      observations: row['Observations'],
      numeroFiscal: row['Numero_Fiscal'],
      fneToken: row['FNE_Token'],
      fneInvoiceId: row['FNE_Invoice_Id'],
      fneStatut: row['FNE_Statut'],
    });
  }

  /** Convertit en ligne brute (clés = en-têtes de la feuille). @returns {Object} */
  toRow() {
    return {
      'ID_Facture': this.idFacture,
      'ID_Client': this.idClient,
      'Date_Facture': this.dateFacture,
      'Client': this.client,
      'Objet': this.objet,
      'Lignes': JSON.stringify(this.lignes || []),
      'Montant_HT': this.montantHT,
      'TVA': this.tva,
      'Montant_TTC': this.montantTTC,
      'Statut': this.statut,
      'Date_Echeance': this.dateEcheance,
      'Date_Paiement': this.datePaiement,
      'Mode_Paiement': this.modePaiement,
      'Référence': this.reference,
      'Observations': this.observations,
      'Numero_Fiscal': this.numeroFiscal,
      'FNE_Token': this.fneToken,
      'FNE_Invoice_Id': this.fneInvoiceId,
      'FNE_Statut': this.fneStatut,
    };
  }

  /** Objet simple sérialisable pour le client (dates en ISO). @returns {Object} */
  toDTO() {
    return {
      idFacture: this.idFacture,
      idClient: this.idClient,
      dateFacture: DateUtils.toISO(this.dateFacture),
      client: this.client,
      objet: this.objet,
      lignes: this.lignes || [],
      ventilationTVA: this.ventilationTVA || [],
      montantHT: this.montantHT,
      tva: this.tva,
      montantTTC: this.montantTTC,
      statut: this.statut,
      dateEcheance: DateUtils.toISO(this.dateEcheance),
      datePaiement: DateUtils.toISO(this.datePaiement),
      modePaiement: this.modePaiement,
      reference: this.reference,
      observations: this.observations,
      numeroFiscal: this.numeroFiscal,
      fneToken: this.fneToken,
      fneInvoiceId: this.fneInvoiceId,
      fneStatut: this.fneStatut,
    };
  }
}

// ====================================================================
// src/models/Parametres.gs
// ====================================================================
/**
 * @file Parametres.gs
 * @module models/Parametres
 * @description Modèle des paramètres d'entreprise (ligne unique de config).
 */
class Parametres {
  constructor(data) {
    data = data || {};
    this.nomEntreprise = data.nomEntreprise || APP.NAME;
    this.adresse = data.adresse || '';
    this.telephone = data.telephone || '';
    this.email = data.email || '';
    this.siteWeb = data.siteWeb || '';
    this.numeroContribuable = data.numeroContribuable || '';
    this.tauxTVA = Number(data.tauxTVA != null ? data.tauxTVA : DEFAULTS.TAUX_TVA);
    this.devise = data.devise || DEFAULTS.DEVISE;
    this.delaiPaiement = Number(data.delaiPaiement != null ? data.delaiPaiement : DEFAULTS.DELAI_PAIEMENT);
    // Configuration FNE. fneUrl vide => mode simulation (mock intégré).
    this.fneUrl = data.fneUrl || '';
    this.fneCleApi = data.fneCleApi || '';
    this.fnePointVente = data.fnePointVente || '';
    this.fneEtablissement = data.fneEtablissement || '';
  }

  static fromRow(row) {
    return new Parametres({
      nomEntreprise: row['Nom_Entreprise'],
      adresse: row['Adresse'],
      telephone: row['Téléphone'],
      email: row['Email'],
      siteWeb: row['Site_Web'],
      numeroContribuable: row['Numéro_Contribuable'],
      tauxTVA: row['Taux_TVA'],
      devise: row['Devise'],
      delaiPaiement: row['Délai_Paiement'],
      fneUrl: row['FNE_URL'],
      fneCleApi: row['FNE_Cle_API'],
      fnePointVente: row['FNE_Point_Vente'],
      fneEtablissement: row['FNE_Etablissement'],
    });
  }

  toRow() {
    return {
      'Nom_Entreprise': this.nomEntreprise,
      'Adresse': this.adresse,
      'Téléphone': this.telephone,
      'Email': this.email,
      'Site_Web': this.siteWeb,
      'Numéro_Contribuable': this.numeroContribuable,
      'Taux_TVA': this.tauxTVA,
      'Devise': this.devise,
      'Délai_Paiement': this.delaiPaiement,
      'FNE_URL': this.fneUrl,
      'FNE_Cle_API': this.fneCleApi,
      'FNE_Point_Vente': this.fnePointVente,
      'FNE_Etablissement': this.fneEtablissement,
    };
  }

  toDTO() { return Object.assign({}, this); }
}

// ====================================================================
// src/repositories/BaseRepository.gs
// ====================================================================
/**
 * @file BaseRepository.gs
 * @module repositories/BaseRepository
 * @description Couche d'accès aux données (DAO) générique au-dessus de Google
 *              Sheets. Chaque feuille est vue comme une "table". Cette classe
 *              masque totalement l'API SpreadsheetApp aux services : ceux-ci
 *              manipulent des objets, jamais des cellules ou des index.
 *
 * Points clés :
 *  - Résolution DYNAMIQUE des colonnes via la ligne d'en-tête (robuste au
 *    réordonnancement des colonnes dans le Sheet).
 *  - Verrou (LockService) sur les écritures pour éviter la corruption en
 *    accès concurrent (plusieurs utilisateurs / triggers simultanés).
 *  - Cache mémoire de l'en-tête pour limiter les appels.
 */
class BaseRepository {
  /**
   * @param {string} sheetName  Nom de la feuille.
   * @param {string} idField    Nom de la colonne identifiant.
   * @param {string[]} schema   Colonnes attendues (pour auto-création).
   */
  constructor(sheetName, idField, schema) {
    this.sheetName = sheetName;
    this.idField = idField;
    this.schema = schema || [];
    this._headers = null;
  }

  /** @returns {GoogleAppsScript.Spreadsheet.Sheet} */
  getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(this.sheetName);
      if (this.schema.length) {
        sheet.getRange(1, 1, 1, this.schema.length).setValues([this.schema]);
        sheet.setFrozenRows(1);
      }
      Log.warn('Feuille créée automatiquement : ' + this.sheetName);
    }
    return sheet;
  }

  /** En-têtes (mis en cache). @returns {string[]} */
  getHeaders() {
    if (this._headers) return this._headers;
    const sheet = this.getSheet();
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) { this._headers = this.schema.slice(); return this._headers; }
    this._headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((h) => String(h).trim());
    return this._headers;
  }

  /** Index 0-based d'une colonne. @param {string} name @returns {number} */
  _colIndex(name) {
    const idx = this.getHeaders().indexOf(name);
    if (idx === -1) {
      throw new AppError('Colonne introuvable "' + name + '" dans ' + this.sheetName, 'SCHEMA');
    }
    return idx;
  }

  /** Transforme une ligne (array) en objet {header: valeur}. */
  _rowToObject(row) {
    const headers = this.getHeaders();
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }

  /** Transforme un objet en ligne alignée sur l'ordre des en-têtes. */
  _objectToRow(obj) {
    return this.getHeaders().map((h) => (obj[h] === undefined ? '' : obj[h]));
  }

  /**
   * Retourne toutes les lignes de données sous forme d'objets bruts.
   * @returns {Object[]}
   */
  findAllRaw() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return [];
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    return values.map((row) => this._rowToObject(row));
  }

  /**
   * Recherche brute par identifiant.
   * @param {string} id
   * @returns {{obj:Object, rowNumber:number}|null}
   */
  _findRawWithRow(id) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    const idCol = this._colIndex(this.idField);
    const ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        const rowNumber = i + 2;
        const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
        return { obj: this._rowToObject(row), rowNumber: rowNumber };
      }
    }
    return null;
  }

  /** @param {string} id @returns {Object|null} */
  findByIdRaw(id) {
    const found = this._findRawWithRow(id);
    return found ? found.obj : null;
  }

  /**
   * Insère un enregistrement. Sous verrou.
   * @param {Object} obj
   * @returns {Object} l'objet inséré
   */
  insertRaw(obj) {
    return this._withLock(() => {
      const sheet = this.getSheet();
      sheet.appendRow(this._objectToRow(obj));
      Log.debug('Insertion dans ' + this.sheetName, { id: obj[this.idField] });
      return obj;
    });
  }

  /**
   * Met à jour un enregistrement existant. Sous verrou.
   * @param {string} id
   * @param {Object} patch  Champs à mettre à jour.
   * @returns {Object} l'objet mis à jour
   */
  updateRaw(id, patch) {
    return this._withLock(() => {
      const found = this._findRawWithRow(id);
      if (!found) throw new NotFoundError('Enregistrement introuvable : ' + id, { id: id });
      const merged = Object.assign({}, found.obj, patch);
      const sheet = this.getSheet();
      sheet.getRange(found.rowNumber, 1, 1, this.getHeaders().length)
        .setValues([this._objectToRow(merged)]);
      Log.debug('MàJ dans ' + this.sheetName, { id: id });
      return merged;
    });
  }

  /**
   * Supprime un enregistrement. Sous verrou.
   * @param {string} id
   * @returns {boolean}
   */
  deleteRaw(id) {
    return this._withLock(() => {
      const found = this._findRawWithRow(id);
      if (!found) throw new NotFoundError('Enregistrement introuvable : ' + id, { id: id });
      this.getSheet().deleteRow(found.rowNumber);
      Log.debug('Suppression dans ' + this.sheetName, { id: id });
      return true;
    });
  }

  /** Nombre de lignes de données. @returns {number} */
  count() {
    const sheet = this.getSheet();
    return Math.max(0, sheet.getLastRow() - 1);
  }

  /**
   * Exécute une opération d'écriture sous verrou document.
   * @param {Function} fn
   * @private
   */
  _withLock(fn) {
    const lock = LockService.getDocumentLock();
    try {
      lock.waitLock(15000);
      return fn();
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('Verrou indisponible (accès concurrent). Réessayez.', 'LOCK', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  }
}

// ====================================================================
// src/repositories/ClientRepository.gs
// ====================================================================
/**
 * @file ClientRepository.gs
 * @module repositories/ClientRepository
 */
class ClientRepository extends BaseRepository {
  constructor() { super(SHEETS.CLIENTS, 'ID_Client', SCHEMA.CLIENTS); }

  /** @returns {Client[]} */
  findAll() { return this.findAllRaw().map(Client.fromRow); }

  /** @param {string} id @returns {Client|null} */
  findById(id) {
    const row = this.findByIdRaw(id);
    return row ? Client.fromRow(row) : null;
  }

  /** @param {string} nom @returns {Client|null} */
  findByNom(nom) {
    const row = this.findAllRaw().find((r) => r['Nom'] === nom);
    return row ? Client.fromRow(row) : null;
  }

  insert(client) { this.insertRaw(client.toRow()); return client; }
  update(id, client) { const r = this.updateRaw(id, client.toRow()); return Client.fromRow(r); }
  delete(id) { return this.deleteRaw(id); }
}

// ====================================================================
// src/repositories/FactureRepository.gs
// ====================================================================
/**
 * @file FactureRepository.gs
 * @module repositories/FactureRepository
 * @description Accès aux données des factures. Hydrate/déshydrate le modèle
 *              Facture au-dessus du BaseRepository générique.
 */
class FactureRepository extends BaseRepository {
  constructor() { super(SHEETS.FACTURES, 'ID_Facture', SCHEMA.FACTURES); }

  /** @returns {Facture[]} */
  findAll() { return this.findAllRaw().map(Facture.fromRow); }

  /** @param {string} id @returns {Facture|null} */
  findById(id) {
    const row = this.findByIdRaw(id);
    return row ? Facture.fromRow(row) : null;
  }

  /** @param {Facture} facture @returns {Facture} */
  insert(facture) { this.insertRaw(facture.toRow()); return facture; }

  /** @param {string} id @param {Facture} facture @returns {Facture} */
  update(id, facture) { const r = this.updateRaw(id, facture.toRow()); return Facture.fromRow(r); }

  /** @param {string} id @returns {boolean} */
  delete(id) { return this.deleteRaw(id); }

  /** Factures d'un client donné. @param {string} clientNom @returns {Facture[]} */
  findByClient(clientNom) {
    return this.findAll().filter((f) => f.client === clientNom);
  }
}

// ====================================================================
// src/repositories/ParametresRepository.gs
// ====================================================================
/**
 * @file ParametresRepository.gs
 * @module repositories/ParametresRepository
 * @description Les paramètres tiennent sur une seule ligne de données (ligne 2).
 *              Lecture/écriture simplifiées, avec valeurs par défaut robustes.
 */
class ParametresRepository extends BaseRepository {
  constructor() { super(SHEETS.PARAMETRES, 'Nom_Entreprise', SCHEMA.PARAMETRES); }

  /** @returns {Parametres} */
  get() {
    const rows = this.findAllRaw();
    return rows.length ? Parametres.fromRow(rows[0]) : new Parametres({});
  }

  /**
   * Enregistre les paramètres (upsert sur la ligne 2).
   * @param {Parametres} params
   * @returns {Parametres}
   */
  save(params) {
    return this._withLock(() => {
      const sheet = this.getSheet();
      const row = this._objectToRow(params.toRow());
      if (sheet.getLastRow() < 2) {
        sheet.appendRow(row);
      } else {
        sheet.getRange(2, 1, 1, this.getHeaders().length).setValues([row]);
      }
      Log.info('Paramètres enregistrés.');
      return params;
    });
  }
}

// ====================================================================
// src/services/NumerotationService.gs
// ====================================================================
/**
 * @file NumerotationService.gs
 * @module services/NumerotationService
 * @description Génération de numéros séquentiels et atomiques (factures,
 *              clients). Utilise PropertiesService + LockService pour garantir
 *              l'unicité même en accès concurrent. Format facture :
 *              FAC-{ANNÉE}-{SEQ sur 4 chiffres}, ex: FAC-2026-0007.
 */
const NumerotationService = Object.freeze({
  /**
   * Prochain numéro de facture pour l'année courante (atomique).
   * @returns {string}
   */
  prochainNumeroFacture() {
    const annee = DateUtils.currentYear();
    const key = PROP_KEYS.FACTURE_SEQUENCE_PREFIX + annee;
    const seq = this._incrementer(key);
    return 'FAC-' + annee + '-' + this._pad(seq, 4);
  },

  /** @returns {string} ex: CLI-0005 */
  prochainNumeroClient() {
    const seq = this._incrementer(PROP_KEYS.CLIENT_SEQUENCE);
    return 'CLI-' + this._pad(seq, 4);
  },

  /**
   * Incrément atomique d'un compteur persistant.
   * @param {string} key
   * @returns {number}
   * @private
   */
  _incrementer(key) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const props = PropertiesService.getDocumentProperties();
      const courant = parseInt(props.getProperty(key) || '0', 10);
      const suivant = courant + 1;
      props.setProperty(key, String(suivant));
      return suivant;
    } catch (e) {
      throw new AppError('Impossible de générer le numéro (verrou).', 'NUMEROTATION', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  },

  /** @param {number} n @param {number} taille @returns {string} */
  _pad(n, taille) {
    let s = String(n);
    while (s.length < taille) s = '0' + s;
    return s;
  },
});

// ====================================================================
// src/services/ParametresService.gs
// ====================================================================
/**
 * @file ParametresService.gs
 * @module services/ParametresService
 * @description Accès et mise à jour des paramètres d'entreprise.
 */
class ParametresService {
  constructor() { this.repo = new ParametresRepository(); }

  /** @returns {Parametres} */
  obtenir() { return this.repo.get(); }

  /** @param {Object} data @returns {Parametres} */
  enregistrer(data) {
    const p = new Parametres(data);
    Validator.required(p.nomEntreprise, 'Nom_Entreprise');
    Validator.email(p.email, 'Email');
    Validator.positive(p.tauxTVA, 'Taux_TVA');
    Validator.positive(p.delaiPaiement, 'Délai_Paiement');
    return this.repo.save(p);
  }
}

// ====================================================================
// src/services/ClientService.gs
// ====================================================================
/**
 * @file ClientService.gs
 * @module services/ClientService
 * @description Logique métier des clients : validation, création, mise à jour,
 *              suppression, recherche. Orchestration entre repository et modèle.
 */
class ClientService {
  constructor() { this.repo = new ClientRepository(); }

  /** @returns {Client[]} */
  lister() { return this.repo.findAll(); }

  /** @param {string} id @returns {Client} */
  obtenir(id) {
    const c = this.repo.findById(id);
    if (!c) throw new NotFoundError('Client introuvable : ' + id, { id: id });
    return c;
  }

  /**
   * @param {Object} data  Données saisies.
   * @returns {Client}
   */
  creer(data) {
    const client = new Client(data);
    this._valider(client);
    if (this.repo.findByNom(client.nom)) {
      throw new ConflictError('Un client nommé "' + client.nom + '" existe déjà.');
    }
    client.idClient = NumerotationService.prochainNumeroClient();
    client.dateCreation = new Date();
    client.statut = client.statut || CLIENT_STATUT.ACTIF;
    return this.repo.insert(client);
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @returns {Client}
   */
  modifier(id, data) {
    const existant = this.obtenir(id);
    const maj = new Client(Object.assign({}, existant, data, { idClient: id, dateCreation: existant.dateCreation }));
    this._valider(maj);
    return this.repo.update(id, maj);
  }

  /** @param {string} id @returns {boolean} */
  supprimer(id) {
    this.obtenir(id); // garantit l'existence (404 sinon)
    return this.repo.delete(id);
  }

  /**
   * Recherche plein texte simple (nom, ville, email, contact).
   * @param {string} terme
   * @returns {Client[]}
   */
  rechercher(terme) {
    const t = String(terme || '').toLowerCase().trim();
    if (!t) return this.lister();
    return this.repo.findAll().filter((c) =>
      [c.nom, c.ville, c.email, c.contact, c.idClient]
        .some((v) => String(v || '').toLowerCase().includes(t)));
  }

  /** @param {Client} c @private */
  _valider(c) {
    Validator.required(c.nom, 'Nom');
    Validator.email(c.email, 'Email');
    Validator.oneOf(c.statut, Object.values(CLIENT_STATUT), 'Statut');
  }
}

// ====================================================================
// src/services/FactureService.gs
// ====================================================================
/**
 * @file FactureService.gs
 * @module services/FactureService
 * @description Cœur métier de la facturation : création (avec numérotation et
 *              calculs automatiques), modification, suppression, recherche,
 *              encaissement, et recalcul des statuts (retard). Toute règle de
 *              gestion vit ici — les contrôleurs restent minces.
 */
class FactureService {
  constructor() {
    this.repo = new FactureRepository();
    this.parametresService = new ParametresService();
  }

  /** @returns {Facture[]} */
  lister() { return this.repo.findAll(); }

  /** @param {string} id @returns {Facture} */
  obtenir(id) {
    const f = this.repo.findById(id);
    if (!f) throw new NotFoundError('Facture introuvable : ' + id, { id: id });
    return f;
  }

  /**
   * Crée une facture : numéro auto, TVA/TTC auto, échéance auto.
   * @param {Object} data
   * @returns {Facture}
   */
  creer(data) {
    const params = this.parametresService.obtenir();
    const facture = new Facture(data);

    this._appliquerCalcul(facture, data, params);
    this._validerBase(facture);

    facture.idFacture = NumerotationService.prochainNumeroFacture();
    facture.dateFacture = DateUtils.parse(facture.dateFacture) || new Date();

    // Échéance : fournie sinon date facture + délai paramétré.
    facture.dateEcheance = DateUtils.parse(facture.dateEcheance)
      || DateUtils.addDays(facture.dateFacture, params.delaiPaiement);

    facture.statut = facture.statut || FACTURE_STATUT.EN_ATTENTE;
    this._validerStatut(facture);

    Log.info('Création facture', { id: facture.idFacture, client: facture.client });
    return this.repo.insert(facture);
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @returns {Facture}
   */
  modifier(id, data) {
    const existant = this.obtenir(id);
    const params = this.parametresService.obtenir();

    // Fusion : on conserve l'ID et la date de facture d'origine par défaut.
    const fusion = new Facture(Object.assign({}, existant, data, { idFacture: id }));
    this._appliquerCalcul(fusion, data, params);
    this._validerBase(fusion);
    this._validerStatut(fusion);

    return this.repo.update(id, fusion);
  }

  /** @param {string} id @returns {boolean} */
  supprimer(id) {
    this.obtenir(id);
    Log.info('Suppression facture', { id: id });
    return this.repo.delete(id);
  }

  /**
   * Marque une facture comme payée.
   * @param {string} id
   * @param {Object} [options] {datePaiement, modePaiement}
   * @returns {Facture}
   */
  encaisser(id, options) {
    options = options || {};
    const f = this.obtenir(id);
    f.statut = FACTURE_STATUT.PAYEE;
    f.datePaiement = DateUtils.parse(options.datePaiement) || new Date();
    if (options.modePaiement) {
      Validator.oneOf(options.modePaiement, Object.values(MODE_PAIEMENT), 'Mode_Paiement');
      f.modePaiement = options.modePaiement;
    }
    return this.repo.update(id, f);
  }

  /**
   * Recherche multi-critères (id, client, objet, statut, référence).
   * @param {string} terme
   * @returns {Facture[]}
   */
  rechercher(terme) {
    const t = String(terme || '').toLowerCase().trim();
    if (!t) return this.lister();
    return this.repo.findAll().filter((f) =>
      [f.idFacture, f.client, f.objet, f.statut, f.reference]
        .some((v) => String(v || '').toLowerCase().includes(t)));
  }

  /**
   * Recalcule les statuts "En retard" pour toutes les factures échues non payées.
   * Idempotent : conçu pour être appelé par un trigger quotidien.
   * @returns {number} nombre de factures repassées en retard
   */
  actualiserRetards() {
    const now = new Date();
    let compteur = 0;
    this.repo.findAll().forEach((f) => {
      if (f.estEnRetard(now) && f.statut !== FACTURE_STATUT.EN_RETARD) {
        f.statut = FACTURE_STATUT.EN_RETARD;
        this.repo.update(f.idFacture, f);
        compteur++;
      }
    });
    Log.info('Actualisation des retards', { misAJour: compteur });
    return compteur;
  }

  /**
   * Applique le calcul des montants : depuis les lignes si présentes,
   * sinon repli sur l'ancien mode (montant HT + taux global) pour compatibilité.
   * @param {Facture} facture @param {Object} data @param {Parametres} params @private
   */
  _appliquerCalcul(facture, data, params) {
    if (Array.isArray(facture.lignes) && facture.lignes.length) {
      // Complète le taux TVA manquant de chaque ligne avec le taux paramétré.
      facture.lignes.forEach(function (l) {
        if (l.tauxTva == null || l.tauxTva === '') l.tauxTva = params.tauxTVA;
      });
      facture.calculerDepuisLignes();
    } else {
      const taux = data.tauxTVA != null ? Number(data.tauxTVA) : params.tauxTVA;
      facture.calculerMontants(taux);
    }
  }

  /** @param {Facture} f @private */
  _validerBase(f) {
    Validator.required(f.client, 'Client');
    Validator.required(f.objet, 'Objet');
    if (Array.isArray(f.lignes) && f.lignes.length) {
      const valides = f.lignes.filter(function (l) {
        return String(l.designation || '').trim() && (Number(l.quantite) * Number(l.prixUnitaire)) > 0;
      });
      if (!valides.length) {
        throw new ValidationError('Ajoutez au moins une ligne avec une désignation et un montant positif.',
          { champ: 'Lignes' });
      }
    }
    Validator.positive(f.montantHT, 'Montant_HT');
  }

  /** @param {Facture} f @private */
  _validerStatut(f) {
    Validator.oneOf(f.statut, Object.values(FACTURE_STATUT), 'Statut');
    if (f.modePaiement) Validator.oneOf(f.modePaiement, Object.values(MODE_PAIEMENT), 'Mode_Paiement');
  }
}

// ====================================================================
// src/services/DashboardService.gs
// ====================================================================
/**
 * @file DashboardService.gs
 * @module services/DashboardService
 * @description Calcule les indicateurs (KPI) à partir des factures et les écrit
 *              dans la feuille Tableau_de_bord. Fournit aussi les données pour
 *              les graphiques. Aucune écriture "en dur" : tout est recalculé.
 */
class DashboardService {
  constructor() {
    this.factureRepo = new FactureRepository();
    this.parametresService = new ParametresService();
  }

  /**
   * Calcule tous les KPI.
   * @returns {Object} indicateurs
   */
  calculerKPIs() {
    const factures = this.factureRepo.findAll();
    const now = new Date();
    const devise = this.parametresService.obtenir().devise;

    const kpi = {
      totalFactures: factures.length,
      facturesPayees: 0,
      facturesEnAttente: 0,
      facturesEnRetard: 0,
      montantHT: 0,
      montantTTC: 0,
      totalEncaisse: 0,
      resteAEncaisser: 0,
      devise: devise,
    };

    factures.forEach((f) => {
      if (f.statut === FACTURE_STATUT.ANNULEE) return;
      kpi.montantHT += f.montantHT;
      kpi.montantTTC += f.montantTTC;

      if (f.estPayee()) {
        kpi.facturesPayees++;
        kpi.totalEncaisse += f.montantTTC;
      } else {
        kpi.resteAEncaisser += f.montantTTC;
        if (f.estEnRetard(now) || f.statut === FACTURE_STATUT.EN_RETARD) {
          kpi.facturesEnRetard++;
        } else {
          kpi.facturesEnAttente++;
        }
      }
    });

    // Arrondis monétaires.
    ['montantHT', 'montantTTC', 'totalEncaisse', 'resteAEncaisser'].forEach((k) => {
      kpi[k] = Math.round(kpi[k] * 100) / 100;
    });
    return kpi;
  }

  /**
   * Recalcule les KPI et les écrit dans la feuille Tableau_de_bord.
   * @returns {Object} KPI calculés
   */
  rafraichir() {
    const kpi = this.calculerKPIs();
    const sheet = this._getDashboardSheet();
    const d = kpi.devise;

    const lignes = [
      ['Indicateur', 'Valeur'],
      ['Nombre total de factures', kpi.totalFactures],
      ['Factures payées', kpi.facturesPayees],
      ['Factures en attente', kpi.facturesEnAttente],
      ['Factures en retard', kpi.facturesEnRetard],
      ['Montant HT', Formatter.money(kpi.montantHT, d)],
      ['Montant TTC', Formatter.money(kpi.montantTTC, d)],
      ['Total encaissé', Formatter.money(kpi.totalEncaisse, d)],
      ['Reste à encaisser', Formatter.money(kpi.resteAEncaisser, d)],
      ['Dernière mise à jour', Utilities.formatDate(new Date(), APP.TIMEZONE, 'dd/MM/yyyy HH:mm')],
    ];

    sheet.clearContents();
    sheet.getRange(1, 1, lignes.length, 2).setValues(lignes);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    sheet.autoResizeColumns(1, 2);

    Log.info('Tableau de bord rafraîchi', kpi);
    return kpi;
  }

  /**
   * Données pour graphique "répartition par statut" (utilisable côté UI).
   * @returns {Array<{statut:string,nombre:number}>}
   */
  repartitionParStatut() {
    const map = {};
    this.factureRepo.findAll().forEach((f) => { map[f.statut] = (map[f.statut] || 0) + 1; });
    return Object.keys(map).map((s) => ({ statut: s, nombre: map[s] }));
  }

  /** @returns {GoogleAppsScript.Spreadsheet.Sheet} @private */
  _getDashboardSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(SHEETS.DASHBOARD) || ss.insertSheet(SHEETS.DASHBOARD);
  }
}

// ====================================================================
// src/services/DriveService.gs
// ====================================================================
/**
 * @file DriveService.gs
 * @module services/DriveService
 * @description Gestion du dossier Drive de l'application et sauvegarde des PDF.
 *              Le dossier racine est mémorisé dans PropertiesService pour éviter
 *              de le recréer et pour survivre aux renommages.
 */
const DriveService = Object.freeze({
  /**
   * Retourne (ou crée) le dossier racine de l'application.
   * @returns {GoogleAppsScript.Drive.Folder}
   */
  getDossierRacine() {
    const props = PropertiesService.getDocumentProperties();
    const id = props.getProperty(PROP_KEYS.DRIVE_FOLDER_ID);
    if (id) {
      try { return DriveApp.getFolderById(id); } catch (e) { /* recréé ci-dessous */ }
    }
    const dossier = DriveApp.createFolder(DEFAULTS.DRIVE_FOLDER_NAME);
    props.setProperty(PROP_KEYS.DRIVE_FOLDER_ID, dossier.getId());
    Log.info('Dossier Drive créé', { id: dossier.getId() });
    return dossier;
  },

  /**
   * Sous-dossier par année (organisation : /Racine/2026/).
   * @param {number|string} annee
   * @returns {GoogleAppsScript.Drive.Folder}
   */
  getDossierAnnee(annee) {
    const racine = this.getDossierRacine();
    const nom = String(annee);
    const it = racine.getFoldersByName(nom);
    return it.hasNext() ? it.next() : racine.createFolder(nom);
  },

  /**
   * Sauvegarde un blob PDF dans le dossier de l'année.
   * @param {GoogleAppsScript.Base.Blob} pdfBlob
   * @param {number|string} annee
   * @returns {GoogleAppsScript.Drive.File}
   */
  sauvegarderPdf(pdfBlob, annee) {
    const dossier = this.getDossierAnnee(annee);
    const fichier = dossier.createFile(pdfBlob);
    Log.info('PDF sauvegardé', { nom: fichier.getName(), url: fichier.getUrl() });
    return fichier;
  },
});

// ====================================================================
// src/services/EmailService.gs
// ====================================================================
/**
 * @file EmailService.gs
 * @module services/EmailService
 * @description Envoi des factures par email avec le PDF en pièce jointe.
 *              S'appuie sur PdfService (génération) et ne fait QUE l'envoi
 *              (responsabilité unique). Vérifie le quota Gmail restant.
 */
class EmailService {
  constructor() {
    this.pdfService = new PdfService();
    this.factureService = new FactureService();
    this.clientService = new ClientService();
    this.parametresService = new ParametresService();
  }

  /**
   * Envoie une facture par email au client.
   * @param {string} idFacture
   * @param {Object} [options] {destinataire, sujet, message, marquerEnvoyee}
   * @returns {{destinataire:string, fichierUrl:string}}
   */
  envoyerFacture(idFacture, options) {
    options = options || {};
    const facture = this.factureService.obtenir(idFacture);
    const params = this.parametresService.obtenir();
    const client = this.clientService.rechercher(facture.client)[0] || null;

    const destinataire = options.destinataire || (client && client.email);
    Validator.required(destinataire, 'Destinataire');
    Validator.email(destinataire, 'Destinataire');

    if (MailApp.getRemainingDailyQuota() < 1) {
      throw new AppError('Quota d\'envoi d\'emails épuisé pour aujourd\'hui.', 'QUOTA');
    }

    const { blob, fichier } = this.pdfService.genererEtArchiver(idFacture);
    const sujet = options.sujet
      || 'Facture ' + facture.idFacture + ' — ' + params.nomEntreprise;
    const corps = options.message || this._corpsParDefaut(facture, client, params);

    MailApp.sendEmail({
      to: destinataire,
      subject: sujet,
      htmlBody: corps,
      attachments: [blob],
      name: params.nomEntreprise,
      replyTo: params.email || undefined,
    });

    if (options.marquerEnvoyee !== false && facture.statut === FACTURE_STATUT.BROUILLON) {
      this.factureService.modifier(idFacture, { statut: FACTURE_STATUT.ENVOYEE });
    }

    Log.info('Facture envoyée par email', { id: idFacture, to: destinataire });
    return { destinataire: destinataire, fichierUrl: fichier.getUrl() };
  }

  /** @private */
  _corpsParDefaut(facture, client, params) {
    const nomClient = (client && client.nom) || facture.client;
    return [
      '<p>Bonjour ' + escapeHtml(nomClient) + ',</p>',
      '<p>Veuillez trouver ci-joint la facture <strong>' + escapeHtml(facture.idFacture) + '</strong> ',
      'd\'un montant de <strong>' + Formatter.money(facture.montantTTC, params.devise) + '</strong> TTC.</p>',
      '<p>Échéance de paiement : ' + DateUtils.toDisplay(facture.dateEcheance) + '.</p>',
      '<p>Cordialement,<br>' + escapeHtml(params.nomEntreprise) + '<br>',
      escapeHtml(params.telephone || '') + '</p>',
    ].join('');
  }
}

// ====================================================================
// src/services/PdfService.gs
// ====================================================================
/**
 * @file PdfService.gs
 * @module services/PdfService
 * @description Génération du PDF d'une facture. Construit un HTML mis en forme
 *              (template inline pour rester autonome), le convertit en PDF puis
 *              l'archive sur Drive. Séparé de l'envoi email (responsabilité unique).
 */
class PdfService {
  constructor() {
    this.factureService = new FactureService();
    this.clientService = new ClientService();
    this.parametresService = new ParametresService();
  }

  /**
   * Génère le PDF d'une facture et l'archive sur Drive.
   * @param {string} idFacture
   * @returns {{blob: GoogleAppsScript.Base.Blob, fichier: GoogleAppsScript.Drive.File}}
   */
  genererEtArchiver(idFacture) {
    const blob = this.genererBlob(idFacture);
    const annee = DateUtils.parse(this.factureService.obtenir(idFacture).dateFacture).getFullYear();
    const fichier = DriveService.sauvegarderPdf(blob, annee);
    return { blob: blob, fichier: fichier };
  }

  /**
   * Construit uniquement le blob PDF (sans archivage).
   * @param {string} idFacture
   * @returns {GoogleAppsScript.Base.Blob}
   */
  genererBlob(idFacture) {
    const facture = this.factureService.obtenir(idFacture);
    const params = this.parametresService.obtenir();
    const client = this.clientService.rechercher(facture.client)[0] || null;

    // Recalcule la ventilation TVA (non stockée) pour l'affichage détaillé.
    if (Array.isArray(facture.lignes) && facture.lignes.length) facture.calculerDepuisLignes();

    const html = this._construireHtml(facture, client, params);
    const nom = facture.idFacture + '.pdf';
    const blob = Utilities.newBlob(html, MimeType.HTML, nom).getAs(MimeType.PDF).setName(nom);
    Log.info('PDF généré', { id: idFacture });
    return blob;
  }

  /**
   * Construit le bandeau de certification FNE (pied de facture, pleine largeur).
   * N'apparaît que si la facture est certifiée. En mode simulation, un marquage
   * explicite « NON OPPOSABLE » et un visuel neutre (jamais l'emblème officiel
   * de la DGI) signalent que le document n'a pas de valeur légale.
   * @param {Facture} facture
   * @param {Parametres} params
   * @returns {string} HTML du bandeau (vide si non certifiée)
   * @private
   */
  _bandeauFne(facture, params) {
    if (facture.fneStatut !== FNE_STATUT.CERTIFIEE || !facture.numeroFiscal) return '';

    const token = String(facture.fneToken || '');
    // Le token porte la trace du mode : une URL de simulation => non opposable.
    const simulation = token
      ? token.indexOf('simulation.fne.local') !== -1
      : !String(params.fneUrl || '').trim();

    const qr = token
      ? '<img src="' + QrCode.pngDataUri(token, { module: 4, marge: 2 }) + '" width="120" height="120" alt="QR de vérification FNE">'
      : '';
    const classeSim = simulation ? ' sim' : '';
    const banniere = simulation
      ? '<div class="fne-sim">SIMULATION FNE — DOCUMENT NON OPPOSABLE</div>'
      : '';

    return '<div class="fne-band' + classeSim + '">'
      + banniere
      + '<table class="fne-inner"><tr>'
      + '<td class="fne-badge-cell"><div class="fne-badge">FNE</div></td>'
      + '<td class="fne-info">'
      + '<div class="fne-title">Facture Normalis\u00e9e \u00c9lectronique</div>'
      + '<div class="fne-num">N\u00b0 <strong>' + escapeHtml(facture.numeroFiscal) + '</strong></div>'
      + (token ? '<div class="fne-verif">V\u00e9rification : ' + escapeHtml(token) + '</div>' : '')
      + (simulation ? '<div class="fne-note">Certification simul\u00e9e \u2014 sans valeur l\u00e9gale (d\u00e9monstration).</div>' : '')
      + '</td>'
      + (qr ? '<td class="fne-qr">' + qr + '</td>' : '')
      + '</tr></table></div>';
  }

  /**
   * Template HTML de la facture.
   * @private
   */
  _construireHtml(facture, client, params) {
    const d = params.devise;
    const clientBloc = client
      ? [client.nom, client.adresse, [client.ville, client.pays].filter(Boolean).join(', '),
         client.telephone, client.email,
         client.numeroContribuable ? 'NCC : ' + client.numeroContribuable : '']
        .filter(Boolean).map(escapeHtml).join('<br>')
      : escapeHtml(facture.client);

    const aLignes = Array.isArray(facture.lignes) && facture.lignes.length;
    const objetHtml = aLignes
      ? '<div class="section"><strong>Objet :</strong> ' + escapeHtml(facture.objet) + '</div>'
      : '';
    const lignesHtml = aLignes
      ? '<table><thead><tr>'
        + '<th>Désignation</th>'
        + '<th style="text-align:right;">Qté</th><th>Unité</th>'
        + '<th style="text-align:right;">P.U. HT</th>'
        + '<th style="text-align:right;">Remise</th>'
        + '<th style="text-align:right;">TVA</th>'
        + '<th style="text-align:right;">Montant HT</th></tr></thead><tbody>'
        + facture.lignes.map(function (l) {
            const q = Number(l.quantite) || 0;
            const pu = Number(l.prixUnitaire) || 0;
            const remise = Number(l.remise) || 0;
            const base = q * pu;
            const ht = base - base * (remise / 100);
            return '<tr><td>' + escapeHtml(l.designation) + '</td>'
              + '<td style="text-align:right;">' + escapeHtml(q) + '</td>'
              + '<td>' + escapeHtml(l.unite || '') + '</td>'
              + '<td style="text-align:right;">' + Formatter.money(pu, d) + '</td>'
              + '<td style="text-align:right;">' + (remise ? remise + ' %' : '—') + '</td>'
              + '<td style="text-align:right;">' + (Number(l.tauxTva) || 0) + ' %</td>'
              + '<td style="text-align:right;">' + Formatter.money(ht, d) + '</td></tr>';
          }).join('')
        + '</tbody></table>'
      : '<table><thead><tr><th>Désignation</th><th style="text-align:right;">Montant HT</th></tr></thead>'
        + '<tbody><tr><td>' + escapeHtml(facture.objet)
        + (facture.reference ? '<br><small>Réf : ' + escapeHtml(facture.reference) + '</small>' : '')
        + '</td><td style="text-align:right;">' + Formatter.money(facture.montantHT, d) + '</td></tr></tbody></table>';

    const ventiRows = (aLignes && facture.ventilationTVA && facture.ventilationTVA.length)
      ? facture.ventilationTVA.map(function (v) {
          return '<tr><td>TVA ' + v.taux + ' %</td><td style="text-align:right;">' + Formatter.money(v.tva, d) + '</td></tr>';
        }).join('')
      : '<tr><td>TVA</td><td style="text-align:right;">' + Formatter.money(facture.tva, d) + '</td></tr>';

    const totauxHtml = '<table class="totaux">'
      + '<tr><td>Total HT</td><td style="text-align:right;">' + Formatter.money(facture.montantHT, d) + '</td></tr>'
      + ventiRows
      + '<tr class="ttc"><td>Total TTC</td><td style="text-align:right;">' + Formatter.money(facture.montantTTC, d) + '</td></tr>'
      + '</table>';

    return [
      '<html><head><meta charset="utf-8"><style>',
      'body{font-family:Arial,Helvetica,sans-serif;color:#1f2933;font-size:12px;margin:40px;}',
      '.entete{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:12px;}',
      '.entreprise{font-size:18px;font-weight:bold;color:#2563eb;}',
      '.titre{font-size:26px;font-weight:bold;color:#111827;text-align:right;}',
      '.meta{margin-top:6px;color:#6b7280;text-align:right;}',
      '.section{margin-top:24px;}',
      '.boite{background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:6px;}',
      'table{width:100%;border-collapse:collapse;margin-top:20px;}',
      'th{background:#2563eb;color:#fff;text-align:left;padding:8px;font-size:12px;}',
      'td{padding:8px;border-bottom:1px solid #e5e7eb;}',
      '.totaux{margin-top:16px;width:40%;float:right;}',
      '.totaux td{border:none;padding:4px 8px;}',
      '.ttc{font-size:15px;font-weight:bold;color:#2563eb;border-top:2px solid #2563eb;}',
      '.pied{margin-top:40px;text-align:center;color:#9ca3af;font-size:10px;clear:both;}',
      '.fne-band{clear:both;margin-top:32px;border:2px solid #16a34a;border-radius:6px;padding:10px 14px;background:#f0fdf4;}',
      '.fne-band.sim{border-color:#b91c1c;background:#fef2f2;}',
      '.fne-sim{background:#b91c1c;color:#fff;font-weight:bold;text-align:center;padding:5px;border-radius:4px;margin-bottom:8px;font-size:11px;letter-spacing:1px;}',
      '.fne-inner{width:100%;border-collapse:collapse;}',
      '.fne-inner td{border:none;padding:0;vertical-align:middle;}',
      '.fne-badge-cell{width:64px;}',
      '.fne-badge{border:2px solid #16a34a;color:#16a34a;font-weight:bold;font-size:16px;padding:8px 10px;border-radius:6px;text-align:center;letter-spacing:1px;}',
      '.fne-band.sim .fne-badge{border-color:#b91c1c;color:#b91c1c;}',
      '.fne-info{padding-left:14px !important;}',
      '.fne-title{font-weight:bold;color:#166534;font-size:13px;}',
      '.fne-band.sim .fne-title{color:#991b1b;}',
      '.fne-num{font-size:15px;margin-top:3px;}',
      '.fne-verif{color:#6b7280;font-size:9px;margin-top:5px;word-break:break-all;}',
      '.fne-note{color:#b91c1c;font-size:9px;margin-top:3px;font-style:italic;}',
      '.fne-qr{width:130px;text-align:right;}',
      '</style></head><body>',

      '<div class="entete"><div>',
      '<div class="entreprise">', escapeHtml(params.nomEntreprise), '</div>',
      escapeHtml(params.adresse), '<br>',
      escapeHtml(params.telephone), ' &middot; ', escapeHtml(params.email), '<br>',
      params.numeroContribuable ? 'N° Contribuable : ' + escapeHtml(params.numeroContribuable) : '',
      '</div><div><div class="titre">FACTURE</div>',
      '<div class="meta">N° ', escapeHtml(facture.idFacture), '<br>',
      'Date : ', DateUtils.toDisplay(facture.dateFacture), '<br>',
      'Échéance : ', DateUtils.toDisplay(facture.dateEcheance), '</div></div></div>',

      '<div class="section"><strong>Facturé à :</strong><div class="boite">', clientBloc, '</div></div>',

      objetHtml,
      lignesHtml,
      totauxHtml,

      this._bandeauFne(facture, params),

      '<div class="pied">Statut : ', escapeHtml(facture.statut),
      facture.observations ? ' &middot; ' + escapeHtml(facture.observations) : '',
      '<br>', escapeHtml(params.nomEntreprise), ' — ', escapeHtml(params.siteWeb || ''), '</div>',

      '</body></html>',
    ].join('');
  }
}

/**
 * Échappe le HTML pour éviter l'injection dans le template.
 * @param {*} str @returns {string}
 */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ====================================================================
// src/services/FneService.gs
// ====================================================================
/**
 * @file FneService.gs
 * @module services/FneService
 * @description Intégration à la Facture Normalisée Électronique (FNE) de la DGI
 *              de Côte d'Ivoire — procédure d'interfaçage par API.
 *
 *              « SAVEUR A » : un seul point de bascule, l'URL configurée dans
 *              les Paramètres.
 *                • FNE_URL vide   -> mode SIMULATION : un mock intégré reproduit
 *                                    fidèlement le contrat de l'API DGI (mêmes
 *                                    champs, même format de réponse, mêmes
 *                                    codes d'erreur). Aucun appel réseau.
 *                • FNE_URL fournie -> mode RÉEL : appel HTTP (UrlFetchApp) vers
 *                                    le mock déployé OU la vraie plateforme DGI,
 *                                    sans changer une ligne de code.
 *
 *              ⚠️ AVERTISSEMENT : en mode simulation, les factures ne sont PAS
 *              certifiées par la DGI et ne sont PAS légalement opposables.
 *              C'est une démonstration technique.
 *
 *              Contrat de référence : « Procédure d'interfaçage des entreprises
 *              par API » (DGI, mai 2025).
 *              Endpoint : POST $url/external/invoices/sign
 *              Auth     : en-tête « Authorization: Bearer <clé> »
 *              Réponse  : { ncc, reference, token, warning, balance_sticker, invoice }
 */

/** Erreur remontée par la plateforme FNE (réelle ou simulée). */
class FneError extends AppError {
  /**
   * @param {string} message    Message renvoyé par la plateforme.
   * @param {string} erreur     Libellé machine DGI (ex: 'bad_request').
   * @param {number} statusCode Code HTTP (400, 401, 500...).
   */
  constructor(message, erreur, statusCode) {
    super(message, 'FNE_' + String(statusCode || 'ERROR'),
      { fneError: erreur || 'error', statusCode: statusCode || 500 });
  }
}

class FneService {
  constructor() {
    this.factureRepo = new FactureRepository();
    this.factureService = new FactureService();
    this.clientService = new ClientService();
    this.parametresService = new ParametresService();
  }

  /**
   * Certifie une facture auprès de la FNE (simulation ou réel selon l'URL).
   * Acte idempotent : une facture déjà certifiée n'est jamais re-soumise
   * (on ne « brûle » pas un sticker deux fois).
   * @param {string} idFacture
   * @returns {Object} résultat de certification (mode, numéro fiscal, token...)
   */
  certifier(idFacture) {
    const facture = this.factureService.obtenir(idFacture);

    if (facture.fneStatut === FNE_STATUT.CERTIFIEE && facture.numeroFiscal) {
      throw new ConflictError('Cette facture est déjà certifiée (' + facture.numeroFiscal + ').',
        { id: idFacture, numeroFiscal: facture.numeroFiscal });
    }

    const params = this.parametresService.obtenir();
    const client = this.clientService.rechercher(facture.client)[0] || null;

    // Pré-validation en français AVANT tout envoi : traduit les exigences DGI
    // en messages clairs, plutôt que de laisser remonter le message brut anglais.
    this._prevaliderFr(facture, client, params);

    const payload = this._construirePayload(facture, client, params);

    let resultat;
    try {
      resultat = this._envoyer(payload, params);
    } catch (e) {
      // Trace l'échec sur la facture sans écraser un éventuel numéro fiscal.
      facture.fneStatut = FNE_STATUT.ERREUR;
      this.factureRepo.update(idFacture, facture);
      Log.error('Échec certification FNE', { id: idFacture, erreur: e.message });
      throw e;
    }

    facture.numeroFiscal = resultat.reference;
    facture.fneToken = resultat.token;
    facture.fneInvoiceId = resultat.invoiceId;
    facture.fneStatut = FNE_STATUT.CERTIFIEE;
    this.factureRepo.update(idFacture, facture);

    Log.info('Facture certifiée FNE', {
      id: idFacture, numeroFiscal: resultat.reference, mode: resultat.mode,
    });
    return Object.assign({ idFacture: idFacture }, resultat);
  }

  /**
   * Pré-validation en français des exigences de certification DGI.
   * Regroupe tous les manques en un seul message lisible, pour éviter à
   * l'utilisateur de découvrir les contraintes une par une (et en anglais).
   * @param {Facture} facture
   * @param {Client|null} client
   * @param {Parametres} params
   * @private
   */
  _prevaliderFr(facture, client, params) {
    const manques = [];

    if (!client) {
      manques.push('la facture doit être reliée à une fiche client (champ Client introuvable)');
    } else {
      if (!String(client.telephone || '').trim()) manques.push('un téléphone client');
      if (!String(client.email || '').trim()) manques.push('un email client');
      if (!String(client.nom || '').trim() && !String(facture.client || '').trim()) {
        manques.push('un nom de client');
      }
      // Note : un client sans NCC relève du modèle B2C (particulier), autorisé.
      // Le NCC n'est obligatoire que pour le B2B, où il est présent par construction.
    }

    if (!String(params.fnePointVente || params.nomEntreprise || '').trim()) {
      manques.push('un point de vente (Paramètres FNE ou nom d\u2019entreprise)');
    }
    if (!String(params.fneEtablissement || params.nomEntreprise || '').trim()) {
      manques.push('un établissement (Paramètres FNE ou nom d\u2019entreprise)');
    }

    const lignes = facture.lignes || [];
    if (!Array.isArray(lignes) || lignes.length === 0) {
      manques.push('au moins une ligne de facture');
    } else {
      const sansDesignation = lignes.some(function (l) { return !String(l.designation || '').trim(); });
      if (sansDesignation) manques.push('une désignation sur chaque ligne');
      const quantiteInvalide = lignes.some(function (l) { return !(Number(l.quantite) > 0); });
      if (quantiteInvalide) manques.push('une quantité valide (> 0) sur chaque ligne');
    }

    if (manques.length) {
      throw new ValidationError(
        'Certification FNE impossible : il manque ' + manques.join(', ')
          + '. Ce sont des exigences de la DGI.',
        { champ: 'fne', manques: manques });
    }
  }

  /* ================================================================== */
  /* Adaptation FacturePro -> contrat DGI (logique PURE, testable)       */
  /* ================================================================== */

  /**
   * Traduit une facture FacturePro en corps de requête DGI /sign.
   * @param {Facture} facture
   * @param {Client|null} client
   * @param {Parametres} params
   * @returns {Object} payload conforme au contrat DGI
   * @private
   */
  _construirePayload(facture, client, params) {
    const ncc = (client && client.numeroContribuable)
      ? String(client.numeroContribuable).trim() : '';
    const template = ncc ? FNE_TEMPLATE.B2B : FNE_TEMPLATE.B2C;

    const items = (facture.lignes || []).map(function (l) {
      const item = {
        taxes: [FneService.codeTva(l.tauxTva)],
        reference: l.reference || '',
        description: l.designation || '',
        quantity: Number(l.quantite) || 0,
        amount: Number(l.prixUnitaire) || 0, // prix unitaire HT
      };
      if (Number(l.remise)) item.discount = Number(l.remise);
      if (l.unite) item.measurementUnit = l.unite;
      return item;
    });

    return {
      invoiceType: 'sale',
      paymentMethod: FneService.codePaiement(facture.modePaiement),
      template: template,
      isRne: false,
      rne: null,
      clientNcc: ncc,
      clientCompanyName: (client && client.nom) || facture.client || '',
      clientPhone: (client && client.telephone) || '',
      clientEmail: (client && client.email) || '',
      pointOfSale: params.fnePointVente || params.nomEntreprise || '',
      establishment: params.fneEtablissement || params.nomEntreprise || '',
      commercialMessage: '',
      footer: '',
      foreignCurrency: '',
      foreignCurrencyRate: 0,
      items: items,
      discount: 0,
    };
  }

  /**
   * Mappe un taux de TVA (%) vers le code DGI.
   *   18 -> TVA (normal), 9 -> TVAB (réduit), 0 -> TVAC (exo. conv.).
   * Un taux non standard retombe sur TVA normale par prudence.
   * @param {number|string} taux
   * @returns {string}
   */
  static codeTva(taux) {
    const t = Number(taux);
    if (t === 18) return 'TVA';
    if (t === 9) return 'TVAB';
    if (t === 0) return 'TVAC';
    return 'TVA';
  }

  /**
   * Mappe un mode de paiement FacturePro vers le code DGI.
   * Facture non encore encaissée (mode vide) -> 'deferred' (à terme).
   * @param {string} mode
   * @returns {string}
   */
  static codePaiement(mode) {
    return FNE_CODE_PAIEMENT[mode] || 'deferred';
  }

  /**
   * Formate un numéro fiscal au format officiel DGI :
   *   {NCC}{AA}{séquence sur 9 chiffres}  ex: 9606123E25000000019
   * @param {string} ncc
   * @param {number} annee  Année complète (ex: 2026).
   * @param {number} sequence
   * @returns {string}
   */
  static formaterReference(ncc, annee, sequence) {
    const aa = String(annee).slice(-2);
    let seq = String(sequence);
    while (seq.length < 9) seq = '0' + seq;
    return String(ncc) + aa + seq;
  }

  /* ================================================================== */
  /* Dispatch simulation / réel                                          */
  /* ================================================================== */

  /**
   * Route vers le mock intégré ou l'appel HTTP réel selon l'URL configurée.
   * @param {Object} payload
   * @param {Parametres} params
   * @returns {Object} résultat normalisé
   * @private
   */
  _envoyer(payload, params) {
    const url = String(params.fneUrl || '').trim();
    if (!url) return this._simuler(payload, params);
    return this._appelReel(payload, params, url);
  }

  /* ================================================================== */
  /* MODE SIMULATION — mock intégré fidèle au contrat DGI                */
  /* ================================================================== */

  /**
   * Simule la certification DGI : valide le payload comme la vraie plateforme
   * (mêmes erreurs 400), génère un numéro fiscal au format officiel, un token
   * de vérification et décrémente un solde de stickers. Aucun réseau.
   * @param {Object} payload
   * @param {Parametres} params
   * @returns {Object} résultat normalisé
   * @private
   */
  _simuler(payload, params) {
    this._validerPayloadDgi(payload);

    const ncc = (params.numeroContribuable && String(params.numeroContribuable).trim())
      || FNE_DEFAULTS.NCC_DEMO;
    const annee = DateUtils.currentYear();
    const seq = this._prochaineSequenceFne(annee);
    const reference = FneService.formaterReference(ncc, annee, seq);
    const uuid = this._genererUuid();
    const solde = this._consommerSticker();

    // Réponse au format EXACT du contrat DGI, puis normalisée comme le réel.
    const reponseDgi = {
      ncc: ncc,
      reference: reference,
      token: FNE_DEFAULTS.URL_VERIFICATION_SIMULEE + uuid,
      warning: solde <= FNE_DEFAULTS.STICKER_SEUIL_ALERTE,
      balance_sticker: solde,
      invoice: {
        id: uuid,
        reference: reference,
        token: uuid,
        type: 'invoice',
        subtype: 'normal',
        date: new Date().toISOString(),
        source: 'api',
      },
    };

    Log.warn('FNE SIMULATION — facture NON opposable', { reference: reference });
    return this._normaliser(reponseDgi, 'simulation');
  }

  /**
   * Valide le payload comme le ferait la plateforme DGI (erreurs 400).
   * @param {Object} p
   * @private
   */
  _validerPayloadDgi(p) {
    this._exiger(p.invoiceType, 'invoiceType');
    this._exiger(p.paymentMethod, 'paymentMethod');
    this._exiger(p.template, 'template');
    this._exiger(p.pointOfSale, 'pointOfSale');
    this._exiger(p.establishment, 'establishment');
    this._exiger(p.clientCompanyName, 'clientCompanyName');
    this._exiger(p.clientPhone, 'clientPhone');
    this._exiger(p.clientEmail, 'clientEmail');
    if (p.template === FNE_TEMPLATE.B2B) this._exiger(p.clientNcc, 'clientNcc');

    if (!Array.isArray(p.items) || p.items.length === 0) {
      throw new FneError('items is required', 'bad_request', 400);
    }
    for (let i = 0; i < p.items.length; i++) {
      const it = p.items[i];
      if (!it.description || String(it.description).trim() === '') {
        throw new FneError('items[' + i + '].description is required', 'bad_request', 400);
      }
      if (!(Number(it.quantity) > 0)) {
        throw new FneError('items[' + i + '].quantity is not valid', 'bad_request', 400);
      }
      if (!(Number(it.amount) >= 0)) {
        throw new FneError('items[' + i + '].amount is not valid', 'bad_request', 400);
      }
    }
  }

  /**
   * @param {*} v @param {string} champ
   * @private
   */
  _exiger(v, champ) {
    if (v === null || v === undefined || String(v).trim() === '') {
      throw new FneError(champ + ' is required', 'bad_request', 400);
    }
  }

  /* ================================================================== */
  /* MODE RÉEL — appel HTTP (mock déployé ou vraie DGI)                  */
  /* ================================================================== */

  /**
   * Appel HTTP réel vers la plateforme (mock déployé ou vraie DGI).
   * @param {Object} payload
   * @param {Parametres} params
   * @param {string} baseUrl
   * @returns {Object} résultat normalisé
   * @private
   */
  _appelReel(payload, params, baseUrl) {
    const url = String(baseUrl).replace(/\/+$/, '') + FNE_ENDPOINTS.SIGN;
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + (params.fneCleApi || ''),
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const reponse = UrlFetchApp.fetch(url, options);
    const code = reponse.getResponseCode();
    const corps = reponse.getContentText();

    let json;
    try { json = corps ? JSON.parse(corps) : {}; } catch (e) { json = {}; }

    if (code < 200 || code >= 300) {
      throw new FneError(json.message || ('Erreur HTTP ' + code),
        json.error || 'http_error', code);
    }
    return this._normaliser(json, 'reel');
  }

  /* ================================================================== */
  /* Normalisation commune des réponses (réel ET simulé)                */
  /* ================================================================== */

  /**
   * Normalise une réponse au contrat DGI /sign en résultat interne stable.
   * @param {Object} json  Réponse DGI brute.
   * @param {string} mode  'simulation' | 'reel'
   * @returns {{mode:string, ncc:string, reference:string, token:string,
   *            invoiceId:string, balanceSticker:(number|null), warning:boolean}}
   * @private
   */
  _normaliser(json, mode) {
    const invoice = json.invoice || {};
    return {
      mode: mode || 'reel',
      ncc: json.ncc || '',
      reference: json.reference || invoice.reference || '',
      token: json.token || '',                 // URL de vérification -> QR code
      invoiceId: invoice.id || '',             // id d'origine (pour les avoirs)
      balanceSticker: (json.balance_sticker != null) ? json.balance_sticker : null,
      warning: !!json.warning,
    };
  }

  /* ================================================================== */
  /* Persistance (séquence fiscale + stickers) — effets de bord GAS      */
  /* ================================================================== */

  /**
   * Séquence fiscale annuelle, atomique et persistante (la loi exige une
   * série ininterrompue annuelle des numéros de factures certifiées).
   * @param {number} annee
   * @returns {number}
   * @private
   */
  _prochaineSequenceFne(annee) {
    const key = PROP_KEYS.FNE_SEQUENCE_PREFIX + annee;
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const props = PropertiesService.getDocumentProperties();
      const courant = parseInt(props.getProperty(key) || '0', 10);
      const suivant = courant + 1;
      props.setProperty(key, String(suivant));
      return suivant;
    } catch (e) {
      throw new AppError('Impossible de générer la séquence fiscale (verrou).',
        'FNE_SEQUENCE', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  }

  /**
   * Décrémente le solde de stickers simulé (initialisé à STICKER_INITIAL au
   * premier appel), pour reproduire l'épuisement du stock côté DGI.
   * @returns {number} solde restant
   * @private
   */
  _consommerSticker() {
    const props = PropertiesService.getDocumentProperties();
    const brut = props.getProperty(PROP_KEYS.FNE_STICKER_BALANCE);
    const courant = (brut === null || brut === undefined)
      ? FNE_DEFAULTS.STICKER_INITIAL : parseInt(brut, 10);
    const restant = Math.max(0, courant - 1);
    props.setProperty(PROP_KEYS.FNE_STICKER_BALANCE, String(restant));
    return restant;
  }

  /** @returns {string} UUID @private */
  _genererUuid() { return Utilities.getUuid(); }
}

/**
 * Diagnostic manuel — À LANCER DEPUIS L'ÉDITEUR Apps Script.
 * Exécute une certification SIMULÉE sur une facture synthétique et journalise
 * le payload envoyé et la réponse reçue. Ne touche à aucune donnée réelle :
 * sert à vérifier le mock (numéro fiscal, token, solde stickers) sans UI.
 * @returns {Object}
 */
function fneDiagnostic() {
  const svc = new FneService();

  const factureDemo = new Facture({
    client: 'Client Démo SARL',
    objet: 'Prestation de démonstration',
    modePaiement: MODE_PAIEMENT.MOBILE_MONEY,
    lignes: [
      { designation: 'Conseil', quantite: 2, prixUnitaire: 150000, unite: 'jour', remise: 0, tauxTva: 18 },
      { designation: 'Support', quantite: 1, prixUnitaire: 50000, unite: 'forfait', remise: 10, tauxTva: 9 },
    ],
  });
  const clientDemo = {
    nom: 'Client Démo SARL', numeroContribuable: '9502363N',
    telephone: '0700000000', email: 'demo@example.ci',
  };
  const paramsDemo = new Parametres({
    nomEntreprise: 'GLOBAL BUSINESS GROUP',
    numeroContribuable: '',            // vide -> NCC de démo
    fnePointVente: 'Siège', fneEtablissement: 'Abidjan',
    fneUrl: '',                        // vide -> simulation
  });

  const payload = svc._construirePayload(factureDemo, clientDemo, paramsDemo);
  const resultat = svc._simuler(payload, paramsDemo);

  Log.info('FNE diagnostic — payload envoyé', payload);
  Log.info('FNE diagnostic — résultat reçu', resultat);
  return { payload: payload, resultat: resultat };
}

// ====================================================================
// src/controllers/ClientController.gs
// ====================================================================
/**
 * @file ClientController.gs
 * @module controllers/ClientController
 * @description API clients exposée à l'UI.
 */

function api_listerClients() {
  return guard('listerClients', () => new ClientService().lister().map((c) => c.toDTO()));
}

function api_obtenirClient(id) {
  return guard('obtenirClient', () => new ClientService().obtenir(id).toDTO());
}

function api_creerClient(data) {
  return guard('creerClient', () => new ClientService().creer(data).toDTO());
}

function api_modifierClient(id, data) {
  return guard('modifierClient', () => new ClientService().modifier(id, data).toDTO());
}

function api_supprimerClient(id) {
  return guard('supprimerClient', () => new ClientService().supprimer(id));
}

function api_rechercherClients(terme) {
  return guard('rechercherClients', () =>
    new ClientService().rechercher(terme).map((c) => c.toDTO()));
}

// ====================================================================
// src/controllers/DashboardController.gs
// ====================================================================
/**
 * @file DashboardController.gs
 * @module controllers/DashboardController
 * @description API tableau de bord et paramètres.
 */

function api_obtenirKPIs() {
  return guard('obtenirKPIs', () => new DashboardService().calculerKPIs());
}

function api_rafraichirDashboard() {
  return guard('rafraichirDashboard', () => new DashboardService().rafraichir());
}

function api_repartitionStatuts() {
  return guard('repartitionStatuts', () => new DashboardService().repartitionParStatut());
}

function api_obtenirParametres() {
  return guard('obtenirParametres', () => new ParametresService().obtenir().toDTO());
}

function api_enregistrerParametres(data) {
  return guard('enregistrerParametres', () => new ParametresService().enregistrer(data).toDTO());
}

// ====================================================================
// src/controllers/FactureController.gs
// ====================================================================
/**
 * @file FactureController.gs
 * @module controllers/FactureController
 * @description Points d'entrée appelés par l'UI via google.script.run.
 *              Rôle : (1) exposer une API stable, (2) convertir les modèles en
 *              DTO sérialisables, (3) envelopper la réponse dans un Result.
 *              AUCUNE logique métier ici (elle vit dans les services).
 *
 * Convention : chaque fonction publique est préfixée "api_" pour être
 * facilement repérable comme surface exposée au client.
 */

/** @returns {Object} Result<Facture[]> */
function api_listerFactures() {
  return guard('listerFactures', () =>
    new FactureService().lister().map((f) => f.toDTO()));
}

/** @param {string} id @returns {Object} Result<Facture> */
function api_obtenirFacture(id) {
  return guard('obtenirFacture', () => new FactureService().obtenir(id).toDTO());
}

/** @param {Object} data @returns {Object} Result<Facture> */
function api_creerFacture(data) {
  return guard('creerFacture', () => {
    const f = new FactureService().creer(data);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @param {Object} data @returns {Object} Result<Facture> */
function api_modifierFacture(id, data) {
  return guard('modifierFacture', () => {
    const f = new FactureService().modifier(id, data);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @returns {Object} Result<boolean> */
function api_supprimerFacture(id) {
  return guard('supprimerFacture', () => {
    const r = new FactureService().supprimer(id);
    new DashboardService().rafraichir();
    return r;
  });
}

/** @param {string} terme @returns {Object} Result<Facture[]> */
function api_rechercherFactures(terme) {
  return guard('rechercherFactures', () =>
    new FactureService().rechercher(terme).map((f) => f.toDTO()));
}

/** @param {string} id @param {Object} options @returns {Object} Result<Facture> */
function api_encaisserFacture(id, options) {
  return guard('encaisserFacture', () => {
    const f = new FactureService().encaisser(id, options);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @returns {Object} Result<{url}> */
function api_genererPdf(id) {
  return guard('genererPdf', () => {
    const { fichier } = new PdfService().genererEtArchiver(id);
    return { url: fichier.getUrl(), nom: fichier.getName() };
  });
}

/**
 * Certifie une facture auprès de la FNE (simulation ou réel selon l'URL des
 * Paramètres). Renvoie le numéro fiscal, le token de vérification et le mode.
 * @param {string} id
 * @returns {Object} Result<FNE>
 */
function api_certifierFacture(id) {
  return guard('certifierFacture', () => new FneService().certifier(id));
}

/** @param {string} id @param {Object} options @returns {Object} Result */
function api_envoyerFactureEmail(id, options) {
  return guard('envoyerFactureEmail', () =>
    new EmailService().envoyerFacture(id, options));
}

// ====================================================================
// Menu.gs
// ====================================================================
/**
 * @file Menu.gs
 * @module ui/Menu
 * @description Menu personnalisé et lanceurs de boîtes de dialogue / barre latérale.
 */

/**
 * Déclencheur simple : construit le menu à l'ouverture du classeur.
 * @param {Object} e
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('📄 ' + APP.NAME)
    .addItem('➕ Nouvelle facture', 'ui_ouvrirFormulaireFacture')
    .addItem('👥 Gérer les clients', 'ui_ouvrirGestionClients')
    .addSeparator()
    .addItem('🔄 Rafraîchir le tableau de bord', 'ui_rafraichirDashboard')
    .addItem('⚙️ Paramètres', 'ui_ouvrirParametres')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🛠️ Administration')
      .addItem('Initialiser l\'application', 'initialiserApplication')
      .addItem('Installer les déclencheurs', 'installerTriggers'))
    .addToUi();
}

/** Ouvre le formulaire de création/édition de facture. */
function ui_ouvrirFormulaireFacture() {
  const html = HtmlService.createTemplateFromFile('FactureForm')
    .evaluate().setWidth(720).setHeight(640).setTitle('Nouvelle facture');
  SpreadsheetApp.getUi().showModalDialog(html, 'Nouvelle facture');
}

/** Ouvre la gestion des clients. */
function ui_ouvrirGestionClients() {
  const html = HtmlService.createTemplateFromFile('ClientForm')
    .evaluate().setWidth(720).setHeight(600).setTitle('Clients');
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestion des clients');
}

/** Ouvre les paramètres. */
function ui_ouvrirParametres() {
  const html = HtmlService.createTemplateFromFile('ParametresForm')
    .evaluate().setWidth(600).setHeight(560).setTitle('Paramètres');
  SpreadsheetApp.getUi().showModalDialog(html, 'Paramètres de l\'entreprise');
}

/** Rafraîchit le tableau de bord et notifie l'utilisateur. */
function ui_rafraichirDashboard() {
  new DashboardService().rafraichir();
  SpreadsheetApp.getActiveSpreadsheet().toast('Tableau de bord mis à jour.', APP.NAME, 3);
}

/**
 * Helper pour inclure un fichier HTML dans un autre (partials CSS/JS).
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ====================================================================
// src/triggers/Triggers.gs
// ====================================================================
/**
 * @file Triggers.gs
 * @module triggers/Triggers
 * @description Installation et gestion des déclencheurs (triggers) :
 *              - Quotidien : actualisation des retards + rafraîchissement du KPI.
 *              Idempotent : réinstaller supprime d'abord les triggers existants
 *              de l'application pour éviter les doublons.
 */

/**
 * Installe (ou réinstalle) les déclencheurs de l'application.
 * À exécuter une fois depuis l'éditeur ou le menu.
 * @returns {number} nombre de triggers installés
 */
function installerTriggers() {
  supprimerTriggers();

  ScriptApp.newTrigger('tache_quotidienne')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Log.info('Triggers installés.');
  return 1;
}

/** Supprime tous les triggers gérés par l'application. */
function supprimerTriggers() {
  const gerees = ['tache_quotidienne'];
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (gerees.indexOf(t.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(t);
    }
  });
}

/**
 * Tâche exécutée chaque jour : met à jour les retards puis le tableau de bord.
 * Point d'entrée d'un trigger => enrobé pour ne jamais planter silencieusement.
 */
function tache_quotidienne() {
  try {
    const misAJour = new FactureService().actualiserRetards();
    const kpi = new DashboardService().rafraichir();
    Log.info('Tâche quotidienne terminée', { retards: misAJour, kpi: kpi });
  } catch (err) {
    Log.error('Échec tâche quotidienne : ' + err.message, { stack: err.stack });
  }
}

// ====================================================================
// src/Main.gs
// ====================================================================
/**
 * @file Main.gs
 * @module Main
 * @description Point d'entrée / amorçage (bootstrap) de l'application.
 *              Contient l'initialisation idempotente : création des feuilles et
 *              en-têtes manquants, seed des paramètres, préparation du Drive.
 *              À lancer une fois après installation (menu > Administration).
 */

/**
 * Initialise l'application de façon idempotente (peut être relancée sans risque).
 * @returns {Object} Result
 */
function initialiserApplication() {
  return guard('initialiserApplication', () => {
    Log.setLevel(LOG_LEVEL.INFO);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) Feuilles + en-têtes.
    _assurerFeuille(ss, SHEETS.FACTURES, SCHEMA.FACTURES);
    _assurerFeuille(ss, SHEETS.CLIENTS, SCHEMA.CLIENTS);
    _assurerFeuille(ss, SHEETS.PARAMETRES, SCHEMA.PARAMETRES);
    _assurerFeuille(ss, SHEETS.DASHBOARD, SCHEMA.DASHBOARD);

    // 2) Seed des paramètres si vide.
    const pRepo = new ParametresRepository();
    if (pRepo.count() === 0) {
      pRepo.save(new Parametres({ nomEntreprise: 'Mon Entreprise' }));
    }

    // 3) Dossier Drive.
    DriveService.getDossierRacine();

    // 4) Premier calcul du tableau de bord.
    new DashboardService().rafraichir();

    SpreadsheetApp.getActiveSpreadsheet().toast('Application initialisée ✅', APP.NAME, 4);
    return { version: APP.VERSION, feuilles: Object.values(SHEETS) };
  });
}

/**
 * S'assure qu'une feuille existe avec les bons en-têtes (sans écraser les données).
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} nom
 * @param {string[]} schema
 * @private
 */
function _assurerFeuille(ss, nom, schema) {
  let sheet = ss.getSheetByName(nom);
  if (!sheet) sheet = ss.insertSheet(nom);
  const lastCol = sheet.getLastColumn();
  const enteteActuelle = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
    : [];
  const nonVides = enteteActuelle.filter(String);
  if (nonVides.length === 0) {
    // Feuille neuve : on pose tout le schéma.
    sheet.getRange(1, 1, 1, schema.length).setValues([schema]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, schema.length).setFontWeight('bold');
    Log.info('En-têtes créés pour ' + nom);
  } else {
    // Feuille existante : migration douce, on ajoute les colonnes manquantes du schéma
    // sans toucher aux données ni à l'ordre des colonnes déjà présentes.
    const manquantes = schema.filter(function (col) { return enteteActuelle.indexOf(col) === -1; });
    if (manquantes.length) {
      sheet.getRange(1, nonVides.length + 1, 1, manquantes.length).setValues([manquantes]);
      sheet.getRange(1, 1, 1, nonVides.length + manquantes.length).setFontWeight('bold');
      Log.info('Colonnes ajoutées à ' + nom + ' : ' + manquantes.join(', '));
    }
  }
}

