import Link from 'next/link';
import type { Prescription } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export function PrescriptionList({
  prescriptions,
  detailPath,
}: {
  prescriptions: Prescription[];
  detailPath: (id: string) => string;
}) {
  return (
    <div className="grid gap-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{prescription.code}</h2>
              <StatusBadge status={prescription.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Paciente: {prescription.patient.name} · Médico: {prescription.author.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Creada: {new Date(prescription.createdAt).toLocaleString('es-ES')}
            </p>
          </div>
          <Link
            href={detailPath(prescription.id)}
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Ver detalle
          </Link>
        </Card>
      ))}
    </div>
  );
}
