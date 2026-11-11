# mon-portfolio-v2

Portfolio glassmorphism de **Patrick Roziel** — monteur vidéo, motion designer et chargé de communication digitale.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- framer-motion
- Radix UI (dialogs, menus)
- **Vercel Blob** (images, vidéos légères / alpha, documents)
- YouTube non listé pour les grosses vidéos (showreel, démos, feature)
- Persistance locale (`localStorage` — métadonnées + URLs, pas les fichiers)

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner BLOB_READ_WRITE_TOKEN
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Vercel Blob (uploads)

Les **nouveaux** uploads (photo de profil, wallpapers, icônes, PDF, vidéos alpha / courtes…) partent vers **Vercel Blob**.  
Seule l’URL publique est enregistrée dans le portfolio (`localStorage`).

### Créer le token

1. [Vercel Dashboard](https://vercel.com/dashboard) → projet (ou équipe)
2. **Storage** → **Blob** → créer un store si besoin
3. Ouvrir le store → **Tokens** / onglet **`.env.local`**
4. Générer un token **Read-Write** → variable `BLOB_READ_WRITE_TOKEN`
5. Coller dans `.env.local` en local, ou **Settings → Environment Variables** sur Vercel
6. Redémarrer `npm run dev` / redéployer

| Variable | Rôle |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Token serveur Blob (jamais exposé au navigateur) |
| `ALLOW_BLOB_UPLOAD=true` | Autorise les uploads hors `development` (prod + mode édition) |
| `NEXT_PUBLIC_ALLOW_EDIT=true` | Active aussi le mode édition / uploads en prod |

- Route d’upload : `POST /api/blob/upload` (émission du token client + handshake `@vercel/blob`)
- UX inchangée : `ImageUpload` / `VideoUpload` / `DocumentUpload` (drag & drop + progression)
- Dossiers pathname : `patrick-roziel/{profile,projects,wallpaper,…}/…`

### Que stocker où ?

| Type | Stockage recommandé |
|---|---|
| Images, PDF, HTML, SVG, vidéos **légères** / **alpha** | **Vercel Blob** |
| Showreel, démos longues, feature cards vidéo | **YouTube non listé** (lien uniquement) |


## Fonctionnalités

- Design **glassmorphism** (cartes verre, fond éditable, dock)
- Contenu CV (profil, expériences, compétences, formation, langues)
- **Mode Édition** : CRUD sections, upload Blob, panneau Apparence / Menu
- Galerie `/projets` + détail `/projets/[id]`
- Export PDF (impression navigateur)
- Widgets flottants et micro-interactions

## Notes

- Les données sont stockées dans le navigateur (`mon-portfolio-v2-data`). Pas d’auth serveur.
- Ne jamais committer `.env.local` ni le token Blob.

## Préparation à la migration du back-office

La future version sans Neon conserve les contenus dans un **store privé Vercel Blob**, distinct du stockage public des médias, via `PRIVATE_BLOB_READ_WRITE_TOKEN`. Les médias récents utilisent Cloudflare R2. Cette branche reste en attente de sauvegarde et de migration : **ne pas fusionner avant vérification des données**. Voir `docs/MIGRATION-SANS-NEON-CLOUDINARY.md`.
