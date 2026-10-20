# Inglés de aula — revisión del inglés de la app (1.º a 6.º básico)

**Fecha:** 2026-09-30 · **Estado:** aplicado en la BD local y en las fuentes (sin commit).

**Objetivo.** El inglés de la app tiene que ser el que se usa de verdad en una clase de matemáticas de primaria en EE. UU.: vocabulario escolar real, frases naturales para niños de 6 a 12 años y nada de calcos del español. Se revisaron cuatro superficies:

1. enunciados (`Exercise.promptEn`) y pistas (`procedureNoteEn`);
2. imágenes: texto de los SVG en inglés y texto alternativo (`alt.en`);
3. alternativas (`ExerciseOption.labelEn`);
4. mapa de aprendizaje (`MathSkill.axisEn` / `nameEn`) y textos de interfaz en inglés.

**Qué no se tocó.** El contenido matemático queda igual: números, datos, respuesta, orden de las alternativas, cuál es la correcta y tipo de error. Tampoco se tocaron el español ni los ids. Una prueba automática comprueba que ningún cambio de enunciado o pista altera los números del texto (ver Verificación).

## Criterio

- **Variante: inglés de EE. UU. de aula.** La app ya lo usaba casi siempre (favorite, color, bar graph, pie chart). Ahora es la única variante, con ortografía US: *color, favorite, meter, liter, kilometer, kilogram, fall*.
- **Vocabulario:** el más usado en primaria de EE. UU. (Common Core y textos escolares) y el mismo en toda la app (glosario abajo).
- **Preguntas directas.** Una operación se pregunta con *"What is 6 + 7?"*, no con *"How much is 6 + 7?"*. *"How much…?"* queda solo para dinero y cantidades no contables (*How much does she pay?*).
- **Sin calcos.** *taller* ya no se traduce como *workshop*: queda *class* o *club* (*swimming class, P.E. class, after-school club*). *kiosko* pasa a *snack stand*, *plaza* a *town square*, *malla* a *wire fence*, *lápiz grafito* a *regular pencil*, *cartulina* a *cardstock*, *sembrar* a *plant*, *semestre* a *half of the year*, *corazones de vida* a *lives*, *he or she* a *they*. Los honoríficos *Don José / Doña Rosa* pasan a *Mr. José / Mrs. Rosa*.
- **Pistas con estrategias de aula de EE. UU.:** *count on* y *count back*, por ejemplo *"Start at 8 and count on five more."* en vez de *"Count forward from 8, five steps."*, y *split the number into 4 equal parts* en vez de *share the number into…*.
- **Números con formato de EE. UU.** Los enunciados en inglés ya escribían "1,200" y "2.5", pero 614 alternativas numéricas sin `labelEn` se mostraban con formato chileno en la interfaz inglesa: "1.200 m" se lee "uno coma dos" y "2,5" es ambiguo. Ahora tienen `labelEn` con formato US ("1,200 m", "2.5", "12 and 13", "70°, 60° and 50°"). El número es el mismo; solo cambia cómo se escribe.
- **Nombres, comida y moneda chilenos.**
  - Los nombres propios se mantienen (Camila, Tomás, Beto…).
  - *Empanadas* y *$* (pesos) se mantienen: son reconocibles.
  - *Alfajores* lleva una glosa mínima en su primera mención de cada enunciado: *"alfajores (sandwich cookies)"*.
  - La escala de notas chilena lleva la glosa *"grades (on a 1 to 7 scale)"* (4 ejercicios de promedio de 5.º). Sin ella, un niño de EE. UU. no entiende "grades were 5.5, 6.5 and 4.5".

## Glosario elegido

