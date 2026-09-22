import { makeAutoObservable } from "mobx";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CitaEstado = "pendiente" | "confirmada" | "completada" | "cancelada" | "noshow";
export type Modalidad = "presencial" | "virtual";

export interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
  color: string;      // tailwind bg class
  avatar: string;     // initials
  /** Disponibilidad del profesional: sus días laborales, horario y duración de slot. */
  config: CalendarConfig;
}

export interface Cita {
  id: string;
  clienteId: string;
  cliente: string;
  telefono: string;
  profesionalId: string;
  servicio: string;
  fecha: string;       // ISO date "YYYY-MM-DD"
  hora: string;        // "HH:MM"
  duracion: number;    // minutes
  modalidad: Modalidad;
  estado: CitaEstado;
  notas?: string;
  enlace?: string;     // video link when virtual
  origen: "whatsapp" | "operador";
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  desde: string;       // ISO date of first appointment
  totalCitas: number;
  completadas: number;
  noShows: number;
}

/** Loyalty tier for a client, derived from their appointment regularity. */
export type Tier = "oro" | "plata" | "bronce" | "riesgo";

/** A client enriched with loyalty/regularity insights (analytics view). */
export interface ClienteFidelidad {
  cliente: Cliente;
  tier: Tier;
  /** Attendance rate: completadas / (completadas + noShows), 0–100. */
  cumplimiento: number;
  /** Days since the client's first appointment. */
  antiguedadDias: number;
  /** Suggested reward the operator can offer now, or null. */
  recompensa: string | null;
  /** Why the client is at risk, when tier === "riesgo". */
  motivoRiesgo: string | null;
}

/** Calendar availability config: which weekdays and what hours the business works. */
export interface CalendarConfig {
  /** Working weekdays: 0=Sunday … 6=Saturday. */
  diasLaborales: number[];
  horaInicio: number;   // e.g. 9  (09:00)
  horaFin: number;      // e.g. 18 (18:00)
  duracionSlot: number; // minutes per slot (30 or 60)
}

