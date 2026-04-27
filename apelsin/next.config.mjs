/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/squad", destination: "/family", permanent: true },
      { source: "/squad/:path*", destination: "/family/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
