
import { Quote } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/utils/formatters';
import { Clock, Download, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresalesListProps {
    quotes: Quote[];
    onRestore: (quote: Quote) => void;
    onDelete: (id: string) => void;
    deletingId?: string | null;
    isLoading: boolean;
}

export function PresalesList({ quotes, onRestore, onDelete, deletingId, isLoading }: PresalesListProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                <p className="text-sm">Cargando preventas...</p>
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <Clock className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No hay preventas guardadas</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
                {quotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                    {quote.customer ? quote.customer.name : 'Cliente General'}
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(quote.createdAt), "d MMM, HH:mm", { locale: es })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600 dark:text-emerald-500 text-lg">
                                    {formatPrice(quote.items.reduce((s, i) => s + i.price * Number(i.quantity), 0))}
                                </span>
                                <button
                                    onClick={() => onDelete(quote.id)}
                                    disabled={deletingId === quote.id}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                    title="Eliminar preventa"
                                >
                                    {deletingId === quote.id
                                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-9 border-dashed text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {/* TODO: Print or View details */ }}
                            >
                                {quote.items.length} items
                            </Button>
                            <Button
                                size="sm"
                                className="flex-[2] h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                onClick={() => onRestore(quote)}
                            >
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Restaurar
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
