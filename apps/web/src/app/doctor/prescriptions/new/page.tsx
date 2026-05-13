'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { createPrescription } from '@/lib/api/prescriptions';
import type { ApiError } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ItemForm = {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
};

const emptyItem = (): ItemForm => ({
  name: '',
  dosage: '',
  quantity: '',
  instructions: '',
});

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [patientEmail, setPatientEmail] = useState('patient@test.com');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const prescription = await createPrescription({
        patientEmail,
        notes: notes || undefined,
        items: items.map((item) => ({
          name: item.name,
          dosage: item.dosage,
          quantity: Number(item.quantity),
          instructions: item.instructions,
        })),
      });
      toast.success('Prescripción creada correctamente.');
      router.push(`/doctor/prescriptions/${prescription.id}`);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message ?? 'No se pudo crear la prescripción.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Nueva prescripción"
      subtitle="Agrega ítems digitados manualmente para un paciente existente."
      actions={
        <Link href="/doctor/prescriptions">
          <Button variant="secondary">Volver</Button>
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="patientEmail">
              Correo del paciente <span aria-hidden="true">*</span>
            </label>
            <input
              id="patientEmail"
              type="email"
              value={patientEmail}
              onChange={(event) => setPatientEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </Card>

        {items.map((item, index) => (
          <Card key={`item-${index}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ítem {index + 1}</h3>
              {items.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  Quitar
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label>
                  Nombre <span aria-hidden="true">*</span>
                </label>
                <input
                  value={item.name}
                  onChange={(event) => updateItem(index, 'name', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label>
                  Dosis <span aria-hidden="true">*</span>
                </label>
                <input
                  value={item.dosage}
                  onChange={(event) => updateItem(index, 'dosage', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label>
                  Cantidad <span aria-hidden="true">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label>
                  Instrucciones <span aria-hidden="true">*</span>
                </label>
                <input
                  value={item.instructions}
                  onChange={(event) => updateItem(index, 'instructions', event.target.value)}
                  required
                />
              </div>
            </div>
          </Card>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setItems((current) => [...current, emptyItem()])}>
            Agregar ítem
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear prescripción'}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
