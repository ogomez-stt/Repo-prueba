// Re-export from shell (canonical location)
export { uiStore, UIStore } from '@/shell/stores';
export type { Theme, UIPreferences } from '@/shell/stores';

// Domain stores
export { queuesStore, QueuesStore } from '@/stores/queues.store';
export type { Queue, Ticket, TicketState, AttentionMode, Saturation, Survey, Sentiment, CustomField, FieldType, SurveyConfig, TipoNegocio, BusinessConfig, NegocioPreset, PresetQueue, DiaSemana, HorarioDia, TurnoRules, PrefijoModo, DisplayConfig } from '@/stores/queues.store';
export { DIAS_SEMANA } from '@/stores/queues.store';

export { agendaStore, AgendaStore, todayIso } from '@/stores/agenda.store';
export type { Profesional, Cita, Cliente, CitaEstado, Modalidad, CalendarConfig, LoyaltyConfig, Tier, ClienteFidelidad } from '@/stores/agenda.store';

export { sessionStore, SessionStore } from '@/stores/session.store';
export type { Modulo, Rol } from '@/stores/session.store';

export { operadoresStore, OperadoresStore, SECCIONES } from '@/stores/operadores.store';
export type { Operador, OperadorEstado, Seccion, OperadorStats, EncuestaStats } from '@/stores/operadores.store';

export { asesorChatsStore, AsesorChatsStore } from '@/stores/asesorChats.store';
export type { Conversacion, ChatMensajeAsesor, ChatEstado, ChatAutor } from '@/stores/asesorChats.store';
