import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { PageMeta } from "@/shell/meta";
import { Button } from "@/elements/ui/button";
import { Card, CardTitle, CardDescription } from "@/elements/ui/card";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Checkbox } from "@/elements/form/checkbox";
import { Select } from "@/elements/form/select";
import { Textarea } from "@/elements/form/textarea";
import { Modal } from "@/elements/ui/modal";
import { Badge } from "@/elements/ui/badge";
import { ThemeToggleButton } from "@/shell";
import { HorarioNegocio } from "@/pages/configuracion/HorarioNegocio";
import { ReglasTurnos } from "@/pages/configuracion/ReglasTurnos";
import {
  operadoresStore,
  queuesStore,
  sessionStore,
  DIAS_SEMANA,
  type TipoNegocio,
  type AttentionMode,
} from "@/stores";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const ClinicaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6M4.5 21h15a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0019.5 4.5h-15A1.5 1.5 0 003 6v13.5A1.5 1.5 0 004.5 21z" />
  </svg>
);

const RestauranteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v7a2 2 0 002 2h0V3M9 3v18M15 3c-1.5 0-2.5 1.8-2.5 4.5S13.5 12 15 12v9" />
  </svg>
);

const TramitesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4.5 21V9.75L12 4.5l7.5 5.25V21M9 21v-6h6v6" />
  </svg>
);

const SalonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l10.762 6.213a3 3 0 11-3 5.196l-1.536-.887m1.536.887L9.384 9.137" />
  </svg>
);

const OtroIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
  </svg>
);

