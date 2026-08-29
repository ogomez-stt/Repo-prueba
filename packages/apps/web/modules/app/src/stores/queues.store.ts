import { makeAutoObservable } from "mobx";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TicketState = "waiting" | "serving" | "done";
export type AttentionMode = "auto" | "manual";
export type Saturation = "ok" | "busy" | "full";

export interface Ticket {
  numero: string;
  cliente: string;
  espera: string;   // display, e.g. "12 min"
  waitedMin: number; // numeric minutes for urgency calc
}

export interface Queue {
  id: string;
  nombre: string;
  color: string;              // tailwind bg class for the dot
  servicio: string;
  mode: AttentionMode;
  tiempoProm: number;         // minutes
  activa: boolean;
  waiting: Ticket[];
  serving: Ticket[];
  done: Ticket[];
}

const URGENT_THRESHOLD = 10; // minutes

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const seed = (): Queue[] => [
  {
    id: "1", nombre: "Consulta general", color: "bg-brand-500", servicio: "general", mode: "auto", tiempoProm: 14, activa: true,
    waiting: [
      { numero: "A-043", cliente: "Ana Silva", espera: "15 min", waitedMin: 15 },
      { numero: "A-044", cliente: "Pedro Ramirez", espera: "6 min", waitedMin: 6 },
      { numero: "A-045", cliente: "Marta Ruiz", espera: "3 min", waitedMin: 3 },
    ],
    serving: [{ numero: "A-042", cliente: "Maria Gonzalez", espera: "0 min", waitedMin: 0 }],
    done: [{ numero: "A-041", cliente: "Sofia Diaz", espera: "", waitedMin: 0 }],
  },
  {
    id: "2", nombre: "Laboratorio", color: "bg-secondary-500", servicio: "general", mode: "manual", tiempoProm: 25, activa: true,
    waiting: [
      { numero: "L-018", cliente: "Carlos Mendoza", espera: "22 min", waitedMin: 22 },
      { numero: "L-019", cliente: "Lucia Torres", espera: "12 min", waitedMin: 12 },
    ],
    serving: [{ numero: "L-017", cliente: "Diego Rojas", espera: "0 min", waitedMin: 0 }],
    done: [],
  },
  {
    id: "3", nombre: "Farmacia", color: "bg-accent-500", servicio: "general", mode: "auto", tiempoProm: 6, activa: false,
    waiting: [],
    serving: [],
    done: [{ numero: "F-030", cliente: "Juan Perez", espera: "", waitedMin: 0 }],
  },
];

const COLOR_OPTIONS = ["bg-brand-500", "bg-secondary-500", "bg-accent-500", "bg-warning-500", "bg-success-500"];

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

class QueuesStore {
  queues: Queue[] = seed();

  constructor() {
    makeAutoObservable(this);
  }

  // ── Lookups ──
  getQueue(id: string): Queue | undefined {
    return this.queues.find((q) => q.id === id);
  }

  getQueueByName(nombre: string): Queue | undefined {
    return this.queues.find((q) => q.nombre === nombre);
  }

  // ── Derived / stats ──
  saturationOf(q: Queue): Saturation {
    if (!q.activa) return "ok";
    if (q.waiting.length >= 8) return "full";
    if (q.waiting.length >= 4) return "busy";
    return "ok";
  }

  isUrgent(t: Ticket): boolean {
    return t.waitedMin >= URGENT_THRESHOLD;
  }

  get activeCount(): number {
    return this.queues.filter((q) => q.activa).length;
  }

  get totalWaiting(): number {
    return this.queues.reduce((s, q) => s + (q.activa ? q.waiting.length : 0), 0);
  }

  get totalServing(): number {
    return this.queues.reduce((s, q) => s + q.serving.length, 0);
  }

  get totalDoneToday(): number {
    return this.queues.reduce((s, q) => s + q.done.length, 0);
  }

  get totalEmittedToday(): number {
    return this.queues.reduce((s, q) => s + q.waiting.length + q.serving.length + q.done.length, 0);
  }

