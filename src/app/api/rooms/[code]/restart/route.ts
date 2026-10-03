import { getGameService, jsonError } from "@/lib/api/game";
import { getSessionToken } from "@/lib/session/cookies";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const sessionToken = await getSessionToken();
    const room = await getGameService().restartRound(code, sessionToken);
    return Response.json({ room });
  } catch (error) {
    return jsonError(error);
  }
}
