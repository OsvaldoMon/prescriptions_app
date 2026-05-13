import type { Prescription } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export function PrescriptionDetail({ prescription }: { prescription: Prescription }) {
  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{prescription.code}</h2>
          <StatusBadge status={prescription.status} />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>Paciente: {prescription.patient.name} ({prescription.patient.email})</p>
          <p>
            Médico: {prescription.author.name}
            {prescription.author.specialty ? ` · ${prescription.author.specialty}` : ''}
          </p>
          <p>Creada: {new Date(prescription.createdAt).toLocaleString('es-ES')}</p>
          {prescription.consumedAt ? (
            <p>Consumida: {new Date(prescription.consumedAt).toLocaleString('es-ES')}</p>
          ) : null}
          {prescription.notes ? <p>Notas: {prescription.notes}</p> : null}
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold">Ítems</h3>
        <div className="mt-4 space-y-3">
          {prescription.items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium">
                {index + 1}. {item.name}
              </p>
              {item.dosage ? <p className="text-sm">Dosis: {item.dosage}</p> : null}
              {item.quantity ? <p className="text-sm">Cantidad: {item.quantity}</p> : null}
              {item.instructions ? (
                <p className="text-sm">Instrucciones: {item.instructions}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
