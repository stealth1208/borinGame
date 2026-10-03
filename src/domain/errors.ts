export type ErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_EXPIRED"
  | "ROOM_CLOSED"
  | "ROOM_STARTED"
  | "ROOM_FULL"
  | "INVALID_TRANSITION"
  | "NOT_HOST"
  | "MIN_PLAYERS"
  | "INVALID_ROLE_CONFIG"
  | "DUPLICATE_NICKNAME"
  | "NICKNAME_REQUIRED"
  | "PLAYER_REMOVED"
  | "ALREADY_VOTED"
  | "CANNOT_VOTE_SELF"
  | "NOT_VOTING"
  | "NO_SESSION"
  | "INVALID_INPUT"
  | "PLAYER_NOT_FOUND";

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;

  constructor(code: ErrorCode, message: string, httpStatus = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export const ERROR_MESSAGES_VI: Record<ErrorCode, string> = {
  ROOM_NOT_FOUND: "Không tìm thấy phòng.",
  ROOM_EXPIRED: "Phòng đã hết hạn.",
  ROOM_CLOSED: "Phòng đã đóng.",
  ROOM_STARTED: "Phòng đã bắt đầu, không thể vào thêm.",
  ROOM_FULL: "Phòng đã đầy.",
  INVALID_TRANSITION: "Không thể chuyển bước này.",
  NOT_HOST: "Chỉ chủ phòng mới làm được việc này.",
  MIN_PLAYERS: "Cần ít nhất 3 người chơi.",
  INVALID_ROLE_CONFIG: "Số Impostor / Undercover không hợp lệ.",
  DUPLICATE_NICKNAME: "Biệt danh này đã được dùng.",
  NICKNAME_REQUIRED: "Hãy nhập biệt danh.",
  PLAYER_REMOVED: "Bạn đã bị mời ra khỏi phòng.",
  ALREADY_VOTED: "Bạn đã khóa phiếu rồi.",
  CANNOT_VOTE_SELF: "Không thể tự vote mình.",
  NOT_VOTING: "Hiện chưa đến lúc vote.",
  NO_SESSION: "Chưa có phiên chơi. Hãy vào phòng lại.",
  INVALID_INPUT: "Thông tin không hợp lệ.",
  PLAYER_NOT_FOUND: "Không tìm thấy người chơi.",
};
