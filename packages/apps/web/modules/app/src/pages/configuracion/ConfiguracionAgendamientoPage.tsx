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
import { Modal } from "@/elements/ui/modal";
import { Badge } from "@/elements/ui/badge";
import { ThemeToggleButton } from "@/shell";
import { HorarioNegocio } from "@/pages/configuracion/HorarioNegocio";
import { ReglasCitas } from "@/pages/configuracion/ReglasCitas";
import {
  agendaStore,
  operadoresStore,
  queuesStore,
  sessionStore,
  type TipoNegocioAgenda,
  type Profesional,
} from "@/stores";

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const ClinicaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6M4.5 21h15a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0019.5 4.5h-15A1.5 1.5 0 003 6v13.5A1.5 1.5 0 004.5 21z" />
  </svg>
);
const EsteticaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);
const ConsultoriaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
  </svg>
);
const EducacionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
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
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
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

const TIPO_ICONS: Record<TipoNegocioAgenda, () => ReactNode> = {
  clinica: ClinicaIcon,
  estetica: EsteticaIcon,
  consultoria: ConsultoriaIcon,
  educacion: EducacionIcon,
  otro: OtroIcon,
};

// Opciones de días (Lun→Dom) y horas para el editor de disponibilidad.
const DIA_OPTS = [
  { d: 1, label: "Lun" }, { d: 2, label: "Mar" }, { d: 3, label: "Mié" },
  { d: 4, label: "Jue" }, { d: 5, label: "Vie" }, { d: 6, label: "Sáb" }, { d: 0, label: "Dom" },
];
const DIA_ABBR: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
const DIA_ORDER = [1, 2, 3, 4, 5, 6, 0];
const HORA_OPTS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

// ═══════════════════════════════════════════════════════════════════════════
// PRESET CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PresetCardProps {
  titulo: string;
  descripcion: string;
  icon: () => ReactNode;
  selected: boolean;
  onSelect: () => void;
}

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
          selected ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-500 group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
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
      <span key={s} className={`h-2 rounded-full transition-all ${step === s ? "w-6 bg-brand-500" : "w-2 bg-gray-300 dark:bg-gray-700"}`} />
    ))}
  </div>
);

const ResumenCampo = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
    <p className="truncate text-sm text-gray-800 dark:text-white/90">{value || "—"}</p>
  </div>
);

