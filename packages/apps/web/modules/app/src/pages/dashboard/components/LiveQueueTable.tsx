import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import { Badge } from "@/elements/ui/badge";
import { ShellDropdown, ShellDropdownItem } from "@/shell/header/ShellDropdown";

interface LiveQueueTableProps {
  onAction: (label: string) => void;
}

type Status = "Llamando" | "Esperando" | "Atendido";

interface Ticket {
  turno: string;
  cliente: string;
  servicio: string;
  tiempo: string;
  estado: Status;
}

const tickets: Ticket[] = [
  { turno: "A-042", cliente: "Maria Gonzalez", servicio: "Asesoria Comercial", tiempo: "05:12", estado: "Llamando" },
  { turno: "B-108", cliente: "Carlos Mendoza", servicio: "Soporte Tecnico", tiempo: "12:45", estado: "Esperando" },
  { turno: "A-043", cliente: "Ana Silva", servicio: "Asesoria Comercial", tiempo: "15:30", estado: "Esperando" },
  { turno: "C-012", cliente: "Juan Perez", servicio: "Retiros", tiempo: "02:10", estado: "Atendido" },
];

const statusColor: Record<Status, "warning" | "info" | "success"> = {
  Llamando: "warning",
  Esperando: "info",
  Atendido: "success",
};

const WhatsAppBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.1-.3.2-.5 0-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3z" />
    </svg>
    WhatsApp
  </span>
);

const RowActions = ({ onAction, turno }: { onAction: (l: string) => void; turno: string }) => {
  const [open, setOpen] = useState(false);
  const item = "block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="dropdown-toggle flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      <ShellDropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className="absolute right-0 z-40 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
      >
        <ShellDropdownItem className={item} onItemClick={() => setOpen(false)} onClick={() => onAction(`ver detalle de ${turno}`)}>Ver detalle</ShellDropdownItem>
        <ShellDropdownItem className={item} onItemClick={() => setOpen(false)} onClick={() => onAction(`llamar ${turno}`)}>Llamar</ShellDropdownItem>
        <ShellDropdownItem className={item} onItemClick={() => setOpen(false)} onClick={() => onAction(`marcar atendido ${turno}`)}>Marcar atendido</ShellDropdownItem>
        <ShellDropdownItem className={`${item} text-error-500`} onItemClick={() => setOpen(false)} onClick={() => onAction(`cancelar turno ${turno}`)}>Cancelar turno</ShellDropdownItem>
      </ShellDropdown>
    </div>
  );
};

/**
 * LiveQueueTable — Live queue of upcoming tickets with row actions.
 */
export const LiveQueueTable = ({ onAction }: LiveQueueTableProps) => {
  const headers = ["Turno", "Cliente", "Servicio", "Tiempo", "Estado", "Canal", ""];
  return (
    <div className="rounded-2xl bg-white p-5 shadow-theme-sm dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cola en Vivo</h3>
        <button
          onClick={() => onAction("actualizar la cola")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Actualizar
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {headers.map((h, i) => (
                <TableCell key={i} header className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {tickets.map((t) => (
              <TableRow key={t.turno}>
                <TableCell className="px-4 py-4 text-theme-sm font-bold text-brand-600 dark:text-brand-400">{t.turno}</TableCell>
                <TableCell className="px-4 py-4 text-theme-sm text-gray-800 dark:text-white/90">{t.cliente}</TableCell>
                <TableCell className="px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">{t.servicio}</TableCell>
                <TableCell className="px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">{t.tiempo}</TableCell>
                <TableCell className="px-4 py-4">
                  <Badge color={statusColor[t.estado]} size="sm">{t.estado}</Badge>
                </TableCell>
                <TableCell className="px-4 py-4"><WhatsAppBadge /></TableCell>
                <TableCell className="px-4 py-4"><RowActions onAction={onAction} turno={t.turno} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LiveQueueTable;
