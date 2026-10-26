# 017 · Revisión pedagógica de toda la app (2026-10-22)

Pedido de la usuaria: "el agente corrector que revise toda la app".

## Cómo se hizo
1. **Revisión automática** (`npm run bank:calidad`) de las 47 habilidades (653 problemas base y 2.068 variantes temáticas).
2. **Cuatro revisores pedagógicos independientes,** con la rúbrica de `rubrica_banco.md` y la taxonomía oficial de `server/prisma/seed.ts`:
   - banco de 1°–2° (`informe_1_2.md`);
   - banco de 3°–4° (`informe_3_4.md`);
   - banco de 5°–6° (`informe_5_6.md`);
   - textos de la app para niños, familias y docentes (`informe_textos_app.md`).

## Qué se aplicó
- **Banco: 196 ejercicios base corregidos, junto con todas sus variantes temáticas,** mediante `server/prisma/seed/traducciones/correcciones_alternativas.json` (aplicado por `applyOptionCorrections.ts`). Se aplica igual en una BD nueva y en una existente.
  - Unos 200 códigos de error recodificados con la taxonomía oficial.
  - 27 distractores absurdos reemplazados por errores reales; por ejemplo, el «18» en 8 + 5 y los restos de 5° que no cuadraban.
  - 18 alternativas agregadas a preguntas que tenían 2 o 3.
  - 29 pistas que delataban la respuesta o eran difíciles de leer para 1°–2°.
  - 6 niveles mal puestos.
- **Fracciones (tandas 1–4):** se revirtió el error de la primera revisión, que había tomado E2_RES como "forma del resultado". Además, "juntar cifras" pasó a E1_OP.
- **Textos de la app** (casi todos los «Corregir» del informe):
  - **Mensajes de error y de acierto:**
    - ya no piden "revisa la cuenta" cuando no hay reintento; ahora llevan a mirar la solución que aparece abajo;
    - el acierto elogia el esfuerzo;
    - "detecta el error" ya no niega la causa correcta.
  - **Coherencia con lo que hace la app:**
    - consentimiento: el check-in es una vez al día;
    - evaluación inicial: se quitó "no hay respuestas malas";
    - concentración: se quitaron las "sesiones de 10 minutos";
    - estrellas: se dice "en esta práctica" y se agregó el singular.
  - **Panel familiar:** "le está costando" muestra los aciertos recientes, que son los que deciden la alerta, y los tips ya no afirman causas.
  - **Paneles docente y directivo:** "docente" en vez de "profesora", "Volver a enseñar" y los porcentajes sobre quienes practicaron.
  - **Lectura en 1°–2°:** se quitó "/a" en textos para niños; la respiración muestra todas sus etapas.
  - **Juegos para la casa:** pasos más claros, y el juego de tablas ya no es de velocidad.
  - **Etiquetas de error para adultos:** redactadas como lo que hay que practicar.

## Convenciones de código acordadas (taxonomía oficial)
| Código | Qué incluye |
|---|---|
| E1_OP | Operación o idea equivocada: sumar en vez de restar, sumar denominadores, pegar o juntar cifras, invertir las cifras de un número, no aplicar la escala de un gráfico. |
| E2_RES | Reagrupación o procedimiento: reserva o canje, procedimiento aplicado a un solo término, paso incompleto (sin simplificar, número mixto sin normalizar), contar marcas en vez de saltos, invertir numerador y denominador. |
| E2_CAL | Cálculo o conteo puntual. |
| E3_PREG | Responde otra cosa: el complemento, el número de saltos, la duración, el área cuando se pide el perímetro. |
| E3_DATO | Omite o cambia un dato. |

## Arreglos del banco (segunda parte, a pedido de la usuaria: "arreglemos el banco")

Mecanismos nuevos (todos se aplican igual en una BD nueva y en una existente):
- `Exercise.retired` + `ejercicios_retirados.json` (`applyRetirements.ts`): un ejercicio retirado no
  se entrega en práctica, evaluación ni revisión, pero se conserva por los intentos. Alcance
  "familia" (base y variantes) o "variantes" (solo las variantes temáticas).
- `imagenes_quitadas.json` (`applyImageRemovals.ts`): borra la imagen de ejercicios en que la
  imagen era la respuesta.
- `enunciados_editados.json`: ahora el inglés sigue al español (sirve con el inglés de aula ya
  aplicado).

Qué se arregló:
- **Gráficos (35 problemas de 2°, 3°, 4° y 6°):** el enunciado ya no trae el dato. Dice qué es cada
  letra («A son los perros y B los gatos») y el niño lee el valor en el gráfico. Las variantes
  temáticas, que repetían el dato, se retiraron. Los gráficos circulares quedan con el porcentaje en
  el texto, porque el dibujo no lo muestra.