| Concepto | Término elegido (EE. UU.) | Reemplaza a |
|---|---|---|
| Operación | *What is 6 + 7?* | *How much is 6 + 7?* |
| Deporte | *soccer*, *soccer ball*, *soccer cleats*, *(soccer) field* | *football*, *football boots*, *pitch* |
| Pictograma | *pictograph*; clave: *each picture stands for 5*; *Key: each picture = 5* (SVG) | *pictogram*, *picture graph*, *is worth*, *Each picture = 5 units* |
| Gráfico de barras | *bar graph*, *double bar graph* | *bar chart*, *chart*, *graph* (a secas) |
| Gráfico circular | *pie chart*, *section* | *circle graph*, *sector* |
| Valor posicional | *ones, tens, hundreds, thousands, ten thousands, hundred thousands*; *place value*; *digit*; *expanded form* | *units*, *hundred-thousands*, *decomposition* |
| Conteo | *count on*, *count back*, *count by 5s* | *count forward*, *count backward* |
| Marco de 10 | *ten frame* | *frame* |
| Figuras 3D | *3D shapes* | *3D figures* |
| Hora | *o'clock*, *half past 7*, *half an hour* | (se mantiene) |
| Fracciones | *equal parts*, *numerator*, *denominator*, *cut into 4 equal slices* | *shared into* |
| División | *quotient*, *remainder*, *9 remainder 3* | (se mantiene) |
| Simetría | *line of symmetry*, *matching point* | *symmetric point*, *In a symmetry* |
| Ángulos | *What is the measure of the third angle?* | *How much does the third angle measure?* |
| Plano | *coordinate plane* | *Cartesian plane* |
| Promedio | *average*; en la pista, *values* | *data points*, *data values* |
| Medidas | *meters, square meters, liters, kilometers, kilograms* | *metres, kilos* |
| Ejes del mapa | *Numbers and Operations · Patterns and Algebra · Geometry · Measurement · Data and Probability* | *Number and Operations*, *Numbers and operations*, … |

## Cambios por superficie

| Superficie | 1.º | 2.º | 3.º | 4.º | 5.º | 6.º | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Enunciados (`promptEn`) | 125 | 105 | 119 | 72 | 54 | 79 | **554** |
| Pistas (`procedureNoteEn`) | 112 | 73 | 86 | 47 | 47 | 52 | **417** |
| Ejercicios distintos tocados | | | | | | | **782** de 2.601 |
| SVG en inglés modificados (archivos) | 103 | 189 | 64 | 57 | 0 | 69 | **482** de 805 |
| Texto alternativo `alt.en` (índice + BD) | 103 | 74 | 52 | 29 | 0 | 35 | **293** |
| Alternativas `labelEn`: formato numérico / "y" | 24 | 0 | 34 | 173 | 202 | 181 | **614** |
| Alternativas `labelEn`: redacción | 0 | 2 | 2 | 3 | 4 | 0 | **11** |
| Mapa: habilidades con `axisEn` o `nameEn` corregido | 8 | 3 | 6 | 6 | 5 | 4 | **32** (19 ejes, 21 nombres) |
| Textos de interfaz (`i18n.ts`, inglés) | | | | | | | **6** |

### Detalle de los SVG (solo la versión `en`; solo el contenido de `<title>`, `<desc>` y `<text>`)

| Tipo | Cambios | Ejemplo antes → después |
|---|---:|---|
| `<desc>` (= enunciado en inglés vigente) | 303 | se regeneró a partir de `promptEn`. De paso se corrigieron 14 que ya estaban desfasados ("circle graph", "favourite") |
| Título y encabezado de gráficos de barras | 127 + 127 | *Read the graph* → *Read the bar graph* |
| Clave del pictograma | 178 | *Each picture = 5 units* → *Key: each picture = 5* |
| Marco de 10 | 93 | *Each full frame contains 10.* → *Each full ten frame has 10.* |
| Leyendas del gráfico circular | 83 | *1. take the bus · 30%* → *1. Bus · 30%*; *2. Rest · ?* → *2. The rest · ?*; *2. sports sector · 30%* → *2. Sports · 30%*; *1. prefer to visit the / planetarium · 30%* → *1. Planetarium · 30%* |
| Etiquetas y leyendas de barras | 54 | *Football* → *Soccer*; *Defence* → *Defense*; *Capsules* → *Pods*; *Platforms* → *Platformers*; *In January* → *January*; *vanilla / the bus / game A* → *Vanilla / Bus / Game A*; *garden, the apple* → *Apples* (etiqueta rota); *Row 1* → *Red team* (2 casos donde el español dice "Equipo Rojo"); *Half a picture represents half the key.* → *Half a picture stands for half.* |

