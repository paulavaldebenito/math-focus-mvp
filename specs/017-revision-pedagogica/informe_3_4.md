# Informe de revisión pedagógica: banco 3° y 4° básico

**Alcance.** Hay 131 ejercicios de 3° y 103 de 4°. Los de fracciones (MA03 OA11, 41 ejercicios; MA04 OA08, 40) tienen steps en su totalidad, así que según la rúbrica no se revisaron. Revisé uno por uno los 90 ejercicios restantes de 3° y los 63 de 4°, y verifiqué cada cálculo. Abrí las imágenes de gráficos, cuerpos 3D, perímetro, área, simetría y valor posicional, más una muestra de reparto y agrupación. De las SVG leí las etiquetas de texto.

**Códigos.** Uso la taxonomía oficial de la app (server/prisma/seed.ts):

| Código | Nombre | Qué incluye |
|---|---|---|
| E1_OP | Confusión de operación | Operación, regla o concepto equivocado. |
| E2_RES | Reagrupación/procedimiento | Olvida la reserva; aplica el procedimiento a un solo término; deja un paso incompleto; pasos en mal orden. |
| E2_CAL | Cálculo puntual | Error aritmético o de conteo puntual. |
| E3_PREG | No responde lo preguntado | Da el complemento, otra magnitud o el orden inverso. |
| E3_DATO | Uso incorrecto de un dato | Omite o cambia un dato del enunciado. |

**Nota sobre las imágenes.** En el JSON exportado el campo `img` es `null` en los 234 ejercicios. Sin embargo, en `client/public/exercise-images/` hay imágenes con el id de cada ejercicio (prefijos 3b__ y 4b__). Revisé esas.

## Resumen

- **Matemática.** No encontré errores: todas las claves son correctas y únicas.
- **Códigos, con la taxonomía oficial.** Hay cinco criterios inconsistentes que conviene unificar:
  1. Dar el área en un ejercicio de perímetro está como E1_OP; en 4°, dar el perímetro en un ejercicio de área está como E3_PREG. Ambos son E3_PREG (otra magnitud).
  2. Poner un dígito en otra posición está como E2_RES. Es un error de concepto (E1_OP).
  3. «Se queda en el primer paso» aparece como E3_PREG, E3_DATO o E2_CAL. Corresponde a E2_RES (paso incompleto).
  4. «No aplica la escala» aparece como E1_OP, E3_DATO o E2_CAL. Corresponde a E1_OP.
  5. Los errores de reserva y canje ya están bien como E2_RES.
- **Imágenes que delatan la respuesta.**
  - 3°, valor posicional: 4qw7h0, mkevw0, i4iks4, 69n5fm, r4db0t, g612dj.
  - 3°, otras: la red del cilindro (aubzwb) y los gráficos con la escala ya convertida (oftlh2, ggl5v1).
  - 4°: cusl29 y d3h7iz.
- **Pistas que delatan.** En simetría de 4°, las pistas de a5c68v, t87zvz y 7zn6gx dicen cuántas líneas hay. También delatan las de cmky3b (3°) y 2ia6m8 (4°).
- **Imágenes defectuosas.**
  - doq1gg (4°): las letras no siguen el orden de las alternativas, y el «círculo» está dibujado como esfera.
  - xj9ueq (4°): el isósceles es idéntico al equilátero.
  - qe84ie (3°): la base del cilindro está mal dibujada.
- **Distractores.**
  - jgwgid (3°): «Rectángulos» también es correcta.
  - mzuh6d (4°): «Ninguno, las barras son iguales» es absurdo.
  - hswigd (3°): «63» es arbitrario.
- **Diversidad.**
  - Casi todo es «calcula y elige». Argumentar y comunicar no aparece, y modelar es escaso.
  - En los gráficos los datos vienen en el enunciado, así que no hay que leer el gráfico.
  - En 3°, perímetro no tiene figuras irregulares, y figuras 3D solo trabaja la red del cilindro.
- **Sin fb ni steps (ya conocido).**
  - 3° (90 ejercicios): OA05 10, OA06 11, OA08 13, OA09 14, OA12 12, OA15 10, OA21 10, OA25 10.
  - 4° (63 ejercicios): OA01 9, OA05 9, OA06 9, OA14 9, OA17 9, OA23 9, OA27 9.

---

## 3° básico

### MA03 OA05 · Valor posicional: unidades, decenas y centenas

