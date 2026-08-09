/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" output is only needed for the Docker / Cloud Run path.
  // Firebase App Hosting builds normally, so we only turn it on when the
  // Dockerfile sets DOCKER_BUILD=1.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" } : {}),
};

export default nextConfig;
