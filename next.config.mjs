/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 这行是关键，它会生成 HTML 文件
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js 的图片优化功能
  },
};

export default nextConfig;
