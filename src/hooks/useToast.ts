import { useCallback, useRef, useState } from "react";

const TOAST_DURATION_MS = 1800;

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  return { message, showToast };
}