/** Editable loyalty program: thresholds per tier + the reward/coupon text each one gets. */
export interface LoyaltyConfig {
  /** Min completed appointments to reach Gold. */
  oroMin: number;
  /** Min completed appointments to reach Silver. */
  plataMin: number;
  /** No-shows that flag a client as "at risk". */
  riesgoNoShows: number;
  /** Days without returning that flag a recurring client as "at risk". */
  riesgoInactivoDias: number;
  /** Reward/coupon text offered to each tier (empty = no reward for that tier). */
  recompensaOro: string;
  recompensaPlata: string;
  recompensaBronce: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE HELPERS  (relative to "today" so the mock always stays coherent)
// ═══════════════════════════════════════════════════════════════════════════

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const todayIso = () => iso(new Date());

// ═══════════════════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════════════════

/** Config de disponibilidad por defecto para un profesional nuevo (Lun–Vie, 9–18, slots de 1h). */
const DEFAULT_CONFIG: CalendarConfig = {
  diasLaborales: [1, 2, 3, 4, 5],
  horaInicio: 9,
  horaFin: 18,
  duracionSlot: 60,
};

const PROFESIONALES: Profesional[] = [
  // Ana: Lun–Vie 9–18, slots de 1h.
  { id: "p1", nombre: "Dra. Ana Gómez", especialidad: "Psicología", color: "bg-brand-500", avatar: "AG", config: { diasLaborales: [1, 2, 3, 4, 5], horaInicio: 9, horaFin: 18, duracionSlot: 60 } },
  // Luis: Lun–Sáb 8–14, slots de 30min.
  { id: "p2", nombre: "Dr. Luis Peña", especialidad: "Nutrición", color: "bg-secondary-500", avatar: "LP", config: { diasLaborales: [1, 2, 3, 4, 5, 6], horaInicio: 8, horaFin: 14, duracionSlot: 30 } },
  // María: Mar/Jue/Sáb 10–17, slots de 1h.
  { id: "p3", nombre: "Lic. María Ruiz", especialidad: "Fisioterapia", color: "bg-accent-500", avatar: "MR", config: { diasLaborales: [2, 4, 6], horaInicio: 10, horaFin: 17, duracionSlot: 60 } },
];

const seedClientes = (): Cliente[] => [
  { id: "c1", nombre: "Carlos Mendoza", telefono: "+573001112233", email: "carlos@mail.com", desde: dayOffset(-120), totalCitas: 8, completadas: 7, noShows: 1 },
  { id: "c2", nombre: "Laura Torres", telefono: "+573002223344", email: "laura@mail.com", desde: dayOffset(-90), totalCitas: 5, completadas: 5, noShows: 0 },
  { id: "c3", nombre: "Andrés Gil", telefono: "+573003334455", desde: dayOffset(-60), totalCitas: 4, completadas: 3, noShows: 1 },
  { id: "c4", nombre: "Sofía Díaz", telefono: "+573004445566", email: "sofia@mail.com", desde: dayOffset(-15), totalCitas: 2, completadas: 2, noShows: 0 },
  { id: "c5", nombre: "Pedro Ramírez", telefono: "+573005556677", desde: dayOffset(-5), totalCitas: 1, completadas: 0, noShows: 0 },
  { id: "c6", nombre: "Valentina Ríos", telefono: "+573006667788", email: "valen@mail.com", desde: dayOffset(-2), totalCitas: 1, completadas: 0, noShows: 0 },
];

const seedCitas = (): Cita[] => [
  // Hoy
  { id: "a1", clienteId: "c1", cliente: "Carlos Mendoza", telefono: "+573001112233", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(0), hora: "09:00", duracion: 50, modalidad: "virtual", estado: "confirmada", enlace: "https://meet.necto.app/ana-carlos", notas: "Seguimiento sesión anterior.", origen: "whatsapp" },
  { id: "a2", clienteId: "c2", cliente: "Laura Torres", telefono: "+573002223344", profesionalId: "p2", servicio: "Plan nutricional", fecha: dayOffset(0), hora: "10:30", duracion: 40, modalidad: "presencial", estado: "confirmada", origen: "whatsapp" },
  { id: "a3", clienteId: "c5", cliente: "Pedro Ramírez", telefono: "+573005556677", profesionalId: "p1", servicio: "Primera consulta", fecha: dayOffset(0), hora: "14:00", duracion: 60, modalidad: "virtual", estado: "pendiente", enlace: "https://meet.necto.app/ana-pedro", origen: "whatsapp" },
  { id: "a4", clienteId: "c3", cliente: "Andrés Gil", telefono: "+573003334455", profesionalId: "p3", servicio: "Sesión de rehabilitación", fecha: dayOffset(0), hora: "16:00", duracion: 45, modalidad: "presencial", estado: "pendiente", origen: "operador" },
  // Mañana
  { id: "a5", clienteId: "c4", cliente: "Sofía Díaz", telefono: "+573004445566", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(1), hora: "11:00", duracion: 50, modalidad: "virtual", estado: "confirmada", enlace: "https://meet.necto.app/ana-sofia", origen: "whatsapp" },
  { id: "a6", clienteId: "c6", cliente: "Valentina Ríos", telefono: "+573006667788", profesionalId: "p2", servicio: "Control nutricional", fecha: dayOffset(1), hora: "15:30", duracion: 30, modalidad: "presencial", estado: "pendiente", origen: "whatsapp" },
  // En 2 días
  { id: "a7", clienteId: "c2", cliente: "Laura Torres", telefono: "+573002223344", profesionalId: "p2", servicio: "Seguimiento", fecha: dayOffset(2), hora: "09:30", duracion: 30, modalidad: "virtual", estado: "confirmada", enlace: "https://meet.necto.app/luis-laura", origen: "whatsapp" },
  { id: "a8", clienteId: "c1", cliente: "Carlos Mendoza", telefono: "+573001112233", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(3), hora: "09:00", duracion: 50, modalidad: "virtual", estado: "confirmada", enlace: "https://meet.necto.app/ana-carlos", origen: "whatsapp" },
  // Pasadas (para métricas)
  { id: "a9", clienteId: "c1", cliente: "Carlos Mendoza", telefono: "+573001112233", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(-7), hora: "09:00", duracion: 50, modalidad: "virtual", estado: "completada", origen: "whatsapp" },
  { id: "a10", clienteId: "c2", cliente: "Laura Torres", telefono: "+573002223344", profesionalId: "p2", servicio: "Plan nutricional", fecha: dayOffset(-10), hora: "10:30", duracion: 40, modalidad: "presencial", estado: "completada", origen: "whatsapp" },
  { id: "a11", clienteId: "c3", cliente: "Andrés Gil", telefono: "+573003334455", profesionalId: "p3", servicio: "Sesión de rehabilitación", fecha: dayOffset(-4), hora: "16:00", duracion: 45, modalidad: "presencial", estado: "noshow", origen: "whatsapp" },
  { id: "a12", clienteId: "c4", cliente: "Sofía Díaz", telefono: "+573004445566", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(-14), hora: "11:00", duracion: 50, modalidad: "virtual", estado: "completada", origen: "whatsapp" },
  { id: "a13", clienteId: "c1", cliente: "Carlos Mendoza", telefono: "+573001112233", profesionalId: "p1", servicio: "Terapia individual", fecha: dayOffset(-21), hora: "09:00", duracion: 50, modalidad: "virtual", estado: "completada", origen: "whatsapp" },
];

const ESTADO_ORDER: CitaEstado[] = ["pendiente", "confirmada", "completada", "cancelada", "noshow"];

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

class AgendaStore {
  profesionales: Profesional[] = PROFESIONALES;
  clientes: Cliente[] = seedClientes();
  citas: Cita[] = seedCitas();

