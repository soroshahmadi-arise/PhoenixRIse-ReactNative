# Phoenix Rise

A universal Expo app — one codebase running on web, iOS, and Android.

This is the foundation only: a clean Expo + React Native + TypeScript + Expo Router project with a single Home screen. No product features are implemented yet.

## Stack

- Expo (SDK 52)
- React Native
- TypeScript
- Expo Router (file-based routing)

## Setup

```bash
npm install
```

## Run

Web:

```bash
npx expo start --web
```

iOS (requires macOS + Xcode for the simulator, or Expo Go on a device):

```bash
npx expo start --ios
```

Android (requires Android Studio for the emulator, or Expo Go on a device):

```bash
npx expo start --android
```

## Structure

```
app/
  _layout.tsx       Root Expo Router layout
  index.tsx         Home screen
components/
  Screen.tsx        Reusable layout wrapper (safe area, padding, max width)
  AppButton.tsx     Reusable primary / secondary button
lib/
  constants.ts      Colors, spacing, radii, font sizes
  types.ts          Shared TypeScript types
```

## Deployment

The web build auto-deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`
on every push to `main` (and the active feature branch). To enable it once:

1. In the repo on GitHub → **Settings → Pages**
2. Set **Source** to **GitHub Actions**

The workflow runs `npx expo export --platform web` with `EXPO_BASE_URL` set to
the repo path, then publishes the `dist/` folder. The live URL will be:

```
https://soroshahmadi-arise.github.io/PhoenixRIse-ReactNative/
```

Open it on your phone and use **Add to Home Screen** (Safari Share menu or
Chrome's install prompt) for an app-like experience.

## Notes

- One codebase for web, iOS, and Android — avoid platform-specific or native-only dependencies.
- Styling uses React Native `StyleSheet` only (no Tailwind, no UI libraries).
- All components use React Native primitives, not HTML elements, so they render on every platform.
