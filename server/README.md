# Mariu 3000 C.A. - Sistema de Gestión de Suministros

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📝 Descripción
Sistema integral de gestión administrativa desarrollado para **Suministros Mariu 3000 C.A.** Este software centraliza el control de inventarios, automatiza el registro de ventas con conversión de divisas y mantiene una auditoría estricta de cada movimiento de stock dentro de la organización.

## 🚀 Tecnologías Principales
* **Framework:** [NestJS](https://github.com/nestjs/nest) (Node.js)
* **Lenguaje:** TypeScript
* **Base de Datos:** MariaDB / MySQL
* **ORM:** TypeORM
* **Autenticación:** Passport JWT
* **Validación:** Class-validator

---

## 🛠️ Configuración e Instalación

### 1. Clonar y preparar el entorno
```bash
# Instalar dependencias
$ npm install
Crea un archivo .env en la raíz del proyecto y configura los siguientes parámetros:
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_clave
DB_DATABASE=mariu_db

JWT_SECRET=tu_clave_secreta_super_segura

## EJECUCUION DEL PROYECTO
# Modo desarrollo (con recarga automática)
$ npm run start:dev

# Modo producción (compilación y ejecución)
$ npm run build
$ npm run start:prod