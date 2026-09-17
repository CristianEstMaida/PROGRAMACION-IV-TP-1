# Documentación Técnica - Trabajo Práctico CineApp

## 1. Introducción
Este documento describe el desarrollo técnico de la aplicación CineApp, incluyendo diseño de interfaz, arquitectura, base de datos y decisiones de implementación.  
El proyecto se trabaja en **sprints semanales**, con entregables incrementales.

---

## 2. Diseño de UI/UX
- Mockups en Figma de pantallas principales:
  - Login / Register
  - Home (cartelera)
  - Detalle de película
  - Compra de entradas
- Decisiones de estilo:
  - Alineación de inputs con etiquetas.
  - Uso de la misma imagen de fondo en login/register.
  - Tipografía consistente.
  - Formularios sin scroll.
  - Botones sin gradiente.
  - CSS propio (sin librerías externas para datepicker).

---

## 3. Arquitectura y Servicios
- **Frontend**: Angular con Signals y componentes standalone.
- **Backend/DB**: Supabase (Auth + Postgres).
- **Servicios**:
  - `MovieService` → gestión de películas.
  - `AuthService` → login/register.
  - `TicketService` → compra de entradas.

---

## 4. Base de Datos
### Tablas

- **Funciones**: id, película_id, sala_id, fecha, hora.
- **Salas**: id, nombre, capacidad.
- **Butacas**: id, sala_id, número, estado.
- **Entradas**: id, función_id, usuario_id, butaca_id.

- **Películas**: id (PK)
  titulo
  sinopsis
  duracion (minutos)
  imagen_url
  formato (2D, 3D, 4D, 5D)
  idioma (Castellano, Subtitulado)
  restriccion_edad (+13, +16, +18, ATP)
  fecha_estreno

- **Géneros**: id (PK)
nombre
Película_Género (N:M)
pelicula_id (FK)
genero_id (FK)

- **Funciones**:
id (PK)
pelicula_id (FK)
sala_id (FK)
fecha
hora
precio
tipo_funcion (normal, preventa)
estado (activa, cancelada)

- **Salas**:
id (PK)
nombre
capacidad

- **Butacas**:
id (PK)
sala_id (FK)
fila
numero
tipo (normal, accesible, VIP)
estado (libre, ocupada, reservada)

- **Entradas**:
id (PK)
funcion_id (FK)
usuario_id (FK, nullable si compra anónima)
butaca_id (FK)
qr_code
pdf_url
estado (pendiente, validada, cancelada)
fecha_compra

- **Usuarios y Fidelización**:
- **Usuarios**:
id (PK)
nombre
apellido
email
fecha_nacimiento
tipo_sangre
color_ojos
dias_vacaciones
rol (cliente, empleado, admin)
puntos (fidelización)
credito (saldo por cancelaciones)

- **Reseñas**-
id (PK)
usuario_id (FK)
pelicula_id (FK)
estrellas (1–5)
comentario
fecha

- **Canjes**:
id (PK)
usuario_id (FK)
tipo_recompensa (entrada, producto)
puntos_usados
fecha

- **Cupones y Promociones**:
- **Cupones**:
id (PK)
nombre
porcentaje_descuento
edad_minima (nullable)
activo
Usuario_Cupon (N:M)
usuario_id (FK)
cupon_id (FK)

- **Combos**:
id (PK)
nombre
precio
descripcion
Combo_Producto (N:M)
combo_id (FK)
producto_id (FK)

- **Candy Bar**:

- **Productos**:
id (PK)
nombre
categoria
precio
imagen_url

- **Compras**:
id (PK)
usuario_id (FK, nullable si anónimo)
fecha
total
estado (pendiente, validada, cancelada)
Compra_Producto (N:M)
compra_id (FK)
producto_id (FK)
cantidad

- **Administración y Reportes**:

- **Logs de Actividad**:
id (PK)
usuario_admin_id (FK)
accion
entidad_afectada
fecha_hora

- **Reportes**:
Facturación diaria
Entradas vendidas por día
Películas más vistas (semana/mes)
Producto más vendido (Candy Bar)

- **Próximos Estrenos y Alertas**:

- **Estrenos**:
id (PK)
pelicula_id (FK)
fecha_estreno
preventa_activa (boolean)
precio_preventa

- **Alertas**:
id (PK)
usuario_id (FK)
pelicula_id (FK)
notificado (boolean)

### Relaciones
- Una película tiene muchas funciones.
- Una sala tiene muchas butacas.
- Una función se vincula a una sala y a una película.
- Una entrada se vincula a una función y a una butaca.
- Un usuario puede tener muchas entradas, reseñas, cupones y canjes.
- Un combo puede incluir muchos productos.
- Una compra puede incluir entradas y productos del candy bar.

---

## 5. Decisiones Técnicas
- Angular Signals para manejo de estado → más simple y reactivo.
- Supabase Auth para autenticación → rápido de integrar.
- Postgres como motor de BD → integración nativa con Supabase.
- Separación de servicios → modularidad y mantenibilidad.
- Estilos propios → mayor control visual y consistencia.
- Formularios sin scroll, botones sin gradiente, inputs alineados con etiquetas.
- Consistencia visual entre login y register.

---

## 7. Documentación
- Capturas de cada sprint.
- Fragmentos de código relevantes.
- Justificación de decisiones técnicas.
