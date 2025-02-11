import axios from "axios";
import { HTTP_URL } from "../app/config";

async function getChats(roomId: string) {
  const res = await axios.get(`${HTTP_URL}/chats/${roomId}`);
  return res.data.messages;
}
export default async function ChatRoom({ id }: { id: string }) {
  const chats = await getChats(id);
  return <></>;
}
