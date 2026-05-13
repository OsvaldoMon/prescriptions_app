import { Inject, Injectable } from '@nestjs/common';
import { METRICS_REPOSITORY } from '../../../common/tokens/injection.tokens';
import type {
  AdminMetricsResponse,
  MetricsRepository,
} from '../domain/repositories/metrics.repository';
import { MetricsQueryDto } from '../dto/metrics-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(METRICS_REPOSITORY)
    private readonly metricsRepository: MetricsRepository,
  ) {}

  getMetrics(query: MetricsQueryDto): Promise<AdminMetricsResponse> {
    return this.metricsRepository.getMetrics({
      from: query.from,
      to: query.to,
    });
  }
}