**Corregir**
- cmuli7imf00jr6krhho4qw7h0 | imagen | La imagen muestra la tarjeta «3» sobre la etiqueta «100», así que basta leerla para responder. | Quitar las etiquetas 100/10/1, o reemplazar por bloques base 10 (3 placas, 7 barras, 2 cubos) sin rótulos.
- cmuli7imf00jr6krhho4qw7h0 | código | «7» y «2» (dígito de otra posición) son errores de concepto de posición. «300» (el valor en vez del dígito) es otra magnitud. | «7» → E1_OP; «2» → E1_OP; «300» → E3_PREG.
- cmuli7imo00k16krhd2mkevw0 | imagen + código | La imagen etiqueta el 0 con «10» (delata). «8» y «6» (otra posición) están como E2_RES. | Imagen sin etiquetas de posición. «8» → E1_OP; «6» → E1_OP.
- cmuli7imr00k66krhi2i4iks4 | imagen | El 6 aparece bajo la etiqueta «10», así que el valor 60 queda leído. | Usar bloques base 10 sin rótulos, o no usar imagen.
- cmuli7imr00k66krhi2i4iks4 | código | «6» es el dígito, no su valor (otra magnitud). «600» es error de posición (concepto). | «6» E1_OP → E3_PREG; «600» E2_RES → E1_OP.
- cmuli7in600kl6krhsv69n5fm | imagen | El tablero 6/100, 3/10, 8/1 es la descomposición que se pide. | Mostrar solo «638», o bloques base 10 sin rótulos.
- cmuli7in600kl6krhsv69n5fm | código | «600 + 3 + 8» y «60 + 30 + 8» asignan a un dígito un valor de otra posición: es concepto, no procedimiento. | Ambos E2_RES → E1_OP.
- cmuli7ine00kv6krh67r4db0t | imagen | Las tarjetas «3 × 100», «8 × 10» y «1 × 1» resuelven el acertijo. | Eliminar la imagen, o mostrar las pistas sin ordenar («3 → 300», «8 → 80», «termina en 1»).
- cmuli7ink00l06krhmig612dj | imagen | El tablero 2/100, 3/10, 4/1 da la respuesta directamente. | Mostrar una bolsa, un paquete y un caramelo con su contenido (100, 10, 1), sin descomponer el 234.
- cmuli7imj00jw6krhliati7df, cmuli7ina00kq6krhyxx32vtw, cmuli7ine00kv6krh67r4db0t, cmuli7in200kg6krhanp3tnoq, cmuli7ink00l06krhmig612dj | código | Las alternativas que colocan los dígitos en posiciones equivocadas no son reagrupación ni procedimiento: son confusión del concepto de valor posicional. Son «485», «548» (ati7df); «749», «479» (x32vtw); «831», «318» (r4db0t); «560» (p3tnoq); «3 bolsas, 2 paquetes y 4 sueltos», «4 bolsas, 3 paquetes y 2 sueltos» y «2 bolsas, 3 paquetes y 40 sueltos» (g612dj). | E2_RES → E1_OP. Mantener E2_RES solo en «56» (p3tnoq: omite el cero como marcador) y «7.205» (wc0itn: escribe los sumandos uno tras otro).

**Mejorar**
- cmuli7imw00kb6krhq5wc0itn | imagen | «1 × 700», «1 × 20», «1 × 5» es una representación rara que no ayuda. | Mostrar 7 placas, 2 barras y 5 cubos.
- cmuli7imw00kb6krhq5wc0itn | código | «752» intercambia decenas y unidades (concepto de posición). | E2_RES → E1_OP.
- (habilidad) | código | Tras recodificar quedaría casi todo E1_OP. | Agregar E3_PREG («dígito vs. valor») y E2_CAL en algún ejercicio nuevo; ver Diversidad.

### MA03 OA06 · Adición y sustracción hasta 1.000

**Corregir**
- cmuli7ip100mk6krhxg5jh3pp | código | «425» (250 + 175, sin hacer el segundo paso) es un paso incompleto. | E3_PREG → E2_RES.

**Mejorar**
- cmuli7ion00m56krhh7r08ys0 | opción «385» | Repetir un dato es poco plausible en una suma. | Reemplazar por «564» (E2_CAL: lleva la reserva, pero suma mal las centenas).
- cmuli7inq00l66krhh9rvvhg7 / cmuli7inu00lb6krh4ekeat8q / cmuli7io000lg6krhzm96p75l | prompt | Los 7 ejercicios de nivel 1 y 2 son «¿Cuánto es a ± b?», con pistas calcadas. | Convertir dos en otros formatos: «¿Qué número falta? 243 + □ = 368» y una estimación («¿A qué centena está más cerca 385 + 279?»).

