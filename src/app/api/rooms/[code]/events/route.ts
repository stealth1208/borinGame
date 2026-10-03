import { subscribeRoom } from "@/lib/realtime/bus";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { code } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event = "room.updated") => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: event })}\n\n`),
        );
      };
      send("connected");
      const unsubscribe = subscribeRoom(code, send);
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);
      request.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
