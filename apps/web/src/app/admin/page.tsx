'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAdminMetrics } from '@/lib/api/admin';
import type { AdminMetrics, ApiError } from '@/lib/types';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/state';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMetrics({})
      .then(setMetrics)
      .catch((error: ApiError) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      title="Panel administrativo"
      subtitle="Métricas globales del sistema de prescripciones."
    >
      {loading ? <LoadingState /> : null}
      {metrics ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Médicos" value={metrics.totals.doctors} />
            <MetricCard label="Pacientes" value={metrics.totals.patients} />
            <MetricCard label="Prescripciones" value={metrics.totals.prescriptions} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">Prescripciones por estado</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Pendientes', total: metrics.byStatus.pending },
                      { name: 'Consumidas', total: metrics.byStatus.consumed },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold">Prescripciones por día</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.byDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold">Top médicos por volumen</h3>
            <div className="mt-4 space-y-2">
              {metrics.topDoctors.map((doctor) => (
                <div
                  key={doctor.doctorId}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <span>{doctor.doctorName}</span>
                  <span className="font-medium">{doctor.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Card>
  );
}
