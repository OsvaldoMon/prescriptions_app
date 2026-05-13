import { IsBoolean } from 'class-validator';

export class ConsumePrescriptionDto {
  @IsBoolean()
  consumed: boolean;
}
