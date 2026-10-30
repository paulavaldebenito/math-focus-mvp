# 022 · Tipografía y escala de letra única

**Pedido (2026-10-28):** que toda la app use el mismo tamaño de letra y la misma tipografía,
incluidas la pregunta y la retroalimentación, pensando en lo mejor para el niño y en el celular.

## Qué había

- **Unos 30 tamaños distintos**, de 0.72rem a 1.75rem. Varios quedaban bajo 16 px.
- **En la práctica, cuatro tamaños para lo que lee el niño:** pregunta de 33 px, alternativas de
  22 px, retroalimentación de 19 px, y pista y «así se resuelve» de 16 px. En un celular de
  390 px, la pregunta ocupaba 5 o 6 líneas y empujaba las alternativas fuera de la pantalla.
- **Ayudas con poco contraste:** «¿Qué crees que le pasó?», «Así se resuelve» y «Tu amigo
  resolvió…» usaban `--ink-faint`, con un contraste de ~2.9:1, bajo el mínimo de 4.5:1.
- **Una letra distinta por dispositivo:** se pedía primero Comic Sans, que solo existe en
  computador. En el celular se veía Comic Neue, desde Google Fonts.

## Qué cambió

1. **Una sola escala** en `client/src/index.css` (`:root`). Ningún texto usa otro tamaño:

   | Token | Tamaño | Uso |
   |---|---|---|
   | `--text-sm` | 0.875rem ≈ 17 px | Etiquetas, tablas y datos secundarios. Es el mínimo. |
   | `--text-md` | 1rem ≈ 19 px | Texto general, formularios |
   | `--text-lg` | 1.15rem ≈ 22 px | Botones principales |
   | `--text-read` | ≈ 22 px en celular, hasta 25 px | **Todo lo que el niño lee al practicar** |
   | `--text-h2` | 1.3rem ≈ 25 px | Subtítulos, cifras destacadas |
   | `--text-h1` | ≈ 27 px en celular, hasta 33 px | Títulos de pantalla |

2. **La práctica y la evaluación leen en un solo tamaño** (`.focus-frame`, al final de
   `App.css`). Pregunta, alternativas, retroalimentación, pista, «así se resuelve», pasos
   resueltos y la ronda «detecta el error» van en `--text-read`. La pregunta se distingue por la
   negrita, no por el tamaño. Las ayudas pasan a `--ink-soft`, que sí cumple el contraste.
3. **Comic Neue en todos los dispositivos**, alojada dentro de la app con `@fontsource/comic-neue`
   (400 y 700, importadas en `main.tsx`). Así la letra es idéntica en computador, iPhone y Android.
   Además ya no se carga desde Google Fonts: no se le envía a Google la IP de los niños (Ley
   21.719), y la fuente funciona aunque Google esté bloqueado.
4. **Emojis, dibujos, avatares y pictogramas no se tocaron.** No son texto y tienen sus propios
   tamaños.

## Verificación (2026-10-28)

- Capturas antes y después en 390×844 (iPhone): registro, evaluación, mapa, pregunta con pista,
  retroalimentación de error, «detecta el error», fin de práctica, inicio y panel familiar. La
  pregunta pasó de 5 o 6 líneas a 3, y las alternativas entran en la pantalla.
- En el navegador: los títulos tienen peso 700, y Comic Neue 400 y 700 están cargadas. Su
  negrita es más liviana que la de Comic Sans, que es lo que antes se veía en el computador.
- Cliente: compila y pasa 151/151. E2E de práctica (`spot-error`, `full-journey`,
  `banco-imagenes`): 12/12.

## Pendiente: el texto dentro de las imágenes de los ejercicios

La escala y Comic Neue se aplican a **todo el texto de la app**, pero no al texto que viene
dibujado dentro de las imágenes. Las imágenes se muestran con `<img>`, y un SVG cargado así no
puede usar las fuentes de la página.

- `banco-imagenes/` (1.596 SVG): piden Comic Sans primero, así que la letra cambia según el
  dispositivo. Se ve Comic Sans en el computador, Chalkboard en iPhone y la sans-serif del
  sistema en Android. Nunca se ve Comic Neue.
- `exercise-images/` (2.137 PNG y 1.818 SVG): usan DejaVu Sans, que es otra tipografía.
- El tamaño de esa letra depende del tamaño de la imagen, no de `--text-*`.

Propuesta: volver a dibujar todas las imágenes con Comic Neue incrustada, en un subconjunto
liviano de la fuente, usando las herramientas de `bank_review_scripts` (render.mjs). Después,
revisar en 390 px que ningún texto de imagen quede bajo ~16 px.
