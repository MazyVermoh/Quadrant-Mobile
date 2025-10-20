# Quadrant Mobile

Quadrant Mobile is an Expo-powered React Native prototype of the Quadrant learning and wellness ecosystem. It combines curated learning paths, an in-app library, gamified progress tracking, and web3/fitness integrations into a single mobile experience that can run on iOS, Android, and the web from one TypeScript codebase.

- Multi-tab experience covering learning, progress analytics, wallet management, and profile.
- Rich course and book catalog with rewards, streak incentives, and community stats.
- TON wallet connectivity powered by TonConnect with secure persistence.
- Strava OAuth integration to translate daily activities into in-app steps and streak credit.
- Localization (English, Spanish, Russian) and light/dark theming backed by React Context providers.

## Tech stack
- Expo 54 / React Native 0.81 with React 19 and TypeScript 5.
- Modular providers for theme, localization, authentication, TonConnect, Strava, and streak calculations.
- Custom data layer sourced from Notion (with JSON fallback) for the digital library.
- Expo SecureStore for persisting sensitive tokens on device.

## Getting started

### Prerequisites
- Node.js 18+ and npm 9+ (or your preferred package manager).
- Expo CLI (`npm install -g expo-cli`) if you want the global `expo` binary.
- Native tooling for the platforms you plan to target (Xcode for iOS, Android Studio + SDKs for Android).

### Installation
```bash
git clone <repo-url>
cd quadrant-mobile
npm install
cp .env.example .env
# fill the values described below
```

### Running the app
```bash
npm start        # Expo dev server with QR code
npm run android  # Build & install on an Android emulator/device
npm run ios      # Build & install on the iOS simulator/device
npm run web      # Run the project in a browser
```

Use the Expo Go app (or tunnels via LAN) to load the development build on physical devices. When targeting native builds, make sure the corresponding SDKs are available on your machine.

## Environment configuration

The app reads secrets from Expo `extra` fields and environment variables at runtime. Populate `.env` (or your shell) with the following keys:

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_TELEGRAM_BOT_ID` | Bot identifier used by the Telegram OAuth flow inside `AuthProvider`. Required to enable Quadrant account sign-in. |
| `EXPO_PUBLIC_STRAVA_CLIENT_ID` / `STRAVA_CLIENT_ID` | Strava application client ID. Either key works; Expo `EXPO_PUBLIC_*` variables are recommended for managed builds. |
| `EXPO_PUBLIC_STRAVA_CLIENT_SECRET` / `STRAVA_CLIENT_SECRET` | Strava client secret for token exchange. |

Expo automatically inlines variables prefixed with `EXPO_PUBLIC_` into the client bundle. For extra security on native builds you can mirror them inside `app.config.ts`/`app.json` using the `extra` field instead of plain `.env`.

## Project structure
- `App.tsx` — bootstraps the provider tree and bottom navigation shell.
- `src/components` — shared UI elements such as the Quadrant logo and cards.
- `src/constants` — static course, library, and reward datasets plus localization keys.
- `src/hooks` — reusable hooks for theming, localization, library state, Strava sync, TON wallet access, etc.
- `src/providers` — stateful context providers (authentication, levels, streaks, community stats, token balance, and more).
- `src/screens` — tab-level screens (`Home`, `Progress`, `Wallet`, `Profile`) that compose hooks and components into UX flows.
- `assets/` — bundled images, fonts, and splash assets.
- `notion_book_pages.json` — cached metadata for Notion-hosted book content (used as a fallback when the API is unavailable).

## Key integrations

### Learning & rewards
Course and library content is defined under `src/constants/data.ts` and localized via `src/i18n/locales.ts`. Progress, XP, and reward logic live in the `LevelProvider`, `DailyStreakProvider`, and related hooks to keep UI components declarative.

### Notion-powered library
`src/services/notion.ts` pulls structured book sections from Notion pages specified in `notion_book_pages.json`. The service gracefully falls back to bundled summaries when the Notion API cannot be reached, ensuring offline usability. Update the JSON file with your own Notion page IDs and metadata to customize the library.

### Strava activity sync
`StravaProvider` handles OAuth, token refresh, and daily activity polling. Provide valid Strava credentials (see `.env.example`) and whitelist Expo redirect URIs in your Strava developer settings. Qualifying activities are converted to steps to keep streaks and rewards in sync with real-world movement.

### TON wallet connectivity
`TonWalletProvider` bootstraps TonConnect with secure storage, wallet discovery, and deep-link based pairing. Replace the default manifest URL in `TonWalletProvider.tsx` with your own TonConnect manifest when moving from the demo environment to production.

### Localization & theming
The app ships with English, Spanish, and Russian copies alongside dynamic light/dark theming. `useLocalization` and `useTheme` expose helpers for translating strings and reading palette values inside UI components.

## Scripts
- `npm start` — run the Metro bundler via Expo.
- `npm run android` — build and launch the Android app.
- `npm run ios` — build and launch the iOS app.
- `npm run web` — run the Expo web target.

## Contributing
Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching strategy, coding guidelines, and the pull request checklist. The repository also includes a [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md); by participating you agree to uphold its standards.

## License
Distributed under the terms of the [MIT License](LICENSE). Update the copyright holder if the project should be published under a different license.

