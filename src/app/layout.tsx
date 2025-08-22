import type { Metadata } from "next";
import "./globals.css";
import LayoutSwitch from "./LayoutSwitch";

export const metadata: Metadata = {
  // title: "Shinaracha",
  title: "A&P Maintenance",
  description: "",
  // icons: {
  //   icon: "/images/NewLOGOSF.webp",
  //   shortcut: "/images/NewLOGOSF.webp",
  //   apple: "/images/NewLOGOSF.webp",
  // },
  icons: {
    icon: "/images/ap-Logi.png",
    shortcut: "/images/ap-Logi.png",
    apple: "/images/ap-Logi.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <LayoutSwitch>{children}</LayoutSwitch>
      </body>
    </html>
  );
}