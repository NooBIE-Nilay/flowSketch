import axios from "axios";
import { HTTP_URL } from "../../config";
import ChatRoom from "../../../components/ChatRoom";

async function getRoomIdFromSlug(slug: string) {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NGNlN2VjMC1mMDllLTQyNTMtYjYyNC1hNmViMDg0MjBiODYiLCJpYXQiOjE3MzkyNTc5NDB9.nqubHjCCZSdTg7iJDuQ-OInSlOgfSAYGaWXhjd5VUls";

  //TODO: Add Check To Validate slug is valid
  const roomIdRes = await axios.get(`${HTTP_URL}/room/${slug}`, {
    headers: {
      Authorization: token,
    },
  });
  return roomIdRes.data.id;
}
//@ts-ignore
export default async function Room({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  // const roomId = await getRoomFromSlug(slug);
  const roomId = await getRoomIdFromSlug(slug);
  return (
    <>
      <ChatRoom id={roomId} />
    </>
  );
}
