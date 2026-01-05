import { defineConfig } from "vite"

export default defineConfig ({
	esbuild: {
		jsxFactory: "h"
	},
	build: {
		minify: false,
		outDir: "docs"
	}
})
