import { useState } from "react";
import { PageMeta } from "@/shell/meta";
import { Alert } from "@/elements/ui/alert";
import { ButtonsGroup } from "@/elements/ui/buttons-group";
import { TicketCard, type Ticket } from "./components/TicketCard";

type Mode = "auto" | "manual";

// ── Mock data ──
const waitingInit: Ticket[] = [
  { numero: "A-043", cliente: "Ana Silva", servicio: "Asesoria Comercial", espera: "15 min", urgent: true },
  { numero: "B-108", cliente: "Carlos Mendoza", servicio: "Soporte Tecnico", espera: "12 min", urgent: true },
  { numero: "A-044", cliente: "Pedro Ramirez", servicio: "Asesoria Comercial", espera: "6 min" },
  { numero: "C-013", cliente: "Lucia Torres", servicio: "Retiros", espera: "3 min" },
];

const servingInit: Ticket[] = [
  { numero: "A-042", cliente: "Maria Gonzalez", servicio: "Asesoria Comercial", espera: "0 min" },
];

const doneInit: Ticket[] = [
  { numero: "C-012", cliente: "Juan Perez", servicio: "Retiros", espera: "" },
  { numero: "A-041", cliente: "Sofia Diaz", servicio: "Asesoria Comercial", espera: "" },
];

/**
 * TurnosPage — "Mis Turnos" queue board for small businesses.
 * Auto (FIFO) / Manual attention modes, large touch-friendly cards.
 */
export const TurnosPage = () => {
  const [mode, setMode] = useState<Mode>("auto");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [service, setService] = useState("todos");

  const waiting = waitingInit.filter((t) => {
    const matchSearch = !search ||
      t.cliente.toLowerCase().includes(search.toLowerCase()) ||
      t.numero.toLowerCase().includes(search.toLowerCase());
    const matchService = service === "todos" || t.servicio === service;
    return matchSearch && matchService;
  });

  const urgentCount = waiting.filter((t) => t.urgent).length;
  const waitingCount = waiting.length;

  const subtitle = waitingCount > 0
    ? `Tienes ${waitingCount} ${waitingCount === 1 ? "persona esperando" : "personas esperando"}`
    : "No hay nadie esperando ahora";

  const services = ["todos", ...Array.from(new Set(waitingInit.map((t) => t.servicio)))];

  const isEmpty = waitingInit.length === 0 && servingInit.length === 0 && doneInit.length === 0;

  return (
    <>
      <PageMeta title="Mis Turnos" description="Gestiona tus turnos del dia" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Mis Turnos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {/* Mode + primary action */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Modo:</span>
          <ButtonsGroup
            items={[
              { label: "Automatico", onClick: () => setMode("auto") },
              { label: "Manual", onClick: () => setMode("manual") },
            ]}
            variant={mode === "auto" ? "primary" : "secondary"}
          />
        </div>
        <button className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          Llamar siguiente
        </button>
      </div>

      {/* Search + service filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o numero de turno..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        />
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 sm:w-56"
        >
          {services.map((s) => (
            <option key={s} value={s}>{s === "todos" ? "Todos los servicios" : s}</option>
          ))}
        </select>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-500 dark:bg-success-500/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Todo al dia</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay nadie esperando.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Esperando */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Esperando</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{waiting.length}</span>
            </div>

            {urgentCount > 0 && (
              <div className="mb-3">
                <Alert
                  variant="warning"
                  title="Atencion"
                  message={`${urgentCount} ${urgentCount === 1 ? "persona lleva" : "personas llevan"} mucho esperando`}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {waiting.map((t) => (
                <TicketCard
                  key={t.numero}
                  ticket={t}
                  state="waiting"
                  selectable={mode === "manual"}
                  selected={mode === "manual" && selected === t.numero}
                  onSelect={() => setSelected(t.numero)}
                  onPrimary={() => { /* atender */ }}
                  onNoShow={() => { /* no se presento */ }}
                  onReschedule={() => { /* reagendar */ }}
                />
              ))}
              {waiting.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
                  Nadie esperando
                </p>
              )}
            </div>
          </div>

          {/* Atendiendo */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Atendiendo</h2>
              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-300">{servingInit.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {servingInit.map((t) => (
                <TicketCard key={t.numero} ticket={t} state="serving" onPrimary={() => {}} onNoShow={() => {}} onReschedule={() => {}} />
              ))}
              {servingInit.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
                  Nadie en atencion
                </p>
              )}
            </div>
          </div>

          {/* Listos hoy */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Listos hoy</h2>
              <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15">{doneInit.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {doneInit.map((t) => (
                <TicketCard key={t.numero} ticket={t} state="done" />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TurnosPage;
