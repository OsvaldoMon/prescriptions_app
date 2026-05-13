import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrescriptionService } from './application/prescription.service';
import { PrescriptionListQueryDto } from './dto/prescription.dto';

@Controller('me/prescriptions')
export class PatientPrescriptionsController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  listForPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PrescriptionListQueryDto,
  ) {
    return this.prescriptionService.listForPatient(user, query);
  }
}
