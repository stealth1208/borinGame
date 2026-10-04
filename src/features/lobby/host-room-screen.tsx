"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SecretCard } from "@/features/game/secret-card";
import { StatusBadge } from "@/features/game/status-badge";
import { RoomQr } from "@/features/lobby/room-qr";
import { useWakeLock } from "@/features/lobby/use-wake-lock";
import { useRoom } from "@/features/room/use-room";
import { MIN_PLAYERS } from "@/domain/types";

function joinUrl(code: string): string {
  if (typeof window === "undefined") {
    return `/r/${code}`;
  }
  return `${window.location.origin}/r/${code}`;
}

export function HostRoomScreen({ code }: { code: string }) {
  const { room, me, error, errorCode, loading, reconnecting, mutate } = useRoom(code);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => joinUrl(code), [code]);
  useWakeLock(Boolean(room && room.status === "LOBBY"));

  useEffect(() => {
    const beat = () => {
      void fetch(`/api/rooms/${code}/heartbeat`, { method: "POST" });
    };
    beat();
    const id = window.setInterval(beat, 20000);
    return () => window.clearInterval(id);
  }, [code]);

  async function run(path: string, body?: unknown) {
    setBusy(true);
    try {
      await mutate(path, body);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Không được");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !room) {
    return <p className="p-6 text-center text-lg">Đang tải phòng...</p>;
  }
  if (error && !room) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-black">Không vào được phòng</h1>
        <p className="mt-3 text-white/70">{error}</p>
      </div>
    );
  }
  if (!room) {
    return null;
  }
  if (me && !me.isHost) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-black">Đây là màn hình chủ phòng</h1>
        <p className="mt-3 text-white/70">Bạn đang là người chơi. Mở link quét QR để chơi.</p>
        <Link className="mt-6 inline-block underline" href={`/game/${code}`}>
          Vào màn hình chơi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-6">
      {reconnecting ? (
        <p className="rounded-2xl bg-amber-300/20 px-4 py-3 text-center font-semibold">
          Đang kết nối lại...
        </p>
      ) : null}
      {room.hostDisconnected ? (
        <p className="rounded-2xl bg-white/10 px-4 py-3 text-center">Chủ phòng có vẻ mất kết nối.</p>
      ) : null}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Mã phòng</p>
          <h1 className="font-mono text-4xl font-black tracking-[0.2em]">{room.code}</h1>
        </div>
        <StatusBadge status={room.status} />
      </header>

      {room.status === "LOBBY" ? (
        <>
          <RoomQr url={url} />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="xl"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                });
              }}
            >
              {copied ? "✓ Đã chép" : "Sao chép link"}
            </Button>
            <Button
              className="flex-1"
              size="xl"
              variant="secondary"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({ title: "Imposter", url });
                } else {
                  void navigator.clipboard.writeText(url);
                }
              }}
            >
              Chia sẻ
            </Button>
          </div>
          <p className="text-center text-lg font-semibold">
            {room.playerCount} người đã vào
          </p>
          <ol className="space-y-2">
            {room.players.map((player, index) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3"
              >
                <span className="text-lg font-semibold">
                  {index + 1}. {player.nickname}
                  {player.isHost ? " (chủ phòng)" : ""}
                </span>
                {!player.isHost ? (
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void run("/remove", { playerId: player.id })}
                  >
                    Xóa
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
          <Button
            size="xl"
            className="mt-auto w-full"
            disabled={busy || room.playerCount < MIN_PLAYERS}
            onClick={() => void run("/start")}
          >
            Bắt đầu
          </Button>
          {room.playerCount < MIN_PLAYERS ? (
            <p className="text-center text-white/60">Cần ít nhất {MIN_PLAYERS} người.</p>
          ) : null}
          <Button
            size="xl"
            variant="destructive"
            className="w-full"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Đóng phòng? Tất cả người chơi sẽ bị ngắt kết nối.")) {
                void run("/close");
              }
            }}
          >
            Đóng phòng
          </Button>
        </>
      ) : null}

      {room.status !== "LOBBY" && room.status !== "CLOSED" ? (
        <>
          {me?.assignment ? <SecretCard assignment={me.assignment} /> : null}

          {room.category && room.category !== "RANDOM" ? (
            <div className="rounded-2xl bg-white/8 px-4 py-3 text-center">
              <p className="text-sm text-white/60">Chủ đề</p>
              <p className="text-lg font-bold">{room.category}</p>
            </div>
          ) : null}

          {room.speakingOrder.length > 0 &&
          (room.status === "ROLE_REVEAL" || room.status === "DISCUSSION") ? (
            <section>
              <h2 className="mb-2 text-lg font-bold">Thứ tự nói</h2>
              <ol className="space-y-2">
                {room.speakingOrder.map((player, index) => (
                  <li key={player.id} className="rounded-2xl bg-white/8 px-4 py-3 text-lg">
                    {index + 1}. {player.nickname}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {room.status === "ROLE_REVEAL" ? (
            <>
              <Button size="xl" className="w-full" disabled={busy} onClick={() => void run("/discussion")}>
                Bắt đầu thảo luận
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/restart")}>
                  Chơi lại
                </Button>
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/lobby")}>
                  Về sảnh
                </Button>
              </div>
            </>
          ) : null}

          {room.status === "DISCUSSION" ? (
            <>
              <Button size="xl" className="w-full" disabled={busy} onClick={() => void run("/voting")}>
                Bắt đầu vote
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/restart")}>
                  Chơi lại
                </Button>
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/lobby")}>
                  Về sảnh
                </Button>
              </div>
            </>
          ) : null}

          {room.status === "VOTING" ? (
            <>
              <p className="text-center text-2xl font-black">
                {room.voteProgress?.voted ?? 0} / {room.voteProgress?.total ?? 0} đã vote
              </p>
              <HostVoteList room={room} meId={me?.playerId} onVote={(id) => void run("/votes", { targetPlayerId: id })} />
              <Button
                size="xl"
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => void run("/finish-voting")}
              >
                Chốt vote
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/restart")}>
                  Chơi lại
                </Button>
                <Button size="xl" variant="secondary" disabled={busy} onClick={() => void run("/lobby")}>
                  Về sảnh
                </Button>
              </div>
            </>
          ) : null}

          {room.status === "RESULT" && room.result ? (
            <ResultBlock
              room={room}
              busy={busy}
              onNext={() => void run("/next")}
              onRevote={() => void run("/revote")}
              onLobby={() => void run("/lobby")}
              onRestart={() => void run("/restart")}
              onClose={() => void run("/close")}
            />
          ) : null}
        </>
      ) : null}

      {errorCode === "PLAYER_REMOVED" ? <p className="text-center">{error}</p> : null}
    </div>
  );
}

function HostVoteList({
  room,
  meId,
  onVote,
}: {
  room: NonNullable<ReturnType<typeof useRoom>["room"]>;
  meId?: string;
  onVote: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-center text-white/70">Ai là Impostor / Undercover?</p>
      {room.players
        .filter((player) => player.id !== meId)
        .map((player) => (
          <Button
            key={player.id}
            size="xl"
            variant="secondary"
            className="w-full"
            onClick={() => onVote(player.id)}
          >
            {player.nickname}
          </Button>
        ))}
    </div>
  );
}

function ResultBlock({
  room,
  busy,
  onNext,
  onRevote,
  onLobby,
  onRestart,
  onClose,
}: {
  room: NonNullable<ReturnType<typeof useRoom>["room"]>;
  busy: boolean;
  onNext: () => void;
  onRevote: () => void;
  onLobby: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const result = room.result;
  if (!result) {
    return null;
  }
  const special = result.revealedRoles.find(
    (row) => row.role === "IMPOSTOR" || row.role === "UNDERCOVER",
  );
  return (
    <section className="space-y-4">
      {result.isTie ? (
        <div className="rounded-3xl bg-white/10 p-5 text-center">
          <p className="text-3xl font-black">Hòa</p>
          <p className="mt-2 text-white/70">Vote lại hoặc lật bài luôn.</p>
        </div>
      ) : null}
      {special ? (
        <div
          className={`rounded-3xl p-5 text-center ${
            special.role === "IMPOSTOR"
              ? "bg-rose-600 text-white"
              : "bg-amber-300 text-zinc-950"
          }`}
        >
          <p className="text-sm font-bold tracking-[0.2em] uppercase">{special.role}</p>
          <p className="mt-1 text-4xl font-black">{special.nickname}</p>
        </div>
      ) : null}
      <div className="rounded-3xl bg-white/8 p-5">
        <p>Từ dân thường: <strong>{result.civilianWord}</strong></p>
        {result.undercoverWord ? (
          <p className="mt-2">
            Từ Undercover: <strong>{result.undercoverWord}</strong>
          </p>
        ) : null}
      </div>
      <div>
        <h3 className="mb-2 font-bold">Phiếu</h3>
        <ul className="space-y-1">
          {result.tallies.map((row) => (
            <li key={row.playerId}>
              {row.nickname} — {row.count}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-bold">Vote đúng</h3>
        <p>{result.correctVoters.map((player) => player.nickname).join(", ") || "Không ai"}</p>
      </div>
      <div>
        <h3 className="mb-2 font-bold">Điểm</h3>
        <ul>
          {result.scores.map((row) => (
            <li key={row.playerId}>
              {row.nickname}: {row.score}
            </li>
          ))}
        </ul>
      </div>
      {result.isTie ? (
        <Button size="xl" className="w-full" disabled={busy} onClick={onRevote}>
          Vote lại
        </Button>
      ) : null}
      <Button size="xl" className="w-full" disabled={busy} onClick={onNext}>
        Ván tiếp
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button size="xl" variant="secondary" disabled={busy} onClick={onRestart}>
          Chơi lại
        </Button>
        <Button size="xl" variant="secondary" disabled={busy} onClick={onLobby}>
          Về sảnh
        </Button>
      </div>
      <Button size="xl" variant="destructive" className="w-full" disabled={busy} onClick={onClose}>
        Đóng phòng
      </Button>
    </section>
  );
}