  /**
   * Config de disponibilidad por defecto para cuando no hay un profesional
   * concreto en contexto (ej. el calendario en modo "Todos"). No es editable;
   * la disponibilidad real vive en cada Profesional (`profesional.config`).
   */
  defaultConfig: CalendarConfig = { ...DEFAULT_CONFIG };

  /** Loyalty program config (editable from the analytics view). */
  loyaltyConfig: LoyaltyConfig = {
    oroMin: 6,
    plataMin: 3,
    riesgoNoShows: 2,
    riesgoInactivoDias: 45,
    recompensaOro: "Sesión de cortesía o 20% de descuento",
    recompensaPlata: "10% de descuento en su próxima cita",
    recompensaBronce: "Bienvenida: 5% en la siguiente",
  };

  constructor() {
    makeAutoObservable(this);
  }

  // ── Modo demo ("desde 0") ────────────────────────────────────────────────

  /**
   * Deja Agendamiento vacio (sin profesionales, clientes ni citas) para
   * "Simular inicio desde 0". Reversible con restaurarSeed().
   */
  iniciarDesdeCero(): void {
    this.profesionales = [];
    this.clientes = [];
    this.citas = [];
  }

  /** Restaura los datos de ejemplo (seed) de Agendamiento para el inicio normal. */
  restaurarSeed(): void {
    this.profesionales = PROFESIONALES;
    this.clientes = seedClientes();
    this.citas = seedCitas();
  }

  /** Actualiza la disponibilidad (config) de un profesional concreto. */
  updateProfesionalConfig(profId: string, data: Partial<CalendarConfig>): void {
    const p = this.getProfesional(profId);
    if (p) p.config = { ...p.config, ...data };
  }

  updateLoyaltyConfig(data: Partial<LoyaltyConfig>): void {
    this.loyaltyConfig = { ...this.loyaltyConfig, ...data };
  }

  /**
   * Config de disponibilidad efectiva: la del profesional si se da profId, o la
   * de respaldo (defaultConfig) cuando no hay profesional concreto (modo "Todos").
   */
  configDe(profId?: string): CalendarConfig {
    if (profId) {
      const p = this.getProfesional(profId);
      if (p) return p.config;
    }
    return this.defaultConfig;
  }

  /**
   * True si la fecha cae en un día laboral. Con profId usa los días del
   * profesional; sin profId (modo "Todos") usa la config de respaldo.
   */
  esDiaLaboral(fecha: string, profId?: string): boolean {
    const dow = new Date(fecha + "T00:00:00").getDay();
    return this.configDe(profId).diasLaborales.includes(dow);
  }

  // ── Lookups ──
  getCita(id: string): Cita | undefined {
    return this.citas.find((c) => c.id === id);
  }
  getProfesional(id: string): Profesional | undefined {
    return this.profesionales.find((p) => p.id === id);
  }
  getCliente(id: string): Cliente | undefined {
    return this.clientes.find((c) => c.id === id);
  }

  // ── Calendar helpers ──
  /**
   * Non-cancelled citas on a given ISO day, sorted by time.
   * If profId is given, only that professional's citas.
   */
  citasDelDia(fecha: string, profId?: string): Cita[] {
    return this.citas
      .filter((c) => c.fecha === fecha && c.estado !== "cancelada" && (!profId || c.profesionalId === profId))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  /** Count of non-cancelled citas per ISO day (for month dots), optionally per professional. */
  countByDay(fecha: string, profId?: string): number {
    return this.citas.filter((c) => c.fecha === fecha && c.estado !== "cancelada" && (!profId || c.profesionalId === profId)).length;
  }

  /**
   * Free time slots for a day, respecting the calendar config (working days,
   * hour range and slot duration), excluding times already taken by a cita.
   * If profId is given, occupancy is computed per professional.
   * Returns [] on non-working days.
   */
  horariosDisponibles(fecha: string, profId?: string): string[] {
    if (!this.esDiaLaboral(fecha, profId)) return [];
    const { horaInicio, horaFin, duracionSlot } = this.configDe(profId);
    const ocupadas = new Set(this.citasDelDia(fecha, profId).map((c) => c.hora));
    const slots: string[] = [];
    for (let mins = horaInicio * 60; mins < horaFin * 60; mins += duracionSlot) {
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      const slot = `${hh}:${mm}`;
      if (!ocupadas.has(slot)) slots.push(slot);
    }
    return slots;
  }

  /**
   * Todas las franjas del día para un profesional (según su config), marcando
   * cuáles están ocupadas por una cita. Útil para el formulario de crear cita,
   * que muestra el día completo y avisa si un horario ya está tomado.
   * Devuelve [] en días no laborales.
   */
  franjasDelDia(fecha: string, profId?: string): { hora: string; ocupada: boolean }[] {
    if (!this.esDiaLaboral(fecha, profId)) return [];
    const { horaInicio, horaFin, duracionSlot } = this.configDe(profId);
    const ocupadas = new Set(this.citasDelDia(fecha, profId).map((c) => c.hora));
    const franjas: { hora: string; ocupada: boolean }[] = [];
    for (let mins = horaInicio * 60; mins < horaFin * 60; mins += duracionSlot) {
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      const hora = `${hh}:${mm}`;
      franjas.push({ hora, ocupada: ocupadas.has(hora) });
    }
    return franjas;
  }

  // ── Upcoming / grouping ──
  get upcoming(): Cita[] {
    const today = todayIso();
    return this.citas
      .filter((c) => c.fecha >= today && c.estado !== "cancelada")
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  /** Upcoming citas grouped by day (ISO date -> citas). */
  groupedByDay(citas: Cita[]): { fecha: string; citas: Cita[] }[] {
    const map = new Map<string, Cita[]>();
    for (const c of citas) {
      const arr = map.get(c.fecha) ?? [];
      arr.push(c);
      map.set(c.fecha, arr);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, cs]) => ({ fecha, citas: cs.sort((a, b) => a.hora.localeCompare(b.hora)) }));
  }

