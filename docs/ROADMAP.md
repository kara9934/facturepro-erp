# Feuille de route — de la facturation à l'ERP

L'architecture en couches permet d'ajouter chaque module sans refonte.

## Phase 1 — Socle (livré ✅)
- Factures (CRUD, numérotation, TVA/TTC auto, encaissement)
- Clients (CRUD, recherche)
- Paramètres d'entreprise
- PDF + archivage Drive
- Envoi email
- Tableau de bord (8 KPI) + trigger quotidien

## Phase 2 — Ventes
- **Produits / Catalogue** (modèle + repo + service + UI)
- **Devis** (avec conversion devis → facture)
- **Lignes de facture multiples** (table `Lignes_Facture` liée)
- **Paiements partiels** (table `Paiements`, statut « Partiellement payée »)

## Phase 3 — Achats & tiers
- **Fournisseurs**
- **Factures fournisseurs / dépenses**

## Phase 4 — Gouvernance
- **Utilisateurs & rôles** (feuille `Utilisateurs`, contrôle d'accès dans `guard()`)
- **Journal d'audit** (persistance des logs)

## Phase 5 — Pilotage
- **Rapports** (mensuel, TVA, par client)
- **Tableau de bord avancé** (graphiques interactifs via web app / Sheets charts)
- **Notifications** (relances automatiques des factures en retard par email)
- **Intégrations Google** (Agenda pour échéances, Docs pour modèles)

## Dette technique à prévoir
- Tests : extraire les modèles/services testables dans un harnais (les modèles sont déjà purs).
- Migration éventuelle vers une base relationnelle si le volume dépasse les limites de Sheets.