/** Resumen legible de la disponibilidad de un profesional. */
const dispTexto = (p: Profesional) => {
  const dias = DIA_ORDER.filter((d) => p.config.diasLaborales.includes(d)).map((d) => DIA_ABBR[d]).join(", ");
  return `${dias || "sin días"} · ${String(p.config.horaInicio).padStart(2, "0")}:00–${String(p.config.horaFin).padStart(2, "0")}:00 · ${p.config.duracionSlot} min`;
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ConfiguracionAgendamientoPage — onboarding de configuración inicial del módulo
 * de Agendamiento (mock). Mismo flujo que Turnos, adaptado a citas:
 * 1 Negocio · 2 Horario · 3 Tipo (preset de profesionales) · 4 Profesionales ·
 * 5 Reglas de citas · 6 Operarios (opcional) · 7 Previsualización.
 *
 * Los datos del negocio y el horario se comparten con Turnos (queuesStore).
 */
export const ConfiguracionAgendamientoPage = observer(() => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Paso 1 — datos del negocio (compartidos con Turnos)
  const [nombre, setNombre] = useState(queuesStore.businessConfig.nombre);
  const [logoUrl, setLogoUrl] = useState(queuesStore.businessConfig.logoUrl);
  const [descripcion, setDescripcion] = useState(queuesStore.businessConfig.descripcion);
  const [telefono, setTelefono] = useState(queuesStore.businessConfig.telefono);
  const [email, setEmail] = useState(queuesStore.businessConfig.email);
  const [direccion, setDireccion] = useState(queuesStore.businessConfig.direccion);
  const [logoError, setLogoError] = useState("");

  // Paso 3 — tipo de negocio
  const [tipo, setTipo] = useState<TipoNegocioAgenda | null>(
    agendaStore.agendamientoConfigurado ? agendaStore.tipoNegocio : null,
  );

  // Paso 4 — modal de profesional (crear/editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pNombre, setPNombre] = useState("");
  const [pEspecialidad, setPEspecialidad] = useState("");
  const [pDias, setPDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pInicio, setPInicio] = useState(9);
  const [pFin, setPFin] = useState(18);
  const [pDur, setPDur] = useState(60);
  const [modalKey, setModalKey] = useState(0);

  // Paso 6 — modal de operario
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [noNombre, setNoNombre] = useState("");
  const [noEmail, setNoEmail] = useState("");
  const [noTelefono, setNoTelefono] = useState("");
  const [noProfIds, setNoProfIds] = useState<string[]>([]);

  const presets = agendaStore.presets;
  const presetSel = useMemo(() => (tipo ? agendaStore.getPreset(tipo) : undefined), [tipo]);

  const profesionales = agendaStore.profesionales;
  const operarios = operadoresStore.porModulo("agendamiento");

  // ── Logo (data URL, mock) ──
  const MAX_LOGO_BYTES = 1024 * 1024;
  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setLogoError("El archivo debe ser una imagen."); return; }
    if (file.size > MAX_LOGO_BYTES) { setLogoError("La imagen supera 1 MB. Elige una más liviana."); return; }
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(typeof reader.result === "string" ? reader.result : ""); setLogoError(""); };
    reader.onerror = () => setLogoError("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  };

  const datosEmpresa = () => ({
    nombre: nombre.trim(), logoUrl, descripcion: descripcion.trim(),
    telefono: telefono.trim(), email: email.trim(), direccion: direccion.trim(),
  });

  // ── Navegación ──
  const goInfo = () => {
    if (!nombre.trim()) return;
    queuesStore.updateBusinessConfig(datosEmpresa());
    setStep(2);
  };
  const goHorario = () => setStep(3);
  const goPreset = () => {
    if (!tipo) return;
    agendaStore.aplicarPreset(tipo);
    setStep(4);
  };
  const goProfesionales = () => setStep(5);
  const goReglas = () => setStep(6);
  const goOperarios = () => setStep(7);

  const finalizar = () => {
    queuesStore.updateBusinessConfig(datosEmpresa());
    agendaStore.guardarConfig(tipo ?? "otro");
    navigate("/agendamiento/inicio");
  };
  const cancelar = () => navigate("/seleccionar");

  // ── Modal profesional ──
  const abrirCrearProf = () => {
    setEditId(null); setPNombre(""); setPEspecialidad("");
    setPDias([1, 2, 3, 4, 5]); setPInicio(9); setPFin(18); setPDur(60);
    setModalKey((k) => k + 1); setModalOpen(true);
  };
  const abrirEditarProf = (p: Profesional) => {
    setEditId(p.id); setPNombre(p.nombre); setPEspecialidad(p.especialidad);
    setPDias([...p.config.diasLaborales]); setPInicio(p.config.horaInicio);
    setPFin(p.config.horaFin); setPDur(p.config.duracionSlot);
    setModalKey((k) => k + 1); setModalOpen(true);
  };
  const toggleDia = (d: number) => setPDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const guardarProf = () => {
    if (!pNombre.trim() || pDias.length === 0) return;
    const inicio = pInicio;
    const fin = pFin > inicio ? pFin : Math.min(inicio + 1, 24);
    const config = { diasLaborales: [...pDias], horaInicio: inicio, horaFin: fin, duracionSlot: pDur };
    if (editId) {
      agendaStore.updateProfesional(editId, { nombre: pNombre.trim(), especialidad: pEspecialidad.trim() });
      agendaStore.updateProfesionalConfig(editId, config);
    } else {
      const prof = agendaStore.crearProfesional({ nombre: pNombre.trim(), especialidad: pEspecialidad.trim() });
      agendaStore.updateProfesionalConfig(prof.id, config);
    }
    setModalOpen(false);
  };

  // ── Modal operario ──
  const abrirOpModal = () => {
    setNoNombre(""); setNoEmail(""); setNoTelefono(""); setNoProfIds([]); setOpModalOpen(true);
  };
  const toggleNoProf = (id: string) =>
    setNoProfIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const agregarOperario = () => {
    if (!noNombre.trim() || noProfIds.length === 0) return;
    operadoresStore.crear("agendamiento", {
      nombre: noNombre.trim(), email: noEmail.trim(), telefono: noTelefono.trim(), profesionalIds: noProfIds,
    });
    setOpModalOpen(false);
  };
  const nombresProfDe = (ids: string[]) =>
    ids.map((id) => agendaStore.getProfesional(id)?.nombre).filter(Boolean).join(", ");

  return (
    <>
      <PageMeta title="Configuración de Agendamiento" description="Configura tu módulo de Agendamiento para empezar" />

      <div className="relative min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
        <div className="fixed right-6 top-6 z-50">
          <ThemeToggleButton variant="floating" />
        </div>

        <div className={`mx-auto flex w-full flex-col ${step === 7 ? "max-w-5xl" : "max-w-3xl"}`}>
          {/* Encabezado */}
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/images/logo/necto-icon.svg" alt="NECTO" className="mb-4 h-10 w-10" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {step === 1 && "Configura tu negocio"}
              {step === 2 && "Horario de atención"}
              {step === 3 && "¿Qué tipo de negocio es?"}
              {step === 4 && "Tus profesionales"}
              {step === 5 && "Reglas de las citas"}
              {step === 6 && "Agrega tus operarios"}
              {step === 7 && "Revisa tu configuración"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && "Cuéntanos sobre tu negocio para personalizar tu módulo de Agendamiento."}
              {step === 2 && "Define los días y horas en que atiendes. Podrás cambiarlo cuando quieras."}
              {step === 3 && "Elige un tipo para precargar profesionales sugeridos. Podrás ajustarlos en el siguiente paso."}
              {step === 4 && "Revisa los profesionales precargados, edita su disponibilidad o agrega los tuyos."}
              {step === 5 && "Define la duración, modalidad y recordatorios por defecto de las citas."}
              {step === 6 && "Suma a tu equipo para gestionar la agenda. Cada operario se liga a mínimo un profesional. Este paso es opcional."}
              {step === 7 && "Así quedará tu módulo de Agendamiento. Revisa que todo esté bien antes de confirmar."}
            </p>
          </div>

          {/* ── PASO 1: negocio ── */}
          {step === 1 && (
            <>
              <Card>
                <div className="flex flex-col gap-5">
                  <div>
                    <Label htmlFor="logo">Logo del negocio</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <ImageIcon />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor="logo" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]">
                            <UploadIcon />
                            {logoUrl ? "Cambiar imagen" : "Subir imagen"}
                          </label>
                          {logoUrl && (
                            <button type="button" onClick={() => setLogoUrl("")} className="text-sm font-medium text-gray-500 hover:text-error-500">Quitar</button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">PNG o JPG, hasta 1 MB.</p>
                      </div>
                      <input id="logo" type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                    </div>
                    {logoError && <p className="mt-1.5 text-xs text-error-500">{logoError}</p>}
                  </div>

                  <div>
                    <Label htmlFor="nombre">Nombre del negocio <span className="text-error-500">*</span></Label>
                    <Input id="nombre" placeholder="Ej: Centro Bienestar Norte" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">¿A qué se dedica tu negocio?</Label>
                    <Input id="descripcion" placeholder="Ej: Centro de psicología y nutrición" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input id="telefono" type="tel" placeholder="+57 300 123 4567" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo</Label>
                      <Input id="email" type="email" placeholder="contacto@tunegocio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input id="direccion" placeholder="Calle 123 #45-67 (opcional)" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
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

          {/* ── PASO 2: horario ── */}
          {step === 2 && (
            <>
              <Card><HorarioNegocio /></Card>
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
                  <PresetCard key={p.tipo} titulo={p.label} descripcion={p.descripcion} icon={TIPO_ICONS[p.tipo]} selected={tipo === p.tipo} onSelect={() => setTipo(p.tipo)} />
                ))}
              </div>
              {presetSel && (
                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                  {presetSel.profesionales.length > 0
                    ? `Se precargarán ${presetSel.profesionales.length} profesional${presetSel.profesionales.length === 1 ? "" : "es"}: ${presetSel.profesionales.map((x) => x.nombre).join(", ")}.`
                    : "Empezarás sin profesionales: podrás crearlos en el siguiente paso."}
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

          {/* ── PASO 4: profesionales ── */}
          {step === 4 && (
            <>
              <Card>
                <div className="flex flex-col gap-3">
                  {profesionales.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Aún no tienes profesionales. Agrega el primero para empezar.</p>
                  )}
                  {profesionales.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.color} text-xs font-bold text-white`}>{p.avatar}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{p.nombre}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.especialidad} · {dispTexto(p)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => abrirEditarProf(p)} aria-label={`Editar ${p.nombre}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"><EditIcon /></button>
                        <button type="button" onClick={() => agendaStore.deleteProfesional(p.id)} aria-label={`Eliminar ${p.nombre}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"><TrashIcon /></button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={abrirCrearProf} className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400">
                    <PlusIcon /> Agregar profesional
                  </button>
                </div>
              </Card>
              <div className="mt-8 flex items-center justify-between">
                <StepDots step={4} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(3)}>Atrás</Button>
                  <Button size="sm" onClick={goProfesionales}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 5: reglas de citas ── */}
          {step === 5 && (
            <>
              <Card><ReglasCitas /></Card>
              <div className="mt-8 flex items-center justify-between">
                <StepDots step={5} />
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setStep(4)}>Atrás</Button>
                  <Button size="sm" onClick={goReglas}>Siguiente</Button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 6: operarios ── */}
          {step === 6 && (
            <>
              <Card>
                <div className="flex flex-col gap-3">
                  {operarios.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Aún no tienes operarios. Puedes agregarlos ahora o más tarde.</p>
                  )}
                  {operarios.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">{o.nombre.trim().charAt(0).toUpperCase() || "?"}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{o.nombre}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{o.email || o.telefono || "Sin datos de contacto"}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">Profesionales: {nombresProfDe(o.profesionalIds) || "—"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge size="sm" color="light">{o.profesionalIds.length} prof.</Badge>
                        <button type="button" onClick={() => operadoresStore.eliminar(o.id)} aria-label={`Eliminar operario ${o.nombre}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"><TrashIcon /></button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={abrirOpModal} className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400">
                    <PlusIcon /> Agregar operario
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

          {/* ── PASO 7: previsualización ── */}
          {step === 7 && (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Negocio */}
                <Card className="lg:col-span-2">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <ImageIcon />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{nombre.trim() || "Sin nombre"}</h2>
                        {presetSel && <Badge size="sm" color="primary">{presetSel.label}</Badge>}
                      </div>
                      {descripcion.trim() && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{descripcion.trim()}</p>}
                      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-3">
                        <ResumenCampo label="Teléfono" value={telefono.trim()} />
                        <ResumenCampo label="Correo" value={email.trim()} />
                        <ResumenCampo label="Dirección" value={direccion.trim()} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Reglas de citas */}
                <Card className="lg:col-span-2">
                  <CardTitle className="text-base">Reglas de citas</CardTitle>
                  <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
                    <ResumenCampo label="Duración" value={`${agendaStore.agendaRules.duracionDefault} min`} />
                    <ResumenCampo label="Modalidad" value={agendaStore.agendaRules.modalidadDefault === "virtual" ? "Virtual" : "Presencial"} />
                    <ResumenCampo label="Recordatorio" value={agendaStore.agendaRules.recordatorioHoras > 0 ? `${agendaStore.agendaRules.recordatorioHoras} h antes` : "Sin recordatorio"} />
                    <ResumenCampo label="Cancelar por WhatsApp" value={agendaStore.agendaRules.permitirCancelarWhatsApp ? "Sí" : "No"} />
                  </div>
                </Card>

                {/* Profesionales */}
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <CardTitle className="text-base">Profesionales</CardTitle>
                    <Badge size="sm" color="light">{profesionales.length}</Badge>
                  </div>
                  {profesionales.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No configuraste profesionales.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {profesionales.map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${p.color} text-[10px] font-bold text-white`}>{p.avatar}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-800 dark:text-white/90">{p.nombre}</p>
                            <p className="truncate text-xs text-gray-400 dark:text-gray-500">{p.especialidad} · {dispTexto(p)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Operarios */}
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <CardTitle className="text-base">Operarios</CardTitle>
                    <Badge size="sm" color="light">{operarios.length}</Badge>
                  </div>
                  {operarios.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No agregaste operarios. Podrás hacerlo luego desde Operadores.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {operarios.map((o) => (
                        <div key={o.id} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">{o.nombre.trim().charAt(0).toUpperCase() || "?"}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-800 dark:text-white/90">{o.nombre}</p>
                            <p className="truncate text-xs text-gray-400 dark:text-gray-500">Prof.: {nombresProfDe(o.profesionalIds) || "—"}</p>
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

      {/* ── Modal: profesional (crear/editar) ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">{editId ? "Editar profesional" : "Nuevo profesional"}</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Define sus datos y su disponibilidad de atención.</p>
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="p-nombre">Nombre <span className="text-error-500">*</span></Label>
            <Input id="p-nombre" placeholder="Ej: Dra. Ana Gómez" value={pNombre} onChange={(e) => setPNombre(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p-esp">Especialidad</Label>
            <Input id="p-esp" placeholder="Ej: Psicología" value={pEspecialidad} onChange={(e) => setPEspecialidad(e.target.value)} />
          </div>
          <div>
            <Label>Días de atención <span className="text-error-500">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {DIA_OPTS.map((d) => (
                <button
                  key={d.d}
                  type="button"
                  onClick={() => toggleDia(d.d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    pDias.includes(d.d) ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="p-ini">Desde</Label>
              <Select key={`ini-${modalKey}`} defaultValue={String(pInicio)} options={HORA_OPTS} onChange={(v) => setPInicio(Number(v))} />
            </div>
            <div>
              <Label htmlFor="p-fin">Hasta</Label>
              <Select key={`fin-${modalKey}`} defaultValue={String(pFin)} options={HORA_OPTS} onChange={(v) => setPFin(Number(v))} />
            </div>
            <div>
              <Label htmlFor="p-dur">Bloque</Label>
              <Select key={`dur-${modalKey}`} defaultValue={String(pDur)} options={[{ value: "30", label: "30 min" }, { value: "60", label: "60 min" }]} onChange={(v) => setPDur(Number(v))} />
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button size="sm" disabled={!pNombre.trim() || pDias.length === 0} onClick={guardarProf}>{editId ? "Guardar" : "Agregar"}</Button>
        </div>
      </Modal>

      {/* ── Modal: operario ── */}
      <Modal isOpen={opModalOpen} onClose={() => setOpModalOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo operario</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Agrega a alguien de tu equipo para gestionar la agenda.</p>
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="no-nombre">Nombre <span className="text-error-500">*</span></Label>
            <Input id="no-nombre" placeholder="Ej: Sofía Márquez" value={noNombre} onChange={(e) => setNoNombre(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="no-email">Correo</Label>
            <Input id="no-email" type="email" placeholder="sofia@tunegocio.com" value={noEmail} onChange={(e) => setNoEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="no-telefono">Teléfono</Label>
            <Input id="no-telefono" type="tel" placeholder="+57 300 123 4567" value={noTelefono} onChange={(e) => setNoTelefono(e.target.value)} />
          </div>
          <div>
            <Label>Profesionales que gestiona <span className="text-error-500">*</span></Label>
            <p className="mb-2 -mt-0.5 text-xs text-gray-500 dark:text-gray-400">Un operario debe estar ligado a mínimo un profesional.</p>
            {profesionales.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">No hay profesionales todavía. Vuelve al paso anterior para crear al menos uno.</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                {profesionales.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <Checkbox checked={noProfIds.includes(p.id)} onChange={() => toggleNoProf(p.id)} />
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.color}`} />
                    <span className="text-sm text-gray-800 dark:text-white/90">{p.nombre} · {p.especialidad}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpModalOpen(false)}>Cancelar</Button>
          <Button size="sm" disabled={!noNombre.trim() || noProfIds.length === 0} onClick={agregarOperario}>Agregar</Button>
        </div>
      </Modal>
    </>
  );
});

export default ConfiguracionAgendamientoPage;
