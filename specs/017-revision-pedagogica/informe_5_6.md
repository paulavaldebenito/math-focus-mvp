# Informe de revisión pedagógica: 5° y 6° básico

## Alcance

- **Ejercicios:** 107 de 5° y 101 de 6°.
- **No revisadas:** MA05 OA07 (41 ejercicios) y MA06 OA05 (30). Son de fracciones, se revisaron hoy y todos sus ejercicios tienen steps.
- **Revisadas enteras:** MA06 OA06 y MA06 OA04. Ya pasaron una revisión anterior, pero no están en la lista de exclusión.
- **Taxonomía:** los códigos se evalúan con la taxonomía oficial de `server/prisma/seed.ts`. En particular, E2_RES incluye «aplicar el procedimiento a un solo término», «olvidar la reserva» y «dejar un paso incompleto».

**Imágenes.** En los JSON, `img` es null en los 208 ejercicios. Aun así, en `client/public/exercise-images/` hay imágenes con el prefijo 5b__/6b__ y el id; probablemente se asignan vía `banco_visual`. Revisé todas las de plano cartesiano, gráficos de barras y circulares, ángulos, volumen, razones y valor posicional, abriendo el PNG o leyendo la geometría y los textos del SVG. Abajo solo se anotan las que no coinciden con el enunciado o tienen problemas.

**Sin fb ni steps** (ya conocido, solo se cuenta):
- 5°: OA04 11/11, OA15 11/11, OA01 11/11, OA21 11/11, OA16 11/11 y OA23 11/11.
- 6°: OA11 10/10, OA24 10/10, OA03 10/10, OA17 10/10 y OA19 11/11.
- MA06 OA06 y MA06 OA04 tienen fb y steps en todos sus ejercicios.

## Resumen

- **5° y la imagen de y0huzp (error grave).** La figura de descomposición no corresponde al número: faltan los millones y dice «0 × 100», «4 × 10», «0 × 1000». Así se lee 745, no 3.040.705.
- **5° y las imágenes de valor posicional (cldwmf, pjahmm).** Escriben el valor bajo cada dígito, y con eso dan la respuesta. Además, todas las imágenes de 5° OA01 escriben los números sin punto de miles (1000000, 1250000).
- **5° OA04 y los distractores de resto.** En los 3 ejercicios de «cociente y resto», el distractor con resto ≥ divisor no cuadra con la división: 68 × 4 + 7 = 279, no 275. Debería tener el cociente uno menos: 67 r7, 58 r11 y 70 r10.
- **5° OA23 y el promedio.** En 4 ejercicios el promedio coincide con la moda, con el dato del medio o con un dato. El niño acierta sin calcular.
- **5° OA15 y las inecuaciones.** En 5cioby y muwkyp, los distractores «3», «2» y «15» no responden a ningún error. Además, cualquier error plausible también cumple la desigualdad, así que conviene reformular («¿cuál es el menor número que cumple…?»).
- **6° OA24 y los gráficos.** El enunciado trae todos los datos, así que el gráfico es decorativo. Las imágenes rotulan A/B y 1/2 en vez de categorías y meses. La habilidad de leer e interpretar gráficos no se practica.
- **6° OA06 y la suma de denominadores.** «Sumar o restar los denominadores» está codificado E2_RES en los 10 ejercicios. Es una regla equivocada (E1_OP), y MA03 OA11 ya lo codifica así. En cambio, «cambiar solo el denominador» sí es E2_RES (procedimiento en un solo término). Fuera de mi alcance: MA05 OA07 codifica ese caso E1_OP en 3 ejercicios.
- **6° OA11 y las pistas de los L3.** Las pistas de los problemas de nivel 3 escriben la ecuación, que es lo que el niño debía modelar.
- **6° OA17 y la omisión de un dato.** Varios distractores que omiten un ángulo dado («180 − 30») tienen el código E1_OP; deberían ser E3_DATO.
- **Niveles mal declarados.** h07oeg (5°) pasa de L3 a L1. y861fs (5°), dm4qks (5°) y hzix5z (6°) pasan de L3 a L2.

---

## 5° básico

### MA05 OA04: División con dividendo de tres cifras y divisor de una cifra