**Revisión visual.** Se renderizaron en Chrome los 482 SVG modificados y se comparó cada caja de texto con el marco y con las demás cajas. No hay textos fuera del marco ni superpuestos, igual que en los originales. También se revisaron a ojo las muestras de cada tipo, entre ellas las que crecieron: *Read the bar graph*, *The rest*, *Platformers* y *Key: each picture = 10*. Los 1.610 SVG siguen siendo XML válido. El paquete original en Descargas no se tocó.

### Ejemplos representativos (antes → después)

| Tipo | Antes | Después |
|---|---|---|
| Operación | How much is 6 + 7? | What is 6 + 7? |
| Pista de conteo | Count forward from 8, five steps. | Start at 8 and count on five more. |
| Pista de resta | Subtraction: count back from 10, four times. | Subtraction: start at 10 and count back four. |
| Pictograma | Each picture is worth 1 pet. Cats: 🐱🐱🐱… | Each picture stands for 1 pet. Cats: 🐱🐱🐱… |
| Pista pictograma | Each star is not worth 1, it is worth 2: count by 2s… | Each star does not stand for 1, it stands for 2: count by 2s… |
| Fútbol | A football is shaped like a... | A soccer ball is shaped like a... |
| Cancha | There are 12 cones on the pitch and 5 are picked up. | There are 12 cones on the field and 5 are picked up. |
| Taller | In the swimming workshop, Camila counts… | In swimming class, Camila counts… |
| Kiosko | At the kiosk, each ice cream costs $10. | At the snack stand, each ice cream costs $10. |
| Valor posicional | …0 tens and 5 units. Which is it? | …0 tens and 5 ones. Which is it? |
| Redondeo | Round 1,478,520 to the nearest hundred-thousand. | Round 1,478,520 to the nearest hundred thousand. |
| Contador | What number will it show after moving one more unit? | What number will it show after it goes up by one? |
| Circular | A circle graph shows… The "dogs" sector is 40%. | A pie chart shows… The "dogs" section is 40%. |
| Ángulos | How much does the fourth angle measure? | What is the measure of the fourth angle? |
| Simetría | How many squares to the right of the line is its symmetric point? | …is its matching point? |
| Pronombre | Who used more cable and what fraction did he or she use? | …what fraction did they use? |
| Calco | 5 breads with seeds and 5 breads without seeds were kneaded. | 5 loaves of bread with seeds and 5 loaves without seeds were baked. |
| Calco | You have 6 hearts of life in the game… | You have 6 lives in the game… |
| Calco | A chocolate tablet has 4 equal bars… | A chocolate bar has 4 equal pieces… |
| Cerca | …is closed in with mesh all around its edge. How many meters of mesh…? | …has a wire fence all around its edge. How many meters of fence…? |
| Glosa | 48 alfajores are packed into boxes of 8. | 48 alfajores (sandwich cookies) are packed into boxes of 8. |
| Glosa | Camila's grades were 5.5, 6.5 and 4.5. | Camila's grades (on a 1 to 7 scale) were 5.5, 6.5 and 4.5. |
| Alternativa | 1.200 m · $2.850 · 2,5 · 12 y 13 | 1,200 m · $2,850 · 2.5 · 12 and 13 |
| Alternativa | Football · A $100 coin | Soccer · A coin |
| Mapa (eje) | Number and Operations / Numbers and operations | Numbers and Operations |
| Mapa (nombre) | Reading and Interpreting Picture Graphs | Reading and interpreting pictographs |
| Mapa (nombre) | Pictograms and simple bar graphs | Pictographs and simple bar graphs |
| Mapa (nombre) | Numbers to 10,000: place value, ordering and decomposition | Numbers to 10,000: place value, ordering and expanded form |
| Mapa (nombre) | Hours and half hours on a digital clock | Time to the hour and half hour on a digital clock |
| Interfaz | Not yet — finish the one before | Not yet — finish the one before it first |
| Interfaz | Had a calculation slip / Used the wrong detail from the problem | Made a calculation mistake / Used the wrong number from the problem |
| Interfaz | Enlarge picture | Zoom in |

