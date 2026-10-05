import { observer } from "mobx-react-lite";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { agendaStore, type Modalidad } from "@/stores";

/**
 * ReglasCitas — editor de las reglas globales de citas (Agendamiento).
 *
 * Reutilizable entre el onboarding (ConfiguracionAgendamientoPage) y la vista de
 * configuración del sidebar (ConfiguracionPage). Lee/escribe directamente en
 * agendaStore.agendaRules; los cambios se guardan al instante.
 */
export const ReglasCitas = observer(() => {
  const r = agendaStore.agendaRules;

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
        Valores <span className="font-medium">por defecto</span> al crear una cita. La disponibilidad concreta
        (días y horas) se define en cada profesional.
      </p>

      {/* Duración por defecto */}
      <div>
        <Label htmlFor="duracion">Duración por defecto de una cita (min)</Label>
        <Select
          key={`dur-${r.duracionDefault}`}
          defaultValue={String(r.duracionDefault)}
          options={[
            { value: "15", label: "15 minutos" },
            { value: "30", label: "30 minutos" },
            { value: "45", label: "45 minutos" },
            { value: "60", label: "60 minutos" },
            { value: "90", label: "90 minutos" },
          ]}
          onChange={(v) => agendaStore.updateAgendaRules({ duracionDefault: Number(v) })}
        />
      </div>

      {/* Modalidad por defecto */}
      <div>
        <Label htmlFor="modalidad">Modalidad por defecto</Label>
        <Select
          key={`mod-${r.modalidadDefault}`}
          defaultValue={r.modalidadDefault}
          options={[
            { value: "presencial", label: "Presencial" },
            { value: "virtual", label: "Virtual" },
          ]}
          onChange={(v) => agendaStore.updateAgendaRules({ modalidadDefault: v as Modalidad })}
        />
      </div>

      {/* Recordatorio */}
      <div>
        <Label htmlFor="recordatorio">Enviar recordatorio al cliente (horas antes)</Label>
        <Input
          id="recordatorio"
          type="number"
          min="0"
          value={String(r.recordatorioHoras)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) agendaStore.updateAgendaRules({ recordatorioHoras: n });
          }}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          El bot de WhatsApp avisa al cliente con esta antelación. 0 = sin recordatorio.
        </p>
      </div>

      {/* Permitir cancelar por WhatsApp */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">Cancelar / reagendar por WhatsApp</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            El cliente puede mover o cancelar su cita desde el chat, sin llamar.
          </p>
        </div>
        <Switch
          checked={r.permitirCancelarWhatsApp}
          onChange={(v) => agendaStore.updateAgendaRules({ permitirCancelarWhatsApp: v })}
        />
      </div>
    </div>
  );
});

export default ReglasCitas;
