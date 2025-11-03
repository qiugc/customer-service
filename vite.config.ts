// vite.config.ts
export default defineConfig({
	css: {
    	preprocessorOptions: {
      		scss: {
        		// quietDeps: true, // 可以尝试，但在高版本中似乎不起作用
        		silenceDeprecations: ['legacy-js-api'],
      		}
    	}
  	}
})
