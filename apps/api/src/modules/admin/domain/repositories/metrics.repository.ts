export interface AdminMetricsResponse {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: Array<{
    date: string;
    count: number;
  }>;
  topDoctors: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
}

export interface MetricsFilters {
  from?: Date;
  to?: Date;
}

export interface MetricsRepository {
  getMetrics(filters: MetricsFilters): Promise<AdminMetricsResponse>;
}
