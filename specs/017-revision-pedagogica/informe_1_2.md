# Revisión pedagógica del banco: 1° y 2° básico

Archivos revisados: `banco_1.json` (110 ejercicios, 8 habilidades) y `banco_2.json` (101 ejercicios, 7 habilidades). Revisé todos los ejercicios. Además abrí unas 75 imágenes del banco visual (pictogramas, barras, relojes, figuras, conteo, longitudes, valor posicional y grupos iguales).

**Nota sobre las imágenes.** En el export, `img` vale `null`, `combine`, `takeaway` o `compare`; ningún ejercicio de 1° ni de 2° referencia `/exercise-images/`. Aun así, los ejercicios están vinculados en la BD al banco visual: `server/prisma/seed/imagenes/banco_visual.json` → `client/public/exercise-images/{1b,2b}__<id>__<tipo>.png`. Cuando el campo `img` (que corresponde a `visual`) tiene valor, la app muestra el dibujo de emojis y no el PNG. Los pictogramas de 1° con escala 1 se dibujan con emojis a partir del enunciado *antiguo* (`enunciados_editados.json`). Revisé contra esos datos (`values`, `letters`, enunciado antiguo) y contra los PNG.

**Taxonomía.** Los códigos se revisaron con las definiciones oficiales de `seed.ts`:
- E1_OP: confusión de operación o concepto.
- E2_RES: error de reagrupación o de procedimiento, incluido aplicar el procedimiento a un solo término.
- E2_CAL: error de cálculo o de conteo puntual.
- E3_PREG: no responde lo preguntado.
- E3_DATO: omite o cambia un dato.

## Resumen

- **1° básico.** La matemática está bien en los 110 ejercicios: todas las respuestas correctas están verificadas. Problemas principales:
  - **MA01 OA04:** los 12 ejercicios tienen 2 o 3 alternativas (adivinar da 50 %).
  - **Distractores absurdos** en los patrones de colores y sonidos de MA01 OA11 («verde», «amarillo», «silbido»…).
  - **Dos opciones sin código** en MA01 OA09.
  - **Tres imágenes que confunden:**
    - flores «rojas» dibujadas en azul y «amarillas» en rojo (`lee0rrmr`);
    - la cuerda «más larga» dibujada igual de larga que la de 7 (`jhah5f43`);
    - el círculo 2D dibujado como esfera 3D (`9bfv2o3m`, `hkczp6p3`).
- **1°, lenguaje.** Muchas pistas son largas o abstractas para niños que recién leen («Conteo hacia adelante desde 6, avanzando 7 posiciones», «se completan 4 decenas y 9 unidades…»).
- **1°, otros problemas.**
  - En MA01 OA01, «contar marcas en vez de saltos» está codificado E2_CAL y «responder el número de saltos» E1_OP. Con la taxonomía oficial deberían ser E2_RES y E3_PREG.
  - Tres ejercicios de MA01 OA18 son problemas de suma o resta, no de comparar longitudes.
  - `ptqblaxv` tiene dos respuestas posibles: un cilindro o un cono apoyados en su base tampoco ruedan.
- **2° básico.** La matemática está bien en los 101 ejercicios. Problemas principales:
  - 10 ejercicios de MA02 OA09 tienen solo 3 alternativas.
  - En MA02 OA22 el enunciado trae el dato que debería leerse en el gráfico, así que no se evalúa la lectura.
  - MA02 OA12 copia casi literalmente 4 ejercicios de 1° (2, 4, 6, 8…; 5, 10, 15, 20…; 10, 20, 30…; 50, 45, 40, __, 30).
  - En MA02 OA11, las pistas de 2 × 6 y 2 × 9 contradicen la imagen (6 grupos de 2 frente a «6 + 6»).
  - Hay pistas que delatan la respuesta (`f7may1x7` «tri», `b9wp8hnr` «5, 10, y sigue…»).
  - El círculo aparece como esfera en 3 imágenes de MA02 OA15.
- **Ambos cursos.**
  - Ningún ejercicio tiene `fb` ni `steps` (110/110 y 101/101).
  - E2_RES se usa con el sentido antiguo de «forma o escritura»: cifras pegadas, «26» para 2 × 6. Según la taxonomía oficial, E2_RES es un error de reagrupación o de procedimiento; lo reviso habilidad por habilidad.
  - El código E3_PREG o E3_DATO para «leer la otra fila o el otro dato» no es consistente.
  - En 1° casi no hay problemas de juntar, agregar o comparar: todos los problemas de MA01 OA09 son de quitar.

---

## 1° básico

### MA01 OA01 · Contar hasta 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10 (15 ejercicios; 15 sin fb ni steps)

**Corregir**
- `cmuli7hzh000o6krhz4tw1g90` | opción «60» | Es arbitraria: ningún niño salta una decena entera al contar de 1 en 1. | Reemplazar por «410», código E2_RES (no reagrupa 10 unidades en una decena: «cuarenta-diez»).
- `cmuli7hzh000o6krhz4tw1g90` | hint | Es demasiado abstracta para 6 años. | «Después del 49 viene un número que empieza con 5.»
- `cmun91fie000stwrhur5o2cgj` | opción «6» / código | 0, 2, 4, 6 es contar 4 marcas, incluido el 0, en vez de 4 saltos. Es un error sistemático del procedimiento de conteo, no un desliz puntual. | E2_CAL → E2_RES.
- `cmun91fie000stwrhur5o2cgj` | opción «4» / código | Responde el número de saltos, no el número donde queda. | E1_OP → E3_PREG.
- `cmun91fil000xtwrhdjb0rs7s` | opción «15» / código | 5, 10, 15 cuenta el 5 inicial como un salto: cuenta marcas, un error de procedimiento. | E2_CAL → E2_RES.
- `cmun91fil000xtwrhdjb0rs7s` | opción «3» / código | Responde cuántos saltos dio. | E1_OP → E3_PREG.
- `cmun91fil000xtwrhdjb0rs7s` | prompt | «saltas de 5 en 5 tres veces más» es ambiguo («más» ¿que qué?). | «Estás en el 5. Das 3 saltos de 5 en 5. ¿En qué número quedas?»
- `cmun91fip0012twrhni8us3mo` | opción «12» / código | 20, 18, 16, 14, 12 cuenta el 20 como primer salto: cuenta marcas, un error de procedimiento. | E2_CAL → E2_RES.
- `cmun91fip0012twrhni8us3mo` | opción «5» / código | Responde el número de saltos. | E1_OP → E3_PREG.
- `cmun91fiw0017twrhb8llesdj` | opción «50» / código | 80 − 30 es la distancia, otra magnitud. No es un error de procedimiento. | E1_OP → E3_PREG.
- `cmun91fiw0017twrhb8llesdj` | opción «6» / código | 30, 40, 50, 60, 70, 80 son 6 números: cuenta marcas en vez de saltos, un error de procedimiento. | E2_CAL → E2_RES.
- `cmuli7i0600186krhe4akv9gy` | opción «58» / código | No corresponde a un error reconocible, y no es reagrupación (E2_RES). | Reemplazar por «70», código E3_DATO (copia el número que viene después del hueco).

