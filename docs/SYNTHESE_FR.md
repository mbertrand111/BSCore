# BSCore — Synthèse du projet

> Document de pilotage en français. Les noms de fichiers, identifiants techniques, noms de couches et termes de code restent en anglais.

---

## Vision

BSCore est une plateforme de base réutilisable pour créer des sites web clients sur mesure. L'idée centrale : disposer d'un socle technique solide et d'un catalogue de modules métier, puis assembler et personnaliser selon les besoins de chaque client — sans repartir de zéro à chaque projet.

Le modèle de distribution est basé sur le **clonage de dépôt** : on clone BSCore pour démarrer un nouveau projet client. Il n'y a pas de monorepo partagé, pas de dépendance npm centrale à maintenir. Chaque projet client est autonome après le clonage.

Objectif à long terme : lancer le projet n°10 aussi vite que le projet n°1, en capitalisant sur l'expérience accumulée dans la plateforme.

---

## Architecture en 4 couches

```
Socle          → Infrastructure pure (zéro base de données, zéro authentification)
Socle+         → Base de données, authentification, RBAC, shell d'administration
Modules        → Blocs métier indépendants (CMS, Blog, Commerce, etc.)
Client         → Personnalisation spécifique au projet (src/client/)
```

Chaque couche ne peut dépendre que des couches inférieures. Jamais l'inverse.

---

## Socle

Le Socle est la fondation technique du projet. Il contient uniquement de l'infrastructure générique, sans aucun concept métier.

**Ce qu'il contient :**
- Gestion de la configuration (`config/`)
- Système d'erreurs (types, messages, shape HTTP)
- Logger structuré
- Middleware pipeline (sécurité, headers, CORS)
- Routing de base et health endpoint
- Assets statiques partagés

**Ce qu'il ne contient jamais :**
- Connexion à une base de données
- Authentification ou sessions
- Rôles ou permissions
- Toute entité métier (utilisateur, commande, produit, etc.)

Le Socle doit fonctionner sans base de données, sans clé API, sans aucune dépendance externe au démarrage.

---

## Socle+

Le Socle+ étend le Socle avec les services partagés nécessaires à la grande majorité des projets. Il s'active explicitement : un module déclare `uses: socle+` dans son manifest.

**Ce qu'il apporte :**
- Connexion PostgreSQL via Supabase
- Cycle de vie de l'authentification (session, tokens)
- RBAC : `can(user, action, resource)` — vérification de permissions
- Entité utilisateur minimale (id, email, rôle) — pas un profil complet
- Shell d'administration : layout, authentification admin, registre de navigation
- Journal d'audit (qui a fait quoi, quand)

**Principe clé sur le shell d'administration :**
Le Socle+ fournit le conteneur (layout, auth, nav), mais les modules y enregistrent leurs propres sections. Le Socle+ ne connaît pas le contenu des modules.

---

## Modules

Les modules sont des blocs métier indépendants. Chacun possède une interface publique exposée uniquement via son `index.ts`. Un module ne peut jamais importer directement un autre module — la communication passe par l'interface publique ou par des événements.

### Catalogue des modules

**Contenu**
- `cms` — pages, blocs de contenu, éditeur
- `blog` — articles, catégories, auteurs
- `media` — bibliothèque de fichiers et images
- `seo` — métadonnées, sitemap, structured data
- `i18n` — internationalisation et traductions
- `redirects` — gestion des redirections URL

**Conversion**
- `forms` — formulaires dynamiques, soumissions
- `newsletter` — abonnements, intégration emailing
- `notifications` — alertes in-app
- `popups` — bannières et modales marketing

**Service**
- `booking` — réservations et disponibilités
- `events` — événements, inscriptions
- `faq` — questions fréquentes

**Commerce**
- `commerce` — catalogue produits, variantes, stock
- `orders` — commandes (dépend de `commerce`)
- `payments` — paiements (dépend de `orders`)
- `subscriptions` — abonnements récurrents (dépend de `payments`)

**Relation client**
- `user-profile` — profil étendu de l'utilisateur
- `crm` — contacts, historique client
- `social-auth` — connexion OAuth
- `two-factor` — authentification à deux facteurs

**Infrastructure**
- `analytics` — tracking et métriques
- `api-gateway` — exposition d'une API publique

### Dépendances entre modules

