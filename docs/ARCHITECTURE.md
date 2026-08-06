# Architecture — FacturePro ERP

## 1. Principes directeurs

1. **Séparation des responsabilités** — chaque couche a un rôle unique.
2. **Le domaine ne connaît pas l'infrastructure** — les modèles ignorent Sheets/UI.
3. **Les contrôleurs sont minces** — aucune règle métier, uniquement orchestration + sérialisation.
4. **Fail fast, fail clean** — validation en amont, erreurs typées, réponse homogène.
5. **Évolutivité** — ajouter un module (produits, devis…) = ajouter un modèle + repository + service + contrôleur, sans toucher l'existant.

## 2. Couches

### config/
Constantes figées (`Object.freeze`). Aucune logique. `SCHEMA` est la source de vérité des colonnes et permet l'auto-création des feuilles.

### core/
- `Logger` — logs horodatés à seuil configurable ; point d'extension pour un log persistant.
- `AppError` / `ValidationError` / `NotFoundError` / `ConflictError` — erreurs typées avec `code` et `details`.
- `Result` + `guard()` — enveloppe `{success, data|error}` renvoyée au client ; `guard()` capture toute exception.

### models/
Objets de domaine purs. Contiennent la logique intrinsèque (ex. `Facture.calculerMontants`, `Facture.estEnRetard`) et la (dé)sérialisation `fromRow` / `toRow` / `toDTO`. **Testables sans Google.**

### repositories/
`BaseRepository` = DAO générique au-dessus de Sheets :
- Résolution **dynamique** des colonnes via l'en-tête (robuste au réordonnancement).
- **Verrou** `LockService` sur toutes les écritures (anti-corruption concurrente).
- Conversion ligne ⟷ objet.

Les repositories concrets hydratent les modèles (`FactureRepository.findAll()` renvoie des `Facture`).

### services/
La logique métier. Orchestrent repositories + modèles + utils. Exemples :
- `FactureService.creer()` — numérotation, calculs, échéance, validation, insertion.
- `DashboardService.rafraichir()` — recalcule 8 KPI et les écrit dans la feuille.
- `PdfService`, `EmailService`, `DriveService` — responsabilités isolées (génération / envoi / stockage).
- `FneService` — certification DGI. Traduit une facture en payload conforme au contrat de l'API FNE, valide (pré-validation FR + validation façon DGI), puis **route vers un mock intégré** (mode simulation) **ou l'appel HTTP réel** selon l'URL configurée. Normalise la réponse (numéro fiscal, token de vérification, solde de stickers).

### utils/
Fonctions pures, sans dépendance à Google :
- `Validator` — garde-fous de validation.
- `DateUtils` / `Formatter` — dates et formatage monétaire.
- `QrCode` — **générateur de QR en code pur** (byte mode, correction d'erreurs Reed-Solomon niveau M, versions 1–10, masquage optimal). Aucune dépendance ni appel réseau ; vérifié par décodage réel dans les tests. Sortie SVG (usage web futur) et table HTML (rendu fiable dans le convertisseur PDF de GAS).

### controllers/
Fonctions `api_*` appelées par `google.script.run`. Convertissent en DTO, enveloppent dans `Result`. C'est le **contrat** avec le front.

### ui/
`Menu.gs` (menu + lanceurs) et fichiers `.html` (dialogues). Partials partagés : `Styles.html`, `ClientJs.html` (helper `appel()` gérant le `Result`).

### triggers/
`installerTriggers()` (idempotent) + `tache_quotidienne()` (retards + KPI), enveloppée pour ne jamais planter en silence.

## 3. Flux d'une création de facture

```
FactureForm.html
  -> google.script.run.api_creerFacture(data)
    -> guard('creerFacture')
      -> FactureService.creer(data)
         - Validator.*             (validation)
         - NumerotationService     (FAC-2026-xxxx atomique)
         - Facture.calculerMontants(taux)   (TVA/TTC)
         - FactureRepository.insert (verrou + Sheets)
      -> DashboardService.rafraichir()
    -> Result.ok(facture.toDTO())
  -> UI : toast + rafraîchissement liste
```

## 4. Flux de certification FNE (Phase 1)

```
Facture certifiée par l'utilisateur
  -> FneService.certifier(idFacture)
     - _prevaliderFr()            (exigences DGI en français, avant tout envoi)
     - _construirePayload()       (facture -> contrat API DGI, B2B/B2C selon NCC)
     - _envoyer()  ── URL vide ─> _simuler()     (mock intégré, aucun réseau)
                   └─ URL ────────> _appelReel()  (HTTP Bearer, mock déployé ou vraie DGI)
     - _normaliser()             (numéro fiscal, token de vérification, solde stickers)
     - stocke numeroFiscal / fneToken / fneStatut sur la facture
  -> PdfService : bandeau de certification (visuel FNE + numéro + QrCode.htmlTable(token))
                  marqué « NON OPPOSABLE » si le token est en simulation
```

Le **même code** sert la simulation et le réel : seule la présence d'une URL (Paramètres FNE) fait basculer le mode. La certification est **idempotente** (une facture déjà certifiée n'est jamais re-soumise).

## 5. Choix techniques notables

- **Runtime V8** : classes ES6, `const/let`, arrow functions.
- **Pas d'instanciation cross-fichier au chargement** : les services/repos sont instanciés *à l'appel* (dans les fonctions), l'ordre de chargement des fichiers n'a donc pas d'importance.
- **PropertiesService** pour les compteurs de séquence et l'ID du dossier Drive.
- **Idempotence** : `initialiserApplication()` et `installerTriggers()` peuvent être relancés sans effet de bord.

## 6. Extension — ajouter un module « Produits »

1. `models/Produit.gs`
2. `repositories/ProduitRepository.gs extends BaseRepository`
3. `services/ProduitService.gs`
4. `controllers/ProduitController.gs` (`api_*`)
5. `ui/ProduitForm.html` + entrée de menu

Aucune modification des couches existantes n'est requise : couplage faible respecté.