**Corregir**
- cmuli7jah01946krhn0aen5k6 | opción «68 resto 7» | 68 × 4 + 7 = 279 ≠ 275, así que no es un error real. El error real es detenerse antes y dejar un resto ≥ divisor | «67 resto 7», E2_RES
- cmuli7jam01996krh7gne4n5s | opción «59 resto 11» | 59 × 6 + 11 = 365 ≠ 359 | «58 resto 11», E2_RES
- cmuli7jaq019e6krh8wb418gj | opción «71 resto 10» | 71 × 7 + 10 = 507 ≠ 500 | «70 resto 10», E2_RES
- cmuli7jav019j6krh6y1h9fzn | códigos de «5» y «13» | «5» es el divisor: usa otro dato (E3_DATO). «13» es un resto sin terminar de dividir, con cociente 79 y resto 13: es un paso incompleto (E2_RES) | «5» E3_DATO, «13» E2_RES
- cmuli7jb6019t6krh8be8aq63 | opción «8» (E2_RES) | 8 es el divisor, no un error de procedimiento. Además, la pista lo descarta («lo que sobra siempre es menor que la cantidad de cursos») | Cambiar por «14» (42 con resto 14, división sin terminar), E2_RES

**Mejorar**
- cmuli7jba019y6krhzwe0h9lf | hint | «Las personas que sobran también necesitan una van» le dice al niño que sume 1 | «Divide y mira el resto. ¿Qué pasa con las personas que sobran?»
- cmuli7jba019y6krhzwe0h9lf | opción «18» (E2_CAL) | Es arbitraria | «1.040» (130 × 8, multiplica en vez de dividir), E1_OP
- cmuli7ja1018k6krhdz174dd2, cmuli7ja5018p6krh28p8uei6, cmuli7ja9018u6krhenql28g0, cmuli7jae018z6krhim8vc7mg | prompt | Los 4 ejercicios L1 son calcados («¿Cuánto es N ÷ d?»): sin contexto y sin cero en el cociente | Reemplazar uno por «¿Cuánto es 618 ÷ 3?» (206), con el distractor «26» (omite el cero del cociente), E2_RES

### MA05 OA15: Ecuaciones e inecuaciones de un paso

**Corregir**
- cmuli7jdl01c36krhp7apmxhx | hint | «Al número que queda (40) devuélvele lo que se quitó (25)» le dicta la operación 40 + 25 | «Si al quitarle 25 a un número quedaron 40, ¿cuánto había antes de quitar?»
- cmuli7jdz01ci6krhlr5cioby | prompt y opciones | Hay tres problemas. «4» es la solución de n + 6 = 10, lo que muestra que el niño confunde > con =; eso es una idea equivocada (E1_OP), no E2_RES. «3» y «2» no responden a ningún error. Y cualquier error plausible (16, 10) también cumple la desigualdad | Prompt: «¿Cuál es el menor número natural que cumple n + 6 > 10?». Opciones: «5» (correcta); «4» E1_OP; «16» (suma 10 + 6), E1_OP; «6» E2_CAL
- cmuli7je301cn6krhc3muwkyp | prompt y opciones | Mismo problema. «10» confunde < con = (E1_OP); «15» no responde a ningún error | Prompt: «¿Cuál es el mayor número natural que cumple x − 4 < 6?». Opciones: «9» (correcta); «10» E1_OP; «2» (resta 6 − 4), E1_OP; «8» E2_CAL

**Mejorar**
- cmuli7jdi01by6krhw2as7a26 | hint | «Es una resta» le dice la operación | «Pregúntate cuánto falta para llegar desde 12 hasta 30.»
- cmuli7jd801bo6krhe3kvj0em, cmuli7jdd01bt6krh8hp2udgh, cmuli7jdi01by6krhw2as7a26, cmuli7jdl01c36krhp7apmxhx | prompt | Los 4 ejercicios L1 son idénticos en forma | Convertir uno en balanza, que es pictórico como pide el OA: «En una balanza equilibrada hay una caja con x cubos y 8 cubos sueltos en un lado, y 15 cubos en el otro. ¿Cuántos cubos hay en la caja?»
- cmuli7jdu01cd6krh15nucper | opciones | «199» (E2_CAL) es poco plausible en 132 + 68 | Cambiar por «132» (copia el dato), E3_DATO

