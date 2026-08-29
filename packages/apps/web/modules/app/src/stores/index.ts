// Re-export from shell (canonical location)
export { uiStore, UIStore } from '@/shell/stores';
export type { Theme, UIPreferences } from '@/shell/stores';

// Domain stores
export { queuesStore, QueuesStore } from '@/stores/queues.store';
export type { Queue, Ticket, TicketState, AttentionMode, Saturation, Survey, Sentiment } from '@/stores/queues.store';
