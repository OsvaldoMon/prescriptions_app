import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from '../../../common/tokens/injection.tokens';
import type { PrescriptionRepository } from '../domain/repositories/prescription.repository';

@Injectable()
export class PrescriptionCodeGenerator {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: PrescriptionRepository,
  ) {}

  async generate(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.buildCode();
      const exists = await this.prescriptionRepository.codeExists(code);

      if (!exists) {
        return code;
      }
    }

    throw new Error('No fue posible generar un código único de prescripción.');
  }

  private buildCode(): string {
    const year = new Date().getFullYear();
    const suffix = randomBytes(3).toString('hex').toUpperCase();

    return `RX-${year}-${suffix}`;
  }
}
