/** @type {import('next').NextConfig} */
const nextConfig = {
	basePath: '/bookmarks',
	allowedDevOrigins: ['games.ideniox.com'],
	// The monitor is the only view.
	async redirects() {
		return [
			{ source: '/', destination: '/pages/monitor', permanent: false },
			{ source: '/', destination: '/bookmarks/pages/monitor', permanent: false, basePath: false },
		];
	},
};

export default nextConfig;
