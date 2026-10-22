# Tasks — Mejoras visuales y de contenido (desde el modo revisión)

**Última revisión:** 2026-10-21

Origen: 6 comentarios de la revisora en el modo revisión (specs/011) y el análisis del banco
completo que mostraron que cada comentario era un patrón repetido.

- [x] **1. Los 6 comentarios.** Ecuaciones 6° (MA06 OA11): se quitan las 15 imágenes que solo
      repetían la ecuación (reparto, cajas "?", grupos); se mantienen las 9 de "caja de 6 + 4
      sueltos". Plano 5°: los 2 planos vacíos (eje x y origen) ahora dibujan sus puntos. Triángulo:
      recortado (punto 2). Multiplicación 2°: fútbol pasa a 6 equipos × 5 camisetas 👕 y música
      cambia "pentagrama" por 6 filas × 5 tambores 🥁, ambos con dibujo de emojis (`emojiRows`).
- [x] **2. Recorte de bordes.** 2.018 de 2.108 imágenes recortadas al dibujo (margen 3,5 %, nunca
      menos de la mitad del ancho/alto original para que lo chico no se vuelva gigante). Las 1.852
      con SVG: `viewBox` recortado y PNG re-renderizado en Chrome al doble de resolución (DejaVu Sans
      incrustada, idéntico al original); las demás, recorte del PNG. Puntos del plano de r=8 a r=12.
      PNG a 256 colores: 54,8 MB en total (antes 62,9 MB), sin diferencia visible. Mismas rutas.
- [ ] **3. Emojis en grupos y patrones de 1°–3°** (~165): grupos de multiplicación y patrones de
      color con emoji exacto del objeto del enunciado.
- [ ] **4. Imágenes "eco" (~270)**: reparto con números grandes, componentes, cantidad repetida —
      quitar o pasar a modelo de barras, habilidad por habilidad.
- [ ] **5. Vocabulario 1°–2°**: reemplazar ~25 palabras difíciles (paleontólogo, partituras,
      herbívoros, estacionamiento, guardaparques, observatorio…).
- [ ] **6. Feedback breve por alternativa en 1° y 2°** (hoy 0 %) y lectura en voz alta del feedback.
- [ ] **7. Interfaz**: mascota más chica durante la pregunta, feedback con emoji y más corto,
      alternativas con color del interés, cierre de sesión más celebrado, íconos y progreso en el
      mapa de habilidades.

Nota: el seed no borra imágenes de una BD existente cuando se quita una entrada del banco visual;
en una BD local ya sembrada hay que poner `image = NULL` a mano (en una BD nueva queda bien).
