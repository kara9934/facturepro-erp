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
