import "node-libs-expo/globals";
import React, { useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import WalletScreen from "./src/screens/WalletScreen";
import { AppProviders } from "./src/providers/AppProviders";
import { useTheme } from "./src/hooks/useTheme";
import { useLocalization } from "./src/hooks/useLocalization";
import type { ThemeDefinition } from "./src/theme/themes";

type BottomTab = "Home" | "Progress" | "Wallet" | "Profile";

type BottomTabItem = {
  key: BottomTab;
  icon: string;
  iconOutline: string;
  labelKey: string;
};

const bottomTabs: BottomTabItem[] = [
  { key: "Home", icon: "home", iconOutline: "home-outline", labelKey: "nav.home" },
  { key: "Progress", icon: "stats-chart", iconOutline: "stats-chart-outline", labelKey: "nav.progress" },
  { key: "Wallet", icon: "wallet", iconOutline: "wallet-outline", labelKey: "nav.wallet" },
  { key: "Profile", icon: "person", iconOutline: "person-outline", labelKey: "nav.profile" }
];

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<BottomTab>("Home");
  const { theme, mode } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeTabItem = bottomTabs.find((item) => item.key === activeTab)!;

  const renderActiveScreen = () => {
    if (activeTab === "Home") {
      return <HomeScreen />;
    }
    if (activeTab === "Profile") {
      return <ProfileScreen />;
    }
    if (activeTab === "Progress") {
      return <ProgressScreen />;
    }
    if (activeTab === "Wallet") {
      return <WalletScreen />;
    }
    return <PlaceholderScreen sectionLabel={t(activeTabItem.labelKey)} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={mode === "light" ? "dark-content" : "light-content"} />
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>
      <BottomNavigation activeTab={activeTab} onSelectTab={setActiveTab} />
    </SafeAreaView>
  );
};

type PlaceholderScreenProps = {
  sectionLabel: string;
};

const PlaceholderScreen = ({ sectionLabel }: PlaceholderScreenProps) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.placeholderContainer}>
      <Ionicons name="construct-outline" size={48} color={theme.colors.navInactive} />
      <Text style={styles.placeholderTitle}>{t("placeholder.comingSoonTitle", { section: sectionLabel })}</Text>
      <Text style={styles.placeholderDescription}>{t("placeholder.comingSoonDescription")}</Text>
    </View>
  );
};

type BottomNavigationProps = {
  activeTab: BottomTab;
  onSelectTab: (tab: BottomTab) => void;
};

const BottomNavigation = ({ activeTab, onSelectTab }: BottomNavigationProps) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.bottomNav}>
      {bottomTabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable key={tab.key} style={styles.bottomNavButton} onPress={() => onSelectTab(tab.key)}>
            <Ionicons
              name={(isActive ? tab.icon : tab.iconOutline) as never}
              size={22}
              color={isActive ? theme.colors.navActive : theme.colors.navInactive}
            />
            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (theme: ThemeDefinition) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    screenContainer: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32
    },
    placeholderTitle: {
      marginTop: 16,
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      textAlign: "center"
    },
    placeholderDescription: {
      marginTop: 10,
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: "center"
    },
    bottomNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.navBorder
    },
    bottomNavButton: {
      alignItems: "center",
      flex: 1
    },
    bottomNavLabel: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.navInactive
    },
    bottomNavLabelActive: {
      color: theme.colors.navActive
    }
  });
