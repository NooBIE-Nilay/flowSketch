import CanvasConnectorRoom from "@/components/CanvasConnectorRoom";
export default async function CanvasRoom({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  if (!slug) return <>Invalid Slug</>;
  return <CanvasConnectorRoom slug={slug} />;
}
