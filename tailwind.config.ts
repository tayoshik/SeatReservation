import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}", // データフォルダを追加
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)", // カスタム変数の適用
        foreground: "var(--foreground)", // カスタム変数の適用
        primary: "#2563eb", // プロジェクト専用の色を追加
        secondary: "#1e40af",
        highlight: "#9333ea",
        muted: "#64748b",
      },
      spacing: {
        seat: "2.5rem", // 座席のサイズ調整用
      },
      borderRadius: {
        seat: "0.375rem", // 座席の丸み
      },
    },
  },
  plugins: [],
} satisfies Config;