(Los distractores por olvidar la reserva o no canjear, con E2_RES, están bien codificados: 315, 525, 474, 335, 554, 556 y $655, verificados columna por columna).

### MA03 OA08 · Tablas de multiplicar hasta el 10

**Corregir**
- cmun91hal003ztwrh33hswigd | opción «63» | No corresponde a ningún error identificable (56 + 8 = 64; 56 − 8 = 48). | Reemplazar por «64» (E1_OP: suma 8 en vez de contar saltos).
- cmuli7iqc00nz6krhoc082q3i | código | «54» (calcula la capacidad y no resta las 20 fotos) es un paso incompleto. | E3_PREG → E2_RES.

**Mejorar**
- cmuli7ipg00n06krhwvmnnnks | código | «20» (cuenta 5 sumandos en vez de 6) es un error de conteo puntual. | E3_DATO → E2_CAL.
- cmuli7iq300np6krhb7ya2spt / cmuli7iq800nu6krhucj0rtrg | nivel | Son problemas de un paso (7 × 4, 6 × 8), equivalentes a los de nivel 2. | Nivel 3 → 2, o agregar un segundo paso como en 082q3i.
- cmuli7iqc00nz6krhoc082q3i | imagen | El «−20» de la imagen anticipa el segundo paso. | Quitar «−20» de la imagen.

### MA03 OA09 · División como reparto y agrupación

**Corregir**
- cmuli7irq00pe6krhnqcwobqa | código | «8» (reparte, pero no resta lo regalado) es un paso incompleto. | E3_PREG → E2_RES.

**Mejorar**
- (habilidad) | distractores | En 10 de 14 ejercicios el E1_OP es «a − b» o «a + b» (36 en 42 ÷ 6; 54 en 45 ÷ 9…), un patrón repetido y poco plausible. | En algunos, usar el producto en vez del cociente (42 ÷ 6 → «252», E1_OP) o el divisor (E3_DATO).
- cmuli7iqi00o56krh07v5hwec / cmuli7iqm00oa6krhr3cbthja / cmuli7ir400op6krhd89p0e5y | prompt | Hay tres «¿Cuánto es a ÷ b?» calcados. | Convertir uno en «¿Qué división representa el dibujo?» (representar).

### MA03 OA12 · Patrones numéricos

**Corregir**
- cmuli7iuf00s36krhhq5urlld | código | «$1.500» es el total de lunes a viernes (100 + 200 + 300 + 400 + 500), no lo del viernes. | E1_OP → E3_PREG.
- cmuli7iuf00s36krhhq5urlld | código | «$400» (se detiene en el jueves) es un error de conteo puntual. | E3_DATO → E2_CAL.
- cmuli7itr00re6krhlztpf4k5 | código | «12» es el término que sigue al 10, no el que falta (responde otra cosa). | E2_CAL → E3_PREG.

**Mejorar**
- cmun91hlu004jtwrhqg46cboi | código | «12» (11 + 1) aplica una regla equivocada. | E2_CAL → E1_OP.

### MA03 OA15 · Figuras 3D, caras y redes

**Corregir**
- cmuli7iuz00so6krhhnjgwgid | opción «Rectángulos» | Un cuadrado es un rectángulo, así que esta alternativa también es correcta. | Reemplazar por «Rombos» o «Pentágonos» (E1_OP).
- cmuli7ivd00t36krh6waubzwb | imagen | La imagen es la red desplegada (2 círculos y 1 rectángulo): da la respuesta. | Mostrar el cilindro armado, no la red.
- cmuli7ivd00t36krh6waubzwb | código | «1 círculo y 1 rectángulo» no usa mal ningún dato: es pensar el cilindro como un vaso abierto (concepto). | E3_DATO → E1_OP.
- cmuli7ivp00ti6krhsvsdlqxd | código | «Cono» (E2_CAL) y «Prisma rectangular» (E2_RES) son confusiones de concepto. | Ambos → E1_OP.
- cmuli7ivp00ti6krhsvsdlqxd | hint + nivel | La pista («doblas el rectángulo formando un tubo y pegas los círculos») describe el cilindro. Además, es el inverso directo de aubzwb, que es de nivel 2. | Pista: «Piensa en qué figura 3D tiene dos caras planas circulares». Nivel 3 → 2.
- cmuli7ivu00tn6krh8gcmky3b | hint | «Compara las esquinas de ambos» apunta directo a los vértices, que es la respuesta. | «Compara las caras, las aristas y los vértices de las dos figuras.»
- cmuli7iv200st6krh4fqe84ie | imagen | La base inferior del cilindro es un arco blanco despegado bajo el cuerpo. | Redibujar la elipse inferior dentro del contorno.

