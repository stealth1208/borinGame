import { PlayerRoomScreen } from "@/features/game/player-room-screen";

export default async function GamePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return <PlayerRoomScreen code={roomCode.toUpperCase()} />;
}
