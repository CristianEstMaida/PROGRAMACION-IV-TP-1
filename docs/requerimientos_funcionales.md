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