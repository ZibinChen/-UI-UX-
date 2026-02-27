/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // 关键：告诉 Next.js 你的项目部署在 /-UI-UX-/ 这个子路径下
  basePath: '/-UI-UX-', 
  assetPrefix: '/-UI-UX-/',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
