// ═══════════════════════════════════════════════════════════════════════════
// DATOS MOCK — conversaciones de WhatsApp del módulo AGENDAMIENTO (solo lectura)
// ═══════════════════════════════════════════════════════════════════════════
//
// Contexto: NECTO en un centro de citas con profesionales (Dra. Ana Gómez -
// Psicología, Dr. Luis Peña - Nutrición, Lic. María Ruiz - Fisioterapia). El
// cliente escribe por WhatsApp y el bot agenda/gestiona citas. En uno de los
// chats el cliente pide "hablar con un asesor": ese caso alimenta la bandeja de
// Chats de asesor (ver /agendamiento/chats). Reutiliza los tipos del simulador.

import type { Chat } from "./chats.mock";

/**
 * 4 conversaciones guionadas COMPLETAS de Agendamiento (mock).
 */
export const CHATS_AGENDA: Chat[] = [
  // ── 1. Cliente que agenda una cita self-service ─────────────────────────────
  {
    id: "ag1",
    nombre: "Carlos Mendoza",
    telefono: "+57 300 111 2233",
    escenario: "Agendó una cita desde el celular",
    mensajes: [
      { autor: "cliente", texto: "Hola, quiero agendar una cita", hora: "09:10" },
      { autor: "bot", texto: "¡Hola! 👋 Bienvenido a NECTO Salud. Te ayudo a agendar tu cita.\n\n¿Con qué profesional o servicio deseas?\n\n1️⃣ Psicología — Dra. Ana Gómez\n2️⃣ Nutrición — Dr. Luis Peña\n3️⃣ Fisioterapia — Lic. María Ruiz", hora: "09:10" },
      { autor: "cliente", texto: "1, psicología", hora: "09:11" },
      { autor: "bot", texto: "Perfecto, con la *Dra. Ana Gómez* (Psicología) 🧠\n\nEstos son los horarios disponibles para esta semana:\n\n• Mar 10:00\n• Mar 11:00\n• Mié 15:00\n• Jue 09:00", hora: "09:11" },
      { autor: "cliente", texto: "El martes a las 11 me sirve", hora: "09:12" },
      { autor: "bot", texto: "Excelente. ¿La cita sería *presencial* o *virtual*?", hora: "09:12" },
      { autor: "cliente", texto: "Virtual", hora: "09:12" },
      { autor: "bot", texto: "¿Me confirmas tu nombre completo para la cita?", hora: "09:13" },
      { autor: "cliente", texto: "Carlos Mendoza Ríos", hora: "09:13" },
      { autor: "bot", texto: "✅ ¡Listo, Carlos! Tu cita quedó agendada:\n\n• Profesional: Dra. Ana Gómez (Psicología)\n• Fecha: Martes 11:00\n• Modalidad: Virtual\n\nTe enviaré el enlace de la videollamada 15 minutos antes. 📹", hora: "09:14" },
      { autor: "cliente", texto: "Perfecto, gracias", hora: "09:14" },
      { autor: "bot", texto: "¡Con gusto! Te recordaré tu cita un día antes. Si necesitas reagendar, escríbeme por aquí. 💚", hora: "09:14" },
      { autor: "bot", texto: "🔔 Recordatorio: tu cita con la Dra. Ana Gómez es *mañana a las 11:00* (virtual). Responde CONFIRMO para confirmar tu asistencia.", hora: "Mar 11:00" },
      { autor: "cliente", texto: "CONFIRMO", hora: "Mar 11:02" },
      { autor: "bot", texto: "¡Gracias! Tu asistencia quedó confirmada. Te llega el enlace pronto. 🙌", hora: "Mar 11:02" },
    ],
  },

  // ── 2. Cliente que reagenda una cita ────────────────────────────────────────
  {
    id: "ag2",
    nombre: "Laura Torres",
    telefono: "+57 301 222 3344",
    escenario: "Reagendó su cita",
    mensajes: [
      { autor: "cliente", texto: "Buenas, necesito cambiar la fecha de mi cita de nutrición", hora: "14:05" },
      { autor: "bot", texto: "¡Hola Laura! 👋 Claro que sí. Veo tu cita:\n\n• Dr. Luis Peña (Nutrición)\n• Jueves 08:30 · Presencial\n\n¿Deseas *reagendarla* o *cancelarla*?", hora: "14:05" },
      { autor: "cliente", texto: "Reagendar, ese día no puedo", hora: "14:06" },
      { autor: "bot", texto: "Sin problema. Estos son los próximos horarios del Dr. Luis Peña:\n\n• Vie 08:00\n• Vie 09:30\n• Sáb 10:00", hora: "14:06" },
      { autor: "cliente", texto: "El viernes a las 9:30", hora: "14:07" },
      { autor: "bot", texto: "✅ Listo, Laura. Tu cita se movió:\n\n• Antes: Jueves 08:30\n• Ahora: *Viernes 09:30* · Presencial\n• Dr. Luis Peña (Nutrición)\n\n¡Te esperamos! 💚", hora: "14:07" },
      { autor: "cliente", texto: "Mil gracias, muy fácil", hora: "14:08" },
      { autor: "bot", texto: "Para eso estamos 🙌 Te recuerdo un día antes.", hora: "14:08" },
    ],
  },

  // ── 3. Cliente que consulta sus próximas citas ──────────────────────────────
  {
    id: "ag3",
    nombre: "Sofía Díaz",
    telefono: "+57 302 333 4455",
    escenario: "Consultó sus próximas citas",
    mensajes: [
      { autor: "cliente", texto: "Hola, ¿me recuerdas cuándo tengo mi próxima cita?", hora: "18:20" },
      { autor: "bot", texto: "¡Hola Sofía! 👋 Déjame revisar tu agenda… ⏳", hora: "18:20" },
      { autor: "bot", texto: "📅 Tienes 1 cita próxima:\n\n• Lic. María Ruiz (Fisioterapia)\n• Sábado 10:00 · Presencial\n• Sede Norte\n\n¿Deseas hacer algo con ella? (reagendar / cancelar)", hora: "18:20" },
      { autor: "cliente", texto: "No, solo quería confirmar. Gracias!", hora: "18:21" },
      { autor: "bot", texto: "¡Perfecto! Ahí te esperamos el sábado. Te recuerdo un día antes. 💚", hora: "18:21" },
    ],
  },

  // ── 4. Cliente que pide hablar con un asesor (alimenta la bandeja de Chats) ──
  {
    id: "ag4",
    nombre: "Marta Ruiz",
    telefono: "+57 300 111 2233",
    escenario: "Pidió hablar con un asesor",
    asesorEnVivo: { motivo: "Duda sobre disponibilidad" },
    mensajes: [
      { autor: "cliente", texto: "Hola, quiero una cita con la Dra. Ana pero no veo horarios esta semana", hora: "09:10" },
      { autor: "bot", texto: "¡Hola Marta! 👋 La agenda de la Dra. Ana Gómez está llena esta semana. ¿Quieres que te muestre horarios de la próxima semana?", hora: "09:10" },
      { autor: "cliente", texto: "Es que necesito algo urgente, ¿no hay nada antes?", hora: "09:11" },
      { autor: "bot", texto: "Entiendo que es urgente 🙏 Para revisar cupos especiales o una cita prioritaria, mejor te comunico con un *asesor humano* del equipo.", hora: "09:11" },
      { autor: "cliente", texto: "Sí por favor, quiero hablar con un asesor", hora: "09:11" },
      { autor: "bot", texto: "Perfecto. 📨 Transferí tu conversación a un asesor. En un momento alguien del equipo te responde por aquí mismo. Gracias por tu paciencia.", hora: "09:12" },
      // A partir de aquí (asesorEnVivo), el hilo se conecta EN VIVO con la
      // bandeja de Chats (/agendamiento/chats): el cliente puede escribir y las
      // respuestas del asesor aparecen aquí. Ver SimuladorWhatsApp.
    ],
  },
];
