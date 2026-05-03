
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCustomers } from '../../hooks/useCustomers';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CustomerFormModal } from './CustomerFormModal';

interface CustomerSelectorProps {
    value?: string;
    onChange: (value: string) => void;
}

export function CustomerSelector({ value, onChange }: CustomerSelectorProps) { // value is customerId
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: customers } = useCustomers(user?.tenantId ?? '');

    const selectedCustomer = customers?.find((customer) => customer.id === value);

    const handleSelect = (currentValue: string) => {
        onChange(currentValue === value ? "" : currentValue);
        setOpen(false);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedCustomer ? selectedCustomer.name : "Seleccionar cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                            <CommandGroup>
                                {customers?.map((customer) => (
                                    <CommandItem
                                        key={customer.id}
                                        value={customer.name} // Command uses value for filtering
                                        onSelect={() => handleSelect(customer.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{customer.name}</span>
                                            <span className="text-xs text-gray-500">{customer.rut}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={() => setIsModalOpen(true)} title="Nuevo Cliente">
                <UserPlus className="h-4 w-4" />
            </Button>

            <CustomerFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
