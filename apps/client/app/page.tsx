"use client";
import { ModeToggle } from "@/components/modeToggle";
import { HTTP_URL } from "@/config";
import { CreateRoomSchema } from "@repo/common/types";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
//TODO: Don't Forget to remove "use client" if unncessary
export default function Page() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  });
  return (
    <>
      <ModeToggle />
      <h1>Landing Page</h1>
      <div className="flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-10 h-64 bg-foreground/15 w-80 rounded-lg">
          <Link href="/auth">
            <Button>Get Started</Button>
          </Link>

          <div className="flex flex-col gap-4 justify-center items-center border-2 border-gray-300 rounded-lg p-3">
            <Input
              placeholder="Slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.replace(/ /g, "-"));
              }}
            ></Input>
            <Button
              onClick={async () => {
                try {
                  const roomIdRes = await axios.get(
                    `${HTTP_URL}/room/${slug}`,
                    {
                      headers: {
                        Authorization: token,
                      },
                    }
                  );
                  if (roomIdRes.data) {
                    router.replace(`/canvas/${roomIdRes.data.id}`);
                    return;
                  }
                  const body = CreateRoomSchema.safeParse({ slug });
                  const createRes = await axios.post(
                    `${HTTP_URL}/room`,
                    {
                      ...body,
                    },
                    {
                      headers: {
                        Authorization: token,
                      },
                    }
                  );
                  if (createRes.data && createRes.data.roomId) {
                    router.replace(`/canvas/${createRes.data.roomId}`);
                  }
                } catch (e) {
                  const body = CreateRoomSchema.safeParse({ slug });
                  console.log(token);
                  const createRes = await axios({
                    method: "post",
                    url: `${HTTP_URL}/room`,
                    data: {
                      ...body,
                    },
                    headers: {
                      Authorization: token,
                    },
                  });

                  if (createRes.data && createRes.data.roomId) {
                    router.replace(`/canvas/${createRes.data.roomId}`);
                  }
                }
              }}
              type="submit"
            >
              Create/Join
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
