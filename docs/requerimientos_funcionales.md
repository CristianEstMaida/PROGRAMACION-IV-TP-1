# Requerimientos Funcionales - CineApp

## 1. Introducción
Este documento describe las funcionalidades que el sistema CineApp debe ofrecer a clientes y administradores.  
Se detallan los requerimientos funcionales y no funcionales, junto con casos de uso y flujo de negocio.

---

## 2. Requerimientos Funcionales
- Alta/Baja/Modificación de películas (ABM).
- Visualización de cartelera y detalle de película.
- Gestión de funciones (fecha, hora, sala).
- Administración de salas y butacas.
- Compra de entradas vinculadas a funciones.
- Restricción de edad en compra de entradas.
- Preventa con precio especial.
- Cancelación con crédito en cuenta.
- Sistema de puntos de fidelización.
- QR único para entradas y Candy Bar.
- Reportes y logs administrativos.

---

## 3. Requerimientos No Funcionales
- Formularios sin scroll.
- Botones sin gradiente.
- Estilos propios (no usar librerías externas para datepicker).
- Consistencia visual entre login y register.
- Tipografía consistente en toda la aplicación.

---

## 4. Casos de Uso
### Cliente
- Registrarse e iniciar sesión.
- Visualizar cartelera y detalle de película.
- Seleccionar función y butaca.
- Comprar entradas y productos del Candy Bar.
- Usar puntos de fidelización.
- Recibir QR único para validar compras.

### Administrador
- Gestionar películas, funciones, salas y butacas.
- Administrar cupones y promociones.
- Visualizar reportes y logs.
- Monitorear capacidad de salas y ocupación de butacas.

---

## 5. Flujo de Negocio
1. El cliente accede al login/register.
2. Visualiza cartelera y selecciona película.
3. Elige función y butaca.
4. Realiza compra (entrada o Candy Bar).
5. Recibe QR único para validación.
6. El administrador gestiona películas, funciones, salas y reportes.

---

## 6. Alcance
El sistema cubre tanto la experiencia del cliente (compra de entradas y productos) como la del administrador (gestión de recursos y reportes).  
No se incluyen integraciones externas más allá de Supabase y servicios propios de la aplicación.


---

## 7. Sprints Funcionales

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