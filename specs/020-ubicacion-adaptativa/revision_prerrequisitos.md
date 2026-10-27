# Revisión pedagógica del mapa de prerrequisitos (eje Números y operaciones)

**Objeto revisado:** `server/src/domain/prerequisites.ts` (23 habilidades, 33 enlaces), y como contexto `server/src/assessment/placement.ts`.
**Revisor:** agente pedagógico independiente, 2026-10-27.
**Fuente primaria:** *Bases Curriculares 1° a 6° Básico* (MINEDUC, 2012, Decreto 439/2012), Matemática, Objetivos de Aprendizaje por curso:
<https://www.curriculumnacional.cl/614/articles-22394_bases.pdf>. Páginas impresas: 1° p. 227, 2° pp. 231–232, 3° pp. 235–236, 4° pp. 241–242, 5° pp. 247–248 y 6° p. 253.

**Acceso a las fuentes:** las fichas individuales por OA del portal (`/portal/Educacion-General/Matematica-2-basico/MA02-OA-11` y variantes) respondieron **404**, así que no pude leer ninguna ficha OA por OA. Todos los textos citados abajo salen del documento oficial completo de las Bases, que sí descargué y leí. No revisé los *Programas de Estudio* ni sus indicadores de evaluación. Por eso marco como «no verificado» todo lo que dependa de ellos.

Revisé además los demás OA del eje Números y operaciones de 1° a 6°. Los que no son habilidad en la app, como MA01 OA07–OA08, MA02 OA05–OA06, MA03 OA04, MA04 OA09–OA10 y MA05 OA08–OA09, no pueden entrar al grafo. Los menciono cuando explican por qué un enlace sustituto es razonable o no.

---

## 1. Discrepancias entre el código OA y el nombre de la habilidad

Los 23 códigos corresponden al contenido que dice el nombre de la habilidad: no hay ningún código cambiado. Hay cuatro matices de nombre, ordenados de más a menos importante.

| OA | Nombre en la app | Texto oficial (cita textual) | Discrepancia | Recomendación |
|---|---|---|---|---|
| **MA06 OA03** | Razones y proporciones | «Demostrar que comprenden el concepto de razón de manera concreta, pictórica y simbólica, en forma manual y/o usando software educativo.» (p. 253) | El OA no menciona **proporciones**. La proporcionalidad no aparece en ningún OA de 1° a 6°. | Renombrar a «Razones» o «Razones y razones equivalentes». Corregir el porqué del enlace a MA03 OA08, que habla de «completar proporciones». |
| **MA02 OA09** | Adición y sustracción dentro de 100 | «Demostrar que comprende la adición y la sustracción en el ámbito del 0 al 100: […] aplicando el algoritmo de la adición y la sustracción **sin considerar reserva** […]» (p. 231) | El nombre no dice «sin reserva». El banco sí lo respeta: lo dice el comentario de `grade2.ts`, y los ejercicios de muestra no tienen canje. La reserva llega en **MA03 OA06**: «aplicando los algoritmos **con y sin reserva**» (p. 235). | Considerar «Adición y sustracción dentro de 100, sin reserva». Consecuencia para la ubicación: un vacío de *reserva* se diagnostica en MA03 OA06, no más abajo (ver riesgo R6). |
| **MA04 OA06** | División de dos dígitos por uno, **con y sin resto** | «Demostrar que comprenden la división con dividendos de dos dígitos y divisores de un dígito: usando estrategias para dividir […] utilizando la relación que existe entre la división y la multiplicación, estimando el cociente, aplicando la estrategia por descomposición del dividendo, aplicando el algoritmo de la división» (pp. 241–242) | El texto de 4° **no menciona el resto**. El resto aparece explícito en 5°: MA05 OA04, «interpretando el resto» (p. 247). Puede que el Programa de 4° lo incluya en sus indicadores; no lo verifiqué. | Diferencia menor. En la ubicación, que los ítems de 4° sean de preferencia divisiones exactas y que el resto se evalúe en 5°. |
| **MA06 OA04** | Porcentajes **y su relación con fracciones y decimales** | «Demostrar que comprenden el concepto de porcentaje de manera concreta, pictórica y simbólica, de forma manual y/o usando software educativo.» (p. 253) | El texto del OA no habla de la relación con fracciones ni con decimales. Probablemente sale de los indicadores del Programa, que no verifiqué. | Diferencia menor; se puede mantener. Es justamente lo que respalda el enlace a MA05 OA07. |

### Coincidencias verificadas

