import { useState } from "react";
import type { ApexOptions } from "apexcharts";
import { observer } from "mobx-react-lite";
import { Card } from "@/elements/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import { BarChart } from "@/elements/ui/bar-chart";
import { LineChart } from "@/elements/ui/line-chart";
import { operadoresStore, agendaStore, type Operador } from "@/stores";

// Paleta para las 4 series (gestionadas / confirmadas / no-shows / completadas hoy).
const SERIE_COLORS = ["#465fff", "#12b76a", "#f04438", "#f79009"];
type TipoGrafica = "bar" | "line";

/** Iniciales a partir del nombre. */
const inicialesDe = (nombre: string) => {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : (p[0]?.[1] ?? ""))).toUpperCase();
};

/** Valor numérico de métrica: número destacado, o guion tenue si es 0. */
const Metrica = ({ value }: { value: number }) =>
  value > 0 ? (
    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{value}</span>
  ) : (
    <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
  );

/**
 * OperadoresAgendaStats — sección del dashboard admin (Agendamiento) con el
 * rendimiento del equipo de operadores. A diferencia de Turnos (stats mock),
 * aquí las métricas se DERIVAN de las citas reales de los profesionales que
 * cada operador tiene asignados (agendaStore.statsDeProfesionales). Solo lectura.
 */
export const OperadoresAgendaStats = observer(() => {
  const operadores = operadoresStore.porModulo("agendamiento");

  return (
    <Card className="p-0 sm:p-0">
      {/* Encabezado de la sección */}
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Rendimiento de operadores</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Actividad del equipo en Agendamiento</p>
      </div>

      {operadores.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Aún no tienes operadores en Agendamiento.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Operador</TableCell>
                <TableCell header>Citas gestionadas</TableCell>
                <TableCell header>Confirmadas</TableCell>
                <TableCell header>No-shows</TableCell>
                <TableCell header>Completadas hoy</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operadores.map((op) => <OperadorRow key={op.id} op={op} />)}
            </TableBody>
          </Table>

          <OperadoresChart operadores={operadores} />
        </>
      )}
    </Card>
  );
});

/**
 * OperadoresChart — gráfica comparativa del equipo por citas gestionadas /
 * confirmadas / no-shows / completadas hoy. El usuario alterna el tipo de
 * gráfica (barras o línea) con un selector.
 */
const OperadoresChart = observer(({ operadores }: { operadores: Operador[] }) => {
  const [tipo, setTipo] = useState<TipoGrafica>("bar");

  const nombres = operadores.map((o) => o.nombre);
  const stats = operadores.map((o) => agendaStore.statsDeProfesionales(o.profesionalIds));

  const series = [
    { name: "Gestionadas", data: stats.map((s) => s.gestionadas) },
    { name: "Confirmadas", data: stats.map((s) => s.confirmadas) },
    { name: "No-shows", data: stats.map((s) => s.noShows) },
    { name: "Completadas hoy", data: stats.map((s) => s.completadasHoy) },
  ];

  const options: ApexOptions = {
    colors: SERIE_COLORS,
    chart: { fontFamily: "DM Sans, sans-serif", toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" } },
    stroke: tipo === "line" ? { curve: "smooth", width: 2 } : { show: false },
    dataLabels: { enabled: false },
    xaxis: {
      categories: nombres,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { position: "top", horizontalAlign: "right", fontFamily: "DM Sans" },
    grid: { yaxis: { lines: { show: true } } },
  };

  return (
    <div className="border-t border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Comparativa del equipo</h4>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoGrafica)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          aria-label="Tipo de gráfica"
        >
          <option value="bar">Barras</option>
          <option value="line">Línea</option>
        </select>
      </div>
      {tipo === "bar" ? (
        <BarChart series={series} options={options} height={300} />
      ) : (
        <LineChart series={series} options={options} height={300} />
      )}
    </div>
  );
});

/** Fila de un operador con su avatar de iniciales y sus métricas derivadas. */
const OperadorRow = observer(({ op }: { op: Operador }) => {
  const stats = agendaStore.statsDeProfesionales(op.profesionalIds);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            {inicialesDe(op.nombre)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800 dark:text-white/90">{op.nombre}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{op.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell><Metrica value={stats.gestionadas} /></TableCell>
      <TableCell><Metrica value={stats.confirmadas} /></TableCell>
      <TableCell><Metrica value={stats.noShows} /></TableCell>
      <TableCell><Metrica value={stats.completadasHoy} /></TableCell>
    </TableRow>
  );
});

export default OperadoresAgendaStats;
