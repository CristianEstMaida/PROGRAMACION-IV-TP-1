# 🎬 CineNova – Documentación Técnica y Manual de Arquitectura

**Proyecto:** Sistema de Gestión y Venta Cinematográfica (CineApp)  
**Cátedra:** Programación IV – Tecnicatura Universitaria en Programación (UTN-FRA)  
**Stack Tecnológico:** Angular Standalone, Signals, Supabase (PostgreSQL), PWA, jsPDF, Chart.js  

---

## 1. Visión General del Sistema

CineNova es una aplicación web progresiva orientada al sector cinematográfico que resuelve tanto la experiencia de cara al público (*B2C*) como la administración y control operativo interno (*B2B*). El sistema contempla la venta de entradas con reserva de butacas en tiempo real, integración directa del catálogo de Candy Bar en la misma transacción, validación de reglas de negocio para cupones dinámicos, fidelización por puntos, cancelaciones con reintegro a saldo a favor, asignación automatizada de salas y control de acceso con quema de tickets mediante código QR.

---

## 2. Stack Tecnológico

- **Frontend:** Angular (Standalone Components, Signals reactivos, Control Flow `@if` / `@for`).
- **Backend & Base de Datos:** Supabase (PostgreSQL, Supabase Auth con JWT).
- **Herramientas y Librerías:**
  - `jspdf` & `jspdf-autotable`: Generación y descarga de comprobantes en PDF.
  - `qrcode`: Generación del código QR vectorial unificado.
  - `chart.js`: Gráficos interactivos en panel de control.
  - `xlsx`: Exportación de reportes a Excel.
  - `@angular/service-worker`: Soporte PWA instalable y funcionamiento offline básico.
- **Deploy:** Vercel (Frontend) + Supabase Cloud (Base de datos).

---

## 4. Estructura de la Base de Datos (Supabase)

- **`perfiles`:** Datos extendidos del usuario (`nombre`, `apellido`, `tipo_sangre`, `color_ojos`, `dias_vacaciones`, `puntos`, `credito`, `rol`).
- **`peliculas`:** Títulos, sinopsis, duración, formato (2D, 3D, 4D, 5D), clasificación por edad y póster.
- **`funciones`:** Relación película-sala con ventana temporal (`fecha_hora` a `fecha_fin`).
- **`salas` y `butacas`:** Configuración geométrica de la sala y clasificación (`normal`, `adaptada`, `vip`).
- **`entradas`:** Código alfanumérico único (`qr_code`), precio abonado y estados (`validada`, `usada`, `cancelada`).
- **`productos` y `compras_candy`:** Artículos del Candy Bar vinculados al código del ticket.
- **`cupones`:** Descuentos configurables con restricciones de primera compra o edad mínima.
- **`resenas`:** Puntuación (1-5) y opiniones de espectadores.
- **`logs_actividad`:** Registro inmutable de acciones de administración y validación.

---

## 5. Reglas de Negocio Clave

1. **Recargo VIP:** Las butacas de las filas R, S y T calculan automáticamente:  
   $$\text{Precio Final} = \text{Precio Base} \times 1.30$$
2. **Intervalo Técnico de Sala:** Para programar una función, ninguna sala puede tener funciones activas dentro del rango:  
   $$[\text{Inicio}, \; \text{Inicio} + \text{Duración} + 30 \text{ min}]$$
3. **Plazo de Cancelación:** La anulación de tickets solo se admite si:  
   $$\text{Fecha/Hora Función} - \text{Fecha/Hora Actual} \ge 2 \text{ horas}$$  
   El valor pagado se suma al campo `credito` del perfil para utilizarse como forma de pago en la próxima compra.
4. **Validación de Ticket:** Al validar un ticket en `/admin/validar-qr`, el estado cambia a `usada`. Si se intenta escanear nuevamente, el sistema rechaza el acceso.

---

## 6. Sprints de Desarrollo e Integración

* **Sprint 1 – Identidad y Acceso:** Setup de Angular, arquitectura de componentes standalone, sistema de login/registro con persistencia de campos extendidos (sangre, ojos, vacaciones) en Supabase Auth y perfiles.
* **Sprint 2 – Cartelera, Top de Ventas y Búsqueda:** Home interactivo con filtros reactivos por formato (2D a 5D), buscador en tiempo real mediante Signals y cálculo de películas más vendidas.
* **Sprint 3 – Detalle y Reseñas:** Ficha técnica pre-reserva, cálculo dinámico de puntuación en estrellas y persistencia de comentarios en base de datos.
* **Sprint 4 – Motor de Salas y Reserva:** Renderizado geométrico de la sala (20 filas x 28 butacas con distribución 4-20-4), marcado de asientos adaptados (J, K) y butacas VIP (+30% en filas R, S, T) con control de ocupación.
* **Sprint 5 – Checkout Unificado (Candy Bar + Cupones):** Catálogo de confitería integrado en la orden, motor de validación de cupones (bienvenida y mayores de 50 años), emisión de PDF con `jspdf` y renderizado de QR único.
* **Sprint 6 – Panel Operativo y Auditoría:** Terminal de validación de entradas para operadores, quema definitiva de QR consumidos y log de auditoría en base de datos.
* **Sprint 7 – Cancelaciones y Fidelización:** Sección "Mis Películas" con balance de puntos (+1 por peso), historial visual y cancelación con devolución de crédito si faltan 2 horas o más.
* **Sprint 8 – Administración, Métricas y PWA:** Asignación automática de salas con ventana de limpieza, exportación de reportes a PDF y Excel, y configuración del Service Worker para despliegue productivo.

---

## 7. Matriz de Datos del Usuario (Registro Excéntrico)

Para dar estricto cumplimiento a la solicitud de recopilación no invasiva exigida en el correo del 01/01/2020, la entidad `perfiles` almacena:
1. `nombre` y `apellido`
2. `email` (vínculo Auth)
3. `fecha_nacimiento` (para control de restricciones ATP/+13/+18 y cupones +50)
4. `tipo_sangre` (A+, A-, B+, B-, AB+, AB-, O+, O-)
5. `color_ojos` (Marrones, Azules, Verdes, Miel, Negros)
6. `dias_vacaciones` (Valor entero anual)
7. `credito` (Saldo acumulado por cancelaciones)
8. `puntos` (Balance de fidelización)
---

