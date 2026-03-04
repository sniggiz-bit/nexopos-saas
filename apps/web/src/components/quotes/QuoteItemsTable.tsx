import { useCart, CartItemData, DiscountType } from "@/context/CartContext"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils" // Assuming this exists or I'll implement inline
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function QuoteItemsTable() {
    const { items, updateQuantity, updatePrice, applyDiscount, removeItem } = useCart()

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay productos en la cotización. Usa el buscador para agregar items.
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Producto</TableHead>
                        <TableHead className="w-[10%] text-center">Cantidad</TableHead>
                        <TableHead className="w-[15%] text-right">Precio Unit.</TableHead>
                        <TableHead className="w-[20%] text-right">Descuento</TableHead>
                        <TableHead className="w-[10%] text-right">Total</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <QuoteItemRow
                            key={item.productId}
                            item={item}
                            updateQuantity={updateQuantity}
                            updatePrice={updatePrice}
                            applyDiscount={applyDiscount}
                            removeItem={removeItem}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface QuoteItemRowProps {
    item: CartItemData
    updateQuantity: (id: string, qty: number | '') => void
    updatePrice: (id: string, price: number | '') => void
    applyDiscount: (id: string, type: DiscountType | undefined, val?: number | '') => void
    removeItem: (id: string) => void
}

function QuoteItemRow({ item, updateQuantity, updatePrice, applyDiscount, removeItem }: QuoteItemRowProps) {

    const calculateLineTotal = () => {
        let total = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const dVal = Number(item.discountValue) || 0;
        if (dVal && item.discountType) {
            if (item.discountType === 'PERCENTAGE') {
                total -= (total * dVal) / 100;
            } else {
                total -= dVal;
            }
        }
        return Math.max(0, total);
    }

    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {item.productId}</span>
                    {/* Using productId as SKU for now if barcode isn't in CartItemData context, strictly speaking we should add it */}
                </div>
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    min="1"
                    className="text-center h-8"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                />
            </TableCell>
            <TableCell>
                <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                    <Input
                        type="number"
                        min="0"
                        className="text-right pl-5 h-8"
                        value={item.price}
                        onChange={(e) => updatePrice(item.productId, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    />
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-1 items-center">
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            min="0"
                            className="text-right h-8"
                            placeholder="0"
                            value={item.discountValue ?? ''}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                applyDiscount(item.productId, item.discountType || 'PERCENTAGE', Number.isNaN(val as number) && val !== '' ? undefined : val)
                            }}
                        />
                    </div>
                    <div className="w-[70px]">
                        <Select
                            value={item.discountType || 'PERCENTAGE'}
                            onValueChange={(val: DiscountType) => applyDiscount(item.productId, val, item.discountValue)}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">%</SelectItem>
                                <SelectItem value="FIXED">$</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right font-medium">
                {formatCurrency(calculateLineTotal())}
            </TableCell>
            <TableCell>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItem(item.productId)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
