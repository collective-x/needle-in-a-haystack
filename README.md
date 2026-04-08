# Needle in a Haystack

**Women make up half the world's population. They receive 4% of biomedical research funding.**

A 3D visualization that makes the disparity in women's health research impossible to ignore. Thousands of translucent voxel cubes represent all biomedical research. One glowing needle buried inside represents women's health.

It's not a chart. It's a feeling.

---

## See It

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The camera pulls in, the haystack materializes, and then — one needle lights up.

---

## The Problem

Conditions that exclusively affect women — endometriosis, PCOS, preeclampsia, menopause — are chronically underfunded and understudied. The research that does exist is scattered across thousands of journals, buried under papers that don't consider sex as a variable.

Out of every 10,000 biomedical research papers, roughly 400 focus on women's health. That's the ratio. That's what this looks like in three dimensions.

---

## How It Works

- **Haystack**: ~8,000 voxel cubes arranged in a cosine-dome shape, rendered as translucent ghosts
- **Needle**: A single Three.js mesh — thin shaft, pointed tip, threaded eye — with a soft amber glow
- **Camera**: Dolly in (0–3s) → needle reveal (3–5.5s) → slow orbit with gentle breathing
- **Performance**: InstancedMesh for the haystack, single mesh for the needle. 60fps on integrated GPUs

Built with Three.js and Vite. No frameworks. No dependencies beyond Three.js.

---

## Deploy

```bash
npm run build
```

The `dist/` folder is a static site. Drop it on any host — Vercel, Netlify, Cloud Run, S3, a USB stick.

---

**[CollectiveX Health](https://collectivex.health)** — AI-powered health intelligence for women.