**Mejorar**
- `cmun91fie000stwrhur5o2cgj`, `cmun91fil000xtwrhdjb0rs7s`, `cmun91fip0012twrhni8us3mo`, `cmun91fiw0017twrhb8llesdj` | hint | Las pistas tienen 2 oraciones y más de 20 palabras. | Acortar, por ejemplo: «Cuenta de 2 en 2 y da un salto a la vez.»
- `cmuli7i0h001i6krhe6hyi78p` | nivel | Tres bolsas de 10 es más fácil que los otros nivel 3. | Nivel 3 → 2.
- `cmuli7i0200136krh244rz5hs` | opción «43» | Es arbitraria. | Reemplazar por «55», código E3_PREG (da el número que sigue al 50), y dejar «45» como correcta.

### MA01 OA04 · Comparar y ordenar números dentro de 20 (12 ejercicios; 12 sin fb ni steps)

**Corregir**
- Los 12 ejercicios (`cmtsx18ru008dftrhd6swlec4`, `cmtsx18s1008gftrhwiugs034`, `cmtsx18s4008jftrhg50dxsyw`, `cmtsx18sa008mftrhg4sdolqa`, `cmtsx18sf008pftrhuqgo5bfx`, `cmtsx18sm008sftrhnhqq3cuw`, `cmtsx18st008vftrh5alukcv9`, `cmtsx18sx008zftrh994twjze`, `cmtsx18t20093ftrht45iw6us`, `cmtsx18t70096ftrhfwed0kkt`, `cmtsx18td0099ftrhn4c7jh3t`, `cmtsx18th009cftrhlee0rrmr`) | opciones | Tienen 2 alternativas, o 3 en los de «el más grande» o «el más chico». | Con dos números hay que cambiar el formato a 4 números, ajustando también la imagen de filas. Ejemplo para `cmtsx18ru008dftrhd6swlec4`: «¿Cuál es el número mayor: 3, 9, 6 u 8?», con «9» correcta, «3» E1_OP, «8» E2_CAL y «6» E2_CAL. Para `cmtsx18st008vftrh5alukcv9` y `cmtsx18sx008zftrh994twjze`, agregar un cuarto número: «5, 12, 8, 11» con «11» E2_CAL; «18, 3, 10, 4» con «4» E2_CAL.
- `cmtsx18t20093ftrht45iw6us` | opciones | Tiene solo 2 alternativas. | Agregar «13», código E3_PREG (dice cuántos en vez de quién), y «Tienen lo mismo», código E1_OP.
- `cmtsx18t70096ftrhfwed0kkt` | opciones | Tiene solo 2 alternativas. | Agregar «9», código E3_PREG, y «Tienen lo mismo», código E1_OP.
- `cmtsx18td0099ftrhn4c7jh3t` | opciones | Tiene solo 2 alternativas. | Agregar «19», código E3_PREG, y «Leyeron lo mismo», código E1_OP.
- `cmtsx18th009cftrhlee0rrmr` | opciones | Tiene solo 2 alternativas. | Agregar «14», código E3_PREG, y «Hay igual», código E1_OP.
- `cmtsx18th009cftrhlee0rrmr` | imagen | Las 6 flores «rojas» están dibujadas en **azul** (grupo A) y las 14 «amarillas» en **rojo** (grupo B). Un niño que mira colores elige «Rojas». | Regenerar con fichas rojas para las rojas y amarillas para las amarillas, o con letras neutras sin colores que choquen.
- `cmtsx18t20093ftrht45iw6us`, `cmtsx18t70096ftrhfwed0kkt`, `cmtsx18td0099ftrhn4c7jh3t`, `cmtsx18th009cftrhlee0rrmr` | opción del perdedor / código | Elegir al que tiene menos cuando se pregunta por el que tiene más está codificado E3_PREG aquí y E1_OP en los 8 ejercicios numéricos de la misma habilidad. | Unificar en E1_OP (confunde mayor con menor).

**Mejorar**
- `cmtsx18t20093ftrht45iw6us`, `cmtsx18t70096ftrhfwed0kkt`, `cmtsx18td0099ftrhn4c7jh3t`, `cmtsx18th009cftrhlee0rrmr` | nivel | Comparar 8 con 13 en contexto no es más difícil que comparar 4 con 17. Están en nivel 3 sin razón. | Bajar a nivel 2. Para el nivel 3, crear «ordena de menor a mayor: 12, 7, 15, 9».
- `cmtsx18ru008dftrhd6swlec4` y los otros 3 de nivel 1 | hint | Usa raya «—» y una frase doble. | «Cuenta los dos grupos. El mayor tiene más.»

### MA01 OA06 · Componer y descomponer números hasta 20 (11 ejercicios; 11 sin fb ni steps)

