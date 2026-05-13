import { Module } from '@nestjs/common';
import { METRICS_REPOSITORY } from '../../common/tokens/injection.tokens';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { AdminController } from './admin.controller';
import { AdminService } from './application/admin.service';
import { PrismaMetricsRepository } from './infrastructure/repositories/prisma-metrics.repository';

@Module({
  imports: [PrescriptionsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: METRICS_REPOSITORY,
      useClass: PrismaMetricsRepository,
    },
  ],
})
export class AdminModule {}
