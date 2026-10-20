# 010 — Banco visual completo 1.º a 6.º básico

Integración del paquete `banco_visual_completo_1a6_basico`: 2.116 ejercicios, 2.116 PNG y 2.106 SVG. Se extrajo en `~/Downloads/banco_visual_completo_reparado/` desde las partes 00–03, 04a–04c y 05; la parte 04 original venía truncada desde su origen.

## Cómo se integró

- **Imágenes:** `public/exercise-images` → `client/public/exercise-images/` (4.222 archivos, 83 MB), servidas como `/exercise-images/...`.
- **Preparación:** `npx tsx prisma/seed/imagenes/prepararBancoVisual.ts <paquete>` copia las imágenes y genera `server/prisma/seed/imagenes/banco_visual.json`, que contiene por `exerciseId` solo lo que la app necesita: ruta y tamaño del PNG, alt, letras dibujadas, `rowLabels` y `optionBindings`. No incluye `visualData` ni parámetros del generador.
- **Vínculo:** `bancoVisual.ts`, dentro de `npm run bank:images`, vincula **exclusivamente por `exerciseId`** y solo si el enunciado en español y el curso coinciden. No usa `baseKey` ni asigna imágenes por parecido. Es idempotente y reemplaza en `Exercise.image` la ilustración anterior de esos ejercicios. No cambia enunciados, traducciones, opciones, respuestas, habilidades ni clasificación de errores (verificado con una comparación de la BD antes y después: 0 diferencias).
- **Esquema:** sin cambios; reutiliza `Exercise.image` (JSON), que ahora guarda `source: "banco_visual"` y `legend`.
- **Alt:** es el del manifiesto. En inglés, el enunciado del paquete se reemplaza por el `promptEn` vigente (inglés de aula).
- **Presentación** (`ExerciseImage`):
  - La misma imagen para ambos idiomas, porque no tiene palabras incrustadas.
  - Marco blanco con margen interior fijo, `object-fit: contain` y alto máximo de 50vh.
  - Se puede ampliar.
  - Reemplaza al dibujo del descriptor, que queda como respaldo si no hay imagen.

## Leyendas (fuera de la imagen, en el idioma activo)

| Leyenda | Casos | Origen |
|---|---:|---|
| Con nombres, `rowLabels` | 98 | fracciones: `rowLabels` del manifiesto |
| Con nombres, opciones | 19 | `optionBindings`: la letra se liga al **ID** de la alternativa; la app muestra el texto actual de esa opción aunque se mezclen |
| Con nombres, enunciado | 163 | barras y pictogramas: los números del enunciado calzan exactos con los valores dibujados, en ES **y** EN, y el nombre pasa un filtro de limpieza |
| Genérica | 911 | "Las letras A, B, C… siguen el orden del enunciado." (versión corta, para niños, de la leyenda del paquete) |
| Sin leyenda | 917 | imágenes sin letras, o letras que son el propio nombre (punto A) o las propias alternativas |

La leyenda nunca revela la respuesta. Los `rowLabels` que coinciden con la respuesta correcta se reemplazan por la leyenda genérica, salvo que solo repitan las alternativas visibles.

## Resultado

- **Vinculadas:** 1.774 de 2.116 (1.º 331 · 2.º 288 · 3.º 343 · 4.º 287 · 5.º 199 · 6.º 326).
- **Dibujo de emojis preferido:** 334 ejercicios de 1.º y 2.º (sumas, restas y comparaciones con su dibujo 🐒 🍎 ⚽ de `visual`) muestran ese dibujo y no la imagen genérica de fichas del banco. Es una decisión de la usuaria del 2026-09-30, a partir del ejercicio "En el zoológico hay 35 monos…". Los emojis se agrupan en bloques de 10 sobre 20 y las cantidades que se quitan aparecen tachadas. El vínculo lo aplica en `linkBancoVisual` (`emojiPreferred` en el reporte); si un ejercicio pierde su `visual`, vuelve a recibir la imagen del banco.
- **Rutas:** 4.222 de 4.222 verificadas (2.116 PNG + 2.106 SVG).
- **Enunciados distintos:** 0.
- Detalle en `reporte_integracion.json`; casos pendientes con sus IDs en `pendientes.json`.

## Pendientes

1. **8 IDs ausentes en la BD:** son los ejercicios eliminados a pedido (videojuegos y los 7 de "Comieron lo mismo"). Sus imágenes quedan copiadas, pero no se usan.
2. **65 fracciones con leyenda genérica**, porque su `rowLabel` es la respuesta (p. ej. "¿Qué fracción está pintada?" → "A = 3/4"). Falta decisión pedagógica: dejarlas sin nombre (así están) o rotularlas de otra forma.
3. **161 barras/pictogramas con leyenda genérica**, porque los nombres no se pudieron verificar automáticamente (escalas "cada cuadrito vale 10", "2 símbolos y medio", días en filas…). Se pueden rotular a mano en una segunda pasada.
4. **Grupos sin nombre (rows, repartos, longitudes, circulares, barras dobles…):** usan la leyenda genérica. Para circulares y barras dobles se podrían agregar nombres verificados más adelante.
5. **Legibilidad en móvil:** en algunas imágenes las letras y números internos (ejes, cotas) son chicos en un teléfono. Se pueden ampliar con el botón de zoom; si se quiere, conviene pedir al generador un tamaño de letra mayor.
6. **BD sembrada desde cero:** tendría otros IDs, y como el vínculo es solo por `exerciseId` (a pedido), ese banco quedaría sin estas imágenes. El índice anterior (`banco-imagenes`) sigue como respaldo por contenido.
7. **485 ejercicios** no tienen imagen en ninguno de los dos paquetes y conservan su representación actual.

## Verificación

- **Automática:** `npm run bank:images` comprueba IDs, enunciado, curso, las 4.222 rutas, la ruta por curso y el alt ES/EN de cada imagen vinculada.
- **Pruebas unitarias:** `bancoVisual.test.ts` cubre la extracción de nombres, que no se revele la respuesta, los `optionBindings`, las 4.222 rutas y el curso de cada ruta. `ExerciseImage.test.tsx` cubre la leyenda fuera de la imagen, su cambio de idioma y el ID de la opción con las alternativas mezcladas.
- **E2E:** `banco-imagenes.spec.ts` recorre un ejercicio por curso en ES y EN, revisa la proporción con `contain`, la leyenda, el zoom, el teléfono y los `optionBindings` con las alternativas invertidas.
- **Visual:** una muestra de cada combinación curso × tipo (84), en ES/EN, teléfono (390 px) y escritorio (1280 px). Se comprobó automáticamente la carga, que no haya scroll horizontal, que la imagen quepa completa, `contain` y la leyenda debajo: 0 problemas. Además, revisión a ojo de hojas de contacto por curso.
