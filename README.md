# Comet Watch Map

Interactive 3D solar system that plots ~1,300 short-period comets from NASA JPL's
Small-Body Database, with real Keplerian orbital math, textured planets, accurate
relative planet sizes, the 22 major moons, and comet markers colored by predicted
gas-emission band (sodium tail, C₂ Swan bands, CO⁺ ion tail, etc.).

Built as a single static page + Cloudflare Pages Function for the JPL proxy. No
build step.

## Stack

- **Three.js r128** — 3D scene, raycasting, OrbitControls
- **NASA JPL SBDB** — bulk + single-object endpoints for comet data
- **Cloudflare Pages** — static hosting + edge-cached JPL proxy

## Layout

```
.
├── index.html                       — the whole app (HTML + CSS + JS inline)
├── functions/jpl/[[path]].js        — Pages Function: proxies /jpl/* → ssd-api.jpl.nasa.gov
├── wrangler.toml                    — Pages config
└── README.md
```

## Deploy to Cloudflare Pages

```sh
npx wrangler pages deploy .
```

Or connect this repo via the Cloudflare Pages dashboard for git-driven deploys.

## Local dev

```sh
npx wrangler pages dev .
```

Serves the static page at `http://localhost:8788` with the `/jpl/*` proxy
function active. JPL's API has no CORS headers, so you must run through
the Pages dev server (or the deployed site) — opening `index.html` over
`file://` won't work.

## Disclaimer

For informational and educational purposes only. Planet-to-planet sizes
and comet orbital elements are accurate; orbital distances, the sun's
radius, and moon distances are stylized for visibility.
