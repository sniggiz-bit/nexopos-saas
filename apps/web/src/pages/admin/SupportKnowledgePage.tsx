import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";

type Article = {
  id?: string;
  version?: number;
  question: string;
  answer: string;
  category: string;
  aliases: string[];
  audience: string;
  status: string;
  isStarter: boolean;
  sortOrder: number;
};
type Settings = {
  version: number;
  enabled: boolean;
  aiEnabled: boolean;
  publicAiEnabled: boolean;
  geminiModel: string;
  dailyLimit: number;
  dailyCalls: number;
  welcomeMessage: string;
  keyConfigured: boolean;
};
const blank: Article = {
  question: "",
  answer: "",
  category: "General",
  aliases: [],
  audience: "ACCOUNT",
  status: "DRAFT",
  isStarter: false,
  sortOrder: 0,
};
const field =
  "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
const button =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50";
const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};
export default function SupportKnowledgePage() {
  const cache = useQueryClient();
  const articlesQuery = useQuery({
    queryKey: ["support-articles"],
    queryFn: async () => (await api.get<Article[]>("/support/articles")).data,
  });
  const settingsQuery = useQuery({
    queryKey: ["support-settings"],
    queryFn: async () => (await api.get<Settings>("/support/settings")).data,
  });
  const [tab, setTab] = useState<"articles" | "settings">("articles");
  const [selected, setSelected] = useState<Article>(blank);
  const [editing, setEditing] = useState(false);
  const [aliases, setAliases] = useState("");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [key, setKey] = useState("");
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([]);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);
  function select(article: Article) {
    setSelected({ ...article });
    setAliases(article.aliases.join("\n"));
    setEditing(true);
    setError("");
    setNotice("");
  }
  async function run(action: string, task: () => Promise<void>) {
    setPending(action);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (err: any) {
      setError(
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "No se pudo completar la acción. Revisa la conexión e intenta nuevamente.",
      );
    } finally {
      setPending("");
    }
  }
  const filtered = (articlesQuery.data || []).filter((article) =>
    (article.question + " " + article.category)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-7xl space-y-6 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Asistente NexoPOS
          </p>
          <h1 className="text-2xl font-bold">Base de soporte</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Prepara respuestas para tus clientes. Publica los temas aprobados y
            deriva a tu equipo cuando una consulta necesite atención personal.
          </p>
        </div>
        <Link to="/admin/live-chats" className={button}>
          Ver conversaciones
        </Link>
      </header>
      <div
        role="tablist"
        aria-label="Configuración de soporte"
        className="flex gap-2 border-b border-border pb-3"
      >
        {[
          { id: "articles", label: "Preguntas y respuestas", icon: BookOpen },
          { id: "settings", label: "Gemini y configuración", icon: KeyRound },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id as typeof tab);
              setError("");
              setNotice("");
            }}
            className={
              button +
              (tab === item.id
                ? " bg-primary/10 text-primary border-primary/30"
                : "")
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </p>
      )}
      {(articlesQuery.isError || settingsQuery.isError) && (
        <p role="alert" className="text-sm text-red-500">
          No se pudo cargar la configuración.{" "}
          <button
            className="underline"
            onClick={() => {
              void articlesQuery.refetch();
              void settingsQuery.refetch();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {tab === "articles" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-2xl border border-border bg-card">
            <div className="space-y-3 border-b border-border p-4">
              <button
                onClick={() => select(blank)}
                className={
                  button +
                  " w-full bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                <Plus className="h-4 w-4" />
                Nueva pregunta
              </button>
              <label className="relative block">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  aria-label="Buscar preguntas"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar pregunta o categoría"
                  className={field + " pl-9"}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {articlesQuery.data?.length || 0} temas · solo se usan los
                publicados
              </p>
            </div>
            <div className="max-h-[570px] overflow-y-auto p-2">
              {articlesQuery.isLoading ? (
                <p className="p-4 text-sm">Cargando preguntas…</p>
              ) : filtered.length ? (
                filtered.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => select(article)}
                    className={
                      "mb-1 w-full rounded-xl p-3 text-left transition " +
                      (selected.id && selected.id === article.id
                        ? "bg-primary/10"
                        : "hover:bg-muted")
                    }
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {article.category} · {statusLabel[article.status]}
                    </span>
                    <span className="block text-sm font-medium break-words">
                      {article.question}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {article.audience === "ACCOUNT"
                        ? "Clientes"
                        : article.audience === "PUBLIC"
                          ? "Visitantes"
                          : "Clientes y visitantes"}
                      {article.isStarter ? " · Pregunta inicial" : ""}
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No hay preguntas con esta búsqueda.
                </p>
              )}
            </div>
          </aside>
          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run("article", async () => {
                  const data = {
                    ...selected,
                    aliases: aliases
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  };
                  const response = selected.id
                    ? await api.patch<Article>(
                        "/support/articles/" + selected.id,
                        data,
                      )
                    : await api.post<Article>("/support/articles", data);
                  setSelected(response.data);
                  await cache.invalidateQueries({
                    queryKey: ["support-articles"],
                  });
                  setNotice(
                    response.data.status === "PUBLISHED"
                      ? "Pregunta publicada. El asistente ya puede usar esta respuesta."
                      : "Pregunta guardada. Los borradores y archivados no se muestran al usuario.",
                  );
                });
              }}
              className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {selected.id ? "Editar pregunta" : "Nueva pregunta"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Escribe instrucciones verificadas, claras y sin datos privados
                  de clientes.
                </p>
              </div>
              <label className="block space-y-2 text-sm font-medium">
                Pregunta
                <input
                  required
                  minLength={5}
                  maxLength={180}
                  value={selected.question}
                  onChange={(event) =>
                    setSelected({ ...selected, question: event.target.value })
                  }
                  className={field}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Respuesta
                <textarea
                  required
                  minLength={10}
                  maxLength={6000}
                  rows={7}
                  value={selected.answer}
                  onChange={(event) =>
                    setSelected({ ...selected, answer: event.target.value })
                  }
                  className={field + " resize-y"}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium">
                  Categoría
                  <input
                    required
                    maxLength={60}
                    value={selected.category}
                    onChange={(event) =>
                      setSelected({ ...selected, category: event.target.value })
                    }
                    className={field}
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Visible para
                  <select
                    aria-label="Visible para"
                    value={selected.audience}
                    onChange={(event) =>
                      setSelected({ ...selected, audience: event.target.value })
                    }
                    className={field}
                  >
                    <option value="ACCOUNT">
                      Clientes con sesión iniciada
                    </option>
                    <option value="PUBLIC">Visitantes del sitio</option>
                    <option value="BOTH">Clientes y visitantes</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-2 text-sm font-medium">
                Preguntas alternativas
                <textarea
                  rows={3}
                  value={aliases}
                  onChange={(event) => setAliases(event.target.value)}
                  placeholder="Una forma de preguntar por línea (máximo 15)"
                  className={field}
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  Ayudan a reconocer consultas equivalentes, incluso sin IA.
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium">
                  Estado
                  <select
                    aria-label="Estado"
                    value={selected.status}
                    onChange={(event) =>
                      setSelected({ ...selected, status: event.target.value })
                    }
                    className={field}
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="ARCHIVED">Archivado</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Orden de aparición
                  <input
                    type="number"
                    min={-10000}
                    max={10000}
                    value={selected.sortOrder}
                    onChange={(event) =>
                      setSelected({
                        ...selected,
                        sortOrder: Number(event.target.value),
                      })
                    }
                    className={field}
                  />
                </label>
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.isStarter}
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      isStarter: event.target.checked,
                    })
                  }
                  className="mt-1"
                />
                <span>
                  Mostrar como pregunta inicial
                  <span className="mt-1 block text-xs text-muted-foreground">
                    El chat muestra hasta ocho preguntas iniciales según su
                    orden y visibilidad.
                  </span>
                </span>
              </label>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  VISTA PREVIA
                </p>
                <p className="text-sm font-semibold">
                  {selected.question || "Tu pregunta"}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                  {selected.answer || "Aquí aparecerá la respuesta."}
                </p>
              </div>
              <button
                type="submit"
                disabled={!!pending}
                className={
                  button +
                  " bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                {pending === "article" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar pregunta
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8">
              <BookOpen className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold">
                Tu experiencia, disponible en el chat
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Selecciona un tema o crea una pregunta. Las respuestas
                publicadas alimentan al asistente y las preguntas iniciales
                orientan al usuario. Cuando necesite una persona, recibirás la
                alerta con el enlace a su conversación.
              </p>
            </div>
          )}
        </div>
      ) : settings ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run("settings", async () => {
              const response = await api.put<Settings>(
                "/support/settings",
                { ...settings, apiKey: key.trim() || undefined },
                { timeout: 20000 },
              );
              setSettings(response.data);
              setKey("");
              cache.setQueryData(["support-settings"], response.data);
              setNotice("Configuración guardada.");
            });
          }}
          className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold">
              Respuestas con tu base de soporte
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Las preguntas iniciales y sus alternativas usan tus respuestas
              publicadas. Activa Gemini para interpretar consultas redactadas
              libremente. Si falta información o el usuario pide una persona, la
              conversación pasa a soporte humano.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                setSettings({ ...settings, enabled: event.target.checked })
              }
            />
            Habilitar el asistente automático
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Saludo del chat
            <textarea
              maxLength={600}
              rows={3}
              required
              value={settings.welcomeMessage}
              onChange={(event) =>
                setSettings({ ...settings, welcomeMessage: event.target.value })
              }
              className={field}
            />
          </label>
          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Conexión con Gemini API</h3>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {settings.keyConfigured
                  ? "Clave guardada"
                  : "Sin clave configurada"}
              </span>
            </div>
            <label className="block space-y-2 text-sm font-medium">
              Clave de Google AI Studio
              <input
                type="password"
                autoComplete="new-password"
                spellCheck={false}
                value={key}
                onChange={(event) => {
                  setKey(event.target.value);
                  setModels([]);
                }}
                placeholder={
                  settings.keyConfigured
                    ? "Deja vacío para conservar la clave actual"
                    : "Ingresa tu clave de Gemini API"
                }
                maxLength={300}
                className={field}
              />
            </label>
            <button
              type="button"
              disabled={!!pending}
              onClick={() =>
                void run("verify", async () => {
                  const response = await api.post<{
                    models: Array<{ id: string; name: string }>;
                  }>(
                    "/support/check-gemini",
                    { apiKey: key.trim() || undefined },
                    { timeout: 15000 },
                  );
                  setModels(response.data.models);
                  setNotice(
                    "Conexión verificada. Selecciona un modelo disponible y guarda la configuración.",
                  );
                })
              }
              className={button}
            >
              {pending === "verify" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Verificar conexión y listar modelos
            </button>
            <label className="block space-y-2 text-sm font-medium">
              Modelo
              <select
                aria-label="Modelo"
                value={settings.geminiModel}
                onChange={(event) =>
                  setSettings({ ...settings, geminiModel: event.target.value })
                }
                className={field}
              >
                <option value="">
                  Selecciona un modelo después de verificar
                </option>
                {settings.geminiModel &&
                  !models.some(
                    (model) => model.id === settings.geminiModel,
                  ) && (
                    <option value={settings.geminiModel}>
                      {settings.geminiModel}
                    </option>
                  )}
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.aiEnabled}
                onChange={(event) =>
                  setSettings({ ...settings, aiEnabled: event.target.checked })
                }
              />
              <span>
                Activar respuestas de Gemini para clientes
                <span className="mt-1 block text-xs text-muted-foreground">
                  Usará el modelo seleccionado y los temas publicados para
                  clientes.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.publicAiEnabled}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    publicAiEnabled: event.target.checked,
                  })
                }
              />
              <span>
                Permitir Gemini también en el chat público
                <span className="mt-1 block text-xs text-muted-foreground">
                  Requiere Gemini activo. Solo usa los temas publicados para
                  visitantes.
                </span>
              </span>
            </label>
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                Límite diario de consultas a Gemini
                <input
                  type="number"
                  min={1}
                  max={10000}
                  required
                  value={settings.dailyLimit}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      dailyLimit: Number(event.target.value),
                    })
                  }
                  className={field}
                />
              </label>
              <p className="pb-3 text-sm text-muted-foreground">
                {settings.dailyCalls} consultas reservadas hoy · reinicio a las
                00:00 UTC
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Las consultas pueden generar consumo en tu proyecto de Google.
              Revisa sus{" "}
              <a
                href="https://ai.google.dev/gemini-api/docs/pricing"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                tarifas y condiciones de uso de datos
              </a>
              . La clave se conserva protegida en el servidor y no se muestra
              nuevamente.
            </p>
          </div>
          <button
            type="submit"
            disabled={!!pending}
            className={
              button + " bg-primary text-primary-foreground hover:bg-primary/90"
            }
          >
            {pending === "settings" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar configuración
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Cargando configuración…</p>
      )}
    </main>
  );
}
