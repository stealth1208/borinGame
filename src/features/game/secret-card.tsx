"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PrivateMeView } from "@/domain/game/service";

const HOLD_MS = 800;

const ROLE_COPY: Record<string, string> = {
  CIVILIAN: "DÂN THƯỜNG",
  IMPOSTOR: "IMPOSTOR",
  UNDERCOVER: "UNDERCOVER",
  MR_WHITE: "MR. WHITE",
};

export function SecretCard({ assignment }: { assignment: NonNullable<PrivateMeView["assignment"]> }) {
  const [phase, setPhase] = useState<"hidden" | "revealed" | "memorized">("hidden");
  const timer = useRef<number | null>(null);

  const startHold = () => {
    timer.current = window.setTimeout(() => setPhase("revealed"), HOLD_MS);
  };
  const cancelHold = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  if (phase === "memorized") {
    return (
      <section className="rounded-3xl bg-white/8 p-6 text-center">
        <p className="text-xl font-semibold">Đã ẩn bí mật</p>
        <p className="mt-2 text-white/70">Đừng để người cạnh bàn nhìn thấy màn hình.</p>
        <Button className="mt-6 w-full" size="xl" onClick={() => setPhase("hidden")}>
          Hiện lại
        </Button>
      </section>
    );
  }

  if (phase === "hidden") {
    return (
      <section className="rounded-3xl bg-white/8 p-6 text-center">
        <p className="text-2xl font-black tracking-tight">Bí mật đã sẵn sàng</p>
        <p className="mt-2 text-white/70">Giữ nút khoảng 1 giây. Đừng để người khác thấy.</p>
        <Button
          className="mt-8 w-full"
          size="xl"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
        >
          Giữ để xem
        </Button>
      </section>
    );
  }

  const tone =
    assignment.role === "CIVILIAN"
      ? {
          card: "bg-emerald-400 text-emerald-950",
          button: "bg-emerald-950 text-emerald-50 hover:bg-emerald-900",
        }
      : assignment.role === "IMPOSTOR"
        ? {
            card: "bg-rose-600 text-white",
            button: "bg-rose-950 text-rose-50 hover:bg-rose-900",
          }
        : {
            card: "bg-amber-300 text-zinc-950",
            button: "bg-zinc-950 text-amber-200 hover:bg-zinc-800",
          };

  return (
    <section className={`rounded-3xl px-6 py-8 text-center ${tone.card}`}>
      <p className="text-sm font-semibold tracking-[0.2em] uppercase">Vai của bạn</p>
      <h2 className="mt-2 text-4xl font-black">{ROLE_COPY[assignment.role] ?? assignment.role}</h2>
      {assignment.word ? (
        <p className="mt-6 text-3xl font-black">{assignment.word}</p>
      ) : (
        <p className="mt-6 text-xl font-semibold">Bạn không biết từ bí mật.</p>
      )}
      <p className="mt-4 text-base font-medium">{assignment.message}</p>
      {assignment.teammates && assignment.teammates.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-zinc-950/10 px-4 py-3">
          <p className="text-sm font-bold uppercase">Đồng đội</p>
          <p className="mt-1 text-base font-semibold">
            {assignment.teammates.join(", ")}
          </p>
        </div>
      ) : null}
      <Button
        className={`mt-8 w-full ${tone.button}`}
        size="xl"
        onClick={() => setPhase("memorized")}
      >
        Tôi đã nhớ
      </Button>
    </section>
  );
}
