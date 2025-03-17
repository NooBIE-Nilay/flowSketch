import CanvasConnectorRoom from "@/components/CanvasConnectorRoom";

export default async function CanvasRoom({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const roomId = (await params).roomId;
  if (typeof roomId !== "string") return;
  return <CanvasConnectorRoom roomId={roomId} />;
}
