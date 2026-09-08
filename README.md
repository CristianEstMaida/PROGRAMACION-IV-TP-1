# ProgramacionIVTP1

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# PROGRAMACION-IV-TP-1
🏗️ Arquitectura del Sistema de Cine
1. Visión General
La aplicación se divide en tres capas principales:

Frontend (Angular + PWA)

Interfaz de usuario única y producida.

Selección de butacas en tiempo real.

Módulos: Películas, Entradas, Candy Bar, Perfil, Admin.

PWA: instalación en dispositivos, notificaciones push (estrenos, preventa).

Backend (Supabase + API REST)

Base de datos PostgreSQL.

Autenticación y roles (cliente, empleado, admin).

Servicios: gestión de películas, funciones, usuarios, cupones, puntos, productos.

Generación de QR y validación.

Lógica de negocio: asignación automática de salas, restricciones de edad, créditos por cancelación.

Infraestructura (Despliegue + CI/CD)

Hosting en Vercel/Render.

Integración continua con GitHub.

Monitoreo de logs y métricas.

2. Componentes Principales
🎬 Módulo Películas
Listado con buscador y filtros por género.

Top 3 más vendidas en portada.

Sección “Próximamente” con alertas y preventa.

Sistema de reseñas y puntuación promedio.

Historial “Mis películas” con calificación personal.

🎟️ Módulo Entradas
Selección de sala y horario.

Mapa de butacas en tiempo real (normales, accesibles, VIP).

Generación de PDF + QR.

Cancelación con crédito en cuenta.

🍿 Módulo Candy Bar
Catálogo de productos por categoría.

Compra junto con entrada.

Combos configurables y destacados.

QR único para retirar productos.

👤 Módulo Usuario
Registro con datos solicitados.

Perfil con puntos de fidelización, créditos, historial de compras.

Cupones configurables.

🔧 Módulo Admin
Gestión de películas, funciones, salas, productos, cupones, combos.

Asignación automática de salas.

Validación de QR (lector o manual).

Reportes: facturación, ventas, exportación PDF/Excel.

Gráficos de películas más vistas y productos más vendidos.

Log de actividad con fecha y hora.

3. Flujo de Datos
Cliente → selecciona película, horario y butacas → compra entrada/productos → se genera QR + PDF → se guarda en Supabase.

Empleado → escanea QR → valida entrada/productos → Supabase marca como consumido.

Admin → configura películas, horarios, cupones, combos → consulta reportes y logs.

Sistema → asigna salas automáticamente, controla restricciones de edad, gestiona puntos de fidelización.

4. Tecnologías Clave
Angular: componentes standalone, signals, buenas prácticas.

Supabase: base de datos, autenticación, almacenamiento.

PWA: instalación, notificaciones push.

CI/CD: GitHub + Vercel/Render.

PDF/QR: librerías de generación y validación.

Charts: librerías para reportes gráficos (ej. Chart.js).

🎬 Sistema de Cine – Documentación Técnica
📘 Descripción General
Aplicación web completa para la gestión de un cine, desarrollada con Angular, Supabase y PWA, que permite a los clientes comprar entradas y productos, y a los administradores controlar funciones, salas, usuarios y reportes.
Incluye lógica de negocio avanzada, integración con QR, fidelización, preventa y reportes automáticos.

🧱 Arquitectura del Sistema
🔹 Frontend
Framework: Angular 17 (componentes standalone, signals, lazy loading).

Diseño: UI personalizada, accesible y responsiva.

Módulos principales:

Películas (listado, reseñas, buscador, próximos estrenos).

Entradas (selección de butacas en tiempo real, PDF + QR).

Candy Bar (productos, combos, compra conjunta).

Usuario (perfil, puntos, créditos, historial).

Admin (gestión completa, reportes, logs).

PWA: instalación en dispositivos, notificaciones push para alertas de preventa y estrenos.

🔹 Backend
Plataforma: Supabase (PostgreSQL + Auth + Storage).

Servicios:

Autenticación y roles (cliente, empleado, admin).

API REST para películas, funciones, productos, cupones, puntos y reseñas.

Generación y validación de QR.

Asignación automática de salas sin solapamiento.

Control de edad, preventa y cancelaciones.

🔹 Infraestructura
Despliegue: Vercel o Render.

CI/CD: GitHub Actions para build y deploy automáticos.

Monitoreo: logs de actividad y métricas de uso.

🗃️ Modelo de Datos (ER)
El modelo entidad–relación incluye las siguientes tablas principales:

Usuarios, Películas, Funciones, Salas, Butacas, Entradas, Productos, Combos, Cupones, Reseñas, Canjes, Logs.

Relaciones N:M entre películas y géneros, funciones y butacas, usuarios y cupones.

Integridad referencial garantizada mediante claves foráneas y triggers automáticos.

