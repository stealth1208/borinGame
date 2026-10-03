import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken, setSessionCookie } from "@/lib/session/cookies";
import { joinRoomSchema } from "@/lib/validation/api";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const body: unknown = await request.json();
    const parsed = joinRoomSchema.parse(body);
    const existing = await getSessionToken();
    const result = await getGameService().joinRoom(code, parsed.nickname, existing);
    await setSessionCookie(result.sessionToken);
    return Response.json({
      room: result.room,
      playerId: result.playerId,
      reconnected: result.reconnected,
    });
  } catch (error) {
    return jsonError(error);
  }
}
