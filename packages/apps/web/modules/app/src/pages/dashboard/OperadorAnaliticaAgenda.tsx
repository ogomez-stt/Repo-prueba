import type { ApexOptions } from "apexcharts";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Card, CardTitle } from "@/elements/ui/card";
import { LineChart } from "@/elements/ui/line-chart";
import { PieChart } from "@/elements/ui/pie-chart";
import { MetricCard } from "@/compositions/metric-card";
import { GroupIcon, UserCircleIcon, TimeIcon, CalenderIcon } from "@/icons";
import { agendaStore, sessionStore } from "@/stores";

const INDIGO = "#190088";

/**
 * OperadorAnaliticaAgenda — Analítica del operador (Agendamiento), acotada a SUS
 * profesionales asignados y a los clientes de esos profesionales. Es una versión
 * ligera de la analítica del admin: KPIs de clientes, dos gráficas (evolución
 * semanal por estado y distribución por estado) y ocupación por profesional.
 * El programa de fidelidad NO está aquí: es exclusivo del admin.
 */
export const OperadorAnaliticaAgenda = observer(() => {
  const misProfesionales = agendaStore.profesionales.filter((p) => sessionStore.puedeVerProfesional(p.id));
  const a = agendaStore.analiticaDeProfesionales(misProfesionales.map((p) => p.id));
  const maxOcup = Math.max(1, ...a.ocupacionPorProfesional.map((o) => o.citas));

  // ── Gráfica 1: Citas por semana (evolución por estado, línea multi-serie) ──
  const evolOptions: ApexOptions = {
    colors: ["#12B76A", "#98A2B3", "#F04438"],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    markers: { size: 4, strokeWidth: 2, colors: ["#fff"], strokeColors: ["#12B76A", "#98A2B3", "#F04438"] },
    xaxis: { categories: a.tendenciaOperativa.map((t) => t.semana), axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { position: "top", horizontalAlign: "right", fontFamily: "DM Sans" },
    grid: { yaxis: { lines: { show: true } } },
  };
  const evolSeries = [
    { name: "Completadas", data: a.tendenciaOperativa.map((t) => t.completadas) },
    { name: "Canceladas", data: a.tendenciaOperativa.map((t) => t.canceladas) },
    { name: "Inasistencias", data: a.tendenciaOperativa.map((t) => t.noshow) },
  ];

  // ── Gráfica 2: Distribución por estado (dona) ──
  const e = a.conteoPorEstado;
  const estadoOptions: ApexOptions = {
    colors: ["#FDB022", INDIGO, "#12B76A", "#98A2B3", "#F04438"],
    chart: { fontFamily: "DM Sans, sans-serif" },
    labels: ["Pendiente", "Confirmada", "Completada", "Cancelada", "No asistió"],
    legend: { position: "bottom", fontFamily: "DM Sans" },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: { show: true, total: { show: true, label: "Citas", formatter: () => String(a.totalCitasRegistradas) } },
        },
      },
    },
  };
  const estadoSeries = [e.pendiente, e.confirmada, e.completada, e.cancelada, e.noshow];

  return (
    <>
      <PageMeta title="Analítica" description="Tus profesionales y sus clientes" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Analítica</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tus profesionales y sus clientes</p>
      </div>

      {/* KPIs de clientes */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard layout="horizontal" iconSize="w-14 h-14" icon={<GroupIcon className="size-6" />} title="Total de clientes" value={String(a.totalClientes)} />
        <MetricCard layout="horizontal" iconSize="w-14 h-14" icon={<UserCircleIcon className="size-6" />} title="Nuevos (30 días)" value={String(a.clientesNuevos)} iconBgClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15" />
        <MetricCard layout="horizontal" iconSize="w-14 h-14" icon={<CalenderIcon className="size-6" />} title="Tasa de retorno" value={`${a.tasaRetorno}%`} iconBgClass="bg-success-50 text-success-600 dark:bg-success-500/15" />
        <MetricCard layout="horizontal" iconSize="w-14 h-14" icon={<TimeIcon className="size-6" />} title="Frecuencia media" value={`${a.frecuenciaPromedioDias} d`} />
      </div>

      {/* Dos gráficas: evolución semanal por estado + distribución por estado */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Citas por semana</CardTitle>
          <div className="mt-4"><LineChart series={evolSeries} options={evolOptions} height={280} /></div>
        </Card>
        <Card>
          <CardTitle>Distribución por estado</CardTitle>
          <div className="mt-4"><PieChart series={estadoSeries} options={estadoOptions} height={280} /></div>
        </Card>
      </div>

      {/* Ocupación por profesional */}
      <div className="mt-6">
        <Card>
          <CardTitle>Ocupación por profesional</CardTitle>
          <div className="mt-4 space-y-4">
            {a.ocupacionPorProfesional.map((o) => (
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
        </Card>
      </div>
    </>
  );
});

export default OperadorAnaliticaAgenda;
