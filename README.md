# aghub-ui-prototype

Design prototype for [aghub](https://github.com/AkaraChen/aghub) inference provider and coding agent management UI.

## Deploy

**Import** (connect your own repo):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2FFldicoahkiin%2Faghub-ui-tmp)

**Clone & Deploy** (fork a new copy):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFldicoahkiin%2Faghub-ui-tmp)

### Manual deploy

```bash
bun install
bun build
```

Output is in `dist/`. Any static hosting works (Vercel, Netlify, Cloudflare Pages, etc.).

### Vercel config

Framework is auto-detected as Vite. No extra config needed. If needed, create `vercel.json`:

```json
{
  "buildCommand": "bun build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Dev

```bash
bun install
bun dev
```

## Stack

- React 19 + TypeScript + Vite
- [HeroUI](https://heroui.com) component library
- TanStack React Query
- Tailwind CSS v4
