/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                xl: 'calc(var(--radius) + 4px)',
                '2xl': 'calc(var(--radius) + 8px)',
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                /* Semánticos */
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                    subtle: 'hsl(var(--success-subtle))',
                    border: 'hsl(var(--success-border))',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                    subtle: 'hsl(var(--warning-subtle))',
                    border: 'hsl(var(--warning-border))',
                },
                danger: {
                    DEFAULT: 'hsl(var(--danger))',
                    foreground: 'hsl(var(--danger-foreground))',
                    subtle: 'hsl(var(--danger-subtle))',
                    border: 'hsl(var(--danger-border))',
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    foreground: 'hsl(var(--info-foreground))',
                    subtle: 'hsl(var(--info-subtle))',
                },
                surface: {
                    raised: 'hsl(var(--surface-raised))',
                    sunken: 'hsl(var(--surface-sunken))',
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            boxShadow: {
                'product': '0 2px 8px -2px rgb(79 70 229 / 0.18), 0 0 0 1px rgb(79 70 229 / 0.12)',
                'card-hover': '0 8px 24px -4px rgb(0 0 0 / 0.10), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
            },
            keyframes: {
                'pop-add': {
                    '0%':   { transform: 'scale(1)' },
                    '40%':  { transform: 'scale(1.08)' },
                    '100%': { transform: 'scale(1)' },
                },
                'flash-border': {
                    '0%, 100%': { boxShadow: 'none' },
                    '30%':      { boxShadow: '0 0 0 3px hsl(142 72% 40% / 0.35)' },
                },
                'slide-in-right': {
                    '0%':   { transform: 'translateX(8px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)',   opacity: '1' },
                },
                'fade-in': {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'pop-add':        'pop-add 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'flash-border':   'flash-border 350ms ease-out',
                'slide-in-right': 'slide-in-right 200ms ease-out',
                'fade-in':        'fade-in 150ms ease-out',
            },
        }
    },
    plugins: [],
}
