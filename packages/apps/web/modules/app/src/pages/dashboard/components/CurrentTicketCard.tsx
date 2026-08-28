import { Link } from "react-router";
import { Button } from "@/elements/ui/button";

interface CurrentTicketCardProps {
  onAction: (label: string) => void;
}

/**
 * CurrentTicketCard — Prominent card for the ticket currently being served.
 */
export const CurrentTicketCard = ({ onAction }: CurrentTicketCardProps) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-brand-500 p-6 text-white shadow-theme-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-white/70">
            Turno Actual
          </p>
          <p className="mt-1 text-xs text-white/60">Llamando ahora</p>
        </div>
        <span className="rounded-lg bg-white/15 px-3 py-1 text-sm font-medium">
          Caja 3
        </span>
      </div>

      <div className="my-4">
        <p className="text-5xl font-bold tracking-tight">A-042</p>
        <p className="mt-2 text-lg font-medium">Maria Gonzalez</p>
        <p className="text-sm text-white/75">Asesoria Comercial</p>
      </div>

      <div className="flex items-center justify-between border-t border-white/15 pt-4">
        <div className="text-sm text-white/75">
          <span className="text-white/60">Tiempo en atencion:</span>{" "}
          <span className="font-semibold text-white">05:12</span>
        </div>
        <Link to="/turnos" className="text-sm font-medium text-white underline-offset-2 hover:underline">
          Ver detalles
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => onAction("completar el turno A-042")}
          className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-white/90"
        >
          Completar
        </button>
        <button
          onClick={() => onAction("llamar el siguiente turno")}
          className="flex-1 rounded-lg border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Llamar siguiente
        </button>
      </div>
    </div>
  );
};

export default CurrentTicketCard;
