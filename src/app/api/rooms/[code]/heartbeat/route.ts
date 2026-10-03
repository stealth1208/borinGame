import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { code } = await ctx.params;
    await getGameService().touchHost(code, await getSessionToken());
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
