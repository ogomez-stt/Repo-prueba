import { makeAutoObservable, runInAction } from "mobx";

// ═══════════════════════════════════════════════════════════════════════════
// CHATS DE ASESOR — Agendamiento
// ═══════════════════════════════════════════════════════════════════════════
//
// Cuando un cliente en WhatsApp pide "hablar con un asesor", su conversación
// entra a esta bandeja. Un operador/asesor puede TOMAR el chat, responder y
// marcarlo como RESUELTO. Todo es mock (sin backend). El canal de WhatsApp del
// cliente vive en el simulador (/wa); aquí está el lado del negocio.

/** Estado de una conversación en la bandeja de asesor. */
export type ChatEstado = "sin_asignar" | "en_curso" | "resuelto";

/** Autor de un mensaje del hilo. */
export type ChatAutor = "cliente" | "asesor" | "sistema";

export interface ChatMensajeAsesor {
  id: string;
  autor: ChatAutor;
  texto: string;
  hora: string; // display, ej. "10:24"
}

export interface Conversacion {
  id: string;
  /** Nombre del cliente que escribe. */
  cliente: string;
  telefono: string;
  estado: ChatEstado;
  /** Id del operador que tomó el chat (o null si sin asignar). */
  asignadoA: string | null;
  /** Nombre del asesor asignado (para el mensaje de sistema y la UI). */
  asignadoNombre: string | null;
  /** Motivo/etiqueta corta por la que el cliente pidio asesor. */
  motivo: string;
  /** Nº de mensajes sin leer (del cliente) para el contador de la lista. */
  noLeidos: number;
  mensajes: ChatMensajeAsesor[];
}

// ── Persistencia (mock, localStorage) ───────────────────────────────────────

const CHATS_KEY = "necto.asesorChats";

// ── Seed ─────────────────────────────────────────────────────────────────────

const seed = (): Conversacion[] => [
  {
    id: "cv1",
    cliente: "Marta Ruiz",
    telefono: "+57 300 111 2233",
    estado: "sin_asignar",
    asignadoA: null,
    asignadoNombre: null,
    motivo: "Duda sobre disponibilidad",
    noLeidos: 2,
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola, quiero una cita con la Dra. Ana pero no veo horarios esta semana", hora: "09:10" },
      { id: "m2", autor: "cliente", texto: "¿Me pueden ayudar por favor?", hora: "09:11" },
    ],
  },
  {
    id: "cv2",
    cliente: "Andrés Gil",
    telefono: "+57 301 222 3344",
    estado: "sin_asignar",
    asignadoA: null,
    asignadoNombre: null,
    motivo: "Reagendar cita",
    noLeidos: 1,
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Necesito mover mi cita del jueves, ¿pueden ayudarme?", hora: "10:02" },
    ],
  },
  {
    id: "cv3",
    cliente: "Laura Torres",
    telefono: "+57 302 333 4455",
    estado: "en_curso",
    asignadoA: "a1",
    asignadoNombre: "Sofía Márquez",
    motivo: "Confirmar modalidad",
    noLeidos: 0,
    mensajes: [
      { id: "m1", autor: "cliente", texto: "¿La cita con el Dr. Luis es presencial o virtual?", hora: "08:40" },
      { id: "m2", autor: "sistema", texto: "Chat asignado a Sofía Márquez", hora: "08:41" },
      { id: "m3", autor: "asesor", texto: "¡Hola Laura! Tu cita del martes es virtual, te llega el enlace por aquí.", hora: "08:42" },
      { id: "m4", autor: "cliente", texto: "Perfecto, gracias", hora: "08:43" },
    ],
  },
  {
    id: "cv4",
    cliente: "Pedro Ramírez",
    telefono: "+57 303 444 5566",
    estado: "resuelto",
    asignadoA: "a1",
    asignadoNombre: "Sofía Márquez",
    motivo: "Costo de la consulta",
    noLeidos: 0,
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buenas, ¿cuánto cuesta la consulta de nutrición?", hora: "Ayer 16:20" },
      { id: "m2", autor: "sistema", texto: "Chat asignado a Sofía Márquez", hora: "Ayer 16:21" },
      { id: "m3", autor: "asesor", texto: "Hola Pedro, la primera consulta tiene un valor de $80.000 e incluye plan inicial.", hora: "Ayer 16:23" },
      { id: "m4", autor: "cliente", texto: "Gracias, agendo entonces", hora: "Ayer 16:25" },
      { id: "m5", autor: "sistema", texto: "Chat marcado como resuelto", hora: "Ayer 16:26" },
    ],
  },
];

function loadChats(): Conversacion[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (raw) return JSON.parse(raw) as Conversacion[];
  } catch {
    // Sin localStorage o JSON inválido: usa el seed.
  }
  return seed();
}

