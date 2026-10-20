# 008 — Banco de imágenes por curso (1.º a 6.º básico)

Integración de las 805 ilustraciones SVG del paquete `banco_imagenes_por_curso` (2026-09), una versión por idioma (1.610 archivos). Incluye también las traducciones al inglés de alternativas textuales y las propuestas para 8 enunciados ambiguos.

## Qué se hizo

- **Esquema (aditivo):** `Exercise.image Json?` y `ExerciseOption.labelEn String?` (migración `20260930120000_imagenes_y_alternativas_en`). No se cambió ningún ID, usuario, intento ni progreso.
- **Recursos:** `client/public/banco-imagenes/<N>_basico/{es,en}/<exerciseId>.svg`, servidos por Vite como `/banco-imagenes/...`.
- **Vinculación:** `server/prisma/seed/imagenes/indice_imagenes.json` y `linkImages.ts`. La correspondencia es por ID, verificando curso, habilidad, tema, baseKey y enunciado. Si el ID no existe (BD sembrada desde cero), se busca una correspondencia única por esos mismos campos. Los casos ambiguos o con datos distintos se informan y no se vinculan.
- **Traducciones:** `server/prisma/seed/traducciones/alternativas_en.json` contiene las alternativas de los 108 ejercicios de `revision_bilingue.json` (432) más las de otros 192 ejercicios (ver Pendientes, punto 1). Solo se escribe `labelEn`; `label`, orden, `isCorrect` y tipo de error no cambian, y las alternativas numéricas quedan sin traducción porque no la necesitan, salvo las que usan formato chileno ("1.200", "2,5", "12 y 13"), que reciben `labelEn` con formato de EE. UU. desde el pase de inglés de aula.
- **Inglés de aula:** revisión del inglés de enunciados, pistas, SVG, texto alternativo, alternativas y mapa al vocabulario escolar de EE. UU. Criterio, glosario, cantidades y pendientes en [`ingles_de_aula.md`](ingles_de_aula.md); datos en `server/prisma/seed/traducciones/ingles_de_aula.json`.
- **Script idempotente:** `npm run bank:images` (en `server/`) vincula, traduce y verifica. `seed.ts` lo llama al final.
- **API:** `next-exercise` (solve y spot_error) y `initial-assessment` envían `image` y `labelEn`. La ronda spot_error envía además `characterAnswerLabelEn` y `correctAnswerLabelEn`.
- **Cliente:**
  - `ExerciseImage` muestra el SVG y el alt del idioma activo, con su proporción original y un alto máximo de 50vh. Se puede ampliar a pantalla completa; en pantallas chicas se ve al menos a 640 px y con desplazamiento. Se cierra con Esc, con el botón o tocando fuera.
  - Si hay `image`, reemplaza a `ExerciseVisual`; los demás ejercicios siguen con su representación actual. El enunciado sigue como texto.
  - Las alternativas y el nombre de la habilidad en práctica usan `localize`.

## Ajustes sobre el paquete

- **Texto alternativo:** en 14 casos (3.º, 4.º y 6.º) el alt en inglés del paquete usaba otro vocabulario ("favourite", "bar chart", "circle graph"). Se usó el `promptEn` vigente de la BD ("favorite", "bar graph", "pie chart").
- **Título de los SVG circulares:** los 33 SVG ingleses de gráficos circulares decían "Circle graph" y se cambiaron a "Pie chart", el término del proyecto. Solo cambió el texto del título; el paquete original queda intacto.
- **Tamaños por idioma:** 5 SVG tienen distinto alto en español y en inglés, así que el índice guarda `size` por idioma.

## Verificación

| Curso | Imágenes vinculadas (por ID) | Ambiguas | Rutas ES/EN verificadas |
|---|---:|---:|---:|
| 1.º | 300 | 0 | 600 |
| 2.º | 205 | 0 | 410 |
| 3.º | 88 | 0 | 176 |
| 4.º | 68 | 0 | 136 |
| 5.º | 29 | 0 | 58 |
| 6.º | 115 | 0 | 230 |
| **Total** | **805** | **0** | **1.610** |

