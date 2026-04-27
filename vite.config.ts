import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function vendorChunk(id: string) {
	if (!id.includes("node_modules")) {
		return undefined;
	}

	if (
		id.includes("@heroui/") ||
		id.includes("react-aria-components") ||
		id.includes("@react-aria/") ||
		id.includes("@react-stately/")
	) {
		return "ui-vendor";
	}

	if (
		id.includes("@tanstack/react-query") ||
		id.includes("i18next") ||
		id.includes("wouter")
	) {
		return "data-vendor";
	}

	if (
		id.includes("/react/") ||
		id.includes("/react-dom/") ||
		id.includes("/scheduler/")
	) {
		return "react-vendor";
	}

	return "vendor";
}

export default defineConfig(() => ({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", { target: "19" }]],
			},
		}),
		tailwindcss(),
	],
	server: {
		port: 1420,
		strictPort: false,
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: vendorChunk,
			},
		},
	},
}));