**Mejorar**
- cmuli7ivm00td6krhrnu20gt1 | hint | «Cuenta 4 arriba, 4 abajo y las que unen ambos pisos» deja la cuenta casi hecha. | «Las aristas son los bordes donde se juntan dos caras. Recorre el cubo y no olvides las que no se ven.»
- cmuli7ivy00ts6krhmp98zqh6 | nivel | 3 × 6 con un dato memorizado no es de nivel 3. | Nivel 3 → 2.
- cmuli7ivd00t36krh6waubzwb | código | «2 círculos y 2 rectángulos» es una confusión de concepto, no un cálculo. | E2_CAL → E1_OP.
- cmuli7ivd00t36krh6waubzwb / cmuli7ivp00ti6krhsvsdlqxd | imagen | Los círculos de la red tienen brillo de esfera y parecen pelotas. | Dibujarlos planos, sin brillo.

### MA03 OA21 · Perímetro

**Corregir**
- cmuli7iw400ty6krhujdew2is, cmuli7iw800u36krh2xty69dv, cmuli7iws00ud6krhmfxxnyhd, cmuli7ix500us6krh626ywi0x, cmuli7ixb00ux6krh6rrw7fjz, cmuli7ixe00v26krh9s2zchat | código | La alternativa que da el área (36 cm, 21 cm, 96 m, 300 cm, 225 m, 1.000 m) es otra magnitud. Así se codifica en el área de 4°, donde dar el perímetro es E3_PREG. | E1_OP → E3_PREG.
- cmuli7iwy00ui6krhqgu6tmkf | código | «14 cm» (28 ÷ 2: cree que el cuadrado tiene 2 lados) es un error de concepto. | E2_CAL → E1_OP.
- cmuli7ix200un6krhunzfdrsy | código | «10 cm» (30 − 20, sin repartir entre los dos anchos) es un paso incompleto. | E2_CAL → E2_RES.

**Mejorar**
- cmuli7iw400ty6krhujdew2is, cmuli7iw800u36krh2xty69dv, cmuli7iws00ud6krhmfxxnyhd, cmuli7ix500us6krh626ywi0x, cmuli7ixb00ux6krh6rrw7fjz, cmuli7ixe00v26krh9s2zchat | código | «Suma 3 lados» (18, 13, 28, 55, 45, 105) está como E3_DATO. El enunciado no tiene un dato omitido: es aplicar el procedimiento a parte de los lados, igual que el semiperímetro (que está bien como E2_RES). | E3_DATO → E2_CAL (conteo de lados). Así no quedan dos E2_RES en el mismo ejercicio.
- cmuli7ixj00v76krh34xb4sap | código | «100 m» (calcula una vuelta y no multiplica por 2) es un paso incompleto. | E3_PREG → E2_RES (y «50 m» → E2_CAL, para no repetir).

### MA03 OA25 · Pictogramas y gráficos de barra simple

**Corregir**
- cmuli7iy200vs6krh8zoftlh2 | imagen | El enunciado dice «cada cuadrito vale 5; la barra llega a 6 cuadritos», pero el eje ya está graduado 0–30 y la barra llega a 30. Se lee la respuesta sin aplicar la escala. | Rótulos del eje en «cuadritos» (0–6) y leyenda «cada cuadrito = 5», o quitar los «cuadritos» del enunciado.
- cmuli7iyj00wc6krhlkggl5v1 | imagen | Mismo caso: el eje muestra 0–70 y las barras llegan a 70 y 40, así que se anula la conversión. | Igual que el anterior.
- cmuli7iyj00wc6krhlkggl5v1 | código | «3» (resta los cuadritos sin aplicar la escala) es el mismo error que «6» en oftlh2, que está como E1_OP. «70» (los puntos de Sara) responde otra cosa. | «3» E2_CAL → E1_OP; «70» E3_DATO → E3_PREG.
- cmuli7iyt00wh6krh25euztl0 | código | «12» no es un error de cálculo: es el martes solo (4 × 3), que omite datos. | E2_CAL → E3_DATO.
- cmuli7ixx00vn6krhh0au2498 | código | «6» (4 + 2) es sumar en vez de multiplicar. | E2_CAL → E1_OP.

