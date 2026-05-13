import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type {
  PrescriptionPdfData,
  PrescriptionPdfStrategy,
} from '../../domain/strategies/prescription-pdf.strategy';

@Injectable()
export class PdfKitPrescriptionPdfStrategy implements PrescriptionPdfStrategy {
  async generate(data: PrescriptionPdfData): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
      margin: 1,
      width: 120,
    });

    return new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.fontSize(20).text('Prescripción médica', { align: 'center' });
      document.moveDown();
      document.fontSize(12).text(`Código: ${data.code}`);
      document.text(`Estado: ${data.status}`);
      document.text(`Fecha: ${data.createdAt.toISOString().slice(0, 10)}`);
      if (data.consumedAt) {
        document.text(`Consumida: ${data.consumedAt.toISOString().slice(0, 10)}`);
      }

      document.moveDown();
      document.fontSize(14).text('Paciente');
      document.fontSize(12).text(`${data.patientName} (${data.patientEmail})`);

      document.moveDown();
      document.fontSize(14).text('Médico');
      document
        .fontSize(12)
        .text(`${data.doctorName}${data.doctorSpecialty ? ` - ${data.doctorSpecialty}` : ''}`);
      if (data.doctorLicenseNumber) {
        document.text(`Matrícula: ${data.doctorLicenseNumber}`);
      }

      if (data.notes) {
        document.moveDown();
        document.fontSize(14).text('Notas');
        document.fontSize(12).text(data.notes);
      }

      document.moveDown();
      document.fontSize(14).text('Ítems');
      data.items.forEach((item, index) => {
        document.moveDown(0.5);
        document
          .fontSize(12)
          .text(
            `${index + 1}. ${item.name}${item.dosage ? ` | ${item.dosage}` : ''}${
              item.quantity ? ` | Cantidad: ${item.quantity}` : ''
            }`,
          );
        if (item.instructions) {
          document.text(`Instrucciones: ${item.instructions}`);
        }
      });

      document.image(qrBuffer, document.page.width - 160, 48, {
        width: 100,
      });
      document
        .fontSize(8)
        .text('Verificar prescripción', document.page.width - 160, 152, {
          width: 100,
          align: 'center',
        });

      document.end();
    });
  }
}
