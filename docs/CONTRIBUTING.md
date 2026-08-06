# Contribuer

## Conventions de code
- **Runtime V8**, `const`/`let`, classes ES6, pas de `var`.
- Un fichier = une responsabilité ; nommage `PascalCase` pour les classes.
- **Fonctions publiques exposées à l'UI** préfixées `api_`.
- **JSDoc** obligatoire sur les classes et méthodes publiques.
- Aucune règle métier dans les contrôleurs ; aucune API Google dans les modèles.

## Ajouter un module
Suivre le patron décrit dans `docs/ARCHITECTURE.md` §5 :
modèle → repository → service → contrôleur → UI → entrée de menu.

## Git
- Branches : `feat/…`, `fix/…`, `docs/…`.
- Commits : format court impératif (« Ajoute le module Produits »).
- Ne jamais committer `.clasp.json` ni `.clasprc.json` (voir `.gitignore`).

## Tests
Le code métier est testé hors GAS (contexte `vm` Node + stubs des services Google) :

```bash
npm install   # jsqr, pour le décodage réel des QR
npm test      # FNE + QR + bandeau PDF
```

Ajoutez/mettez à jour les tests pour tout nouveau service ou toute logique métier.

## Avant une PR
- Lancer `npm test` : tout doit passer.
- Vérifier que `initialiserApplication()` reste idempotent.
- Vérifier la validation et la gestion d'erreurs des nouveaux points d'entrée.
- Si un `.gs` est ajouté/modifié, régénérer la « version facile » : `npm run build`.