  get avgWaitMin(): number {
    const active = this.queues.filter((q) => q.activa && q.waiting.length > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((s, q) => s + q.tiempoProm, 0) / active.length);
  }

  /** The most-recently-called serving ticket across all queues (for dashboard hero). */
  get currentTicket(): { ticket: Ticket; queue: Queue } | null {
    for (const q of this.queues) {
      if (q.serving.length > 0) return { ticket: q.serving[0], queue: q };
    }
    return null;
  }

  // ── Queue CRUD ──
  createQueue(data: { nombre: string; servicio: string; mode: AttentionMode; tiempoProm: number }): void {
    const color = COLOR_OPTIONS[this.queues.length % COLOR_OPTIONS.length];
    this.queues.push({
      id: crypto.randomUUID(),
      nombre: data.nombre,
      color,
      servicio: data.servicio,
      mode: data.mode,
      tiempoProm: data.tiempoProm,
      activa: true,
      waiting: [],
      serving: [],
      done: [],
    });
  }

  updateQueue(id: string, data: { nombre?: string; servicio?: string; mode?: AttentionMode; tiempoProm?: number }): void {
    const q = this.getQueue(id);
    if (!q) return;
    if (data.nombre !== undefined) q.nombre = data.nombre;
    if (data.servicio !== undefined) q.servicio = data.servicio;
    if (data.mode !== undefined) q.mode = data.mode;
    if (data.tiempoProm !== undefined) q.tiempoProm = data.tiempoProm;
  }

  deleteQueue(id: string): void {
    this.queues = this.queues.filter((q) => q.id !== id);
  }

  toggleQueue(id: string, active: boolean): void {
    const q = this.getQueue(id);
    if (q) q.activa = active;
  }

  setMode(id: string, mode: AttentionMode): void {
    const q = this.getQueue(id);
    if (q) q.mode = mode;
  }

  // ── Ticket operations (within a queue) ──
  private col(q: Queue, key: TicketState): Ticket[] {
    return key === "waiting" ? q.waiting : key === "serving" ? q.serving : q.done;
  }

  moveTicket(queueId: string, from: TicketState, numero: string, to: TicketState): void {
    const q = this.getQueue(queueId);
    if (!q) return;
    // Enforce single serving ticket
    if (to === "serving" && q.serving.length >= 1) return;
    const fromList = this.col(q, from);
    const idx = fromList.findIndex((t) => t.numero === numero);
    if (idx === -1) return;
    const [moved] = fromList.splice(idx, 1);
    this.col(q, to).push(to === "done" ? { ...moved } : moved);
  }

  removeTicket(queueId: string, numero: string): void {
    const q = this.getQueue(queueId);
    if (!q) return;
    q.waiting = q.waiting.filter((t) => t.numero !== numero);
    q.serving = q.serving.filter((t) => t.numero !== numero);
  }

  /** Auto: complete current serving and pull next waiting into serving. */
  finishAndAdvance(queueId: string): void {
    const q = this.getQueue(queueId);
    if (!q) return;
    if (q.serving.length > 0) {
      const [current] = q.serving.splice(0, 1);
      q.done.push(current);
    }
    if (q.waiting.length > 0) {
      const [next] = q.waiting.splice(0, 1);
      q.serving.push({ ...next, espera: "0 min", waitedMin: 0 });
    }
  }

  /** Start serving the first waiting ticket if none is being served. */
  callNext(queueId: string): void {
    const q = this.getQueue(queueId);
    if (!q || q.serving.length > 0 || q.waiting.length === 0) return;
    const [next] = q.waiting.splice(0, 1);
    q.serving.push({ ...next, espera: "0 min", waitedMin: 0 });
  }

  /** Complete current serving without auto-calling next (manual). */
  finishCurrent(queueId: string): void {
    const q = this.getQueue(queueId);
    if (!q || q.serving.length === 0) return;
    const [current] = q.serving.splice(0, 1);
    q.done.push(current);
  }
}

export const queuesStore = new QueuesStore();
export { QueuesStore };
