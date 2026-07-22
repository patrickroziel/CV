# mon-portfolio-v2

Portfolio glassmorphism de **Patrick Roziel** — monteur vidéo, motion designer et chargé de communication digitale.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- framer-motion
- Radix UI (dialogs, menus)
- **Cloudinary** (images & vidéos)
- Persistance locale (`localStorage` — métadonnées + URLs, pas les fichiers)

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner les clés Cloudinary
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Cloudinary

Les uploads (photo de profil, projets, showreel, wallpaper…) partent vers Cloudinary.
Seule la `secure_url` est enregistrée dans le portfolio.

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name public |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Preset **unsigned** (`portfolio_upload`) |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Upload **signé** (serveur uniquement) |
| `ALLOW_CLOUDINARY_UPLOAD=true` | Autorise la signature hors dev |

- Route signée : `POST /api/cloudinary/sign` (le secret ne quitte jamais le serveur)
- Si la signature est indisponible → fallback sur le upload preset
- Drag & drop + barre de progression sur `ImageUpload` / `VideoUpload`

## Fonctionnalités

- Design **glassmorphism** (cartes verre, fond forêt éditable, dock macOS desktop)
- Contenu CV ATS (profil, expériences, compétences, formation, langues)
- **Mode Édition** : CRUD sections, upload Cloudinary, panneau Apparence
- Galerie `/projets` + détail `/projets/[id]`
- Export PDF (impression navigateur)
- Widgets flottants (desktop) et micro-interactions

## Notes

- Les données sont stockées dans le navigateur (`mon-portfolio-v2-data`). Pas d’auth serveur.
- Ne jamais committer `.env.local` ni l’API secret Cloudinary.