  // ── KPIs (main view) ──
  get citasHoy(): Cita[] {
    const t = todayIso();
    return this.citas.filter((c) => c.fecha === t && c.estado !== "cancelada");
  }
  get pendientesConfirmar(): number {
    return this.citas.filter((c) => c.estado === "pendiente").length;
  }
  get virtualesHoy(): number {
    return this.citasHoy.filter((c) => c.modalidad === "virtual").length;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS (dashboard)
  // ═══════════════════════════════════════════════════════════════════════

  get totalClientes(): number {
    return this.clientes.length;
  }

  /** New = first appointment within the last 30 days. */
  get clientesNuevos(): number {
    const limit = dayOffset(-30);
    return this.clientes.filter((c) => c.desde >= limit).length;
  }
  get clientesRecurrentes(): number {
    return this.clientes.filter((c) => c.totalCitas > 1).length;
  }

  /** Retention: share of clients that came back (more than one appointment). */
  get tasaRetorno(): number {
    if (this.clientes.length === 0) return 0;
    return Math.round((this.clientesRecurrentes / this.clientes.length) * 100);
  }

  get topClientes(): Cliente[] {
    return [...this.clientes].sort((a, b) => b.totalCitas - a.totalCitas).slice(0, 5);
  }

  get totalNoShows(): number {
    return this.clientes.reduce((s, c) => s + c.noShows, 0);
  }
  get tasaNoShow(): number {
    const totales = this.clientes.reduce((s, c) => s + c.totalCitas, 0);
    if (totales === 0) return 0;
    return Math.round((this.totalNoShows / totales) * 100);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SALUD OPERATIVA DE LAS CITAS (distribución por estado)
  // ═══════════════════════════════════════════════════════════════════════

  /** Conteo de citas registradas por estado (todas las citas del sistema). */
  get conteoPorEstado(): Record<CitaEstado, number> {
    const base: Record<CitaEstado, number> = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0, noshow: 0 };
    for (const c of this.citas) base[c.estado]++;
    return base;
  }

  /** Total de citas registradas (todos los estados). */
  get totalCitasRegistradas(): number {
    return this.citas.length;
  }

  /** % de citas completadas sobre el total registrado. */
  get tasaCompletadas(): number {
    if (this.citas.length === 0) return 0;
    return Math.round((this.conteoPorEstado.completada / this.citas.length) * 100);
  }

  /** % de citas canceladas sobre el total registrado. */
  get tasaCancelacion(): number {
    if (this.citas.length === 0) return 0;
    return Math.round((this.conteoPorEstado.cancelada / this.citas.length) * 100);
  }

  /** % de inasistencias (no-show) sobre el total registrado de citas. */
  get tasaInasistencia(): number {
    if (this.citas.length === 0) return 0;
    return Math.round((this.conteoPorEstado.noshow / this.citas.length) * 100);
  }

  /**
   * Tendencia operativa por semana (últimas 4): cuántas citas se completaron,
   * cancelaron o resultaron en inasistencia cada semana. Para la gráfica lineal.
   */
  get tendenciaOperativa(): { semana: string; completadas: number; canceladas: number; noshow: number }[] {
    const mk = () => [0, 0, 0, 0];
    const completadas = mk(), canceladas = mk(), noshow = mk();
    const now = new Date();
    for (const c of this.citas) {
      const d = new Date(c.fecha + "T00:00:00");
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 27) continue;
      const wk = 3 - Math.floor(diffDays / 7);
      if (wk < 0 || wk >= 4) continue;
      if (c.estado === "completada") completadas[wk]++;
      else if (c.estado === "cancelada") canceladas[wk]++;
      else if (c.estado === "noshow") noshow[wk]++;
    }
    const labels = ["-3 sem", "-2 sem", "-1 sem", "Esta sem"];
    return labels.map((semana, i) => ({ semana, completadas: completadas[i], canceladas: canceladas[i], noshow: noshow[i] }));
  }

