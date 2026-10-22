# Bitácora del trabajo nocturno

Cada sesión de trabajo agrega aquí, arriba, lo que se hizo (la más reciente primero).

## 2026-10-22 · Control de calidad pedagógica de las tandas 1 a 4 (a pedido de la usuaria)

Pedido: "que el agente pedagógico verifique que las preguntas son coherentes y existe diversidad en
ellas; las alternativas, a través de la taxonomía del error, pistas y tips acordes".

- **Capa 1, revisión automática:** nuevo comando `npm run bank:calidad -- "<OA>" [--desde <id>]` en
  `server/prisma/calidad/revisarCalidad.ts`. Revisa:
  - una sola correcta;
  - un código de la taxonomía en cada incorrecta, y su diversidad;
  - que la pista no delate la respuesta;
  - el feedback de las 4 alternativas;
  - el desarrollo paso a paso;
  - el inglés;
  - enunciados casi iguales;
  - el equilibrio de niveles.

  Encontró 1 pista que delataba la respuesta, en 4°: «¿Cuántos doceavos forman un entero?».
- **Capa 2, revisor pedagógico independiente** (otro agente, con rúbrica). Encontró:
  - **un error de fondo:** en 4°, «10 lápices: 3 rojos, 2 azules…» se podía acertar por el camino
    equivocado. Ahora son 3 rojos y 3 azules, y la respuesta es 4/10;
  - **~70 códigos de error mal asignados.** Se unificaron según la taxonomía oficial
    (`server/prisma/seed.ts`):
    - procedimiento aplicado a un solo término, contar marcas en vez de saltos, no simplificar,
      número mixto sin normalizar e inversiones → E2_RES (reagrupación/procedimiento);
    - sumar en vez de multiplicar, o una regla o concepto equivocado → E1_OP.

    Nota: una primera versión usó por error "E2_RES = forma del resultado" y pasó a E1_OP los errores
    de procedimiento. Se corrigió el mismo día; las 17 alternativas afectadas se revierten también en
    las BD existentes con `correcciones_alternativas.json`.
  - **3 alternativas poco plausibles**, reemplazadas por errores reales;
  - **pistas y feedback ajustados**, por ejemplo «vale lo mismo, pero en un número mixto la fracción
    debe ser menor que 1»;
  - **2 preguntas reformuladas:**
    - 5°, «¿Cuál NO representa…?»: sus 3 distractores eran el mismo error. Ahora pide la fracción
      simplificada;
    - 4°, «torta» dibujada como barra: ahora es «queque rectangular».
- **Avisos que quedan, justificados:**
  - Preguntas conceptuales («¿qué indica el 2?») con las 3 incorrectas E1_OP: cada una es una
    confusión de concepto distinta.
  - Dos pares de enunciados parecidos a propósito: 1/2 y 1/3 en barras; la misma barra como
    impropia y como mixto.
- **Pendiente para próximas tandas** (diversidad, según el revisor):
  - fracción de un conjunto;
  - reconstruir el entero desde una parte;
  - ubicar (no solo leer) en la recta;
  - problemas de reparto;
  - comparar con 1/2 como referencia;
  - más «argumentar» (hoy 3–4 por tanda).
- El agente `curriculo-semanal` ahora debe pasar las dos capas antes de entregar cada tanda.
- En la BD de desarrollo, la tanda 1 se actualizó con un script de una vez, porque la siembra no toca
  alternativas existentes.

## 2026-10-22 · Tandas 2, 3 y 4 (misma sesión, a pedido de la usuaria: "podemos avanzar más")

- **Tanda 2 — 4° básico, MA04 OA08** (OA verificado): 30 problemas. Cubre las 4 partes del OA:
  parte de un todo **y de un grupo**, **lugar en la recta numérica** (contar saltos, no marcas),
  situaciones, representaciones distintas (4/8 y 2/4 en barras iguales) y comparar u ordenar
  fracciones unitarias y de igual denominador. Denominadores 5, 6, 8, 10, 12 y 100. 8 dibujos.
- **Tanda 3 — 5° básico, MA05 OA07** (OA verificado): 30 problemas de equivalencia
  (**amplificar y simplificar**, con barras que muestran 1/2 = 2/4 y 1/4 = 2/8 = 3/12) y comparación
  con distinto denominador. Incluye errores típicos como "sumar 1 arriba y abajo" o "restar en vez de
  dividir". 6 dibujos.
- **Tanda 4 — 6° básico, MA06 OA05** (OA verificado): **habilidad nueva** "Fracciones impropias y
  números mixtos", antes de la suma y resta en el mapa. 30 problemas: impropia ↔ mixto con barras de
  varios enteros y en la recta de 0 a 3, situaciones (tazas, botellas, pizzas) y errores típicos como
  "juntar los dígitos" (2 3/5 = 23/5). Con su juego para la casa ("Pizzas en cuartos"). 6 dibujos.
- Todos con pista, feedback en las 4 alternativas, desarrollo paso a paso con el error previsto e
  inglés de aula. Sin variantes por interés todavía.
- **Para revisar:** modo revisión → 4° "Fracciones: parte de un todo…" (ejercicios nuevos al final),
  5° "Fracciones propias: equivalencia…" y 6° "Fracciones impropias y números mixtos".
- **Avance del módulo:** 172 de ~780 problemas (22%).

## 2026-10-22 · Tanda 1 — 3° básico, MA03 OA11 (sesión con la usuaria)

- **Escrito:** 30 problemas nuevos de fracciones de uso común (1/2, 1/3, 1/4, 2/3 y 3/4 como parte
  de un todo): 10 de nivel 1, 10 de nivel 2 y 10 de nivel 3.
  - Por habilidad: resolver problemas 10, representar 9, modelar 7, argumentar 4 ("¿quién tiene razón?").
  - Foco: **partes iguales** (barras con partes desiguales que no son cuartos ni tercios), nombrar
    cada parte, numerador y denominador, parte pintada y sin pintar, comparar fracciones del mismo
    todo, y situaciones como repartir un queque entre 3 o doblar una hoja dos veces.
  - Cada uno con pista, feedback propio en sus 4 alternativas, desarrollo paso a paso con el error
    previsto de cada alternativa, e inglés de aula. 11 con dibujo en el estilo plano.
- **Sin variantes por interés todavía:** se agregan cuando la usuaria apruebe la tanda.
- **Para revisar:** modo revisión → 3° básico → "Fracciones de uso común". Los nuevos son los
  ejercicios 12 a 41 de la lista.
- **Tarea nocturna automática:** bloqueada por el control de seguridad de Claude Code (no permite
  dejar un agente sin supervisión con permisos amplios). Se trabaja en sesiones diarias con la usuaria.
