import type { Metadata } from "next";
import "./globals.css";
import LayoutSwitch from "./LayoutSwitch";

export const metadata: Metadata = {
  title: "BI&FP Reports",
  description: "",
  // icons: {
  //   icon: "/images/Logo_Shinaracha.webp",
  //   shortcut: "/images/Logo_Shinaracha.webp",
  //   apple: "/images/Logo_Shinaracha.webp",
  // },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <LayoutSwitch>{children}</LayoutSwitch>
      </body>
    </html>
  );
}