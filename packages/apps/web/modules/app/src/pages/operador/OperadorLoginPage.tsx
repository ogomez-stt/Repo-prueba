import { useState } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Card } from "@/elements/ui/card";
import { Button } from "@/elements/ui/button";
import { Select } from "@/elements/form/select";
import { Label } from "@/elements/form/label";
import { ThemeToggleButton } from "@/shell";
import { agendaStore, operadoresStore, sessionStore, SECCIONES } from "@/stores";
import { Tab } from "@/elements/ui/tabs";

type Modo = "operador" | "profesional";

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OperadorLoginPage — "login" para SIMULAR (mock).
 *
 * Permite entrar como un OPERADOR (con sus permisos) o como un PROFESIONAL
 * (opción A: operador ligado a sí mismo que solo ve su agenda/calendario/citas
 * y puede crear citas). Al entrar, sessionStore activa el modo simulación.
 *
 * Vista construida con el flujo Elements: Card + Select + Button + Tab.
 */
export const OperadorLoginPage = observer(() => {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("operador");
  const [operadorId, setOperadorId] = useState<string>("");
  const [profId, setProfId] = useState<string>("");

  // Solo se pueden simular operadores activos.
  const operadores = operadoresStore.operadores.filter((o) => o.estado === "activo");

  const opciones = operadores.map((o) => ({
    value: o.id,
    label: `${o.nombre} · ${o.modulo === "turnos" ? "Turnos" : "Agendamiento"}`,
  }));

  const profOpciones = agendaStore.profesionales.map((p) => ({
    value: p.id,
    label: `${p.nombre} · ${p.especialidad}`,
  }));

  const elegido = operadores.find((o) => o.id === operadorId) ?? null;
  const profElegido = agendaStore.getProfesional(profId) ?? null;

  const entrar = () => {
    if (modo === "operador") {
      if (!elegido) return;
      sessionStore.simular(elegido.id);
    } else {
      if (!profElegido) return;
      sessionStore.simularProfesional(profElegido.id);
    }
    // Entra a Inicio (modo simulación ya activo). Si no tiene permiso a
    // "inicio", homePathActual lo lleva a su primera sección.
    navigate(sessionStore.homePathActual);
  };

  const totalSecciones = elegido ? SECCIONES[elegido.modulo].length : 0;
  const puedeEntrar = modo === "operador" ? !!elegido : !!profElegido;

  return (
    <>
      <PageMeta title="Simular operador" description="Entra como un operador para ver la app con sus permisos" />

      <div className="relative min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
        <div className="fixed right-6 top-6 z-50">
          <ThemeToggleButton variant="floating" />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col">
          {/* Encabezado centrado */}
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/images/logo/necto-icon.svg" alt="NECTO" className="mb-4 h-10 w-10" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Simular acceso</h1>
            <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Entra como un operador (con sus permisos) o como un profesional (solo su agenda).
            </p>
          </div>

          {/* Tarjeta con el selector */}
          <Card>
            {/* Toggle de modo */}
            <div className="mb-4">
              <Tab
                items={[
                  { key: "operador", label: "Operador" },
                  { key: "profesional", label: "Profesional" },
                ]}
                activeTab={modo}
                onTabChange={(k) => setModo(k as Modo)}
              />
            </div>

            {modo === "operador" ? (
              <>
                <div>
                  <Label htmlFor="op-select">Operador</Label>
                  <Select
                    options={opciones}
                    placeholder="Elige un operador"
                    defaultValue=""
                    onChange={setOperadorId}
                  />
                </div>
                {elegido && (
                  <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{elegido.nombre}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {elegido.modulo === "turnos" ? "Turnos" : "Agendamiento"} · {elegido.permisos.length} de {totalSecciones} secciones permitidas
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="prof-select">Profesional</Label>
                  <Select
                    options={profOpciones}
                    placeholder="Elige un profesional"
                    defaultValue=""
                    onChange={setProfId}
                  />
                </div>
                {profElegido && (
                  <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profElegido.nombre}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {profElegido.especialidad} · verá solo su agenda, calendario y podrá crear citas
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Acciones */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button size="sm" variant="outline" onClick={() => navigate("/seleccionar")}>Cancelar</Button>
              <Button size="sm" disabled={!puedeEntrar} onClick={entrar}>
                {modo === "operador" ? "Entrar como operador" : "Entrar como profesional"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
});

export default OperadorLoginPage;
