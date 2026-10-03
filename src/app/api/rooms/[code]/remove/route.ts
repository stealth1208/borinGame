import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";
import { removePlayerSchema } from "@/lib/validation/api";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { code } = await ctx.params;
    const body: unknown = await request.json();
    const parsed = removePlayerSchema.parse(body);
    const token = await getSessionToken();
    const room = await getGameService().removePlayer(code, parsed.playerId, token);
    return Response.json({ room });
  } catch (error) {
    return jsonError(error);
  }
}