Certains modules forment des "stacks" cohérentes (ex : stack commerce = `commerce` + `orders` + `payments`). Les dépendances sont **déclarées** dans le manifest du module, pas réalisées par import direct. La communication se fait uniquement via l'interface publique du module dépendu.

### Système d'événements

Un module peut émettre des événements pour notifier d'autres parties du système sans créer de couplage. Les événements suivent la convention `domain.verb` (ex : `order.created`, `user.registered`). Ce système est intentionnellement simple (in-process), entièrement documenté, et utilisé pour le découplage — pas pour l'orchestration complexe.

---

## Couche client (`src/client/`)

La couche client contient tout ce qui est spécifique au projet client : pages, composants visuels, configuration du thème, logique métier propre au client. Elle n'est **jamais** fusionnée vers le dépôt BSCore de base. C'est le delta entre la plateforme et le projet.

---

## Frontières architecturales

### Règle fondamentale
Un module n'importe jamais directement un autre module. Toute communication inter-modules passe par l'interface publique (`index.ts`) ou par événements.

### Anti-patterns à éviter

```typescript
// INTERDIT — import direct entre modules
import { getProduct } from '@/modules/commerce/domain/product'

// CORRECT — via interface publique
import { getProduct } from '@/modules/commerce'
```

```typescript
// INTERDIT — logique métier dans le Socle
// src/socle/user.ts → JAMAIS

// INTERDIT — connexion DB dans le Socle
// src/socle/db.ts → JAMAIS
```

```typescript
// INTERDIT — accès direct à la DB depuis l'UI
// src/client/pages/ProductPage.tsx → import { db } → JAMAIS
```

### Règle des 3 questions

Avant de placer du code dans une couche, se poser :
1. Est-ce de l'infrastructure ou du métier ?
2. Est-ce générique ou spécifique ?
3. Est-ce qu'il ne devrait pas être une couche plus bas ?

---

## Règles d'ingénierie

### TypeScript
- Strict mode activé : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Pas de `any` — utiliser `unknown` + parsing Zod
- Types explicites sur toutes les fonctions exportées
- Pas de `!` (non-null assertion) sans commentaire justificatif

### Structure du code
- Séparation obligatoire : HTTP → Domain → Data (sens unique)
- Pas de logique métier dans les composants UI
- Pas d'accès DB direct depuis l'UI
- Exports externes d'un module : uniquement via `index.ts`

### Validation
- Zod est la seule bibliothèque de validation
- Les types TypeScript sont inférés depuis les schémas Zod, jamais définis manuellement en doublon

### Conventions de nommage

| Élément | Convention |
|---|---|
| Fichiers | `kebab-case.ts` |
| Composants React | `PascalCase.tsx` |
| Constantes | `SCREAMING_SNAKE_CASE` |
| Tables DB | `snake_case` |
| Événements | `domain.verb` |

### Git
- Conventional Commits : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Pas de `utils.ts` fourre-tout — nommer les fichiers par responsabilité

---

## Sécurité

Les règles de sécurité sont non-négociables et documentées dans `docs/SECURITY_RULES.md`. Points clés :

- **Variables d'environnement** : jamais dans le code, jamais côté client sans préfixe `NEXT_PUBLIC_`
- **Frontière server/client** : la logique d'autorisation est toujours côté serveur
- **Authentification** : vérification systématique sur chaque route protégée, pas de "ça sera fait plus tard"
- **Autorisation** : vérifier l'action ET la ressource (ex : l'utilisateur peut-il modifier *ce* document ?)
- **Validation** : tout ce qui vient de l'extérieur est validé via Zod (formulaires, params URL, réponses API)
- **SQL** : requêtes paramétrées uniquement — jamais de concaténation de chaînes
- **Erreurs** : les messages d'erreur ne révèlent jamais de détails d'implémentation à l'utilisateur
- **Risques résiduels** : documentés dans `docs/RISKS.md` avec propriétaire et statut

---

## Tests

La stratégie complète est dans `docs/TESTING_STRATEGY.md`. En résumé :

### Types de tests

| Type | Outil | Scope | Règle |
|---|---|---|---|
| Unit | Vitest | Logique métier, fonctions pures, schémas Zod | Pas de DB, pas d'HTTP |
| Integration | Vitest | Repositories, services avec DB | Vraie DB, jamais mockée |
| E2E | Playwright | Parcours critiques complets | Chromium, `e2e/specs/` |

