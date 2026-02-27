/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // 必须添加这两行，且名字必须与你的仓库名 /-UI-UX-/ 完全一致
  basePath: '/-UI-UX-',
  assetPrefix: '/-UI-UX-/', 
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
