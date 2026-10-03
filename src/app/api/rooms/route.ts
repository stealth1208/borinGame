import { createRoomSchema } from "@/lib/validation/api";
import { getGameService, jsonError } from "@/lib/api/game";
import { setSessionCookie } from "@/lib/session/cookies";
import { getStorageMode } from "@/lib/store";

export async function GET() {
  try {
    const service = getGameService();
    return Response.json({
      categories: await service.listCategories(),
      storageMode: getStorageMode(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createRoomSchema.parse(body);
    const service = getGameService();
    const result = await service.createRoom(parsed);
    await setSessionCookie(result.sessionToken);
    return Response.json({
      room: result.room,
      playerId: result.playerId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