- **MA01 OA01** «Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atrás, empezando por cualquier número menor que 100.» ✔
- **MA01 OA04** «Comparar y ordenar números del 0 al 20 de menor a mayor y/o viceversa […]» ✔
- **MA01 OA06** «Componer y descomponer números del 0 a 20 de manera aditiva, en forma concreta, pictórica y simbólica.» ✔
- **MA01 OA09** «Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente […]» ✔
- **MA02 OA07** «Identificar las unidades y decenas en números del 0 al 100, representando las cantidades de acuerdo a su valor posicional […]» ✔
- **MA02 OA11** «Demostrar que comprende la multiplicación: […] expresando una multiplicación como una adición de sumandos iguales; usando la distributividad como estrategia para construir las tablas del 2, del 5 y del 10; resolviendo problemas que involucren las tablas del 2, del 5 y del 10.» ✔ Las tablas de 2° **sí** son el OA11.
- **MA03 OA05** «Identificar y describir las unidades, las decenas y las centenas en números del 0 al 1.000 […]» ✔
- **MA03 OA06** «Demostrar que comprenden la adición y la sustracción de números del 0 al 1.000 […] aplicando los algoritmos con y sin reserva […]» ✔
- **MA03 OA08** «Demostrar que comprenden las tablas de multiplicar hasta el 10 de manera progresiva […]» ✔
- **MA03 OA09** «Demostrar que comprenden la división en el contexto de las tablas de hasta 10 · 10: representando y explicando la división como repartición y agrupación en partes iguales […] describiendo y aplicando la relación inversa entre la división y la multiplicación […]» ✔
- **MA03 OA11** «Demostrar que comprenden las fracciones de uso común: 1/4, 1/3, 1/2, 2/3, 3/4: explicando que una fracción representa la parte de un todo […] comparando fracciones de un mismo todo, de igual denominador» ✔
- **MA04 OA01** «Representar y describir números del 0 al 10 000: […] comparándolos y ordenándolos […] identificando el valor posicional […] componiendo y descomponiendo […]» ✔
- **MA04 OA05** «Demostrar que comprenden la multiplicación de números de tres dígitos por números de un dígito: […] utilizando las tablas de multiplicación […] usando la propiedad distributiva […] aplicando el algoritmo […]» ✔
- **MA04 OA08** «Demostrar que comprende las fracciones con denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2: explicando que una fracción representa la parte de un todo o de un grupo de elementos y un lugar en la recta numérica […] comparando y ordenando fracciones […]» ✔
- **MA05 OA01** «Representar y describir números naturales de hasta más de 6 dígitos y menores que 1.000 millones: identificando el valor posicional […] aproximando cantidades; comparando y ordenando […]» ✔
- **MA05 OA04** «Demostrar que comprenden la división con dividendos de tres dígitos y divisores de un dígito: interpretando el resto […]» ✔
- **MA05 OA07** «Demostrar que comprenden las fracciones propias: […] creando grupos de fracciones equivalentes –simplificando y amplificando– […] comparando fracciones propias con igual y distinto denominador […]» ✔
- **MA06 OA05** «Demostrar que comprenden las fracciones y los números mixtos: identificando y determinando equivalencias entre fracciones impropias y números mixtos […] representando estos números en la recta numérica» ✔
- **MA06 OA06** «Resolver adiciones y sustracciones de fracciones propias e impropias y números mixtos con numeradores y denominadores de hasta dos dígitos.» ✔

Todas las citas están tomadas de <https://www.curriculumnacional.cl/614/articles-22394_bases.pdf>.

---

## 2. Veredicto por enlace (33 enlaces actuales)

«Redundante» significa que el prerrequisito ya se alcanza por otro enlace de la misma habilidad, así que el enlace directo no agrega camino nuevo. Con el algoritmo actual eso es inocuo: una base inferida o ya evaluada no se vuelve a preguntar.

