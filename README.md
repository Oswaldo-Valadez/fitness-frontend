# Fitness Frontend (React SPA)

Consumer del contrato API del backend de fitness/nutricion.

## Resumen
- SPA con React 19 + TypeScript 6 + Vite 8.
- Estado global con Redux Toolkit.
- Enrutamiento con React Router 7.
- Cliente HTTP con Axios + CSRF/Sanctum.
- Cliente tipado generado desde OpenAPI con Orval.

## Arquitectura
- Documentacion: `docs/architecture.md`

## Requisitos
- Node.js 20+
- npm

## Configuracion local
```bash
npm install
```

## Ejecutar en desarrollo
```bash
npm run dev
```

Servidor por defecto: `http://localhost:5173`

## Integracion con backend
`vite.config.ts` tiene proxy a backend local:
- `/api` -> `http://localhost:8000`
- `/sanctum` -> `http://localhost:8000`

## Cliente tipado (Orval)
Fuente del contrato:
- `../fitness-backend/storage/api-docs/api-docs.json`

Generacion:
```bash
npm run gen
```

Salida:
- `src/api/generated/index.ts`
- `src/api/generated/model/*`

## Calidad y verificacion
```bash
npm run lint
npm run test
npm run build
```

Estado actual:
- Tests Vitest en verde.
- Build en verde.

## Modulos funcionales
- Auth: login, register, forgot/reset password.
- Onboarding: consents + profile.
- Dashboard: resumen diario de kcal y macros.
- Foods: catalogo, filtros, detalle.
- Diary: registro de comidas e items.
- Profile: edicion e historial de objetivos.
- Account: export y eliminacion de cuenta.
- Admin: alimentos e import CSV.
