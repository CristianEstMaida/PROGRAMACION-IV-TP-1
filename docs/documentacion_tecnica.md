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

## 7. Sprints Técnicos

### Sprint 1
- **Objetivo**: Alta de película (ABM básico).
- **Entregables**:
  - Formulario de alta de película sin scroll.
  - Pantalla de listado de películas.
- **Decisiones**:
  - Inputs alineados con etiquetas.
  - No usar datepicker, campo fecha con input propio.
- **Mockup**: [link a Figma]

---

### Sprint 2
- **Objetivo**: Login/Register + Home.
- **Entregables**:
  - Pantallas de login y register con fondo consistente.
  - Home con listado de películas.
- **Decisiones**:
  - Uso de la misma imagen de fondo en login/register.
  - Botón ingresar sin gradiente.
- **Mockup**: [link a Figma]

---

### Sprint 3
- **Objetivo**: Servicios y base de datos inicial.
- **Entregables**:
  - Implementación de `MovieService` y `AuthService`.
  - Creación de tablas Películas y Usuarios en Supabase.
- **Decisiones**:
  - Postgres como motor de BD por integración nativa con Supabase.
  - Separación de servicios para modularidad.
- **Mockup**: [captura de esquema BD]

---

### Sprint 4
- **Objetivo**: Funciones, salas y butacas.
- **Entregables**:
  - Pantalla de gestión de funciones (fecha, hora, sala).
  - ABM de salas y butacas.
- **Decisiones**:
  - Relación 1:N entre sala y butacas.
  - Validación de capacidad de sala.
- **Mockup**: [link a Figma]

---

### Sprint 5
- **Objetivo**: Compra de entradas.
- **Entregables**:
  - Pantalla de selección de función y butaca.
  - Implementación de `TicketService`.
- **Decisiones**:
  - Validación de butaca ocupada.
  - Relación entrada-función-butaca.
- **Mockup**: [link a Figma]

---

### Sprint 6
- **Objetivo**: Ajustes de estilos y UX.
- **Entregables**:
  - Formularios sin scroll.
  - Botones sin gradiente.
  - Inputs alineados con etiquetas.
- **Decisiones**:
  - Uso de CSS propio en vez de librerías externas.
- **Mockup**: [capturas de pantalla]

---

### Sprint 7
- **Objetivo**: Documentación completa.
- **Entregables**:
  - Documento técnico actualizado.
  - Capturas de cada sprint.
  - Justificación de decisiones técnicas.
- **Decisiones**:
  - No usar “etc.”, todo documentado explícitamente.
- **Mockup**: [capturas finales]

---

### Sprint 8
- **Objetivo**: Integración final y demo.
- **Entregables**:
  - App funcional con login, cartelera, compra de entradas.
  - Presentación final.
- **Decisiones**:
  - Revisión de consistencia visual.
  - Validación de flujo completo.
- **Mockup**: [demo final]
---

## 7. Documentación
- Capturas de cada sprint.
- Fragmentos de código relevantes.
- Justificación de decisiones técnicas.