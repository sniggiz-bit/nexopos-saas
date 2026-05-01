import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Category } from '@/api/categories';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelectCategory }: CategoryFilterProps) {
    return (
        <div className="relative">
            <ScrollArea className="w-full whitespace-nowrap pb-1">
                <div className="flex w-max gap-2 px-0.5 py-0.5">
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
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            {/* Fade overlay — indica que hay más chips a la derecha */}
            <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent"
            />
        </div>
    );
}

function CategoryChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
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
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}
