# plan.md — Orbital Velocity Lander (Simulador Arcade 2D)

> **Estado del Subproyecto:** 🟢 Completado  
> **Categoría:** 🎮 Juegos / 🪐 Simuladores  
> **Fecha de creación:** 2026-08-10  
> **Tecnologías:** HTML5 Canvas 2D, Physics Vector Engine, Vanilla CSS (HSL), JavaScript ES6+

---

## 📌 Resumen del Proyecto

**Orbital Velocity Lander** es un juego de simulación física y destreza arcade 2D en el que el jugador pilota un módulo de descenso espacial a través de atmósferas hostiles y campos de gravedad variables. Inspirado en los clásicos *Lunar Lander*, lleva la experiencia a un nivel moderno con físicas vectoriales de inercia, fricción atmosférica, gestión precisa de combustible, vientos cruzados y aterrizajes de alta precisión en plataformas estrechas situadas en acantilados alienígenas generados por curvas Bézier procedimentales.

---

## 🎯 Objetivos Principales

- [x] **Fase 1: Arquitectura y Sistema de Diseño (CSS / UI)**
  - [x] Diseñar una interfaz de telemetría de vuelo futurista (altímetro, indicador de velocidad vertical/horizontal, nivel de combustible, inclinación).
  - [x] Aplicar diseño con HSL (tema espacio profundo --hue-space: 220, indicador de alerta --hue-warning: 15).
  - [x] Añadir soporte para pantallas de alta densidad (Retina Display DPI scaling en Canvas).

- [x] **Fase 2: Motor de Físicas y Terreno Procedimental**
  - [x] Implementar motor de físicas 2D vectorial (Vectores de posición, velocidad, aceleración, gravedad planetaria y torque de rotación).
  - [x] Desarrollar generador de terreno procedimental con curvas Bézier y trazado de plataformas de aterrizaje con multiplicadores de puntos.
  - [x] Implementar la detección de colisiones píxel-perfect o polígono-polígono entre el tren de aterrizaje y el terreno.
  - [x] Calcular la tolerancia de impacto (Velocidad vertical < V_max y Ángulo < Deg_max) para determinar Aterrizaje Exitoso vs. Explosión.

- [x] **Fase 3: FX Visuales, Audio & Controles**
  - [x] Diseñar efectos de fuego de propulsores secundarios y principal mediante emisor de partículas dinámico.
  - [x] Implementar cámara suave que realice Zoom-In automático al aproximarse a la plataforma de aterrizaje.
  - [x] Integrar sonido sintético de propulsores con variación de pitch y volumen mediante la Web Audio API.

- [x] **Fase 4: Modos de Juego y Persistencia**
  - [x] Crear Modo Carrera con niveles de dificultad creciente (plataforma más estrecha, viento más fuerte, tolerancias de impacto más estrictas) y avance progresivo nivel a nivel.
  - [x] Sistema de puntuación acumulativa con multiplicador de nivel (combustible restante × nivel).
  - [x] Optimizar respuesta de controles tanto en teclado (Flechas/WASD) como en controles táctiles para dispositivos móviles.

---

## 🏗️ Arquitectura del Proyecto

- **Patrón arquitectónico:** SPA Canvas 2D con bucle de animación y física vectorial desacoplada.

`	ext
orbital-velocity-lander/
├── index.html          # HTML principal y superposición de HUD de telemetría
├── css/
│   └── style.css       # Estilos estéticos de aviónica y marco espacial
├── js/
│   ├── app.js          # Control de estados del juego y bucle físico
│   ├── physics.js      # Integrador de físicas vectoriales y fuerzas
│   ├── terrain.js      # Generación de superficie planetaria y plataformas
│   ├── lander.js       # Entidad del módulo de aterrizaje y propulsores
│   ├── particles.js    # Emisor de partículas para propulsión y explosiones
│   └── audio.js        # Sintetizador de audio de motores espaciales
├── assets/             # Texturas y fuentes espaciales
└── plan.md             # Documentación y plan del proyecto
`

---

## 🧠 Paradigma de Programación

- **Híbrido: Orientado a Objetos (POO) + Imperativo / Motor Físico + Event-Driven**
- Clases para módulo de descenso (Lander), partículas (ParticleEmitter) y terreno procedural (Terrain). Bucle de simulación por frame e interacción por eventos de teclado y touch.

---

## 🌐 Propósito de Visibilidad y Destino Remoto

- **Visibilidad**: Público (Open Source / Portafolio).
- **Plataforma Remota Asignada**: GitHub.
- **Plataforma de Despliegue CI/CD**: GitHub Pages / Cloudflare Pages.
- **Justificación**: Juego arcade de simulación de físicas orbitales 2D sin backend ni credenciales privadas, excelente para el portafolio público y despliegue estático.

---

## 📊 Estado actual

🟢 **Completado** — 17 tareas completadas, 0 pendientes (sincronizado en auditoría 2026-10-03).
