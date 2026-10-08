import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only archive previews are read from disk in `next dev`.
  // Keep them out of the production server trace.
  outputFileTracingExcludes: {
    "*": ["./vendor/iwrzwr-visual-archive/**"],
  },
  async headers() {
    return [
      {
        // Serve self-hosted FLAC with the correct MIME type so the
        // Web Audio pipeline and <audio> element decode it everywhere.
        source: "/audio/:path*.flac",
        headers: [{ key: "Content-Type", value: "audio/flac" }],
      },
    ];
  },
};

export default nextConfig;
