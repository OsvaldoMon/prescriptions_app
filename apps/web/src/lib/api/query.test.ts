import { describe, expect, it } from 'vitest';
import { buildQueryString } from '@/lib/api/query';

describe('buildQueryString', () => {
  it('serializa parámetros definidos y omite vacíos', () => {
    expect(
      buildQueryString({
        page: 2,
        status: 'pending',
        search: '',
        doctorId: undefined,
      }),
    ).toBe('?page=2&status=pending');
  });
});