  /** Occupancy per professional: number of upcoming citas assigned. */
  get ocupacionPorProfesional(): { profesional: Profesional; citas: number }[] {
    return this.profesionales.map((p) => ({
      profesional: p,
      citas: this.citas.filter((c) => c.profesionalId === p.id && c.estado !== "cancelada").length,
    }));
  }

  /** Modality split (presencial vs virtual) across all non-cancelled citas. */
  get modalidadSplit(): { presencial: number; virtual: number } {
    const activas = this.citas.filter((c) => c.estado !== "cancelada");
    return {
      presencial: activas.filter((c) => c.modalidad === "presencial").length,
      virtual: activas.filter((c) => c.modalidad === "virtual").length,
    };
  }

  /** Appointments per week for the last ~4 weeks (oldest first). */
  get tendenciaSemanal(): { semana: string; citas: number }[] {
    const buckets = [0, 0, 0, 0]; // [-3w, -2w, -1w, this week]
    const now = new Date();
    for (const c of this.citas) {
      const d = new Date(c.fecha + "T00:00:00");
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 27) continue;
      const wk = 3 - Math.floor(diffDays / 7);
      if (wk >= 0 && wk < 4) buckets[wk]++;
    }
    const labels = ["-3 sem", "-2 sem", "-1 sem", "Esta sem"];
    return buckets.map((citas, i) => ({ semana: labels[i], citas }));
  }

