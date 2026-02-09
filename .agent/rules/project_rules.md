# POS CHILE - PROJECT RULES

## 1. Tech Stack (Strict)
- **Backend:** Node.js, NestJS, TypeScript, Prisma ORM.
- **Database:** PostgreSQL.
- **Frontend:** React, Vite, TailwindCSS, Shadcn/ui, TanStack Query.
- **Monorepo:** Usa Turborepo o npm workspaces (folders: apps/api, apps/web).

## 2. Business Rules (Immutable)
- **Multi-tenancy:** Toda tabla principal (Products, Sales, Customers) DEBE tener `tenant_id`.
- **Moneda:** CLP (Peso Chileno). Guardar como INTEGER en DB. En Frontend formatear con separador de miles y sin decimales (Ej: $1.000).
- **Identificadores:** RUT Chileno es el ID fiscal. Validar formato y dígito verificador.
- **Stock:** El stock NUNCA está en la tabla `Product`. Está en `InventoryLevel` vinculado a `Branch`.

## 3. Coding Standards
- **Idioma:** Código y variables en Inglés. Comentarios y UI en Español.
- **Seguridad:** Nunca exponer IDs autoincrementales en URLs, usar UUID/CUID.
- **Errores:** Usar `HttpException` en NestJS. Nunca dejar bloques `catch` vacíos.
