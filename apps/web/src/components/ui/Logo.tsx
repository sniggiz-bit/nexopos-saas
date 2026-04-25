interface LogoProps {
    variant?: 'full' | 'icon';
    className?: string;
    mode?: 'light' | 'dark' | 'auto';
    height?: number;
}

export function Logo({ variant = 'full', className = '', mode = 'light', height = 44 }: LogoProps) {
    // mode='dark' → dark background, use white + teal
    // mode='light' (default) → light background, use navy + teal
    const isDarkBg = mode === 'dark';

    const navyColor = isDarkBg ? '#FFFFFF' : '#0C1F40';
    const textColor = isDarkBg ? '#FFFFFF' : '#0C1F40';
    const markSize = Math.round(height * 0.9);

    const mark = (
        <svg
            viewBox="0 0 200 200"
            height={markSize}
            width={markSize}
            aria-hidden="true"
            style={{ display: 'block', flexShrink: 0 }}
        >
            {/* Left vertical bar */}
            <rect x="20" y="20" width="44" height="160" fill={navyColor} />
            {/* Diagonal strip */}
            <polygon points="64,20 108,20 180,180 136,180" fill={navyColor} />
            {/* Right bar — upper darker teal */}
            <rect x="136" y="20" width="44" height="90" fill="#1A6B57" />
            {/* Right bar — lower lighter teal */}
            <rect x="136" y="110" width="44" height="70" fill="#2B9E7C" />
        </svg>
    );

    if (variant === 'icon') {
        return (
            <div className={`inline-flex items-center ${className}`}>
                {mark}
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-2 ${className}`} style={{ height }}>
            {mark}
            <span
                style={{
                    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                    fontWeight: 800,
                    fontSize: `${Math.round(height * 0.62)}px`,
                    color: textColor,
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                    userSelect: 'none',
                }}
            >
                NEXOPOS
            </span>
        </div>
    );
}
