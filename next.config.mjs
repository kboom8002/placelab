/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/band-map',
        destination: '/maps',
        permanent: true,
      },
      {
        source: '/weather',
        destination: '/maps',
        permanent: true,
      },
      {
        source: '/verify',
        destination: '/crew',
        permanent: true,
      },
      {
        source: '/about/disclosure',
        destination: '/disclosure',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
