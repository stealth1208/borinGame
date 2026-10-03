"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-5 py-10">
      <div>
        <p className="text-sm font-semibold tracking-[0.25em] text-amber-300 uppercase">
          Party game
        </p>
        <h1 className="mt-3 text-6xl font-black tracking-tight">Imposter</h1>
        <p className="mt-4 text-lg leading-relaxed text-white/75">
          Một người cầm điện thoại. Cả bàn quét cùng một mã QR. Mỗi người nhận vai bí mật,
          rồi nói chuyện mặt đối mặt.
        </p>
      </div>
      <div className="space-y-3">
        <Link href="/create" className={cn(buttonVariants({ size: "xl" }), "w-full")}>
          Tạo phòng
        </Link>
        <form
          className="space-y-3 rounded-3xl bg-white/8 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) {
              router.push(`/r/${code.trim().toUpperCase()}`);
            }
          }}
        >
          <p className="text-center text-sm text-white/60">Đã có mã phòng?</p>
          <input
            value={code}
            placeholder="AB7KQ2"
            className="h-14 w-full rounded-2xl border border-input bg-transparent px-4 text-center font-mono text-base tracking-[0.3em] uppercase outline-none"
            onChange={(event) => setCode(event.target.value)}
          />
          <button
            type="submit"
            className={cn(buttonVariants({ size: "xl", variant: "secondary" }), "w-full")}
            disabled={!code.trim()}
          >
            Vào phòng
          </button>
        </form>
      </div>
    </div>
  );
}
