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
