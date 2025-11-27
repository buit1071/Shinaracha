"use client";
import * as React from "react";

type Props = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export default function CheckTick({ checked, onChange, disabled, size = "md", className = "" }: Props) {
  const box = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const tick = size === "sm" ? "text-[12px]" : "text-[14px]";
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={!!disabled}
      aria-pressed={checked}
      className={[
        box,
        "rounded-[4px] border grid place-items-center focus:outline-none transition-shadow",
        checked ? "bg-red-600 border-red-600" : "bg-white border-gray-400",
        "hover:shadow-sm focus:ring-2 focus:ring-red-300 focus:ring-offset-1",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <span className={["leading-none text-white", tick, checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
    </button>
  );
}
