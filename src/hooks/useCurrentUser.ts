"use client";

import { useEffect, useState } from "react";
import { CurrentUser } from "@/interfaces/master";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {
      console.error("Cannot read currentUser:", err);
    }
  }, []);

  return user;
}
