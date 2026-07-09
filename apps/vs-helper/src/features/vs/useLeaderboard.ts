import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeaderboardEntry, UserProfile } from "@vs/shared";
import {
  fetchLeaderboardResult,
  isSyncConfigured,
  pullProfileResult,
  pushProfileResult,
  type SyncError,
} from "./sync";
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
  const profileResult = await pullProfileResult();
  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data ?? DEFAULT_PROFILE;
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
  error: SyncError | null;
  refresh: () => Promise<void>;
  // Returns a structured error when the save is rejected (e.g. validation or
  // auth failure), so the screen can render a specific message.
  saveProfile: (partial: Partial<UserProfile>) => Promise<SyncError | null>;
}

function getSyncError(err: unknown): SyncError {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "method" in err &&
    "path" in err &&
    "message" in err
  ) {
    return err as SyncError;
  }
  return {
    code: "invalid_response",
    method: "GET",
    path: "/leaderboard",
    message: "Unknown sync error",
  };
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
    queryFn: async () => {
      const result = await fetchLeaderboardResult();
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    enabled: signedIn,
  });

  const mutation = useMutation({
    mutationKey: ["profile", "save"],
    mutationFn: async (partial: Partial<UserProfile>) => {
      const current = profileQuery.data ?? DEFAULT_PROFILE;
      const result = await pushProfileResult({ ...current, ...partial });
      if (result.error) throw result.error;
      if (!result.data) {
        throw {
          code: "invalid_response",
          method: "PUT",
          path: "/profile",
          message: "Profile response is missing",
        } as SyncError;
      }
      return result.data;
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
        return null;
      } catch (err) {
        return getSyncError(err);
      }
    },
    [mutation],
  );

  const loading =
    checkingSession ||
    (signedIn && (profileQuery.isLoading || leaderboardQuery.isLoading));
  const error = mutation.error
    ? getSyncError(mutation.error)
    : profileQuery.error
      ? getSyncError(profileQuery.error)
      : leaderboardQuery.error
        ? getSyncError(leaderboardQuery.error)
        : null;

  return {
    loading,
    signedIn,
    profile: signedIn ? profileQuery.data ?? DEFAULT_PROFILE : DEFAULT_PROFILE,
    entries: signedIn ? leaderboardQuery.data ?? [] : [],
    error,
    refresh,
    saveProfile,
  };
}
