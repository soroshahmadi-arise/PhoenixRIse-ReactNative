# Phoenix Rise — Agent Conventions

Expo / React Native app (expo-router, TypeScript), also exported to web and
deployed to GitHub Pages on every push to `main`.

## Icons — REQUIRED

**All icons come from Phosphor (`phosphor-react-native`), via the wrapper at
`components/Icon.tsx`.** This is the single source of truth.

- ✅ Import icons from `@/components/Icon` — e.g. `import { Plus, X } from '@/components/Icon';`
- ❌ Never import directly from `phosphor-react-native` outside `components/Icon.tsx`.
- ❌ Never use text/emoji/unicode glyphs as icons (`›`, `→`, `✦`, `✧`, `✓`, `❋`, …).
- ❌ Never add another icon library (react-native-vector-icons, lucide, etc.).
  Phosphor has 3000+ icons — find one at https://phosphoricons.com.

**Adding an icon:** add a wrapper in `components/Icon.tsx` that spreads
`withIconDefaults(props)` (copy an existing export). If Phosphor's name differs
from the app's name, alias it (e.g. `Banknote` → Phosphor `Money`). Then import
the wrapper from `@/components/Icon`.

**Exempt:** `components/EmberOrb.tsx` uses `react-native-svg` for decorative
artwork (a gradient orb), not an icon — leave it.

## Before pushing

Push to `main` auto-deploys to GitHub Pages, so verify locally first:

```bash
npm run typecheck   # tsc --noEmit
npm test            # jest
npx expo export --platform web   # must build (Phosphor renders via react-native-svg on web)
```

## Layout / web notes

- Set `pointerEvents` via `style`, not as a JSX prop (react-native-web deprecates the prop form).
- Live site: https://soroshahmadi-arise.github.io/PhoenixRise-ReactNative/
