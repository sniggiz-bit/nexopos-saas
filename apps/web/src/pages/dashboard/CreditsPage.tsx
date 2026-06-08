
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
                    <h1 className="text-2xl font-bold text-white">Créditos y Deudas</h1>
                </div>

                {/* Summary Card */}
                <Card className="p-6 bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">
                                Deuda Total Pendiente
                            </p>
                            <p className="text-3xl font-black text-red-500 font-mono tracking-tight">
                                {formatPrice(totalDebt)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {credits?.filter(c => c.status === 'OPEN').length || 0} créditos activos
                            </p>
                        </div>
                        <div className="p-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] rounded-xl">
                            <DollarSign className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </Card>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o RUT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all text-sm"
                    />
                </div>

                <div className="bg-[rgba(15,22,36,0.5)] border border-[rgba(0,212,255,0.08)] backdrop-blur-md rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-[rgba(0,212,255,0.05)]">
                        <thead className="bg-[rgba(0,212,255,0.02)]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto Total</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Pendiente</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(0,212,255,0.05)]">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-400">Cargando créditos...</td></tr>
                            ) : !filteredCredits || filteredCredits.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-400">No se encontraron registros</td></tr>
                            ) : (
                                filteredCredits.map((credit) => (
                                    <tr key={credit.id} className="hover:bg-[rgba(0,212,255,0.02)] border-b border-[rgba(0,212,255,0.05)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-semibold text-white">{credit.customer?.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{credit.customer?.rut}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{formatPrice(credit.totalAmount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400 font-mono">{formatPrice(credit.balance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                                credit.status === 'PAID' 
                                                    ? 'bg-[rgba(16,185,129,0.06)] text-[#10B981] border-[rgba(16,185,129,0.15)]' 
                                                    : 'bg-[rgba(239,68,68,0.06)] text-red-400 border-[rgba(239,68,68,0.15)]'
                                            }`}>
                                                {credit.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {credit.status === 'OPEN' && (
                                                <Button size="sm" onClick={() => handleOpenPaymentModal(credit)} className="bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] font-semibold transition-all">
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
                <DialogContent className="bg-[rgba(15,22,36,0.95)] border border-[rgba(0,212,255,0.15)] text-white backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="text-white font-bold">Registrar Abono</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">
                                Cliente: <span className="font-semibold text-white">{selectedCredit?.customer?.name}</span>
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Saldo Pendiente: <span className="font-bold text-red-400 font-mono">{selectedCredit && formatPrice(selectedCredit.balance)}</span>
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-1">Monto a Abonar</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-4 py-2 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white placeholder-slate-500 rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none font-mono"
                                max={selectedCredit?.balance}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-1">Método de Pago</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-2 bg-[rgba(15,22,36,0.8)] border border-[rgba(0,212,255,0.15)] text-white rounded-lg focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none"
                            >
                                <option value="CASH" className="bg-[hsl(220,30%,8%)] text-white">Efectivo</option>
                                <option value="CARD" className="bg-[hsl(220,30%,8%)] text-white">Tarjeta</option>
                                <option value="TRANSFER" className="bg-[hsl(220,30%,8%)] text-white">Transferencia</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSelectedCredit(null)} className="border-[rgba(0,212,255,0.15)] text-gray-400 hover:bg-[rgba(255,255,255,0.05)] hover:text-white">Cancelar</Button>
                            <Button type="submit" disabled={addPayment.isPending} className="bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] font-semibold transition-all">
                                {addPayment.isPending ? 'Procesando...' : 'Confirmar Abono'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

