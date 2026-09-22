import { observer } from "mobx-react-lite";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { queuesStore, DIAS_SEMANA, type DiaSemana } from "@/stores";

/** Formatea una hora entera 0–24 como "08:00", "18:00", "24:00". */
const fmtHora = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Opciones de apertura (0–23) y cierre (1–24). */
const HORAS_DESDE = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: fmtHora(h) }));
const HORAS_HASTA = Array.from({ length: 24 }, (_, i) => {
  const h = i + 1;
  return { value: String(h), label: fmtHora(h) };
});

/**
 * HorarioNegocio — editor del horario de atención por día de la semana.
 *
 * Reutilizable entre el onboarding (ConfiguracionTurnosPage) y la vista de
 * configuración del sidebar (ConfiguracionPage). Lee y escribe directamente en
 * queuesStore.horario; los cambios se guardan al instante.
 */
export const HorarioNegocio = observer(() => (
  <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
    {queuesStore.horarioOrdenado.map((h) => {
      const meta = DIAS_SEMANA.find((d) => d.dia === h.dia)!;
      return (
        <div key={h.dia} className="flex flex-wrap items-center gap-4 py-3">
          <div className="flex w-40 shrink-0 items-center gap-3">
            <Switch
              checked={h.abierto}
              onChange={(v) => queuesStore.updateHorarioDia(h.dia as DiaSemana, { abierto: v })}
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{meta.label}</span>
          </div>

          {h.abierto ? (
            <div className="flex items-center gap-2">
              <div className="w-28">
                <Select
                  key={`desde-${h.dia}-${h.desde}`}
                  defaultValue={String(h.desde)}
                  options={HORAS_DESDE}
                  onChange={(v) => queuesStore.updateHorarioDia(h.dia as DiaSemana, { desde: Number(v) })}
                />
              </div>
              <span className="text-sm text-gray-400">a</span>
              <div className="w-28">
                <Select
                  key={`hasta-${h.dia}-${h.hasta}`}
                  defaultValue={String(h.hasta)}
                  options={HORAS_HASTA}
                  onChange={(v) => queuesStore.updateHorarioDia(h.dia as DiaSemana, { hasta: Number(v) })}
                />
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Cerrado</span>
          )}
        </div>
      );
    })}
  </div>
));

export default HorarioNegocio;
