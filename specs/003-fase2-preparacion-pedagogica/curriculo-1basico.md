# Referencia — Currículum MINEDUC, 1° básico

**Última revisión:** 2026-08-14.

## Corrección encontrada

El usuario pegó el currículum completo de 1° básico (5 ejes, 20 OA) diciendo que era la fuente
oficial. Al verificar contra páginas de OA individuales en curriculumnacional.mineduc.cl (mismo
método que destapó el error de "con reserva" en el resumen de 2°-6° básico), la numeración que
pegó **no coincide con la oficial** — no es un error aislado, varios OA están corridos:

| # según el usuario | Contenido que le asignó | # real (verificado) | Qué es realmente ese número |
|---|---|---|---|
| OA 2 | Leer números 0-20 | OA 3 | Leer números 0-20 (correcto, número distinto) |
| OA 6 | Adición y sustracción 0-20 | **OA 9** | Adición y sustracción 0-20 (verificado, página propia) |
| OA 8 | Unidades y decenas 0-20 | OA 2 | Números ordinales 1º-10º |
| OA 9 | Relación adición/sustracción | OA 10 | Adición y sustracción como operaciones inversas |

No verifiqué los 20 OA uno por uno (costo/beneficio) — solo los dos más relevantes para el
trabajo actual, contra su página individual (el estándar de verificación real en este proyecto,
no un resumen). El resto de la lista de abajo corrige la numeración según un listado general
(menos confiable que una página de OA individual) — **no tratar como definitivo sin verificar el
OA puntual antes de usarlo para codificar contenido nuevo**.

## OA verificados (página individual, confianza alta)

**MA01 OA09 — Números y operaciones**
> "Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente,
> de 0 a 5, de 6 a 10, de 11 a 20 con dos sumandos" — usando lenguaje cotidiano, representaciones
> concretas/pictóricas, registro simbólico, resolución de problemas en contextos familiares, y
> creación de problemas propios.

Es el OA de la habilidad ya sembrada en `server/prisma/seed.ts` ("Adición y sustracción dentro de
20") — completado ahí como `oaCode: "MA01 OA09"` el 2026-08-14.

**MA01 OA07 — Números y operaciones**
> "Describir y aplicar estrategias de cálculo mental para las adiciones y sustracciones hasta 20:
> conteo hacia adelante y atrás, completar 10, dobles."

No codificado en ningún `MathSkill` (el schema solo admite un `oaCode` por habilidad, y OA09 es
el más directo para la habilidad existente) — pero es la justificación curricular exacta de las
pistas rediseñadas el 2026-08-14 (`server/prisma/seed.ts`): conteo hacia adelante/atrás, dobles
("los dos números son iguales — es un doble") y completar 10 / suma relacionada ("¿qué número le
sumas a X para llegar a Y?") son, literalmente, las tres estrategias que pide este OA — no una
elección de diseño arbitraria.

## Resto del currículum de 1° básico (numeración corregida, no verificada OA por OA)

### Números y operaciones
- OA 1: Contar 0-100 de 1 en 1, 2 en 2, 5 en 5 y 10 en 10, hacia adelante y atrás.
- OA 2: Identificar el orden de elementos con números ordinales del 1º al 10º.
- OA 3: Leer números 0-20 en forma concreta, pictórica y simbólica.
- OA 4: Comparar y ordenar números 0-20.
- OA 5: Estimar cantidades hasta 20 usando un referente.
- OA 6: Componer y descomponer números 0-20 de manera aditiva.
- OA 7: *(verificado arriba)*
- OA 8: Determinar unidades y decenas en números 0-20.
- OA 9: *(verificado arriba)*
- OA 10: Demostrar que adición y sustracción son operaciones inversas.

### Patrones y álgebra
- OA 11: Reconocer, describir y continuar patrones repetitivos y numéricos hasta 20.
- OA 12: Registrar igualdad y desigualdad usando balanza y el símbolo igual.

### Geometría
- OA 13: Describir posición de objetos usando lenguaje como derecha e izquierda.
- OA 14: Identificar figuras 3D y 2D en el entorno.
- OA 15: Identificar y dibujar líneas rectas y curvas.

### Medición
- OA 16: Usar unidades no estandarizadas de tiempo para comparar duraciones.
- OA 17: Secuenciar eventos en el tiempo (días, meses, fechas significativas).
- OA 18: Comparar longitud de objetos usando "largo" y "corto".

### Datos y probabilidades
- OA 19: Recolectar y registrar datos usando bloques, tablas y pictogramas.
- OA 20: Construir, leer e interpretar pictogramas.

## Antes de construir contenido nuevo con esto

1. Verificar el OA puntual contra su página individual en curriculumnacional.mineduc.cl (no
   contra esta lista) — igual que se hizo con OA07 y OA09.
2. Decidir alcance explícitamente: ¿más OA del mismo eje (Números y operaciones), u otro eje?
   Ver el mismo tipo de decisión tomada para 2° básico en
   [`specs/004-expansion-2basico/`](../004-expansion-2basico/).
