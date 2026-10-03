import Link from "next/link";
import { CreateRoomForm } from "@/features/room/create-room-form";

export default function CreatePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link href="/" className="text-sm text-white/60">
        ← Về trang chủ
      </Link>
      <h1 className="text-4xl font-black">Tạo phòng</h1>
      <p className="text-white/70">Chọn chế độ rồi đưa QR cho cả bàn quét.</p>
      <CreateRoomForm />
    </div>
  );
}
