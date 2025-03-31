"use client";
import { ModeToggle } from "@/components/modeToggle";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";

//TODO: Don't Forget to remove "use client" if unncessary
export default function Page() {
  const [slug, setSlug] = useState("");

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
            <Button onClick={() => redirect(`/canvas/${slug}`)} type="submit">
              Create/Join
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