**Corregir**
- `cmuli7i3d00376krh7kdezsjs` | opción «12» / código | Responde lo que ya tiene, el complemento de lo que falta. En `cmuli7i2r002x6krht3ui493f` y `cmuli7i3900326krhrzngzs94` ese mismo error está codificado E3_PREG. | E3_DATO → E3_PREG.

**Mejorar**
- `cmuli7i23002n6krhhnfwfxws` | hint | Tiene dos estrategias en 25 palabras. | «Quita las 8 rojas. ¿Cuántas quedan?»
- `cmuli7i2r002x6krht3ui493f` | hint | Es confusa («Piensa en el 4 y en cuánto le falta…»). | «¿Cuánto le falta al 4 para llegar al 9?»
- `cmuli7i1b00236krhdqpmsz5u`, `cmuli7i1i00286krhysxgu4b3`, `cmuli7i1u002i6krh5o7pmtl2`, `cmuli7i2c002s6krh3r79k4u5` | prompt | Cuatro ejercicios calcados («¿Cuál de estas sumas da X?») y sin imagen. | Reemplazar dos por descomposiciones con imagen, por ejemplo «Hay 10 bolitas: 7 están afuera de la caja. ¿Cuántas están adentro?» (parte-todo).

### MA01 OA09 · Adición y sustracción dentro de 20 (28 ejercicios; 28 sin fb ni steps)

**Corregir**
- `cmtsx18f8000eftrhakfbmmfu` | opción «40» / código | No tiene código. Es la suma en vez de la resta. | Código E1_OP.
- `cmtsx18f8000eftrhakfbmmfu` | opción «20» / código | Responde 20 como si no se quitara nada: omite el dato «− 20». | E1_OP → E3_DATO.
- `cmtsx18fj000jftrh9asm8y1x` | opción «18» / código | No tiene código ni corresponde a un error reconocible. | Reemplazar por «14», código E2_CAL.
- `cmtsx18eu0009ftrhq7sr27q6` | hint | Es una frase nominal, usa «posiciones» y parte del menor. | «Empieza en el 7 y cuenta 6 más.»
- `cmtsx18h00013ftrhz8ypk5dd` | hint | Mismo problema. | «Empieza en el 4 y cuenta 3 más.»
- `cmun91ezm000dtwrhi45zj6hk` | hint | «Empezando justo después del 12» no se entiende al contar hacia atrás. | «Cuenta hacia atrás: 11, 10… un número por salto.»

**Mejorar**
- `cmtsx18eu0009ftrhq7sr27q6`, `cmtsx18fj000jftrh9asm8y1x`, `cmtsx18ie001xftrhzk6nkluu`, `cmtsx18jb002mftrh0sl478uy`, `cmtsx18iz002cftrhu1s1grtm`, `cmtsx18jy0031ftrhp3m38q0w`, `cmtsx18kg003gftrht3f686ey`, `cmtsx18i6001sftrhzf0a2fnp` | hint | Usan la misma plantilla «Conteo hacia adelante desde X, avanzando Y posiciones». | Usar «Empieza en el número mayor (X) y cuenta Y más».
- `cmun91ez90008twrhm991gj86`, `cmun91ezm000dtwrhi45zj6hk` | prompt | «Párate en el número 5» supone una recta numérica que no se muestra; no tienen imagen. | Agregar una recta 0–20 o decir «Imagina una recta con números».
- Las subtracciones que piden «¿qué número le sumas a 6 para llegar a 14?» (`cmtsx18fw000oftrhdk91trb1`, `cmtsx18im0022ftrhj6up44ra`, `cmtsx18ir0027ftrhx0zhqlt2`, `cmtsx18j6002hftrh806bi1sn`, `cmtsx18gv000yftrhbu0begeg`, `cmtsx18jl002rftrh5z7kbkxy`, `cmtsx18js002wftrh2fgwbus9`, `cmtsx18k30036ftrhwiedrcc1`, `cmtsx18ka003bftrhkdisyhvg`) | hint | Es la única estrategia que se ofrece; para 6 años es abstracta. | Alternar con «Cuenta hacia atrás desde 14, 6 veces» o «Llega primero al 10».

### MA01 OA11 · Patrones repetitivos y numéricos hasta 20 (11 ejercicios; 11 sin fb ni steps)

**Corregir**
- `cmuli7i3m003d6krhejqpb7z2` | opciones «verde», «amarillo» | Son colores que no están en el patrón: distractores absurdos. Quedan 2 opciones reales. | Cambiar la pregunta a «¿Qué 2 colores siguen?», con «azul, rojo» correcta, «rojo, azul» E1_OP, «azul, azul» E2_CAL y «rojo, rojo» E1_OP.
- `cmuli7i3s003i6krhcm69lx2i` | opciones «silbido», «salto» | Distractores absurdos. | «¿Qué 2 sonidos siguen?», con «pisada, palmada» correcta, «palmada, pisada» E1_OP, «pisada, pisada» E2_CAL y «palmada, palmada» E2_CAL.
- `cmuli7i4u004c6krh7zludy0e` | opciones «verde», «amarillo» | Distractores absurdos. | «¿Qué 2 colores siguen?», con «rojo, azul» correcta, «azul, rojo» E1_OP, «rojo, rojo» E2_CAL y «azul, azul» E2_CAL.
- `cmuli7i50004h6krhj1vacd3j` | opción «verde» | Distractor absurdo. | Reemplazar por «amarilla, roja», código E3_PREG (da dos cuentas en vez de la séptima), o preguntar por la cuenta 8 y usar «amarilla» E2_CAL.
- `cmuli7i4c003x6krhtes8ossp` | opción «conejo» | Distractor absurdo. | Reemplazar por «pez y gato», código E3_PREG (responde dos elementos).
- `cmuli7i47003s6krhhkczp6p3` | imagen | El «círculo» está dibujado como esfera 3D, con brillo y sombra. | Regenerar con un círculo plano.

**Mejorar**
- `cmuli7i47003s6krhhkczp6p3` | opciones «triángulo», «rectángulo» | Son poco plausibles. | Cambiar a un patrón ABB (círculo, cuadrado, cuadrado, círculo, ___, ___).
- `cmuli7i4u004c6krh7zludy0e` | opción «azul» / código | Aplicar un patrón AB a uno AAB es un error de regla. | E2_CAL → E1_OP.

