import type { ApexOptions } from "apexcharts";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Card, CardTitle } from "@/elements/ui/card";
import { BarChart } from "@/elements/ui/bar-chart";
import { agendaStore } from "@/stores";

const ORANGE = "#FF3F1A";
const INDIGO = "#190088";

export const AnaliticaPage = observer(() => {
  const tendencia = agendaStore.tendenciaSemanal;
  const modalidad = agendaStore.modalidadSplit;
  const ocupacion = agendaStore.ocupacionPorProfesional;
  const topClientes = agendaStore.topClientes;
  const topServicios = agendaStore.topServicios;
  const maxOcup = Math.max(1, ...ocupacion.map((o) => o.citas));

  // ── Tendencia semanal (barras) ──
  const tendenciaOptions: ApexOptions = {
    colors: [ORANGE],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    xaxis: { categories: tendencia.map((t) => t.semana), axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
  };
  const tendenciaSeries = [{ name: "Citas", data: tendencia.map((t) => t.citas) }];

  // ── Modalidad (barras) ──
  const modalidadOptions: ApexOptions = {
    colors: [INDIGO],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "40%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: true },
    xaxis: { categories: ["Presencial", "Virtual"], axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
  };
  const modalidadSeries = [{ name: "Citas", data: [modalidad.presencial, modalidad.virtual] }];

  const kpi = (label: string, value: string, tint: string) => (
    <div className="rounded-2xl bg-white p-5 shadow-theme-sm dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tint}`}>{value}</p>
    </div>
  );

  return (
    <>
      <PageMeta title="Analítica" description="Datos de tus clientes y citas" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Analítica de clientes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Regularidad, retención y actividad del módulo de citas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpi("Total de clientes", String(agendaStore.totalClientes), "text-gray-800 dark:text-white/90")}
        {kpi("Nuevos (30 días)", String(agendaStore.clientesNuevos), "text-brand-600 dark:text-brand-400")}
        {kpi("Tasa de retorno", `${agendaStore.tasaRetorno}%`, "text-success-600")}
        {kpi("Tasa de no-show", `${agendaStore.tasaNoShow}%`, "text-error-500")}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Citas por semana</CardTitle>
          <div className="mt-4"><BarChart series={tendenciaSeries} options={tendenciaOptions} height={240} /></div>
        </Card>
        <Card>
          <CardTitle>Modalidad</CardTitle>
          <div className="mt-4"><BarChart series={modalidadSeries} options={modalidadOptions} height={240} /></div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Clientes frecuentes */}
        <div className="rounded-2xl bg-white p-5 shadow-theme-sm dark:bg-gray-900 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Clientes frecuentes</h3>
          <div className="space-y-3">
            {topClientes.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-800 dark:text-white/90">{c.nombre}</p>
                  <p className="text-xs text-gray-400">{c.completadas} completadas · {c.noShows} no-show</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {c.totalCitas} citas
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ocupación por profesional */}
        <div className="rounded-2xl bg-white p-5 shadow-theme-sm dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Ocupación</h3>
          <div className="space-y-4">
            {ocupacion.map((o) => (
              <div key={o.profesional.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${o.profesional.color}`}>{o.profesional.avatar}</span>
                    {o.profesional.especialidad}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{o.citas}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className={`h-full rounded-full ${o.profesional.color}`} style={{ width: `${(o.citas / maxOcup) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Servicios más solicitados */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-theme-sm dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Servicios más solicitados</h3>
        <div className="flex flex-wrap gap-2">
          {topServicios.map((s) => (
            <span key={s.servicio} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {s.servicio}
              <span className="rounded-full bg-white/70 px-1.5 text-xs dark:bg-black/20">{s.count}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
});

export default AnaliticaPage;