### Règles importantes
- Les tests d'intégration utilisent une vraie base de données PostgreSQL — jamais de mock
- Les tests de régression : écrire le test *avant* de corriger le bug
- La couverture est pilotée par le risque, pas par un pourcentage arbitraire
- Chaque guard d'autorisation doit avoir un test qui vérifie le rejet des requêtes non autorisées

### Configuration
- `vitest.config.ts` → tests unitaires (`*.test.ts`, `*.test.tsx`)
- `vitest.integration.config.ts` → tests d'intégration (`*.integration.test.ts`)
- `playwright.config.ts` → tests E2E

---

## UX

Les règles complètes sont dans `docs/UX_RULES.md`. Principes essentiels :

- **4 états obligatoires** sur chaque écran : chargement, vide, erreur, succès
- **Actions destructives** : toujours une confirmation avec le nom de l'élément concerné, bouton rouge avec libellé d'action, focus par défaut sur "Annuler"
- **Formulaires** : labels au-dessus des champs, validation inline, messages d'erreur spécifiques, valeurs préservées en cas d'erreur
- **Accessibilité** : navigation clavier, focus visible, `aria-label`, contraste minimum 4.5:1

---

## SEO

Les règles complètes sont dans `docs/SEO_RULES.md`. Principes essentiels :

- `<title>` et `<meta description>` uniques par page
- Un seul `<h1>` par page, hiérarchie de titres logique
- URLs canoniques, sitemap XML, robots.txt
- Objectifs Core Web Vitals : LCP < 2.5s, INP < 200ms, CLS < 0.1
- Le contenu critique est dans le HTML source (pas rendu uniquement en JavaScript)
- Données structurées Schema.org quand pertinent

---

## Stack technique

| Technologie | Usage | Décision |
|---|---|---|
| Next.js 15 (App Router) | Framework principal | RSC, nested layouts, route groups |
| TypeScript strict | Tout le code | Avec `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` |
| Tailwind CSS | Styles | Pas de runtime, compatible RSC, thème via variables CSS |
| Zod | Validation | Seule bibliothèque de validation, types inférés |
| Vitest v4 | Tests unit + integration | Deux configs séparées |
| Playwright | Tests E2E | Chromium, `e2e/specs/` |
| PostgreSQL / Supabase | Base de données | Uniquement dans Socle+ et au-dessus |
| clsx + tailwind-merge | Utilitaire CSS | Fonction `cn()` dans `src/shared/ui/utils/` |

**Rejetés :** CSS-in-JS, Pages Router, Jest, Cypress, tRPC, GraphQL, shadcn dans le core.

**Différés :** Storybook (V2), ORM (Prisma vs Drizzle à décider au moment de Socle+), multi-tenancy, email provider, stockage de fichiers.

---

## Thème et styles

Le thème est défini en deux niveaux :
1. **Variables CSS globales** dans `src/app/globals.css` : couleurs, rayons, espacements — définis par projet
2. **Primitives Tailwind** dans `tailwind.config.ts` : référencent les variables CSS

Cela permet de personnaliser l'identité visuelle d'un projet client sans toucher aux composants partagés.

```css
/* globals.css — à personnaliser par projet */
:root {
  --color-primary: 210 100% 45%;
  --color-secondary: 210 15% 94%;
  --radius: 0.5rem;
}
```

Les projets clients peuvent intégrer shadcn, Radix, ou tout autre système de composants — BSCore ne l'impose pas dans le core.

---

## Structure du dépôt (vue d'ensemble)

```
src/
  app/           → Routing Next.js uniquement (pas de logique)
  socle/         → Infrastructure pure
  socle-plus/    → DB, auth, RBAC, admin shell
  modules/       → Modules métier indépendants
  shared/        → Composants et utilitaires partagés cross-couches
  client/        → Personnalisation spécifique au projet (ne pas merger vers BSCore)
config/          → Configuration statique (non-secrète, non-dynamique)
e2e/             → Tests Playwright
docs/            → Documentation architecture et décisions
```

La structure complète avec annotations est dans `docs/REPOSITORY_STRUCTURE.md`.

---

## Roadmap

