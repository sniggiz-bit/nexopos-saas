interface LogoProps {
    variant?: 'full' | 'icon';
    className?: string;
    mode?: 'light' | 'dark' | 'auto';
}

export function Logo({ variant = 'full', className = '', mode: _mode = 'light' }: LogoProps) {
    const defaultHeight = variant === 'icon' ? 'h-11' : 'h-11';
    const heightClass = className.includes('h-') ? '' : defaultHeight;

    return (
        <div className={`flex items-center flex-shrink-0 ${heightClass} ${className}`}>
            <img
                src="/logo.png"
                alt="NexoPOS"
                className={`max-w-full max-h-full object-contain ${variant === 'icon' ? 'w-auto h-full' : 'w-auto h-full'}`}
                style={{
                    maxHeight: variant === 'icon' ? '44px' : '44px',
                    width: 'auto',
                    display: 'block'
                }}
            />
        </div>
    );
}
