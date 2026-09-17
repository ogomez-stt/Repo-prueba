import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Card } from "@/elements/ui/card";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { Modal } from "@/elements/ui/modal";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Tab, type TabItem } from "@/elements/ui/tabs";
import { agendaStore, sessionStore, todayIso, type Cita, type Modalidad } from "@/stores";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const RequiredMark = () => <span className="text-error-500">*</span>;

/** Valor especial del selector: ver el calendario de todos los profesionales. */
const TODOS = "all";

/**
 * CitaBloque — bloque de una cita dentro de una franja del timeline diario.
 * Muestra cliente, servicio, estado y (para distinguir en "Todos") el avatar y
 * nombre del profesional con su color.
 */
const CitaBloque = observer(({ cita, onOpen }: { cita: Cita; onOpen: () => void }) => {
  const prof = agendaStore.getProfesional(cita.profesionalId);
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-300 dark:border-gray-800"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{cita.cliente}</p>
        <Badge size="xs" color={agendaStore.estadoBadgeColor(cita.estado)}>{agendaStore.estadoLabel(cita.estado)}</Badge>
      </div>
      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{cita.servicio}</p>
      {prof && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${prof.color}`}>{prof.avatar}</span>
          {prof.nombre}
        </div>
      )}
    </div>
  );
});

export const CalendarioPage = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string>(todayIso());
  // Vista activa: cuadrícula del mes o timeline del día.
  const [vista, setVista] = useState<"mes" | "dia">("mes");

  // Profesionales visibles (en simulación de operador, solo los suyos).
  const profesionalesVisibles = agendaStore.profesionales.filter((p) => sessionStore.puedeVerProfesional(p.id));

  // Alcance actual: "Todos" por defecto, o un profesional concreto del ?prof=.
  const profParam = searchParams.get("prof");
  const profId =
    profParam && profParam !== TODOS && sessionStore.puedeVerProfesional(profParam)
      ? profParam
      : TODOS;
  const verTodos = profId === TODOS;
  // profScope: undefined en "Todos" (los helpers del store lo interpretan como
  // "todos"), o el id concreto. Nota: cuando el operador ve "Todos" ve todos SUS
  // profesionales; el store no filtra por permisos aquí, pero el catálogo de
  // citas ya está acotado a los profesionales del negocio y el selector solo
  // ofrece los visibles.
  const profScope = verTodos ? undefined : profId;
  const prof = verTodos ? null : agendaStore.getProfesional(profId);

  // Nueva cita (desde un slot libre) — el profesional lo fija el calendario actual
  const [crearOpen, setCrearOpen] = useState(false);
  const [slotHora, setSlotHora] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("presencial");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Month grid (Mon-first) ──
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(todayIso()); };

  const citasDia = agendaStore.citasDelDia(selected, profScope);
  // Los horarios libres son por-profesional; en "Todos" no aplican.
  const slots = verTodos ? [] : agendaStore.horariosDisponibles(selected, profScope);
  const selectedLegible = new Date(selected + "T00:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  // ── Vista de día (timeline por horas) ──
  // Etiquetas de las franjas horarias, según la config del calendario.
  const franjas: string[] = [];
  {
    const { horaInicio, horaFin, duracionSlot } = agendaStore.configDe(profScope);
    for (let mins = horaInicio * 60; mins < horaFin * 60; mins += duracionSlot) {
      franjas.push(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    }
  }
  // Citas del día indexadas por su franja (la cita cae en la franja cuya etiqueta coincide con su hora).
  const citasPorFranja = (hora: string): Cita[] => citasDia.filter((c) => c.hora === hora);

  const vistaTabs: TabItem[] = [
    { key: "mes", label: "Mes" },
    { key: "dia", label: "Día" },
  ];

  // Abrir la vista de día en una fecha concreta (desde el grid).
  const abrirDia = (iso: string) => { setSelected(iso); setVista("dia"); };
  // Navegación de día anterior/siguiente en la vista de día.
  const shiftDay = (delta: number) => {
    const d = new Date(selected + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelected(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const openCrear = (hora: string) => {
    setSlotHora(hora);
    setCliente(""); setTelefono(""); setServicio(""); setModalidad("presencial");
    setErrors({});
    setCrearOpen(true);
  };

  const guardarCita = () => {
    const e: Record<string, string> = {};
    if (!cliente.trim()) e.cliente = "Nombre obligatorio";
    if (telefono.replace(/[^\d+]/g, "").length < 7) e.telefono = "Teléfono obligatorio";
    if (!servicio.trim()) e.servicio = "Servicio obligatorio";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!prof) return; // por seguridad: crear en slot solo con profesional concreto
    agendaStore.crearCita({ cliente: cliente.trim(), telefono: telefono.trim(), profesionalId: prof.id, servicio: servicio.trim(), fecha: selected, hora: slotHora, modalidad });
    setCrearOpen(false);
  };

  // Sin profesionales del todo: invita a crearlos.
  if (profesionalesVisibles.length === 0) {
    return (
      <>
        <PageMeta title="Calendario" description="Vista mensual de citas" />
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">No hay profesionales</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea un profesional para ver su calendario de citas.</p>
          <Button size="sm" className="mt-5" onClick={() => navigate("/agendamiento/profesionales")}>Ir a Profesionales</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={verTodos ? "Calendario" : `Calendario de ${prof?.nombre ?? ""}`} description="Vista mensual de citas" />

      {/* Volver a todos — solo cuando se ve un profesional concreto */}
      {!verTodos && (
        <div className="mb-4">
          <Link to="/agendamiento/calendario" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Todos los profesionales
          </Link>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {prof ? (
            <>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${prof.color}`}>{prof.avatar}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Calendario</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{prof.nombre} · {prof.especialidad}</p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Calendario</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Citas de todos los profesionales</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Toggle Mes / Día */}
          <Tab
            items={vistaTabs}
            activeTab={vista}
            onTabChange={(k) => setVista(k as "mes" | "dia")}
          />
          <div className="sm:w-56">
            <Select
              defaultValue={profId}
              onChange={(v) => navigate(`/agendamiento/calendario?prof=${v}`)}
              options={[
                { value: TODOS, label: "Todos los profesionales" },
                ...profesionalesVisibles.map((p) => ({ value: p.id, label: p.nombre })),
              ]}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={goToday}>Hoy</Button>
          </div>
        </div>
      </div>

      {vista === "mes" && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <Card>
            {/* Nav de mes */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{MESES[month]} {year}</h2>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" aria-label="Mes anterior" onClick={prevMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </Button>
                <Button size="icon" variant="outline" aria-label="Mes siguiente" onClick={nextMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </Button>
              </div>
            </div>

            {/* Encabezados de día */}
            <div className="grid grid-cols-7 gap-1">
              {DIAS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase text-gray-400">{d}</div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const iso = isoOf(year, month, d);
                const count = agendaStore.countByDay(iso, profScope);
                const isToday = iso === todayIso();
                const isSelected = iso === selected;
                const laboral = agendaStore.esDiaLaboral(iso, profScope);
                // Día bloqueado: no laboral para el profesional concreto seleccionado.
                // En "Todos" no se bloquea (cada profesional trabaja días distintos).
                const bloqueado = !laboral && !verTodos;
                return (
                  <button
                    key={i}
                    disabled={bloqueado}
                    onClick={() => { if (!bloqueado) abrirDia(iso); }}
                    title={bloqueado ? "El profesional no atiende este día" : (count > 0 ? `${count} ${count === 1 ? "cita" : "citas"} · ver día` : "Ver día")}
                    className={
                      "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors " +
                      (isSelected && !bloqueado
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : "border-transparent") +
                      (bloqueado
                        ? " cursor-not-allowed opacity-40"
                        : " hover:bg-gray-50 dark:hover:bg-gray-800/50") +
                      (!laboral && verTodos ? " opacity-40" : "")
                    }
                  >
                    <span className={
                      "flex h-7 w-7 items-center justify-center rounded-full " +
                      (isToday ? "bg-brand-500 font-semibold text-white" : "text-gray-700 dark:text-gray-200")
                    }>
                      {d}
                    </span>
                    {/* Contador de citas — escala con cualquier cantidad */}
                    {count > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold leading-4 text-white">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Panel del día */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold capitalize text-gray-800 dark:text-white/90">{selectedLegible}</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              {citasDia.length} {citasDia.length === 1 ? "cita" : "citas"}
              {!verTodos && ` · ${slots.length} horarios libres`}
            </p>

            {/* Citas del día */}
            <div className="mt-4 space-y-2">
              {citasDia.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-700">
                  Sin citas este día
                </p>
              ) : (
                citasDia.map((c) => {
                  const prof = agendaStore.getProfesional(c.profesionalId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/agendamiento/detalles?id=${c.id}`)}
                      className="cursor-pointer rounded-xl border border-gray-200 p-3 transition-colors hover:border-brand-300 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{c.hora}</span>
                        <Badge size="xs" color={agendaStore.estadoBadgeColor(c.estado)}>{agendaStore.estadoLabel(c.estado)}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-200">{c.cliente}</p>
                      <p className="truncate text-xs text-gray-400">{c.servicio}{prof ? ` · ${prof.nombre}` : ""}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Horarios disponibles (por-profesional) o CTA a agendar en "Todos" */}
            {verTodos ? (
              <div className="mt-5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/agendamiento/crear")}
                >
                  Agendar cita
                </Button>
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Elige un profesional para ver sus horarios libres y agendar desde el calendario.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Horarios disponibles</p>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400">No quedan horarios libres.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((h) => (
                      <button
                        key={h}
                        onClick={() => openCrear(h)}
                        className="rounded-lg border border-gray-200 py-2 text-sm text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-brand-500/10"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      )}

      {/* ── VISTA DÍA (timeline por horas) ── */}
      {vista === "dia" && (
        <Card>
          {/* Cabecera del día: navegación + volver al mes */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" aria-label="Día anterior" onClick={() => shiftDay(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </Button>
              <h2 className="text-lg font-semibold capitalize text-gray-800 dark:text-white/90">{selectedLegible}</h2>
              <Button size="icon" variant="outline" aria-label="Día siguiente" onClick={() => shiftDay(1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{citasDia.length} {citasDia.length === 1 ? "cita" : "citas"}</span>
              <Button size="sm" variant="outline" onClick={() => setVista("mes")}>Volver al mes</Button>
            </div>
          </div>

          {/* Día no laboral: aviso */}
          {!agendaStore.esDiaLaboral(selected) && (
            <p className="mb-4 rounded-xl border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400 dark:border-gray-700">
              Día no laboral según la configuración del calendario.
            </p>
          )}

          {/* Timeline por horas */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {franjas.map((hora) => {
              const citas = citasPorFranja(hora);
              return (
                <div key={hora} className="flex gap-4 py-2.5">
                  {/* Etiqueta de hora */}
                  <div className="w-14 shrink-0 pt-1 text-sm font-medium text-gray-400">{hora}</div>
                  {/* Contenido de la franja */}
                  <div className="min-w-0 flex-1">
                    {citas.length === 0 ? (
                      verTodos ? (
                        <div className="h-9 rounded-lg border border-dashed border-gray-100 dark:border-gray-800/60" />
                      ) : (
                        <button
                          onClick={() => openCrear(hora)}
                          className="flex h-9 w-full items-center rounded-lg border border-dashed border-gray-200 px-3 text-xs text-gray-400 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                        >
                          + Agendar a las {hora}
                        </button>
                      )
                    ) : (
                      <div className="flex flex-col gap-2">
                        {citas.map((c) => <CitaBloque key={c.id} cita={c} onOpen={() => navigate(`/agendamiento/detalles?id=${c.id}`)} />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal crear cita en el slot */}
      <Modal isOpen={crearOpen} onClose={() => setCrearOpen(false)} className="max-w-[480px] p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Agendar cita</h4>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedLegible} · {slotHora}</p>

        {/* Profesional del calendario (fijo) — el modal solo se abre con un profesional concreto */}
        {prof && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${prof.color}`}>{prof.avatar}</span>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{prof.nombre}</p>
              <p className="text-xs text-gray-400">{prof.especialidad}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="cal-cliente">Cliente <RequiredMark /></Label>
            <Input id="cal-cliente" placeholder="Nombre del cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} error={!!errors.cliente} hint={errors.cliente} />
          </div>
          <div>
            <Label htmlFor="cal-tel">Teléfono (WhatsApp) <RequiredMark /></Label>
            <Input id="cal-tel" placeholder="+57 300 123 4567" value={telefono} onChange={(e) => setTelefono(e.target.value)} error={!!errors.telefono} hint={errors.telefono} />
          </div>
          <div>
            <Label htmlFor="cal-serv">Servicio <RequiredMark /></Label>
            <Input id="cal-serv" placeholder="Ej: Terapia individual" value={servicio} onChange={(e) => setServicio(e.target.value)} error={!!errors.servicio} hint={errors.servicio} />
          </div>
          <div>
            <Label htmlFor="cal-mod">Modalidad</Label>
            <div className="flex gap-3">
              {(["presencial", "virtual"] as Modalidad[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModalidad(m)}
                  className={
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors " +
                    (modalidad === m
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-gray-300 text-gray-600 hover:border-brand-300 dark:border-gray-700 dark:text-gray-300")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setCrearOpen(false)}>Cancelar</Button>
          <Button size="sm" onClick={guardarCita}>Agendar</Button>
        </div>
      </Modal>

    </>
  );
});

export default CalendarioPage;
