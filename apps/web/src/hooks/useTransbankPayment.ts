import { useState, useCallback, useRef } from 'react';
import { checkAgentStatus, requestSale } from '../services/transbank-agent';
import { recordTransaction } from '../api/transbank';

export type PaymentStep =
  | 'idle'
  | 'checking-agent'
  | 'waiting-card'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'error';

export interface TransbankPaymentResult {
  orderId: string;
  authorizationCode: string;
  cardType: string;
  lastFourDigits: string;
  amount: number;
  installments: number;
}

interface UseTransbankPaymentOptions {
  tenantId: string;
  branchId: string;
  onApproved?: (result: TransbankPaymentResult) => void;
  onRejected?: (message: string) => void;
}

export function useTransbankPayment({
  tenantId,
  branchId,
  onApproved,
  onRejected,
}: UseTransbankPaymentOptions) {
  const [step, setStep]         = useState<PaymentStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult]     = useState<TransbankPaymentResult | null>(null);
  const abortRef                = useRef(false);

  const pay = useCallback(
    async (amount: number, saleId?: string) => {
      abortRef.current = false;
      setResult(null);
      setErrorMsg(null);

      // 1. Verificar agente local
      setStep('checking-agent');
      try {
        await checkAgentStatus();
      } catch {
        setStep('error');
        setErrorMsg('Agente Transbank no disponible en localhost:7777. Verifica que esté corriendo.');
        return;
      }

      if (abortRef.current) return;

      // 2. Generar orderId idempotente
      const orderId = crypto.randomUUID();

      // 3. Enviar al terminal
      setStep('waiting-card');
      let saleResult;
      try {
        saleResult = await requestSale(amount, orderId);
        setStep('processing');
      } catch (err: unknown) {
        setStep('error');
        setErrorMsg(err instanceof Error ? err.message : 'Error comunicando con terminal');
        return;
      }

      if (abortRef.current) return;

      // 4. Registrar en backend (idempotente — si falla la red, se puede reintentar)
      try {
        await recordTransaction({
          tenantId,
          branchId,
          saleId,
          orderId,
          amount,
          transbankResponse: saleResult,
        });
      } catch (err: unknown) {
        // El pago pudo haber sido aprobado aunque falle el registro en backend.
        // Loguear pero no bloquear al usuario — el registro se puede recuperar.
        console.error('[Transbank] Error registrando en backend:', err);
      }

      if (!saleResult.success) {
        setStep('rejected');
        setErrorMsg(saleResult.responseMessage ?? 'Pago rechazado');
        onRejected?.(saleResult.responseMessage ?? 'Pago rechazado');
        return;
      }

      const paymentResult: TransbankPaymentResult = {
        orderId,
        authorizationCode: saleResult.authorizationCode,
        cardType:          saleResult.cardType,
        lastFourDigits:    saleResult.lastFourDigits,
        amount:            saleResult.amount,
        installments:      saleResult.installments ?? 0,
      };

      setResult(paymentResult);
      setStep('approved');
      onApproved?.(paymentResult);
    },
    [tenantId, branchId, onApproved, onRejected],
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
    setStep('idle');
    setErrorMsg(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current = false;
    setStep('idle');
    setErrorMsg(null);
    setResult(null);
  }, []);

  return { step, errorMsg, result, pay, cancel, reset };
}
