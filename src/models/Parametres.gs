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
    };
  }

  toDTO() { return Object.assign({}, this); }
}
