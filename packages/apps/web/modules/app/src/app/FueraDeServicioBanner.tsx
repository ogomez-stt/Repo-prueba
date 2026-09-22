import { observer } from "mobx-react-lite";
import { queuesStore, sessionStore, DIAS_SEMANA, type DiaSemana } from "@/stores";

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/** Formatea una hora entera 0–24 como "08:00". */
const horaTxt = (h: number) => `${String(h).padStart(2, "0")}:00`;

/**
 * Calcula el próximo momento de apertura a partir de ahora, recorriendo los
 * días del horario. Devuelve un texto legible ("hoy a las 14:00", "mañana a
 * las 08:00", "el Lunes a las 08:00") o null si ningún día está abierto.
 */
function proximaApertura(): string | null {
  const now = new Date();
  const horaActual = now.getHours() + now.getMinutes() / 60;
  const hoy = now.getDay() as DiaSemana;

  for (let offset = 0; offset < 7; offset++) {
    const dia = ((hoy + offset) % 7) as DiaSemana;
    const h = queuesStore.horario.find((x) => x.dia === dia);
    if (!h || !h.abierto) continue;
    // Hoy: solo sirve si aún no llegó la hora de apertura.
    if (offset === 0 && horaActual >= h.desde) continue;
    const cuando = offset === 0 ? "hoy" : offset === 1 ? "mañana" : `el ${DIAS_SEMANA.find((d) => d.dia === dia)!.label}`;
    return `${cuando} a las ${horaTxt(h.desde)}`;
  }
  return null;
}

/**
 * FueraDeServicioBanner — aviso global "fuera de horario" del módulo de Turnos.
 *
 * Se muestra en TODAS las vistas de Turnos cuando el negocio está cerrado según
 * el horario configurado. No oculta nada: solo agrega una franja informativa
 * arriba del contenido. No aplica a Agendamiento.
 */
export const FueraDeServicioBanner = observer(() => {
  // Solo aplica al módulo de Turnos.
  const esTurnos = sessionStore.operadorSimulado
    ? sessionStore.operadorSimulado.modulo === "turnos"
    : sessionStore.hasModulo("turnos");
  if (!esTurnos) return null;

  // Si el negocio está abierto, no se muestra nada.
  if (queuesStore.abiertoAhora) return null;

  const proxima = proximaApertura();

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/10">
      <span className="mt-0.5 shrink-0 text-warning-600 dark:text-orange-400">
        <ClockIcon />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-warning-700 dark:text-orange-300">
          Fuera de horario de atención
        </p>
        <p className="mt-0.5 text-sm text-warning-600 dark:text-orange-200/80">
          El negocio está cerrado ahora mismo, no se están atendiendo turnos.
          {proxima ? ` Abre ${proxima}.` : " No hay días de atención configurados."}{" "}
          Puedes seguir revisando y preparando todo con normalidad.
        </p>
      </div>
    </div>
  );
});

export default FueraDeServicioBanner;
