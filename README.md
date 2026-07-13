# Mooney — Mermaid Crafted

An e-commerce storefront for handmade goods: woven baskets, chiffon florals, stone art, and home décor. Built with Next.js 16, React 19, Tailwind CSS v4, and TypeScript.

![React Doctor Score](https://img.shields.io/badge/React%20Doctor-100%2F100-brightgreen)

## Features

- **Shop** — filterable product grid by category
- **Product pages** — detail view with color selection and add-to-cart
- **Cart** — persistent cart with quantity controls and free-shipping progress
- **Checkout** — order summary and shipping calculation
- **Aurora background** — animated gradient streaks with a dev-only theme editor
- **Local persistence** — cart survives page reloads via `localStorage`

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Language | TypeScript 5 |
| Data | Bundled JSON seed data (swap bodies in `src/lib/repository/` for a real API) |
| Quality | React Doctor (100/100) |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                  # Next.js pages (shop, product, cart, checkout)
  components/
    home/               # Hero, featured strip, category chips, info band
    layout/             # Header, footer, aurora background, theme editor
    product/            # Product detail client
    shop/               # Product card, shop client
    ui/                 # Shared primitives (Button, Container, icons)
  context/              # CartContext — global cart state
  lib/
    repository/         # Data-access layer (products, categories, orders)
    data/               # JSON seed data
    cart.ts             # Shipping logic
    types.ts            # Shared TypeScript types
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run doctor` | Run React Doctor health scan |

## Data layer

All data access goes through `src/lib/repository/`. The files currently read from bundled JSON — to connect a real backend, replace the function bodies with `fetch` calls or ORM queries. The async signatures stay the same so no callers change.
