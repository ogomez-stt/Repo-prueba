# Sistema de Turnos

Sistema de gestion de turnos multi-proposito. Permite administrar colas de atencion para cualquier tipo de servicio (hospitales, restaurantes, oficinas, etc.).

## Descripcion

El sistema tiene dos roles principales:

- **Administrador** — Crea y gestiona colas de atencion. Puede crear, llamar, completar, reordenar y cancelar turnos.
- **Usuario** — Se une a una cola, crea su turno, puede cancelarlo y al finalizar la atencion completa una encuesta de satisfaccion.

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Express + TypeScript (Bun runtime) |
| Base de datos | DynamoDB (single-table design) |
| Autenticacion | AWS Cognito (User Pool + JWT) |
| Infraestructura | SST v3 + Pulumi (IaC) |
| Compute | AWS Lambda + ECS Fargate |
| API | API Gateway HTTP API |
| Hosting | S3 + CloudFront |
| Monorepo | WebIAI CLI + Lerna + npm workspaces |

## Estructura del Proyecto

```
packages/
├── cloud/core/           Infraestructura compartida (VPC, Cognito)
├── services/api/         Backend (API Gateway, Lambda, Fargate, DynamoDB)
│   └── modules/service/  Microservicio Express
└── apps/web/             Frontend
    └── modules/app/      React SPA
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install
cd packages/apps/web/modules/app && npm install

# Correr frontend y backend en paralelo
npm run dev
```

Esto levanta:
- Backend (Express) en `http://localhost:8080`
- Frontend (Vite) en `http://localhost:5173`

## Requisitos

- Node.js >= 22
- Bun (para el microservicio)
- AWS credentials (para deploy)

## Arquitectura

El proyecto sigue el patron de WebIAI con comunicacion cross-stack via SSM:

```
cloud.core ──register()──> SSM <──restore()── srv.api
                                              │
                           SSM <──register()──┘
                            │
app.web ──restore()─────────┘
```

Cada bundle (stack) es independiente y desplegable por separado. El orden de deploy es: `cloud.core` → `srv.api` → `app.web`.