### MA01 OA14 · Figuras 3D y 2D del entorno (11 ejercicios; 11 sin fb ni steps)

**Corregir**
- `cmuli7i73006b6krhptqblaxv` | prompt | Es ambiguo: un cilindro apoyado en su base o un cono apoyado en su base tampoco ruedan al empujarlos. | «Sofía busca un bloque que no ruede, lo pongas como lo pongas. ¿Cuál le sirve?»
- `cmuli7i6j005r6krh9bfv2o3m` | imagen | La opción A («círculo», figura 2D) está dibujada como esfera 3D. La pregunta es justamente sobre figuras 2D. | Regenerar con un círculo plano.
- `cmuli7i73006b6krhptqblaxv` | imagen | El cono (D) tapa la etiqueta «A» del cubo. | Reubicar el cono.

**Mejorar**
- `cmuli7i5z00576krhaqxkw58z`, `cmuli7i7000666krhrt271vtf`, `cmuli7i6t00616krhx8xfe1p0`, `cmuli7i6p005w6krhd0z1ta80`, `cmuli7i73006b6krhptqblaxv` | imagen | La base del cilindro se ve como una línea recta con un arco colgando debajo: parece un objeto roto. | Dibujar la elipse inferior completa, o solo su mitad frontal pegada al cuerpo.
- `cmuli7i5l004x6krhu8h5o0zm` | opción «óvalo» | No es un término del currículo de 1°. | Reemplazar por «rectángulo», código E1_OP.
- `cmuli7i6d005m6krhijs249d7` | prompt | Repite el dado de `cmuli7i5l004x6krhu8h5o0zm`, que ya dice «Un dado tiene forma de cubo». | Cambiar a «¿Cuál de estos objetos tiene forma de cilindro?», con «Un tarro de leche» correcta.
- `cmuli7i6p005w6krhd0z1ta80` | hint | El cucurucho es en sí mismo un cono: casi da la respuesta. | «Busca la figura que tiene una sola punta.»

### MA01 OA18 · Comparar la longitud de objetos: largo y corto (11 ejercicios; 11 sin fb ni steps)

**Corregir**
- `cmuli7i7o006w6krhjhah5f43` | imagen | La barra «?» (la cuerda de Pedro) está dibujada exactamente igual de larga que la de 7. Eso induce a elegir «7 pasos» y contradice «más larga». | Dibujar la barra «?» claramente más larga.
- `cmulib568000df4rhhqy966hg` | OA | Es un problema de suma (3 + 1) y de medir con unidades no estandarizadas (MA02 OA19). No compara largo y corto. | Reemplazar por «El banco mide 4 clips y la mesa 6 clips. ¿Cuál es más corto?»
- `cmulib568000df4rhhqy966hg` | opción «7» | Es arbitraria. | «2», código E1_OP (resta).
- `cmuli7i8f007l6krh5frmx5kz` | OA | Es un problema aditivo («3 clips más que…»), contenido de MA01 OA09. | Reformular como comparación: «La roja mide 5 clips y la azul 8. ¿Cuál es más larga?», o moverlo a OA09.
- `cmuli7i8p007v6krha6b8cy8u` | OA | Es una resta (12 − 5). No compara longitudes. | Moverlo a OA09/OA06, o cambiar la pregunta a «¿Cuál parte es más larga?».

**Mejorar**
- `cmuli7i89007g6krhzpue8lvy` | imagen | El dibujo muestra los tres largos (azul > rojo > verde) y anula la deducción. | Quitar la imagen o mostrar los lápices tapados.
- `cmuli7i8j007q6krhyslgwfo2` | prompt / opciones | No se dice quiénes son Toby, Rocky y Luna. Además, las opciones son frases largas para 1°. | «Tres perritos: Toby mide 6 huellas, Rocky 4 y Luna 9. ¿Quién es el más largo?» (opciones: Luna, Toby, Rocky, «Miden lo mismo»).
- `cmuli7i7b006h6krhxi27shor`, `cmuli7i7e006m6krhsp155eyy`, `cmuli7i7k006r6krhko1pcxtu`, `cmuli7i7u00716krhzih87rrg`, `cmuli7i7z00766krh5l0se450`, `cmuli7i89007g6krhzpue8lvy` | opciones «No se puede saber», «Miden lo mismo» | Son poco plausibles y se repiten en casi todos los ejercicios. | Usar errores reales: elegir el más corto (E1_OP) o leer la otra cinta (E3_DATO).

### MA01 OA20 · Leer e interpretar pictogramas (11 ejercicios; 11 sin fb ni steps)

Datos verificados con el pictograma de emojis (enunciado antiguo): manzanas 4 y plátanos 2; gatos 3 y perros 5; rosas 6 y tulipanes 3; frutillas 2 y uvas 6; gatos 5, perros 8 y hámsters 4; pelota 6, bicicleta 5 y cometa 4; manzanas 7 y plátanos 4; rojo 4, azul 7 y verde 2. Todas las respuestas son correctas.

**Corregir**
- `cmuli7i8v00816krhe5b1h7o0` | opción «2» / código | Lee la otra fila: «toma otro número». En 2° (`cmuli7ikx00i76krhuorhgztb`) el mismo error es E3_DATO. | E3_PREG → E3_DATO.
- `cmuli7i8z00866krh2uvrdib4` | opción «3» / código | Mismo caso. | E3_PREG → E3_DATO.
- `cmuli7i9t00906krhj83dovtx` | opción «7» / código | Olvida restar las 2 comidas: omite un dato. | E3_PREG → E3_DATO.
- `cmuli7i8v00816krhe5b1h7o0` y los otros 9 que dicen «Mira los dibujos» | imagen | El PNG del banco visual tiene filas «A» y «B» sin nombres. Si la app no muestra el pictograma de emojis con nombres, el niño no sabe cuál es la fila de las manzanas: con el enunciado nuevo, la leyenda genérica «las letras siguen el orden del enunciado» ya no sirve. | Verificar en la app que estos 10 ejercicios se muestran como pictograma de emojis con nombre por fila. Si no, volver a nombrar las filas en el enunciado.