| # | Habilidad | → Prerrequisito | Veredicto | Razón curricular (una línea) |
|---|---|---|---|---|
| 1 | MA01 OA04 | MA01 OA01 | **Mantener** | Comparar y ordenar hasta 20 se apoya en la secuencia numérica. |
| 2 | MA01 OA06 | MA01 OA01 | **Mantener** | Componer y descomponer cantidades se apoya en el conteo (1° OA06 sigue a OA01–OA03). |
| 3 | MA01 OA09 | MA01 OA06 | **Mantener** | Las estrategias de 1° («completar 10», OA07) usan la descomposición aditiva. |
| 4 | MA02 OA07 | MA01 OA01 | **Mantener** (redundante, inocuo) | Contar de 10 en 10 sostiene la decena. Ya se alcanza vía MA01 OA06. |
| 5 | MA02 OA07 | MA01 OA06 | **Mantener** | Decenas y unidades extienden la composición aditiva; su precursor real (MA01 OA08) no está en la app. |
| 6 | MA02 OA09 | MA01 OA09 | **Mantener** | 2° OA09 dice «aplicando los resultados de las adiciones y las sustracciones de los números del 0 a 20». |
| 7 | MA02 OA09 | MA02 OA07 | **Mantener** | El algoritmo sin reserva opera decenas y unidades por separado. |
| 8 | MA02 OA11 | MA01 OA01 | **Mantener** (redundante, inocuo) | Las tablas del 2, 5 y 10 son el conteo de 2 en 2, de 5 en 5 y de 10 en 10. Es el eslabón más directo hacia 1°. |
| 9 | MA02 OA11 | MA02 OA09 | **Mantener** | El OA11 dice «expresando una multiplicación como una adición de sumandos iguales». |
| 10 | MA03 OA05 | MA02 OA07 | **Mantener** | Amplía decenas y unidades a centenas. |
| 11 | MA03 OA06 | MA02 OA09 | **Mantener** | Amplía la suma y la resta hasta 1.000 y agrega la reserva. |
| 12 | MA03 OA06 | MA03 OA05 | **Mantener** | La reserva (canje) exige el valor posicional hasta las centenas. |
| 13 | MA03 OA08 | MA02 OA11 | **Mantener** | Las tablas hasta el 10 amplían las del 2, 5 y 10 con la misma distributividad. |
| 14 | MA03 OA09 | MA03 OA08 | **Mantener** | El OA9 dice «división en el contexto de las tablas de hasta 10 · 10» y su «relación inversa». |
| 15 | MA03 OA11 | MA03 OA09 | **Corregir** → MA01 OA04 | El OA11 de 3° es «parte de un todo», no reparto con tablas: los ítems de división de la app (48 ÷ 6) no evalúan partir un todo, y un error en fracciones mandaría al niño a las tablas. |
| 16 | MA04 OA01 | MA03 OA05 | **Mantener** | Amplía el valor posicional de 1.000 a 10.000. |
| 17 | MA04 OA05 | MA03 OA08 | **Mantener** | El OA5 dice «utilizando las tablas de multiplicación». |
| 18 | MA04 OA05 | MA03 OA05 | **Mantener** (queda redundante si se agrega A1; inocuo) | «Usando la propiedad distributiva»: se descompone en centenas, decenas y unidades. |
| 19 | MA04 OA06 | MA03 OA09 | **Mantener** | Amplía la división en el contexto de las tablas a dividendos de dos dígitos. |
| 20 | MA04 OA06 | MA03 OA08 | **Mantener** (redundante, inocuo) | El OA6 dice «utilizando la relación que existe entre la división y la multiplicación». Ya se alcanza vía MA03 OA09. |
| 21 | MA04 OA08 | MA03 OA11 | **Mantener** | Amplía las fracciones de uso común a más denominadores, a la recta y a la comparación. |
| 22 | MA05 OA01 | MA04 OA01 | **Mantener** | Amplía el valor posicional a más de 6 dígitos. |
| 23 | MA05 OA04 | MA04 OA06 | **Mantener** | Amplía la división a dividendos de tres dígitos. |
| 24 | MA05 OA04 | MA04 OA05 | **Corregir** (solo el porqué) | El enlace sirve, pero no por «multiplica y resta en cada paso»: cada paso multiplica dígito por dígito, y eso son las tablas. La razón correcta es que 3 dígitos × 1 es la operación inversa en el mismo ámbito y se usa para comprobar: cociente × divisor + resto = dividendo. |
| 25 | MA05 OA07 | MA04 OA08 | **Mantener** | Amplía la comparación de 4° a la equivalencia, simplificando y amplificando. |
| 26 | MA05 OA07 | MA03 OA08 | **Mantener** | Amplificar o simplificar es multiplicar o dividir por el mismo número, lo que exige las tablas. Si se aplica el cambio 15, deja de ser redundante. |
| 27 | MA06 OA03 | MA05 OA07 | **Mantener** | Las razones equivalentes y la simplificación de razones (15:20 → 3:4) son la equivalencia de fracciones. |
| 28 | MA06 OA03 | MA03 OA08 | **Corregir** → MA05 OA04 | Es redundante (ya se alcanza vía MA05 OA07) y su porqué cita «proporciones», que no están en el OA. Lo que sí piden los ítems de valor faltante del banco es dividir y multiplicar fuera de las tablas (250 ÷ 5 × 2). |
| 29 | MA06 OA04 | MA05 OA07 | **Mantener** | Expresar 3/5 como 60/100 es amplificar a denominador 100. |
| 30 | MA06 OA05 | MA05 OA07 | **Mantener** (ajustar porqué) | Es la habilidad de fracciones más cercana que tiene la app; los precursores reales (MA05 OA08 y MA04 OA10) no existen. El porqué debería hablar de «parte de un todo y n/n = 1», no de equivalencia. |
| 31 | MA06 OA05 | MA05 OA04 | **Mantener** | 7/3 = 2 1/3 es 7 ÷ 3 con resto, y MA05 OA04 dice «interpretando el resto». |
| 32 | MA06 OA06 | MA06 OA05 | **Mantener** | El OA6 opera con «números mixtos», que hay que convertir. |
| 33 | MA06 OA06 | MA05 OA07 | **Mantener** (redundante, inocuo) | Para sumar con distinto denominador hay que amplificar a un denominador común. Es la causa de error más frecuente, así que conviene dejarla explícita. |