function persistChats(c: Conversacion[]): void {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(c));
  } catch {
    // Sin localStorage: no-op (mock).
  }
}

const nowHora = () =>
  new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export class AsesorChatsStore {
  conversaciones: Conversacion[] = loadChats();
  /** Conversación seleccionada en la vista (o null). */
  seleccionadaId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  private persist() {
    persistChats(this.conversaciones);
  }

  // ── Lookups / derivados ──
  get seleccionada(): Conversacion | null {
    return this.conversaciones.find((c) => c.id === this.seleccionadaId) ?? null;
  }

  porEstado(estado: ChatEstado): Conversacion[] {
    return this.conversaciones.filter((c) => c.estado === estado);
  }

  /** Conversaciones "míos": en curso asignadas al operador dado. */
  mios(operadorId: string | null): Conversacion[] {
    return this.conversaciones.filter(
      (c) => c.estado === "en_curso" && (operadorId ? c.asignadoA === operadorId : true),
    );
  }

  get countSinAsignar(): number {
    return this.porEstado("sin_asignar").length;
  }
  get countResueltos(): number {
    return this.porEstado("resuelto").length;
  }
  countMios(operadorId: string | null): number {
    return this.mios(operadorId).length;
  }

  get totalNoLeidos(): number {
    return this.conversaciones.reduce((s, c) => s + c.noLeidos, 0);
  }

  // ── Acciones ──
  seleccionar(id: string): void {
    this.seleccionadaId = id;
    const c = this.conversaciones.find((x) => x.id === id);
    if (c) c.noLeidos = 0; // al abrir, se marcan como leídos
    this.persist();
  }

  /** Toma un chat sin asignar: pasa a en_curso y registra el asesor. */
  tomar(id: string, operadorId: string, operadorNombre: string): void {
    const c = this.conversaciones.find((x) => x.id === id);
    if (!c || c.estado !== "sin_asignar") return;
    runInAction(() => {
      c.estado = "en_curso";
      c.asignadoA = operadorId;
      c.asignadoNombre = operadorNombre;
      c.mensajes.push({
        id: crypto.randomUUID(),
        autor: "sistema",
        texto: `Chat asignado a ${operadorNombre}`,
        hora: nowHora(),
      });
    });
    this.persist();
  }

  /** El asesor responde en un chat en curso. */
  responder(id: string, texto: string): void {
    const c = this.conversaciones.find((x) => x.id === id);
    if (!c || c.estado !== "en_curso" || !texto.trim()) return;
    c.mensajes.push({
      id: crypto.randomUUID(),
      autor: "asesor",
      texto: texto.trim(),
      hora: nowHora(),
    });
    this.persist();
  }

  /** Marca un chat en curso como resuelto. */
  resolver(id: string): void {
    const c = this.conversaciones.find((x) => x.id === id);
    if (!c || c.estado !== "en_curso") return;
    runInAction(() => {
      c.estado = "resuelto";
      c.mensajes.push({
        id: crypto.randomUUID(),
        autor: "sistema",
        texto: "Chat marcado como resuelto",
        hora: nowHora(),
      });
    });
    this.persist();
  }

  /** Reabre un chat resuelto (vuelve a en_curso). */
  reabrir(id: string): void {
    const c = this.conversaciones.find((x) => x.id === id);
    if (!c || c.estado !== "resuelto") return;
    c.estado = "en_curso";
    this.persist();
  }

  /**
   * Ingreso de un chat nuevo desde el canal de WhatsApp (cliente pide asesor).
   * Lo usa el simulador para alimentar la bandeja. Entra como sin_asignar.
   */
  ingresarDesdeWhatsApp(data: { cliente: string; telefono: string; motivo: string; primerMensaje: string }): string {
    const id = crypto.randomUUID();
    this.conversaciones.unshift({
      id,
      cliente: data.cliente,
      telefono: data.telefono,
      estado: "sin_asignar",
      asignadoA: null,
      asignadoNombre: null,
      motivo: data.motivo,
      noLeidos: 1,
      mensajes: [{ id: crypto.randomUUID(), autor: "cliente", texto: data.primerMensaje, hora: nowHora() }],
    });
    this.persist();
    return id;
  }

  // ── Modo demo ("desde 0") ──
  iniciarDesdeCero(): void {
    this.conversaciones = [];
    this.seleccionadaId = null;
    persistChats(this.conversaciones);
  }

  restaurarSeed(): void {
    this.conversaciones = seed();
    this.seleccionadaId = null;
    persistChats(this.conversaciones);
  }
}

export const asesorChatsStore = new AsesorChatsStore();
