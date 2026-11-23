import { neutralBillingText } from '@nexopos/shared';
import { supportUuid } from '@/lib/support-id';
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Headphones, Loader2, MessageSquare, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { io } from 'socket.io-client';
import { eventsUrl } from '@/lib/events-url';

export interface SupportMessage {
  id: string;
  sender: string;
  content: string;
  sequence: number;
  createdAt: string;
  sources?: Array<{ id: string; question: string; version: number }>;
}
export interface SupportSnapshot {
  sessionId: string | null;
  visitorId: string | null;
  mode: string;
  processing: boolean;
  welcomeMessage: string;
  suggestions: Array<{ id: string; label: string; category: string }>;
  messages: SupportMessage[];
}
const empty: SupportSnapshot = {
  sessionId: null,
  visitorId: null,
  mode: "BOT",
  processing: false,
  welcomeMessage:
    "Hola, soy el asistente de NexoPOS. Describe tu consulta o pide hablar con una persona.",
  suggestions: [],
  messages: [],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const modeLabel: Record<string, string> = {
  BOT: "Asistente de soporte",
  WAITING_HUMAN: "Solicitud en espera de atención",
  HUMAN: "Conversación con el equipo de soporte",
  RESOLVED: "Consulta resuelta",
};
export function SupportConversationWidget({
  audience,
  identity,
  socketAuth,
}: {
  audience: "PUBLIC" | "ACCOUNT";
  identity: string;
  socketAuth?: { token: string; tenantId: string };
}) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<SupportSnapshot>(empty);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const revision = useRef(0);
  const epoch = useRef(0);
  const pending = useRef<{ fingerprint: string; id: string; human: boolean } | null>(null);
  const visitor = useRef("");
  const end = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); window.setTimeout(() => launcher.current?.focus(), 0); };
  useEffect(() => { if (open) dialog.current?.focus(); }, [open]);
  useEffect(() => {
    epoch.current++;
    revision.current++;
    sending.current = false;
    pending.current = null;
    setSnapshot(empty);
    setInput("");
    setError("");
    setBusy(false);
    setOpen(false);
    if (audience === "PUBLIC") {
      try {
        const saved = localStorage.getItem("nexopos_visitor_id");
        visitor.current =
          saved && uuid.test(saved) ? saved : supportUuid();
        localStorage.setItem("nexopos_visitor_id", visitor.current);
      } catch {
        visitor.current = supportUuid();
      }
    }
    return () => {
      epoch.current++;
      revision.current++;
    };
  }, [identity, audience]);
  const refresh = useCallback(async () => {
    if (sending.current) return;
    const request = ++revision.current;
    try {
      const response =
        audience === "ACCOUNT"
          ? await api.get<SupportSnapshot>("/support/chat")
          : await api.post<SupportSnapshot>("/support/public-history", {
              visitorId: visitor.current,
            });
      if (request === revision.current) {
        setSnapshot(response.data);
        setError((value) =>
          value.startsWith("No se pudo confirmar") ? value : "",
        );
      }
    } catch {
      if (request === revision.current)
        setError(
          "No se pudo actualizar el historial. Reintentaremos automáticamente.",
        );
    }
  }, [audience, identity]);
  useEffect(() => {
    if (!open) return;
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [open, refresh]);
  useEffect(() => {
    if (!open) return;
    const auth = audience === 'PUBLIC' ? { token: 'anonymous', tenantId: 'visitor_' + visitor.current } : socketAuth;
    if (!auth) return;
    const socket = io(eventsUrl(), { auth, transports: ['websocket'] });
    socket.on('admin_reply', () => { void refresh(); });
    socket.on('connect', () => { void refresh(); });
    return () => { socket.disconnect(); };
  }, [open, audience, socketAuth?.token, socketAuth?.tenantId, refresh]);
  const lastId = snapshot.messages[snapshot.messages.length - 1]?.id;
  useEffect(() => {
    if (open)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open, lastId, busy]);
  async function send(text: string, articleId?: string, human = false) {
    if (!text.trim() || (sending.current && !human)) return;
    const currentEpoch = epoch.current;
    const request = ++revision.current;
    const fingerprint = JSON.stringify([text.trim(), articleId, human]);
    if (!pending.current || pending.current.fingerprint !== fingerprint)
      pending.current = { fingerprint, id: supportUuid(), human };
    const clientMessageId = pending.current.id;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await api.post<SupportSnapshot>(
        audience === "ACCOUNT" ? "/support/chat" : "/support/public-chat",
        {
          message: text.trim(),
          clientMessageId,
          articleId,
          intent: human ? "human" : undefined,
          visitorId: audience === "PUBLIC" ? visitor.current : undefined,
        },
        { timeout: 25000 },
      );
      if (currentEpoch !== epoch.current || request !== revision.current)
        return;
      setSnapshot(response.data);
      pending.current = null;
      if (!human) setInput("");
    } catch {
      if (currentEpoch === epoch.current && request === revision.current)
        setError(
          "No se pudo confirmar el envío. Conservamos tu texto: revisa el historial o reintenta.",
        );
    } finally {
      if (currentEpoch === epoch.current && request === revision.current) {
        sending.current = false;
        setBusy(false);
        void refresh();
      }
    }
  }
  const bot = snapshot.mode === "BOT" || snapshot.mode === "RESOLVED";
  return (
    <>
      {!open && (
        <button
          ref={launcher}
          aria-label="Abrir chat de soporte"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/25 transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
      {open && (
        <section
          ref={dialog}
          tabIndex={-1}
          role="dialog"
          aria-label="Chat de soporte NexoPOS"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl"
          style={{ height: "min(640px, calc(100dvh - 2rem))" }}
        >
          <header className="flex items-center gap-3 border-b border-border bg-violet-600 px-4 py-4 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              {bot ? (
                <Bot className="h-5 w-5" />
              ) : (
                <Headphones className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Soporte NexoPOS</h2>
              <p role="status" className="mt-0.5 text-xs text-violet-100">
                {modeLabel[snapshot.mode] || modeLabel.BOT}
              </p>
            </div>
            <button
              aria-label="Cerrar chat de soporte"
              onClick={close}
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          {!bot && (
            <p className="border-b border-border bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              {snapshot.mode === "HUMAN"
                ? "El asistente está pausado. El equipo puede responder por este chat."
                : "Tu solicitud quedó registrada. Puedes dejar más detalles mientras el equipo la revisa."}
            </p>
          )}
          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
            aria-label="Mensajes de soporte"
          >
            <div className="mr-4 rounded-2xl rounded-tl-sm border border-border bg-muted/50 p-3 text-sm leading-relaxed">
              {snapshot.welcomeMessage}
            </div>
            {snapshot.mode === "RESOLVED" && (
              <p className="text-center text-xs text-muted-foreground">
                Puedes iniciar una nueva consulta escribiendo abajo.
              </p>
            )}
            {snapshot.messages.map((message) => (
              <div
                key={message.id}
                className={message.sender === "VISITOR" ? "ml-8" : "mr-4"}
              >
                <div
                  className={
                    "rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] " +
                    (message.sender === "VISITOR"
                      ? "rounded-tr-sm bg-violet-600 text-white"
                      : "rounded-tl-sm border border-border bg-muted/50")
                  }
                >
                  <p
                    className={
                      "mb-1 text-[10px] font-semibold uppercase tracking-wide " +
                      (message.sender === "VISITOR"
                        ? "text-violet-100"
                        : "text-muted-foreground")
                    }
                  >
                    {message.sender === "VISITOR"
                      ? "Tú"
                      : message.sender === "ADMIN"
                        ? "Equipo de soporte"
                        : "Asistente NexoPOS"}
                  </p>
                  {neutralBillingText(message.content)}
                  {!!message.sources?.length && (
                    <div className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                      Fuente:{" "}
                      {message.sources
                        .map((source) => neutralBillingText(source.question))
                        .join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {bot &&
              snapshot.suggestions.length > 0 &&
              !busy &&
              !snapshot.processing && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Preguntas frecuentes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => void send(item.label, item.id)}
                        className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-left text-xs leading-relaxed text-foreground transition hover:bg-violet-500/15"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {(busy || snapshot.processing) && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando tu consulta…
              </p>
            )}
            <div ref={end} />
          </div>
          <footer className="border-t border-border bg-card p-3">
            {bot && (
              <button
                onClick={() =>
                  void send(
                    "Necesito hablar con una persona de soporte.",
                    undefined,
                    true,
                  )
                }
                disabled={busy && pending.current?.human === true}
                className="mb-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold transition hover:bg-muted disabled:opacity-50"
              >
                <Headphones className="h-4 w-4" />
                Hablar con soporte
              </button>
            )}
            {error && (
              <p
                role="alert"
                className="mb-2 text-xs text-amber-600 dark:text-amber-300"
              >
                {error}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                aria-label="Mensaje para soporte"
                placeholder="Escribe tu consulta…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={4000}
                rows={2}
                disabled={busy || snapshot.processing}
                className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Enviar mensaje a soporte"
                disabled={!input.trim() || busy || snapshot.processing}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              No compartas contraseñas ni claves por el chat.
            </p>
          </footer>
        </section>
      )}
    </>
  );
}
