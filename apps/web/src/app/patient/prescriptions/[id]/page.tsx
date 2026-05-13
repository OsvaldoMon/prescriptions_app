'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  consumePrescription,
  downloadPrescriptionPdf,
  getPrescription,
} from '@/lib/api/prescriptions';
import type { ApiError, Prescription } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/state';
import { PrescriptionDetail } from '@/features/prescriptions/prescription-detail';

export default function PatientPrescriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getPrescription(params.id)
      .then(setPrescription)
      .catch((error: ApiError) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleConsume() {
    if (!prescription) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await consumePrescription(prescription.id);
      setPrescription(updated);
      toast.success('Prescripción marcada como consumida.');
    } catch (error) {
      toast.error((error as ApiError).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload() {
    if (!prescription) {
      return;
    }

    setActionLoading(true);
    try {
      const blob = await downloadPrescriptionPdf(prescription.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${prescription.code}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado.');
    } catch (error) {
      toast.error((error as ApiError).message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell
      title="Detalle de prescripción"
      actions={
        <Link href="/patient/prescriptions">
          <Button variant="secondary">Volver</Button>
        </Link>
      }
    >
      {loading ? <LoadingState /> : null}
      {prescription ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {prescription.status === 'pending' ? (
              <Button type="button" disabled={actionLoading} onClick={handleConsume}>
                Marcar consumida
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={handleDownload}
            >
              Descargar PDF
            </Button>
          </div>
          <PrescriptionDetail prescription={prescription} />
        </div>
      ) : null}
    </AppShell>
  );
}
