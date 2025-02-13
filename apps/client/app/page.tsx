"use client";
import { ModeToggle } from "@/components/modeToggle";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
//TODO: Don't Forget to remove "use client" if unncessary
export default function Page() {
  const router = useRouter();
  return (
    <>
      <ModeToggle />
      <h1>Landing Page</h1>
      <div className="flex justify-center items-center">
        <div className="flex justify-center items-center gap-10 h-48 bg-foreground/15 w-96 rounded-lg">
          <Link href="/signin">
            <Button>Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Create Account</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
