# Back-office distant — phase 1 (branche isolée)

Cette branche ajoute un **socle d’authentification GitHub** sans modifier le contenu du site ni activer l’édition publique.

## Déjà présent
- Adresse privée personnalisable : `/behind-the-glass/[BACKOFFICE_SLUG]`.
- OAuth GitHub côté serveur avec vérification du `state`, du propriétaire GitHub (ID immuable `307225840`), cookie de session signé HMAC, HttpOnly, SameSite=Lax, Secure en production.
- Connexion sans autorisation de lire/modifier les dépôts GitHub.
- Endpoint `/api/backoffice/session` pour l'état de la session, déconnexion sécurisée.
- Aucune modification du snapshot JSON, des formulaires Work/Notes ni du comportement actuel de publication.

## Variables requises (valeurs secrètes uniquement dans l’hébergeur)
```text
BACKOFFICE_SLUG=<valeur-aléatoire-longue>
BACKOFFICE_BASE_URL=https://<domaine-de-ton-site>
BACKOFFICE_SESSION_SECRET=<secret-aléatoire-de-32-caractères-minimum>
GITHUB_OAUTH_CLIENT_ID=<client-id>
GITHUB_OAUTH_CLIENT_SECRET=<secret>
```
Application GitHub OAuth : Callback URL `https://<domaine-de-ton-site>/api/backoffice/callback`.

## Phases suivantes — non encore activées
1. Vérifier manuellement les autorisations OAuth et tester le flux de connexion sur une URL de préproduction.
2. Ajouter le stockage Neon avec initialisation prudente depuis le dernier export JSON.
3. Synchroniser `PortfolioProvider` avec revision/gestion des conflits et statut de sauvegarde.
4. Autoriser l’édition côté serveur **uniquement** avec une session admin valide; sécuriser l’upload Vercel Blob; vérifier la traduction Google Cloud et sa limitation de coût.
5. Tester sur iPhone, iPad et PC; exporter un snapshot de secours.
6. Déployer en production après validation. **Ne pas fusionner cette branche tant que la sauvegarde et l’authentification n’ont pas été testées.**

Aucun nouvel abonnement payant n’est requis pour créer cette branche. Les comptes/configurations Neon et GitHub OAuth n’ont pas été créés automatiquement.
