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
### Tablas principales
- **Películas**: id, título, género, duración, descripción.
- **Funciones**: id, película_id, sala_id, fecha, hora.
- **Salas**: id, nombre, capacidad.
- **Butacas**: id, sala_id, número, estado.
- **Entradas**: id, función_id, usuario_id, butaca_id.

### Relaciones
- Una película tiene muchas funciones.
- Una sala tiene muchas butacas.
- Una función se vincula a una sala y a una película.
- Una entrada se vincula a una función y a una butaca.

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