- **Correspondencia:** las 805 coinciden en curso, habilidad, tema, baseKey, dificultad, enunciado ES e IDs de alternativas.
- **Integridad de la BD:** comparación completa antes y después. Solo cambiaron `image` (805) y `labelEn` (432); los conteos de adultos, perfiles, sesiones, intentos y estrellas no variaron.
- **Respuesta en la imagen:** ningún SVG muestra la respuesta correcta salvo que ya esté en el enunciado. Las coincidencias numéricas eran marcas de escala de los ejes. Tampoco contienen scripts, enlaces externos ni `<image>`.
- **Pruebas:**
  - Unitarias: `linkImages.test.ts`, `ExerciseImage.test.tsx` y `PracticeScreen.test.tsx` (inglés).
  - Integración: `next-exercise.integration.test.ts` (`image`/`labelEn`).
  - E2E: `banco-imagenes.spec.ts`, con un ejercicio ilustrado por curso en evaluación y práctica, ES y EN, más alternativas textuales.

## Pendientes

1. ~~**Otras alternativas en español fuera de los 108.**~~ **Resuelto (2026-09-30).** Los 192 ejercicios de `alternativas_pendientes_fuera_de_los_108.json` se agregaron a `alternativas_en.json`, que ahora tiene 300 ejercicios. Tienen 752 alternativas: 545 traducidas y 207 con `labelEn: null`. Quedan en null porque son solo números, fracciones o medidas con unidad (`12 m²`, `3/4`, `cm`) o nombres propios (Ana, Beto, Camila, Luis, Marta, Pedro, Tomás).
   - **Vocabulario:** se usó el mismo del `promptEn` de cada ejercicio. Por ejemplo: "Half past 7", "4 o'clock", "We can't tell", "They are the same length", "The one that is 8 clips long", "Ana's", "2 bags, 3 packs and 4 loose ones", "4 units down" y "Football", porque así lo dice el enunciado.
   - **Números en palabras:** van en inglés, por ejemplo "seven thousand fifty-eight".
   - **Enunciados:** en 5 ejercicios de 7.508 el `promptEn` decía "How is that number read in Spanish?". Como ahora las alternativas se ven en inglés, se corrigió a "How is that number read?". El cambio se hizo en la BD con el campo `replacesPromptEn` de la entrada, que solo se aplica si el texto anterior coincide exacto, y también en las fuentes del seed (`grade4.ts` y `themes/{deportes,espacio,musica,naturaleza}.ts`).
   - **Verificación:** `npm run bank:images` confirma que las 977 `labelEn` del JSON están en la BD y termina en "OK". Una segunda corrida escribe 0, así que es idempotente.
   - **Otras superficies:** en la BD ya no queda ninguna alternativa con palabras sin `labelEn`, salvo "Ema, 3/4" y similares, que son nombre más fracción. Todas las habilidades tienen `nameEn`/`axisEn`, y todos los ejercicios tienen `promptEn`/`procedureNoteEn`.
   - **A revisar (contenido):** el ejercicio `cmulu2x7s04iw4crhswlu0hh7` (3.º, tema videojuegos) pregunta por "carreras, puzles y plataformas", pero sus alternativas son "Fútbol / Básquetbol / Natación", tanto en ES como en EN. Se tradujo literal y no se cambió el contenido.
2. **8 enunciados de 3.º:** propuesta en `revision_enunciados.md`, pendiente de revisión pedagógica. No se aplicó al banco activo.
3. **612 recomendaciones de apoyo visual** del reporte, sin imágenes en este paquete. Se cuentan aparte de los 805.
4. **Texto alternativo:** el alt del paquete repite el enunciado, que ya está en pantalla, por lo que un lector de pantalla lo oye dos veces. Conviene reemplazarlo por una descripción de la imagen ("6 círculos azules y 7 naranjos").
5. **33 ejercicios** de la BD son posteriores al paquete; no tienen imagen y conservan su representación actual.

## Imágenes agregadas después del paquete

| Fecha | Ejercicio | Curso / tema | Archivo | Nota |
|---|---|---|---|---|
| 2026-09-30 | `cmulu2zzt079n4crhpgerk9up`: "Sofía compró cajas de 6 calcomanías de planetas y además 4 calcomanías sueltas…" | 6.º, Ecuaciones de primer grado · espacio | `6_basico/{es,en}/cmulu2zzt079n4crhpgerk9up.jpg` (1536×1024, JPG 85 %) | Ilustración entregada por la usuaria: 1 caja de 6 más 4 sueltas. No revela la respuesta (7) y no tiene texto, así que el mismo archivo sirve para ambos idiomas. El alt describe la imagen. Solo esta variante temática; las otras 9 del mismo baseKey hablan de otros objetos. |

Total con imagen: **798** (6.º: 116). Para agregar otra, se suma una entrada a `server/prisma/seed/imagenes/indice_imagenes.json` y se corre `npm run bank:images`.