**Mejorar**
- `cmuli7i9w00956krhb33aij41` | prompt / imagen | El enunciado da los números (5, 7, 3) y el pictograma A/B/C no aporta nada. | «Mira el pictograma: cada dibujo es 1 niño. ¿Cuántos dibujos hay en total?», sin los números en el texto.
- `cmuli7ia8009f6krht1amvnjx` | opción «Rojo y verde quedan empatados» | Es una afirmación verdadera (4 y 4), aunque no responde la pregunta. Un niño de 6 años puede sentirlo como trampa. | Reemplazar por «Verde y azul quedan empatados», código E2_CAL (cuenta mal los votos del verde).

---

## 2° básico

### MA02 OA07 · Decenas y unidades en números hasta 100 (12 ejercicios; 12 sin fb ni steps)

**Corregir**
- `cmuli7icp00a06krhqh5mn4tk` | opción «13» / código | 10 + 3 es sumar en vez de agrupar: es un error de concepto. | E2_CAL → E1_OP.
- `cmuli7idc00ap6krh5mfeay9a` | opción «35» / código | Suma 1 unidad en vez de 1 decena: es un error de concepto. | E2_RES → E1_OP.
- `cmuli7id100af6krhhu8pqvxr` | hint | «Las unidades que faltan no suman nada» confunde. | «0 unidades quiere decir que no hay cubitos sueltos.»
- `cmuli7icy00aa6krhm9wtutbl` «507», `cmuli7idc00ap6krh5mfeay9a` «134», `cmuli7id100af6krhhu8pqvxr` «9» | código | Están en E2_RES con el sentido antiguo de «escritura». Pegar las cifras o no convertir decenas en su valor es no entender el valor posicional; no hay reagrupación ni procedimiento. | E2_RES → E1_OP.

**Mejorar**
- `cmuli7icl009v6krhsb9pmlg8` | opción «2» / código | Da la otra cifra («cambia un dato»). | E3_PREG → E3_DATO.
- `cmuli7icu00a56krh76k0uoy3` «46», `cmuli7icy00aa6krhm9wtutbl` «75», `cmuli7id700ak6krh8bigbmga` «82», `cmuli7idi00au6krhz2miw5iw` «64», `cmuli7idr00b46krhrn9wqjin` «$92», `cmuli7idl00az6krhkz59pwlo` «2 cartones y 5 huevos» | código | Invertir decenas y unidades está en E2_RES. Con la definición oficial (reagrupación o procedimiento) cabe solo forzando «pasos en mal orden»; lo natural es E1_OP (valor posicional). | Decidir una convención. Propongo E1_OP.
- `cmuli7id700ak6krh8bigbmga` | opción «20» / código | Omite las unidades. | E3_PREG → E3_DATO.
- `cmuli7icp00a06krhqh5mn4tk`, `cmuli7icu00a56krh76k0uoy3`, `cmuli7id100af6krhhu8pqvxr`, `cmuli7idc00ap6krh5mfeay9a` | imagen | Usan «6 × 10», «4 × 1», «0 × 1»: simbolizan la multiplicación antes de MA02 OA11 y dan el procedimiento. | Usar barras de 10 y cubitos sueltos.

### MA02 OA09 · Adición y sustracción dentro de 100 (19 ejercicios; 19 sin fb ni steps)

**Corregir**
- `cmtsx18mt005aftrhixh4sz3s` | opciones | Tiene 3 alternativas. | Agregar «17», código E2_RES (aplica la suma a un solo término: 12 + 5).
- `cmtsx18n0005eftrhknqr2s4v` | opciones | Tiene 3 alternativas. | Agregar «27», código E2_RES (24 + 3).
- `cmtsx18nd005iftrhr5gs6fgs` | opciones | Tiene 3 alternativas. | Agregar «33», código E2_RES (35 − 2).
- `cmtsx18nh005mftrh176lxbz6` | opciones | Tiene 3 alternativas. | Agregar «42», código E2_RES (47 − 5).
- `cmtsx18np005qftrh0gkk390u` | opciones | Tiene 3 alternativas. | Agregar «28», código E2_RES (23 + 5).
- `cmtsx18nt005uftrhf5d8fdvi` | opciones | Tiene 3 alternativas. | Agregar «39», código E2_RES (34 + 5).
- `cmtsx18o0005yftrh9jlptk4j` | opciones | Tiene 3 alternativas. | Agregar «64», código E2_RES (68 − 4).
- `cmtsx18o50062ftrhyam7mygi` | opciones | Tiene 3 alternativas. | Agregar «53», código E2_RES (56 − 3).
- `cmtsx18om006gftrh6g70nyn4` | opciones | Tiene 3 alternativas. | Agregar «69», código E2_RES (63 + 6).
- `cmtsx18ov006kftrh9k3ny20l` | opciones | Tiene 3 alternativas. | Agregar «83», código E2_RES (88 − 5).
- `cmun91g7u001htwrhtqzx83ac` | nivel | 15 saltos hacia atrás de uno en uno cruzando decena, desde 72, no es nivel 1. | Nivel 1 → 3, o cambiar a «da 5 saltos hacia atrás» (respuesta 67).
- `cmun91g7u001htwrhtqzx83ac` | hint | «Empezando justo después del 72» no se entiende hacia atrás. | «Cuenta hacia atrás: 71, 70… un número por salto.»
- `cmun91g8g0021twrhf9349ldk` | opción «30» / código | 6 × 5 = 30 es la distancia recorrida, otra magnitud. | E3_DATO → E3_PREG.
- `cmun91g8g0021twrhf9349ldk` | opción «64» | Es arbitraria (saltos de 5). | Reemplazar por «70», código E2_CAL (un salto menos).

