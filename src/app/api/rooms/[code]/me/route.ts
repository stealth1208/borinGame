import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const token = await getSessionToken();
    const me = await getGameService().getMe(code, token);
    return Response.json({ me });
  } catch (error) {
    return jsonError(error);
  }
}
