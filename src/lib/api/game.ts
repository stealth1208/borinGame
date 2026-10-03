import { ZodError } from "zod";
import { DomainError, ERROR_MESSAGES_VI } from "@/domain/errors";
import { createGameService } from "@/domain/game/service";
import { getGameStore, getStorageMode } from "@/lib/store";

export function getGameService() {
  return createGameService(getGameStore(), getStorageMode());
}

export function jsonError(error: unknown): Response {
  if (error instanceof DomainError) {
    return Response.json(
      {
        error: error.code,
        message: ERROR_MESSAGES_VI[error.code],
      },
      { status: error.httpStatus },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "INVALID_INPUT", message: ERROR_MESSAGES_VI.INVALID_INPUT },
      { status: 400 },
    );
  }
  console.error(error);
  return Response.json(
    { error: "INTERNAL", message: "Có lỗi xảy ra. Thử lại nhé." },
    { status: 500 },
  );
}