**Mejorar**
- `cmtsx18mt005aftrhixh4sz3s`, `cmtsx18n0005eftrhknqr2s4v`, `cmtsx18nd005iftrhr5gs6fgs`, `cmtsx18nh005mftrh176lxbz6`, `cmtsx18np005qftrh0gkk390u`, `cmtsx18nt005uftrhf5d8fdvi`, `cmtsx18o0005yftrh9jlptk4j`, `cmtsx18o50062ftrhyam7mygi`, `cmtsx18om006gftrh6g70nyn4`, `cmtsx18ov006kftrh9k3ny20l`, `cmtsx18ob0066ftrh8cjen0mn`, `cmtsx18og006bftrh004eefxp` | hint | Usan la misma plantilla y dan los números ya separados («las decenas (10 y 10) y las unidades (2 y 5)»): hacen la mitad del trabajo. | «Suma primero las decenas y después las unidades.»
- `cmun91g7y001mtwrhc74rlef5` | prompt | Dar 24 + 18 palmadas, «sigue contando desde 24» 18 veces, no es realista. Además tiene reserva, y MA02 OA09 pide el algoritmo sin reserva. | Usar un contexto de juntar objetos (por ejemplo, láminas) o números sin reserva (24 + 15).
- `cmtsx18ob0066ftrh8cjen0mn`, `cmtsx18og006bftrh004eefxp` | opción «20» / «32» / código | Dan un dato del enunciado. Está codificado E3_PREG; vale, pero hay que mantenerlo igual en todo el banco. | Fijar la convención «responde la cantidad que se quitó o agregó» = E3_PREG en ambos cursos.
- Imágenes `combine` y `takeaway` con números hasta 88 | imagen | Un dibujo de emojis de 63 + 26 objetos es incontable. | Verificar en la app. Para 2° usar barras de 10 y cubitos, no objetos sueltos.

### MA02 OA11 · Multiplicación como suma repetida: tablas del 2, 5 y 10 (18 ejercicios; 18 sin fb ni steps)

**Corregir**
- `cmuli7idw00ba6krhb27uilwr` | hint | Dice «2 × 6 es lo mismo que 6 + 6» (2 grupos de 6), pero la imagen muestra 6 grupos de 2. Además, `cmuli7ie100bf6krhb9wp8hnr` y `cmuli7ie600bk6krhwuxjkm4r` usan la otra lectura (5 × 3 = 3 grupos de 5). | Elegir una convención (el texto escolar chileno suele leer 3 × 2 como «3 veces 2» = 2 + 2 + 2) y alinear pistas e imágenes. Mínimo: «Son 6 grupos de 2: cuenta de 2 en 2 seis veces.»
- `cmuli7iec00bp6krh5d752tx8` | hint | Mismo conflicto: «Suma 9 + 9», con la imagen de 9 grupos de 2. | «Son 9 grupos de 2: cuenta de 2 en 2 nueve veces.»
- `cmuli7ie100bf6krhb9wp8hnr` | hint | Delata casi toda la respuesta: «5, 10, y sigue una vez más». | «Cuenta de 5 en 5, tres veces.»
- `cmuli7if000ce6krhb3bywjku` | opción «64» | 8 × 8 es absurdo en 2°: no conocen esa tabla. | Reemplazar por «8», código E3_DATO (omite el «doble»).
- `cmuli7idw00ba6krhb27uilwr` «26», `cmuli7ie100bf6krhb9wp8hnr` «35», `cmuli7iec00bp6krh5d752tx8` «29», `cmuli7ieg00bu6krhju9oilzc` «72», `cmuli7iem00bz6krhr5xke1eb` «56», `cmuli7ieq00c46krhb68c7w70` «104» | código | Están en E2_RES («forma»). Escribir los dos números pegados es no identificar la operación; no hay reagrupación ni procedimiento. | E2_RES → E1_OP. (`cmuli7ie600bk6krhwuxjkm4r` «700» sí puede quedar en E2_RES: procedimiento de ×10 mal aplicado.)
- `cmun91gir0030twrh69750n4o` | opción «25» / código | Retrocede un salto de 5 en vez de 3 de 1: aplica mal la regla. | E2_CAL → E1_OP.
- `cmun91gir0030twrh69750n4o` | prompt | «Retrocede 3 saltos más, de 1 en 1» es ambiguo. | «Después da 3 pasos hacia atrás, de 1 en 1.»

**Mejorar**
- `cmun91ghu002ltwrhxp7xu2au` | prompt | Repite 10 × 7 = 70, igual que `cmuli7ie600bk6krhwuxjkm4r`. | Usar 10 × 9 = 90 (distractores «19» E1_OP, «80» E2_CAL, «100» E2_CAL).
- `cmun91gib002vtwrhfdltsltg` | prompt | «Saltos de 2 en 2 metros» suena raro. | «Cada salto de un canguro bebé avanza 2 metros. Si da 8 saltos, ¿cuántos metros avanza?»
- `cmuli7if600cj6krhliivoiv3` | imagen | Muestra «6 × 10», que es el planteamiento resuelto. | Mostrar 6 helados con la etiqueta $10.

### MA02 OA12 · Patrones numéricos: continuar y completar (16 ejercicios; 16 sin fb ni steps)

**Corregir**
- `cmuli7ifn00cz6krh330b8csv` | prompt | Es idéntico a 1° `cmuli7hyq00096krhia6k9xp6` (2, 4, 6, 8…): es contenido de 1° y está calcado. | «Completa el patrón: 34, 36, 38, 40, … ¿Qué número sigue?» (42; distractores «41» E1_OP, «44» E2_CAL, «80» E1_OP).
- `cmuli7ifr00d46krhqxfrij3j` | prompt | Es idéntico a 1° `cmuli7hz2000e6krhdnkuki9c`. | «55, 60, 65, 70, …» (75; «71» E1_OP, «80» E2_CAL, «140» E1_OP).
- `cmuli7ifw00d96krhwgz2lq00` | prompt | Es idéntico a 1° `cmuli7hz9000j6krh3pxeif9p`. | «43, 53, 63, …» (73; «64» E1_OP, «83» E2_CAL, «74» E2_CAL).
- `cmuli7igf00dt6krhdvzr0vvs` | prompt | Es casi idéntico a 1° `cmulib53d0008f4rh411kl72e` (50, 45, 40, __, 30). | «85, 80, 75, __, 65» (70; «74» E1_OP, «60» E2_CAL, «65» E3_DATO).

