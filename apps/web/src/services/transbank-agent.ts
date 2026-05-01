const AGENT_URL = 'http://localhost:7777';

export interface AgentStatus {
  ok: boolean;
  connected: boolean;
  port?: string;
  terminalId?: string;
  mockMode?: boolean;
}

export interface AgentSaleResult {
  ok: boolean;
  success: boolean;
  responseCode: number;
  responseMessage: string;
  authorizationCode: string;
  amount: number;
  cardType: string;
  lastFourDigits: string;
  ticket: string;
  realDate: string;
  realTime: string;
  installments?: number;
  terminalId?: string;
  error?: string;
}

export async function checkAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${AGENT_URL}/status`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`Agent error ${res.status}`);
  return res.json();
}

export async function requestSale(
  amount: number,
  ticket: string,
  timeoutMs = 120_000,
): Promise<AgentSaleResult> {
  const res = await fetch(`${AGENT_URL}/sale`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ amount, ticket }),
    signal:  AbortSignal.timeout(timeoutMs),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `Agent HTTP ${res.status}`);
  }

  return data as AgentSaleResult;
}
