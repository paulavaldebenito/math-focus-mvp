# Actividades diseñadas — MA02 OA09 (2° básico)

**Estado:** contenido de referencia, no implementado — la app hoy cubre solo 1° básico
(`specs/001-mvp-regulado/spec.md`). **Última revisión:** 2026-08-14.

Diseñadas con la metodología pedida por el usuario: un equipo simulado de currículista +
especialista en TDAH/neurodiversidad + diseñador UX infantil, aplicando reglas de brevedad,
feedback adaptativo por tipo de error, y gamificación sin ranking.

## Verificación contra la fuente oficial

⚠️ El resumen curricular guardado en `curriculo-mineduc-2-a-6-basico.md` (13-08) decía que 2°
básico incluye adición y sustracción **"con reserva"**. Verificado contra
[curriculumnacional.mineduc.cl, MA02 OA09](https://www.curriculumnacional.cl/614/w3-article-17517.html)
el 14-08: el objetivo oficial es explícito en que el algoritmo es **sin reserva** — la
reserva/canje se introduce en un curso posterior, no en este OA. Las 6 actividades de abajo están
diseñadas sin reserva/canje, alineadas con el texto oficial, no con el resumen previo. Ese resumen
debería corregirse si se usa para otros OA de 2° básico.

## OA verificado

**MA02 OA09 — Números y Operaciones, 2° básico**

> "Demostrar que comprende la adición y la sustracción en el ámbito del 0 al 100: usando un
> lenguaje cotidiano y matemático para describir acciones desde su propia experiencia; resolviendo
> problemas de adición y sustracción con diversas representaciones concretas y pictóricas;
> registrando el proceso en forma simbólica; aplicando el resultado de adiciones y sustracciones de
> números del 0 al 20 sin necesidad de calcular; aplicando el algoritmo de la adición y la
> sustracción sin considerar reserva; creando y resolviendo problemas matemáticos en contextos
> familiares."

Fuente: curriculumnacional.mineduc.cl → MA02 OA 09 — consultado 2026-08-14.

## Las 6 actividades

2 por nivel: inicial (concreto/visual) → intermedio (registro simbólico) → desafío (análisis y
elección de estrategia). Ningún distractor es obviamente incorrecto — cada uno refleja un error
real y clasificado (conceptual, procedimental o de cálculo).

| N.º | Nivel | Habilidad | Enunciado | Interacción | Respuesta correcta | Distractores (error) |
|----|-------|-----------|-----------|-------------|---------------------|------------------------|
| 1 | Inicial | Representar una adición con bloques base-10 | "¿Cuánto es 23 + 15?" | Selección visual (1 de 3) | 38 | 48 (cálculo) · 35 (procedimental, olvidó una decena) |
| 2 | Inicial | Sustracción sin reserva con apoyo concreto | "Arma 68 − 24 con los bloques" | Arrastrar y soltar | 44 | 42 (cálculo) · 24 (conceptual, arrastró el minuendo) |
| 3 | Intermedio | Registrar la adición con el algoritmo estándar | "Completa: 34 + 25 = ?" | Completar | 59 | 69 (cálculo) · 9 (procedimental, olvidó decenas) |
| 4 | Intermedio | Hechos aditivos/sustractivos hasta 20 de memoria | "Une cada operación con su resultado" | Unir elementos (3 pares) | 9+7↔16 · 15−6↔9 · 6+6↔12 | 17 y 8 (cálculo, conteo ±1) |
| 5 | Desafío | Detectar un error de alineación en una resta | "Capi resolvió 76 − 32 así. ¿Dónde se equivocó?" | Detectar errores | Columna de decenas mal alineada | Tocar unidades o el resultado (procedimental, confunde causa/consecuencia) |
| 6 | Desafío | Elegir la operación que resuelve un problema | "45 stickers + 20 regalados, ¿qué hacemos?" | Elegir estrategia | Sumar (+) | Restar (−) (conceptual, no identificó "juntar") |

Detalle completo de cada fila (elementos visuales, pista 1, apoyo 2, resolución guiada, feedback
exacto y recompensa) en el artifact publicado — pedir el link si se perdió, o regenerar con este
mismo documento como base.

## Reglas transversales (aplican a las 6)

- **TDAH:** 30–90s por pantalla, una sola tarea cognitiva, tipografía grande, sin animación
  continua ni cronómetro visible, señal de progreso, pausas solo entre bloques.
- **Feedback:** correcto → felicita y nombra la estrategia; 1er error → pista sin revelar
  respuesta; 2do error → simplifica a representación concreta; 3er error → resolución guiada +
  ítem similar más simple de inmediato. Nunca "está mal".
- **Gamificación:** estrellas por esfuerzo y estrategia, comparación solo con el propio avance,
  sin ranking, sin pérdida de puntos.
