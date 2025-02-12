import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";
export function useSocket() {
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket>();
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NGNlN2VjMC1mMDllLTQyNTMtYjYyNC1hNmViMDg0MjBiODYiLCJpYXQiOjE3MzkyNTc5NDB9.nqubHjCCZSdTg7iJDuQ-OInSlOgfSAYGaWXhjd5VUls";
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => {
      setIsLoading(false);
      setSocket(ws);
    };
  }, []);
  return { socket, isLoading };
}
