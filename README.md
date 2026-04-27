# aghub-ui-prototype

Design prototype for [AGHub](https://github.com/AkaraChen/aghub) inference provider and coding agent management UI.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAkaraChen%2Fprovider-design)

### Manual deploy

```bash
pnpm install
pnpm build
```

Output is in `dist/`. Any static hosting works (Vercel, Netlify, Cloudflare Pages, etc.).

### Vercel config

Framework is auto-detected as Vite. No extra config needed. If needed, create `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Dev

```bash
pnpm install
pnpm dev
```

## Stack

- React 19 + TypeScript + Vite
- [HeroUI](https://heroui.com) component library
- TanStack React Query
- Tailwind CSS v4
