# mon-portfolio-v2

Portfolio glassmorphism de **Patrick Roziel** — monteur vidéo, motion designer et chargé de communication digitale.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- framer-motion
- Radix UI (dialogs, menus)
- **Cloudflare R2** (images, vidéos, textes du site)
- YouTube non listé pour les grosses vidéos (showreel, démos, feature)
- Persistance locale (`localStorage` — métadonnées + URLs, pas les fichiers)

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner les variables Cloudflare R2
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Cloudflare R2

Les fichiers et le contenu du site sont enregistrés sur Cloudflare R2.
Seule l’adresse publique est gardée dans le portfolio.

| Variable | Rôle |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Compte Cloudflare |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Clé du bucket |
| `R2_BUCKET_NAME` | Nom du bucket |
| `R2_PUBLIC_URL` | Adresse publique, par exemple `https://media.patrickroziel.com` |

- Route d’upload : `POST /api/r2/upload`
- Dossiers : `patrick-roziel/{profile,projects,wallpaper,…}/…`

Les anciennes adresses déjà présentes dans les posts continuent de s’afficher si le fichier existe encore. Les nouveaux fichiers ne passent plus par Vercel ni Cloudinary.

## Fonctionnalités

- Design **glassmorphism** (cartes verre, fond éditable, dock)
- Contenu CV (profil, expériences, compétences, formation, langues)
- **Mode Édition** : CRUD sections, envoi vers Cloudflare, panneau Apparence / Menu
- Galerie `/projets` + détail `/projets/[id]`
- Export PDF (impression navigateur)
- Widgets flottants et micro-interactions

## Notes

- Les données sont stockées dans le navigateur (`mon-portfolio-v2-data`). Pas d’auth serveur.
- Ne jamais committer `.env.local` ni le token Blob.
