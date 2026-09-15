import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";
import { PageMeta } from "@/shell/meta";
import { Button } from "@/elements/ui/button";
import { Card } from "@/elements/ui/card";
import { Badge } from "@/elements/ui/badge";
import { Notification } from "@/elements/ui/notification";
import { MetricCard } from "@/compositions/metric-card";
import { CalenderIcon, TimeIcon, GroupIcon, BoxIconLine } from "@/icons";
import { agendaStore, type Cita } from "@/stores";
import { DashboardAgendaCharts } from "./components/DashboardAgendaCharts";
import { OperadoresAgendaStats } from "./components/OperadoresAgendaStats";
import { ExportReportModal } from "./components/ExportReportModal";
import { cn } from "@/utils";

const WhatsAppDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
  </span>
);

/** Píldora de modalidad (presencial / virtual). */
const ModalidadBadge = ({ modalidad }: { modalidad: "presencial" | "virtual" }) =>
  modalidad === "virtual" ? (
    <Badge size="xs" color="primary">Virtual</Badge>
  ) : (
    <Badge size="xs" color="light">Presencial</Badge>
  );

/** Una fila compacta de la lista de próximas citas. */
const ProximaCitaRow = observer(({ cita }: { cita: Cita }) => {
  const prof = agendaStore.getProfesional(cita.profesionalId);
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{cita.cliente}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {prof?.nombre ?? "Sin profesional"} · {cita.hora}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ModalidadBadge modalidad={cita.modalidad} />
        <Badge size="xs" color={agendaStore.estadoBadgeColor(cita.estado)}>
          {agendaStore.estadoLabel(cita.estado)}
        </Badge>
      </div>
    </div>
  );
});

/** Una tarjeta pequeña de ocupación por profesional. */
const ProfesionalCard = observer(({ profId }: { profId: string }) => {
  const p = agendaStore.getProfesional(profId);
  if (!p) return null;
  const asignadas = agendaStore.citasDeProfesional(p.id).length;
  const hoy = agendaStore.citasHoyDe(p.id);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", p.color)}>
        {p.avatar}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{p.nombre}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.especialidad}</p>
      </div>
      <div className="flex shrink-0 gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-gray-800 dark:text-white/90">{asignadas}</p>
          <p className="text-[11px] text-gray-400">citas</p>
        </div>
        <div>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{hoy}</p>
          <p className="text-[11px] text-gray-400">hoy</p>
        </div>
      </div>
    </div>
  );
});

/**
 * DashboardAgendamientoPage — Inicio del administrador para el módulo de
 * Agendamiento. Compendio ejecutivo de las vistas existentes (Agenda,
 * Calendario, Profesionales, Analítica) con KPIs, próximas citas, ocupación
 * por profesional, gráficos y el rendimiento del equipo de operadores.
 * Todo mock: lee en vivo del agendaStore. Respeta el filtro de profesionales
 * visibles del usuario (admin ve todos; operador simulado solo los suyos).
 */
export const DashboardAgendamientoPage = observer(() => {
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const citasHoy = agendaStore.citasHoy.length;
  const porConfirmar = agendaStore.pendientesConfirmar;
  const virtualesHoy = agendaStore.virtualesHoy;
  const tasaInasistencia = agendaStore.tasaNoShow;

  // Vista global: SIEMPRE todas las citas y todos los profesionales del negocio.
  const proximas = agendaStore.upcoming.slice(0, 4);
  const profesionales = agendaStore.profesionales;

  return (
    <>
      <PageMeta title="Inicio de Agendamiento" description="Resumen del dia de citas y equipo" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Inicio de Agendamiento</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
              <WhatsAppDot />
              en vivo
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Resumen del día de citas y equipo</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>Exportar Reporte</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          layout="horizontal"
          icon={<CalenderIcon className="size-6" />}
          title="Citas hoy"
          value={String(citasHoy)}
          iconSize="w-14 h-14"
        />
        <MetricCard
          layout="horizontal"
          icon={<TimeIcon className="size-6" />}
          title="Por confirmar"
          value={String(porConfirmar)}
          iconSize="w-14 h-14"
        />
        <MetricCard
          layout="horizontal"
          icon={<BoxIconLine className="size-6" />}
          title="Citas virtuales hoy"
          value={String(virtualesHoy)}
          iconSize="w-14 h-14"
        />
        <MetricCard
          layout="horizontal"
          icon={<GroupIcon className="size-6" />}
          title="Tasa de inasistencia"
          value={`${tasaInasistencia}%`}
          iconSize="w-14 h-14"
        />
      </div>

      {/* Próximas citas + Ocupación por profesional */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Próximas citas */}
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Próximas citas</h3>
            <button
              onClick={() => navigate("/agendamiento")}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Ver agenda
            </button>
          </div>
          <p className="text-xs text-gray-400">Siguientes citas</p>
          {proximas.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay citas próximas.</p>
          ) : (
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
              {proximas.map((c) => <ProximaCitaRow key={c.id} cita={c} />)}
            </div>
          )}
        </Card>

        {/* Ocupación por profesional */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ocupación por profesional</h3>
            <button
              onClick={() => navigate("/agendamiento/profesionales")}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Ver todos
            </button>
          </div>
          {profesionales.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay profesionales para mostrar.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {profesionales.map((p) => <ProfesionalCard key={p.id} profId={p.id} />)}
            </div>
          )}
        </Card>
      </div>

      {/* Gráficos */}
      <div className="mt-6">
        <DashboardAgendaCharts />
      </div>

      {/* Rendimiento de operadores */}
      <div className="mt-6">
        <OperadoresAgendaStats />
      </div>

      {/* Modal de exportar reporte */}
      <ExportReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onSent={(via, destino) => showToast(`Reporte enviado por ${via} a ${destino}`)}
      />

      {/* Toast (top-center) */}
      {toast && (
        <div className="fixed left-1/2 top-6 z-99999 -translate-x-1/2">
          <Notification variant="success" title={toast} />
        </div>
      )}
    </>
  );
});

export default DashboardAgendamientoPage;