### MA05 OA01: Números naturales grandes

**Corregir**
- cmuli7j9o01896krh0qy0huzp | imagen (components) | Las tarjetas dicen «0 × 100», «4 × 10», «0 × 1000», «7 × 100», «0 × 10» y «5 × 1». Faltan los 3 millones, y las centenas y decenas de mil están mal; se lee 745 | Regenerar con «3 × 1.000.000», «0 × 100.000», «4 × 10.000», «0 × 1.000», «7 × 100», «0 × 10», «5 × 1», o quitar la imagen
- cmuli7j8k01706krhdvcldwmf | imagen (place_value) | Bajo el 4 aparece «100000», y eso entrega la respuesta | Quitar la fila de valores
- cmuli7j8p01756krhybpjahmm | imagen (place_value) | Bajo el 7 aparece «100000», que es casi la respuesta (700.000) | Quitar la fila de valores
- cmuli7j8k01706krhdvcldwmf, cmuli7j8p01756krhybpjahmm, cmuli7j8x017f6krh509f8a4h, cmuli7j9f017z6krhsw3te927, cmuli7j9k01846krhj86dgfx5, cmuli7j9o01896krh0qy0huzp | imagen | Los números van sin punto de miles («1000000», «1 × 6000000», «1250000»). No coinciden con el enunciado ni con la convención chilena | Escribir 1.000.000, 6.000.000, 1.250.000, etc. En 9f8a4h, quitar además el «1 ×»
- cmuli7j8x017f6krh509f8a4h | hint | Dice qué posiciones van en cero («las decenas y las unidades de mil»), que es justo lo que se evalúa | «Ubica cada sumando en su posición. Si una posición no aparece en la suma, escribe un 0 en ella.»
- cmuli7j8k01706krhdvcldwmf | opciones «8» y «2» (E2_RES) | «8» es contar una posición de menos, un error de conteo (E2_CAL). «2» está a 3 posiciones de distancia y es arbitrario | «8» E2_CAL; cambiar «2» por «1» (cuenta las 6 posiciones desde la izquierda), E1_OP
- cmuli7j8p01756krhybpjahmm | código de «7.000» y «70.000» | Es contar mal las cifras que siguen al 7: un error de conteo, no de procedimiento | E2_CAL en las dos
- cmuli7j97017p6krh4fhnq4am | códigos | «43.000» trunca en vez de aproximar, una regla equivocada (E1_OP). «40.000» y «43.900» aproximan a otra posición, la decena de mil y la centena (E3_PREG) | 43.000 E1_OP, 40.000 E3_PREG, 43.900 E3_PREG
- cmuli7j9t018e6krhyxi03cjz | códigos | «1.480.000» aproxima a la decena de mil y «1.000.000» al millón: los dos son E3_PREG. «1.400.000» trunca (E1_OP) | 1.480.000 E3_PREG, 1.000.000 E3_PREG, 1.400.000 E1_OP
- cmuli7j9f017z6krhsw3te927 | opción «2.849.100» (E2_CAL) | No corresponde a ningún error identificable | «3.000.000» (sube todo al millón siguiente), E1_OP
- cmuli7j9k01846krhj86dgfx5 | códigos de «125» y «1.250» | Es contar mal los ceros, como si se dividiera por 10.000 o por 1.000 | E2_CAL en las dos. Para diversificar, cambiar «1.250» por «13» (redondea hacia arriba en vez de contar grupos completos), E3_PREG

**Mejorar**
- Habilidad completa | prompt | Ningún número pasa de 7 cifras, aunque el OA llega hasta 1.000 millones, y no hay contextos reales | Agregar un ejercicio con centenas de millón y otro con contexto (población de Chile, distancia a la Luna)

### MA05 OA21: Perímetro y área de rectángulos

