import { useState, useCallback } from "react"
import { Search } from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useAuth } from "@/context/AuthContext"
import { Product } from "@/api/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ProductSearchComboboxProps {
    onSelect: (product: Product) => void
    className?: string
}

export function ProductSearchCombobox({ onSelect, className }: ProductSearchComboboxProps) {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const { data: products = [] } = useProducts(user?.tenantId)

    const handleSelect = useCallback((product: Product) => {
        onSelect(product)
        setOpen(false)
        setSearchQuery("")
    }, [onSelect])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-12 text-lg", className)}
                >
                    <div className="flex items-center gap-2 text-muted-foreground w-full">
                        <Search className="w-5 h-5" />
                        {searchQuery ? searchQuery : "Buscar producto por nombre o código..."}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-2 border-border" align="start">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder="Escribe para buscar..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="h-12 text-base border-b border-border"
                    />
                    <CommandList className="max-h-[320px]">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No se encontraron productos.</CommandEmpty>
                        <CommandGroup>
                            {products.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.barcode || ''}`}
                                    onSelect={() => handleSelect(product)}
                                    className="cursor-pointer px-4 py-3 border-b border-border/50 last:border-0 hover:bg-primary/5 aria-selected:bg-primary/10 data-[selected=true]:bg-primary/10"
                                >
                                    <div className="flex flex-col gap-0.5 flex-1">
                                        <span className="font-semibold text-foreground text-sm">{product.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            SKU: <span className="font-mono">{product.barcode || 'N/A'}</span>
                                            {' · '}
                                            Stock: <span className={product.stock && product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{product.stock || 0}</span>
                                        </span>
                                    </div>
                                    <span className="ml-4 font-bold text-primary text-sm tabular-nums">
                                        ${product.price.toLocaleString()}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
