import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrescriptionService } from './application/prescription.service';
import { ConsumePrescriptionDto } from './dto/consume-prescription.dto';
import {
  CreatePrescriptionDto,
  DoctorPrescriptionListQueryDto,
} from './dto/prescription.dto';

@ApiTags('prescriptions')
@ApiBearerAuth('access-token')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Roles(Role.doctor)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreatePrescriptionDto,
  ) {
    return this.prescriptionService.create(user, createDto);
  }

  @Roles(Role.doctor)
  @Get()
  listForDoctor(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DoctorPrescriptionListQueryDto,
  ) {
    return this.prescriptionService.listForDoctor(user, query);
  }

  @Roles(Role.patient)
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') prescriptionId: string,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.prescriptionService.generatePdf(
      user,
      prescriptionId,
    );

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Roles(Role.patient)
  @Put(':id/consume')
  consume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') prescriptionId: string,
    @Body() consumeDto: ConsumePrescriptionDto,
  ) {
    return this.prescriptionService.consume(user, prescriptionId, consumeDto);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') prescriptionId: string,
  ) {
    return this.prescriptionService.getById(user, prescriptionId);
  }
}
