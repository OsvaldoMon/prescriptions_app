# App de Prescripciones

MVP full-stack para gestionar prescripciones médicas con roles **admin**, **doctor** y **patient**. El backend expone una API REST con JWT, RBAC, PDF y métricas; el frontend ofrece flujos por rol con filtros persistidos en la URL.

## Stack

- **Backend:** NestJS, Prisma, PostgreSQL, Passport JWT, Swagger

- **Frontend:** Next.js App Router, TypeScript, TailwindCSS, Recharts

- **Infra local:** Docker Compose (PostgreSQL)

## Estructura del monorepo

- `apps/api` — API NestJS

- `apps/web` — frontend Next.js

- `prisma` — esquema, migraciones y seed

## Requisitos

- Node.js 20+

- npm 10+

- Docker Desktop (recomendado para PostgreSQL local)

## Configuración local

1. Clonar el repositorio e instalar dependencias:

```bash

npm install

```

2. Copiar variables de entorno:

```bash

copy .env.example .env

copy apps\web\.env.example apps\web\.env.local

```

3. Levantar PostgreSQL:

```bash

npm run docker:up

```

> El proyecto usa `5433` en `docker-compose.yml` y en `DATABASE_URL`.

4. Generar cliente Prisma, migrar y sembrar datos:

```bash

npm run db:generate

npm run db:migrate

npm run db:seed

```

5. Iniciar API y frontend en terminales separadas:

```bash

npm run api:dev

npm run web:dev

```

## URLs locales

| Servicio | URL |

|---|---|

| API | http://localhost:3000 |

| Swagger | http://localhost:3000/docs |

| Frontend | http://localhost:3001 |

| Healthcheck | http://localhost:3000/health |

## URLs de despliegue

Sustituye estos valores por las URLs reales de tu entorno al publicar:

| Servicio | URL de ejemplo |

|---|---|

| Frontend (Vercel) | `https://prescriptions-web.vercel.app` |

| API (Render/Railway) | `https://prescriptions-api.onrender.com` |

| Swagger | `https://prescriptions-api.onrender.com/docs` |

| Healthcheck | `https://prescriptions-api.onrender.com/health` |

## Cuentas de prueba (seed)

| Rol | Email | Contraseña |

|---|---|---|

| Admin | `admin@test.com` | `admin123` |

| Médico | `dr@test.com` | `dr123` |

| Paciente | `patient@test.com` | `patient123` |

## Scripts útiles

| Comando | Descripción |

|---|---|

| `npm run docker:up` | Inicia PostgreSQL |

| `npm run docker:down` | Detiene PostgreSQL |

| `npm run db:migrate` | Aplica migraciones Prisma en desarrollo |

| `npm run db:migrate:deploy` | Aplica migraciones en producción |

| `npm run db:seed` | Carga datos de ejemplo |

| `npm run api:dev` | API en modo desarrollo |

| `npm run web:dev` | Frontend en modo desarrollo |

| `npm run build` | Build de API y web |

| `npm run start:api` | Migra y arranca la API en producción |

| `npm run test` | Tests unitarios (API + web) |

| `npm run test:e2e` | Tests e2e de la API |

## Variables de entorno principales

### Raíz (`.env` / producción en Render o Railway)

- `DATABASE_URL` — conexión PostgreSQL

- `API_PORT` — puerto local de la API (default `3000`)

- `PORT` — lo inyectan Render/Railway; tiene prioridad sobre `API_PORT`

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — firmas JWT

- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` — expiración de tokens

- `FRONTEND_URL` — origen permitido en CORS y base del QR del PDF

### Frontend (`apps/web/.env.local` / Vercel)

- `NEXT_PUBLIC_API_URL` — URL pública de la API

Plantillas de producción: `.env.production.example` y `apps/web/.env.production.example`.

## Decisiones técnicas

- **Autenticación:** access token JWT + refresh token con rotación y revocación en base de datos.

- **Autorización:** guards globales JWT + `@Roles()` por endpoint.

- **Persistencia:** Prisma con repositorios por dominio y soft delete en usuarios/prescripciones.

- **PDF:** patrón Strategy (`PdfKit`) con QR hacia la ruta del paciente en el frontend.

- **Paginación y filtros:** query params en API; en web, persistencia con `nuqs`.

- **Errores:** respuesta uniforme `{ message, code, details? }`.

- **Seguridad:** Helmet, CORS, rate limiting básico y validación estricta de DTOs.

## Despliegue

El repositorio incluye `Dockerfile`, `render.yaml`, `railway.toml` y `apps/web/vercel.json`.

### 1. Base de datos y API en Render

1. Crea un Blueprint desde `render.yaml` o un Web Service con Docker.

2. Crea la base PostgreSQL y vincula `DATABASE_URL`.

3. Define `FRONTEND_URL` con la URL final de Vercel.

4. Genera secretos JWT seguros.

5. Tras el primer deploy, ejecuta el seed una sola vez:

```bash

npm run db:seed

```

En Render puedes usar un job manual o la shell del servicio con `DATABASE_URL` configurada.

### 2. API en Railway

1. Crea un proyecto desde el repositorio.

2. Añade un plugin PostgreSQL y expón `DATABASE_URL` al servicio API.

3. Railway usará `railway.toml` y el `Dockerfile`.

4. Configura `FRONTEND_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.

5. Ejecuta el seed una vez tras la primera migración.

### 3. Frontend en Vercel

1. Importa el repositorio.

2. Establece **Root Directory** en `apps/web`.

3. Configura `NEXT_PUBLIC_API_URL` con la URL pública de la API.

4. Despliega. Vercel usará `apps/web/vercel.json` para instalar dependencias desde la raíz del monorepo.

### 4. Verificación post-deploy

1. Abre `/health` en la API.

2. Revisa `/docs`.

3. Inicia sesión en el frontend con las cuentas del seed.

4. Confirma login, listados, consumo de prescripción y descarga de PDF.

## Colección Postman

Importa `docs/postman/prescriptions.postman_collection.json`. Actualiza `baseUrl` con la URL pública de la API. La colección incluye login y guarda `accessToken` en variables de colección para las rutas protegidas.

## Testing

- **API unitarios:** servicios críticos (`auth`, `prescriptions`)

- **API e2e:** login, listados, PDF, consumo y métricas admin (requiere DB con seed)

- **Web:** prueba mínima de utilidades (`buildQueryString`)

```bash

npm run test

npm run test:e2e

```