**Mejorar**
- cmuli7ixx00vn6krhh0au2498 | imagen | El enunciado habla de «dibujos de libro» y de la fila «Lunes»; la imagen muestra pelotas y la fila «A». | Usar un ícono de libro y rotular la fila «Lunes».
- cmuli7ixo00vd6krh99f51gfa, cmuli7ixu00vi6krhsxtgt0mm, cmuli7iy600vx6krhu7gbqa5u, cmuli7iya00w26krht73ngxgf, cmuli7iz000wm6krh092w5ih7 | prompt | El enunciado da los valores de las barras, así que no hace falta leer el gráfico. Además, las barras están rotuladas A/B/C. | Quitar los números del enunciado y rotular las barras con la categoría.

### MA03 OA11 · Fracciones
No hay ejercicios en el alcance: los 41 tienen steps.

---

## 4° básico

### MA04 OA01 · Números hasta 10.000

**Corregir**
- cmuli7iza00wx6krhtrcusl29 | imagen | El tablero rotula el 7 con «10», así que el valor 70 queda leído. | Mostrar solo «5.273», o un tablero sin rótulos de valor.
- cmuli7iza00wx6krhtrcusl29 | código | «7» es el dígito y no su valor (otra magnitud). «700» y «7.000» son errores de posición (concepto). | «7» E1_OP → E3_PREG; «700» y «7.000» E2_RES → E1_OP.
- cmuli7izj00x76krhh5d3h7iz | imagen | El tablero 7/1000, 0/100, 8/10, 6/1 es la descomposición que se pide. | Mostrar solo «7.086».
- cmuli7izj00x76krhh5d3h7iz | código | «7.000 + 800 + 6» y «7.000 + 8 + 6» son errores de posición. | E2_RES → E1_OP.
- cmuli7iz600ws6krh0hp3r09q | código | «3.542» intercambia centenas y decenas (concepto de posición). | E2_RES → E1_OP.
- cmuli7izv00xm6krh3klfxb4g | código | «siete mil cincuenta y ocho» (7.058) y «siete mil quinientos ochenta» (7.580) leen el número con dígitos en otra posición. | E2_RES → E1_OP.

**Mejorar**
- cmuli7ize00x26krh50ovtlz7 | código | «3.500» suma 1.000 en vez de 100 (posición). | E2_RES → E1_OP.
- cmuli7j0200xr6krhc16oh7wf | código + nivel | «5.450» (suma 3.000) y «2.480» (suma 30) son errores de posición. Además, 2.450 + 300 no es de nivel 3. | «5.450» E2_RES → E1_OP; «2.480» E3_DATO → E1_OP. Nivel 3 → 2.
- cmuli7izn00xc6krh6kidv98f | código | «4.025, 4.052, 4.250, 4.205» falla en una comparación puntual. | E2_RES → E2_CAL.
- cmuli7j0500xw6krhqxjg6fvg | opción «3.508» | Falta el error más típico: empezar con 0. | Reemplazar «3.508» por «358» (E1_OP: un número de 4 cifras no puede empezar con 0).

### MA04 OA05 · Multiplicación de 3 dígitos por 1

**Corregir**
- cmuli7j0y00yr6krh0pwjgjd3 | código | «2.500» redondea 398 a 500: es un redondeo mal hecho, no un dato mal usado. | E3_DATO → E2_CAL. («500», solo redondea sin multiplicar, está bien como E2_RES.)
- cmuli7j0j00yc6krhue3bw6ql | código | «56» (no agrega el cero de las decenas) es el mismo error que «36» en si7aor, que está como E2_RES. | E3_DATO → E2_RES.

**Mejorar**
- cmuli7j0f00y76krhonfofth2, cmuli7j1700z16krhm40sczwf, cmuli7j1a00z66krhsmycqji0 | código | «606» (omite 10 × 3), «$1.360» (omite 5 × 4) y «$2.700» (omite 50 × 3) aplican la descomposición a solo algunos términos. | E3_DATO → E2_RES.
- cmuli7j0r00ym6krhuhj7u2gq | código | «843» (suma 3 en vez de 3 × 4) aplica la propiedad distributiva a medias. | «843» E3_DATO → E2_RES. Para no repetir E2_RES con «842» (pierde la decena de 12, bien codificada), reemplazar «842» por «812» (E2_CAL).

