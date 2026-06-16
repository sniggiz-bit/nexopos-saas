import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/api/categories';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelectCategory }: CategoryFilterProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setShowLeftArrow(scrollLeft > 2);
            // Allow 2px tolerance for subpixel rounding issues
            setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 2);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            checkScroll();
            container.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);

            // ResizeObserver to detect size changes of the container or its items
            const resizeObserver = new ResizeObserver(() => {
                checkScroll();
            });
            resizeObserver.observe(container);

            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
                resizeObserver.disconnect();
            };
        }
    }, [categories]);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = 200;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative flex items-center w-full overflow-hidden">
            {/* Left navigation arrow with gradient backdrop */}
            {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 flex items-center pr-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => handleScroll('left')}
                        className="pointer-events-auto p-1.5 bg-card hover:bg-muted border border-border rounded-full text-foreground shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#0099CC] hover:shadow-[0_0_10px_rgba(0,153,204,0.25)]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Scrollable category list */}
            <div
                ref={scrollContainerRef}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="w-full overflow-x-auto whitespace-nowrap flex gap-2 px-1 py-1.5 scroll-smooth [&::-webkit-scrollbar]:hidden"
            >
                <CategoryChip
                    active={selectedCategoryId === null}
                    onClick={() => onSelectCategory(null)}
                >
                    Todos
                </CategoryChip>

                {categories.map((category) => (
                    <CategoryChip
                        key={category.id}
                        active={selectedCategoryId === category.id}
                        onClick={() => onSelectCategory(category.id)}
                    >
                        {category.name}
                    </CategoryChip>
                ))}
            </div>

            {/* Right navigation arrow with gradient backdrop */}
            {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pl-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        className="pointer-events-auto p-1.5 bg-card hover:bg-muted border border-border rounded-full text-foreground shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#0099CC] hover:shadow-[0_0_10px_rgba(0,153,204,0.25)]"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

interface CategoryChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function CategoryChip({ active, onClick, children }: CategoryChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium',
                'transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'whitespace-nowrap select-none',
                active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm',
            )}
        >
            {children}
        </button>
    );
}