**Resumen:** 29 Mantener, 4 Corregir (15, 24, 28 y el porqué del 30), 0 Quitar.

---

## 3. Enlaces que faltan (Agregar)

Todos usan habilidades que ya existen en la app y son del mismo curso o de uno anterior.

| # | Habilidad | → Agregar | Prioridad | Por qué importa para diagnosticar |
|---|---|---|---|---|
| A0 | MA03 OA11 | **MA01 OA04** | Alta (reemplaza el enlace 15) | «Comparando fracciones de un mismo todo, de igual denominador» se reduce a comparar numeradores. Así la cadena de fracciones baja hasta 1° sin pasar por la división. |
| A1 | MA04 OA05 | **MA03 OA06** | Alta | El algoritmo de la multiplicación «lleva» y suma los productos parciales: es adición con reserva. Hoy un niño de 4° o 5° que falla por la reserva nunca llega a MA03 OA06. |
| A2 | MA06 OA04 | **MA06 OA03** | Media | El porcentaje es una razón de consecuente 100, y en las Bases OA3 (razón) precede a OA4 (porcentaje). Permite distinguir «no entiende la razón» de «no amplifica fracciones». |
| A3 | MA06 OA03 | **MA05 OA04** | Alta (reemplaza el enlace 28) | Los ítems de valor faltante del banco piden dividir más allá de las tablas. |
| A4 | MA04 OA06 | **MA03 OA05** | Baja (opcional) | El OA6 de 4° dice «aplicando la estrategia por descomposición del dividendo», y el banco usa 84 = 80 + 4. Agregarlo cuesta preguntas: solo si sobra presupuesto (ver R1). |

---

## 4. Estructura del grafo

Lo verifiqué con un script sobre el archivo, con los cambios y sin ellos.

- **Ciclos:** ninguno, ni en el grafo actual ni en el propuesto.
- **Dirección:** todo prerrequisito es del mismo curso o de uno anterior; ningún enlace sube de curso. Hay una sola raíz, MA01 OA01.
- **Bajada hasta 1°:** las 22 habilidades que no son raíz alcanzan 1°.
  - Operatoria: MA03 OA06 → MA02 OA09 → MA01 OA09 → MA01 OA06 → MA01 OA01.
  - Tablas y división: MA05 OA04 → MA04 OA06 → MA03 OA09 → MA03 OA08 → MA02 OA11 → MA01 OA01 (o → MA02 OA09 → MA01 OA09).
  - Valor posicional: MA05 OA01 → MA04 OA01 → MA03 OA05 → MA02 OA07 → MA01 OA06/OA01.
  - Fracciones, hoy: MA06 OA06 → MA06 OA05 → MA05 OA07 → MA04 OA08 → MA03 OA11 → **MA03 OA09 → tablas** → 1°. Llega a 1°, pero por un camino equivocado: termina diagnosticando tablas a quien no entiende la fracción como parte de un todo.
  - Fracciones, propuesto: … → MA03 OA11 → MA01 OA04 → MA01 OA01. En las Bases las fracciones empiezan en 3°, así que bajo 3° solo hay sentido numérico. Es esperable que la cadena de fracciones sea corta.
- **Hojas no usadas:** hoy MA01 OA04 no es prerrequisito de nadie (solo es objetivo para 1°). Con A0 pasa a usarse.
- **Habilidades del eje que faltan en la app:** los eslabones curriculares más finos (MA01 OA08, MA02 OA06, MA04 OA09–OA10 y MA05 OA08–OA09) no existen como habilidad. Si se crean (el módulo de fracciones de `specs/016` ya planea MA04 OA09–OA10 y MA05 OA08–OA09), habrá que reencadenar las fracciones: MA06 OA05 → MA05 OA08 → MA04 OA10, y MA06 OA06 → MA05 OA09 → MA04 OA09.

