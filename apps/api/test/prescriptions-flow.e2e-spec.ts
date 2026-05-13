import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-app';

describe('Prescriptions flow (e2e)', () => {
  let app: INestApplication<App>;
  let doctorToken = '';
  let patientToken = '';
  let adminToken = '';
  let pendingPrescriptionId = '';

  beforeAll(async () => {
    app = await createE2eApp();

    const doctorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'dr@test.com', password: 'dr123' })
      .expect(201);

    doctorToken = doctorLogin.body.accessToken;

    const patientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'patient@test.com', password: 'patient123' })
      .expect(201);

    patientToken = patientLogin.body.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('devuelve el perfil del médico autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(response.body.role).toBe('doctor');
    expect(response.body.email).toBe('dr@test.com');
  });

  it('permite al médico listar sus prescripciones', async () => {
    const response = await request(app.getHttpServer())
      .get('/prescriptions?mine=true&limit=5')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta.total).toBeGreaterThan(0);
  });

  it('permite al paciente listar sus prescripciones', async () => {
    const response = await request(app.getHttpServer())
      .get('/me/prescriptions?status=pending&limit=1')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    pendingPrescriptionId = response.body.data[0].id;
  });

  it('permite al paciente descargar el PDF de una prescripción propia', async () => {
    const response = await request(app.getHttpServer())
      .get(`/prescriptions/${pendingPrescriptionId}/pdf`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('permite al paciente marcar una prescripción como consumida', async () => {
    const response = await request(app.getHttpServer())
      .put(`/prescriptions/${pendingPrescriptionId}/consume`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ consumed: true })
      .expect(200);

    expect(response.body.status).toBe('consumed');
    expect(response.body.consumedAt).toBeTruthy();
  });

  it('expone métricas administrativas', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.totals.prescriptions).toBeGreaterThan(0);
    expect(response.body.byStatus).toMatchObject({
      pending: expect.any(Number),
      consumed: expect.any(Number),
    });
  });
});
