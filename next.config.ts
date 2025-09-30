import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: [
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/interaction",
    "@fullcalendar/list",
  ],
};

export default nextConfig;
