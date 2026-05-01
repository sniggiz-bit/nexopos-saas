import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/formatters';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { useTransbankPayment, type PaymentStep, type TransbankPaymentResult } from '@/hooks/useTransbankPayment';
import { useAuth } from '@/context/AuthContext';

interface TransbankPaymentModalProps {
  isOpen: boolean;
  amount: number;
  cardType: 'DEBITO' | 'CREDITO';
  saleId?: string;
  onApproved: (result: TransbankPaymentResult) => void;
  onCancel: () => void;
}

const CARD_LABEL = { DEBITO: 'Débito', CREDITO: 'Crédito' };

export function TransbankPaymentModal({
  isOpen,
  amount,
  cardType,
  saleId,
  onApproved,
  onCancel,
}: TransbankPaymentModalProps) {
  const { user } = useAuth();

  const { step, errorMsg, result, pay, cancel, reset } = useTransbankPayment({
    tenantId:   user?.tenantId ?? '',
    branchId:   user?.branchId ?? '',
    onApproved,
  });

  // Inicia el pago automáticamente al abrir
  useEffect(() => {
    if (isOpen && step === 'idle') {
      pay(amount, saleId);
    }
  }, [isOpen]); // `pay` es estable — useCallback sin deps que cambian entre renders

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const handleCancel = () => {
    cancel();
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Pago con {CARD_LABEL[cardType]}
          </DialogTitle>
          <DialogDescription>
            {formatPrice(amount)} — Terminal Transbank
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <StepContent step={step} errorMsg={errorMsg} result={result} amount={amount} />
        </div>

        <div className="flex gap-3">
          {(step === 'idle' || step === 'checking-agent' || step === 'waiting-card' || step === 'processing') && (
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
          {step === 'rejected' && (
            <>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Volver
              </Button>
              <Button className="flex-1" onClick={() => { reset(); pay(amount, saleId); }}>
                Reintentar
              </Button>
            </>
          )}
          {step === 'error' && (
            <Button variant="outline" className="w-full" onClick={handleCancel}>
              Cerrar
            </Button>
          )}
          {step === 'approved' && (
            <Button className="w-full bg-success hover:bg-success/90 text-white" onClick={onCancel}>
              Continuar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Sub-componente: contenido según etapa
// ──────────────────────────────────────────────
function StepContent({
  step,
  errorMsg,
  result,
  amount,
}: {
  step: PaymentStep;
  errorMsg: string | null;
  result: TransbankPaymentResult | null;
  amount: number;
}) {
  if (step === 'checking-agent') {
    return (
      <Centered>
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-muted-foreground mt-3">Verificando terminal...</p>
      </Centered>
    );
  }

  if (step === 'waiting-card' || step === 'processing') {
    return (
      <Centered>
        <div className="relative">
          {/* Pulso animado */}
          <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-200 flex items-center justify-center">
            <CreditCard className="w-9 h-9 text-indigo-600" />
          </div>
        </div>
        <p className="text-base font-bold mt-4 text-slate-700">
          {step === 'waiting-card' ? 'Esperando tarjeta...' : 'Procesando...'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 'waiting-card'
            ? 'Inserte, pase o acerque la tarjeta al terminal'
            : 'Comunicando con el banco, no retire la tarjeta'}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-3 tabular-nums">{formatPrice(amount)}</p>
      </Centered>
    );
  }

  if (step === 'approved' && result) {
    return (
      <Centered>
        <div className="w-20 h-20 rounded-full bg-success-subtle border-4 border-success/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <p className="text-lg font-black text-success mt-4">¡APROBADO!</p>
        <div className="mt-4 w-full bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
          <Row label="Código" value={result.authorizationCode} />
          <Row label="Tipo" value={result.cardType === 'DB' ? 'Débito' : result.cardType === 'CR' ? 'Crédito' : result.cardType} />
          <Row label="Tarjeta" value={`**** **** **** ${result.lastFourDigits}`} />
          {(result.installments ?? 0) > 0 && (
            <Row label="Cuotas" value={String(result.installments)} />
          )}
          <Row label="Monto" value={formatPrice(result.amount)} bold />
        </div>
      </Centered>
    );
  }

  if (step === 'rejected') {
    return (
      <Centered>
        <div className="w-20 h-20 rounded-full bg-danger/10 border-4 border-danger/20 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-danger" />
        </div>
        <p className="text-lg font-black text-danger mt-4">RECHAZADO</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">{errorMsg}</p>
      </Centered>
    );
  }

  if (step === 'error') {
    return (
      <Centered>
        <div className="w-20 h-20 rounded-full bg-warning/10 border-4 border-warning/20 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-warning" />
        </div>
        <p className="text-base font-bold text-warning mt-4">Sin conexión al terminal</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">{errorMsg}</p>
      </Centered>
    );
  }

  return null;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[200px]">
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-black text-slate-800' : 'font-medium text-slate-700'}>{value}</span>
    </div>
  );
}
