# Migration vers un site sans Neon ni Cloudinary

## Statut

Cette branche est une **préparation non publiée**. Ne pas la fusionner tant que les sauvegardes et le stockage privé ne sont pas prêts.

## Ce qui remplace les services

- **Contenu éditorial et brouillons** : stockage privé Vercel Blob, via `PRIVATE_BLOB_READ_WRITE_TOKEN`, distinct du store public des médias.
- **Réactions aux posts** : fichiers JSON privés avec contrôle de concurrence ETag.
- **Nouveaux médias** : Cloudflare R2 (déjà en service).

## Contrôles impératifs avant bascule

1. Récupérer un export JSON du contenu **réellement présent dans la base Neon**, y compris les brouillons. En novembre 2026 l'API Neon retourne HTTP 402 (quota atteint) ; ne pas considérer le snapshot Git comme équivalent.
2. Sauvegarder les réactions `portfolio_post_likes` si l'historique des likes doit être conservé. Le code de remplacement crée un espace neuf ; il ne migre pas l'historique automatiquement.
3. Créer un store **privé** Vercel Blob (pas le store public existant) et mettre son token sous `PRIVATE_BLOB_READ_WRITE_TOKEN` dans l'environnement du projet. Ne jamais utiliser `BLOB_READ_WRITE_TOKEN` s'il désigne des médias publics.
4. Tester en préproduction l'authentification GitHub, l'import JSON, la création et la modification de publication, la conservation des brouillons et la visibilité publique.
5. Recopier vers R2 tous les médias d'anciennes URL `res.cloudinary.com` avant de retirer leur autorisation dans `next.config.ts`. Le snapshot Git en contient au moins six.
6. Importer la sauvegarde complète via l'administration, vérifier les comptes et publications puis seulement basculer la production.
7. Après vérifications et sauvegarde indépendante, supprimer les anciens secrets et intégrations Neon/Cloudinary de Vercel. **Ne jamais supprimer le projet Neon ni le compte Cloudinary avant vérification des exports et des médias**.

## Risques connus

- Le snapshot versionné dans `src/lib/default-snapshot.json` comporte six posts seulement et des URLs d'anciens médias : il ne garantit pas les derniers contenus du site.
- Le stockage Blob est un service de fichiers, pas une base SQL. Le code utilise les ETags pour les conflits ; tester la concurrence réelle avant mise en production.
- Les réactions historiques nécessitent un export/une conversion séparé(e) si elles sont importantes.
- Tant que les fichiers sont physiquement hébergés sur Cloudinary, supprimer le domaine de la configuration `next/image` rendrait certaines images invisibles.