**Mejorar**
- `cmuli7ih100ed6krh5yxsy73y` | prompt | Tiene 3 oraciones y mezcla «peldaño 1 tiene el 2…»: es pesado de leer. | «En una escalera, los peldaños tienen los números 2, 4, 6… ¿Qué número tiene el peldaño 9?»
- `cmuli7ig400dj6krh49ydqsal` | opción «22» | Es arbitraria. | Reemplazar por «21», código E1_OP (cuenta de 1 en 1 desde el 20).

### MA02 OA15 · Figuras 2D: triángulos, cuadrados, rectángulos y círculos (12 ejercicios; 12 sin fb ni steps)

**Corregir**
- `cmuli7ihd00eo6krhf7may1x7` | hint | «El prefijo "tri" también es una pista» delata la respuesta, y «prefijo» es una palabra difícil. El ejercicio además es idéntico a 1° `cmuli7i64005c6krhd8ts9fx9`. | Hint: «Recorre el borde con el dedo y cuenta los lados rectos.» Cambiar el ejercicio por «¿Cuántos lados tienen juntos 2 triángulos?» o similar.
- `cmuli7ihd00eo6krhf7may1x7` | opción «0» | Es absurda para un triángulo. | «6», código E1_OP (cuenta lados y esquinas).
- `cmuli7ihh00et6krhqszcn3y1`, `cmuli7iho00ey6krhjr3gs9q5`, `cmuli7iim00fx6krh04yqntqq` | imagen | El «círculo» está dibujado como esfera 3D, con brillo y sombra. | Regenerar con un círculo plano.
- `cmulib5b2000if4rh000qnge2` | opción «Una figura con 2 lados» / código | Resta en vez de sumar. | E2_CAL → E1_OP.

**Mejorar**
- `cmuli7iho00ey6krhjr3gs9q5` | hint | «Piensa en una moneda o en la tapa de un frasco» nombra objetos circulares: casi da la respuesta. | «Pasa el dedo por el borde: ¿en cuál nunca encuentras una esquina?»
- `cmulib5b2000if4rh000qnge2` | prompt | «Le agrega 1 lado más» no tiene sentido geométrico. Además, «cuadrado o rectángulo» excluye otros cuadriláteros. | «Marta dibuja una figura con 4 lados rectos y 4 esquinas rectas. ¿Qué figura puede ser?»
- `cmuli7iix00g76krhs1beaind` | imagen | Muestra un cuadrado (A) y un rectángulo (B), con la leyenda genérica «las letras siguen el orden del enunciado», pero el enunciado habla de Tomás y Camila. | Quitar las letras o rotular «rectángulo».
- `cmuli7iit00g26krhd62v4ygp` | prompt | 5 × 3 está fuera de las tablas de 2° (2, 5 y 10). Vale solo si se cuenta en la imagen. | Mantener la imagen visible o usar 5 cuadrados (5 × 4 = 20).

### MA02 OA18 · Horas y medias horas en el reloj digital (12 ejercicios; 12 sin fb ni steps)

Relojes verificados en el SVG: 4:00, 7:30, 11:30, 5:00, 8:30, 3:00 → 3:30, 10:00, 8:00 → 9:30 y 4:00. Todos coinciden.

**Corregir**
- `cmuli7ij600gd6krhsakkxsqh` | opción «Las 12 y media» | Es arbitraria: no viene de leer 4:00. | «Las 3 y media», código E2_CAL.
- `cmuli7ijo00gx6krhc2uwb34v` | opción «1:00» | No corresponde a un error reconocible. | «11:60», código E2_RES (suma 30 minutos sin pasar a la hora siguiente).
- `cmuli7ijl00gs6krhs15hkczy` | opción «2:15» / código | Confundir «media» con 15 es un error de concepto. | E2_CAL → E1_OP.

**Mejorar**
- `cmuli7ijt00h26krhiuvnej9o` | opción «5:30» / código | Confunde 1 hora con media hora. | E2_CAL → E1_OP.
- `cmuli7ikk00hw6krhiqpqj10v` | opción «2:00» / código | Da la duración en vez de la hora final. | E1_OP → E3_PREG.
- `cmuli7ij600gd6krhsakkxsqh` | hint | «De la hora» sobra. | «Los dos ceros quieren decir que no pasó ningún minuto.»
- 7 de 12 ejercicios son de tiempo transcurrido (`cmuli7ijo00gx6krhc2uwb34v`, `cmuli7ijt00h26krhiuvnej9o`, `cmuli7ijy00h76krhdpwyd2l5`, `cmuli7ik700hh6krht93mb1rh`, `cmuli7ikc00hm6krh1jzt4jhj`, `cmuli7ikg00hr6krhs4z2r594`, `cmuli7ikk00hw6krhiqpqj10v`), y en `s4z2r594` el transcurrido es de 1 h 30 min | OA | El OA pide leer horas y medias horas. Los transcurridos son un apoyo, pero aquí pesan más que la lectura. | Bajar a 4 transcurridos y agregar lectura de rutina: «El reloj marca 12:30. ¿Qué hora es?», «¿Qué reloj marca las 6 y media?».

### MA02 OA22 · Pictogramas con escala y gráficos de barra simple (12 ejercicios; 12 sin fb ni steps)

Imágenes verificadas: barras 6 y 4; 7 y 3; 9 y 5; 6, 4 y 2; 8, 5 y 3. Pictogramas: 5 con escala 1; 3 y 5 con escala 1; 4 con escala 2; 3 con escala 5; 4 con escala 10; 5 y 3 con escala 2; 4 y 6 con escala 5. Todo coincide con los enunciados.

