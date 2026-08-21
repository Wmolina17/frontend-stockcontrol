# StockControl — Frontend

Interfaz React del sistema StockControl. Consume la API REST del backend (`backend-stockcontrol`).

## Estructura

```
src/
├── components/     # Layout, rutas protegidas, notificaciones, UI compartida
├── context/        # Autenticación (JWT)
├── hooks/          # useAuth, useToast
├── lib/            # api.js, constants.js (roles/nav), format.js
├── pages/          # Una página por módulo funcional
├── index.css       # Design system (tokens + componentes .ui-*)
└── App.jsx         # Rutas
```

## Ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

`VITE_API_URL=http://localhost:4000/api`

## Convenciones UI

- Tipografía: Segoe UI (fuente nativa del sistema)
- Paleta suave (fondos claros, acento verde, bordes redondeados)  
- Componentes compartidos en `components/ui.jsx` (`PageHeader`, `Modal`, `EmptyState`, `ConfirmDialog`)  
- Estilos globales `.ui-*` en `index.css` — las páginas no duplican CSS de tarjetas

## Roles y navegación

La barra lateral se filtra con `ROLE_PERMISSIONS` (`lib/constants.js`), alineada al backend.
