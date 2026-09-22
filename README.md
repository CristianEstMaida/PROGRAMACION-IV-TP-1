# 🎬 CineNova – Sistema de Gestión Cinematográfica

Aplicación web integral y progresiva (PWA) para la gestión comercial y operativa de un complejo de cines, desarrollada con **Angular**, **Supabase** y arquitectura orientada a componentes reactivos.

Cumple con todos los requerimientos transaccionales: venta de entradas con reserva de butacas en tiempo real, catálogo de Candy Bar integrado en la misma orden, validación de cupones dinámicos, fidelización por puntos, cancelación con devolución de crédito en cuenta, control de acceso por código QR y panel administrativo con métricas.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** Angular 22 (Standalone Components, Signals reactivos, Control Flow `@if` / `@for`, lazy loading de rutas).
- **Backend & Autenticación:** Supabase (PostgreSQL relacional, Row Level Security, Auth con JWT).
- **Librerías Clave:** 
  - `jspdf` & `jspdf-autotable`: Emisión de entradas oficiales y exportación de reportes administrativos en PDF.
  - `qrcode`: Generación dinámica de códigos QR vectoriales e incrustación en tickets.
  - `xlsx`: Exportación de balances y métricas a hojas de cálculo Excel.
  - `chart.js`: Gráficos interactivos de ventas, facturación y productos destacados.
  - `@angular/service-worker`: Soporte PWA offline e instalable.
- **Despliegue e Infraestructura:** Vercel (Frontend CI/CD) + Supabase Cloud (Base de datos y Storage).

---

## 🧱 Arquitectura del Sistema

src/app/
├── componentes/
│   ├── home/                 # Cartelera principal, podio Top 3 y filtros por formato (2D, 3D, 4D, 5D)
│   ├── movie-detail/         # Ficha técnica, sinopsis y reseñas con promedio de estrellas
│   ├── reserve/              # Mapa de sala (28 butacas/fila, VIP y adaptadas), Candy Bar y Cupones
│   ├── mis-peliculas/        # Historial de entradas, saldo de crédito, puntos y cancelación (<= 2 hs)
│   ├── validador-qr/         # Terminal de operador para escanear/ingresar código QR y quemar ticket
│   ├── admin-dashboard/      # Panel general de administración con métricas y gráficos
│   ├── funciones-admin/      # Algoritmo de asignación automática de salas (duración + 30 min)
│   ├── peliculas-admin/      # ABM de títulos, formatos e idiomas
│   ├── candy-bar-admin/      # ABM de catálogo de alimentos, combos y stock
│   ├── cupones-admin/        # Configuración de cupones (bienvenida y mayores de 50 años)
│   └── log-actividad/        # Auditoría de acciones administrativas y operativas en tiempo real
├── services/
│   ├── auth.ts               # Sesión, recuperación de contraseña y perfiles extendidos
│   ├── movies.service.ts     # Consulta a Supabase de cartelera, top vistas y alertas de preventa
│   └── supabase.service.ts   # Inicialización y singleton del cliente Supabase
├── directivas/
│   ├── appImageFallback      # Manejo de imágenes rotas de películas
│   ├── appAutoFocus          # Foco automático en buscadores
│   └── confirm-delete        # Interceptor de confirmación para bajas
└── guards/
├── auth-guard.ts         # Protección de checkout y perfil personal
└── role-guard.ts         # Restricción estricta para roles admin y operador


---

## 💡 Lógica de Negocio y Reglas Implementadas

1. **Estructura Fija de Sala:** 20 filas (A a T) divididas en 3 columnas de 4, 20 y 4 butacas (28 por fila). Filas **J y K** adaptadas para personas con discapacidad (2, 10, 2) y filas **R, S y T** configuradas como **VIP (+30% de recargo)**.
2. **Asignación Automática de Salas:** Al programar una función, el sistema valida que no existan solapamientos considerando la **duración de la película + 30 minutos obligatorios de limpieza**, asignando automáticamente la sala libre.
3. **Candy Bar Unificado:** Los productos y combos se seleccionan en el mismo flujo de compra de las butacas y se retiran presentando el **mismo código QR** impreso en el PDF.
4. **Cupones de Descuento Inteligentes:** 
   - `BIENVENIDA20`: 20% en la primera compra de usuarios registrados.
   - `SENIOR50`: 30% exclusivo para personas $\ge 50$ años (calculado contra su fecha de nacimiento).
5. **Cancelaciones y Saldo a Favor:** Se permite cancelar reservas hasta 2 horas antes del inicio de la función. El dinero no se reembolsa externamente, sino que se acredita como **saldo disponible** en su perfil para futuras compras.
6. **Fidelización:** Los usuarios registrados suman **1 punto por cada peso gastado**.
7. **Control de Acceso / Quema de QR:** Los operadores validan la entrada ingresando el código o mediante escaneo. Una vez consumida, la entrada queda en estado `usada` y no puede reutilizarse.
8. **Restricción de Edad:** Películas con restricción (+13, +18) alertan la necesidad de acompañamiento adulto o bloquean la transacción si el perfil no cumple la edad.

---

## 🔧 Instalación Local

```bash
# 1. Clonar el repositorio
git clone CristianEstMaida/PROGRAMACION-IV-TP-1.git
cd cine-app

# 2. Instalar dependencias
npm install

# 3. Levantar servidor de desarrollo
ng serve -o
```

## 📄 Licencia

Proyecto académico – UTN-FRA, Programación IV.
---