**Corregir**
- Los 12 ejercicios (`cmuli7ikr00i26krhmj1bo2jh`, `cmuli7ikx00i76krhuorhgztb`, `cmuli7il200ic6krhmu6c08n8`, `cmuli7il700ih6krhgaooqp9r`, `cmuli7ilb00im6krhtin5nzdf`, `cmuli7ilf00ir6krh85dkdxh3`, `cmuli7ill00iw6krhgqyb546a`, `cmuli7ilp00j16krhzo9uzzjj`, `cmuli7ilv00j66krhr0qzpaei`, `cmuli7ilz00jb6krhwx3bu2do`, `cmuli7im500jg6krhapb1ul47`, `cmuli7im900jl6krh9rqnnn3x`) | prompt | El enunciado trae el dato que hay que leer («la barra de los perros llega hasta el 6», «la fila tiene 4 estrellas»). No se evalúa la lectura del gráfico, que es el núcleo del OA. | Dejar solo la correspondencia de las categorías y que el número salga del gráfico. Ejemplo para `cmuli7ikx00i76krhuorhgztb`: «Mira el gráfico: A son los perros y B los gatos. ¿Cuántos niños prefieren los perros?»

**Mejorar**
- `cmuli7ilv00j66krhr0qzpaei` | opción «24» | Es arbitraria. | «3», código E3_PREG (cuenta las barras).
- `cmuli7ilf00ir6krh85dkdxh3` | opción «35» / código | Pegar el 3 y el 5 es no identificar la operación; no es reagrupación. | E2_RES → E1_OP.
- `cmuli7ilb00im6krhtin5nzdf` | opción «16» | Es arbitraria (4 × 4). | «10», código E2_CAL (cuenta de 2 en 2 un salto de más).

---

## Diversidad

**MA01 OA01.**
- Todo es simbólico; solo 2 ejercicios tienen imagen.
- Falta contar colecciones dibujadas (de 2 en 2, de 5 en 5) y contar de 1 en 1 desde un número cualquiera mayor que 50 hacia atrás.
- Hay pocos E3_PREG y E2_RES, y casi ningún ejercicio de argumentar («¿Quién contó bien?»).

**MA01 OA04.**
- Solo hay «¿cuál es mayor o menor?».
- Falta *ordenar* tres o cuatro números (está en el OA), ubicar números en la recta y usar «antes y después».
- Hay solo 3 códigos y nada de argumentación.

**MA01 OA06.**
- Faltan representaciones concretas o pictóricas: diez-marco, dominó, manos.
- Falta pedir todas las descomposiciones de un número («¿cuál NO es una forma de escribir 8?»).
- 4 ejercicios calcados de «¿Cuál suma da X?».
- No hay E2_RES.

**MA01 OA09.**
- Los 9 problemas son de *quitar*.
- Faltan problemas de juntar, agregar, comparar («¿cuántos más?») y de cambio con el inicio desconocido.
- 8 cálculos tienen la misma pista.
- No hay E3_DATO ni E2_RES.
- Contextos repetidos: regalar, comer, perder, gastar.

**MA01 OA11.**
- Falta identificar el núcleo que se repite («¿Qué grupo se repite?»), crear o extender patrones con figuras y hallar el error en un patrón (argumentar).
- No hay E2_RES ni E3_PREG.

**MA01 OA14.**
- 31 de 33 distractores son E1_OP.
- Falta relacionar objetos reales con su forma 3D usando fotos, contar caras planas o curvas, y argumentar («Ana dice que la lata rueda. ¿Tiene razón?»).
- El dado aparece 4 veces.

**MA01 OA18.**
- Falta comparar directamente objetos dibujados sin unidades (alineados o no alineados en un extremo) y usar «más alto o más bajo».
- 3 de 11 ejercicios son en realidad aritméticos.
- No hay E2_RES.

**MA01 OA20.**
- Solo se lee.
- Falta *construir* o completar un pictograma («¿Cuál pictograma muestra 3 gatos y 5 perros?»), interpretar «¿cuántos menos?» y responder una pregunta a partir de una tabla de conteo.
- No hay E2_RES.

**MA02 OA07.**
- Falta la descomposición no canónica (4 decenas y 13 unidades = 53), comparar números por valor posicional y leer o escribir números en palabras.
- Faltan problemas con dinero en otros contextos.

**MA02 OA09.**
- Faltan problemas de comparación («¿cuántos más?») y de cambio con el inicio o el cambio desconocido.
- La mitad del banco es cálculo aislado con la misma pista.
- Hay pocos E3_DATO y E3_PREG.
- No hay argumentación («Pedro dice que 47 − 15 = 62. ¿Qué hizo?»).

**MA02 OA11.**
- Buena variedad de contextos (ruedas, manos, paquetes).
- Falta asociar la expresión con la imagen («¿Qué multiplicación muestra el dibujo?»), la conmutatividad (2 × 5 = 5 × 2), escribir la suma repetida como multiplicación y argumentar.
- Solo 1 E3_PREG.

**MA02 OA12.**
- Falta crear un patrón con una regla dada, usar la tabla del 100 y trabajar patrones que decrecen de 10 en 10 desde números no redondos.
- Hay 4 ejercicios calcados de 1°.
- Pocos E3_PREG.

**MA02 OA15.**
- 29 de 36 distractores son E1_OP.
- Falta *construir* o componer figuras (dos triángulos forman un cuadrado), comparar por número de lados o esquinas con imágenes reales e identificar figuras en distinta orientación (un cuadrado girado).

**MA02 OA18.**
- Faltan ejercicios de leer relojes como imagen en todos los niveles, el formato «12:30 / 1:30» (mediodía) y ordenar horas en una rutina.
- 7 de 12 ejercicios son de tiempo transcurrido.
- Hay poca argumentación.

**MA02 OA22.**
- El dato viene en el texto (ver Corregir).
- Falta *construir* (elegir el gráfico que representa una tabla), comparar dos categorías leyendo la escala sin ayuda y responder preguntas de «¿cuántos menos?» y de total con escala 5 o 10.
- Hay solo 1 E2_RES.
