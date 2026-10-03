import { HostRoomScreen } from "@/features/lobby/host-room-screen";

export default async function HostPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return <HostRoomScreen code={roomCode.toUpperCase()} />;
}
