import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// 引入分析插件
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer({ open: true })],
  build: {
    // 启用 css 代码拆分
    cssCodeSplit: true,
    // 设置打包警告大小为 1000kb（默认 500kb，Antd 比较大容易触发警告）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 核心：静态资源分类打包
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",

        // 核心：按需分包策略
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 将 React 核心及路由抽离为 react-vendor
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            // 将 Ant Design 相关彻底独立（体积最大）
            if (
              id.includes("antd") ||
              id.includes("@ant-design") ||
              id.includes("rc-")
            ) {
              return "antd-vendor";
            }
            // 剩余的其他第三方依赖（如 axios, react-window）打进统一的 vendor
            return "vendor";
          }
        },
      },
    },
  },
});
