/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 告诉 Next.js 将项目导出为静态 HTML
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js 的默认图片优化
  },
};

export default nextConfig;
