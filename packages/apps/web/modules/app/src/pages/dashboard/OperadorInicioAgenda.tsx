import { useState } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Card } from "@/elements/ui/card";
import { Button } from "@/elements/ui/button";
import { Badge } from "@/elements/ui/badge";
import { Tab, type TabItem } from "@/elements/ui/tabs";
import { MetricCard } from "@/compositions/metric-card";
import { CalenderIcon, TimeIcon, GroupIcon, PlusIcon } from "@/icons";
import { agendaStore, sessionStore, todayIso, type Cita, type Profesional } from "@/stores";

const TODOS = "all";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2a10 10 0 00-8.66 15l-1.3 3.9a.75.75 0 00.95.95l3.9-1.3A10 10 0 1012 2z" />
  </svg>
);

const ModalidadBadge = ({ modalidad }: { modalidad: "presencial" | "virtual" }) =>
  modalidad === "virtual" ? (
    <Badge size="xs" color="primary">Virtual</Badge>
  ) : (
    <Badge size="xs" color="light">Presencial</Badge>
  );

/** Fila de una cita del día con acciones rápidas (solo lectura + confirmar/WhatsApp). */
const CitaRow = observer(({ cita, onOpen }: { cita: Cita; onOpen: () => void }) => {
  const prof = agendaStore.getProfesional(cita.profesionalId);
  const contactar = () => {
    const msg = encodeURIComponent(`Hola ${cita.cliente}, te confirmamos tu cita de ${cita.servicio}.`);
    window.open(`https://wa.me/${cita.telefono.replace(/[^\d]/g, "")}?text=${msg}`, "_blank");
  };
  const cancelada = cita.estado === "cancelada";
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 p-3 transition-colors hover:border-brand-300 dark:border-gray-800"
    >
      {/* Hora */}
      <div className="w-14 shrink-0">
        <p className="text-sm font-bold text-gray-800 dark:text-white/90">{cita.hora}</p>
        <p className="text-xs text-gray-400">{cita.duracion} min</p>
      </div>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{cita.cliente}</p>
          <Badge size="xs" color={agendaStore.estadoBadgeColor(cita.estado)}>{agendaStore.estadoLabel(cita.estado)}</Badge>
          <ModalidadBadge modalidad={cita.modalidad} />
        </div>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {cita.servicio}{prof ? ` · ${prof.nombre}` : ""}
        </p>
      </div>
      {/* Acciones rápidas — no en canceladas */}
      {!cancelada && (
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {cita.estado === "pendiente" && (
            <Button size="sm" variant="outline" onClick={() => agendaStore.confirmar(cita.id)}>Confirmar</Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Contactar por WhatsApp" onClick={contactar}>
            <span className="text-success-600"><WhatsAppIcon /></span>
          </Button>
        </div>
      )}
    </div>
  );
});

/** Identidad del profesional: avatar de color + nombre + especialidad. */
const ProfIdentidad = ({ prof }: { prof: Profesional }) => (
  <div className="flex items-center gap-3">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${prof.color}`}>{prof.avatar}</span>
    <div className="min-w-0">
      <p className="truncate font-semibold text-gray-800 dark:text-white/90">{prof.nombre}</p>
      <p className="truncate text-sm text-gray-500 dark:text-gray-400">{prof.especialidad}</p>
    </div>
  </div>
);

/**
 * OperadorInicioAgenda — Inicio propio del operador en Agendamiento (mock).
 *
 * Distinto al dashboard del admin: es personal y operativo, SIN analítica ni
 * gráficas. Muestra los profesionales que el operador tiene asignados, y las
 * citas de hoy de esos profesionales, con acciones rápidas (confirmar/WhatsApp).
 */
export const OperadorInicioAgenda = observer(() => {
  const navigate = useNavigate();
  const operador = sessionStore.operadorSimulado;

  // Profesionales asignados al operador (visibles según permisos).
  const misProfesionales = agendaStore.profesionales.filter((p) => sessionStore.puedeVerProfesional(p.id));
  const variosProf = misProfesionales.length > 1;

  // Alcance activo: "Todos" (solo si hay varios) o un profesional concreto.
  const [scope, setScope] = useState<string>(variosProf ? TODOS : (misProfesionales[0]?.id ?? ""));
  const verTodos = scope === TODOS;
  const profActual = verTodos ? null : agendaStore.getProfesional(scope);

  // Ids del alcance actual.
  const idsScope = verTodos ? misProfesionales.map((p) => p.id) : [scope];
  const enScope = (profId: string) => idsScope.includes(profId);

  // Citas de HOY del alcance (no canceladas se ordenan por hora; incluye todas para ver estado).
  const t = todayIso();
  const citasHoy = agendaStore.citas
    .filter((c) => c.fecha === t && enScope(c.profesionalId))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // KPIs operativos del alcance.
  const numHoy = citasHoy.filter((c) => c.estado !== "cancelada").length;
  const porConfirmar = citasHoy.filter((c) => c.estado === "pendiente").length;
  const proxima = citasHoy.find((c) => c.estado === "pendiente" || c.estado === "confirmada");

  const tabs: TabItem[] = [
    ...(variosProf ? [{ key: TODOS, label: "Todos" } as TabItem] : []),
    ...misProfesionales.map((p) => ({ key: p.id, label: p.nombre })),
  ];

  const irAgenda = () => navigate(verTodos ? "/agendamiento" : `/agendamiento?prof=${scope}`);
  const irCrear = () => navigate(verTodos ? "/agendamiento/crear" : `/agendamiento/crear?prof=${scope}`);

  // Sin profesionales asignados: mensaje simple.
  if (misProfesionales.length === 0) {
    return (
      <>
        <PageMeta title="Inicio" description="Tu espacio de trabajo" />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Hola, {operador?.nombre ?? "Operador"}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Operador de Agendamiento</p>
        </div>
        <Card>
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No tienes profesionales asignados. Pídele al administrador acceso a un profesional.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Inicio" description="Tu espacio de trabajo" />

      {/* Encabezado personal */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Hola, {operador?.nombre ?? "Operador"}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Operador de Agendamiento</p>
      </div>

      {/* Selector de profesionales (solo si hay varios) */}
      {variosProf && (
        <div className="mb-5">
          <Tab items={tabs} activeTab={scope} onTabChange={setScope} variant="underline" />
        </div>
      )}

      {/* Identidad del profesional concreto / resumen del alcance */}
      <div className="mb-6">
        {profActual ? (
          <ProfIdentidad prof={profActual} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando tus <span className="font-semibold text-gray-700 dark:text-gray-300">{misProfesionales.length} profesionales</span>.
          </p>
        )}
      </div>

      {/* KPIs operativos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          layout="horizontal"
          iconSize="w-14 h-14"
          icon={<CalenderIcon className="size-6" />}
          title="Citas hoy"
          value={String(numHoy)}
        />
        <MetricCard
          layout="horizontal"
          iconSize="w-14 h-14"
          icon={<TimeIcon className="size-6" />}
          title="Por confirmar"
          value={String(porConfirmar)}
          iconBgClass="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />
        <MetricCard
          layout="horizontal"
          iconSize="w-14 h-14"
          icon={<GroupIcon className="size-6" />}
          title="Próxima cita"
          value={proxima ? proxima.hora : "--"}
          iconBgClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />
      </div>

      {/* Citas de hoy */}
      <div className="mt-6">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Citas de hoy</h2>
            <span className="text-xs text-gray-400">{citasHoy.length} {citasHoy.length === 1 ? "cita" : "citas"}</span>
          </div>
          {citasHoy.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
              No hay citas para hoy.
            </p>
          ) : (
            <div className="space-y-2">
              {citasHoy.map((c) => (
                <CitaRow key={c.id} cita={c} onOpen={() => navigate(`/agendamiento/detalles?id=${c.id}`)} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Accesos directos */}
      <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
        <Button variant="outline" onClick={irAgenda}>Ver agenda completa</Button>
        <Button startIcon={<PlusIcon />} onClick={irCrear}>Agendar cita</Button>
      </div>
    </>
  );
});

export default OperadorInicioAgenda;