  /** Most requested services (top 5). */
  get topServicios(): { servicio: string; count: number }[] {
    const map = new Map<string, number>();
    for (const c of this.citas) map.set(c.servicio, (map.get(c.servicio) ?? 0) + 1);
    return [...map.entries()]
      .map(([servicio, count]) => ({ servicio, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOYALTY / FIDELIDAD  (regularity-based tiers & rewards)
  // ═══════════════════════════════════════════════════════════════════════

  /** Days since the client last had (or has) a cita, using citas history. */
  private diasDesdeUltimaCita(clienteId: string): number {
    const fechas = this.citas
      .filter((c) => c.clienteId === clienteId && c.estado !== "cancelada")
      .map((c) => c.fecha)
      .sort();
    if (fechas.length === 0) return Infinity;
    const ultima = new Date(fechas[fechas.length - 1] + "T00:00:00");
    return Math.floor((Date.now() - ultima.getTime()) / 86400000);
  }

  /** Attendance rate 0–100 (completadas over attended = completadas + noShows). */
  cumplimientoDe(c: Cliente): number {
    const base = c.completadas + c.noShows;
    if (base === 0) return 100;
    return Math.round((c.completadas / base) * 100);
  }

  /**
   * Loyalty tier from regularity, using the editable loyaltyConfig thresholds:
   * - riesgo: riesgoNoShows+ no-shows, o inactivo > riesgoInactivoDias con historial
   * - oro:    oroMin+ citas completadas
   * - plata:  plataMin+ completadas
   * - bronce: por debajo de plataMin (recién llega)
   */
  tierDeCliente(c: Cliente): Tier {
    const cfg = this.loyaltyConfig;
    const dias = this.diasDesdeUltimaCita(c.id);
    if (c.noShows >= cfg.riesgoNoShows) return "riesgo";
    if (c.totalCitas > 1 && dias > cfg.riesgoInactivoDias && dias !== Infinity) return "riesgo";
    if (c.completadas >= cfg.oroMin) return "oro";
    if (c.completadas >= cfg.plataMin) return "plata";
    return "bronce";
  }

  private recompensaDe(c: Cliente, tier: Tier): string | null {
    const cfg = this.loyaltyConfig;
    if (tier === "oro") return cfg.recompensaOro || null;
    if (tier === "plata") return cfg.recompensaPlata || null;
    if (tier === "bronce" && c.completadas >= 2) return cfg.recompensaBronce || null;
    return null;
  }

  private motivoRiesgoDe(c: Cliente): string | null {
    const cfg = this.loyaltyConfig;
    if (c.noShows >= cfg.riesgoNoShows) return `${c.noShows} inasistencias`;
    const dias = this.diasDesdeUltimaCita(c.id);
    if (c.totalCitas > 1 && dias > cfg.riesgoInactivoDias && dias !== Infinity) {
      return `Sin volver hace ${dias} días`;
    }
    return null;
  }

  /** Full loyalty profile for every client. */
  get fidelidad(): ClienteFidelidad[] {
    return this.clientes.map((cliente) => {
      const tier = this.tierDeCliente(cliente);
      const antiguedadDias = Math.floor((Date.now() - new Date(cliente.desde + "T00:00:00").getTime()) / 86400000);
      return {
        cliente,
        tier,
        cumplimiento: this.cumplimientoDe(cliente),
        antiguedadDias,
        recompensa: this.recompensaDe(cliente, tier),
        motivoRiesgo: this.motivoRiesgoDe(cliente),
      };
    });
  }

  /** Count of clients per tier (for the loyalty program summary). */
  get conteoPorTier(): Record<Tier, number> {
    const base: Record<Tier, number> = { oro: 0, plata: 0, bronce: 0, riesgo: 0 };
    for (const f of this.fidelidad) base[f.tier]++;
    return base;
  }

  /** Clients that qualify for a reward right now (not at risk), best first. */
  get clientesConRecompensa(): ClienteFidelidad[] {
    return this.fidelidad
      .filter((f) => f.recompensa && f.tier !== "riesgo")
      .sort((a, b) => b.cliente.completadas - a.cliente.completadas);
  }

  /** Clients flagged at risk (no-shows or inactive), to re-engage. */
  get clientesEnRiesgo(): ClienteFidelidad[] {
    return this.fidelidad.filter((f) => f.tier === "riesgo");
  }

  /** Average days between visits across recurring clients (regularity signal). */
  get frecuenciaPromedioDias(): number {
    const recurrentes = this.clientes.filter((c) => c.totalCitas > 1);
    if (recurrentes.length === 0) return 0;
    const total = recurrentes.reduce((s, c) => {
      const antiguedad = Math.floor((Date.now() - new Date(c.desde + "T00:00:00").getTime()) / 86400000);
      return s + antiguedad / c.totalCitas;
    }, 0);
    return Math.round(total / recurrentes.length);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALÍTICA ACOTADA A UN CONJUNTO DE PROFESIONALES (vista del operador)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Paquete de analítica limitado a un conjunto de profesionales: sus citas, los
   * clientes que atienden esos profesionales, y toda la fidelidad/regularidad y
   * salud operativa calculada SOLO sobre ese subconjunto. Reutiliza la misma
   * lógica de tiers/recompensas que la analítica global del admin. Para la vista
   * del operador, que solo ve lo de SUS profesionales.
   */
  analiticaDeProfesionales(profIds: string[]): {
    citas: Cita[];
    clientes: Cliente[];
    fidelidad: ClienteFidelidad[];
    conteoPorTier: Record<Tier, number>;
    clientesConRecompensa: ClienteFidelidad[];
    clientesEnRiesgo: ClienteFidelidad[];
    totalClientes: number;
    clientesNuevos: number;
    tasaRetorno: number;
    frecuenciaPromedioDias: number;
    tendenciaSemanal: { semana: string; citas: number }[];
    modalidadSplit: { presencial: number; virtual: number };
    ocupacionPorProfesional: { profesional: Profesional; citas: number }[];
    conteoPorEstado: Record<CitaEstado, number>;
    totalCitasRegistradas: number;
    tasaCompletadas: number;
    tasaCancelacion: number;
    tasaInasistencia: number;
    tendenciaOperativa: { semana: string; completadas: number; canceladas: number; noshow: number }[];
  } {
    const set = new Set(profIds);
    const citas = this.citas.filter((c) => set.has(c.profesionalId));
    // Clientes que tienen al menos una cita con esos profesionales.
    const clienteIds = new Set(citas.map((c) => c.clienteId));
    const clientes = this.clientes.filter((c) => clienteIds.has(c.id));

    // Fidelidad de esos clientes (misma lógica que la global).
    const fidelidad: ClienteFidelidad[] = clientes.map((cliente) => {
      const tier = this.tierDeCliente(cliente);
      const antiguedadDias = Math.floor((Date.now() - new Date(cliente.desde + "T00:00:00").getTime()) / 86400000);
      return {
        cliente,
        tier,
        cumplimiento: this.cumplimientoDe(cliente),
        antiguedadDias,
        recompensa: this.recompensaDe(cliente, tier),
        motivoRiesgo: this.motivoRiesgoDe(cliente),
      };
    });

    const conteoPorTier: Record<Tier, number> = { oro: 0, plata: 0, bronce: 0, riesgo: 0 };
    for (const f of fidelidad) conteoPorTier[f.tier]++;

    const clientesConRecompensa = fidelidad
      .filter((f) => f.recompensa && f.tier !== "riesgo")
      .sort((a, b) => b.cliente.completadas - a.cliente.completadas);
    const clientesEnRiesgo = fidelidad.filter((f) => f.tier === "riesgo");

    // KPIs de clientes.
    const limite = dayOffset(-30);
    const clientesNuevos = clientes.filter((c) => c.desde >= limite).length;
    const recurrentes = clientes.filter((c) => c.totalCitas > 1);
    const tasaRetorno = clientes.length === 0 ? 0 : Math.round((recurrentes.length / clientes.length) * 100);
    const frecuenciaPromedioDias = recurrentes.length === 0 ? 0 : Math.round(
      recurrentes.reduce((s, c) => {
        const antiguedad = Math.floor((Date.now() - new Date(c.desde + "T00:00:00").getTime()) / 86400000);
        return s + antiguedad / c.totalCitas;
      }, 0) / recurrentes.length,
    );

    // Gráficos (sobre las citas del subconjunto).
    const activas = citas.filter((c) => c.estado !== "cancelada");
    const modalidadSplit = {
      presencial: activas.filter((c) => c.modalidad === "presencial").length,
      virtual: activas.filter((c) => c.modalidad === "virtual").length,
    };
    const ocupacionPorProfesional = this.profesionales
      .filter((p) => set.has(p.id))
      .map((p) => ({ profesional: p, citas: citas.filter((c) => c.profesionalId === p.id && c.estado !== "cancelada").length }));

    // Tendencia semanal (citas) y operativa (por estado), sobre el subconjunto.
    const now = new Date();
    const bucket = () => [0, 0, 0, 0];
    const semanaDe = (c: Cita): number => {
      const d = new Date(c.fecha + "T00:00:00");
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 27) return -1;
      return 3 - Math.floor(diffDays / 7);
    };
    const semTotal = bucket(), semComp = bucket(), semCanc = bucket(), semNo = bucket();
    for (const c of citas) {
      const wk = semanaDe(c);
      if (wk < 0 || wk >= 4) continue;
      semTotal[wk]++;
      if (c.estado === "completada") semComp[wk]++;
      else if (c.estado === "cancelada") semCanc[wk]++;
      else if (c.estado === "noshow") semNo[wk]++;
    }
    const labels = ["-3 sem", "-2 sem", "-1 sem", "Esta sem"];
    const tendenciaSemanal = labels.map((semana, i) => ({ semana, citas: semTotal[i] }));
    const tendenciaOperativa = labels.map((semana, i) => ({ semana, completadas: semComp[i], canceladas: semCanc[i], noshow: semNo[i] }));

    // Salud operativa (estados) del subconjunto.
    const conteoPorEstado: Record<CitaEstado, number> = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0, noshow: 0 };
    for (const c of citas) conteoPorEstado[c.estado]++;
    const totalCitasRegistradas = citas.length;
    const pct = (n: number) => (totalCitasRegistradas === 0 ? 0 : Math.round((n / totalCitasRegistradas) * 100));

    return {
      citas,
      clientes,
      fidelidad,
      conteoPorTier,
      clientesConRecompensa,
      clientesEnRiesgo,
      totalClientes: clientes.length,
      clientesNuevos,
      tasaRetorno,
      frecuenciaPromedioDias,
      tendenciaSemanal,
      modalidadSplit,
      ocupacionPorProfesional,
      conteoPorEstado,
      totalCitasRegistradas,
      tasaCompletadas: pct(conteoPorEstado.completada),
      tasaCancelacion: pct(conteoPorEstado.cancelada),
      tasaInasistencia: pct(conteoPorEstado.noshow),
      tendenciaOperativa,
    };
  }

  // ── Tier display helpers ──
  tierLabel(t: Tier): string {
    return { oro: "Oro", plata: "Plata", bronce: "Bronce", riesgo: "En riesgo" }[t];
  }
  tierBadgeColor(t: Tier): "warning" | "light" | "info" | "error" {
    // oro→warning(dorado), plata→light(gris), bronce→info, riesgo→error
    return ({ oro: "warning", plata: "light", bronce: "info", riesgo: "error" } as const)[t];
  }
  tierDotClass(t: Tier): string {
    return ({ oro: "bg-warning-400", plata: "bg-gray-400", bronce: "bg-blue-light-400", riesgo: "bg-error-500" } as const)[t];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIONS  (mock — mutate local state only)
  // ═══════════════════════════════════════════════════════════════════════

  private setEstado(id: string, estado: CitaEstado): void {
    const c = this.getCita(id);
    if (c) c.estado = estado;
  }
  confirmar(id: string): void { this.setEstado(id, "confirmada"); }
  cancelar(id: string): void { this.setEstado(id, "cancelada"); }
  completar(id: string): void { this.setEstado(id, "completada"); }
  marcarNoShow(id: string): void { this.setEstado(id, "noshow"); }

  reagendar(id: string, fecha: string, hora: string): void {
    const c = this.getCita(id);
    if (!c) return;
    c.fecha = fecha;
    c.hora = hora;
    c.estado = "pendiente";
  }

  crearCita(data: {
    cliente: string;
    telefono: string;
    profesionalId: string;
    servicio: string;
    fecha: string;
    hora: string;
    modalidad: Modalidad;
    duracion?: number;
    notas?: string;
  }): Cita {
    const cita: Cita = {
      id: crypto.randomUUID(),
      clienteId: crypto.randomUUID(),
      cliente: data.cliente,
      telefono: data.telefono,
      profesionalId: data.profesionalId,
      servicio: data.servicio,
      fecha: data.fecha,
      hora: data.hora,
      duracion: data.duracion ?? 45,
      modalidad: data.modalidad,
      estado: "pendiente",
      notas: data.notas,
      enlace: data.modalidad === "virtual" ? "https://meet.necto.app/nueva-cita" : undefined,
      origen: "operador",
    };
    this.citas.push(cita);
    return cita;
  }

  // ── Profesionales CRUD (mock) ──
  private static readonly PROF_COLORS = ["bg-brand-500", "bg-secondary-500", "bg-accent-500", "bg-warning-500", "bg-success-500", "bg-blue-light-500"];

  private inicialesDe(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? "");
    return (first + second).toUpperCase();
  }

  crearProfesional(data: { nombre: string; especialidad: string; color?: string }): Profesional {
    const color = data.color ?? AgendaStore.PROF_COLORS[this.profesionales.length % AgendaStore.PROF_COLORS.length];
    const prof: Profesional = {
      id: crypto.randomUUID(),
      nombre: data.nombre,
      especialidad: data.especialidad,
      color,
      avatar: this.inicialesDe(data.nombre),
      config: { ...DEFAULT_CONFIG },
    };
    this.profesionales.push(prof);
    return prof;
  }

  updateProfesional(id: string, data: { nombre?: string; especialidad?: string; color?: string }): void {
    const p = this.getProfesional(id);
    if (!p) return;
    if (data.nombre !== undefined) { p.nombre = data.nombre; p.avatar = this.inicialesDe(data.nombre); }
    if (data.especialidad !== undefined) p.especialidad = data.especialidad;
    if (data.color !== undefined) p.color = data.color;
  }

  deleteProfesional(id: string): void {
    this.profesionales = this.profesionales.filter((p) => p.id !== id);
  }

  /** Colors available for professional avatars. */
  get profColorOptions(): string[] {
    return AgendaStore.PROF_COLORS;
  }

  /** Non-cancelled citas of a professional. */
  citasDeProfesional(profId: string): Cita[] {
    return this.citas.filter((c) => c.profesionalId === profId && c.estado !== "cancelada");
  }

  /** Count of a professional's upcoming (today onward) citas. */
  citasHoyDe(profId: string): number {
    const t = todayIso();
    return this.citas.filter((c) => c.profesionalId === profId && c.fecha === t && c.estado !== "cancelada").length;
  }
  pendientesDe(profId: string): number {
    return this.citas.filter((c) => c.profesionalId === profId && c.estado === "pendiente").length;
  }

  /**
   * Aggregated scheduling metrics for a SET of professionals (the ones assigned
   * to an operator). Used by the admin dashboard to measure how each operator
   * manages the appointments of their professionals. Derived from real mock
   * data (not a stats seed): counts non-cancelled citas of those professionals.
   */
  statsDeProfesionales(profIds: string[]): {
    gestionadas: number;
    confirmadas: number;
    noShows: number;
    completadasHoy: number;
  } {
    const set = new Set(profIds);
    const t = todayIso();
    const suyas = this.citas.filter((c) => set.has(c.profesionalId));
    return {
      // Citas gestionadas = todas menos las canceladas.
      gestionadas: suyas.filter((c) => c.estado !== "cancelada").length,
      confirmadas: suyas.filter((c) => c.estado === "confirmada").length,
      noShows: suyas.filter((c) => c.estado === "noshow").length,
      completadasHoy: suyas.filter((c) => c.estado === "completada" && c.fecha === t).length,
    };
  }

  // ── Display helpers ──
  estadoLabel(e: CitaEstado): string {
    return { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada", noshow: "No asistió" }[e];
  }
  estadoTint(e: CitaEstado): string {
    return {
      pendiente: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
      confirmada: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
      completada: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
      cancelada: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      noshow: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    }[e];
  }
  /** Maps a cita state to a Badge semantic color (Elements Badge). */
  estadoBadgeColor(e: CitaEstado): "warning" | "primary" | "success" | "light" | "error" {
    return ({ pendiente: "warning", confirmada: "primary", completada: "success", cancelada: "light", noshow: "error" } as const)[e];
  }
  sortByEstado(a: CitaEstado, b: CitaEstado): number {
    return ESTADO_ORDER.indexOf(a) - ESTADO_ORDER.indexOf(b);
  }
}

export const agendaStore = new AgendaStore();
export { AgendaStore };
