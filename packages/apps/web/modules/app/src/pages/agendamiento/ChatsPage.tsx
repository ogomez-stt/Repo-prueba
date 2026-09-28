import { useState } from "react";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Button } from "@/elements/ui/button";
import { Badge } from "@/elements/ui/badge";
import { Tab } from "@/elements/ui/tabs";
import {
  asesorChatsStore,
  sessionStore,
  type Conversacion,
  type ChatEstado,
} from "@/stores";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 3.5a.6.6 0 01.82-.72l16.5 8.25a.6.6 0 010 1.08L4.09 20.4a.6.6 0 01-.82-.72L6 12zm0 0h6" />
  </svg>
);

const ChatEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-12 w-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.84L3 20l1.06-3.18A7.99 7.99 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const inicialesDe = (nombre: string) =>
  nombre.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

type FiltroTab = "sin_asignar" | "mios" | "resuelto";

const ESTADO_BADGE: Record<ChatEstado, { label: string; color: "warning" | "info" | "success" }> = {
  sin_asignar: { label: "Sin asignar", color: "warning" },
  en_curso: { label: "En curso", color: "info" },
  resuelto: { label: "Resuelto", color: "success" },
};

const ultimaLinea = (c: Conversacion) => {
  const last = c.mensajes[c.mensajes.length - 1];
  return last ? last.texto : "";
};
const ultimaHora = (c: Conversacion) => {
  const last = c.mensajes[c.mensajes.length - 1];
  return last ? last.hora : "";
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ChatsPage — bandeja de conversaciones de asesor (módulo Agendamiento).
 *
 * Los clientes que piden "hablar con un asesor" por WhatsApp entran aquí. Un
 * operador puede tomar el chat, responder y marcarlo como resuelto. Construida
 * sobre el patrón de chat de Elements (use-cases/chat) conectada al store real.
 */
export const ChatsPage = observer(() => {
  const [tab, setTab] = useState<FiltroTab>("sin_asignar");
  const [busqueda, setBusqueda] = useState("");
  const [borrador, setBorrador] = useState("");

  // Identidad del asesor actual: operador simulado, o el admin como "Asesor".
  const op = sessionStore.operadorSimulado;
  const asesorId = op?.id ?? "admin";
  const asesorNombre = op?.nombre ?? "Asesor";

  const store = asesorChatsStore;
  const sel = store.seleccionada;

  // ── Lista filtrada por pestaña + búsqueda ──
  const base: Conversacion[] =
    tab === "sin_asignar" ? store.porEstado("sin_asignar")
      : tab === "mios" ? store.mios(op?.id ?? null)
      : store.porEstado("resuelto");

  const q = busqueda.trim().toLowerCase();
  const lista = q
    ? base.filter((c) =>
        c.cliente.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        ultimaLinea(c).toLowerCase().includes(q))
    : base;

  const tabs = [
    { key: "sin_asignar", label: "Sin asignar", badge: store.countSinAsignar || undefined },
    { key: "mios", label: "Míos", badge: store.countMios(op?.id ?? null) || undefined },
    { key: "resuelto", label: "Resueltos", badge: store.countResueltos || undefined },
  ];

  // ── Acciones ──
  const enviar = () => {
    if (!sel || sel.estado !== "en_curso" || !borrador.trim()) return;
    store.responder(sel.id, borrador);
    setBorrador("");
  };

  return (
    <>
      <PageMeta title="Chats" description="Bandeja de conversaciones de asesor" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Chats</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Conversaciones de clientes que pidieron hablar con un asesor por WhatsApp.
        </p>
      </div>

      <div className="flex h-[calc(100vh-13rem)] gap-5">
        {/* ── Columna izquierda: bandeja ── */}
        <aside className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Buscador */}
          <div className="border-b border-gray-100 p-4 dark:border-gray-800">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono o mensaje"
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div className="mt-3">
              <Tab
                items={tabs}
                activeTab={tab}
                onTabChange={(k) => setTab(k as FiltroTab)}
                variant="underline"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {lista.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                No hay conversaciones en esta pestaña.
              </p>
            ) : (
              <ul>
                {lista.map((c) => {
                  const activa = sel?.id === c.id;
                  const eb = ESTADO_BADGE[c.estado];
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => store.seleccionar(c.id)}
                        className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                          activa
                            ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/10"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                          {inicialesDe(c.cliente)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{c.cliente}</p>
                            <span className="shrink-0 text-xs text-gray-400">{ultimaHora(c)}</span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{ultimaLinea(c)}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge size="xs" color={eb.color}>{eb.label}</Badge>
                            {c.noLeidos > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                                {c.noLeidos}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Columna derecha: conversación ── */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {!sel ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-gray-400 dark:text-gray-500">
              <ChatEmptyIcon />
              <h3 className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">Selecciona una conversación</h3>
              <p className="mt-1 max-w-sm text-sm">
                Elige un chat de la izquierda para verlo aquí. Los nuevos chats de clientes que piden un asesor aparecerán en "Sin asignar".
              </p>
            </div>
          ) : (
            <>
              {/* Header de la conversación */}
              <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                    {inicialesDe(sel.cliente)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{sel.cliente}</p>
                    <p className="truncate text-xs text-gray-400">{sel.telefono} · {sel.motivo}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge size="sm" color={ESTADO_BADGE[sel.estado].color}>{ESTADO_BADGE[sel.estado].label}</Badge>
                  {sel.estado === "sin_asignar" && (
                    <Button size="sm" onClick={() => store.tomar(sel.id, asesorId, asesorNombre)}>Tomar chat</Button>
                  )}
                  {sel.estado === "en_curso" && (
                    <Button size="sm" variant="outline" onClick={() => store.resolver(sel.id)}>Marcar resuelto</Button>
                  )}
                  {sel.estado === "resuelto" && (
                    <Button size="sm" variant="outline" onClick={() => store.reabrir(sel.id)}>Reabrir</Button>
                  )}
                </div>
              </header>

              {/* Hilo de mensajes */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-5 py-6 dark:bg-gray-900/40">
                {sel.mensajes.map((m) => {
                  if (m.autor === "sistema") {
                    return (
                      <p key={m.id} className="mx-auto w-fit rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        {m.texto} · {m.hora}
                      </p>
                    );
                  }
                  const esAsesor = m.autor === "asesor";
                  return (
                    <div key={m.id} className={`flex ${esAsesor ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        esAsesor
                          ? "rounded-br-sm bg-brand-500 text-white"
                          : "rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-white/90"
                      }`}>
                        <p className="whitespace-pre-line text-sm leading-relaxed">{m.texto}</p>
                        <p className={`mt-1 text-right text-[10px] ${esAsesor ? "text-white/60" : "text-gray-400"}`}>{m.hora}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composición / aviso según estado */}
              <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                {sel.estado === "sin_asignar" ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-4 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toma el chat para poder responder.</p>
                    <Button size="sm" onClick={() => store.tomar(sel.id, asesorId, asesorNombre)}>Tomar chat</Button>
                  </div>
                ) : sel.estado === "resuelto" ? (
                  <p className="py-2 text-center text-sm text-gray-400 dark:text-gray-500">
                    Esta conversación está resuelta. Reábrela para seguir respondiendo.
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      value={borrador}
                      onChange={(e) => setBorrador(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          enviar();
                        }
                      }}
                      rows={1}
                      placeholder="Escribe tu respuesta…"
                      className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-200"
                    />
                    <Button size="icon" onClick={enviar} disabled={!borrador.trim()}>
                      <SendIcon />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
});

export default ChatsPage;
