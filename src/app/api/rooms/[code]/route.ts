import { getGameService, jsonError } from "@/lib/api/game";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const room = await getGameService().getPublicRoom(code);
    return Response.json({ room });
  } catch (error) {
    return jsonError(error);
  }
}