(Los distractores «692» y «602 km», por no llevar, están bien como E2_RES; verificados).

### MA04 OA06 · División de 2 dígitos por 1

**Corregir**
- cmuli7j1z00zw6krhnwfiyyul | código | «2 y resto 9» intercambia cociente y resto: es el orden inverso al pedido. | E1_OP → E3_PREG. («8 y resto 7», resto mayor que el divisor, está bien como E2_RES.)
- cmuli7j2g010g6krhif2ia6m8 | hint | «esas personas también necesitan un auto» resuelve la interpretación del resto, que es justo lo que se evalúa. | «Divide 45 por 4. Antes de elegir, comprueba: ¿caben todas las personas en esa cantidad de autos?»
- cmuli7j2g010g6krhif2ia6m8 | código | «11» divide bien, pero no responde la pregunta («que nadie quede sin lugar»). | E2_RES → E3_PREG.

**Mejorar**
- cmuli7j2301016krhozy666a5 | código | «7 × 7 = 49» usa el cociente en lugar del divisor (cambia un dato). | E2_CAL → E3_DATO.
- cmuli7j1l00zh6krh4gpn2zv8 | prompt | Con «Sabes que 7 × 6 = 42» el ejercicio es trivial incluso para nivel 1. | Quitar el dato del enunciado y dejar en la pista «usa la tabla del 6».

### MA04 OA14 · Ecuaciones e inecuaciones de un paso

**Corregir**
- cmuli7j4301266krh3k7qpovb | código | «20» (20 + 10 = 30, que no es > 30) confunde > con ≥: es un error de concepto. | E2_CAL → E1_OP.
- cmuli7j4h012l6krhv05s57z2 | código | «25» (25 + 15 = 40, que no es < 40) es el mismo caso. | E2_CAL → E1_OP.

**Mejorar**
- cmuli7j4301266krh3k7qpovb / cmuli7j4h012l6krhv05s57z2 | hint | «(no basta con que sea igual)» y «(igual a 40 no sirve)» anticipan la trampa que el distractor quiere detectar. | Quitar el paréntesis: «Prueba cada número: súmale 10 y compara con 30 usando el signo >.»
- cmuli7j4l012q6krhwvhr6hj1 | código | «24» repite un dato del enunciado. | E3_PREG → E3_DATO.

(Los distractores sin canje o sin reserva, «55», «65», «25» y «$28», están bien como E2_RES; verificados).

### MA04 OA17 · Simetría

**Corregir**
- cmuli7j5e013l6krhqta5c68v | hint | «Prueba doblar desde cada vértice hasta el punto medio del lado de enfrente» equivale a decir «3». | «Imagina doblar el triángulo de distintas formas. Cuenta solo los dobleces en que las dos mitades calzan exactamente.»
- cmuli7j5q01406krh5bt87zvz | hint | «Cada línea pasa por un vértice… Cuenta cuántos vértices hay» da la respuesta. | «Busca dobleces en que las dos mitades calcen y revisa que no cuentes dos veces el mismo.»
- cmuli7j61014a6krh657zn6gx | hint | «Solo sirve doblar por el ángulo recto…» dice que hay exactamente una. | «Prueba distintos dobleces y revisa en cuáles las dos mitades calzan justo.»
- cmuli7j5h013q6krhiwdoq1gg | imagen | Según la leyenda, las letras siguen el orden de las alternativas (cuadrado, círculo, paralelogramo, triángulo), pero en la imagen A = paralelogramo, B = cuadrado y C = círculo. Además, el «círculo» está dibujado como esfera, que no es una figura 2D. | Reordenar la imagen según las alternativas y dibujar el círculo plano.
- cmuli7j5h013q6krhiwdoq1gg | opción «Un paralelogramo de lados contiguos distintos y sin ángulos rectos» | Es la más larga y técnica (la forma delata) y no es adecuada para 9–10 años. | «Un romboide».
- cmuli7j5v01456krhncxj9ueq | imagen | C (equilátero) y D (isósceles) están dibujados idénticos. | Dibujar D como un isósceles claramente no equilátero.
- cmuli7j5101366krhzfptirfp | código | «2» (cuenta solo los dobleces por el medio y olvida las diagonales) es un error de concepto. | E2_RES → E1_OP.
- cmuli7j61014a6krh657zn6gx | código | «2» (E2_RES) y «0» (E3_PREG) son ideas equivocadas sobre la simetría: no son procedimiento ni otra pregunta. | Ambos → E1_OP.