### Phase 1 — Socle (en cours)
- [x] Documentation architecture complète
- [x] Initialisation technique (Next.js, TypeScript, Tailwind, Vitest, Playwright)
- [ ] Implémentation du Socle : config, errors, logger, middleware, health endpoint

### Phase 2 — Socle+
- [ ] Connexion PostgreSQL / Supabase
- [ ] Authentification et sessions
- [ ] RBAC (`can(user, action, resource)`)
- [ ] Shell d'administration (layout + registre de navigation)
- [ ] Journal d'audit
- [ ] Décision ORM (Prisma vs Drizzle)

### Phase 3 — Modules MVP
Modules prioritaires identifiés : `cms`, `blog`, `media`, `seo`, `forms`, `user-profile`

### Phase 4 — Modules complémentaires
Stack commerce (`commerce` → `orders` → `payments`), `newsletter`, `booking`, et autres selon besoins projets.

---

## Utilisation pour un projet client

### Démarrer un nouveau projet

1. Cloner BSCore : `git clone <bscore-repo> <nom-projet-client>`
2. Réinitialiser l'historique git ou créer une nouvelle branche client
3. Personnaliser les variables CSS dans `src/app/globals.css`
4. Définir la configuration dans `config/`
5. Créer le code spécifique au client dans `src/client/`
6. Activer les modules nécessaires (ajouter à la configuration, inclure dans le boot)

### Règles absolues pour la couche client

- Tout le code spécifique au client va dans `src/client/`
- Ne jamais modifier le Socle, Socle+ ou les modules partagés pour des besoins spécifiques à un client
- Les personnalisations qui seraient utiles à d'autres projets peuvent être proposées pour intégration dans BSCore (via PR documentée)
- `src/client/` ne sera jamais fusionné vers le dépôt BSCore de base

### Ajouter un module à un projet

1. Activer le module dans la configuration
2. Déclarer les dépendances dans le manifest du module (`uses: ['socle+', 'cms']`)
3. Implémenter les migrations DB dans `src/modules/<nom>/data/migrations/`
4. Brancher la navigation admin dans `src/modules/<nom>/admin/`
5. Exposer l'interface publique uniquement via `src/modules/<nom>/index.ts`

---

## Qualité et processus

Après chaque implémentation, un **Quality Report** est obligatoire (défini dans `CLAUDE.md`). Il couvre : architecture, frontières, TypeScript, sécurité, tests, UX, accessibilité, SEO, performance, documentation, risques résiduels.

Le format de sign-off rapide utilise le système ✅ / ⚠️ / ❌ / N/A défini dans `docs/QUALITY_CHECKLIST.md`.

Les décisions d'architecture sont documentées sous forme d'ADR dans `docs/ADR/` (Architecture Decision Records). Le premier ADR (`0001-tech-stack.md`) documente les choix de stack avec les alternatives évaluées et les raisons des décisions.

---

## Documents de référence

| Document | Contenu |
|---|---|
| `docs/VISION.md` | Philosophie, objectifs, modèle de distribution |
| `docs/SOCLE.md` | Spécification complète du Socle |
| `docs/SOCLE_PLUS.md` | Spécification complète du Socle+ |
| `docs/MODULES.md` | Catalogue des 23 modules avec statuts et dépendances |
| `docs/ARCHITECTURE.md` | Diagrammes, flux de données, décisions clés |
| `docs/BOUNDARIES.md` | Frontières architecturales, anti-patterns, règles de placement |
| `docs/TECH_STACK.md` | Stack technique choisie avec justifications |
| `docs/ADR/` | Registre des décisions d'architecture |
| `docs/ENGINEERING_RULES.md` | Règles TypeScript, structure, naming, Git |
| `docs/SECURITY_RULES.md` | Règles de sécurité (17 sections) |
| `docs/TESTING_STRATEGY.md` | Stratégie de tests par type et par couche |
| `docs/UX_RULES.md` | Règles UX et accessibilité |
| `docs/SEO_RULES.md` | Règles SEO et Core Web Vitals |
| `docs/QUALITY_CHECKLIST.md` | Checklist de qualité post-implémentation |
| `docs/REPOSITORY_STRUCTURE.md` | Structure complète du dépôt annotée |
| `docs/RISKS.md` | Registre des risques résiduels |
| `CLAUDE.md` | Instructions opérationnelles pour Claude Code |
