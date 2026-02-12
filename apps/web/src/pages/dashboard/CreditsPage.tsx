
import { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useCredits, useAddCreditPayment } from '../../hooks/useCredits';
import { DollarSign, Search, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/utils/formatters';

export function CreditsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCredit, setSelectedCredit] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    const { data: credits, isLoading } = useCredits();
    // Improvement: Fetching all customers might be heavy, but needed for name filtering if credit.customer is id only? 
    // api/credits returns including customer usually.

    const addPayment = useAddCreditPayment();
    const { toast } = useToast();

    // Calculate totals
    const totalDebt = credits?.reduce((acc, credit) => acc + credit.balance, 0) || 0;

    const filteredCredits = credits?.filter(credit =>
        credit.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.customer?.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleOpenPaymentModal = (credit: any) => {
        setSelectedCredit(credit);
        setPaymentAmount('');
        setPaymentMethod('CASH');
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCredit) return;

        const amount = parseInt(paymentAmount);
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Monto inválido' });
            return;
        }

        if (amount > selectedCredit.balance) {
            toast({ variant: 'destructive', title: 'Error', description: 'El monto excede el saldo pendiente' });
            return;
        }

        try {
            await addPayment.mutateAsync({
                id: selectedCredit.id,
                data: {
                    amount,
                    paymentMethod,
                    // cashShiftId: '...' // Should get from context if using shifts
                }
            });
            toast({ variant: 'success', title: 'Abono registrado exitosamente' });
            setSelectedCredit(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Error al registrar abono' });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Créditos y Deudas</h1>
                </div>

                {/* Summary Card */}
                <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Deuda Total Pendiente
                            </p>
                            <p className="text-3xl font-bold text-red-600">
                                {formatPrice(totalDebt)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {credits?.filter(c => c.status === 'OPEN').length || 0} créditos activos
                            </p>
                        </div>
                        <div className="p-4 bg-red-100 rounded-lg">
                            <DollarSign className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </Card>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o RUT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando créditos...</td></tr>
                            ) : !filteredCredits || filteredCredits.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron registros</td></tr>
                            ) : (
                                filteredCredits.map((credit) => (
                                    <tr key={credit.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div>{credit.customer?.name}</div>
                                            <div className="text-xs text-gray-500">{credit.customer?.rut}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(credit.totalAmount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{formatPrice(credit.balance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${credit.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {credit.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {credit.status === 'OPEN' && (
                                                <Button size="sm" onClick={() => handleOpenPaymentModal(credit)}>
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Abonar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={!!selectedCredit} onOpenChange={(open) => !open && setSelectedCredit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Abono</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-2">
                                Cliente: <span className="font-medium text-gray-900">{selectedCredit?.customer?.name}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                Saldo Pendiente: <span className="font-bold text-red-600">{selectedCredit && formatPrice(selectedCredit.balance)}</span>
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Abonar</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                max={selectedCredit?.balance}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="CASH">Efectivo</option>
                                <option value="CARD">Tarjeta</option>
                                <option value="TRANSFER">Transferencia</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSelectedCredit(null)}>Cancelar</Button>
                            <Button type="submit" disabled={addPayment.isPending}>
                                {addPayment.isPending ? 'Procesando...' : 'Confirmar Abono'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

