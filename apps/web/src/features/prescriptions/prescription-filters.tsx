'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';

export function PrescriptionFilters({
  showSearch = true,
}: {
  showSearch?: boolean;
}) {
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(''),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    order: parseAsString.withDefault('createdAt:desc'),
  });

  return (
    <form
      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        setFilters({ page: 1 });
      }}
    >
      <div className="space-y-2">
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          value={filters.status}
          onChange={(event) =>
            setFilters({ status: event.target.value, page: 1 })
          }
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="consumed">Consumida</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="from">Desde</label>
        <input
          id="from"
          type="date"
          value={filters.from}
          onChange={(event) => setFilters({ from: event.target.value, page: 1 })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="to">Hasta</label>
        <input
          id="to"
          type="date"
          value={filters.to}
          onChange={(event) => setFilters({ to: event.target.value, page: 1 })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="order">Orden</label>
        <select
          id="order"
          value={filters.order}
          onChange={(event) => setFilters({ order: event.target.value, page: 1 })}
        >
          <option value="createdAt:desc">Más recientes</option>
          <option value="createdAt:asc">Más antiguas</option>
          <option value="consumedAt:desc">Consumidas recientes</option>
        </select>
      </div>
      {showSearch ? (
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="search">Búsqueda</label>
          <input
            id="search"
            placeholder="Código, notas o nombre de ítem"
            value={filters.search}
            onChange={(event) =>
              setFilters({ search: event.target.value, page: 1 })
            }
          />
        </div>
      ) : null}
      <div className="flex items-end">
        <Button type="submit" variant="secondary" className="w-full">
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}

export function usePrescriptionFilters() {
  return useQueryStates({
    status: parseAsString.withDefault(''),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    order: parseAsString.withDefault('createdAt:desc'),
  });
}
