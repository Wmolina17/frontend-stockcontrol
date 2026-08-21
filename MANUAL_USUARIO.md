# Manual de usuario — StockControl

Guía para usar el sistema en la demostración y el día a día.

---

## Acceso al sistema

1. Abrir http://localhost:5173
2. Iniciar sesión con correo y contraseña
3. En la pantalla de login puedes usar las **cuentas de prueba** (botones al final)

### Credenciales de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@stockcontrol.com | admin123 |
| Encargado de Inventario | inventario@stockcontrol.com | inventario123 |
| Encargado de Operaciones | operaciones@stockcontrol.com | operaciones123 |
| Vendedor | ventas@stockcontrol.com | ventas123 |

El menú lateral muestra solo los módulos permitidos para tu rol.

---

## Módulos

### Inicio
Vista general con:
- Productos en catálogo y stock bajo
- Pedidos pendientes
- Facturación del mes
- Listas de pedidos recientes y últimas ventas
- Accesos rápidos a otros módulos

### Productos
- Crear, editar y eliminar productos
- Definir precio, stock inicial y stock mínimo
- **Categorías:** crear y editar clasificaciones (Electrónica, Oficina, etc.)
- Buscar y filtrar por categoría
- Los productos con stock bajo se resaltan

### Inventario
- Registrar **entradas** (aumentan stock) y **salidas** (disminuyen stock)
- Ver historial con fecha, tipo, cantidad, stock antes/después y responsable
- Filtrar por entradas o salidas

### Clientes
- Registrar nombre, teléfono, dirección y correo
- Editar y eliminar clientes
- Los clientes se usan en pedidos y facturas

### Pedidos
- Crear pedido: cliente, fecha de entrega, productos y cantidades
- Ver listado y filtrar por estado
- **Estados:** Pendiente → En proceso → Completado → Entregado
- En el detalle puedes avanzar el estado del pedido

### Facturación
- Emitir facturas con cálculo de IVA 19%
- Al facturar, el inventario se descuenta automáticamente
- Buscar por factura, cliente o rango de fechas
- Ver detalle y descargar PDF

### Notificaciones (campana superior)
- Stock bajo o agotado
- Pedidos pendientes
- Pedidos próximos a vencer
- Marcar como leídas individualmente o todas

### Reportes (solo Administrador)
- Tipos: inventario, ventas, pedidos, facturas, clientes
- Filtrar por fechas
- Exportar a Excel

### Usuarios (solo Administrador)
- Crear cuentas y asignar rol
- Activar o desactivar usuarios
- Editar datos y contraseña

### Configuración
- Ver tu perfil (nombre, correo, rol)
- Cambiar contraseña

---

## Flujo recomendado para la presentación

1. **Admin** — Mostrar usuarios, un reporte y el dashboard general
2. **Inventario** — Registrar una entrada o revisar productos con stock bajo
3. **Operaciones** — Crear un pedido y cambiar su estado
4. **Vendedor** — Crear cliente, emitir factura y descargar PDF
5. **Todos** — Revisar notificaciones en la campana

---

## Mensajes y estados

- **Verde:** stock normal, activo, completado
- **Amarillo:** stock bajo, pendiente, advertencia
- **Rojo:** agotado, error, eliminar

Si aparece "Sesión expirada", vuelve a iniciar sesión.

---

## Soporte técnico

Para levantar el sistema desde cero:

```bash
cd backend && npm run seed && npm run dev
cd front-amigos && npm run dev
```

Documentación técnica completa: [DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md)
