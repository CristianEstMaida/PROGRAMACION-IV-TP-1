# Documento de Especificación de Requerimientos - CineApp (CineNova)

## 1. Introducción y Objetivos
El presente documento consolida la totalidad de requerimientos funcionales, reglas de negocio y restricciones técnicas solicitadas por el cliente a través del intercambio de correspondencia formal para el desarrollo del sistema cinematográfico **CineNova**.

---

## 2. Requerimientos Funcionales (RF)

### Módulo Clientes y Cartelera
- **RF01 - Visualización de Cartelera:** Listar películas en exhibición con filtro dinámico por formato (2D, 3D, 4D, 5D) y buscador por texto en tiempo real.
- **RF02 - Podio Top 3:** Destacar en la portada las 3 películas con mayor cantidad de entradas vendidas históricas.
- **RF03 - Próximos Estrenos y Alertas:** Listar lanzamientos futuros permitiendo a los clientes registrados suscribir recordatorios de preventa.
- **RF04 - Sistema de Reseñas Pre-Reserva:** Permitir consultar sinopsis, ficha técnica y opiniones con calificación de 1 a 5 estrellas antes de avanzar a la compra. Los usuarios logueados pueden emitir comentarios.
- **RF05 - Venta Anónima y Registrada:** Permitir comprar entradas a usuarios anónimos y a usuarios autenticados.

### Módulo de Reserva y Transacción
- **RF06 - Mapa de Butacas Físico:** Renderizar 20 filas (A-T) con división de 3 columnas (4 - 20 - 4).
  - Resaltar visualmente butacas adaptadas para personas con discapacidad en filas J y K.
  - Resaltar butacas VIP en las últimas tres filas (R, S, T) aplicando un recargo del 30%.
  - Ocupación en tiempo real: bloquear selección de asientos previamente vendidos.
- **RF07 - Integración de Candy Bar:** Permitir agregar alimentos, bebidas y combos a la orden antes del pago.
- **RF08 - Motor de Cupones:** 
  - Validar cupón de bienvenida (20%) solo si el usuario no posee compras previas.
  - Validar cupones de adultos mayores validando si el cliente tiene $\ge 50$ años.
- **RF09 - Emisión de Ticket PDF y QR:** Descarga automática de un comprobante en PDF con datos de función, asientos, lista de Candy Bar y un código QR único para todo el pedido.
- **RF10 - Cancelación de Entradas:** El usuario puede cancelar su entrada desde "Mis Películas" hasta 2 horas antes de la función. El importe se abona automáticamente como crédito en su perfil.
- **RF11 - Programa de Puntos:** Acreditar 1 punto por cada peso abonado a clientes registrados.

### Módulo de Operadores y Empleados
- **RF12 - Validador de QR y Código:** Terminal operativa para validar el ingreso a sala y entrega de Candy Bar mediante escaneo o ingreso manual del código.
- **RF13 - Invalidation (Quema) de Ticket:** Al validar, el sistema marca el ticket como usado impidiendo cualquier reutilización posterior.

### Módulo de Administración
- **RF14 - Asignación Automática de Salas:** Al dar de alta una función (película, fecha, horario), el sistema verifica automáticamente la disponibilidad de salas garantizando una ventana de descanso y limpieza de al menos 30 minutos tras finalizar la proyección anterior.
- **RF15 - ABM de Recursos:** Administración de películas, salas, productos de Candy Bar y cupones de descuento.
- **RF16 - Reportes y Gráficos:** Visualización de métricas de facturación diaria, películas más vistas y productos de confitería con exportación a PDF y Excel.
- **RF17 - Log de Auditoría:** Registro cronológico inmutable de todas las acciones administrativas (creación de funciones, modificación de precios, validación de accesos).

---

## 3. Requerimientos No Funcionales (RNF)

- **RNF01 - Usabilidad y Cero Scroll en Formularios:** Formularios de carga y selectores de horario sin scrolls redundantes ni campos de búsqueda engorrosos.
- **RNF02 - Consistencia Visual e Identidad:** Paleta oscura cinematográfica uniforme, tipografía *Outfit*, tarjetas con bisel e iluminación sutil, sin controles desalineados.
- **RNF03 - Progressive Web App (PWA):** Cumplimiento de manifest y Service Worker activo para carga rápida e instalación.
- **RNF04 - Restricción de Dominio y Seguridad:** Roles diferenciados (`admin`, `operador`, `cliente`) controlados por Guards y políticas de base de datos.

---

## 4. Matriz de Datos del Usuario (Registro Excéntrico)

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

