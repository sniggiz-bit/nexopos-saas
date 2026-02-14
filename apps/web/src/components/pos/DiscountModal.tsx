import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DiscountType } from '@/context/CartContext';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (type: DiscountType, value: number) => void;
    itemName: string;
    itemPrice: number;
    currentDiscountType?: DiscountType;
    currentDiscountValue?: number;
}

export function DiscountModal({
    isOpen,
    onClose,
    onApply,
    itemName,
    itemPrice,
    currentDiscountType = 'PERCENTAGE',
    currentDiscountValue = 0,
}: DiscountModalProps) {
    const [type, setType] = useState<DiscountType>(currentDiscountType);
    const [value, setValue] = useState<string>(currentDiscountValue.toString());

    const handleApply = () => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) return;

        onApply(type, numericValue);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Aplicar Descuento</DialogTitle>
                    <p className="text-sm text-muted-foreground">{itemName}</p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-3">
                        <Label>Tipo de Descuento</Label>
                        <Select
                            value={type}
                            onValueChange={(val: string) => setType(val as DiscountType)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                                <SelectItem value="FIXED">Monto Fijo ($)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount-value">
                            {type === 'PERCENTAGE' ? 'Porcentaje de descuento' : 'Monto de descuento'}
                        </Label>
                        <Input
                            id="discount-value"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={type === 'PERCENTAGE' ? 'Ej: 10' : 'Ej: 500'}
                            autoFocus
                        />
                    </div>
                    {type === 'PERCENTAGE' && value && (
                        <p className="text-xs text-muted-foreground">
                            Ahorro estimado: ${((itemPrice * parseFloat(value)) / 100 || 0).toLocaleString()}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleApply}>Aplicar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
