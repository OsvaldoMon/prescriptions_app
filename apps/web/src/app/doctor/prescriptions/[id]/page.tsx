'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPrescription } from '@/lib/api/prescriptions';
import type { ApiError, Prescription } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/state';
import { PrescriptionDetail } from '@/features/prescriptions/prescription-detail';

export default function DoctorPrescriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescription(params.id)
      .then(setPrescription)
      .catch((error: ApiError) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <AppShell
      title="Detalle de prescripción"
      actions={
        <Link href="/doctor/prescriptions">
          <Button variant="secondary">Volver</Button>
        </Link>
      }
    >
      {loading ? <LoadingState /> : null}
      {prescription ? <PrescriptionDetail prescription={prescription} /> : null}
    </AppShell>
  );
}
