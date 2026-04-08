# Needle in a Haystack

**Women are half the population, but female-specific conditions receive just 1% of healthcare research and innovation investment.**

A 3D visualization that makes the disparity in women's health investment impossible to ignore. Thousands of translucent voxel cubes represent the broader landscape of healthcare research and innovation. One glowing needle buried inside represents the share invested in female-specific conditions beyond oncology.

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

The metric used in this piece is not a paper-count claim. It is an investment claim: women are half the population, but female-specific conditions receive just 1% of healthcare research and innovation investment.

More precisely, the sourced figure is that only 1% is invested in female-specific conditions beyond oncology. That's the ratio. That's what this looks like in three dimensions.

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

Source metric:

- 1% of healthcare research and innovation is invested in female-specific conditions beyond oncology
- Gates Foundation press release, August 4, 2025
- The Gates Foundation attributes the figure to a 2021 McKinsey-led analysis

**[CollectiveX Health](https://collectivex.health)** — AI-powered health intelligence for women.