📊 Ver diagrama completo en la carpeta /docs/diagrams/ER.png.

⚙️ Lógica de Negocio
Funcionalidad	Descripción
Asignación automática de salas	Evita solapamiento de funciones.
Restricción de edad	Bloquea compra según edad mínima.
Preventa	Precio especial 7 días antes del estreno.
Cancelación	Hasta 2 horas antes, genera crédito.
Fidelización	1 punto por peso gastado, canje configurable.
QR único	Para entrada y productos del Candy Bar.
Reportes	Facturación diaria, películas más vistas, productos más vendidos.
Logs	Registro de acciones administrativas con fecha y hora.


💅 Estilo Visual
Diseño único y producido, con identidad de marca del cine.

UX optimizada: sin scroll excesivo, formularios intuitivos, colores contrastantes.

Accesibilidad: soporte para butacas adaptadas y visualización clara de VIP.

🚀 Despliegue
🔧 Requisitos
Node.js 18+

Angular CLI

Cuenta Supabase

GitHub configurado para CI/CD

🔨 Pasos
Clonar el repositorio:

bash
git clone https://github.com/<usuario>/cine-app.git
cd cine-app
Instalar dependencias:

bash
npm install
Configurar variables de entorno (.env):

Código
SUPABASE_URL=
SUPABASE_KEY=
Ejecutar en desarrollo:

bash
ng serve
Desplegar en Vercel o Render (CI/CD automático).

🧠 Decisiones Técnicas
Angular Signals para manejo reactivo de estado.

Supabase Auth para autenticación y roles.

Supabase Storage para imágenes y PDFs.

Chart.js para reportes gráficos.

PDFKit / jsPDF para generación de entradas.

QRCode.js para códigos QR.

Service Workers para PWA y notificaciones.

# 🎬 Sistema de Cine

Aplicación web completa para la gestión de un cine, desarrollada con **Angular**, **Supabase** y **PWA**.  
Permite comprar entradas, productos del Candy Bar, gestionar funciones, cupones, puntos y reportes administrativos.

---

## 🚀 Tecnologías
- **Frontend:** Angular 17 (standalone components, signals, lazy loading)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Infraestructura:** Vercel / Render (CI/CD con GitHub)
- **Extras:** Chart.js, jsPDF, QRCode.js, Service Workers (PWA)

---

## 🧱 Arquitectura
- **Frontend (Angular + PWA):**
  - Módulos: Películas, Entradas, Candy Bar, Usuario, Admin
  - PWA con notificaciones push y modo offline
- **Backend (Supabase):**
  - Autenticación y roles (cliente, empleado, admin)
  - API REST para películas, funciones, productos, cupones, puntos y reseñas
  - Lógica de negocio: asignación automática de salas, restricciones de edad, preventa, cancelaciones
- **Base de Datos (PostgreSQL):**
  - Tablas: Usuarios, Películas, Funciones, Salas, Butacas, Entradas, Productos, Combos, Cupones, Reseñas, Canjes, Logs

📊 Diagrama ER: `/docs/diagrams/ER.png`  
🏗️ Diagrama de arquitectura: `/docs/diagrams/architecture.png`

---

## ⚙️ Lógica de Negocio
| Funcionalidad | Descripción |
|----------------|-------------|
| Asignación automática de salas | Evita solapamiento de funciones |
| Restricción de edad | Bloquea compra según edad mínima |
| Preventa | Precio especial 7 días antes del estreno |
| Cancelación | Hasta 2 horas antes, genera crédito |
| Fidelización | 1 punto por peso gastado, canje configurable |
| QR único | Para entrada y productos del Candy Bar |
| Reportes | Facturación, películas más vistas, productos más vendidos |
| Logs | Registro de acciones administrativas |

---

## 💅 Estilo Visual
- Diseño único y producido
- UX intuitiva y accesible
- Visualización clara de butacas accesibles y VIP

---

## 🔧 Instalación
```bash
git clone https://github.com/<usuario>/cine-app.git
cd cine-app
npm install
Configurar variables de entorno:

Código
SUPABASE_URL=
SUPABASE_KEY=
Ejecutar en desarrollo:

bash
ng serve
Desplegar en Vercel o Render (CI/CD automático).

🧠 Decisiones Técnicas
Angular Signals para manejo reactivo

Supabase Auth y Storage

Chart.js para reportes

jsPDF + QRCode.js para generación de entradas

Service Workers para PWA

🗣️ Defensa Oral
Justificar elección de Angular y Supabase

Explicar asignación automática de salas

Mostrar manejo en tiempo real de butacas

Destacar arquitectura modular y buenas prácticas

Presentar reportes y logs como evidencia de control

📄 Licencia
Proyecto académico – UTN-FRA, Programación IV.
