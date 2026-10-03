import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";
import { voteSchema } from "@/lib/validation/api";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { code } = await ctx.params;
    const body: unknown = await request.json();
    const parsed = voteSchema.parse(body);
    const token = await getSessionToken();
    const room = await getGameService().castVote(code, parsed.targetPlayerId, token);
    return Response.json({ room });
  } catch (error) {
    return jsonError(error);
  }
}
