import { observer } from "mobx-react-lite";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { queuesStore, type PrefijoModo } from "@/stores";

/**
 * ReglasTurnos — editor de las reglas globales de turnos.
 *
 * Reutilizable entre el onboarding (ConfiguracionTurnosPage) y la vista de
 * configuración del sidebar (ConfiguracionPage). Lee/escribe directamente en
 * queuesStore.turnoRules; los cambios se guardan al instante.
 */
export const ReglasTurnos = observer(() => {
  const r = queuesStore.turnoRules;

  // Ejemplo en vivo del número de turno según el modo de prefijo.
  const ejemploPrefijo =
    r.prefijoModo === "fijo" ? (r.prefijoFijo || "T") : "A";

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
        Estos son los valores <span className="font-medium">por defecto</span> del negocio. Cada fila puede
        tener su propio prefijo, urgencia y umbrales; si no los define, usa estos.
      </p>
      {/* Numeración */}
      <div>
        <Label htmlFor="prefijo-modo">Prefijo del número de turno</Label>
        <Select
          key={`prefijo-modo-${r.prefijoModo}`}
          defaultValue={r.prefijoModo}
          options={[
            { value: "inicial", label: "Inicial de la fila (A-045, L-018)" },
            { value: "fijo", label: "Prefijo fijo para todas las filas" },
          ]}
          onChange={(v) => queuesStore.updateTurnoRules({ prefijoModo: v as PrefijoModo })}
        />
      </div>

      {r.prefijoModo === "fijo" && (
        <div>
          <Label htmlFor="prefijo-fijo">Prefijo fijo</Label>
          <Input
            id="prefijo-fijo"
            placeholder="Ej: T"
            maxLength={3}
            value={r.prefijoFijo}
            onChange={(e) => queuesStore.updateTurnoRules({ prefijoFijo: e.target.value })}
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            1 a 3 letras. Ejemplo de turno: {ejemploPrefijo}-045.
          </p>
        </div>
      )}

      {/* Reinicio diario */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">Reiniciar numeración cada día</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            La numeración de turnos vuelve a empezar al inicio de cada jornada.
          </p>
        </div>
        <Switch
          checked={r.reinicioDiario}
          onChange={(v) => queuesStore.updateTurnoRules({ reinicioDiario: v })}
        />
      </div>

      {/* Urgencia */}
      <div>
        <Label htmlFor="urgencia">Tiempo para marcar un turno como urgente (min)</Label>
        <Input
          id="urgencia"
          type="number"
          min="1"
          value={String(r.urgenciaMin)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) queuesStore.updateTurnoRules({ urgenciaMin: n });
          }}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Un turno que espere más de este tiempo se resalta como urgente.
        </p>
      </div>

      {/* Saturación de filas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="busy">Fila ocupada desde (en espera)</Label>
          <Input
            id="busy"
            type="number"
            min="1"
            value={String(r.saturacionBusy)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n > 0) queuesStore.updateTurnoRules({ saturacionBusy: n });
            }}
          />
        </div>
        <div>
          <Label htmlFor="full">Fila llena desde (en espera)</Label>
          <Input
            id="full"
            type="number"
            min="2"
            value={String(r.saturacionFull)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n > 0) queuesStore.updateTurnoRules({ saturacionFull: n });
            }}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-gray-400 dark:text-gray-500">
        Estos umbrales controlan el indicador de saturación (ocupada / llena) de cada fila.
      </p>
    </div>
  );
});

export default ReglasTurnos;
