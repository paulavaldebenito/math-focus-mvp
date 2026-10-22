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

## Pendiente: requiere decisión de la usuaria o rediseño (no se aplicó)
**Enunciados que hay que reescribir**

Cambian el problema y sus variantes, así que conviene hacerlo en tandas:
- **1° MA01 OA04:** 8 comparaciones de 2 números («¿cuál es mayor: 3 o 9?»). Con 2 alternativas se acierta la mitad de las veces adivinando. Propuesta: comparar 4 números.
- **Gráficos sin necesidad de leerlos.** El dato viene en el enunciado, así que el gráfico no se lee. Pasa en 2° MA02 OA22, 3° y 4° (gráficos) y 6° OA24.
- **1° MA01 OA11:** patrones con distractores absurdos. Propuesta: preguntar por «los 2 que siguen».
- **1° MA01 OA18:** 3 ejercicios que son sumas o restas.
- **1° `ptqblaxv`:** tiene dos respuestas posibles.
- **5° OA15:** inecuaciones mal planteadas.
- **5° OA23:** promedios que se aciertan sin calcular.
- **6° OA11:** pistas que escriben la ecuación.
- **2° MA02 OA12:** 4 ejercicios calcados de 1°.
- **4° área:** los 9 ejercicios tienen los mismos distractores.

**Imágenes que hay que rehacer**
- El círculo dibujado como esfera: en 1°, 2° y 4°.
- Bases de cilindro rotas.
- Flores con colores cambiados (1° `lee0rrmr`).
- Cuerda «más larga» dibujada igual (1° `jhah5f43`).
- Descomposición de 5° (`y0huzp`), que no corresponde al número.
- Imágenes de valor posicional que dan la respuesta, en 3° y 5°.
- Números sin punto de miles en 5°.
- Gráficos con rótulos A/B en vez de nombres.

**Convenciones a confirmar**
- Multiplicación: ¿3 × 2 es «3 grupos de 2» o «3 veces 2 = 2 + 2 + 2»? Hoy las pistas de 2 × 6 y 2 × 9 se alinearon con la imagen (6 grupos de 2).
- Nombres cortos para niños en el mapa («Sumar y restar hasta 20») junto al nombre oficial.

**Lo que falta en el banco**
- Diversidad: argumentar es casi inexistente fuera de fracciones; faltan problemas de juntar, comparar y cambio en 1°–2°; también construir gráficos, ordenar números y ubicar en la recta.
- Retroalimentación por alternativa y desarrollo paso a paso: solo los tienen fracciones y porcentajes.