**Corregir**
- cmuli7jhm01g66krhy2q1qxhv | códigos de «$88.000» y «$48.000» | Están cruzados. 88.000 = (6 + 5) × 8.000: suma en vez de multiplicar (E1_OP). 48.000 = 6 × 8.000: omite el 5 (E3_DATO) | «$88.000» E1_OP, «$48.000» E3_DATO
- cmuli7jg901f26krhh2hn9d4h | código de «12 m²» | 6 + 6 suma en vez de multiplicar | E1_OP
- cmuli7jhg01g16krhug68a0ii | código de «9 cm por 1 cm» | Elige el de menor área, que es lo contrario de lo pedido | E3_PREG

**Mejorar**
- cmuli7jh301fm6krhb4hnmluy | opciones «7 cm por 3 cm» y «5 cm por 4 cm» (E2_CAL) | No corresponden a ningún error | «12 cm por 12 cm» (12 + 12 = 24, suma en vez de multiplicar), E1_OP; «10 cm por 2 cm» (su perímetro es 24), E1_OP
- cmuli7jh301fm6krhb4hnmluy, cmuli7jhg01g16krhug68a0ii | imagen (rect_options) | En los dos, la correcta es la tarjeta «A», y las letras no aparecen en las opciones | Quitar las letras u ordenar las tarjetas como las opciones
- cmuli7jhg01g16krhug68a0ii | prompt | Un niño puede dudar de que el cuadrado sea un rectángulo | «Todos estos rectángulos tienen un perímetro de 20 cm (un cuadrado también es un rectángulo). ¿Cuál tiene el mayor área?»
- cmuli7jgr01fh6krhxjg3mgst | opciones | Las 3 son E2_RES (la revisión automática lo marca) | Cambiar «12 cm» por «39 cm» (suma 30 + 9), E1_OP
- cmuli7jgk01fc6krhi01b04jv | opciones | Las 3 son E1_OP | Cambiar «56 cm» por «7 cm», E2_CAL
- cmuli7jh601fr6krhcqnljhm2 | hint | Da la descomposición completa | «Multiplica largo por ancho. Puedes descomponer uno de los factores.»

### MA05 OA16: Plano cartesiano

**Corregir**
- cmuli7jfn01ec6krh4hh07oeg | nivel | Solo hay que leer la segunda coordenada de (7, 3): es nivel 1 | level 1
- cmuli7jfv01em6krhgtdm4qks | nivel | Es una resta de coordenadas, y en la figura basta contar | level 2
- cmuli7jf801dx6krh4ldjfq8c | código de «Los dos están sobre el eje y» (E2_RES) | Es una idea equivocada sobre los ejes, no un error de procedimiento | E1_OP
- cmuli7jfv01em6krhgtdm4qks | código de «2» (E2_CAL) | 6 − 4 resta coordenadas de ejes distintos: es una idea equivocada | E1_OP
- cmuli7jes01dd6krh3zwumzm6 | opciones «8» y «4» | 6 + 2 y 6 − 2 no corresponden a errores reales | «0» (confunde la x del punto con el origen), E1_OP; «6 y 2» (da los dos números), E3_PREG

**Mejorar**
- cmuli7jfv01em6krhgtdm4qks | imagen | Solo se ven los vértices, sin los lados del triángulo | Dibujar los segmentos
- Habilidad completa | — | El OA pide «identificar y dibujar puntos», pero nunca se pide reconocer un punto en la figura | Agregar 1 o 2 ejercicios del tipo «¿Qué punto está en (3, 5)?», con A, B, C y D rotulados

### MA05 OA23: Promedio

**Corregir**
- cmuli7ji801gw6krh43a3vorj | prompt | 6 es a la vez el promedio y la moda, así que el niño que elige «el que se repite» acierta | «¿Cuál es el promedio de 2, 7, 5, 9 y 7?» (promedio 6, moda 7). «7» queda como E3_PREG
- cmuli7jil01hb6krh6799tmu5 | prompt | 20 es el promedio y también el dato repetido | Datos: 18, 21, 19, 23, 20 y 19 (suma 120, promedio 20)
- cmuli7jic01h16krh8sgsh2m5 | prompt | El promedio, 5,5, es igual a la primera nota | Notas: 4,8; 6,5 y 5,2 (suma 16,5, promedio 5,5). Distractores: «16,5» E2_RES, «6,5» E3_PREG, «5,0» E2_CAL
- cmuli7jj101hq6krhqqy861fs | nivel | Es un promedio directo de 4 datos | level 2
- cmuli7jj101hq6krhqqy861fs | opción «6,0» (E2_CAL) | No corresponde a ningún error | «5,3», que omite la última prueba (16 ÷ 3), E3_DATO