**Mejorar**
- cmuli7j55013b6krheddw9v0u | código | «1» es una idea equivocada, no un procedimiento. | E2_RES → E1_OP.
- cmuli7j5q01406krh5bt87zvz / cmuli7j5e013l6krhqta5c68v | código | «10» y «6» (cuenta vértices y lados, o cada línea dos veces) son errores de concepto. | E2_CAL → E1_OP.
- cmuli7j5v01456krhncxj9ueq / cmuli7j5h013q6krhiwdoq1gg | opción «Un triángulo isósceles» | Un equilátero también es isósceles. No genera dos respuestas correctas, pero es impreciso. | «Un triángulo isósceles que no es equilátero».

### MA04 OA23 · Área de rectángulos y cuadrados

**Mejorar**
- cmuli7j68014g6krhbemyci4h, cmuli7j6l014v6krh3x4lgpva, cmuli7j6y015a6krhlxgd4aqy, cmuli7j6h014q6krheea6k0rt | código | Con la taxonomía oficial, E2_RES es reagrupación o procedimiento. Escribir «15 cm», «40 m» o «12 m» en lugar de una unidad cuadrada, o elegir cm² para una sala, es una confusión del concepto de unidad de área. | E2_RES → E1_OP. (Si se prefiere mantener «unidad mal escrita» en E2_RES, conviene dejarlo explícito en la convención.)
- cmuli7j68014g6krhbemyci4h | imagen | La pista habla de filas y columnas de cuadrados de 1 cm, pero la imagen es un rectángulo liso. | Dibujar la cuadrícula 5 × 3 dentro del rectángulo.

### MA04 OA27 · Pictogramas y gráficos de barras con escala

**Corregir**
- cmuli7j7n01606krh2nmzuh6d | opción «Ninguno, las barras son iguales» | Es absurda: el enunciado da 12, 18 y 9. | Reemplazar por «18» (E3_PREG: da el valor, no el color).
- cmuli7j8a016p6krhyrc791vj | código | «20» sale de leer la barra de María como 60 (error de lectura puntual). | E2_RES → E2_CAL.
- cmuli7j82016f6krhczkg6hd8 | código | «20» omite el medio símbolo (omite un dato). «30» cuenta el medio como entero (concepto). | «20» E2_RES → E3_DATO; «30» E2_CAL → E1_OP.
- cmuli7j7e015q6krhrs33vy7f / cmuli7j7j015v6krhwhdp453u / cmuli7j8f016u6krhrhikngjt | código | «4», «3» y «8» cuentan símbolos o líneas sin aplicar la escala. Es el mismo error que en 3° (oftlh2), donde está como E1_OP. | E3_DATO → E1_OP.
- cmuli7j7w016a6krhnsuucw3w | código | «18» es el valor de Azul, no la diferencia (otra magnitud). | E3_DATO → E3_PREG.

**Mejorar**
- cmuli7j86016k6krhsoqlrpxm | imagen + prompt | El eje va de 3 en 3, así que 25 y 20 quedan entre líneas. Además, el enunciado da los números y no menciona el gráfico. | Usar una escala de 5 en 5 y escribir «Mira el gráfico de visitas…» sin dar los valores.
- cmuli7j7n01606krh2nmzuh6d / cmuli7j7q01656krhd8s0s947 / cmuli7j7w016a6krhnsuucw3w | prompt | Los tres repiten «Rojo 12, Azul 18, Verde 9» en el texto, así que no se lee el gráfico. | Quitar los valores del enunciado y rotular las barras con el color.

### MA04 OA08 · Fracciones
No hay ejercicios en el alcance: los 40 tienen steps.

---

## Diversidad

**3° OA05, valor posicional.** Tras recodificar, casi todo quedaría E1_OP. No hay E3_PREG (se puede usar «dígito vs. valor») ni E2_CAL. Faltan:
- leer y escribir el número en palabras;
- componer con canjes («2 centenas y 15 decenas»);
- argumentar («¿Quién tiene razón: 506 tiene 50 decenas?»).

**3° OA06, adición y sustracción.** Faltan:
- la relación inversa («comprueba 604 − 278 = 326 con una suma»);
- cálculo mental y estimación;
- problemas de comparación («¿cuántos más?») y de cambio con la incógnita al inicio.

Hay solo 2 E3_DATO y 2 E3_PREG.

