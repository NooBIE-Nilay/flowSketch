import axios from "axios";
import { HTTP_URL } from "../../config";
async function getRoomFromSlug(slug: string) {
  //TODO: Add Check To Validate slug is valid
  const res = await axios.get(`${HTTP_URL}/room/${slug}`);
  return res.data.id;
}

export default async function ChatRoom({
  params,
}: {
  params: {
    slug: string;
  };
}) {
  const slug = params.slug;
  const roomId = await getRoomFromSlug(slug);
}
