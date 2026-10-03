import { Badge } from "@/components/ui/badge";
import type { PublicRoomView } from "@/domain/game/service";

const STATUS_LABEL: Record<PublicRoomView["status"], string> = {
  LOBBY: "Sảnh chờ",
  ASSIGNING: "Đang chia bài",
  ROLE_REVEAL: "Xem bí mật",
  DISCUSSION: "Đang mô tả",
  VOTING: "Đang vote",
  RESULT: "Kết quả",
  CLOSED: "Đã đóng",
};

export function StatusBadge({ status }: { status: PublicRoomView["status"] }) {
  return <Badge className="h-7 px-3 text-sm">{STATUS_LABEL[status]}</Badge>;
}
