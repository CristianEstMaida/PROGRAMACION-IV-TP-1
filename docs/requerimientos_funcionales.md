# Documento de Especificación de Requerimientos del Sistema (SRS) - CineNova

## 1. Introducción y Alcance
El presente documento consolida la totalidad de los requerimientos de negocio, funcionales y operativos del sistema cinematográfico CineNova, formalizados a través de los requerimientos enviados por el cliente entre el 01/01/2020 y el 10/03/2020.

El sistema comprende una plataforma web integral orientada tanto al cliente final (compra de entradas, preventa, confitería y beneficios) como al personal operativo y de administración (control de salas, auditoría, validación de acceso y reportes de gestión).

---

## 2. Requerimientos Funcionales (RF)

### Módulo Clientes, Búsqueda y Películas
- **RF01 - Portada y Podio Top 3:** La pantalla principal debe destacar en primer lugar las 3 películas históricamente más vendidas del complejo.
- **RF02 - Visualización y Formatos de Cartelera** Mostrar el listado completo de películas en cartelera con filtros dinámicos por tecnología/formato (2D, 3D, 4D y 5D) e idioma (Castellano / Subtitulada).
- **RF03 - Buscador y Filtro Multigénero:** Buscador en tiempo real por título y filtro combinable por géneros cinematográficos. El sistema debe admitir que una misma película posea múltiples géneros (ej: Acción + Ciencia Ficción).
- **RF04 - Sección Próximamente y Suscripción a Alertas:** Catálogo de películas a estrenarse en las próximas semanas, permitiendo a los clientes registrados activar una alerta para recibir una notificación cuando se habiliten las funciones para la venta.
- **RF05 - Motor de Preventa (7 Días):** Habilitar la venta anticipada de entradas con hasta 7 días de antelación al estreno oficial con un precio diferencial de preventa. Cumplido el plazo de preventa, el precio debe retornar de forma automática al valor regular de la entrada. Esta regla es configurable de forma individual película por película.
- **RF06 - Ficha Técnica y Sistema de Reseñas Pre-Reserva: ** Cada película debe exhibir póster, duración, sinopsis, clasificación etaria y la puntuación promedio en estrellas. El usuario debe poder consultar opiniones y calificaciones de otros clientes antes de iniciar la compra. Los usuarios autenticados pueden calificar (1 a 5 estrellas) y publicar comentarios breves.

### Usuarios, Registro y Beneficios
- **RF07 - Venta Anónima y Venta Registrada:** El flujo de compra debe permitir operar tanto a usuarios anónimos (sin requerir autenticación previa) como a usuarios registrados.
- **RF08 - Formulario de Registro con Perfil Extendido: ** Captura no invasiva de datos personales exigidos por el negocio: Nombre, Apellido, Email, Fecha de Nacimiento, Tipo de Sangre (A+, A-, B+, etc.), Color de Ojos y Cantidad de Días de Vacaciones anuales.
- **RF09 - Control de Restricción Etaria: ** 
  - Validación automática de edad según fecha de nacimiento para películas con clasificación (+13 y +18). Si el usuario logueado no cumple la edad mínima, la compra queda bloqueada.
  - Para compras anónimas, el sistema debe solicitar confirmación obligatoria de presencia de adulto responsable.
  - Todo comprobante o entrada emitida para estas funciones debe incluir obligatoriamente la leyenda: "Debe asistir acompañado por un adulto responsable".
- **RF10 - Cupones Dinámicos de Descuento: **
  - Cupón de Bienvenida: Descuento configurable (inicialmente 20%) aplicable de forma automática o mediante código únicamente en la primera compra de un usuario registrado.
  - Cupones Senior (+50 años): Motor de cupones parametrizables aplicables exclusivamente a clientes con edad igual o superior a 50 años.
- **RF11 - Programa de Fidelización y Puntos (a completar): ** 
  - Acumulación de 1 punto por cada $1 (peso) abonado en transacciones de usuarios registrados. Los puntos son personales e intransferibles.
  - Catálogo de Canjes: Sección en el perfil del cliente donde se pueden canjear puntos acumulados por entradas gratuitas o productos/combos del Candy Bar.
  - Historial de Puntos: Consulta del saldo total acumulado y registro cronológico de canjes efectuados.
