import { useState } from "react";
import { PageMeta } from "@/shell/meta";
import { Alert } from "@/elements/ui/alert";
import { ButtonsGroup } from "@/elements/ui/buttons-group";
import { Modal } from "@/elements/ui/modal";
import { Button } from "@/elements/ui/button";
import { TicketCard, type Ticket, type TicketState } from "./components/TicketCard";

type Mode = "auto" | "manual";
type ColumnKey = "waiting" | "serving" | "done";

interface Board {
  waiting: Ticket[];
  serving: Ticket[];
  done: Ticket[];
}

const initialBoard: Board = {
  waiting: [
    { numero: "A-043", cliente: "Ana Silva", servicio: "Asesoria Comercial", espera: "15 min", urgent: true },
    { numero: "B-108", cliente: "Carlos Mendoza", servicio: "Soporte Tecnico", espera: "12 min", urgent: true },
    { numero: "A-044", cliente: "Pedro Ramirez", servicio: "Asesoria Comercial", espera: "6 min" },
    { numero: "C-013", cliente: "Lucia Torres", servicio: "Retiros", espera: "3 min" },
  ],
  serving: [
    { numero: "A-042", cliente: "Maria Gonzalez", servicio: "Asesoria Comercial", espera: "0 min" },
  ],
  done: [
    { numero: "C-012", cliente: "Juan Perez", servicio: "Retiros", espera: "" },
    { numero: "A-041", cliente: "Sofia Diaz", servicio: "Asesoria Comercial", espera: "" },
  ],
};

