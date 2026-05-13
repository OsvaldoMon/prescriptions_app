'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { listPatientPrescriptions } from '@/lib/api/prescriptions';
import type { ApiError, PaginatedResponse, Prescription } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState, LoadingState } from '@/components/ui/state';
import { PaginationControls } from '@/components/ui/pagination';
import {
  PrescriptionFilters,
  usePrescriptionFilters,
} from '@/features/prescriptions/prescription-filters';
import { PrescriptionList } from '@/features/prescriptions/prescription-list';

export function PatientPrescriptionsPage() {
  const [filters, setFilters] = usePrescriptionFilters();
  const [data, setData] = useState<PaginatedResponse<Prescription> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    listPatientPrescriptions({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      search: filters.search || undefined,
      order: filters.order || undefined,
    })
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .catch((error: ApiError) => toast.error(error.message))
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filters]);

  return (
    <AppShell
      title="Mis prescripciones"
      subtitle="Consulta, consume y descarga tus recetas médicas."
    >
      <div className="space-y-4">
        <PrescriptionFilters />
        {loading ? <LoadingState /> : null}
        {!loading && data && data.data.length === 0 ? (
          <EmptyState
            title="Sin prescripciones"
            description="No tienes recetas con los filtros seleccionados."
          />
        ) : null}
        {!loading && data && data.data.length > 0 ? (
          <>
            <PrescriptionList
              prescriptions={data.data}
              detailPath={(id) => `/patient/prescriptions/${id}`}
            />
            <PaginationControls
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(page) => setFilters({ page })}
            />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
