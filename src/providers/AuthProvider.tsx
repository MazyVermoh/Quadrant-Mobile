import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type AuthContextValue = {
  user?: TelegramAuthUser;
  signInWithTelegram: () => Promise<void>;
  signOut: () => void;
  isAuthenticating: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getTelegramBotId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const id = extra?.telegramBotId ?? extra?.TELEGRAM_BOT_ID ?? process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID;
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : undefined;
};

const extractTelegramUser = (url?: string): TelegramAuthUser | undefined => {
  if (!url) {
    return undefined;
  }
  const hashSection = url.split("#")[1];
  if (!hashSection) {
    return undefined;
  }
  const params = new URLSearchParams(hashSection);
  const rawResult = params.get("tgAuthResult");
  if (!rawResult) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(rawResult);
    return JSON.parse(decoded) as TelegramAuthUser;
  } catch (error) {
    console.warn("Failed to decode Telegram auth result", error);
    return undefined;
  }
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<TelegramAuthUser | undefined>(undefined);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const signInWithTelegram = useCallback(async () => {
    const botId = getTelegramBotId();
    if (!botId) {
      throw new Error("missing_bot_id");
    }

    setIsAuthenticating(true);
    try {
      const redirectUri = makeRedirectUri();
      const redirectOrigin = (() => {
        try {
          const parsed = new URL(redirectUri);
          return parsed.origin;
        } catch {
          return "https://auth.expo.io";
        }
      })();

      const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&embed=1&origin=${encodeURIComponent(
        redirectOrigin
      )}&return_to=${encodeURIComponent(redirectUri)}&request_access=write`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success") {
        const telegramUser = extractTelegramUser(result.url);
        if (!telegramUser) {
          throw new Error("invalid_payload");
        }
        setUser(telegramUser);
      } else if (result.type === "dismiss" || result.type === "cancel") {
        throw new Error("cancelled");
      } else {
        throw new Error("unknown_error");
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signInWithTelegram,
      signOut,
      isAuthenticating
    }),
    [user, signInWithTelegram, signOut, isAuthenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
};
