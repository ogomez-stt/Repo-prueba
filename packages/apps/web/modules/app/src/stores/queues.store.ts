import { makeAutoObservable, runInAction } from "mobx";
import { queuesApi } from "@/services/queues.api";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TicketState = "waiting" | "serving" | "done";
export type AttentionMode = "auto" | "manual";
export type Saturation = "ok" | "busy" | "full";
export type FieldType = "text" | "textarea" | "number" | "select";

/** A custom field the operator/bot must fill when creating a ticket in this queue. */
export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // only for type 'select'
}

export interface Ticket {
  numero: string;
  cliente: string;
  espera: string;   // display, e.g. "12 min"
  waitedMin: number; // numeric minutes for urgency calc
  telefono?: string;
  datos?: Record<string, string>; // values for the queue's custom fields
}

export interface Queue {
  id: string;
  nombre: string;
  color: string;              // tailwind bg class for the dot
  servicio: string;
  mode: AttentionMode;
  tiempoProm: number;         // minutes
  activa: boolean;
  campos: CustomField[];      // per-queue custom fields for ticket creation
  /**
   * Reglas propias de la fila. Cada campo es OPCIONAL: si es undefined, la fila
   * usa la regla global (turnoRules). Permite personalizar prefijo, urgencia y
   * umbrales de saturación fila por fila.
   */
  prefijo?: string;           // prefijo propio del número de turno (ej. "LAB")
  urgenciaMin?: number;       // minutos para marcar urgente (override global)
  saturacionBusy?: number;    // en espera para "ocupada" (override global)
  saturacionFull?: number;    // en espera para "llena" (override global)
  waiting: Ticket[];
  serving: Ticket[];
  done: Ticket[];
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface Survey {
  id: string;
  cliente: string;
  queueId: string;
  queueName: string;
  rating: number;       // 1-5
  comentario: string;
  fecha: string;        // display date
  daysAgo: number;      // for trend ordering
}

/** Branding/copy for the public survey view (the link the client opens). */
export interface SurveyConfig {
  businessName: string;
  logoUrl: string;         // optional; empty = show a default star mark
  title: string;           // e.g. "¿Cómo estuvo tu experiencia?"
  subtitle: string;        // supporting line under the title
  /** Label de la pregunta de satisfacción (obligatoria). */
  satisfactionLabel: string;
  /** Label de la pregunta de recomendación (opcional). */
  recommendationLabel: string;
  /** Label del campo de comentarios. */
  commentsLabel: string;
  /** Placeholder del campo de comentarios. */
  commentsPlaceholder: string;
  /** Texto del botón de envío. */
  submitLabel: string;
  thankYouTitle: string;   // success state heading
  thankYouMessage: string;
}

/** Config por defecto de la encuesta pública. */
const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  businessName: "Mi Negocio",
  logoUrl: "",
  title: "¿Cómo estuvo tu experiencia?",
  subtitle: "Tómate un momento para calificar tu visita.",
  satisfactionLabel: "Tu satisfacción general",
  recommendationLabel: "¿Qué tan probable es que nos recomiendes?",
  commentsLabel: "Comentarios",
  commentsPlaceholder: "Cuéntanos qué te pareció...",
  submitLabel: "Enviar calificación",
  thankYouTitle: "¡Gracias por tu opinión!",
  thankYouMessage: "Tu respuesta nos ayuda a mejorar el servicio para ti y para todos.",
};

const SURVEY_CONFIG_KEY = "necto.surveyConfig";

