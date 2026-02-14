import { Button } from '@/components/ui/button';
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
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex w-max space-x-2 p-1">
                <Button
                    variant={selectedCategoryId === null ? "default" : "outline"}
                    className={cn(
                        "rounded-full transition-all",
                        selectedCategoryId === null
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    )}
                    onClick={() => onSelectCategory(null)}
                >
                    Todos
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? "default" : "outline"}
                        className={cn(
                            "rounded-full transition-all",
                            selectedCategoryId === category.id
                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                        )}
                        onClick={() => onSelectCategory(category.id)}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
    );
}
