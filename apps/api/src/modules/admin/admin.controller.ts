import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './application/admin.service';
import { MetricsQueryDto } from './dto/metrics-query.dto';
import { PrescriptionService } from '../prescriptions/application/prescription.service';
import { PrescriptionListQueryDto } from '../prescriptions/dto/prescription.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@Roles(Role.admin)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prescriptionService: PrescriptionService,
  ) {}

  @Get('metrics')
  getMetrics(@Query() query: MetricsQueryDto) {
    return this.adminService.getMetrics(query);
  }

  @Get('prescriptions')
  listPrescriptions(@Query() query: PrescriptionListQueryDto) {
    return this.prescriptionService.listForAdmin(query);
  }
}
