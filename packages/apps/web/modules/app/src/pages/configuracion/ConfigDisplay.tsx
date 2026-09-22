import { observer } from "mobx-react-lite";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { queuesStore } from "@/stores";

/** Fila de ajuste con switch (título + descripción a la izquierda, switch a la derecha). */
const ToggleRow = ({
  titulo,
  descripcion,
  checked,
  onChange,
}: {
  titulo: string;
  descripcion: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{titulo}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{descripcion}</p>
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
);

/**
 * ConfigDisplay — editor de la pantalla de sala (/display).
 * Reutilizable en la vista de configuración del sidebar y donde se necesite.
 * Lee/escribe queuesStore.displayConfig; guarda al instante.
 */
export const ConfigDisplay = observer(() => {
  const c = queuesStore.displayConfig;
  const tieneLogo = Boolean(queuesStore.businessConfig.logoUrl);

  return (
    <div className="flex flex-col gap-4">
      <ToggleRow
        titulo="Sonido al llamar un turno"
        descripcion="Reproduce un aviso sonoro cada vez que se llama a un nuevo turno."
        checked={c.sonido}
        onChange={(v) => queuesStore.updateDisplayConfig({ sonido: v })}
      />

      <ToggleRow
        titulo="Mostrar el nombre del cliente"
        descripcion="Si lo desactivas, la pantalla muestra solo el número del turno (más privacidad)."
        checked={c.mostrarNombre}
        onChange={(v) => queuesStore.updateDisplayConfig({ mostrarNombre: v })}
      />

      <ToggleRow
        titulo="Usar el logo del negocio"
        descripcion={
          tieneLogo
            ? "Muestra el logo de tu negocio en la pantalla en vez del de NECTO."
            : "Aún no has subido un logo; se usará el de NECTO hasta que agregues uno."
        }
        checked={c.usarLogoNegocio}
        onChange={(v) => queuesStore.updateDisplayConfig({ usarLogoNegocio: v })}
      />

      <div>
        <Label htmlFor="display-siguientes">Cuántos turnos siguientes mostrar</Label>
        <div className="w-40">
          <Select
            key={`sig-${c.siguientesVisibles}`}
            defaultValue={String(c.siguientesVisibles)}
            options={Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
            onChange={(v) => queuesStore.updateDisplayConfig({ siguientesVisibles: Number(v) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="display-pie">Mensaje al pie (opcional)</Label>
        <Input
          id="display-pie"
          placeholder="Ej: Gracias por su visita"
          value={c.mensajePie}
          onChange={(e) => queuesStore.updateDisplayConfig({ mensajePie: e.target.value })}
        />
      </div>
    </div>
  );
});

export default ConfigDisplay;
