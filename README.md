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
Fuente del contrato (vendorizada en este repo, no referenciada por ruta
relativa al backend, ya que `fitness-backend` es un repo privado separado):
- `openapi/api-docs.json`

`fitness-backend` sigue siendo el dueño del contrato. Cuando cambie su spec,
copiar el archivo actualizado antes de regenerar:
```bash
cp ../fitness-backend/storage/api-docs/api-docs.json openapi/api-docs.json
npm run gen
```

Salida:
- `src/api/generated/index.ts`
- `src/api/generated/model/*`

Deteccion de drift (falla si el cliente generado no coincide con el spec
vendorizado):
```bash
npm run contract:check
```

## Calidad y verificacion
```bash
npm run lint
npm run typecheck
npm run contract:check
npm run test
npm run build
```

E2E (Playwright, requiere un backend real sembrado; ver `BASE_URL` en
`playwright.config.ts`):
```bash
npm run test:e2e
```

CI: `.github/workflows/ci.yml` corre lint/typecheck/contract:check, tests y
build en cada push/PR. El job e2e no esta en CI todavia (ver nota en el
propio workflow).

Estado actual:
- Tests Vitest en verde.
- Build en verde.

## Modulos funcionales
- Auth: login, register, forgot/reset password.
- Onboarding: consents + perfil, con banner y flujo de re-aceptacion de
  consentimientos.
- Dashboard: resumen diario de kcal y macros, con estado de nutriente
  desconocido/parcial (nunca se muestra 0 cuando el dato no existe).
- Foods: catalogo, filtros, detalle, favoritos, porciones.
- Diary: busqueda unificada (alimentos/recetas/porciones), favoritos,
  recientes, copiar comida entre fechas.
- Library: mis alimentos, recetas (editor + detalle), plantillas de comida
  (crear/aplicar).
- Reports: reportes de nutricion por periodo, grafica y export JSON/CSV;
  tab "Calidad de dieta" (`/reports/quality`) con cuestionario MEDAS-14 de
  14 pasos, detalle de evaluaciones históricas, metas opcionales con
  check-ins y tarjeta compacta en el dashboard. El backend es la única
  fuente del score y del catálogo de metas; adapter en
  `src/api/dietQuality.ts`, E2E en `e2e/diet-quality.spec.ts` (Sprint 3).
- Profile: edicion e historial de objetivos.
- Account: export y eliminacion de cuenta.
- Admin: alimentos e import CSV, integracion FoodData Central (estado,
  preview, import), lotes de importacion, mapeo de nutrientes externos,
  auditoria.
