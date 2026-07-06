import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeaderboardEntry, UserProfile } from "@vs/shared";
import { fetchLeaderboard, isSyncConfigured, pullProfile, pushProfile } from "./sync";
import { getStoredTokens, parseIdToken } from "@vs/auth";

const DEFAULT_PROFILE: UserProfile = { handle: "", leaderboardOptIn: false };

// HANDLE_RE in account.tsx / the backend only allows letters, digits, and
// underscores — Google display names have spaces/accents/etc., so this is a
// starting suggestion the user can still edit, not the saved value.
function suggestHandle(googleName: string): string {
  const cleaned = googleName
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : "";
}

async function fetchProfile(): Promise<UserProfile> {
  const tokens = await getStoredTokens();
  const profile = (await pullProfile()) ?? DEFAULT_PROFILE;
  if (!profile.handle && tokens) {
    const googleName = parseIdToken(tokens.idToken).name;
    const suggested = googleName ? suggestHandle(googleName) : "";
    if (suggested) return { ...profile, handle: suggested };
  }
  return profile;
}

export interface UseLeaderboard {
  loading: boolean;
  signedIn: boolean;
  profile: UserProfile;
  entries: LeaderboardEntry[];
  error: string | null;
  refresh: () => Promise<void>;
  // Returns false (and leaves `error` set) if the save was rejected, e.g. an
  // invalid handle — lets the screen keep the user's input instead of
  // silently reverting it.
  saveProfile: (partial: Partial<UserProfile>) => Promise<boolean>;
}

export function useLeaderboard(): UseLeaderboard {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const checkSession = useCallback(async () => {
    const tokens = await getStoredTokens();
    setSignedIn(!!tokens && isSyncConfigured());
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: signedIn,
  });

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (await fetchLeaderboard()) ?? [],
    enabled: signedIn,
  });

  const mutation = useMutation({
    mutationKey: ["profile", "save"],
    mutationFn: async (partial: Partial<UserProfile>) => {
      const current = profileQuery.data ?? DEFAULT_PROFILE;
      const saved = await pushProfile({ ...current, ...partial });
      if (!saved) throw new Error("Failed to save leaderboard profile");
      return saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["profile"], saved);
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const refresh = useCallback(async () => {
    await checkSession();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
    ]);
  }, [checkSession, queryClient]);

  const saveProfile = useCallback(
    async (partial: Partial<UserProfile>) => {
      try {
        await mutation.mutateAsync(partial);
        return true;
      } catch {
        return false;
      }
    },
    [mutation],
  );

  const loading =
    checkingSession ||
    (signedIn && (profileQuery.isLoading || leaderboardQuery.isLoading));

  return {
    loading,
    signedIn,
    profile: signedIn ? profileQuery.data ?? DEFAULT_PROFILE : DEFAULT_PROFILE,
    entries: signedIn ? leaderboardQuery.data ?? [] : [],
    error: mutation.isError ? "save-failed" : null,
    refresh,
    saveProfile,
  };
}
