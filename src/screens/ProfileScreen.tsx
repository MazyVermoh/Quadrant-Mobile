import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useLocalization } from "../hooks/useLocalization";
import { useAuth } from "../hooks/useAuth";
import { useStrava } from "../hooks/useStrava";
import { useReferral } from "../hooks/useReferral";
import { useLevel } from "../hooks/useLevel";
import * as Clipboard from "expo-clipboard";
import type { ThemeDefinition } from "../theme/themes";

const AVATAR_PLACEHOLDER = "https://avatars.dicebear.com/api/identicon/quadrant.svg";

const ProfileScreen = () => {
  const { theme } = useTheme();
  const { t, language } = useLocalization();
  const { user, signInWithTelegram, signOut, isAuthenticating } = useAuth();
  const {
    athlete: stravaAthlete,
    connect: connectStrava,
    disconnect: disconnectStrava,
    refresh: refreshStrava,
    dailySteps: stravaSteps,
    isConnected: stravaConnected,
    isSyncing: stravaSyncing,
    lastSyncedAt: stravaLastSynced,
    error: stravaError,
    isConfigured: stravaConfigured
  } = useStrava();
  const { referralCode, referralLink, invitedFriends, addInvite } = useReferral();
  const {
    level,
    xp,
    currentLevelXp,
    levelXpTarget,
    xpToNextLevel,
    stageKey,
    progress,
    completedCourseIds,
    completedBookIds
  } = useLevel();
  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(false);
  const [newInviteName, setNewInviteName] = useState<string>("");
  const styles = useMemo(() => createStyles(theme), [theme]);
  const levelTitle = t(`levels.title.${stageKey}`);
  const profileXpLabel = t("levels.profileXp", { xp });
  const profileProgressLabel = t("levels.profileProgress", {
    current: currentLevelXp,
    target: levelXpTarget
  });
  const coursesLabel = t("levels.profileCourses", { count: completedCourseIds.length });
  const booksLabel = t("levels.profileBooks", { count: completedBookIds.length });
  const levelProgressPercent = Math.min(100, Math.round(progress * 100));

  const formatTime = (timestamp: number) => {
    try {
      const formatter = new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit" });
      return formatter.format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  const resolveStravaError = (code: string | undefined) => {
    if (!code) {
      return undefined;
    }
    if (code === "missing_config" || code.startsWith("missing_config") || code === "coming_soon") {
      return t("strava.error.comingSoon");
    }
    if (code === "cancelled") {
      return t("strava.error.cancelled");
    }
    return t("strava.error.generic");
  };

  const stravaErrorMessage = resolveStravaError(stravaError);

  const formattedInvites = useMemo(
    () =>
      invitedFriends.map((invite) => {
        try {
          const formatter = new Intl.DateTimeFormat(language, {
            month: "short",
            day: "numeric"
          });
          return {
            ...invite,
            formattedDate: formatter.format(new Date(invite.joinedAt))
          };
        } catch {
          return {
            ...invite,
            formattedDate: new Date(invite.joinedAt).toLocaleDateString()
          };
        }
      }),
    [invitedFriends, language]
  );

  const handleCopyCode = async () => {
    if (!referralCode) {
      return;
    }
    await Clipboard.setStringAsync(referralCode);
    Alert.alert(t("referrals.copyTitle"), t("referrals.copyCode"));
  };

  const handleCopyLink = async () => {
    if (!referralLink) {
      return;
    }
    await Clipboard.setStringAsync(referralLink);
    Alert.alert(t("referrals.copyTitle"), t("referrals.copyLink"));
  };

  const handleShareLink = async () => {
    try {
      const message = t("referrals.shareMessage", {
        link: referralLink,
        code: referralCode.toUpperCase()
      });
      await Share.share({ message });
    } catch (error) {
      console.warn("Failed to share referral link", error);
    }
  };

  const closeInviteModal = () => {
    setInviteModalVisible(false);
    setNewInviteName("");
  };

  const handleInviteSubmit = () => {
    if (!newInviteName.trim()) {
      Alert.alert(t("referrals.addInviteTitle"), t("referrals.addInviteValidation"));
      return;
    }
    addInvite(newInviteName.trim());
    closeInviteModal();
    Alert.alert(t("referrals.addInviteTitle"), t("referrals.addInviteSuccess"));
  };

  const handleTelegramConnect = async () => {
    try {
      await signInWithTelegram();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "missing_bot_id") {
          Alert.alert(t("auth.errors.title"), t("auth.errors.missingBotId"));
          return;
        }
        if (error.message === "cancelled") {
          Alert.alert(t("auth.errors.title"), t("auth.errors.cancelled"));
          return;
        }
        if (error.message === "invalid_payload") {
          Alert.alert(t("auth.errors.title"), t("auth.errors.invalidPayload"));
          return;
        }
      }
      Alert.alert(t("auth.errors.title"), t("auth.errors.generic"));
    }
  };

  const handleTelegramSignOut = () => {
    Alert.alert(t("auth.signOutTitle"), t("auth.signOutMessage"), [
      { text: t("actions.close"), style: "cancel" },
      {
        text: t("auth.signOutConfirm"),
        style: "destructive",
        onPress: () => signOut()
      }
    ]);
  };

  const handleStravaConnect = async () => {
    if (!stravaConfigured) {
      Alert.alert(t("strava.comingSoonTitle"), t("strava.comingSoonDescription"));
      return;
    }
    try {
      await connectStrava();
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      Alert.alert(t("strava.sectionTitle"), resolveStravaError(message) ?? t("strava.error.generic"));
    }
  };

  const handleStravaDisconnect = () => {
    Alert.alert(t("strava.disconnectTitle"), t("strava.disconnectMessage"), [
      { text: t("actions.close"), style: "cancel" },
      {
        text: t("strava.disconnectButton"),
        style: "destructive",
        onPress: () => disconnectStrava()
      }
    ]);
  };

  const handleStravaRefresh = async () => {
    try {
      await refreshStrava();
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      Alert.alert(t("strava.sectionTitle"), resolveStravaError(message) ?? t("strava.error.generic"));
    }
  };

  const isTelegramConnected = Boolean(user);

  const stravaStepsLabel = stravaConfigured && stravaConnected ? stravaSteps.toLocaleString() : "—";
  const stravaLastSyncLabel = stravaConfigured
    ? stravaConnected
      ? stravaLastSynced
        ? t("strava.lastSynced", { time: formatTime(stravaLastSynced) })
        : t("strava.lastSyncNever")
      : t("strava.connectDescription")
    : t("strava.comingSoonDescription");
  const stravaStatusMeta = stravaSyncing ? t("strava.syncing") : stravaLastSyncLabel;
  const stravaStepEstimateNote = stravaConfigured
    ? t("strava.stepEstimateNote")
    : t("strava.comingSoonDescription");

  const referralCodeLabel = referralCode ? referralCode.toUpperCase() : "—";
  const hasReferralLink = Boolean(referralLink);
  const referralLinkLabel = hasReferralLink ? (referralLink as string) : "—";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>
        {isTelegramConnected ? t("auth.profileTitle") : t("auth.connectTitle")}
        </Text>
        <Text style={styles.pageSubtitle}>
        {isTelegramConnected ? t("auth.profileSubtitle") : t("auth.connectSubtitle")}
        </Text>

      {isTelegramConnected ? (
        <>
          <View style={styles.accountCard}>
            <Image
              source={{ uri: user?.photo_url ?? AVATAR_PLACEHOLDER }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>
                {user?.first_name} {user?.last_name ?? ""}
              </Text>
              {user?.username && <Text style={styles.accountUsername}>@{user.username}</Text>}
              {user?.id && <Text style={styles.accountMeta}>{t("auth.telegramId", { id: user.id })}</Text>}
            </View>
          </View>

          <Pressable style={[styles.primaryButton, styles.signOutButton]} onPress={handleTelegramSignOut}>
            <Text style={styles.primaryButtonText}>{t("auth.signOutButton")}</Text>
          </Pressable>

          <View style={styles.noteBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.navActive} />
            <Text style={styles.noteText}>{t("auth.securityDisclaimer")}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoCard}>
            <View style={styles.iconBadge}>
              <Ionicons name="paper-plane-outline" size={26} color={theme.colors.accent} />
            </View>
            <Text style={styles.infoTitle}>{t("auth.telegramTitle")}</Text>
            <Text style={styles.infoDescription}>{t("auth.telegramDescription")}</Text>
            <Text style={styles.infoSteps}>{t("auth.telegramSteps")}</Text>
          </View>

          <Pressable
            style={[styles.primaryButton, isAuthenticating && styles.primaryButtonDisabled]}
            onPress={handleTelegramConnect}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{t("auth.connectButton")}</Text>
            )}
          </Pressable>

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.navActive} />
            <Text style={styles.noteText}>{t("auth.noteProxy")}</Text>
          </View>
        </>
      )}

      <View style={styles.levelCard}>
        <View style={styles.levelHeaderRow}>
          <View style={styles.levelIconBadge}>
            <Ionicons name="trophy-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.levelHeaderText}>
            <Text style={styles.levelCardTitle}>{t("levels.profileTitle")}</Text>
            <Text style={styles.levelCardSubtitle}>{t("levels.profileSubtitle")}</Text>
          </View>
        </View>
        <Text style={styles.levelCurrentLabel}>{t("header.levelDynamic", { level, title: levelTitle })}</Text>
        <Text style={styles.levelXpTotal}>{profileXpLabel}</Text>
        <View style={styles.levelProgressTrack}>
          <View style={[styles.levelProgressFill, { width: `${levelProgressPercent}%` }]} />
        </View>
        <Text style={styles.levelProgressMeta}>{profileProgressLabel}</Text>
        <View style={styles.levelStatsRow}>
          <View style={styles.levelStatItem}>
            <Ionicons name="play-circle-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.levelStatText}>{coursesLabel}</Text>
          </View>
          <View style={styles.levelStatItem}>
            <Ionicons name="book-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.levelStatText}>{booksLabel}</Text>
          </View>
        </View>
        <Text style={styles.levelProgressNext}>{t("header.xpToNext", { xp: xpToNextLevel })}</Text>
      </View>

      <View style={styles.referralCard}>
        <View style={styles.referralHeader}>
          <View style={styles.iconBadgeSmall}>
            <Ionicons name="gift-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.referralHeaderText}>
            <Text style={styles.referralTitle}>{t("referrals.sectionTitle")}</Text>
            <Text style={styles.referralSubtitle}>
              {isTelegramConnected
                ? t("referrals.sectionSubtitle")
                : t("referrals.sectionSubtitleAnonymous")}
            </Text>
          </View>
        </View>

        <View style={styles.referralCodeRow}>
          <Text style={styles.referralCodeValue}>{referralCodeLabel}</Text>
          <Pressable
            style={[styles.referralChip, !referralCode && styles.referralChipDisabled]}
            onPress={handleCopyCode}
            disabled={!referralCode}
          >
            <Ionicons name="copy-outline" size={15} color={theme.colors.accent} />
            <Text style={styles.referralChipText}>{t("referrals.copyCodeButton")}</Text>
          </Pressable>
        </View>

        <View style={styles.referralLinkRow}>
          <Text style={styles.referralLinkValue} numberOfLines={1}>
            {referralLinkLabel}
          </Text>
          <View style={styles.referralLinkActions}>
            <Pressable
              style={[styles.referralMiniButton, !hasReferralLink && styles.referralMiniButtonDisabled]}
              onPress={handleCopyLink}
              disabled={!hasReferralLink}
            >
              <Ionicons name="link-outline" size={15} color={theme.colors.accent} />
            </Pressable>
            <Pressable
              style={[styles.referralMiniButton, !hasReferralLink && styles.referralMiniButtonDisabled]}
              onPress={handleShareLink}
              disabled={!hasReferralLink}
            >
              <Ionicons name="share-social-outline" size={15} color={theme.colors.accent} />
            </Pressable>
          </View>
        </View>

        {formattedInvites.length === 0 ? (
          <Text style={styles.referralEmpty}>{t("referrals.emptyState")}</Text>
        ) : (
          <View style={styles.referralList}>
            {formattedInvites.map((invite) => (
              <View key={invite.id} style={styles.referralListItem}>
                <Ionicons name="person-add-outline" size={18} color={theme.colors.accent} />
                <View style={styles.referralInviteText}>
                  <Text style={styles.referralInviteName}>{invite.name}</Text>
                  <Text style={styles.referralInviteMeta}>
                    {t("referrals.inviteJoined", { date: invite.formattedDate })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[
            styles.secondaryButton,
            styles.referralAddButton,
            !isTelegramConnected && styles.secondaryButtonDisabled
          ]}
          onPress={() => {
            if (!isTelegramConnected) {
              handleTelegramConnect();
              return;
            }
            setInviteModalVisible(true);
          }}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              !isTelegramConnected && styles.secondaryButtonTextDisabled
            ]}
          >
            {t("referrals.addInviteButton")}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeading}>{t("strava.sectionTitle")}</Text>
      <Text style={styles.sectionSubheading}>
        {stravaConfigured ? t("strava.connectDescription") : t("strava.comingSoonLead")}
      </Text>

      <View style={styles.stravaCard}>
        <View style={styles.stravaHeader}>
          <View style={styles.iconBadgeSmall}>
            <Ionicons name="footsteps-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.stravaHeaderText}>
            <Text style={styles.stravaStatusTitle}>
              {stravaConfigured
                ? stravaConnected
                  ? t("strava.connected")
                  : t("strava.notConnected")
                : t("strava.comingSoonTitle")}
            </Text>
            <Text style={styles.stravaStatusMeta}>{stravaStatusMeta}</Text>
            {stravaAthlete?.firstname ? (
              <Text style={styles.stravaStatusMeta}>
                {stravaAthlete.firstname} {stravaAthlete.lastname ?? ""}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.stravaStepsRow}>
          <View style={styles.stravaStepsText}>
            <Text style={styles.stravaStepsLabel}>{t("strava.stepsToday")}</Text>
            <Text style={styles.stravaStepsMeta}>{stravaStepEstimateNote}</Text>
          </View>
          <Text style={styles.stravaStepsValue}>{stravaStepsLabel}</Text>
        </View>

        {stravaErrorMessage ? <Text style={styles.errorText}>{stravaErrorMessage}</Text> : null}

        {stravaConfigured && stravaConnected ? (
          <View style={styles.stravaButtonRow}>
            <Pressable
              style={[styles.secondaryButton, stravaSyncing && styles.secondaryButtonDisabled]}
              onPress={handleStravaRefresh}
              disabled={stravaSyncing}
            >
              {stravaSyncing ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <Text style={styles.secondaryButtonText}>{t("strava.refreshButton")}</Text>
              )}
            </Pressable>
            <Pressable style={styles.secondaryOutlineButton} onPress={handleStravaDisconnect}>
              <Text style={styles.secondaryOutlineButtonText}>{t("strava.disconnectButton")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.primaryButton, !stravaConfigured && styles.primaryButtonDisabled]}
            onPress={handleStravaConnect}
            disabled={!stravaConfigured}
          >
            <Text style={styles.primaryButtonText}>
              {stravaConfigured ? t("strava.connectButton") : t("strava.comingSoonAction")}
            </Text>
          </Pressable>
        )}

        <Text style={styles.stravaFooterNote}>
          {stravaConfigured ? t("strava.note") : t("strava.comingSoonDescription")}
        </Text>
      </View>

      </ScrollView>

      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInviteModal}
      >
        <View style={styles.referralModalBackdrop}>
          <Pressable style={styles.referralModalDismiss} onPress={closeInviteModal} />
          <View style={styles.referralModalCard}>
            <Text style={styles.referralModalTitle}>{t("referrals.modalTitle")}</Text>
            <Text style={styles.referralModalSubtitle}>{t("referrals.modalSubtitle")}</Text>
            <TextInput
              value={newInviteName}
              onChangeText={setNewInviteName}
              placeholder={t("referrals.modalPlaceholder")}
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.referralModalInput}
            />
            <View style={styles.referralModalActions}>
              <Pressable style={styles.referralModalAction} onPress={closeInviteModal}>
                <Text style={styles.referralModalActionText}>{t("actions.close")}</Text>
              </Pressable>
              <Pressable style={styles.referralModalActionPrimary} onPress={handleInviteSubmit}>
                <Text style={styles.referralModalActionPrimaryText}>
                  {t("referrals.modalConfirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: ThemeDefinition) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    scrollContainer: {
      padding: 24,
      paddingBottom: 160
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    pageSubtitle: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.textSecondary
    },
    infoCard: {
      marginTop: 28,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 24
    },
    iconBadge: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: theme.colors.highlight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    infoDescription: {
      marginTop: 10,
      fontSize: 14,
      color: theme.colors.textSecondary
    },
    infoSteps: {
      marginTop: 16,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    primaryButton: {
      marginTop: 24,
      backgroundColor: theme.colors.accent,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryButtonDisabled: {
      opacity: 0.65
    },
    primaryButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15
    },
    noteBox: {
      marginTop: 24,
      padding: 16,
      borderRadius: 14,
      backgroundColor: theme.colors.highlight,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12
    },
    noteText: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 13
    },
    levelCard: {
      marginTop: 28,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20
    },
    levelHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16
    },
    levelIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.highlight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12
    },
    levelHeaderText: {
      flex: 1
    },
    levelCardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    levelCardSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    levelCurrentLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.textPrimary
    },
    levelXpTotal: {
      marginTop: 6,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    levelProgressTrack: {
      marginTop: 14,
      height: 8,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceAlt,
      overflow: "hidden"
    },
    levelProgressFill: {
      height: "100%",
      backgroundColor: theme.colors.accent
    },
    levelProgressMeta: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    levelStatsRow: {
      marginTop: 14,
      flexDirection: "row",
      justifyContent: "space-between"
    },
    levelStatItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    levelStatText: {
      fontSize: 13,
      color: theme.colors.textPrimary,
      fontWeight: "600"
    },
    levelProgressNext: {
      marginTop: 12,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    accountCard: {
      marginTop: 28,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
      flexDirection: "row",
      alignItems: "center"
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 18,
      marginRight: 18
    },
    accountDetails: {
      flex: 1
    },
    accountName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    accountUsername: {
      marginTop: 6,
      fontSize: 14,
      color: theme.colors.navActive
    },
    accountMeta: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    signOutButton: {
      marginTop: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    sectionHeading: {
      marginTop: 36,
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    sectionSubheading: {
      marginTop: 6,
      fontSize: 14,
      color: theme.colors.textSecondary
    },
    referralCard: {
      marginTop: 36,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20
    },
    referralHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16
    },
    referralHeaderText: {
      flex: 1
    },
    referralTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    referralSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    referralCodeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    referralCodeValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    referralChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.highlight
    },
    referralChipDisabled: {
      opacity: 0.5
    },
    referralChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.accent
    },
    referralLinkRow: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    },
    referralLinkValue: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    referralLinkActions: {
      flexDirection: "row",
      gap: 8
    },
    referralMiniButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceAlt
    },
    referralMiniButtonDisabled: {
      opacity: 0.4
    },
    referralEmpty: {
      marginTop: 18,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    referralList: {
      marginTop: 12,
      gap: 12
    },
    referralListItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6
    },
    referralInviteText: {
      flex: 1
    },
    referralInviteName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textPrimary
    },
    referralInviteMeta: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    referralAddButton: {
      marginTop: 20
    },
    stravaCard: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20
    },
    iconBadgeSmall: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.highlight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12
    },
    stravaHeader: {
      flexDirection: "row",
      alignItems: "center"
    },
    stravaHeaderText: {
      flex: 1
    },
    stravaStatusTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    stravaStatusMeta: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    stravaStepsRow: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    stravaStepsText: {
      flex: 1,
      paddingRight: 12
    },
    stravaStepsLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.textPrimary
    },
    stravaStepsMeta: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    stravaStepsValue: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.colors.accent
    },
    errorText: {
      marginTop: 16,
      fontSize: 12,
      color: "#E53935"
    },
    stravaButtonRow: {
      marginTop: 20,
      flexDirection: "row",
      gap: 12
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12
    },
    secondaryButtonDisabled: {
      opacity: 0.6
    },
    secondaryButtonText: {
      color: theme.colors.accent,
      fontWeight: "600"
    },
    secondaryButtonTextDisabled: {
      color: theme.colors.textSecondary
    },
    secondaryOutlineButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12
    },
    secondaryOutlineButtonText: {
      color: theme.colors.textPrimary,
      fontWeight: "600"
    },
    stravaFooterNote: {
      marginTop: 16,
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    referralModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      padding: 24
    },
    referralModalDismiss: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    referralModalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20
    },
    referralModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary
    },
    referralModalSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    referralModalInput: {
      marginTop: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceAlt
    },
    referralModalActions: {
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12
    },
    referralModalAction: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    referralModalActionText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary
    },
    referralModalActionPrimary: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.accent
    },
    referralModalActionPrimaryText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff"
    }
  });

export default ProfileScreen;