**Mejorar**
- cmuli7jhq01gc6krhwnwnkfel, cmuli7jhv01gh6krhu05tfhg3 | prompt | En los dos, el promedio es el dato del medio | Usar 4, 5 y 9 (promedio 6) y 10, 20 y 60 (promedio 30)
- cmuli7jhz01gm6krhn91pv0vr | opción «4» | Es la diferencia y no la mitad de la diferencia: está bien codificado E1_OP | Sin cambio

---

## 6° básico

### MA06 OA06: Adición y sustracción de fracciones y números mixtos (tiene fb y steps)

**Corregir**
- cmuli7jm601kq6krhxzi4wmsf («5/16»), cmuli7jmb01kv6krh2m1dqy06 («5/18»), cmuli7jmf01l06krh0wpfrljf («3/8 L»), cmuli7jml01l56krh0upwgnss («2/6»), cmuli7jmp01la6krhtssgy07l («3/9»), cmuli7jmu01lf6krhw5z9qmq7 («4/3»), cmuli7jmy01lk6krhu2rxrmtw («3 2/6»), cmuli7jn201lp6krhcrh6eomm («2/7»), cmuli7jn801lu6krhkcd21jp3 («8/8 L»), cmuli7jnb01lz6krhbvkav95b («3 4/6 km») | código | Sumar o restar los denominadores es aplicar una regla equivocada. MA03 OA11 lo codifica E1_OP | E1_OP. Si un ejercicio queda con 3 E1_OP, cambiar el distractor de operación inversa por uno de cálculo. Por ejemplo, en i4wmsf ya hay «6/8» E2_CAL; en pfrljf, cambiar «1/4 L» por «4/4 L» (E2_CAL)
- cmuli7jmy01lk6krhu2rxrmtw («3/4»), cmuli7jnb01lz6krhbvkav95b («1 1/4 km») | código | «Suma solo las fracciones y olvida los enteros» aplica el procedimiento a una sola parte del número | E2_RES
- cmuli7jmb01kv6krh2m1dqy06 | código de «2/9» | El propio fb dice que «es la cantidad que se resta»: usa un dato | E3_DATO

**Mejorar**
- Habilidad completa | — | No hay E3_PREG | Agregar una comparación con distractor de suma: «Sofía caminó 2 3/4 km el domingo y 1 1/2 km el sábado. ¿Cuántos km más caminó el domingo?» (1 1/4); «4 1/4» E3_PREG

### MA06 OA11: Ecuaciones de primer grado

**Corregir**
- cmuli7joc01n46krh61hzix5z | nivel | Es una ecuación de un paso (x + 8 = 23), igual a la de 5° (s47m5t) | level 2
- cmuli7joc01n46krh61hzix5z, cmuli7joi01n96krh3dkneyoz, cmuli7jon01ne6krh2iep9q8q | hint | La pista escribe la ecuación («x + 8 = 23», «3 × p = 4.500», «6 × c + 4 = 46»), que es justo lo que evalúa el L3 (modelar) | hzix5z: «Escribe una ecuación: lo que tenía, más lo que compró, es lo que tiene ahora.» kneyoz: «Escribe una ecuación con p: tres helados iguales cuestan $4.500 en total.» ep9q8q: «Escribe una ecuación con c: los lápices de las cajas más los sueltos dan el total.»
- cmuli7joi01n96krh3dkneyoz | código de «$4.500» (E3_PREG) | Copia el total del enunciado | E3_DATO

**Mejorar**
- cmuli7jo401mu6krhhlt57vzg | opciones | Las 3 son E1_OP | Cambiar «1,75» por «24», E2_CAL
- cmuli7jnj01m56krhey3zpvso, cmuli7jno01ma6krhl94i8b46 | prompt | Son ecuaciones de un paso con suma y resta, que es contenido de 4° y 5° | Reemplazar una por «4x + 6 = 30» (x = 6)

