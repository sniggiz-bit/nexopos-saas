import { supportUuid } from '@/lib/support-id';
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Headphones,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { io } from 'socket.io-client';
import { eventsUrl } from '@/lib/events-url';
import { useAuth } from '@/context/AuthContext';
import type { SupportMessage } from "@/components/support/SupportConversationWidget";

type Session = {
  id: string;
  visitorName: string;
  visitorId: string;
  mode: string;
  updatedAt: string;
  messages: SupportMessage[];
  notices: Array<{ status: string; attempts: number }>;
};
const labels: Record<string, string> = {
  BOT: "Con el asistente",
  WAITING_HUMAN: "En espera",
  HUMAN: "En atención",
  RESOLVED: "Resuelto",
  ALL: "Todos",
};
const emailLabels: Record<string, string> = {
  PENDING: "Correo pendiente",
  SENDING: "Enviando alerta",
  RETRY: "Reintentando correo",
  FAILED: "Correo sin confirmar: requiere revisión",
  ACCEPTED: "Correo aceptado por el proveedor",
};
const button =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-50";
export default function LiveChatsPage() {
  const cache = useQueryClient();
  const { token } = useAuth();
  useEffect(() => {
    if (!token) return;
    const socket = io(eventsUrl(), { auth: { token, tenantId: 'superadmin' }, transports: ['websocket'] });
    const refresh = () => { void cache.invalidateQueries({ queryKey: ['active-chats'] }); };
    socket.on('new_chat_message', refresh);
    socket.on('connect', refresh);
    return () => { socket.disconnect(); };
  }, [token, cache]);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("session");
  const [filter, setFilter] = useState("ALL");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const pendingReply = useRef<{
    text: string;
    sessionId: string;
    id: string;
  } | null>(null);
  const currentSession = useRef(selectedId);
  currentSession.current = selectedId;
  const {
    data: sessions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["active-chats", selectedId, filter],
    queryFn: async () =>
      (
        await api.post<Session[]>("/support/active-sessions", {
          sessionId: selectedId || undefined,
          filter,
        })
      ).data,
    refetchInterval: 5000,
  });
  const selected = sessions.find((session) => session.id === selectedId);
  const lastId = selected?.messages[selected.messages.length - 1]?.id;
  useEffect(() => {
    setText("");
    setError("");
  }, [selectedId]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, lastId]);
  async function act(action: string) {
    if (!selectedId || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/support/conversations/" + selectedId + "/action", {
        action,
      });
      await cache.invalidateQueries({ queryKey: ["active-chats"] });
    } catch {
      setError("No se pudo actualizar la conversación. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  async function reply() {
    if (!selectedId || !text.trim() || busy) return;
    const target = selectedId;
    setBusy(true);
    setError("");
    if (
      !pendingReply.current ||
      pendingReply.current.sessionId !== target ||
      pendingReply.current.text !== text.trim()
    )
      pendingReply.current = {
        sessionId: target,
        text: text.trim(),
        id: supportUuid(),
      };
    const clientMessageId = pendingReply.current.id;
    try {
      await api.post("/support/admin-reply", {
        sessionId: target,
        message: text.trim(),
        clientMessageId,
      });
      if (currentSession.current === target) {
        setText("");
        pendingReply.current = null;
      }
      await cache.invalidateQueries({ queryKey: ["active-chats"] });
    } catch {
      if (currentSession.current === target)
        setError(
          "No se pudo confirmar el envío. Conservamos tu respuesta; revisa el historial antes de reintentar.",
        );
    } finally {
      setBusy(false);
    }
  }
  const visible = sessions.filter(
    (session) =>
      filter === "ALL" || session.mode === filter || session.id === selectedId,
  );
  return (
    <main className="space-y-5 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Centro de soporte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Atiende las derivaciones y revisa el contexto completo de cada
            consulta.
          </p>
        </div>
        <Link to="/admin/support-knowledge" className={button}>
          <BookOpen className="h-4 w-4" />
          Base de soporte
        </Link>
      </header>
      <div className="flex h-[min(750px,calc(100dvh-200px))] min-h-[450px] overflow-hidden rounded-2xl border border-border bg-card">
        <aside
          className={
            "min-w-0 flex-col border-r border-border bg-muted/20 md:flex md:w-80 md:shrink-0 " +
            (selectedId ? "hidden" : "flex w-full")
          }
        >
          <div className="border-b border-border p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversaciones
              <select
                aria-label="Filtrar conversaciones"
                className="mt-2 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                {["ALL", "WAITING_HUMAN", "HUMAN", "BOT", "RESOLVED"].map(
                  (mode) => (
                    <option key={mode} value={mode}>
                      {labels[mode]}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isError ? (
              <p role="alert" className="p-3 text-sm text-red-500">
                No se pudieron cargar las conversaciones.
              </p>
            ) : isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Cargando…</p>
            ) : !visible.length ? (
              <p className="p-3 text-sm text-muted-foreground">
                No hay conversaciones en este estado.
              </p>
            ) : (
              visible.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setParams({ session: session.id })}
                  className={
                    "mb-1 w-full rounded-xl border p-3 text-left transition " +
                    (session.id === selectedId
                      ? "border-primary/30 bg-primary/10"
                      : "border-transparent hover:bg-muted")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={
                        "rounded-full px-2 py-1 text-[10px] font-semibold " +
                        (session.mode === "WAITING_HUMAN"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {labels[session.mode]}
                    </span>
                    <time className="text-[10px] text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">
                    {session.visitorName}
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                    {session.messages[session.messages.length - 1]?.content ||
                      "Sin mensajes"}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>
        <section
          aria-label="Conversación seleccionada"
          className={
            "min-w-0 flex-1 flex-col " +
            (selectedId ? "flex" : "hidden md:flex")
          }
        >
          {selected ? (
            <>
              <header className="space-y-3 border-b border-border p-4">
                <div className="flex items-start gap-2">
                  <button
                    aria-label="Volver a las conversaciones"
                    onClick={() => setParams({})}
                    className={button + " md:hidden"}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-semibold">
                      {selected.visitorName}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selected.visitorId.startsWith("account:")
                        ? "Usuario de NexoPOS"
                        : "Visitante del sitio"}{" "}
                      · {labels[selected.mode]}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.mode !== "HUMAN" && (
                    <button
                      disabled={busy}
                      onClick={() => void act("claim")}
                      className={button + " border-primary/30 text-primary"}
                    >
                      <Headphones className="h-3.5 w-3.5" />
                      Tomar conversación
                    </button>
                  )}
                  {selected.mode !== "RESOLVED" && (
                    <button
                      disabled={busy}
                      onClick={() => void act("resolve")}
                      className={button}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Marcar resuelta
                    </button>
                  )}
                  {selected.mode !== "BOT" && (
                    <button
                      disabled={busy}
                      onClick={() => void act("resume")}
                      className={button}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reactivar asistente
                    </button>
                  )}
                </div>
                {selected.notices[0] && (
                  <p
                    className={
                      "text-[11px] " +
                      (selected.notices[0].status === "FAILED"
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-muted-foreground")
                    }
                  >
                    {emailLabels[selected.notices[0].status] ||
                      "Alerta registrada"}
                  </p>
                )}
              </header>
              <div
                aria-label="Historial de la conversación"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5"
              >
                {selected.messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      "flex flex-col " +
                      (message.sender === "VISITOR"
                        ? "items-start"
                        : "items-end")
                    }
                  >
                    <div
                      className={
                        "max-w-[95%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed break-words [overflow-wrap:anywhere] sm:max-w-[85%] " +
                        (message.sender === "ADMIN"
                          ? "bg-primary text-primary-foreground"
                          : message.sender === "BOT"
                            ? "border border-border bg-muted/40"
                            : "bg-muted")
                      }
                    >
                      <p
                        className={
                          "mb-1 text-[10px] font-semibold uppercase tracking-wide " +
                          (message.sender === "ADMIN"
                            ? "opacity-75"
                            : "text-muted-foreground")
                        }
                      >
                        {message.sender === "VISITOR"
                          ? "Usuario"
                          : message.sender === "BOT"
                            ? "Asistente"
                            : "Equipo de soporte"}
                      </p>
                      {message.content}
                      {!!message.sources?.length && (
                        <p className="mt-2 text-[10px] opacity-75">
                          Fuente:{" "}
                          {message.sources
                            .map(
                              (source) =>
                                source.question + " · v" + source.version,
                            )
                            .join(" / ")}
                        </p>
                      )}
                    </div>
                    <time className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
                <div ref={end} />
              </div>
              <footer className="border-t border-border p-4">
                {error && (
                  <p role="alert" className="mb-2 text-xs text-red-500">
                    {error}
                  </p>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void reply();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    aria-label="Respuesta al usuario"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={busy}
                    maxLength={4000}
                    rows={2}
                    placeholder="Escribe tu respuesta…"
                    className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    aria-label="Enviar respuesta"
                    type="submit"
                    disabled={!text.trim() || busy}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Al responder, tomas la conversación y el asistente queda
                  pausado.
                </p>
              </footer>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                {selectedId && !isLoading
                  ? "No se encontró esta conversación."
                  : "Selecciona una conversación para revisar el historial y responder."}
              </p>
              {selectedId && (
                <button className={button} onClick={() => setParams({})}>
                  Volver a la lista
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