/** Carga la config guardada (merge con defaults) desde localStorage. */
function loadSurveyConfig(): SurveyConfig {
  try {
    const raw = localStorage.getItem(SURVEY_CONFIG_KEY);
    if (raw) return { ...DEFAULT_SURVEY_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Entorno sin localStorage o JSON inválido: usa defaults.
  }
  return { ...DEFAULT_SURVEY_CONFIG };
}

/** Persiste la config en localStorage (para que la encuesta pública la lea). */
function persistSurveyConfig(cfg: SurveyConfig): void {
  try {
    localStorage.setItem(SURVEY_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACION DEL NEGOCIO (onboarding del modulo de Turnos)
// ═══════════════════════════════════════════════════════════════════════════

/** Tipos de negocio soportados por el onboarding de Turnos. */
export type TipoNegocio = "clinica" | "restaurante" | "tramites" | "salon" | "otro";

/**
 * Configuracion inicial del negocio para el modulo de Turnos.
 * Se captura en el onboarding (primer inicio del admin) y se persiste local.
 */
export interface BusinessConfig {
  /** Nombre del negocio (mostrado en pantallas y encuesta). */
  nombre: string;
  /** Tipo de negocio elegido (define el preset de filas sugerido). */
  tipoNegocio: TipoNegocio;
  /**
   * Logo del negocio como data URL (base64) subido por el usuario, o URL.
   * Vacio = sin logo. En el onboarding se sube como imagen (data URL).
   */
  logoUrl: string;
  /** A que se dedica el negocio (giro / descripcion corta). */
  descripcion: string;
  /** Telefono de contacto del negocio. */
  telefono: string;
  /** Correo de contacto del negocio. */
  email: string;
  /** Direccion del negocio (opcional). */
  direccion: string;
  /** Como se llama internamente cada unidad de atencion (ej: "Fila", "Turno"). */
  terminologia: string;
  /** True cuando el admin ya completo el onboarding de Turnos. */
  configurado: boolean;
}

const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  nombre: "",
  tipoNegocio: "otro",
  logoUrl: "",
  descripcion: "",
  telefono: "",
  email: "",
  direccion: "",
  terminologia: "Fila",
  configurado: false,
};

const BUSINESS_CONFIG_KEY = "necto.businessConfig";

/** Carga la config del negocio (merge con defaults) desde localStorage. */
function loadBusinessConfig(): BusinessConfig {
  try {
    const raw = localStorage.getItem(BUSINESS_CONFIG_KEY);
    if (raw) return { ...DEFAULT_BUSINESS_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Entorno sin localStorage o JSON invalido: usa defaults.
  }
  return { ...DEFAULT_BUSINESS_CONFIG };
}

/** Persiste la config del negocio en localStorage. */
function persistBusinessConfig(cfg: BusinessConfig): void {
  try {
    localStorage.setItem(BUSINESS_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HORARIO DE ATENCION DEL NEGOCIO
// ═══════════════════════════════════════════════════════════════════════════

/** Dia de la semana (0 = Domingo … 6 = Sabado, igual que Date.getDay()). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Horario de un dia: si atiende y en que franja (horas 0–24). */
export interface HorarioDia {
  dia: DiaSemana;
  abierto: boolean;
  /** Hora de apertura (0–23). */
  desde: number;
  /** Hora de cierre (1–24). */
  hasta: number;
}

/** Etiquetas legibles de cada dia (para la UI), indexadas por DiaSemana. */
export const DIAS_SEMANA: { dia: DiaSemana; label: string; corto: string }[] = [
  { dia: 1, label: "Lunes", corto: "Lun" },
  { dia: 2, label: "Martes", corto: "Mar" },
  { dia: 3, label: "Miércoles", corto: "Mié" },
  { dia: 4, label: "Jueves", corto: "Jue" },
  { dia: 5, label: "Viernes", corto: "Vie" },
  { dia: 6, label: "Sábado", corto: "Sáb" },
  { dia: 0, label: "Domingo", corto: "Dom" },
];

/** Horario por defecto: Lun–Vie 8–18, Sáb 9–13, Dom cerrado. */
const DEFAULT_HORARIO: HorarioDia[] = [
  { dia: 0, abierto: false, desde: 9, hasta: 13 },
  { dia: 1, abierto: true, desde: 8, hasta: 18 },
  { dia: 2, abierto: true, desde: 8, hasta: 18 },
  { dia: 3, abierto: true, desde: 8, hasta: 18 },
  { dia: 4, abierto: true, desde: 8, hasta: 18 },
  { dia: 5, abierto: true, desde: 8, hasta: 18 },
  { dia: 6, abierto: true, desde: 9, hasta: 13 },
];

const HORARIO_KEY = "necto.horario";

/** Normaliza/valida un horario cargado, completando dias faltantes con el default. */
function normalizarHorario(parsed: unknown): HorarioDia[] {
  const base = DEFAULT_HORARIO.map((d) => ({ ...d }));
  if (!Array.isArray(parsed)) return base;
  for (const item of parsed as Partial<HorarioDia>[]) {
    const idx = base.findIndex((d) => d.dia === item?.dia);
    if (idx !== -1) {
      base[idx] = {
        dia: base[idx].dia,
        abierto: typeof item?.abierto === "boolean" ? item.abierto : base[idx].abierto,
        desde: typeof item?.desde === "number" ? item.desde : base[idx].desde,
        hasta: typeof item?.hasta === "number" ? item.hasta : base[idx].hasta,
      };
    }
  }
  return base;
}

function loadHorario(): HorarioDia[] {
  try {
    const raw = localStorage.getItem(HORARIO_KEY);
    if (raw) return normalizarHorario(JSON.parse(raw));
  } catch {
    // Sin localStorage o JSON invalido: usa el default.
  }
  return DEFAULT_HORARIO.map((d) => ({ ...d }));
}

function persistHorario(h: HorarioDia[]): void {
  try {
    localStorage.setItem(HORARIO_KEY, JSON.stringify(h));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

/** Fila precargada por preset (subconjunto editable de Queue, sin tickets). */
export interface PresetQueue {
  nombre: string;
  servicio: string;
  mode: AttentionMode;
  tiempoProm: number;
  campos: CustomField[];
}

export interface NegocioPreset {
  tipo: TipoNegocio;
  label: string;
  descripcion: string;
  /** Terminologia sugerida para las unidades de atencion. */
  terminologia: string;
  /** Filas que se precargan al elegir este preset. */
  filas: PresetQueue[];
}

/** Catalogo de presets por tipo de negocio (con filas precargadas). */
const NEGOCIO_PRESETS: NegocioPreset[] = [
  {
    tipo: "clinica",
    label: "Clinica / Salud",
    descripcion: "Consultas, laboratorio y atencion medica.",
    terminologia: "Fila",
    filas: [
      {
        nombre: "Consulta general", servicio: "general", mode: "auto", tiempoProm: 14,
        campos: [
          { id: "motivo", label: "Motivo de consulta", type: "textarea", required: true },
          { id: "documento", label: "Documento", type: "text", required: false },
        ],
      },
      {
        nombre: "Laboratorio", servicio: "general", mode: "manual", tiempoProm: 25,
        campos: [],
      },
    ],
  },
  {
    tipo: "restaurante",
    label: "Restaurante",
    descripcion: "Pedidos en mesa, para llevar y domicilio.",
    terminologia: "Fila",
    filas: [
      {
        nombre: "En mesa", servicio: "restaurante", mode: "manual", tiempoProm: 20,
        campos: [
          { id: "pedido", label: "Pedido", type: "textarea", required: true },
          { id: "personas", label: "N° de personas", type: "number", required: false },
        ],
      },
      {
        nombre: "Para llevar", servicio: "restaurante", mode: "auto", tiempoProm: 12,
        campos: [{ id: "pedido", label: "Pedido", type: "textarea", required: true }],
      },
      {
        nombre: "Domicilio", servicio: "restaurante", mode: "auto", tiempoProm: 35,
        campos: [
          { id: "pedido", label: "Pedido", type: "textarea", required: true },
          { id: "direccion", label: "Direccion", type: "text", required: true },
        ],
      },
    ],
  },
  {
    tipo: "tramites",
    label: "Banco / Tramites",
    descripcion: "Atencion en ventanilla y tramites por tipo.",
    terminologia: "Turno",
    filas: [
      {
        nombre: "Caja", servicio: "general", mode: "auto", tiempoProm: 8,
        campos: [{ id: "documento", label: "Documento", type: "text", required: true }],
      },
      {
        nombre: "Atencion al cliente", servicio: "general", mode: "auto", tiempoProm: 15,
        campos: [{ id: "motivo", label: "Motivo", type: "textarea", required: false }],
      },
    ],
  },
  {
    tipo: "salon",
    label: "Salon / Estetica",
    descripcion: "Turnos por servicio (corte, color, unas).",
    terminologia: "Turno",
    filas: [
      {
        nombre: "Corte", servicio: "general", mode: "manual", tiempoProm: 30,
        campos: [{ id: "servicio", label: "Servicio", type: "text", required: false }],
      },
      {
        nombre: "Color / Tratamiento", servicio: "general", mode: "manual", tiempoProm: 60,
        campos: [{ id: "servicio", label: "Servicio", type: "text", required: false }],
      },
    ],
  },
  {
    tipo: "otro",
    label: "Otro / Personalizado",
    descripcion: "Empieza sin filas y crealas a tu medida.",
    terminologia: "Fila",
    filas: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// REGLAS DE TURNOS (configurables)
// ═══════════════════════════════════════════════════════════════════════════

/** De dónde sale el prefijo del número de turno. */
export type PrefijoModo = "inicial" | "fijo";

/**
 * Reglas globales de generación y estado de los turnos del negocio.
 * Reemplazan las constantes que antes estaban fijas en el código.
 */
export interface TurnoRules {
  /**
   * Cómo se arma el prefijo del número de turno:
   * - "inicial": la primera letra del nombre de la fila (A-045, L-018).
   * - "fijo": un prefijo único para todas las filas (definido en `prefijoFijo`).
   */
  prefijoModo: PrefijoModo;
  /** Prefijo único usado cuando prefijoModo = "fijo" (ej. "T"). */
  prefijoFijo: string;
  /** Reinicia la numeración cada día (mock: informativo por ahora). */
  reinicioDiario: boolean;
  /** Minutos de espera desde los que un turno se marca como urgente. */
  urgenciaMin: number;
  /** N° de turnos en espera desde el que una fila se considera "ocupada". */
  saturacionBusy: number;
  /** N° de turnos en espera desde el que una fila se considera "llena". */
  saturacionFull: number;
}

const DEFAULT_TURNO_RULES: TurnoRules = {
  prefijoModo: "inicial",
  prefijoFijo: "T",
  reinicioDiario: true,
  urgenciaMin: 10,
  saturacionBusy: 4,
  saturacionFull: 8,
};

const TURNO_RULES_KEY = "necto.turnoRules";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACION DE LA PANTALLA DE SALA (DISPLAY)
// ═══════════════════════════════════════════════════════════════════════════

/** Config de la pantalla pública de sala (/display). */
export interface DisplayConfig {
  /** Reproducir un beep cuando cambia el turno llamado. */
  sonido: boolean;
  /** Mostrar el nombre del cliente (si no, solo el número — más privado). */
  mostrarNombre: boolean;
  /** Cuántos turnos "siguientes" listar (1–8). */
  siguientesVisibles: number;
  /** Usar el logo del negocio (si no, el logo de NECTO). */
  usarLogoNegocio: boolean;
  /** Mensaje opcional en el pie de la pantalla (ej. "Gracias por su visita"). */
  mensajePie: string;
}

const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  sonido: true,
  mostrarNombre: true,
  siguientesVisibles: 5,
  usarLogoNegocio: false,
  mensajePie: "",
};

const DISPLAY_CONFIG_KEY = "necto.displayConfig";

function loadDisplayConfig(): DisplayConfig {
  try {
    const raw = localStorage.getItem(DISPLAY_CONFIG_KEY);
    if (raw) return { ...DEFAULT_DISPLAY_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Sin localStorage o JSON invalido: usa defaults.
  }
  return { ...DEFAULT_DISPLAY_CONFIG };
}

function persistDisplayConfig(c: DisplayConfig): void {
  try {
    localStorage.setItem(DISPLAY_CONFIG_KEY, JSON.stringify(c));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

function loadTurnoRules(): TurnoRules {
  try {
    const raw = localStorage.getItem(TURNO_RULES_KEY);
    if (raw) return { ...DEFAULT_TURNO_RULES, ...JSON.parse(raw) };
  } catch {
    // Sin localStorage o JSON invalido: usa defaults.
  }
  return { ...DEFAULT_TURNO_RULES };
}

function persistTurnoRules(r: TurnoRules): void {
  try {
    localStorage.setItem(TURNO_RULES_KEY, JSON.stringify(r));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const seed = (): Queue[] => [
  {
    id: "1", nombre: "Consulta general", color: "bg-brand-500", servicio: "general", mode: "auto", tiempoProm: 14, activa: true,
    campos: [
      { id: "motivo", label: "Motivo de consulta", type: "textarea", required: true },
      { id: "documento", label: "Documento", type: "text", required: false },
    ],
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
    campos: [],
    waiting: [
      { numero: "L-018", cliente: "Carlos Mendoza", espera: "22 min", waitedMin: 22 },
      { numero: "L-019", cliente: "Lucia Torres", espera: "12 min", waitedMin: 12 },
    ],
    serving: [{ numero: "L-017", cliente: "Diego Rojas", espera: "0 min", waitedMin: 0 }],
    done: [],
  },
  {
    id: "3", nombre: "Mesa / Pedidos", color: "bg-accent-500", servicio: "restaurante", mode: "manual", tiempoProm: 20, activa: true,
    campos: [
      { id: "pedido", label: "Pedido", type: "textarea", required: true },
      { id: "personas", label: "N° de personas", type: "number", required: false },
      { id: "modalidad", label: "Modalidad", type: "select", required: true, options: ["En mesa", "Para llevar", "Domicilio"] },
    ],
    waiting: [
      { numero: "M-012", cliente: "Juan Carlos", espera: "8 min", waitedMin: 8, datos: { pedido: "2 bandeja paisa", modalidad: "En mesa" } },
    ],
    serving: [],
    done: [{ numero: "M-011", cliente: "Laura Peña", espera: "", waitedMin: 0, datos: { pedido: "1 mojarra frita", modalidad: "Para llevar" } }],
  },
];

const COLOR_OPTIONS = ["bg-brand-500", "bg-secondary-500", "bg-accent-500", "bg-warning-500", "bg-success-500"];

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

class QueuesStore {
  queues: Queue[] = seed();

  /** True once the backend has answered at least once; falls back to seed data otherwise. */
  apiConnected = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  // ── Backend sync ──
  /** Load all queues from the API. Falls back silently to seed data on failure. */
  async loadQueues(): Promise<void> {
    this.loading = true;
    try {
      const queues = await queuesApi.list();
      runInAction(() => {
        this.queues = queues;
        this.apiConnected = true;
      });
    } catch (err) {
      // Backend not reachable — keep working with local (seed) data.
      console.warn("[queuesStore] API no disponible, usando datos locales:", err);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  /** Re-fetch a single queue and merge it into local state. */
  private async refreshQueue(id: string): Promise<void> {
    if (!this.apiConnected) return;
    try {
      const fresh = await queuesApi.get(id);
      if (!fresh) return;
      runInAction(() => {
        const idx = this.queues.findIndex((q) => q.id === id);
        if (idx !== -1) this.queues[idx] = fresh;
      });
    } catch (err) {
      console.warn("[queuesStore] refreshQueue fallo:", err);
    }
  }

  /** Fire an API call in the background; on success reconcile the affected queue. */
  private sync(queueId: string | null, call: Promise<unknown>): void {
    if (!this.apiConnected) return;
    call
      .then(() => (queueId ? this.refreshQueue(queueId) : this.loadQueues()))
      .catch((err) => console.warn("[queuesStore] sync fallo:", err));
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
    if (q.waiting.length >= this.saturacionFullDe(q)) return "full";
    if (q.waiting.length >= this.saturacionBusyDe(q)) return "busy";
    return "ok";
  }

  /**
   * ¿El ticket es urgente? Si se pasa la fila, usa su umbral propio (con
   * fallback global); si no, usa el umbral global. La fila es opcional para
   * no romper las llamadas existentes.
   */
  isUrgent(t: Ticket, q?: Queue): boolean {
    const umbral = q ? this.urgenciaDe(q) : this.turnoRules.urgenciaMin;
    return t.waitedMin >= umbral;
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
  createQueue(data: {
    nombre: string;
    servicio: string;
    mode: AttentionMode;
    tiempoProm: number;
    campos?: CustomField[];
    prefijo?: string;
    urgenciaMin?: number;
    saturacionBusy?: number;
    saturacionFull?: number;
  }): void {
    const color = COLOR_OPTIONS[this.queues.length % COLOR_OPTIONS.length];
    this.queues.push({
      id: crypto.randomUUID(),
      nombre: data.nombre,
      color,
      servicio: data.servicio,
      mode: data.mode,
      tiempoProm: data.tiempoProm,
      activa: true,
      campos: data.campos ?? [],
      prefijo: data.prefijo?.trim() ? data.prefijo.trim().toUpperCase() : undefined,
      urgenciaMin: data.urgenciaMin,
      saturacionBusy: data.saturacionBusy,
      saturacionFull: data.saturacionFull,
      waiting: [],
      serving: [],
      done: [],
    });
    // API assigns the real id → reload the full list to reconcile.
    this.sync(null, queuesApi.create(data));
  }

  updateQueue(id: string, data: {
    nombre?: string;
    servicio?: string;
    mode?: AttentionMode;
    tiempoProm?: number;
    campos?: CustomField[];
    /** Reglas por fila. `null` = quitar el override y volver a la regla global. */
    prefijo?: string | null;
    urgenciaMin?: number | null;
    saturacionBusy?: number | null;
    saturacionFull?: number | null;
  }): void {
    const q = this.getQueue(id);
    if (!q) return;
    if (data.nombre !== undefined) q.nombre = data.nombre;
    if (data.servicio !== undefined) q.servicio = data.servicio;
    if (data.mode !== undefined) q.mode = data.mode;
    if (data.tiempoProm !== undefined) q.tiempoProm = data.tiempoProm;
    if (data.campos !== undefined) q.campos = data.campos;
    // Reglas por fila: null limpia el override (vuelve al global), undefined lo deja igual.
    if (data.prefijo !== undefined) {
      q.prefijo = data.prefijo && data.prefijo.trim() ? data.prefijo.trim().toUpperCase() : undefined;
    }
    if (data.urgenciaMin !== undefined) q.urgenciaMin = data.urgenciaMin ?? undefined;
    if (data.saturacionBusy !== undefined) q.saturacionBusy = data.saturacionBusy ?? undefined;
    if (data.saturacionFull !== undefined) q.saturacionFull = data.saturacionFull ?? undefined;
    this.sync(id, queuesApi.update(id, data));
  }

  deleteQueue(id: string): void {
    this.queues = this.queues.filter((q) => q.id !== id);
    this.sync(null, queuesApi.remove(id));
  }

  toggleQueue(id: string, active: boolean): void {
    const q = this.getQueue(id);
    if (q) q.activa = active;
    this.sync(id, queuesApi.update(id, { activa: active }));
  }

  setMode(id: string, mode: AttentionMode): void {
    const q = this.getQueue(id);
    if (q) q.mode = mode;
    this.sync(id, queuesApi.update(id, { mode }));
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
    this.sync(queueId, queuesApi.moveTicket(queueId, numero, to));
  }

  removeTicket(queueId: string, numero: string): void {
    const q = this.getQueue(queueId);
    if (!q) return;
    q.waiting = q.waiting.filter((t) => t.numero !== numero);
    q.serving = q.serving.filter((t) => t.numero !== numero);
    this.sync(queueId, queuesApi.removeTicket(queueId, numero));
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
    this.sync(queueId, queuesApi.finish(queueId, true));
  }

  /** Create a new ticket in a queue (operator view). The bot uses the same API. */
  createTicket(queueId: string, data: { cliente: string; telefono: string; datos?: Record<string, string> }): void {
    const q = this.getQueue(queueId);
    if (!q) return;
    // Optimistic local insert with a provisional number; refreshed from API.
    const provisional = `${this.prefijoDe(q)}-${String(
      q.waiting.length + q.serving.length + q.done.length + 1,
    ).padStart(3, "0")}`;
    q.waiting.push({
      numero: provisional,
      cliente: data.cliente,
      espera: "0 min",
      waitedMin: 0,
      telefono: data.telefono,
      datos: data.datos,
    });
    this.sync(queueId, queuesApi.createTicket(queueId, data));
  }

  /** Start serving the first waiting ticket if none is being served. */
  callNext(queueId: string): void {
    const q = this.getQueue(queueId);
    if (!q || q.serving.length > 0 || q.waiting.length === 0) return;
    const [next] = q.waiting.splice(0, 1);
    q.serving.push({ ...next, espera: "0 min", waitedMin: 0 });
    this.sync(queueId, queuesApi.callNext(queueId));
  }

  /** Complete current serving without auto-calling next (manual). */
  finishCurrent(queueId: string): void {
    const q = this.getQueue(queueId);
    if (!q || q.serving.length === 0) return;
    const [current] = q.serving.splice(0, 1);
    q.done.push(current);
    this.sync(queueId, queuesApi.finish(queueId, false));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SURVEYS
  // ═══════════════════════════════════════════════════════════════════════════

  surveys: Survey[] = seedSurveys();

  /**
   * Config for the public survey view (editable from the Encuestas dashboard).
   * Se persiste en localStorage para que la encuesta pública (/s/:token, que se
   * abre en otra pestaña con recarga completa) refleje los últimos cambios.
   */
  surveyConfig: SurveyConfig = loadSurveyConfig();

  updateSurveyConfig(data: Partial<SurveyConfig>): void {
    this.surveyConfig = { ...this.surveyConfig, ...data };
    persistSurveyConfig(this.surveyConfig);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACION DEL NEGOCIO (onboarding de Turnos)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Config inicial del negocio para el modulo de Turnos (persistida local). */
  businessConfig: BusinessConfig = loadBusinessConfig();

  /**
   * True cuando hay que mostrar el onboarding de configuracion de Turnos.
   * Solo lo activa "Simular inicio desde 0" (es una prueba); el inicio normal
   * nunca lo enciende. No se persiste: vive solo durante la sesion de prueba.
   */
  onboardingPendiente = false;

  /** Enciende el onboarding de configuracion (usado por "Simular inicio desde 0"). */
  activarOnboarding(): void {
    this.onboardingPendiente = true;
  }

  // ── Horario de atencion ───────────────────────────────────────────────────

  /** Horario de atencion del negocio por dia de la semana (persistido local). */
  horario: HorarioDia[] = loadHorario();

  /** Horario ordenado Lun→Dom para mostrar en la UI. */
  get horarioOrdenado(): HorarioDia[] {
    return DIAS_SEMANA.map((d) => this.horario.find((h) => h.dia === d.dia)!).filter(Boolean);
  }

  /** ¿El negocio esta abierto ahora mismo (segun el horario configurado)? */
  get abiertoAhora(): boolean {
    const now = new Date();
    const dia = now.getDay() as DiaSemana;
    const h = this.horario.find((x) => x.dia === dia);
    if (!h || !h.abierto) return false;
    const hora = now.getHours() + now.getMinutes() / 60;
    return hora >= h.desde && hora < h.hasta;
  }

  /** Actualiza el horario de un dia concreto. */
  updateHorarioDia(dia: DiaSemana, data: Partial<Omit<HorarioDia, "dia">>): void {
    const idx = this.horario.findIndex((h) => h.dia === dia);
    if (idx === -1) return;
    const actual = this.horario[idx];
    let desde = data.desde ?? actual.desde;
    let hasta = data.hasta ?? actual.hasta;
    // Coherencia: la apertura siempre antes del cierre.
    if (hasta <= desde) {
      if (data.desde !== undefined) hasta = Math.min(desde + 1, 24);
      else desde = Math.max(hasta - 1, 0);
    }
    this.horario[idx] = { ...actual, ...data, desde, hasta };
    persistHorario(this.horario);
  }

  // ── Reglas de turnos ──────────────────────────────────────────────────────

  /** Config de la pantalla de sala (/display), persistida local. */
  displayConfig: DisplayConfig = loadDisplayConfig();

  /** Actualiza (parcialmente) la config del display y persiste. */
  updateDisplayConfig(data: Partial<DisplayConfig>): void {
    let next = { ...this.displayConfig, ...data };
    if (data.siguientesVisibles !== undefined) {
      const n = data.siguientesVisibles;
      next.siguientesVisibles = Math.min(Math.max(Number.isFinite(n) ? n : 5, 1), 8);
    }
    this.displayConfig = next;
    persistDisplayConfig(this.displayConfig);
  }

  /** Reglas globales de generación/estado de turnos (persistidas local). */
  turnoRules: TurnoRules = loadTurnoRules();

  /** Actualiza (parcialmente) las reglas de turnos y persiste. */
  updateTurnoRules(data: Partial<TurnoRules>): void {
    let next = { ...this.turnoRules, ...data };
    // Coherencia de saturación: "llena" nunca por debajo de "ocupada".
    if (next.saturacionFull <= next.saturacionBusy) {
      next = { ...next, saturacionFull: next.saturacionBusy + 1 };
    }
    // Prefijo fijo válido (1–3 caracteres, sin espacios), en mayúsculas.
    if (data.prefijoFijo !== undefined) {
      next.prefijoFijo = data.prefijoFijo.trim().toUpperCase().slice(0, 3);
    }
    this.turnoRules = next;
    persistTurnoRules(this.turnoRules);
  }

  /** Prefijo a usar para una fila. Prioridad: prefijo propio → regla global → inicial. */
  prefijoDe(q: Queue): string {
    // 1) Prefijo propio de la fila (si lo definió el admin).
    if (q.prefijo && q.prefijo.trim()) return q.prefijo.trim().toUpperCase();
    // 2) Regla global de prefijo fijo.
    const r = this.turnoRules;
    if (r.prefijoModo === "fijo" && r.prefijoFijo) return r.prefijoFijo;
    // 3) Inicial del nombre de la fila.
    return q.nombre.charAt(0).toUpperCase();
  }

  /** Minutos de urgencia efectivos de una fila (propio o global). */
  urgenciaDe(q: Queue): number {
    return q.urgenciaMin ?? this.turnoRules.urgenciaMin;
  }

  /** Umbral "ocupada" efectivo de una fila (propio o global). */
  saturacionBusyDe(q: Queue): number {
    return q.saturacionBusy ?? this.turnoRules.saturacionBusy;
  }

  /** Umbral "llena" efectivo de una fila (propio o global). */
  saturacionFullDe(q: Queue): number {
    return q.saturacionFull ?? this.turnoRules.saturacionFull;
  }

  /** Presets disponibles por tipo de negocio (solo lectura). */
  get presets(): NegocioPreset[] {
    return NEGOCIO_PRESETS;
  }

  /** True cuando el admin ya completo el onboarding de Turnos. */
  get turnosConfigurado(): boolean {
    return this.businessConfig.configurado;
  }

  getPreset(tipo: TipoNegocio): NegocioPreset | undefined {
    return NEGOCIO_PRESETS.find((p) => p.tipo === tipo);
  }

  /** Actualiza campos de la config del negocio sin cerrar el onboarding. */
  updateBusinessConfig(data: Partial<BusinessConfig>): void {
    this.businessConfig = { ...this.businessConfig, ...data };
    persistBusinessConfig(this.businessConfig);
  }

  /**
   * Reemplaza TODAS las filas por las del preset elegido (onboarding).
   * Cada fila se materializa como Queue vacia (sin tickets), con color rotativo.
   */
  aplicarPreset(tipo: TipoNegocio): void {
    const preset = this.getPreset(tipo);
    if (!preset) return;
    this.queues = preset.filas.map((f, i) => ({
      id: crypto.randomUUID(),
      nombre: f.nombre,
      color: COLOR_OPTIONS[i % COLOR_OPTIONS.length],
      servicio: f.servicio,
      mode: f.mode,
      tiempoProm: f.tiempoProm,
      activa: true,
      campos: f.campos.map((c) => ({ ...c })),
      waiting: [],
      serving: [],
      done: [],
    }));
    this.businessConfig = {
      ...this.businessConfig,
      tipoNegocio: tipo,
      terminologia: preset.terminologia,
    };
    persistBusinessConfig(this.businessConfig);
  }

  /**
   * Cierra el onboarding: fusiona los datos finales y marca `configurado = true`.
   * Se llama al confirmar el ultimo paso del wizard.
   */
  guardarConfig(data: Partial<BusinessConfig>): void {
    this.businessConfig = { ...this.businessConfig, ...data, configurado: true };
    persistBusinessConfig(this.businessConfig);
    this.onboardingPendiente = false;
  }

  /**
   * "Simular inicio desde 0": limpia la config del negocio y deja las filas
   * vacias para arrancar el onboarding desde cero.
   */
  resetTurnos(): void {
    this.businessConfig = { ...DEFAULT_BUSINESS_CONFIG };
    persistBusinessConfig(this.businessConfig);
    this.queues = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODO DEMO ("desde 0") — reset reversible de todos los datos de Turnos
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Deja el modulo de Turnos completamente vacio (sin filas ni encuestas) y
   * limpia la config del negocio. Usado por "Simular inicio desde 0" para
   * arrancar como un negocio recien creado. Reversible con restaurarSeed().
   */
  iniciarDesdeCero(): void {
    this.queues = [];
    this.surveys = [];
    this.businessConfig = { ...DEFAULT_BUSINESS_CONFIG };
    persistBusinessConfig(this.businessConfig);
  }

  /**
   * Restaura los datos de ejemplo (seed) de Turnos: filas, encuestas y la
   * config del negocio guardada. Usado por el inicio normal para volver a la
   * data completa tras haber probado el modo "desde 0".
   */
  restaurarSeed(): void {
    this.queues = seed();
    this.surveys = seedSurveys();
    this.businessConfig = loadBusinessConfig();
    this.onboardingPendiente = false;
  }

  sentimentOf(rating: number): Sentiment {
    if (rating >= 4) return "positive";
    if (rating === 3) return "neutral";
    return "negative";
  }

  get avgRating(): number {
    if (this.surveys.length === 0) return 0;
    return this.surveys.reduce((s, x) => s + x.rating, 0) / this.surveys.length;
  }

  get totalResponses(): number {
    return this.surveys.length;
  }

  /** Response rate: surveys / total tickets that were completed. */
  get responseRate(): number {
    const completed = this.totalDoneToday + this.surveys.length;
    if (completed === 0) return 0;
    return Math.round((this.surveys.length / completed) * 100);
  }

  /** Rating distribution [count5, count4, count3, count2, count1]. */
  get ratingDistribution(): number[] {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 5 stars
    for (const s of this.surveys) dist[5 - s.rating]++;
    return dist;
  }

  /** Average rating per queue name. */
  get avgByQueue(): { name: string; avg: number }[] {
    const map = new Map<string, { sum: number; n: number }>();
    for (const s of this.surveys) {
      const e = map.get(s.queueName) ?? { sum: 0, n: 0 };
      e.sum += s.rating; e.n += 1;
      map.set(s.queueName, e);
    }
    return [...map.entries()].map(([name, e]) => ({ name, avg: e.n ? e.sum / e.n : 0 }));
  }

  /** Rating trend over recent days (oldest first). */
  get ratingTrend(): { day: string; avg: number }[] {
    const buckets = new Map<number, { sum: number; n: number }>();
    for (const s of this.surveys) {
      const e = buckets.get(s.daysAgo) ?? { sum: 0, n: 0 };
      e.sum += s.rating; e.n += 1;
      buckets.set(s.daysAgo, e);
    }
    const days = [6, 5, 4, 3, 2, 1, 0];
    return days.map((d) => {
      const e = buckets.get(d);
      const labels = ["Hoy", "Ayer", "-2d", "-3d", "-4d", "-5d", "-6d"];
      return { day: labels[d], avg: e && e.n ? Number((e.sum / e.n).toFixed(1)) : 0 };
    }).reverse();
  }

  get lowRatingSurveys(): Survey[] {
    return this.surveys.filter((s) => s.rating <= 2);
  }

  /** Frequent topics from comments (naive word frequency + sentiment). */
  get topics(): { word: string; count: number; sentiment: "positive" | "negative" }[] {
    const positive = new Set(["rapido", "amable", "excelente", "bueno", "atento", "eficiente"]);
    const negative = new Set(["lento", "espera", "demora", "malo", "grosero", "desorganizado"]);
    const counts = new Map<string, number>();
    for (const s of this.surveys) {
      for (const raw of s.comentario.toLowerCase().split(/[^a-zñáéíóú]+/)) {
        if (raw.length < 4) continue;
        if (positive.has(raw) || negative.has(raw)) counts.set(raw, (counts.get(raw) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([word, count]) => ({
        word,
        count,
        sentiment: positive.has(word) ? "positive" as const : "negative" as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
}

const seedSurveys = (): Survey[] => [
  { id: "s1", cliente: "Maria Gonzalez", queueId: "1", queueName: "Consulta general", rating: 5, comentario: "Atencion muy rapida y amable, excelente servicio", fecha: "Hoy 10:24", daysAgo: 0 },
  { id: "s2", cliente: "Carlos Mendoza", queueId: "2", queueName: "Laboratorio", rating: 2, comentario: "La espera fue muy lenta, demora demasiado", fecha: "Hoy 09:50", daysAgo: 0 },
  { id: "s3", cliente: "Ana Silva", queueId: "1", queueName: "Consulta general", rating: 4, comentario: "Todo bien, personal amable", fecha: "Ayer 16:10", daysAgo: 1 },
  { id: "s4", cliente: "Pedro Ramirez", queueId: "3", queueName: "Farmacia", rating: 5, comentario: "Rapido y eficiente, muy bueno", fecha: "Ayer 14:30", daysAgo: 1 },
  { id: "s5", cliente: "Lucia Torres", queueId: "2", queueName: "Laboratorio", rating: 1, comentario: "Muy lento, la espera fue horrible", fecha: "-2d 11:05", daysAgo: 2 },
  { id: "s6", cliente: "Diego Rojas", queueId: "1", queueName: "Consulta general", rating: 4, comentario: "Buen servicio, atento", fecha: "-2d 10:00", daysAgo: 2 },
  { id: "s7", cliente: "Sofia Diaz", queueId: "3", queueName: "Farmacia", rating: 5, comentario: "Excelente, muy amable", fecha: "-3d 15:20", daysAgo: 3 },
  { id: "s8", cliente: "Marta Ruiz", queueId: "1", queueName: "Consulta general", rating: 3, comentario: "Normal, nada especial", fecha: "-4d 12:00", daysAgo: 4 },
  { id: "s9", cliente: "Jorge Nieto", queueId: "2", queueName: "Laboratorio", rating: 2, comentario: "Espera larga, mejorar la demora", fecha: "-5d 09:15", daysAgo: 5 },
  { id: "s10", cliente: "Elena Vargas", queueId: "3", queueName: "Farmacia", rating: 5, comentario: "Rapido, excelente atencion", fecha: "-6d 17:40", daysAgo: 6 },
];

export const queuesStore = new QueuesStore();
export { QueuesStore };
