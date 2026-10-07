# Sistema de Gestión de Salas de Estudio - Biblioteca (Trabajo Práctico 05)

Aplicación web desarrollada en Node.js y Express que implementa un pipeline robusto de middleware para la gestión y reserva de salas de estudio en una biblioteca.

---

## Características Principales
- **Pipeline de Middleware Personalizado**: 
  - Registro de solicitudes HTTP mediante `morgan`.
  - Generación de un identificador único de solicitud en formato `BIB-XXXX`.
  - Medición del tiempo de procesamiento y duración de cada petición utilizando el evento `finish` de la respuesta.
- **Gestión de Vistas con EJS y Layouts**: Uso de `express-ejs-layouts` para mantener una estructura visual uniforme (`main.ejs`) en toda la aplicación.
- **Validación Robusta de Formularios**: Middleware dedicado a la validación de datos en solicitudes `POST`, asegurando la integridad de los campos, normalización de textos (`trim()`), y control de errores con código HTTP `400` y atributo `role="alert"`.
- **Accesibilidad**: Diseño adaptado con etiquetas asociadas, contraste adecuado y foco visible (`outline`).

---

## Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

---

## Instalación y Configuración

1. Clonar o descargar el proyecto en tu computadora.
2. Abrir la terminal integrada en la carpeta raíz del proyecto.
3. Instalar las dependencias ejecutando el siguiente comando[cite: 2]:
   ```bash
   npm install express ejs express-ejs-layouts morgan