---

## 5. Riesgos pedagógicos del diseño y mitigaciones

**R1. El tope de 12 preguntas no alcanza para «bajar una cadena completa».** El comentario de `placement.ts` dice que sí, pero la cuenta no da. Un niño de 5° que falla la división pasa por MA05 OA04 (2) → MA04 OA06 (2) → MA03 OA09 (2) → MA03 OA08 (2) → MA02 OA11 (2): son 10 preguntas, más 2 de MA05 OA01, que va antes en el orden, y se llega al tope. MA05 OA07 y MA04 OA05 quedan sin evaluar. En 6° hay 4 objetivos y la cadena más larga tiene 11 nodos, así que el recorrido en profundidad deja objetivos enteros fuera.
*Mitigación:* primero una pasada en anchura (2 ítems por cada habilidad del curso) y después bajar solo desde las que fallaron, con un presupuesto por cadena. Otra opción es saltar de a dos cursos (5° → 3°) y luego refinar hacia arriba. Lo no evaluado debe mostrarse como «sin evaluar», nunca como dominado.

**R2. Ubicar «dominada» por adivinación e inferirlo hacia abajo.** Con unas 4 alternativas y la regla 2 de 2 o 2 de 3, quien adivina obtiene «dominada» cerca de un 16 % de las veces (1/16 + 6/64). Además, `inferMastered` marca como dominadas **todas** las bases. Un acierto por azar en MA06 OA03 da por sabidas las tablas de 3°.
*Mitigación:* que la inferencia valga solo un nivel hacia abajo, o que se marque como «inferida» y la práctica diaria la confirme con 1 o 2 ítems tempranos. En la ubicación, usar respuesta numérica abierta cuando el ítem lo permita.

**R3. Ubicar «reforzar» por un descuido.** Un niño que domina el contenido (85 % de acierto) cae en «reforzar» cerca de un 6 % de las veces, y eso lo hace bajar de curso.
*Mitigación:* para que el Repaso arranque bajo el curso del niño, exigir dos habilidades consecutivas en «reforzar» en la misma cadena, o un fallo de 0 de 3. Y antes de bajar, dar la opción de «otra oportunidad» con un ítem distinto.

**R4. Contextos infantiles para niños mayores.** Un niño de 5° que ve «stickers», círculos 🔵 y números hasta 20 puede sentirse humillado y desengancharse.
*Mitigación:* en la ubicación y el Repaso, elegir ítems simbólicos o con contextos neutros (`visual: null`, recta numérica). No mostrarle nunca al niño el curso del ítem («1° básico»), sino algo como «Repaso de base». El código OA se muestra solo en el espacio familia o docente.

**R5. Dos ítems no cubren un OA con varios incisos.** MA04 OA01 tiene 6 incisos y MA03 OA06 incluye «con y sin reserva». Si el ítem sorteado es el fácil, el vacío no aparece.
*Mitigación:* para cada OA, elegir una dupla fija de ítems de ubicación que toque su componente crítico (en MA03 OA06, una resta con canje; en MA05 OA04, un ítem con resto), de dificultad media, no de nivel 1.

**R6. Vacíos que no tienen un eslabón inferior en la app.** La reserva solo existe en 3° y el resto en 5°. Un niño de 4° que falla por el canje bajará a MA02 OA09, que es sin reserva, lo dominará, y quedará en «reforzar MA03 OA06», que es lo correcto. Pero el reporte debe decir *qué* reforzar.
*Mitigación:* usar el `errorTypeId` de la alternativa elegida para etiquetar el subcomponente («reserva», «tablas», «resto»).

**R7. Frustración por fallos en cadena.** Bajar por 4 o 5 habilidades fallando seguido desmotiva.
*Mitigación:* no mostrar correcto o incorrecto durante la ubicación, intercalar un ítem fácil ya dominado cada 3 fallos y mostrar el progreso como neutro («¡Vamos a la siguiente!»).

**R8. Un Repaso que obliga a subir peldaño por peldaño.** Si el niño se pone al día rápido, recorrer toda la escalera es tedioso.
*Mitigación:* después de reforzar una base, ofrecer un chequeo de 2 ítems de la habilidad superior y, si los responde bien, saltar el resto.

**R9. Nombre «Razones y proporciones» (6°).** Induce a escribir ítems de proporcionalidad, que no está en el OA.
*Mitigación:* renombrar la habilidad (ver sección 1) y revisar que los ítems sean de razón y razones equivalentes.
