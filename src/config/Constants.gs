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
  ]),
  CLIENTS: Object.freeze([
    'ID_Client', 'Nom', 'Téléphone', 'Email', 'Adresse', 'Ville', 'Pays',
    'Contact', 'Numéro_Contribuable', 'Statut', 'Date_Création',
  ]),
  PARAMETRES: Object.freeze([
    'Nom_Entreprise', 'Adresse', 'Téléphone', 'Email', 'Site_Web',
    'Numéro_Contribuable', 'Taux_TVA', 'Devise', 'Délai_Paiement',
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

/** Clés de stockage PropertiesService (évite les collisions). */
const PROP_KEYS = Object.freeze({
  DRIVE_FOLDER_ID: 'FP_DRIVE_FOLDER_ID',
  FACTURE_SEQUENCE_PREFIX: 'FP_SEQ_FACTURE_',
  CLIENT_SEQUENCE: 'FP_SEQ_CLIENT',
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
