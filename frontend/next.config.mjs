/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['res.cloudinary.com'],
    },
    webpack: (config) => {
       config.resolve.alias.canvas = false;
      
         return config;
      },
  };
  
  export default nextConfig;