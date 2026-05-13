import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/state';
import { PatientPrescriptionsPage } from './patient-prescriptions-page';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Cargando prescripciones..." />}>
      <PatientPrescriptionsPage />
    </Suspense>
  );
}
