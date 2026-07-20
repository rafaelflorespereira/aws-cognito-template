import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Group, LeaderboardEntry } from "@vs/shared";
import {
  createGroupResult,
  fetchGroupLeaderboardResult,
  fetchGroupsResult,
  isSyncConfigured,
  joinGroupResult,
  leaveGroupResult,
  type SyncError,
} from "./sync";
import { getStoredTokens } from "@vs/auth";

function getSyncError(err: unknown, path: string): SyncError {
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
  return { code: "invalid_response", method: "GET", path, message: "Unknown sync error" };
}

export interface UseGroups {
  loading: boolean;
  signedIn: boolean;
  groups: Group[];
  error: SyncError | null;
  refresh: () => Promise<void>;
  createGroup: (name: string) => Promise<SyncError | null>;
  joinGroup: (groupId: string) => Promise<SyncError | null>;
  leaveGroup: (groupId: string) => Promise<SyncError | null>;
}

export function useGroups(): UseGroups {
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

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const result = await fetchGroupsResult();
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    enabled: signedIn,
  });

  const createMutation = useMutation({
    mutationKey: ["groups", "create"],
    mutationFn: (name: string) => createGroupResult(name),
    onSuccess: (result) => {
      if (!result.error) void queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const joinMutation = useMutation({
    mutationKey: ["groups", "join"],
    mutationFn: (groupId: string) => joinGroupResult(groupId),
    onSuccess: (result) => {
      if (!result.error) void queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const leaveMutation = useMutation({
    mutationKey: ["groups", "leave"],
    mutationFn: (groupId: string) => leaveGroupResult(groupId),
    onSuccess: (result) => {
      if (!result.error) void queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const refresh = useCallback(async () => {
    await checkSession();
    await queryClient.invalidateQueries({ queryKey: ["groups"] });
  }, [checkSession, queryClient]);

  const createGroup = useCallback(
    async (name: string) => {
      const result = await createMutation.mutateAsync(name);
      return result.error;
    },
    [createMutation],
  );

  const joinGroup = useCallback(
    async (groupId: string) => {
      const result = await joinMutation.mutateAsync(groupId);
      return result.error;
    },
    [joinMutation],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      const result = await leaveMutation.mutateAsync(groupId);
      return result.error;
    },
    [leaveMutation],
  );

  const loading = checkingSession || (signedIn && groupsQuery.isLoading);
  const error = groupsQuery.error ? getSyncError(groupsQuery.error, "/groups") : null;

  return {
    loading,
    signedIn,
    groups: signedIn ? groupsQuery.data ?? [] : [],
    error,
    refresh,
    createGroup,
    joinGroup,
    leaveGroup,
  };
}

export interface UseGroupLeaderboard {
  loading: boolean;
  entries: LeaderboardEntry[];
  error: SyncError | null;
  refresh: () => Promise<void>;
}

export function useGroupLeaderboard(groupId: string | undefined): UseGroupLeaderboard {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["group-leaderboard", groupId],
    queryFn: async () => {
      const result = await fetchGroupLeaderboardResult(groupId as string);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    enabled: !!groupId,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["group-leaderboard", groupId] });
  }, [queryClient, groupId]);

  return {
    loading: query.isLoading,
    entries: query.data ?? [],
    error: query.error
      ? getSyncError(query.error, `/groups/${groupId}/leaderboard`)
      : null,
    refresh,
  };
}
