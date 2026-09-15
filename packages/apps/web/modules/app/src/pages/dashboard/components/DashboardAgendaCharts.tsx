import type { ApexOptions } from "apexcharts";
import { observer } from "mobx-react-lite";
import { Card, CardTitle } from "@/elements/ui/card";
import { LineChart } from "@/elements/ui/line-chart";
import { BarChart } from "@/elements/ui/bar-chart";
import { PieChart } from "@/elements/ui/pie-chart";
import { agendaStore } from "@/stores";

// NECTO palette
const ORANGE = "#FF3F1A";
const INDIGO = "#190088";
const CELESTE = "#97D6DF";
const WARN = "#FDB022";
const GREEN = "#12B76A";

const PALETTE = [ORANGE, INDIGO, CELESTE, WARN, GREEN];

/**
 * DashboardAgendaCharts — tres gráficos del inicio de Agendamiento:
 *  - Citas por semana (línea, tendencia de las últimas 4 semanas)
 *  - Modalidad (dona, presencial vs virtual)
 *  - Ocupación por profesional (barras), filtrada por profesionales visibles.
 * Lee del agendaStore. Solo lectura.
 */
export const DashboardAgendaCharts = observer(() => {
  // ── Citas por semana (línea) ──
  const tendencia = agendaStore.tendenciaSemanal;
  const tendenciaOptions: ApexOptions = {
    colors: [ORANGE],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: tendencia.map((t) => t.semana),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { yaxis: { lines: { show: true } } },
    legend: { show: false },
  };
  const tendenciaSeries = [{ name: "Citas", data: tendencia.map((t) => t.citas) }];

  // ── Modalidad (dona) ──
  const modalidad = agendaStore.modalidadSplit;
  const modalidadTotal = modalidad.presencial + modalidad.virtual;
  const modalidadOptions: ApexOptions = {
    colors: [INDIGO, CELESTE],
    labels: ["Presencial", "Virtual"],
    chart: { fontFamily: "DM Sans, sans-serif" },
    stroke: { show: false },
    legend: { position: "bottom", horizontalAlign: "center", fontFamily: "DM Sans" },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: { show: true, label: "Citas", formatter: () => String(modalidadTotal) },
          },
        },
      },
    },
    dataLabels: { enabled: false },
  };
  const modalidadSeries = [modalidad.presencial, modalidad.virtual];

  // ── Ocupación por profesional (barras) — vista global: todos ──
  const ocupacion = agendaStore.ocupacionPorProfesional;
  const ocupacionOptions: ApexOptions = {
    colors: PALETTE,
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    plotOptions: {
      bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end", distributed: true },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ocupacion.map((o) => o.profesional.nombre),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
  };
  const ocupacionSeries = [{ name: "Citas", data: ocupacion.map((o) => o.citas) }];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card>
        <CardTitle>Citas por semana</CardTitle>
        <div className="mt-4">
          <LineChart series={tendenciaSeries} options={tendenciaOptions} height={260} />
        </div>
      </Card>
      <Card>
        <CardTitle>Modalidad</CardTitle>
        <div className="mt-2 flex justify-center">
          <PieChart series={modalidadSeries} options={modalidadOptions} height={260} />
        </div>
      </Card>
      <Card>
        <CardTitle>Ocupación por profesional</CardTitle>
        <div className="mt-4">
          <BarChart series={ocupacionSeries} options={ocupacionOptions} height={260} />
        </div>
      </Card>
    </div>
  );
});

export default DashboardAgendaCharts;
