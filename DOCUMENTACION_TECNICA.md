# Documentación técnica — StockControl

Sistema de Gestión de Inventario desarrollado como proyecto académico.

**Integrantes:** William Molina · Davanis Barrera · Nicolas Castro

---

## 1. Descripción del sistema

StockControl centraliza inventario, productos, pedidos, clientes, facturación y reportes en una sola plataforma web. Resuelve el control manual de existencias, ventas y pedidos con roles diferenciados y trazabilidad de movimientos.

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express, TypeScript |
| Base de datos | MongoDB Atlas, Mongoose |
| Autenticación | JWT (access + refresh), Bcrypt |
| Validación | Zod |
| Documentación API | Swagger (`/api/docs`) |
| Exportación | PDFKit (facturas), ExcelJS (reportes) |
| Contenedores | Docker (opcional, Mongo local) |

## 3. Arquitectura

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐     Mongoose     ┌──────────────┐
│  front-amigos   │ ────────────────► │  backend API    │ ───────────────► │ MongoDB Atlas│
│  React (5173)   │   Bearer JWT      │  Express (4000) │                  │              │
└─────────────────┘                   └─────────────────┘                  └──────────────┘
```

### Patrón backend

```
Routes → Controller → Service → Repository → Model → MongoDB
```

| Capa | Responsabilidad |
|------|-----------------|
| Routes | Endpoints, middleware por ruta |
| Controller | Entrada/salida HTTP |
| Service | Reglas de negocio, transacciones |
| Repository | Consultas a la base de datos |
| Model | Esquema Mongoose |

## 4. Estructura del repositorio

```
inventario-pruebas-sistema/
├── front-amigos/          # Frontend principal
│   └── src/
│       ├── components/    # Layout, UI compartida, notificaciones
│       ├── context/       # Autenticación
│       ├── hooks/         # useAuth, useToast
│       ├── lib/           # API, constantes, formateo
│       └── pages/         # Módulos funcionales
├── backend/
│   └── src/
│       ├── modules/       # auth, users, products, inventory, orders, invoices...
│       ├── middleware/    # auth, authorize, validate, errors
│       ├── services/      # email, notificaciones
│       └── database/      # conexión y seed
└── documentos/            # Documentación del proyecto
```

## 5. Módulos funcionales

| Módulo | Backend | Frontend |
|--------|---------|----------|
| Usuarios y seguridad | `/api/auth`, `/api/users`, `/api/roles` | Login, Usuarios, Configuración |
| Productos | `/api/products`, categorías | Productos |
| Inventario | `/api/inventory` | Inventario |
| Pedidos | `/api/orders` | Pedidos |
| Facturación | `/api/invoices` (+ PDF) | Facturación |
| Clientes | `/api/customers` | Clientes |
| Notificaciones | `/api/notifications` | Campana (NotificationBell) |
| Reportes | `/api/reports` | Reportes |
| Dashboard | `/api/dashboard` | Inicio |

## 6. Roles y permisos (RBAC)

| Rol | Código | Acceso principal |
|-----|--------|------------------|
| Administrador | `ADMIN` | Todo el sistema |
| Encargado de Inventario | `INVENTORY_MANAGER` | Productos, categorías, inventario |
| Encargado de Operaciones | `OPERATIONS_MANAGER` | Pedidos, consulta de productos/clientes |
| Vendedor | `SELLER` | Clientes, facturación, consulta de productos |

Los permisos se validan en backend (`authorize`, `authorizePermission`) y en frontend (rutas y menú filtrados).

## 7. Modelo de datos (resumen)

- **users** — nombre, apellido, email, contraseña (hash), rol, activo
- **products** — nombre, descripción, categoría, precio, stock, stock mínimo
- **categories** — clasificación de productos
- **customers** — nombre, teléfono, dirección, email
- **orders** — cliente, ítems, estado, fecha entrega, historial de estados
- **invoices** — cliente, ítems, subtotal, IVA 19%, total
- **inventory_movements** — entrada/salida, producto, cantidad, responsable
- **notifications** — alertas de stock, pedidos pendientes, vencimientos

Soft delete mediante `deletedAt` en entidades principales.

## 8. Reglas de negocio clave

- IVA del **19%** en facturas (COP).
- Al emitir factura se descuenta stock automáticamente.
- Entradas/salidas de inventario registran stock anterior y posterior.
- Pedidos: estados `PENDING → IN_PROCESS → COMPLETED → DELIVERED` (sin retroceso).
- Alertas automáticas por stock bajo, agotado, pedidos pendientes y próximos a vencer.

## 9. Seguridad

- JWT access (15 min) + refresh (7 días)
- Bcrypt para contraseñas
- Helmet, CORS, rate limiting (producción)
- Validación Zod en body/query/params
- Verificación de usuario activo en cada request autenticado

## 10. Ejecución local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar MONGODB_URI en .env
npm run seed
npm run dev
```

### Frontend

```bash
cd front-amigos
npm install
cp .env.example .env
npm run dev
```

- API: http://localhost:4000  
- Swagger: http://localhost:4000/api/docs  
- App: http://localhost:5173  

## 11. Requisitos cubiertos

| Código | Requisito | Estado |
|--------|-----------|--------|
| RF-01 | Registrar usuarios | ✓ |
| RF-02 | Administrar productos | ✓ |
| RF-03 | Entradas/salidas inventario | ✓ |
| RF-04 | Registrar pedidos | ✓ |
| RF-05 | Generar facturas | ✓ |
| RF-06 | Administrar clientes | ✓ |
| RF-07 | Alertas bajo stock | ✓ |
| RNF-01 | Autenticación | ✓ |
| RT-01 | React + Node.js | ✓ |
| RT-02 | MongoDB Atlas | ✓ |

**Fuera de alcance:** pasarela de pagos, app móvil, BI avanzado.

## 12. Metodología

Modelo **incremental**: entrega progresiva por módulos (usuarios/productos/inventario → pedidos/facturación/notificaciones → reportes y cierre).
