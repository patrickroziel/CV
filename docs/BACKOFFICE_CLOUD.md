# Migration du back-office — environnement de préproduction

## Déjà réalisé (pull request #4, ne pas fusionner automatiquement)

- L'interface actuelle **Work / Notes** et le snapshot GitHub restent intacts.
- Adresse privée `/behind-the-glass/<BACKOFFICE_SLUG>` (chaîne aléatoire de 24 caractères minimum).
- GitHub OAuth réservé au compte personnel `patrickroziel` (ID stable `307225840`).
- Session HTTP-only, signée HMAC, état OAuth aléatoire, expiration après sept jours.
- `/api/backoffice/content` : brouillons compris, lecture/écriture uniquement pour l'administrateur connecté.
- `/api/portfolio` : contenu public filtré, sans brouillons; repli sur le snapshot du dépôt si Neon est indisponible.
- Sauvegardes PostgreSQL Neon en JSONB avec numéro de révision: une édition concurrente déclenche une erreur explicite (409).
- Editeur Work/Notes existant synchronisé via `PortfolioProvider`, avec sauvegarde locale de secours.
- Les uploads Vercel Blob ne sont autorisés en production que pour une session administrateur authentifiée.
- Boutons d'import de snapshot JSON et d'export du document cloud dans l'espace privé.
- Le mode édition ne peut pas être activé pour tout le public par la variable `NEXT_PUBLIC_ALLOW_EDIT` en production.

## Configuration externe encore requise

Cette branche **n'a pas créé de projet Neon, d'application OAuth GitHub ni de variables Vercel**.
Ces actions sont réservées aux comptes du propriétaire et nécessitent leur connexion ou son intervention.

Variables à ajouter exclusivement côté serveur sur Vercel :
```
DATABASE_URL=postgresql://...  # connexion PostgreSQL Neon, avec SSL
BACKOFFICE_SLUG=...           # chaîne générée de 24 caractères alphanumériques minimum
BACKOFFICE_BASE_URL=https://<domaine exact>
BACKOFFICE_SESSION_SECRET=... # 32+ caractères aléatoires
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
```
Générer indépendamment `BACKOFFICE_SLUG` et `BACKOFFICE_SESSION_SECRET` via `openssl rand -hex 32`.
Dans GitHub OAuth Apps, définir le callback `https://<domaine exact>/api/backoffice/callback`.
Aucun scope `repo` n'est requis pour se connecter.

La dépendance `@neondatabase/serverless` doit être installée et le fichier `package-lock.json` régénéré avant toute fusion.
Ne pas committer les secrets ni `.env.local`.

## Vérification de bout en bout requise avant fusion

1. Vérifier le build sur la branche; tester l'accès sur un déploiement de préproduction.
2. Vérifier un compte GitHub tiers et un visiteur déconnecté : aucun accès aux brouillons ou à l'édition.
3. Exporter le **dernier** JSON local de l'iMac et le sauvegarder dans iCloud Drive.
4. Se connecter à l'adresse privée et importer le dernier JSON. Ne pas supprimer sa copie iCloud.
5. Modifier une note, puis vérifier qu'elle apparaît sur iPhone/iPad sans `git push`.
6. Vérifier qu'un brouillon n'est pas accessible à un visiteur et que les médias sont refusés sans authentification.
7. Simuler une édition concurrente sur deux navigateurs, confirmer le refus 409 sans suppression locale.
8. Vérifier la politique d'utilisation commerciale de l'hébergement et les coûts de l'API Google Cloud Translation.

Ne pas fusionner cette pull request tant que les identifiants OAuth, la base et les tests ne sont pas prêts.

## Abonnements existants

iCloud+ 2 To : conserver archives et sauvegardes du snapshot. Adobe Creative Cloud : production de médias.
Ces abonnements ne sont pas des bases de données pour l'application Next.js.
Neon Free : aucune souscription payante nécessaire tant que l'utilisation reste dans le quota gratuit.