### MA06 OA24: Gráficos de barra doble y circulares

**Corregir**
- Los 10 ejercicios | prompt e imagen | El enunciado da todos los valores, así que el gráfico no se lee. Las imágenes rotulan con A/B, A/B/C, «1» y «2» en vez de fútbol/básquetbol, perros, enero/febrero o vainilla/frutilla. Los gráficos circulares no muestran porcentajes | Sacar los números del enunciado («Observa el gráfico. ¿Cuántos votos más tiene fútbol que básquetbol?») y rotular barras, sectores (con su %) y leyenda con nombres
- cmuli7jry01qy6krhjspvkl2b | prompt e imagen | Dice «barras dobles» y «compara la nota», pero la imagen tiene 2 barras simples de aprobados | «Un gráfico de barras muestra cuántos estudiantes aprobaron Matemática en 6°A y en 6°B. ¿Cuántos aprobaron entre los dos cursos?»
- cmuli7jry01qy6krhjspvkl2b | opciones «30» y «8» (E3_PREG) | No corresponden a ningún error | «42» (28 + 24 olvidando la reserva), E2_RES; «28» (solo 6°A), E3_DATO
- cmuli7jsr01rs6krhs8aeg1g5 | hint | «Ignora el sector de ciencias» desactiva el distractor «15» y además dicta el método | «Fíjate en qué sector te preguntan y usa solo el dato que le corresponde.»
- cmuli7jsa01rd6krhb1qg49re | código de «15%» (E2_CAL) | 45 − 30 resta en vez de sumar | E1_OP
- cmuli7jrt01qt6krhuikzq48e | opción «20%» (E2_CAL) | No corresponde a ningún error | «2%» (toma el denominador de 1/2), E1_OP

**Mejorar**
- cmuli7js201r36krhp52wm51y | código de «8» (E3_DATO) | Igual que «10», da un total en vez de la diferencia | E3_PREG
- cmuli7jrp01qo6krha7rvzuuf | prompt | Es un gráfico de barras simple, nivel de 3° | Pasarlo a barras dobles (dos cursos)
- cmuli7jsl01rn6krhtg9exukz | imagen | El eje x deja espacio vacío para un tercer grupo inexistente | Ajustar el eje a 2 grupos

### MA06 OA04: Porcentajes (tiene fb y steps)

**Corregir**
- cmuli7jlc01jv6krhutoyuohm | código de «240» (E2_RES) | Multiplica en vez de dividir. En i51jzx, ese mismo error («3.500») está como E1_OP | E1_OP
- cmuli7jl301jl6krh5twuqfj4 | opción «4» (E2_RES) | «Dividir por 20» no es un error real de un niño | «50» (toma el porcentaje como cantidad), E3_DATO, con fb: «50 es el porcentaje, no la cantidad. El 50 % es la mitad de 80.»
- cmuli7jl001jg6krh5kegrq6k | opción «25%»: código y ws | «Se piensa la mitad de 50» no es plausible. El error real es confundir 1/2 con 1/4, una idea equivocada | ws: «Se confunde la mitad con la cuarta parte. Respuesta: 25%.» Código: E1_OP

**Mejorar**
- Habilidad completa | — | No hay E2_CAL, y la relación porcentaje–decimal solo aparece en 1fhiar | Agregar «¿Qué decimal es el 35 %?» (0,35), con distractores «3,5» (E2_RES) y «35» (E1_OP)

### MA06 OA03: Razones

**Corregir**
- cmuli7jk601il6krhg17oe1uw | código de «6 : 4» (E1_OP) | Es la razón invertida | E3_PREG
- cmuli7jkh01iv6krh0g71zm7o | opción «5 : 3» (E1_OP) | Es el orden inverso al pedido, y ya hay 2 E3_PREG. Falta el error de no simplificar, que es justo lo que pide el enunciado | Cambiar por «18 : 30», E2_RES
- cmuli7jjs01i66krhanvj0gxm | imagen | Muestra a la izquierda los 2 grafitos (A) y a la derecha los 6 de colores (B). Eso induce el orden 2 : 6, que es el distractor | Poner primero los de colores o rotular con nombres en vez de A/B

