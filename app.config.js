import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: config.name ?? "Quadrant Mobile",
  slug: config.slug ?? "quadrant-mobile",
  version: config.version ?? "1.0.0",
  scheme: config.scheme ?? "quadrant",
  android: {
    ...config.android,
    package: config.android?.package ?? "com.muslim.quadrant"
  },
  ios: {
    ...config.ios,
    bundleIdentifier: config.ios?.bundleIdentifier ?? "com.muslim.quadrant"
  },
  extra: {
    ...config.extra,
    telegramBotId: process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID ?? null,
    stravaClientId: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? null,
    stravaClientSecret: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ?? null,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null
  }
});
