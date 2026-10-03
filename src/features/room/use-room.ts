"use client";

import { useCallback, useEffect, useState } from "react";
import type { PrivateMeView, PublicRoomView } from "@/domain/game/service";

type RoomSnapshot = {
  room: PublicRoomView | null;
  me: PrivateMeView | null;
  error: string | null;
  errorCode: string | null;
  loading: boolean;
  reconnecting: boolean;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const payload = data as { message?: string; error?: string };
    throw Object.assign(new Error(payload.message ?? "Lỗi mạng"), {
      code: payload.error,
      status: response.status,
    });
  }
  return data as T;
}

export function useRoom(code: string) {
  const [state, setState] = useState<RoomSnapshot>({
    room: null,
    me: null,
    error: null,
    errorCode: null,
    loading: true,
    reconnecting: false,
  });

  const refresh = useCallback(async () => {
    try {
      const roomRes = await fetchJson<{ room: PublicRoomView }>(`/api/rooms/${code}`);
      let me: PrivateMeView | null = null;
      const meRes = await fetch(`/api/rooms/${code}/me`);
      if (meRes.ok) {
        const payload = (await meRes.json()) as { me: PrivateMeView };
        me = payload.me;
      } else if (meRes.status !== 401) {
        const payload = (await meRes.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        if (payload.error === "PLAYER_REMOVED") {
          setState({
            room: roomRes.room,
            me: null,
            error: payload.message ?? "Bạn đã bị mời ra khỏi phòng.",
            errorCode: payload.error ?? null,
            loading: false,
            reconnecting: false,
          });
          return;
        }
      }
      setState({
        room: roomRes.room,
        me,
        error: null,
        errorCode: null,
        loading: false,
        reconnecting: false,
      });
    } catch (error) {
      const err = error as Error & { code?: string };
      setState((current) => ({
        ...current,
        loading: false,
        error: err.message,
        errorCode: err.code ?? "NETWORK",
      }));
    }
  }, [code]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);
    const source = new EventSource(`/api/rooms/${code}/events`);
    source.onopen = () => {
      setState((current) => ({ ...current, reconnecting: false }));
    };
    source.onerror = () => {
      setState((current) => ({ ...current, reconnecting: true }));
    };
    source.onmessage = () => {
      void refresh();
    };
    return () => {
      window.clearTimeout(initial);
      source.close();
    };
  }, [code, refresh]);

  useEffect(() => {
    const onOffline = () => setState((current) => ({ ...current, reconnecting: true }));
    const onOnline = () => {
      setState((current) => ({ ...current, reconnecting: false }));
      void refresh();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  const mutate = useCallback(
    async (path: string, body?: unknown) => {
      await fetchJson(`/api/rooms/${code}${path}`, {
        method: "POST",
        body: body === undefined ? "{}" : JSON.stringify(body),
      });
      await refresh();
    },
    [code, refresh],
  );

  return { ...state, refresh, mutate };
}
