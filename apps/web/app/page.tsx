"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  return (
    <div className={styles.page}>
      <input
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
        }}
        type="text"
        placeholder="Room Slug"
      ></input>
      <button
        onClick={() => {
          router.push(`/room/${slug}`);
        }}
      >
        Join Room
      </button>
    </div>
  );
}
