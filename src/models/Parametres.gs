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