**Mejorar**
- Imágenes «rows» (696984, vj0gxm, zdp7j9, 21lwrp, 7oe1uw, rh46c4, 71zm7o, qxrwtm) | imagen | Están rotuladas A/B, contra la convención acordada (sin letras, con nombres) | Rotular con nombres: «ganados» y «perdidos», «niñas» y «niños», etc.
- cmuli7jkq01j56krhrv2zljit | código de «30 cm» (E3_PREG) | Copia el dato | E3_DATO
- cmuli7jk301ig6krhxh21lwrp | opciones | 3 de 4 son E1_OP o se parecen | Cambiar «11» por «12» (copia las tazas de harina), E3_DATO

### MA06 OA17: Suma de ángulos interiores

Las imágenes coinciden con los enunciados. Medí los ángulos dibujados en qsm998, 4j7xnc, umseff, a01qnm y wvsfu9.

**Corregir**
- cmuli7jox01np6krh5lewqb14 | código de «150°» (E1_OP) | 180 − 30 omite el ángulo de 90° | E3_DATO
- cmuli7jp901o46krhiq5189o0 | códigos de «130°» y «50°» | Están cruzados. 130 = 180 − 50 usa uno solo de los ángulos iguales (E3_DATO). 50 supone que los tres ángulos son iguales, una idea equivocada (E1_OP) | 130° E3_DATO, 50° E1_OP
- cmuli7jpf01o96krhyfa01qnm | código de «145°» (E1_OP) | 180 − 35 omite el ángulo recto | E3_DATO
- cmuli7jpt01oo6krhfswvsfu9 | código de «90°» (E2_CAL) | 180 ÷ 2 ignora el ángulo de 40° | E3_DATO

**Mejorar**
- cmuli7jp201nu6krh4kesoxl1 | imagen y opciones | La pista habla de la diagonal, pero la figura no la tiene. Las 3 opciones son E1_OP | Dibujar la diagonal punteada. Cambiar «90°» por «340°» (error al sumar 180 + 180), E2_CAL
- cmuli7jpk01oe6krhf9umseff | imagen | Los ángulos rectos no tienen la marca cuadrada | Agregar las marcas de ángulo recto

### MA06 OA19: Volumen de cubos y paralelepípedos

Las imágenes coinciden con las medidas del enunciado (largo, alto y ancho, en todos los ejercicios).

**Corregir**
- cmuli7jq901p46krhod53e2ev | código de «52 cm²» (E1_OP) | Es el área total, otra magnitud | E3_PREG
- cmuli7jqz01py6krhhk8ptqbn | código de «30 cm» (E1_OP) | Es el área de la base: un paso incompleto | E2_RES
- cmuli7jr401q36krh4gwt481y | código de «500 cm³» (E2_CAL) | 10 × 10 × 5 duplica dos aristas: es una idea equivocada | E1_OP
- cmuli7jrd01qd6krhagh2xv03 | códigos de «60» y «1.000» | «60» divide por el área de una cara (E1_OP). «1.000» es el volumen de un cubo, un paso intermedio (E2_RES) | 60 E1_OP, 1.000 E2_RES
- cmuli7jq401oz6krhm2a8p11v | opción «81 cm³» (E2_RES) | No responde a ningún error identificable | «54 cm²» (área total), E3_PREG
- cmuli7jqm01pj6krhwrhiqpla | código de «8 cm» (E2_CAL) | Busca n × n = 64, como si fuera un cuadrado | E1_OP

**Mejorar**
- cmuli7jrd01qd6krhagh2xv03, cmuli7jr401q36krh4gwt481y | imagen | La etiqueta de la profundidad («20 cm», «5 cm») queda sobre la esquina trasera y se confunde con la arista superior | Moverla al centro de la arista oblicua

---

## Diversidad

**5° OA04, División.**
- Solo hay resolver problemas y cálculo directo. Falta representar (reparto con bloques), modelar y argumentar («¿quién tiene razón con el resto?»).
- No hay E3_DATO; un problema con dos datos numéricos lo permitiría.
- Faltan cocientes con cero intermedio (618 ÷ 3), estimar el cociente y comprobar (cociente × divisor + resto).