## 5. Casos de Uso y Flujos de Negocio

### CU01 - Adquisición de Entradas y Candy Bar (Cliente / Anónimo)
* **Actor:** Cliente autenticado o Usuario anónimo.
* **Precondición:** Existe al menos una función activa en cartelera con butacas disponibles.
* **Flujo Principal:**
  1. El usuario visualiza la cartelera en el Home y selecciona una película.
  2. El sistema redirige a la vista de detalle (`/movie/:id`) mostrando sinopsis, duración, formato y promedio de reseñas previas.
  3. El usuario avanza a la sala de reservas (`/reserve/:id`).
  4. Selecciona formato/horario y elige una o más butacas en el mapa interactivo (estándar, adaptadas o VIP).
  5. Agrega opcionalmente productos y combos del Candy Bar.
  6. Ingresa un cupón de descuento (`BIENVENIDA20` o `SENIOR50`) o selecciona la opción de abonar con crédito en cuenta si posee saldo.
  7. Confirma el pago: el sistema persiste la reserva, acredita puntos de fidelización (si está logueado) y genera el archivo PDF descargable con el código QR unificado.
* **Flujos Alternativos / Reglas de Excepción:**
  * **Restricción de edad (+13, +18):** Si el usuario anónimo compra una función restringida, el sistema exige confirmación explícita de acompañamiento adulto. Si es un usuario logueado menor a la edad estipulada, se bloquea la confirmación.
  * **Cupón inválido o reutilizado:** Si el cupón de bienvenida ya fue utilizado en compras previas por ese usuario, el sistema notifica el rechazo sin interrumpir el flujo de compra.

---

### CU02 - Cancelación de Entradas con Devolución en Crédito (Cliente)
* **Actor:** Cliente autenticado.
* **Precondición:** La entrada debe encontrarse en estado `validada`.
* **Flujo Principal:**
  1. El cliente ingresa a su sección personal (`/mis-peliculas`).
  2. Selecciona la entrada que desea anular y pulsa "Cancelar Reserva".
  3. El sistema evalúa la marca de tiempo de la función contra la hora actual:  
     $$\text{Diferencia} = \text{Fecha/Hora Función} - \text{Fecha/Hora Actual}$$
  4. Si la diferencia es de 2 horas o más, la entrada cambia a estado `cancelada` y se libera la butaca física para la venta.
  5. El importe total abonado por esa entrada se suma automáticamente a la columna `credito` del perfil del cliente.
  6. Se genera un registro de auditoría en el log general del sistema.
* **Flujo Alternativo:**
  * Si la diferencia es menor a 2 horas, el botón de cancelación se inhabilita indicando que venció el plazo reglamentario de cancelación.

---

### CU03 - Control de Acceso y Quema de Tickets (Operador / Empleado)
* **Actor:** Empleado con rol `operador` o `admin`.
* **Precondición:** La entrada existe en la base de datos central de Supabase.
* **Flujo Principal:**
  1. El operador accede a `/admin/validar-qr`.
  2. Escanea el código QR del cliente o ingresa manualmente la cadena alfanumérica del ticket.
  3. El sistema busca el registro en `entradas`:
     * Si `estado == 'validada'`: concede el acceso, cambia el estado a `usada` y registra el log de auditoría con la identidad del operador y la hora del evento.
* **Flujos Alternativos:**
  * **Ticket ya utilizado:** Si `estado == 'usada'`, el sistema emite una alerta roja bloqueando el ingreso por intento de duplicación de entrada.
  * **Ticket cancelado:** Si `estado == 'cancelada'`, notifica que la reserva fue anulada previamente con reembolso a crédito.

---

### CU04 - Programación con Asignación Automática de Salas (Administrador)
* **Actor:** Usuario con rol `admin`.
* **Flujo Principal:**
  1. El administrador ingresa a `/admin/funciones`.
  2. Selecciona película, fecha de proyección, hora de inicio, formato y precio por entrada.
  3. El motor de asignación busca entre todas las salas del complejo cuál no presenta superposición de horarios, considerando:  
     $$\text{Ventana de Ocupación} = \text{Hora Inicio} + \text{Duración Película} + 30\text{ min (limpieza)}$$
  4. Encuentra la primera sala disponible, la asigna automáticamente y persiste la función en estado `activa`.
  5. Se emite un aviso con el nombre de la sala asignada y se añade la operación al log de actividad.
* **Flujo Alternativo:**
  * Si ninguna sala tiene espacio en esa franja horaria respetando los 30 minutos de limpieza, el alta es rechazada indicando conflicto de disponibilidad.

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