- **27 problemas reemplazados por versiones nuevas** (los antiguos y sus variantes, retirados):
  - 8 comparaciones de 1° con 2 o 3 alternativas → comparar 4 números, «¿qué número va entre…?» y
    ordenar;
  - 6 patrones de 1° con distractores ajenos al patrón → «¿qué 2 siguen?»;
  - 3 problemas aditivos en «comparar longitudes» de 1° → comparaciones de largo y uno de
    argumentar (medir con unidades distintas);
  - 4 patrones de 2° calcados de 1° → números de 2°;
  - 2 inecuaciones de 5° → «el menor/mayor número que cumple…»;
  - 4 promedios de 5° que se acertaban sin calcular → datos en que el promedio no es ninguno de
    ellos.
- **1° «un bloque que no ruede»:** el enunciado ya no es ambiguo («lo pongas como lo pongas»).
- **27 imágenes redibujadas** en estilo plano:
  - valor posicional como tarjetas de cifras sin rótulos de posición (ya no dan la respuesta), con
    punto de miles;
  - círculos planos (no esferas);
  - cilindros y conos con la base bien dibujada;
  - triángulo isósceles distinto del equilátero;
  - letras en el orden de las alternativas;
  - flores rojas y amarillas con su color;
  - cuerda «más larga» claramente más larga;
  - rectángulo con su cuadrícula de 1 cm;
  - álbum sin el «−20» que adelantaba el paso;
  - el cilindro armado en vez de la red que daba la respuesta.
- **3 imágenes quitadas:** el acertijo de Tomás, 700 + 20 + 5 y la descomposición de 5°, porque la
  imagen era la respuesta.

## Convención de multiplicación (decisión de la usuaria, 2026-10-23)
**a × b se lee «a grupos de b»** (6 × 2 = 6 grupos de 2). Los 4 cálculos de 2° que contradecían su
imagen y su pista se escribieron en ese orden: 6 × 2, 3 × 5, 7 × 10 y 9 × 2. También se corrigió
una pista de variante («9 grupos de 2… suma 9 + 9»).

**Imágenes de 2° sin «6 × 10» (2026-10-26).** Las de decenas y unidades ahora son material base 10:
- 3 barras;
- 6 barras y 4 cubitos;
- 9 barras;
- 3 barras y 4 cubitos + 1 barra.

La de los helados muestra 6 helados de $10. Las generó otra IA con un encargo de estilo y cantidades exactas, y cada barra se contó con un programa antes de instalarla.

## Tercera parte (2026-10-26): variedad y textos

**Banco**
- **Área de 4°:** 3 preguntas nuevas.
  - Contar cuadrados por filas.
  - ¿Qué pasa con el área si se duplica el largo?
  - Argumentar: «mismo perímetro, ¿misma área?», con 2 × 6 y 4 × 4.

  Además, un distractor de unidad se cambió por uno de dato («16 m²»). Los demás distractores que se
  repiten (perímetro en vez de área, sumar lados, unidad lineal) se mantienen: son los 3 errores
  reales más frecuentes.
- **Simetría de 4°:** 3 preguntas nuevas, además de «¿cuántas líneas?».
  - Simetría horizontal en letras.
  - Completar una figura simétrica.
  - Argumentar: ¿la diagonal de un rectángulo es línea de simetría?
- **La hora en 2°:** se retiraron 3 de tiempo transcurrido (una de 1 hora y media excedía el OA) y
  entraron 3 de leer la hora.
- **1°:** «óvalo» pasó a «rectángulo», y el cuarto ejercicio del dado se reemplazó por uno de
  cilindro.
- **Pistas de sumas y restas:**
  - 1° (7 pistas): ya no dicen «Conteo hacia adelante desde X, avanzando Y posiciones», sino
    «Empieza en el X y cuenta Y más».
  - 2° (12 pistas): ya no separan los números por el niño, sino que proponen estrategias variadas
    (decenas primero, avanzar de 10 en 10, descomponer).

**Textos de la app**
- Se usa «práctica» en vez de «sesión» o «misión» con niños y familias.
- Nombres cortos para niños en el mapa y en el chip de práctica (`client/src/lib/skillShortNames.ts`);
  la familia y los docentes siguen viendo el nombre oficial.
- La reflexión final permite escuchar las dos preguntas con sus opciones.
- Si el niño responde muy rápido, el aviso ya no se pierde cuando hay un mensaje de error concreto.

## Pendiente
- **Diversidad:** casi no hay «argumentar» fuera de fracciones. Faltan problemas de juntar, comparar
  y cambio en 1°–2°, y también construir gráficos y ubicar en la recta.
- **Desarrollo paso a paso y feedback por alternativa:** solo los tienen fracciones y porcentajes.
