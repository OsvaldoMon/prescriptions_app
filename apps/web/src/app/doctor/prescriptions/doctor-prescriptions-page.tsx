'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { listDoctorPrescriptions } from '@/lib/api/prescriptions';
import type { ApiError, PaginatedResponse, Prescription } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingState } from '@/components/ui/state';
import { PaginationControls } from '@/components/ui/pagination';
import {
  PrescriptionFilters,
  usePrescriptionFilters,
} from '@/features/prescriptions/prescription-filters';
import { PrescriptionList } from '@/features/prescriptions/prescription-list';

export function DoctorPrescriptionsPage() {
  const [filters, setFilters] = usePrescriptionFilters();
  const [data, setData] = useState<PaginatedResponse<Prescription> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    listDoctorPrescriptions({
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
      .catch((error: ApiError) => {
        toast.error(error.message ?? 'No se pudieron cargar las prescripciones.');
      })
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
      subtitle="Gestiona las recetas emitidas a tus pacientes."
      actions={
        <Link href="/doctor/prescriptions/new">
          <Button>Nueva prescripción</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        <PrescriptionFilters />
        {loading ? <LoadingState /> : null}
        {!loading && data && data.data.length === 0 ? (
          <EmptyState
            title="Sin prescripciones"
            description="Aún no has creado recetas con los filtros actuales."
          />
        ) : null}
        {!loading && data && data.data.length > 0 ? (
          <>
            <PrescriptionList
              prescriptions={data.data}
              detailPath={(id) => `/doctor/prescriptions/${id}`}
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
