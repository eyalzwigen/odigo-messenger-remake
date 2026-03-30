# Known Issues & Fixes

## Issue 1 — Scrollbar Cannot Be Hidden in Extension Popup

### Problem

The browser scrollbar appears in the extension popup even though `overflow-clip` is set on the root React `<div>` in `apps/extension/entrypoints/popup/App.tsx`.

### Root Cause

There are **three compounding reasons** this doesn't work:

#### 1. `overflow-clip` is applied to the wrong element

In `apps/extension/entrypoints/popup/App.tsx:72`:
```tsx
<div className="dark w-[400px] min-h-[500px] bg-background text-foreground overflow-clip p-2">
```

`overflow-clip` is on the inner React `<div>`. However, the browser extension popup renders its own window — and the scrollbar that appears is on the **`<html>` / `<body>` level**, controlled by the browser itself. Clipping overflow on a child element has no effect on the popup window's scrollbar.

#### 2. `html` and `body` have no scrollbar CSS

In `apps/extension/style.css`, the `@layer base` block only applies:
```css
@layer base {
  body { @apply bg-background text-foreground; } /* colors only */
  html { @apply font-sans; }                     /* font only */
}
```

No `overflow`, `scrollbar-width`, or `::-webkit-scrollbar` rules are applied to `html` or `body`, so the browser renders its default scrollbar on the popup window.

#### 3. Tailwind CSS v4 has no `scrollbar-hide` utility

This project uses **Tailwind CSS v4**, which does not include a `scrollbar-hide` utility class. In Tailwind v3, a plugin provided `scrollbar-hide` — in v4, applying that class does nothing. Scrollbar hiding requires explicit CSS rules.

### Fix

Add the following to `apps/extension/style.css` inside the existing `@layer base` block:

```css
@layer base {
  /* ... existing rules ... */

  html, body {
    overflow: hidden;
    scrollbar-width: none; /* Firefox */
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none; /* Chrome / Safari / Edge */
  }
}
```

This targets the correct elements (`html`/`body`) that the browser uses to decide whether to show a popup scrollbar, using two standard cross-browser techniques:
- `scrollbar-width: none` — modern CSS standard (Firefox, Chrome 121+)
- `::-webkit-scrollbar { display: none }` — legacy WebKit pseudo-element (Chrome, Safari, Edge)

---

## Issue 2 — Next.js Dev Server Fails to Resolve Workspace Packages

### Problem

The Next.js client (`apps/client`) fails to resolve the workspace packages `@odigo/ui` and `@odigo/shared` when running the dev server with Turbopack.

### Root Cause

In `apps/client/next.config.ts:5-7`:
```typescript
turbopack: {
  root: path.resolve(__dirname),  // ← Bug: resolves to apps/client/
}
```

`__dirname` in `next.config.ts` is the directory of that file — `apps/client/`. Setting `turbopack.root` to `apps/client/` tells Turbopack to look for `node_modules` starting from there.

However, this is a **Turbo monorepo** — `node_modules` and workspace symlinks are hoisted to the **repo root** (`C:\...\odigo-messenger\`). Turbopack cannot find `@odigo/ui` or `@odigo/shared` because they aren't in `apps/client/node_modules`.

The `transpilePackages: ['@odigo/ui', '@odigo/shared']` setting is correct but has no effect when Turbopack can't locate the packages in the first place.

### Fix

Change `next.config.ts` to point `turbopack.root` to the monorepo root:

```typescript
// apps/client/next.config.ts
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),  // ← repo root
  },
  transpilePackages: ['@odigo/ui', '@odigo/shared'],
};

export default nextConfig;
```

Alternatively, **remove the `turbopack` block entirely** — Next.js will auto-detect the workspace root from the presence of `package.json` files up the directory tree, which works correctly in most monorepo setups:

```typescript
const nextConfig: NextConfig = {
  transpilePackages: ['@odigo/ui', '@odigo/shared'],
};
```
