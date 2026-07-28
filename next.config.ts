import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows accessing the dev server from other devices on the same Wi-Fi
  // (e.g. http://192.168.x.x:3000) — otherwise Next.js blocks HMR/static
  // requests from LAN origins and the page never finishes hydrating.
  allowedDevOrigins: ["192.168.110.*"],
};

export default nextConfig;
