import { useState } from "react";
import { observer } from "mobx-react-lite";
import BasePageLayout from "@/layouts/base-page/BasePageLayout";
import BasePageHeader from "@/layouts/base-page/BasePageHeader";
import { PageMeta } from "@/shell/meta";
import { Card, CardTitle, CardDescription } from "@/elements/ui/card";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Textarea } from "@/elements/form/textarea";
import { Alert } from "@/elements/ui/alert";
import { queuesStore } from "@/stores";
import { HorarioNegocio } from "@/pages/configuracion/HorarioNegocio";
import { ReglasTurnos } from "@/pages/configuracion/ReglasTurnos";
import { ReglasCitas } from "@/pages/configuracion/ReglasCitas";
import { ConfigDisplay } from "@/pages/configuracion/ConfigDisplay";
import { sessionStore } from "@/stores";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ConfiguracionPage — configuración del negocio dentro del shell (botón
 * "Configuración" del sidebar). A diferencia del onboarding, aquí se editan
 * los datos ya guardados: logo (imagen) e información de la empresa.
 *
 * De momento solo cubre los datos del negocio; más adelante reunirá la
 * configuración completa de Turnos y Agendamiento.
 */
export const ConfiguracionPage = observer(() => {
  const cfg = queuesStore.businessConfig;

  const [nombre, setNombre] = useState(cfg.nombre);
  const [logoUrl, setLogoUrl] = useState(cfg.logoUrl);
  const [descripcion, setDescripcion] = useState(cfg.descripcion);
  const [telefono, setTelefono] = useState(cfg.telefono);
  const [email, setEmail] = useState(cfg.email);
  const [direccion, setDireccion] = useState(cfg.direccion);
  const [logoError, setLogoError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("La imagen supera 1 MB. Elige una más liviana.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(typeof reader.result === "string" ? reader.result : "");
      setLogoError("");
      setGuardado(false);
    };
    reader.onerror = () => setLogoError("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    if (!nombre.trim()) return;
    queuesStore.updateBusinessConfig({
      nombre: nombre.trim(),
      logoUrl,
      descripcion: descripcion.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
    });
    setGuardado(true);
  };

  // Marca el formulario como "sucio" al editar cualquier campo (oculta el aviso).
  const touched = () => guardado && setGuardado(false);

  // Qué apartados mostrar según los módulos del negocio. Sin selección aún
  // (ej. admin recién entrado) → muestra ambos.
  const sinSeleccion = sessionStore.modulos.length === 0;
  const verTurnos = sinSeleccion || sessionStore.hasModulo("turnos");
  const verAgendamiento = sinSeleccion || sessionStore.hasModulo("agendamiento");

  return (
    <>
      <PageMeta title="Configuración" description="Configura los datos de tu negocio" />
      <BasePageLayout
        header={
          <BasePageHeader
            title="Configuración"
            breadcrumbItems={[{ label: "Inicio", href: "/dashboard" }, { label: "Configuración" }]}
          />
        }
      >
        <div className="flex flex-col gap-5">
          {guardado && (
            <Alert variant="success" title="Cambios guardados" message="Los datos de tu negocio se actualizaron correctamente." />
          )}

          <Card>
            <CardTitle>Datos del negocio</CardTitle>
            <CardDescription>Edita el logo y la información de tu empresa.</CardDescription>

            <div className="mt-6 flex flex-col gap-5">
              {/* Logo */}
              <div>
                <Label htmlFor="logo">Logo del negocio</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="logo"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
                      >
                        <UploadIcon />
                        {logoUrl ? "Cambiar imagen" : "Subir imagen"}
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => { setLogoUrl(""); touched(); }}
                          className="text-sm font-medium text-gray-500 hover:text-error-500"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PNG o JPG, hasta 1 MB.</p>
                  </div>
                  <input id="logo" type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                </div>
                {logoError && <p className="mt-1.5 text-xs text-error-500">{logoError}</p>}
              </div>

              <div>
                <Label htmlFor="nombre">
                  Nombre del negocio <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Clínica San Rafael"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); touched(); }}
                />
              </div>

              <div>
                <Label htmlFor="descripcion">¿A qué se dedica tu negocio?</Label>
                <Textarea
                  rows={2}
                  placeholder="Ej: Centro médico de atención general y laboratorio clínico."
                  value={descripcion}
                  onChange={(v) => { setDescripcion(v); touched(); }}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={telefono}
                    onChange={(e) => { setTelefono(e.target.value); touched(); }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@tunegocio.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); touched(); }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle 123 #45-67 (opcional)"
                  value={direccion}
                  onChange={(e) => { setDireccion(e.target.value); touched(); }}
                />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end">
            <Button size="sm" disabled={!nombre.trim()} onClick={guardar}>Guardar cambios</Button>
          </div>

          {/* ── Horario de atención ── */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Horario de atención</CardTitle>
                <CardDescription>
                  Define los días y horas en que atiendes turnos. Los cambios se guardan al instante.
                </CardDescription>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  queuesStore.abiertoAhora
                    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                    : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400"
                }`}
              >
                {queuesStore.abiertoAhora ? "Abierto ahora" : "Cerrado ahora"}
              </span>
            </div>

            <div className="mt-6">
              <HorarioNegocio />
            </div>
          </Card>

          {/* ── Turnos: reglas + display (solo si el negocio usa Turnos) ── */}
          {verTurnos && (
            <>
              <Card>
                <CardTitle>Reglas de turnos</CardTitle>
                <CardDescription>
                  Define el prefijo del número de turno (inicial de la fila o uno fijo), si la numeración
                  se reinicia cada día, a los cuántos minutos un turno se marca como urgente y desde cuántas
                  personas en espera una fila se considera ocupada o llena. Estos son los valores por defecto:
                  cada fila puede tener los suyos desde su edición. Los cambios se guardan al instante.
                </CardDescription>
                <div className="mt-6">
                  <ReglasTurnos />
                </div>
              </Card>

              {/* ── Pantalla de sala (Display) ── */}
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Pantalla de sala (Display)</CardTitle>
                    <CardDescription>
                      Personaliza la pantalla pública que ven los clientes en la sala: sonido al llamar,
                      si se muestra el nombre, cuántos turnos siguientes listar, el logo y un mensaje al pie.
                      Los cambios se guardan al instante.
                    </CardDescription>
                  </div>
                  <a
                    href="/display"
                    target="_blank"
                    rel="noreferrer"
                    className="hidden shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] sm:inline-block"
                  >
                    Ver pantalla
                  </a>
                </div>
                <div className="mt-6">
                  <ConfigDisplay />
                </div>
              </Card>
            </>
          )}

          {/* ── Agendamiento: reglas de citas (solo si el negocio usa Agendamiento) ── */}
          {verAgendamiento && (
            <Card>
              <CardTitle>Reglas de citas (Agendamiento)</CardTitle>
              <CardDescription>
                Define la duración por defecto de las citas, la modalidad (presencial/virtual), con cuánta
                antelación se envía el recordatorio al cliente y si puede cancelar o reagendar por WhatsApp.
                La disponibilidad concreta (días y horas) se configura en cada profesional. Los cambios se
                guardan al instante.
              </CardDescription>
              <div className="mt-6">
                <ReglasCitas />
              </div>
            </Card>
          )}
        </div>
      </BasePageLayout>
    </>
  );
});

export default ConfiguracionPage;
