import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/state';
import { DoctorPrescriptionsPage } from './doctor-prescriptions-page';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Cargando prescripciones..." />}>
      <DoctorPrescriptionsPage />
    </Suspense>
  );
}