const TIPO_ICONS: Record<TipoNegocio, () => ReactNode> = {
  clinica: ClinicaIcon,
  restaurante: RestauranteIcon,
  tramites: TramitesIcon,
  salon: SalonIcon,
  otro: OtroIcon,
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECTABLE PRESET CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PresetCardProps {
  titulo: string;
  descripcion: string;
  icon: () => ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/**
 * PresetCard — tarjeta seleccionable de tipo de negocio.
 * Mismo blueprint que el SelectCard de SeleccionarPage: Card + ícono + título +
 * descripción, con estado activo (borde brand + check) y hover.
 */
const PresetCard = ({ titulo, descripcion, icon: Icon, selected, onSelect }: PresetCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className="group relative rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
  >
    <Card
      className={`h-full transition-all ${
        selected
          ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-500/10"
          : "hover:border-brand-300 hover:shadow-sm dark:hover:border-brand-500/40"
      }`}
    >
      <div
        className={`mb-4 flex h-12 max-w-12 items-center justify-center rounded-[10.5px] transition-colors ${
          selected
            ? "bg-brand-500 text-white"
            : "bg-brand-50 text-brand-500 group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
        }`}
      >
        <Icon />
      </div>
      <CardTitle className="text-base">{titulo}</CardTitle>
      <CardDescription>{descripcion}</CardDescription>
    </Card>

    {selected && (
      <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
        <CheckIcon />
      </span>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const StepDots = ({ step }: { step: Step }) => (
  <div className="flex items-center gap-2">
    {([1, 2, 3, 4, 5, 6, 7] as Step[]).map((s) => (
      <span
        key={s}
        className={`h-2 rounded-full transition-all ${
          step === s ? "w-6 bg-brand-500" : "w-2 bg-gray-300 dark:bg-gray-700"
        }`}
      />
    ))}
  </div>
);

const modoLabel = (mode: AttentionMode) => (mode === "auto" ? "Automático" : "Manual");

/** Formatea una hora entera 0–24 como "08:00". */
const horaTxt = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Campo "label / valor" (apilado) para el resumen del negocio en la previsualización. */
const ResumenCampo = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
    <p className="truncate text-sm text-gray-800 dark:text-white/90">{value || "—"}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ConfiguracionTurnosPage — onboarding de configuración inicial del módulo de
 * Turnos (mock). Lo ve el administrador la primera vez que crea su módulo.
 *
 * Paso 1: información de la empresa (nombre + logo).
 * Paso 2: tipo de negocio → precarga filas sugeridas (preajuste).
 * Paso 3: revisar / personalizar filas (agregar o eliminar) y finalizar.
 *
 * Al finalizar, guarda la config del negocio + las filas en queuesStore y entra
 * al módulo de Turnos (dashboard).
 */
export const ConfiguracionTurnosPage = observer(() => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Paso 1
  const [nombre, setNombre] = useState(queuesStore.businessConfig.nombre);
  const [logoUrl, setLogoUrl] = useState(queuesStore.businessConfig.logoUrl);
  const [descripcion, setDescripcion] = useState(queuesStore.businessConfig.descripcion);
  const [telefono, setTelefono] = useState(queuesStore.businessConfig.telefono);
  const [email, setEmail] = useState(queuesStore.businessConfig.email);
  const [direccion, setDireccion] = useState(queuesStore.businessConfig.direccion);
  const [logoError, setLogoError] = useState("");

  // Paso 2
  const [tipo, setTipo] = useState<TipoNegocio | null>(
    queuesStore.businessConfig.configurado ? queuesStore.businessConfig.tipoNegocio : null,
  );

  // Paso 3 — modal de fila (crear/editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null = crear
  const [nfNombre, setNfNombre] = useState("");
  const [nfModo, setNfModo] = useState<AttentionMode>("auto");
  const [nfTiempo, setNfTiempo] = useState("15");
  const [nfPrefijo, setNfPrefijo] = useState("");
  const [nfUrgencia, setNfUrgencia] = useState("");
  const [nfBusy, setNfBusy] = useState("");
  const [nfFull, setNfFull] = useState("");
  const [modalKey, setModalKey] = useState(0); // fuerza reset del Select no controlado

  // Paso 4 — modal de nuevo operario
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [noNombre, setNoNombre] = useState("");
  const [noEmail, setNoEmail] = useState("");
  const [noTelefono, setNoTelefono] = useState("");
  // Filas (colas) asignadas al operario. Obligatorio: mínimo una.
  const [noColaIds, setNoColaIds] = useState<string[]>([]);

  const presets = queuesStore.presets;
  const presetSel = useMemo(() => (tipo ? queuesStore.getPreset(tipo) : undefined), [tipo]);

  // ── Subida de logo (data URL, mock sin backend) ──
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
    };
    reader.onerror = () => setLogoError("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  };

  // Datos de empresa reunidos para persistir.
  const datosEmpresa = () => ({
    nombre: nombre.trim(),
    logoUrl,
    descripcion: descripcion.trim(),
    telefono: telefono.trim(),
    email: email.trim(),
    direccion: direccion.trim(),
  });

  // ── Navegación entre pasos ──
  const goInfo = () => {
    if (!nombre.trim()) return;
    queuesStore.updateBusinessConfig(datosEmpresa());
    setStep(2);
  };

  const goHorario = () => {
    // Del horario al tipo de negocio. El horario ya se persiste al instante.
    setStep(3);
  };

  const goPreset = () => {
    if (!tipo) return;
    // Aplica el preset: reemplaza las filas por las precargadas del tipo elegido.
    queuesStore.aplicarPreset(tipo);
    setStep(4);
  };

  const goFilas = () => {
    // Del paso de filas al de reglas de turnos.
    setStep(5);
  };

  const goReglas = () => {
    // De reglas de turnos al paso de operarios.
    setStep(6);
  };

  const goOperarios = () => {
    // Del paso de operarios a la previsualización.
    setStep(7);
  };

  const finalizar = () => {
    queuesStore.guardarConfig({ ...datosEmpresa(), tipoNegocio: tipo ?? "otro" });
    navigate(sessionStore.moduloEntryPath);
  };

  const cancelar = () => {
    // Volver a la selección de módulo sin marcar configurado.
    navigate("/seleccionar");
  };

  // ── Modal nueva fila ──
  const abrirModal = () => {
    setEditId(null);
    setNfNombre("");
    setNfModo("auto");
    setNfTiempo("15");
    setNfPrefijo("");
    setNfUrgencia("");
    setNfBusy("");
    setNfFull("");
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const abrirEditar = (q: (typeof filas)[number]) => {
    setEditId(q.id);
    setNfNombre(q.nombre);
    setNfModo(q.mode);
    setNfTiempo(String(q.tiempoProm));
    setNfPrefijo(q.prefijo ?? "");
    setNfUrgencia(q.urgenciaMin != null ? String(q.urgenciaMin) : "");
    setNfBusy(q.saturacionBusy != null ? String(q.saturacionBusy) : "");
    setNfFull(q.saturacionFull != null ? String(q.saturacionFull) : "");
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  /** Convierte un input numérico opcional a number | undefined (vacío = usar global). */
  const numOpt = (v: string): number | undefined => {
    const n = Number(v);
    return v.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const guardarFila = () => {
    if (!nfNombre.trim()) return;
    const tiempo = Number(nfTiempo);
    const tiempoProm = Number.isFinite(tiempo) && tiempo > 0 ? tiempo : 15;
    const prefijo = nfPrefijo.trim() ? nfPrefijo.trim() : undefined;

    if (editId) {
      // Editar: null limpia el override cuando el campo queda vacío.
      queuesStore.updateQueue(editId, {
        nombre: nfNombre.trim(),
        mode: nfModo,
        tiempoProm,
        prefijo: prefijo ?? null,
        urgenciaMin: numOpt(nfUrgencia) ?? null,
        saturacionBusy: numOpt(nfBusy) ?? null,
        saturacionFull: numOpt(nfFull) ?? null,
      });
    } else {
      queuesStore.createQueue({
        nombre: nfNombre.trim(),
        servicio: "general",
        mode: nfModo,
        tiempoProm,
        prefijo,
        urgenciaMin: numOpt(nfUrgencia),
        saturacionBusy: numOpt(nfBusy),
        saturacionFull: numOpt(nfFull),
      });
    }
    setModalOpen(false);
  };

  // ── Modal nuevo operario ──
  const abrirOpModal = () => {
    setNoNombre("");
    setNoEmail("");
    setNoTelefono("");
    setNoColaIds([]);
    setOpModalOpen(true);
  };

  const toggleNoCola = (colaId: string) => {
    setNoColaIds((prev) =>
      prev.includes(colaId) ? prev.filter((id) => id !== colaId) : [...prev, colaId],
    );
  };

  const agregarOperario = () => {
    // Un operario de Turnos debe estar ligado a MÍNIMO una fila.
    if (!noNombre.trim() || noColaIds.length === 0) return;
    operadoresStore.crear("turnos", {
      nombre: noNombre.trim(),
      email: noEmail.trim(),
      telefono: noTelefono.trim(),
      colaIds: noColaIds,
    });
    setOpModalOpen(false);
  };

  /** Nombres de las filas asignadas a un operario (para mostrar en la lista). */
  const nombresFilasDe = (colaIds: string[]): string =>
    colaIds
      .map((id) => queuesStore.getQueue(id)?.nombre)
      .filter(Boolean)
      .join(", ");

  /** Filas (con color) asignadas a un operario, para mostrar como chips. */
  const filasDe = (colaIds: string[]) =>
    colaIds
      .map((id) => queuesStore.getQueue(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const filas = queuesStore.queues;
  const operarios = operadoresStore.porModulo("turnos");

  return (
    <>
      <PageMeta title="Configuración de Turnos" description="Configura tu módulo de Turnos para empezar" />

      <div className="relative min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
        <div className="fixed right-6 top-6 z-50">
          <ThemeToggleButton variant="floating" />
        </div>

        <div className={`mx-auto flex w-full flex-col ${step === 7 ? "max-w-5xl" : "max-w-3xl"}`}>
          {/* Marca + encabezado */}
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/images/logo/necto-icon.svg" alt="NECTO" className="mb-4 h-10 w-10" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {step === 1 && "Configura tu negocio"}
              {step === 2 && "Horario de atención"}
              {step === 3 && "¿Qué tipo de negocio es?"}
              {step === 4 && "Revisa tus filas"}
              {step === 5 && "Reglas de turnos"}
              {step === 6 && "Agrega tus operarios"}
              {step === 7 && "Revisa tu configuración"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && "Cuéntanos sobre tu negocio para personalizar tu módulo de Turnos."}
              {step === 2 && "Define los días y horas en que atiendes turnos. Podrás cambiarlo cuando quieras."}
              {step === 3 && "Elige un tipo para precargar filas sugeridas. Podrás ajustarlas en el siguiente paso."}
              {step === 4 && "Ajusta las filas precargadas, elimina las que no uses o agrega las tuyas. Al editar cada fila puedes definir su modo de atención, tiempo promedio y reglas propias: prefijo del turno, tiempo de urgencia y umbrales de saturación (ocupada/llena)."}
              {step === 5 && "Define cómo se numeran los turnos y cuándo una fila se considera saturada."}
              {step === 6 && "Suma a tu equipo para que atienda los turnos. Cada operario se liga a mínimo una fila. Este paso es opcional: puedes omitirlo."}
              {step === 7 && "Así quedará tu módulo de Turnos. Revisa que todo esté bien antes de confirmar."}
            </p>
          </div>

          {/* ── PASO 1: info empresa ── */}
          {step === 1 && (
            <>
              <Card>
                <div className="flex flex-col gap-5">
                  {/* Logo: subida como imagen (data URL) con preview */}
                  <div>
                    <Label htmlFor="logo">Logo del negocio</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
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
                              onClick={() => setLogoUrl("")}
                              className="text-sm font-medium text-gray-500 hover:text-error-500"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">PNG o JPG, hasta 1 MB.</p>
                      </div>
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={onLogoChange}
                        className="hidden"
                      />
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
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="descripcion">¿A qué se dedica tu negocio?</Label>
                    <Textarea
                      rows={2}
                      placeholder="Ej: Centro médico de atención general y laboratorio clínico."
                      value={descripcion}
                      onChange={setDescripcion}
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
                        onChange={(e) => setTelefono(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contacto@tunegocio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      placeholder="Calle 123 #45-67 (opcional)"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
              <div className="mt-8 flex items-center justify-between">
                <StepDots step={1} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={cancelar}>Cancelar</Button>
                  <Button size="sm" disabled={!nombre.trim()} onClick={goInfo}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 2: horario de atención ── */}
          {step === 2 && (
            <>
              <Card>
                <HorarioNegocio />
              </Card>
              <div className="mt-8 flex items-center justify-between">
                <StepDots step={2} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                  <Button size="sm" onClick={goHorario}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 3: tipo de negocio ── */}
          {step === 3 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {presets.map((p) => (
                  <PresetCard
                    key={p.tipo}
                    titulo={p.label}
                    descripcion={p.descripcion}
                    icon={TIPO_ICONS[p.tipo]}
                    selected={tipo === p.tipo}
                    onSelect={() => setTipo(p.tipo)}
                  />
                ))}
              </div>

              {presetSel && (
                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                  {presetSel.filas.length > 0
                    ? `Se precargarán ${presetSel.filas.length} fila${presetSel.filas.length === 1 ? "" : "s"}: ${presetSel.filas.map((f) => f.nombre).join(", ")}.`
                    : "Empezarás sin filas: podrás crearlas a tu medida en el siguiente paso."}
                </p>
              )}

              <div className="mt-8 flex items-center justify-between">
                <StepDots step={3} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(2)}>Atrás</Button>
                  <Button size="sm" disabled={!tipo} onClick={goPreset}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 4: revisar / personalizar filas ── */}
          {step === 4 && (
            <>
              <Card>
                <div className="flex flex-col gap-3">
                  {filas.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aún no tienes filas. Agrega la primera para empezar.
                    </p>
                  )}

                  {filas.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${f.color}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                              {f.nombre}
                            </p>
                            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                              {queuesStore.prefijoDe(f)}-001
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ~{f.tiempoProm} min · urgente ≥ {queuesStore.urgenciaDe(f)} min · llena ≥ {queuesStore.saturacionFullDe(f)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge size="sm" color={f.mode === "auto" ? "info" : "light"}>
                          {modoLabel(f.mode)}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => abrirEditar(f)}
                          aria-label={`Editar fila ${f.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => queuesStore.deleteQueue(f.id)}
                          aria-label={`Eliminar fila ${f.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={abrirModal}
                    className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
                  >
                    <PlusIcon />
                    Agregar fila
                  </button>
                </div>
              </Card>

              <div className="mt-8 flex items-center justify-between">
                <StepDots step={4} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(3)}>Atrás</Button>
                  <Button size="sm" onClick={goFilas}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 5: reglas de turnos ── */}
          {step === 5 && (
            <>
              <Card>
                <ReglasTurnos />
              </Card>
              <div className="mt-8 flex items-center justify-between">
                <StepDots step={5} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(4)}>Atrás</Button>
                  <Button size="sm" onClick={goReglas}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 6: operarios (opcional) ── */}
          {step === 6 && (
            <>
              <Card>
                <div className="flex flex-col gap-3">
                  {operarios.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aún no tienes operarios. Puedes agregarlos ahora o hacerlo más tarde.
                    </p>
                  )}

                  {operarios.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                          {o.nombre.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                            {o.nombre}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {o.email || o.telefono || "Sin datos de contacto"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                            Filas: {nombresFilasDe(o.colaIds) || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge size="sm" color="light">
                          {o.colaIds.length} fila{o.colaIds.length === 1 ? "" : "s"}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => operadoresStore.eliminar(o.id)}
                          aria-label={`Eliminar operario ${o.nombre}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={abrirOpModal}
                    className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
                  >
                    <PlusIcon />
                    Agregar operario
                  </button>
                </div>
              </Card>

              <div className="mt-8 flex items-center justify-between">
                <StepDots step={6} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(5)}>Atrás</Button>
                  <Button size="sm" variant="ghost" onClick={goOperarios}>Omitir</Button>
                  <Button size="sm" onClick={goOperarios}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 7: previsualización (amplia, tipo dashboard) ── */}
          {step === 7 && (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ── Negocio (ocupa ambas columnas) ── */}
                <Card className="lg:col-span-2">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                          {nombre.trim() || "Sin nombre"}
                        </h2>
                        {presetSel && <Badge size="sm" color="primary">{presetSel.label}</Badge>}
                      </div>
                      {descripcion.trim() && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{descripcion.trim()}</p>
                      )}
                      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-3">
                        <ResumenCampo label="Teléfono" value={telefono.trim()} />
                        <ResumenCampo label="Correo" value={email.trim()} />
                        <ResumenCampo label="Dirección" value={direccion.trim()} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* ── Horario ── */}
                <Card className="lg:col-span-2">
                  <CardTitle className="text-base">Horario de atención</CardTitle>
                  <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                    {queuesStore.horarioOrdenado.map((h) => {
                      const meta = DIAS_SEMANA.find((d) => d.dia === h.dia)!;
                      return (
                        <div key={h.dia} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{meta.corto}</span>
                          <span className={h.abierto ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-600"}>
                            {h.abierto ? `${horaTxt(h.desde)}–${horaTxt(h.hasta)}` : "Cerrado"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* ── Reglas de turnos ── */}
                <Card className="lg:col-span-2">
                  <CardTitle className="text-base">Reglas de turnos</CardTitle>
                  <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
                    <ResumenCampo
                      label="Prefijo"
                      value={
                        queuesStore.turnoRules.prefijoModo === "fijo"
                          ? `Fijo (${queuesStore.turnoRules.prefijoFijo || "T"}-045)`
                          : "Inicial de la fila"
                      }
                    />
                    <ResumenCampo
                      label="Reinicio diario"
                      value={queuesStore.turnoRules.reinicioDiario ? "Sí" : "No"}
                    />
                    <ResumenCampo label="Urgente desde" value={`${queuesStore.turnoRules.urgenciaMin} min`} />
                    <ResumenCampo
                      label="Saturación"
                      value={`Ocupada ≥ ${queuesStore.turnoRules.saturacionBusy} · Llena ≥ ${queuesStore.turnoRules.saturacionFull}`}
                    />
                  </div>
                </Card>

                {/* ── Filas ── */}
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <CardTitle className="text-base">Filas</CardTitle>
                    <Badge size="sm" color="light">
                      {filas.length} fila{filas.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {filas.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No configuraste filas.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filas.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`h-3 w-3 shrink-0 rounded-full ${f.color}`} />
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{f.nombre}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge size="sm" color={f.mode === "auto" ? "info" : "light"}>
                              {modoLabel(f.mode)}
                            </Badge>
                            <span className="text-xs text-gray-400 dark:text-gray-500">~{f.tiempoProm} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* ── Operarios ── */}
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <CardTitle className="text-base">Operarios</CardTitle>
                    <Badge size="sm" color="light">
                      {operarios.length} operario{operarios.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {operarios.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No agregaste operarios. Podrás hacerlo luego desde la sección Operadores.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {operarios.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                              {o.nombre.trim().charAt(0).toUpperCase() || "?"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{o.nombre}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {o.email || o.telefono || "Sin datos de contacto"}
                              </p>
                            </div>
                          </div>
                          {/* Chips con TODAS las filas del operario */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {filasDe(o.colaIds).map((f) => (
                              <span
                                key={f.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
                              >
                                <span className={`h-2 w-2 rounded-full ${f.color}`} />
                                {f.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <StepDots step={7} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(6)}>Atrás</Button>
                  <Button size="sm" onClick={finalizar}>Confirmar y entrar</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal: fila (crear / editar) ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editId ? "Editar fila" : "Nueva fila"}
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {editId
            ? "Ajusta los datos y las reglas propias de esta fila."
            : "Crea una fila a tu medida para tu módulo de Turnos."}
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="nf-nombre">
              Nombre de la fila <span className="text-error-500">*</span>
            </Label>
            <Input
              id="nf-nombre"
              placeholder="Ej: Caja rápida"
              value={nfNombre}
              onChange={(e) => setNfNombre(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nf-modo">Modo de atención</Label>
              <Select
                key={`modo-${modalKey}`}
                defaultValue={nfModo}
                onChange={(v) => setNfModo(v as AttentionMode)}
                options={[
                  { value: "auto", label: "Automático" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>
            <div>
              <Label htmlFor="nf-tiempo">Tiempo prom. (min)</Label>
              <Input
                id="nf-tiempo"
                type="number"
                min="1"
                value={nfTiempo}
                onChange={(e) => setNfTiempo(e.target.value)}
              />
            </div>
          </div>

          {/* Reglas propias de la fila (opcionales) */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="mb-1 text-sm font-medium text-gray-800 dark:text-white/90">Reglas de esta fila</p>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Opcional. Si lo dejas vacío, la fila usa la regla global del negocio.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="nf-prefijo">Prefijo del turno</Label>
                <Input
                  id="nf-prefijo"
                  placeholder="Ej: LAB (por defecto, la inicial)"
                  maxLength={4}
                  value={nfPrefijo}
                  onChange={(e) => setNfPrefijo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nf-urgencia">Urgente desde (min)</Label>
                <Input
                  id="nf-urgencia"
                  type="number"
                  min="1"
                  placeholder={`Global: ${queuesStore.turnoRules.urgenciaMin}`}
                  value={nfUrgencia}
                  onChange={(e) => setNfUrgencia(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nf-busy">Ocupada desde</Label>
                  <Input
                    id="nf-busy"
                    type="number"
                    min="1"
                    placeholder={`Global: ${queuesStore.turnoRules.saturacionBusy}`}
                    value={nfBusy}
                    onChange={(e) => setNfBusy(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nf-full">Llena desde</Label>
                  <Input
                    id="nf-full"
                    type="number"
                    min="2"
                    placeholder={`Global: ${queuesStore.turnoRules.saturacionFull}`}
                    value={nfFull}
                    onChange={(e) => setNfFull(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button size="sm" disabled={!nfNombre.trim()} onClick={guardarFila}>
            {editId ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </Modal>

      {/* ── Modal: nuevo operario ── */}
      <Modal isOpen={opModalOpen} onClose={() => setOpModalOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo operario</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Agrega a alguien de tu equipo para que ayude a atender los turnos.
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="no-nombre">
              Nombre <span className="text-error-500">*</span>
            </Label>
            <Input
              id="no-nombre"
              placeholder="Ej: Laura Gómez"
              value={noNombre}
              onChange={(e) => setNoNombre(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="no-email">Correo</Label>
            <Input
              id="no-email"
              type="email"
              placeholder="laura@tunegocio.com"
              value={noEmail}
              onChange={(e) => setNoEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="no-telefono">Teléfono</Label>
            <Input
              id="no-telefono"
              type="tel"
              placeholder="+57 300 123 4567"
              value={noTelefono}
              onChange={(e) => setNoTelefono(e.target.value)}
            />
          </div>

          {/* Filas asignadas — obligatorio mínimo una */}
          <div>
            <Label>
              Filas que puede atender <span className="text-error-500">*</span>
            </Label>
            <p className="mb-2 -mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Un operario debe estar ligado a mínimo una fila.
            </p>
            {filas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No hay filas todavía. Vuelve al paso anterior para crear al menos una.
              </p>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                {filas.map((f) => (
                  <label
                    key={f.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <Checkbox
                      checked={noColaIds.includes(f.id)}
                      onChange={() => toggleNoCola(f.id)}
                    />
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.color}`} />
                    <span className="text-sm text-gray-800 dark:text-white/90">{f.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpModalOpen(false)}>Cancelar</Button>
          <Button
            size="sm"
            disabled={!noNombre.trim() || noColaIds.length === 0}
            onClick={agregarOperario}
          >
            Agregar
          </Button>
        </div>
      </Modal>
    </>
  );
});

export default ConfiguracionTurnosPage;
