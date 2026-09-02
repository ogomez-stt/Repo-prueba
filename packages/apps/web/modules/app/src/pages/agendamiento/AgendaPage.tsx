import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Button } from "@/elements/ui/button";
import { Select } from "@/elements/form/select";
import { Badge } from "@/elements/ui/badge";
import { Card } from "@/elements/ui/card";
import { MetricCard } from "@/compositions/metric-card";
import { CalenderIcon, TimeIcon, GroupIcon, PlusIcon } from "@/icons";
import { agendaStore, todayIso, type Cita } from "@/stores";
import type { CitaEstado } from "@/stores";

const dayLabel = (isoDate: string): string => {
  const today = todayIso();
  const d = new Date(isoDate + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
};

const VirtualIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const PresencialIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2a10 10 0 00-8.66 15l-1.3 3.9a.75.75 0 00.95.95l3.9-1.3A10 10 0 1012 2z" />
  </svg>
);

const ModalidadBadge = ({ modalidad }: { modalidad: "presencial" | "virtual" }) =>
  modalidad === "virtual" ? (
    <Badge size="xs" color="primary" startIcon={<VirtualIcon />}>Virtual</Badge>
  ) : (
    <Badge size="xs" color="light" startIcon={<PresencialIcon />}>Presencial</Badge>
  );

/** A single appointment row, composed inside an Elements Card. */
const CitaCard = observer(({ cita, onOpen }: { cita: Cita; onOpen: () => void }) => {
  const prof = agendaStore.getProfesional(cita.profesionalId);
  const contactar = () => {
    const msg = encodeURIComponent(`Hola ${cita.cliente}, te confirmamos tu cita de ${cita.servicio}.`);
    window.open(`https://wa.me/${cita.telefono.replace(/[^\d]/g, "")}?text=${msg}`, "_blank");
  };
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="cursor-pointer">
    <Card className="p-4 transition-colors hover:border-brand-300 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Bloque de tiempo */}
        <div className="flex w-16 shrink-0 flex-col">
          <span className="text-lg font-bold text-gray-800 dark:text-white/90">{cita.hora}</span>
          <span className="text-xs text-gray-400">{cita.duracion} min</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-gray-800 dark:text-white/90">{cita.cliente}</p>
            <Badge size="xs" color={agendaStore.estadoBadgeColor(cita.estado)}>
              {agendaStore.estadoLabel(cita.estado)}
            </Badge>
          </div>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{cita.servicio}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {prof && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${prof.color}`}>{prof.avatar}</span>
                {prof.nombre}
              </span>
            )}
            <ModalidadBadge modalidad={cita.modalidad} />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {cita.estado === "pendiente" && (
            <Button size="sm" variant="outline" onClick={() => agendaStore.confirmar(cita.id)}>Confirmar</Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Contactar por WhatsApp" onClick={contactar}>
            <span className="text-success-600"><WhatsAppIcon /></span>
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
});

export const AgendaPage = observer(() => {
  const navigate = useNavigate();
  const [profFilter, setProfFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState<CitaEstado | "all">("all");

  const filtered = useMemo(() => {
    return agendaStore.upcoming.filter((c) => {
      const mp = profFilter === "all" || c.profesionalId === profFilter;
      const me = estadoFilter === "all" || c.estado === estadoFilter;
      return mp && me;
    });
  }, [profFilter, estadoFilter, agendaStore.citas.slice()]);

  const grupos = agendaStore.groupedByDay(filtered);

  const profOptions = [
    { value: "all", label: "Todos los profesionales" },
    ...agendaStore.profesionales.map((p) => ({ value: p.id, label: p.nombre })),
  ];
  const estadoOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "confirmada", label: "Confirmada" },
    { value: "completada", label: "Completada" },
    { value: "cancelada", label: "Cancelada" },
  ];

  return (
    <>
      <PageMeta title="Agenda" description="Gestiona las citas de tus profesionales" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Próximas citas de tus profesionales</p>
        </div>
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => navigate("/agendamiento/crear")}>Agendar cita</Button>
      </div>

      {/* KPIs — MetricCard de Elements */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          layout="horizontal"
          icon={<CalenderIcon className="size-6" />}
          title="Citas hoy"
          value={String(agendaStore.citasHoy.length)}
        />
        <MetricCard
          layout="horizontal"
          icon={<TimeIcon className="size-6" />}
          title="Por confirmar"
          value={String(agendaStore.pendientesConfirmar)}
          iconBgClass="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />
        <MetricCard
          layout="horizontal"
          icon={<GroupIcon className="size-6" />}
          title="Virtuales hoy"
          value={String(agendaStore.virtualesHoy)}
          iconBgClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-64"><Select defaultValue={profFilter} onChange={setProfFilter} options={profOptions} /></div>
        <div className="sm:w-56"><Select defaultValue={estadoFilter} onChange={(v) => setEstadoFilter(v as CitaEstado | "all")} options={estadoOptions} /></div>
      </div>

      {/* Lista agrupada por día */}
      <div className="mt-6 space-y-6">
        {grupos.length === 0 ? (
          <Card className="py-16 text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">No hay citas</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay citas con estos filtros.</p>
          </Card>
        ) : (
          grupos.map((g) => (
            <div key={g.fecha}>
              <h2 className="mb-3 text-sm font-semibold capitalize text-gray-500 dark:text-gray-400">{dayLabel(g.fecha)}</h2>
              <div className="space-y-3">
                {g.citas.map((c) => (
                  <CitaCard key={c.id} cita={c} onOpen={() => navigate(`/agendamiento/detalles?id=${c.id}`)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
});

export default AgendaPage;
