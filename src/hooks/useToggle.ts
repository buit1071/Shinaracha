import { useState, useCallback } from "react";
export function useToggle(initial = false) {
  const [on, setOn] = useState<boolean>(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return { on, setOn, toggle };
}
