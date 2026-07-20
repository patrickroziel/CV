# mon-portfolio-v2

Portfolio glassmorphism de **Patrick Roziel** — monteur vidéo, motion designer et chargé de communication digitale.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- framer-motion
- Radix UI (dialogs, menus)
- Persistance locale (`localStorage`)

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- Design **glassmorphism** (cartes verre, fond forêt éditable, dock macOS desktop)
- Contenu CV ATS (profil, expériences, compétences, formation, langues)
- **Mode Édition** : CRUD sections, upload photo/projets, panneau Apparence (fond + overlay + dock)
- Galerie `/projets` + détail `/projets/[id]`
- Export PDF (impression navigateur)
- Widgets flottants (desktop) et micro-interactions

## Notes

- Les données sont stockées dans le navigateur (`mon-portfolio-v2-data`). Pas d’auth serveur.
- Pour le fond d’écran, préférer une **URL** (Unsplash…) plutôt qu’un gros upload (quota `localStorage`).
