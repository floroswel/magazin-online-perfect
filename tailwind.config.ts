import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Fraunces'", "'Cormorant Garamond'", "Georgia", "serif"],
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        eyebrow: ["'Instrument Sans'", "'Inter'", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        ml: {
          blue: "hsl(var(--ml-primary))",
          "blue-dark": "hsl(var(--ml-primary-dark))",
          "blue-darker": "hsl(var(--ml-primary-darker))",
          "blue-light": "hsl(var(--ml-primary-light))",
          "blue-hover": "hsl(var(--ml-primary-hover))",
          red: "hsl(var(--ml-accent))",
          "red-dark": "hsl(var(--ml-accent-dark))",
          "red-light": "hsl(var(--ml-accent-light))",
          yellow: "hsl(var(--ml-warning))",
          green: "hsl(var(--ml-success))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in-right": { from: { opacity: "0", transform: "translateX(-24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "flicker": {
          "0%, 100%": { opacity: "1", transform: "scale(1) rotate(-1deg)", filter: "drop-shadow(0 0 25px hsl(35 80% 60% / 0.6))" },
          "25%": { opacity: "0.92", transform: "scale(1.02) rotate(1deg)", filter: "drop-shadow(0 0 35px hsl(35 80% 60% / 0.85))" },
          "50%": { opacity: "0.97", transform: "scale(0.99) rotate(-0.5deg)", filter: "drop-shadow(0 0 20px hsl(35 80% 60% / 0.55))" },
          "75%": { opacity: "0.94", transform: "scale(1.01) rotate(0.5deg)", filter: "drop-shadow(0 0 30px hsl(35 80% 60% / 0.75))" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "smoke-rise": {
          "0%": { opacity: "0", transform: "translateY(0) scale(1)" },
          "20%": { opacity: "0.4" },
          "100%": { opacity: "0", transform: "translateY(-80px) scale(2)" },
        },
        "shine": {
          "0%": { transform: "translateX(-150%) skewX(-20deg)" },
          "100%": { transform: "translateX(250%) skewX(-20deg)" },
        },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "fade-in-right": "fade-in-right 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "scale-in": "scale-in 0.6s ease-out both",
        "flicker": "flicker 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "smoke-rise": "smoke-rise 4s ease-out infinite",
        "shine": "shine 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
