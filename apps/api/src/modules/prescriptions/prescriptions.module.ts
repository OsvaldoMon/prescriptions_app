import { Module } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  PRESCRIPTION_PDF_STRATEGY,
  PRESCRIPTION_REPOSITORY,
} from '../../common/tokens/injection.tokens';
import { PrescriptionCodeGenerator } from './application/prescription-code.generator';
import { PrescriptionService } from './application/prescription.service';
import { PdfKitPrescriptionPdfStrategy } from './infrastructure/pdf/pdfkit-prescription-pdf.strategy';
import { PrismaAuditLogRepository } from './infrastructure/repositories/prisma-audit-log.repository';
import { PrismaPrescriptionRepository } from './infrastructure/repositories/prisma-prescription.repository';
import { PatientPrescriptionsController } from './patient-prescriptions.controller';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  controllers: [PrescriptionsController, PatientPrescriptionsController],
  providers: [
    PrescriptionService,
    PrescriptionCodeGenerator,
    {
      provide: PRESCRIPTION_REPOSITORY,
      useClass: PrismaPrescriptionRepository,
    },
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    {
      provide: PRESCRIPTION_PDF_STRATEGY,
      useClass: PdfKitPrescriptionPdfStrategy,
    },
  ],
  exports: [PrescriptionService],
})
export class PrescriptionsModule {}
