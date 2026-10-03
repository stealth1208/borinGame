import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";
import type { GameService } from "@/domain/game/service";

type Ctx = { params: Promise<{ code: string }> };

export function hostMutation(
  pick: (service: GameService) => (code: string, token?: string) => Promise<unknown>,
) {
  return async function POST(_request: Request, ctx: Ctx) {
    try {
      const { code } = await ctx.params;
      const token = await getSessionToken();
      const result = await pick(getGameService())(code, token);
      return Response.json({ room: result });
    } catch (error) {
      return jsonError(error);
    }
  };
}