**5° OA15, Ecuaciones e inecuaciones.**
- El OA pide la forma pictórica (balanza) y no hay ninguna.
- Hay un solo E3_PREG.
- Las inecuaciones son solo «¿qué valor cumple?». Falta «¿cuántos naturales cumplen?».
- Falta argumentar («Ana dice que x = 23 es solución de x − 9 = 14. ¿Tiene razón?»).

**5° OA01, Números grandes.**
- No hay E3_DATO, y E3_PREG aparece solo tras recodificar.
- No hay números de 8 o 9 cifras, ni lectura de números (de cifras a palabras), ni contextos reales.
- No hay recta numérica (representar) ni argumentación sobre comparación.

**5° OA21, Perímetro y área.**
- El OA es «diseñar y construir rectángulos dados el perímetro y/o el área, y sacar conclusiones», pero solo 68a0ii y hnmluy van en esa línea.
- Faltan preguntas como «¿Cuántos rectángulos distintos de lados enteros tienen área 24 cm²?» y «Dos rectángulos con el mismo perímetro, ¿tienen la misma área?» (argumentar).
- No hay E3_PREG original.
- Hay pocos contextos.

**5° OA16, Plano cartesiano.**
- No hay E3_PREG.
- Todo es verbal o con el punto ya dibujado. Falta identificar qué punto está en (x, y) y «¿qué figura se forma al unir…?».
- Falta argumentar («¿(3, 5) y (5, 3) son el mismo punto?»).
- El nivel 3 es flojo.

**5° OA23, Promedio.**
- No hay interpretación en contexto, aunque el OA la pide («¿qué significa que el promedio de goles sea 2?»).
- Tampoco hay comparación entre dos grupos, efecto de un dato extremo ni datos en tabla o gráfico.
- Hay solo 2 E1_OP.
- En 4 de 11 ejercicios, el promedio coincide con un dato visible.

**6° OA06, Suma y resta de fracciones.**
- No hay E3_PREG.
- Hay pocos contextos de resta.
- Faltan fracciones impropias como sumandos (el OA las incluye) y resta de mixtos con canje (3 1/4 − 1 3/4).
- Falta argumentar.

**6° OA11, Ecuaciones.**
- 7 de 10 enunciados son calcados («¿Cuál es el valor de x en…?»).
- No hay balanza pictórica, aunque el OA la nombra, ni argumentación («¿x = 5 es solución de 2x + 3 = 11?»).
- Hay un solo E3_DATO.
- Faltan la incógnita a la derecha (11 = 2x + 3) y «elige la ecuación que modela el problema».

**6° OA24, Gráficos.**
- En la práctica no se lee ningún gráfico.
- Falta «comunicar conclusiones» («¿qué afirmación es correcta según el gráfico?»).
- Faltan la lectura con escala no unitaria, la relación sector–fracción (1/4 = 25 %) y la comparación entre las dos series de una barra doble.
- Hay pocos E2_RES y E2_CAL.

**6° OA04, Porcentajes.**
- No hay E2_CAL.
- Falta la relación con decimales (0,35 ↔ 35 %) y porcentajes mayores que 50 calculados por complemento (75 % de 80).
- La cuadrícula (representar) solo aparece en eqj845.

**6° OA03, Razones.**
- No hay E2_CAL ni E3_DATO.
- Falta representar (dibujo ↔ razón con nombres), argumentar («¿3 : 5 y 5 : 3 son la misma razón?») y tablas de razones.
- Los contextos son variados.

**6° OA17, Ángulos interiores.**
- El OA pide «demostrar de manera concreta, pictórica y simbólica», y no hay ningún ejercicio de argumentar («¿Por qué un triángulo no puede tener dos ángulos rectos?», «¿Por qué el cuadrilátero suma 360°?»).
- Hay un solo E2_RES.
- Faltan polígonos divididos en triángulos y figuras compuestas.

**6° OA19, Volumen.**
- No hay m³, aunque el OA pide cm³, m³ y mm³.
- Hay un solo E2_RES antes de recodificar.
- Falta argumentar («dos cajas con el mismo volumen y medidas distintas»), comparar volúmenes y contar cubos en una figura apilada (representar).
