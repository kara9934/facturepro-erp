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
