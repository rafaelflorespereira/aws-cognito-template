import { useCallback, useState } from "react";
import type { LeaderboardEntry, UserProfile } from "@vs/shared";
import { fetchLeaderboard, isSyncConfigured, pullProfile, pushProfile } from "./sync";
import { getStoredTokens } from "@vs/auth";

const DEFAULT_PROFILE: UserProfile = { handle: "", leaderboardOptIn: false };

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
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await getStoredTokens();
      const hasSession = !!tokens && isSyncConfigured();
      setSignedIn(hasSession);
      if (!hasSession) {
        setProfile(DEFAULT_PROFILE);
        setEntries([]);
        return;
      }
      const [p, e] = await Promise.all([pullProfile(), fetchLeaderboard()]);
      setProfile(p ?? DEFAULT_PROFILE);
      setEntries(e ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = useCallback(
    async (partial: Partial<UserProfile>) => {
      const merged: UserProfile = { ...profile, ...partial };
      const saved = await pushProfile(merged);
      if (!saved) {
        setError("save-failed");
        return false;
      }
      setProfile(saved);
      setError(null);
      const e = await fetchLeaderboard();
      if (e) setEntries(e);
      return true;
    },
    [profile],
  );

  return { loading, signedIn, profile, entries, error, refresh, saveProfile };
}