const columnMeta: { key: ColumnKey; title: string; state: TicketState; count: (b: Board) => number; badgeClass: string }[] = [
  { key: "waiting", title: "Esperando", state: "waiting", count: (b) => b.waiting.length, badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  { key: "serving", title: "Atendiendo", state: "serving", count: (b) => b.serving.length, badgeClass: "bg-secondary-100 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-300" },
  { key: "done", title: "Listos hoy", state: "done", count: (b) => b.done.length, badgeClass: "bg-success-50 text-success-600 dark:bg-success-500/15" },
];

/**
 * TurnosPage — "Mis Turnos" queue board for small businesses.
 * Auto (FIFO, read-only) / Manual (drag & drop + actions) modes.
 */
export const TurnosPage = () => {
  const [mode, setMode] = useState<Mode>("auto");
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [service, setService] = useState("todos");

  // Drag state
  const [dragged, setDragged] = useState<{ from: ColumnKey; numero: string } | null>(null);
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);

  // Modals
  const [rescheduleTicket, setRescheduleTicket] = useState<Ticket | null>(null);
  const [cancelTicket, setCancelTicket] = useState<{ ticket: Ticket; reason: "cancel" | "noshow" } | null>(null);

  const isManual = mode === "manual";

  const filterFn = (t: Ticket) => {
    const matchSearch = !search ||
      t.cliente.toLowerCase().includes(search.toLowerCase()) ||
      t.numero.toLowerCase().includes(search.toLowerCase());
    const matchService = service === "todos" || t.servicio === service;
    return matchSearch && matchService;
  };

  const waiting = board.waiting.filter(filterFn);
  const urgentCount = waiting.filter((t) => t.urgent).length;
  const waitingCount = board.waiting.length;

  const subtitle = waitingCount > 0
    ? `Tienes ${waitingCount} ${waitingCount === 1 ? "persona esperando" : "personas esperando"}`
    : "No hay nadie esperando ahora";

  const services = ["todos", ...Array.from(new Set(initialBoard.waiting.map((t) => t.servicio)))];

  // Allowed moves per source column (prevents nonsensical cycles):
  // waiting -> serving | done ; serving -> done only ; done -> nowhere
  const allowedTargets: Record<ColumnKey, ColumnKey[]> = {
    waiting: ["serving", "done"],
    serving: ["done"],
    done: [],
  };

  const canDrop = (from: ColumnKey, target: ColumnKey) =>
    from !== target && allowedTargets[from].includes(target);

  // ── Drag & drop (manual only) ──
  const handleDrop = (target: ColumnKey) => {
    if (!dragged || !canDrop(dragged.from, target)) { setDragOver(null); return; }
    setBoard((prev) => {
      const fromList = [...prev[dragged.from]];
      const idx = fromList.findIndex((t) => t.numero === dragged.numero);
      if (idx === -1) return prev;
      const [moved] = fromList.splice(idx, 1);
      const cleaned = target === "done" ? { ...moved, urgent: false } : moved;
      return { ...prev, [dragged.from]: fromList, [target]: [...prev[target], cleaned] };
    });
    setDragged(null);
    setDragOver(null);
  };

  const movePrimary = (from: ColumnKey, numero: string) => {
    const target: ColumnKey = from === "waiting" ? "serving" : "done";
    setBoard((prev) => {
      const fromList = [...prev[from]];
      const idx = fromList.findIndex((t) => t.numero === numero);
      if (idx === -1) return prev;
      const [moved] = fromList.splice(idx, 1);
      return { ...prev, [from]: fromList, [target]: [...prev[target], { ...moved, urgent: false }] };
    });
  };

  const removeTicket = (numero: string) => {
    setBoard((prev) => ({
      waiting: prev.waiting.filter((t) => t.numero !== numero),
      serving: prev.serving.filter((t) => t.numero !== numero),
      done: prev.done,
    }));
  };

  const columnData = (key: ColumnKey): Ticket[] => (key === "waiting" ? waiting : board[key]);

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
            variant="secondary"
          />
        </div>
        {/* Llamar siguiente only in manual mode */}
        {isManual && (
          <button className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            Llamar siguiente
          </button>
        )}
      </div>

      {/* Auto mode banner — shows current ticket + advance button */}
      {!isManual && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Modo automatico activo</p>
                <p className="text-xs text-brand-600/80 dark:text-brand-300/70">
                  El sistema llama los turnos en orden de llegada (FIFO).
                </p>
              </div>
            </div>

            {/* Current ticket + advance */}
            <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 dark:bg-gray-900">
              {board.serving.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs text-gray-400">Atendiendo ahora</p>
                    <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
                      {board.serving[0].numero}
                      <span className="ml-2 text-sm font-normal text-gray-500">{board.serving[0].cliente}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => movePrimary("serving", board.serving[0].numero)}
                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Terminar turno
                  </button>
                </>
              ) : board.waiting.length > 0 ? (
                <button
                  onClick={() => movePrimary("waiting", board.waiting[0].numero)}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Llamar siguiente ({board.waiting[0].numero})
                </button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay turnos en cola</p>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Board */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {columnMeta.map((col) => {
          const tickets = columnData(col.key);
          const isValidTarget = !!dragged && canDrop(dragged.from, col.key);
          const isInvalidTarget = !!dragged && dragged.from !== col.key && !canDrop(dragged.from, col.key);
          const isDropTarget = isManual && dragOver === col.key && isValidTarget;
          return (
            <div
              key={col.key}
              onDragOver={isManual && isValidTarget ? (e) => { e.preventDefault(); setDragOver(col.key); } : undefined}
              onDragLeave={isManual ? () => setDragOver((c) => (c === col.key ? null : c)) : undefined}
              onDrop={isManual ? () => handleDrop(col.key) : undefined}
              className={
                "rounded-2xl p-1 transition-colors " +
                (isDropTarget ? "bg-brand-50 ring-2 ring-dashed ring-brand-300 dark:bg-brand-500/10 " : "") +
                (isInvalidTarget ? "opacity-50 " : "")
              }
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{col.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${col.badgeClass}`}>{col.count(board)}</span>
              </div>

              {col.key === "waiting" && urgentCount > 0 && (
                <div className="mb-3">
                  <Alert
                    variant="warning"
                    title="Atencion"
                    message={`${urgentCount} ${urgentCount === 1 ? "persona lleva" : "personas llevan"} mucho esperando`}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                {tickets.map((t) => (
                  <TicketCard
                    key={t.numero}
                    ticket={t}
                    state={col.state}
                    interactive={isManual}
                    selected={isManual && selected === t.numero}
                    onSelect={() => setSelected(t.numero)}
                    onPrimary={() => movePrimary(col.key, t.numero)}
                    onReschedule={() => setRescheduleTicket(t)}
                    onNoShow={() => setCancelTicket({ ticket: t, reason: "noshow" })}
                    onCancel={() => setCancelTicket({ ticket: t, reason: "cancel" })}
                    onDragStart={() => setDragged({ from: col.key, numero: t.numero })}
                    onDragEnd={() => { setDragged(null); setDragOver(null); }}
                  />
                ))}
                {tickets.length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
                    {col.key === "waiting" ? "Nadie esperando" : col.key === "serving" ? "Nadie en atencion" : "Aun sin completar"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reschedule modal */}
      <Modal isOpen={!!rescheduleTicket} onClose={() => setRescheduleTicket(null)} className="max-w-[440px] p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Reagendar turno</h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {rescheduleTicket && `${rescheduleTicket.numero} — ${rescheduleTicket.cliente}`}
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva fecha</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-brand-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva hora</label>
            <input type="time" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-brand-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nota (opcional)</label>
            <textarea rows={2} placeholder="Motivo del cambio..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setRescheduleTicket(null)}>Cancelar</Button>
          <Button size="sm" onClick={() => setRescheduleTicket(null)}>Reagendar</Button>
        </div>
      </Modal>

      {/* Cancel / No-show modal */}
      <Modal isOpen={!!cancelTicket} onClose={() => setCancelTicket(null)} showCloseButton={false} className="max-w-[420px] p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {cancelTicket?.reason === "noshow" ? "Marcar como no se presento" : "Cancelar turno"}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cancelTicket && `${cancelTicket.ticket.numero} — ${cancelTicket.ticket.cliente}`}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {cancelTicket?.reason === "noshow"
              ? "El turno se marcara como no presentado y saldra de la cola."
              : "Esta accion quitara el turno de la cola. No se puede deshacer."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setCancelTicket(null)}>Volver</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { if (cancelTicket) removeTicket(cancelTicket.ticket.numero); setCancelTicket(null); }}
            >
              {cancelTicket?.reason === "noshow" ? "Marcar" : "Cancelar turno"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TurnosPage;
