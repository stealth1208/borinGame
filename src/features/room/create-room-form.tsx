"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GAME_MODES, type GameMode } from "@/domain/types";
import { maxSpecialRoles } from "@/domain/round/role-config";

const fieldClassName =
  "h-14 w-full min-w-0 rounded-2xl border border-input bg-transparent px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateRoomForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [mode, setMode] = useState<GameMode>("CLASSIC_IMPOSTOR");
  const [impostorCount, setImpostorCount] = useState(1);
  const [category, setCategory] = useState("RANDOM");
  const [roundCount, setRoundCount] = useState(1);
  const [impostorsKnowEachOther, setImpostorsKnowEachOther] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/rooms")
      .then((response) => response.json())
      .then((data: { categories?: string[] }) => setCategories(data.categories ?? []))
      .catch(() => undefined);
  }, []);

  const maxForTen = maxSpecialRoles(10);

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("nickname") ?? nickname).trim();
    // Nickname is now optional - empty is OK, will get "Anonymous" assigned
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: name,
          mode,
          impostorCount,
          category,
          roundCount: Number.isFinite(roundCount) && roundCount >= 1 ? roundCount : 1,
          impostorsKnowEachOther,
        }),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const payload = data as { message?: string };
        throw new Error(payload.message ?? `Không tạo được phòng (${response.status})`);
      }
      const payload = data as { room?: { code?: string } };
      const code = payload.room?.code;
      if (!code) {
        throw new Error("Server không trả mã phòng.");
      }
      router.push(`/host/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi mạng. Thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={createRoom}>
      <div className="space-y-2">
        <Label htmlFor="nickname">Biệt danh chủ phòng (không bắt buộc)</Label>
        <input
          id="nickname"
          name="nickname"
          value={nickname}
          maxLength={16}
          autoComplete="nickname"
          placeholder="Để trống = Anonymous"
          className={fieldClassName}
          onChange={(event) => setNickname(event.target.value)}
        />
        <p className="text-sm text-white/60">Nếu không nhập, bạn sẽ là &ldquo;Anonymous&rdquo;</p>
      </div>
      <div className="space-y-2">
        <Label>Chế độ</Label>
        <div className="grid grid-cols-1 gap-2">
          {GAME_MODES.map((item) => (
            <Button
              key={item}
              type="button"
              size="xl"
              variant={mode === item ? "default" : "secondary"}
              onClick={() => setMode(item)}
            >
              {item === "CLASSIC_IMPOSTOR" ? "Classic Impostor" : "Undercover"}
            </Button>
          ))}
        </div>
        <p className="text-sm text-white/60">
          {mode === "CLASSIC_IMPOSTOR"
            ? "Dân thường có từ. Impostor không có từ."
            : "Undercover nhận từ gần giống."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="impostors">
          Số {mode === "UNDERCOVER" ? "Undercover" : "Impostor"}
        </Label>
        <div className="flex gap-2">
          {[1, 2].filter((count) => count <= maxForTen).map((count) => (
            <Button
              key={count}
              type="button"
              size="xl"
              className="flex-1"
              variant={impostorCount === count ? "default" : "secondary"}
              onClick={() => setImpostorCount(count)}
            >
              {count}
            </Button>
          ))}
        </div>
        <p className="text-sm text-white/60">
          4–6 người: tối đa 1. 7–10 người: tối đa 2. Server vẫn kiểm tra lúc bắt đầu.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Chủ đề từ</Label>
        <select
          id="category"
          name="category"
          className={cn(fieldClassName, "bg-zinc-950")}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="RANDOM">Ngẫu nhiên</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rounds">Số ván (tham khảo)</Label>
        <input
          id="rounds"
          name="roundCount"
          type="number"
          min={1}
          max={20}
          value={roundCount}
          className={fieldClassName}
          onChange={(event) => setRoundCount(Number(event.target.value) || 1)}
        />
        <p className="text-sm text-white/60">Chủ phòng bấm Ván tiếp để chơi tiếp với cùng mọi người.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="knowEachOther">
            {mode === "UNDERCOVER" ? "Undercover" : "Impostor"} biết nhau
          </Label>
          <button
            type="button"
            role="switch"
            aria-checked={impostorsKnowEachOther}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              impostorsKnowEachOther ? "bg-primary" : "bg-white/20"
            )}
            onClick={() => setImpostorsKnowEachOther((prev) => !prev)}
          >
            <span
              className={cn(
                "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-transform",
                impostorsKnowEachOther ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
        <p className="text-sm text-white/60">
          Khi bật, các {mode === "UNDERCOVER" ? "Undercover" : "Impostor"} sẽ thấy tên đồng đội.
        </p>
      </div>
      {error ? (
        <p className="rounded-2xl bg-destructive/20 px-4 py-3 text-base font-medium text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className={cn(buttonVariants({ size: "xl" }), "w-full")}
        disabled={busy}
      >
        {busy ? "Đang tạo..." : "Tạo phòng"}
      </button>
    </form>
  );
}
