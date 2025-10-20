import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LocalizationProvider } from "./LocalizationProvider";
import { AuthProvider } from "./AuthProvider";
import { StravaProvider } from "./StravaProvider";
import { LibraryProvider } from "./LibraryProvider";
import { LevelProvider } from "./LevelProvider";
import { ReferralProvider } from "./ReferralProvider";
import { CommunityStatsProvider } from "./CommunityStatsProvider";
import { TokenBalanceProvider } from "./TokenBalanceProvider";
import { DailyStreakProvider } from "./DailyStreakProvider";
import { TonWalletProvider } from "./TonWalletProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => (
  <LocalizationProvider>
    <ThemeProvider>
      <LibraryProvider>
        <LevelProvider>
          <CommunityStatsProvider>
            <TokenBalanceProvider>
              <DailyStreakProvider>
                <TonWalletProvider>
                  <AuthProvider>
                    <ReferralProvider>
                      <StravaProvider>{children}</StravaProvider>
                    </ReferralProvider>
                  </AuthProvider>
                </TonWalletProvider>
              </DailyStreakProvider>
            </TokenBalanceProvider>
          </CommunityStatsProvider>
        </LevelProvider>
      </LibraryProvider>
    </ThemeProvider>
  </LocalizationProvider>
);