- **RF12 - Sección "Mis Películas" y Cancelaciones a Crédito: ** 
  - Historial visual de funciones a las que asistió el usuario, exhibiendo pósters, fechas y su propia calificación emitida.
  - Cancelación con Reintegro a Saldo: El cliente puede anular una entrada hasta 2 horas antes de la hora de inicio de la función. El sistema no realiza devolución monetaria tradicional, sino que acredita el 100% del importe en la billetera virtual (crédito en cuenta) del usuario para consumirlo en compras futuras. Si restan menos de 2 horas, la opción se deshabilita.

### Sala, Butacas y Candy Bar
- **RF13 - Topología de Salas y Butacas Adaptadas: ** 
  - Estructura estándar de sala: 20 filas (letras A a T) divididas en 3 bloques de 4, 20 y 4 butacas.
  - Espacio Accesible (Movilidad Reducida): Las filas centrales J y K se reemplazan por una disposición adaptada con distribución de menor densidad: 2, 10 y 2 butacas, destacadas visualmente en el plano.
  - Sector VIP: Las últimas tres filas de la sala (R, S y T) se clasifican como butacas VIP, con un recargo automático del 30% sobre el precio base de la entrada y señalización diferenciada en el mapa.
  - Visualización en Tiempo Real: Bloqueo y actualización visual inmediata de butacas ocupadas para impedir colisiones o compras duplicadas simultáneas.
- **RF14 - Integración de Candy Bar en Checkout: ** 
  - Catálogo categorizado de confitería (pochoclos, bebidas, golosinas, snacks y combos).
  - Posibilidad de añadir alimentos y bebidas a la misma orden antes de finalizar el pago.
- **RF15 - Combos Especiales (Entrada + Candy):** Configuración de paquetes cerrados promocionales compuestos por Entrada + Pochoclos + Bebida a precio fijo preestablecido.
- **RF16 - Comprobante Unificado con QR: ** Generación y descarga en formato PDF del comprobante que contiene el desglose de entradas, butacas, artículos de Candy Bar y un único código QR consolidado para todo el pedido.

### Operaciones y Control de Acceso
- **RF17 - Terminal de Validación de Operador: (a completar)** Interfaz para que los empleados del cine verifiquen el ingreso a la sala y la entrega de productos de confitería mediante lector de QR o tipeo manual del código alfanumérico.
- **RF18 - Quema Definitiva de Ticket: ** Al validar el ingreso o entregar los productos, el código QR y la entrada pasan a estado "Usada", impidiendo cualquier reutilización posterior y alertando en pantalla si se intenta un segundo ingreso fraudulento.

### Administración y Métricas

- **RF19 - Asignación Automatizada de Salas: ** Al dar de alta una función (película, día, horario, formato), el sistema asigna de forma autónoma una sala disponible garantizando una ventana técnica de descanso y limpieza de al menos 30 minutos posteriores al término de la función anterior. Si hay solapamiento, se notifica el conflicto de disponibilidad.
- **RF20 - Gestión de Precios y Configuración de Recompensas: ** Administración de precios de entradas, porcentaje del cupón de bienvenida, cupones etarios, valor en puntos de las recompensas de fidelización y precios de combos.
- **RF21 - Reportes de Facturación y Gráficos Estadísticos: **
  - Reporte diario de facturación total y cantidad de tickets vendidos, con exportación a PDF y a Excel.
  - Gráfico de las películas más vistas discriminadas por semana y por mes.
  - Reporte estadístico del producto del Candy Bar con mayor volumen de ventas.
- **RF22 - Log de Auditoría Operativa: ** Registro cronológico inmutable de eventos críticos administrativos (alta de funciones, modificación de precios, validación de accesos) registrando fecha, hora, usuario interviniente y detalle del cambio, con soporte de navegación paginada.

---

## 3. Requerimientos No Funcionales (RNF)

- **RNF01 - Usabilidad y Cero Scroll en Formularios:** Formularios de carga y selectores de horario sin scrolls redundantes ni campos de búsqueda engorrosos.
- **RNF02 - Consistencia Visual e Identidad:** Paleta oscura cinematográfica uniforme, tipografía *Outfit*, tarjetas con bisel e iluminación sutil, sin controles desalineados.
- **RNF03 - Progressive Web App (PWA):** Cumplimiento de manifest y Service Worker activo para carga rápida e instalación.
- **RNF04 - Restricción de Dominio y Seguridad:** Roles diferenciados (`admin`, `operador`, `cliente`) controlados por Guards y políticas de base de datos.

---

## 4. Casos de Uso y Flujos de Negocio

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