**Mapa.** Los nombres pasaron a mayúscula solo inicial, como el resto de los cursos (1.º estaba en *Title Case*), y sin coma serial, como el resto de la app. La lista completa está en `ingles_de_aula.json` → `habilidades`.

## Cómo se aplica (y cómo queda en una BD nueva)

- **Fuentes:** el texto nuevo se escribió en `server/prisma/seed/grade1.ts` … `grade6.ts` y `themes/*.ts`, solo en literales en inglés. Una BD sembrada desde cero sale igual.
- **Datos:** `server/prisma/seed/traducciones/ingles_de_aula.json` trae 32 habilidades y 782 ejercicios. Cada campo lleva `{ old, new }` y el ejercicio se ubica por id; si no está, por curso más enunciado en español único.
- **Aplicador idempotente:** `applyClassroomEnglish.ts` sigue el patrón de `replacesPromptEn`. Escribe solo si la BD tiene *exactamente* el texto anterior, no hace nada si ya tiene el nuevo y, si encuentra otro valor, lo informa como problema y no lo pisa. Está integrado en `npm run bank:images` (`integrar-banco-imagenes.ts`), que `seed.ts` llama al final.
- **Alternativas:** `alternativas_en.json` sumó 236 ejercicios (quedan 536) y 614 alternativas con formato numérico US. Además se corrigieron 11 `labelEn` y se sincronizó el `promptEn` informativo de 56 entradas.
- **Imágenes:** `indice_imagenes.json` → `alt.en` (293), que `linkImages` reescribe en `Exercise.image`. Se editaron los SVG `en` en `client/public/banco-imagenes`.
- **Fixture e2e:** `e2e/fixtures/banco-imagenes.json` se actualizó desde la BD (25 campos), porque su documentación dice que es el registro real.

## Verificación

- **`npx tsx prisma/seed/check.ts check all`:** "OK: sin errores" en los 6 cursos. Los avisos (AVISO) son los mismos de antes. Este chequeo compara los números del `promptEn` de cada variante con los de su base.
- **Volcado de las fuentes (sin BD):** se generaron los 2.601 ejercicios y las 46 habilidades desde las fuentes, y coinciden texto a texto con la BD corregida.
- **BD tras aplicar:** el español, las alternativas (id, label, isCorrect) y el orden no cambiaron. El `alt.en` es igual al `promptEn` y el `<desc>` de cada SVG es igual al `promptEn` escapado, en los 805 casos.
- **Pruebas nuevas** (`prisma/seed/traducciones/__tests__/applyClassroomEnglish.test.ts`): la lógica escribir / ya aplicado / conflicto; que ningún cambio altera los números del enunciado o la pista (salvo la glosa "1 to 7 scale"); y que el texto nuevo no contiene términos descartados.
- **`npm run bank:images`:** en la BD local se escribieron en total 1.011 textos (mapa + enunciados + pistas) y 625 alternativas. La corrida siguiente terminó en "OK" con 0 escrituras (idempotente).

## Pendiente para decisión humana

