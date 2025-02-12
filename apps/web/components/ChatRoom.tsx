import axios from "axios";
import { HTTP_URL } from "../app/config";
import ChatRoomClient from "./ChatRoomClient";
async function getChats(roomId: string) {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NGNlN2VjMC1mMDllLTQyNTMtYjYyNC1hNmViMDg0MjBiODYiLCJpYXQiOjE3MzkyNTc5NDB9.nqubHjCCZSdTg7iJDuQ-OInSlOgfSAYGaWXhjd5VUls";
  const chatRes = await axios.get(`${HTTP_URL}/chats/${roomId}`, {
    headers: {
      Authorization: token,
    },
  });
  return chatRes.data;
}
export default async function ChatRoom({ id }: { id: string }) {
  const messages = await getChats(id);
  return (
    <>
      <ChatRoomClient id={id} messages={messages} />
    </>
  );
}
