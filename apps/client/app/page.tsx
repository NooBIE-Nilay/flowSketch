"use client";
import { ModeToggle } from "@/components/modeToggle";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
//TODO: Don't Forget to remove "use client" if unncessary
export default function Page() {
  return (
    <>
      <ModeToggle />
      <h1>Landing Page</h1>
      <div className="flex justify-center items-center">
        <div className="flex justify-center items-center gap-10 h-48 bg-foreground/15 w-96 rounded-lg">
          <Link href="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