1. **Errores de contenido en el español** (no se tocaron, porque este pase no cambia ni el español ni las alternativas):
   - `cmulu2x7s04iw4crhswlu0hh7` (3.º, videojuegos): el gráfico es de *juegos favoritos* (carreras 10, puzles 6, plataformas 4), pero las alternativas son deportes (Básquetbol / **Fútbol** correcta / Natación). En inglés ahora dice "Soccer", pero el ejercicio sigue sin sentido en ambos idiomas.
   - Siete variantes de 4.º y 5.º usan la alternativa *"Comieron lo mismo"* en historias donde nadie come (pintar, recorrer, tocar, plantar, completar un mapa): `cmulu2xut055t…`, `cmulu2xwh057r…`, `cmulu2xtt054p…`, `cmulu2yrm061h…`, `cmulu2yti063k…`, `cmulu2ys506214…`, `cmulu2ysd062b…`. En inglés se dejó neutra (*"The same amount"*); en español sigue "Comieron lo mismo".
2. **Contexto chileno:**
   - Se mantuvieron los montos en pesos con "$" (p. ej., "A T-shirt costs $8,000"). Para un niño de EE. UU. se ven caros. ¿Adaptar los montos? Eso cambiaría los números, así que no se hizo.
   - ¿Mantener la glosa de la escala de notas 1 a 7 o cambiar esos 4 ejercicios a otro contexto?
3. **Glosa de alfajores:** se eligió *"(sandwich cookies)"*. Alternativa: *"(caramel-filled cookies)"*.
4. **Leyenda "The rest · ?" del gráfico circular:** es fiel al español ("Resto"). Otra opción sería nombrar la categoría (p. ej., *Swimming · ?*), pero eso cambiaría lo que muestra la imagen.
5. **Superposición del botón de zoom (preexistente):** en la interfaz, el botón superpuesto abajo a la derecha tapa en parte la leyenda inferior de algunos SVG (p. ej., *"Each bar represents a category."*). Para mitigarlo se acortó el texto del botón a *"Zoom in"*, pero el arreglo de fondo es de diseño (sacar el botón fuera del marco de la imagen).
6. **Listas de números en alternativas:** se usa el estándar de EE. UU. con comas ("4,025, 4,052, 4,205, 4,250"), igual que el enunciado. Si se prefiere legibilidad, se podría usar punto y coma.
7. **Se dejó "workshop" en 3 casos** ("fossil workshop", "paleontology workshop" en un museo), donde sí es natural en inglés.
8. **Inconsistencias menores que se mantuvieron:** algunos nombres aparecen sin tilde en inglés (Tomas / Sofia vs. Tomás / Sofía). El panel familiar (para adultos) conserva *"One-off calculation slip"*.
9. **Capturas de `e2e/screenshots/`:** no se regeneraron. La revisión visual se hizo con capturas temporales, fuera del repositorio.

## Montos en pesos (decisión de la usuaria, 2026-09-30)

- En inglés, los montos se nombran como **pesos**: "A T-shirt costs 8,000 pesos", "2 10-peso coins", alternativas "6,000 pesos". Antes decían "$8,000" y se leían como dólares, con precios poco creíbles.
- No se cambió ningún número ni la respuesta, porque las alternativas son las mismas en ambos idiomas. El español conserva "$".
- Alcance: 101 textos de enunciados y pistas en 98 ejercicios, y 392 alternativas (`labelEn`). En las fuentes, `pesoEn()` de `grade4.ts` escribe "N pesos".
- Aplicación: en `ingles_de_aula.json`, `old` acepta ahora varios textos anteriores (el original y el ya corregido a inglés de aula), así que una BD en cualquiera de esos estados queda al día. La prueba de vocabulario prohíbe `$` seguido de un número en inglés.
- Aclaraciones "alfajores (sandwich cookies)" y "(on a 1 to 7 scale)": aprobadas.
- El botón de ampliar ("Zoom in" / "Ampliar imagen") va ahora **debajo** de la imagen y ya no tapa leyendas.
