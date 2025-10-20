import { useAuthContext } from "../providers/AuthProvider";

export const useAuth = () => {
  const { user, signInWithTelegram, signOut, isAuthenticating } = useAuthContext();
  return { user, signInWithTelegram, signOut, isAuthenticating };
};
