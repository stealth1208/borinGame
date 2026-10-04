"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { SecretCard } from "@/features/game/secret-card";
import { StatusBadge } from "@/features/game/status-badge";
import { useRoom } from "@/features/room/use-room";
import { cn } from "@/lib/utils";

export function PlayerRoomScreen({ code }: { code: string }) {
  const { room, me, error, errorCode, loading, reconnecting, mutate, refresh } = useRoom(code);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  async function join() {
    const name = nickname.trim();
    // Nickname is now optional - empty will get "Anonymous" assigned
    setBusy(true);
    try {
      await mutate("/join", { nickname: name });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Không vào được");
    } finally {
      setBusy(false);
    }
  }

  async function confirmVote() {
    if (!selected) {
      return;
    }
    setBusy(true);
    try {
      await mutate("/votes", { targetPlayerId: selected });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Vote thất bại");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !room) {
    return <p className="p-6 text-center text-lg">Đang tải...</p>;
  }
  if (error && !room) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-black">Không tìm thấy phòng</h1>
        <p className="mt-3 text-white/70">{error}</p>
        <Link className="mt-6 inline-block underline" href="/">
          Về trang chủ
        </Link>
      </div>
    );
  }
  if (!room) {
    return null;
  }

  if (errorCode === "PLAYER_REMOVED") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-black">Bạn đã bị mời ra</h1>
        <p className="mt-3 text-white/70">{error}</p>
      </div>
    );
  }

  if (!me) {
    if (room.status !== "LOBBY") {
      return (
        <div className="p-6 text-center">
          <h1 className="text-2xl font-black">Phòng đã bắt đầu</h1>
          <p className="mt-3 text-white/70">Nhờ chủ phòng mở sảnh nếu muốn vào ván sau.</p>
        </div>
      );
    }
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-8">
        <div>
          <p className="text-white/60">Phòng</p>
          <h1 className="font-mono text-4xl font-black tracking-[0.18em]">{room.code}</h1>
        </div>
        <h2 className="text-3xl font-black">Vào chơi</h2>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void join();
          }}
        >
          <div className="space-y-2">
            <input
              name="nickname"
              value={nickname}
              maxLength={16}
              placeholder="Biệt danh (không bắt buộc)"
              autoComplete="nickname"
              className="h-14 w-full rounded-2xl border border-input bg-transparent px-4 text-base outline-none"
              onChange={(event) => setNickname(event.target.value)}
            />
            <p className="text-sm text-white/60">Để trống = Anonymous</p>
          </div>
          <button
            type="submit"
            className={cn(buttonVariants({ size: "xl" }), "w-full")}
            disabled={busy}
          >
            {busy ? "Đang vào..." : "Vào"}
          </button>
        </form>
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
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Xin chào</p>
          <h1 className="text-3xl font-black">{me.nickname}</h1>
        </div>
        <StatusBadge status={room.status} />
      </header>

      {room.status === "LOBBY" ? (
        <section className="mt-8 text-center">
          <p className="text-3xl font-black">Bạn đã vào!</p>
          <p className="mt-3 text-lg text-white/70">Chờ chủ phòng bắt đầu...</p>
          {room.category && room.category !== "RANDOM" ? (
            <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-lg font-semibold">
              Chủ đề: {room.category}
            </p>
          ) : null}
          <p className="mt-8 text-2xl font-bold">{room.playerCount} người</p>
          <ul className="mt-4 space-y-2 text-left">
            {room.players.map((player) => (
              <li key={player.id} className="rounded-2xl bg-white/8 px-4 py-3 text-lg">
                {player.nickname}
                {player.isHost ? " · chủ phòng" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {room.status !== "LOBBY" && me.assignment ? <SecretCard assignment={me.assignment} /> : null}

      {room.status !== "LOBBY" && room.status !== "CLOSED" && room.category && room.category !== "RANDOM" ? (
        <div className="rounded-2xl bg-white/8 px-4 py-3 text-center">
          <p className="text-sm text-white/60">Chủ đề</p>
          <p className="text-lg font-bold">{room.category}</p>
        </div>
      ) : null}

      {(room.status === "ROLE_REVEAL" || room.status === "DISCUSSION") &&
      room.speakingOrder.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-bold">Thứ tự nói</h2>
          <ol className="space-y-2">
            {room.speakingOrder.map((player, index) => (
              <li key={player.id} className="rounded-2xl bg-white/8 px-4 py-3 text-lg">
                {index + 1}. {player.nickname}
              </li>
            ))}
          </ol>
          {room.status === "ROLE_REVEAL" ? (
            <p className="mt-4 text-center text-white/70">Nhìn màn hình chủ phòng. Nói chuyện trực tiếp.</p>
          ) : (
            <p className="mt-4 text-center text-white/70">Mô tả từ, đừng nói nguyên văn.</p>
          )}
        </section>
      ) : null}

      {room.status === "VOTING" ? (
        <section className="space-y-3">
          <h2 className="text-center text-3xl font-black">Ai là Impostor?</h2>
          {me.hasVoted ? (
            <p className="rounded-3xl bg-white/10 p-6 text-center text-xl font-semibold">
              Đã khóa phiếu. Chờ mọi người...
            </p>
          ) : (
            <>
              {room.players
                .filter((player) => player.id !== me.playerId)
                .map((player) => (
                  <Button
                    key={player.id}
                    size="xl"
                    variant={selected === player.id ? "default" : "secondary"}
                    className="w-full"
                    onClick={() => setSelected(player.id)}
                  >
                    {player.nickname}
                  </Button>
                ))}
              <Button size="xl" className="w-full" disabled={!selected || busy} onClick={() => void confirmVote()}>
                Khóa phiếu
              </Button>
            </>
          )}
          <p className="text-center text-white/70">
            {room.voteProgress?.voted ?? 0} / {room.voteProgress?.total ?? 0} đã vote
          </p>
        </section>
      ) : null}

      {room.status === "RESULT" && room.result ? (
        <section className="space-y-4">
          {room.result.isTie ? (
            <p className="text-center text-3xl font-black">Hòa</p>
          ) : null}
          {room.result.revealedRoles
            .filter((row) => row.role === "IMPOSTOR" || row.role === "UNDERCOVER")
            .map((row) => (
              <div
                key={row.playerId}
                className={`rounded-3xl p-5 text-center ${
                  row.role === "IMPOSTOR"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-300 text-zinc-950"
                }`}
              >
                <p className="text-sm font-bold tracking-[0.2em] uppercase">{row.role}</p>
                <p className="text-4xl font-black">{row.nickname}</p>
              </div>
            ))}
          <p>Từ dân thường: <strong>{room.result.civilianWord}</strong></p>
          {room.result.undercoverWord ? (
            <p>Từ Undercover: <strong>{room.result.undercoverWord}</strong></p>
          ) : null}
          <p>
            Vote đúng: {room.result.correctVoters.map((player) => player.nickname).join(", ") || "Không ai"}
          </p>
          <p className="text-center text-white/70">Chờ chủ phòng cho ván tiếp.</p>
        </section>
      ) : null}

      <button className="mt-auto text-sm text-white/40" type="button" onClick={() => void refresh()}>
        Làm mới
      </button>
    </div>
  );
}