**3° OA08, tablas.** No hay E2_RES y apenas hay E3. Hay 3 enunciados «¿Cuánto es a × b?» calcados. Faltan:
- arreglos rectangulares (representar);
- elegir la multiplicación que modela una situación;
- argumentar sobre propiedades («¿por qué 3 × 8 = 8 × 3?»).

**3° OA09, división.** No hay E2_RES (salvo tras recodificar cwobqa). Los E1_OP siguen el mismo patrón «a ± b», y hay 3 «¿Cuánto es a ÷ b?» calcados. Faltan:
- crear o elegir un problema que corresponda a una división (modelar);
- distinguir reparto de agrupación («¿Cuál de estas situaciones pregunta cuántos grupos?»).

**3° OA12, patrones.** No hay E2_RES, y hay solo 1 E3_PREG (tras la corrección). Solo un ejercicio pide describir la regla. Faltan:
- patrones en la tabla del 100 con imagen;
- completar una tabla;
- detectar el error en un patrón (argumentar).

**3° OA15, figuras 3D.** La única red es la del cilindro. Faltan:
- redes del cubo («¿cuál de estas redes arma un cubo?»);
- redes del prisma, la pirámide y el cono;
- relacionar las caras 2D con el cuerpo.

Predomina E1_OP (20 de 30 distractores).

**3° OA21, perímetro.** El OA pide figuras regulares e irregulares, pero todo son cuadrados o rectángulos, más un triángulo. Faltan:
- una figura irregular o en L;
- el perímetro en una cuadrícula;
- comparar perímetros.

En 9 de 10 ejercicios la estructura de distractores es la misma: área, semiperímetro y tres lados.

**3° OA25, gráficos.** No hay E2_RES. Los datos van en el enunciado y no se leen del gráfico. Faltan:
- completar un gráfico a partir de una tabla;
- elegir el gráfico que corresponde a unos datos;
- preguntas de conclusión («¿Qué afirmación es verdadera según el gráfico?»).

**4° OA01, números hasta 10.000.** Tiene buena variedad: leer, ordenar, recta numérica y formar números con dígitos. Faltan:
- comparar con los signos < y >;
- descomponer de forma no canónica («7.086 = 70 centenas + 86»).

**4° OA05, multiplicación.** No hay E3_PREG. Todos los contextos son «precio × cantidad» o «km × días». Faltan:
- el modelo de área para la propiedad distributiva (representar);
- juzgar si una estimación es razonable (argumentar).

**4° OA06, división.** Solo 3 ejercicios tienen resto: hay uno de cada interpretación, pero ninguno de comprobación (cociente × divisor + resto = dividendo). Faltan también problemas en que el resto sea la respuesta en otro contexto.

**4° OA14, ecuaciones e inecuaciones.** Los 3 problemas contextualizados no piden plantear la ecuación. Faltan:
- elegir la ecuación que representa la situación (modelar);
- la balanza como representación;
- una inecuación en contexto.

**4° OA17, simetría.** 6 de 9 ejercicios preguntan «cuántas líneas tiene». Faltan:
- decidir si una línea dibujada es de simetría;
- completar una figura simétrica en una cuadrícula;
- objetos del entorno.

Casi todo es E1_OP (y lo será más tras recodificar). Falta E3.

**4° OA23, área.** Los 9 ejercicios usan la misma terna de distractores: perímetro, suma de lados y unidad lineal. Faltan:
- contar cuadrados en una cuadrícula (concepto de área);
- construir distintos rectángulos con un área dada, que el OA pide explícitamente;
- argumentar si un mismo perímetro implica la misma área.

**4° OA27, gráficos con escala.** Solo c791vj obliga a interpolar entre líneas. Faltan:
- preguntas de conclusión y argumentación;
- la lectura inversa del pictograma («¿Cuántos símbolos dibujas para 35 si cada uno vale 10?»).

**Habilidades transversales (ambos cursos).**
- **Resolver problemas.** Domina en casi todos los ejercicios.
- **Representar.** Aparece sobre todo a través de las imágenes.
- **Modelar.** Es escaso (48wf9v, y666a5).
- **Argumentar y comunicar.** No aparece en ningún ejercicio no fraccionario.
- **Niveles.** El reparto es equilibrado (3/4/3 o 3/3/3), pero varios ejercicios de nivel 3 son de un solo paso: ya2spt, j0rtrg, rw7fjz, 98zqh6, 6oh7wf.
