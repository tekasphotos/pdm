/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vercel-blob.com" },
    ],
  },
  serverExternalPackages: ["bcryptjs"],
  transpilePackages: ["@excalidraw/excalidraw"],
}

module.exports = nextConfig
