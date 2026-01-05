import { defineConfig } from "vite"

export default defineConfig ({
	base: "/hyperapp-ui/",
	esbuild: {
		jsxFactory: "h"
	},
	build: {
		minify: false,
		outDir: "docs"
	}
})
