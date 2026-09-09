# 🎬 ProgramacionIVTP1 – Sistema de Cine

Aplicación web para la gestión de un cine, desarrollada con **Angular**, **Supabase** y **PWA**.  
Permite a los clientes comprar entradas y productos del Candy Bar, y a los administradores gestionar funciones, salas, cupones, puntos y reportes.

## 🚀 Tecnologías
- **Frontend:** Angular 22 (standalone components, signals, lazy loading)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Infraestructura:** Vercel / Render (CI/CD con GitHub)
- **Extras:** Chart.js, jsPDF, QRCode.js, Service Workers (PWA)

## 🧱 Arquitectura
- **Frontend (Angular + PWA):** módulos de Películas, Entradas, Candy Bar, Usuario, Admin
- **Backend (Supabase):** autenticación, API REST, lógica de negocio
- **Base de Datos (PostgreSQL):** tablas de usuarios, películas, funciones, entradas, productos, cupones, reseñas, etc.

📊 Diagramas completos en `/docs/diagrams/`

## Características principales / lógica de negocio

Asignación automática de salas

Restricción de edad en compra de entradas

Preventa con precio especial

Cancelación con crédito en cuenta

Sistema de puntos de fidelización

QR único para entradas y Candy Bar

Reportes y logs administrativos

## 🔧 Instalación
```bash
git clone https://github.com/<usuario>/cine-app.git
cd cine-app
npm install
ng serve
```

## 📄 Licencia

Proyecto académico – UTN-FRA, Programación IV.
---
