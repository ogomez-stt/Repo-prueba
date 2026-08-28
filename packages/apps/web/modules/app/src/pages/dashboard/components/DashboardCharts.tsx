import type { ApexOptions } from "apexcharts";
import { Card, CardTitle } from "@/elements/ui/card";
import { LineChart } from "@/elements/ui/line-chart";
import { BarChart } from "@/elements/ui/bar-chart";
import { PieChart } from "@/elements/ui/pie-chart";

// NECTO palette
const ORANGE = "#FF3F1A";
const INDIGO = "#190088";
const CELESTE = "#97D6DF";
const GRAY = "#98A2B3";

/**
 * DashboardCharts — Ticket volume (line), distribution (donut), wait time (bar).
 */
export const DashboardCharts = () => {
  // ── Ticket volume over time (today by hour) ──
  const volumeOptions: ApexOptions = {
    colors: [ORANGE],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { yaxis: { lines: { show: true } } },
    legend: { show: false },
  };
  const volumeSeries = [{ name: "Tickets", data: [12, 24, 38, 45, 30, 22, 40, 52, 48, 35] }];

  // ── Distribution by status (donut) ──
  const distributionOptions: ApexOptions = {
    colors: [ORANGE, CELESTE, INDIGO, GRAY],
    labels: ["Esperando", "En atencion", "Completado", "Cancelado"],
    chart: { fontFamily: "DM Sans, sans-serif" },
    stroke: { show: false },
    legend: { position: "bottom", horizontalAlign: "center", fontFamily: "DM Sans" },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: { show: true, label: "Total", formatter: () => "312" },
          },
        },
      },
    },
    dataLabels: { enabled: false },
  };
  const distributionSeries = [42, 8, 250, 12];

  // ── Average wait time by service (bar) ──
  const waitOptions: ApexOptions = {
    colors: [INDIGO],
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Consulta", "Laboratorio", "Farmacia", "Rayos X", "Caja"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { formatter: (v) => `${v}m` } },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
  };
  const waitSeries = [{ name: "Minutos", data: [18, 25, 8, 32, 12] }];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Line — full width on top-left */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardTitle>Volumen de tickets (hoy)</CardTitle>
        <div className="mt-4">
          <LineChart series={volumeSeries} options={volumeOptions} height={280} />
        </div>
      </Card>

      {/* Distribution + wait time stacked */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-1">
        <Card>
          <CardTitle>Distribucion por estado</CardTitle>
          <div className="mt-2 flex justify-center">
            <PieChart series={distributionSeries} options={distributionOptions} height={260} />
          </div>
        </Card>
        <Card>
          <CardTitle>Espera promedio por servicio</CardTitle>
          <div className="mt-4">
            <BarChart series={waitSeries} options={waitOptions} height={220} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
