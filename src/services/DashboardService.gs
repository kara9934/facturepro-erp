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
