# Revisión pedagógica — 8 enunciados de 3.º básico (UN_ENTERO_INSUFICIENTE)

**Estado:** PENDIENTE DE REVISIÓN PEDAGÓGICA. Ninguno de estos textos se cambió en el banco activo; la app sigue mostrando los originales.

**Origen:** `banco_imagenes_por_curso/revision_enunciados.json` (paquete de revisión, 2026-09).
**Habilidad:** Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4 (3.º básico).
**Grupo:** los 8 comparten `baseKey = 555c17d9624d`: son el ejercicio base neutro y siete variantes temáticas. Ninguno tiene ilustración SVG en el paquete.

## Problema

> Una cinta se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes.

Un entero dividido en 4 partes no alcanza para 3 + 2 = 5 partes. La respuesta marcada como correcta ("Ema, 3/4") supone que **cada uno tiene su propio entero del mismo tamaño**, pero el enunciado no lo dice. Un estudiante que lea con atención puede quedar legítimamente confundido, y esa confusión se registraría como error de lectura (E3) sin serlo.

## Propuesta (recomendada): aclarar que hay dos enteros iguales

Se conservan todos los datos (4 partes, 3 y 2), las cuatro alternativas, su orden, la respuesta correcta y la clasificación de errores (`E1_OP`, `E2_RES`, `E3_DATO`). Solo cambia el contexto del enunciado. También se ajusta la nota de procedimiento, porque ahora las partes son del mismo tamaño *porque las dos cintas son iguales*.

**Justificación:** es el cambio mínimo que hace verdadera la premisa. Mantiene la intención matemática: comparar fracciones con igual denominador del mismo entero de referencia y nombrar la fracción. Además explicita el "entero de referencia", un criterio que el paquete ya aplica a las imágenes de 3.º a 6.º.

| ID | Tema | Original (ES) | Propuesta (ES) | Propuesta (EN) |
|---|---|---|---|---|
| `cmuli7it700qy6krhqpa91j90` | — (base) | Una cinta se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cinta y qué fracción usó? | Ema y Leo tienen cada uno una cinta del mismo largo. Cada cinta se corta en 4 partes iguales. Ema usa 3 partes de su cinta y Leo usa 2 partes de la suya. ¿Quién usó más cinta y qué fracción de su cinta usó? | Ema and Leo each have a ribbon of the same length. Each ribbon is cut into 4 equal parts. Ema uses 3 parts of her ribbon and Leo uses 2 parts of his. Who used more ribbon, and what fraction of their ribbon did they use? |
| `cmulu2wkz03w94crhqgkt0hjb` | futbol | Una cinta para decorar la cancha se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cinta y qué fracción usó? | Para decorar la cancha, Ema y Leo tienen cada uno una cinta del mismo largo. Cada cinta se corta en 4 partes iguales. Ema usa 3 partes de su cinta y Leo usa 2 partes de la suya. ¿Quién usó más cinta y qué fracción de su cinta usó? | To decorate the field, Ema and Leo each have a ribbon of the same length. Each ribbon is cut into 4 equal parts. Ema uses 3 parts of her ribbon and Leo uses 2 parts of his. Who used more ribbon, and what fraction of their ribbon did they use? |
| `cmulu2wlv03x84crhudbhlgxu` | musica | Una cinta para decorar el escenario se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cinta y qué fracción usó? | Para decorar el escenario, Ema y Leo tienen cada uno una cinta del mismo largo. Cada cinta se corta en 4 partes iguales. Ema usa 3 partes de su cinta y Leo usa 2 partes de la suya. ¿Quién usó más cinta y qué fracción de su cinta usó? | To decorate the stage, Ema and Leo each have a ribbon of the same length. Each ribbon is cut into 4 equal parts. Ema uses 3 parts of her ribbon and Leo uses 2 parts of his. Who used more ribbon, and what fraction of their ribbon did they use? |
| `cmulu2wna03yr4crhk74yawbg` | espacio | Un cable se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cable y qué fracción usó? | Ema y Leo tienen cada uno un cable del mismo largo. Cada cable se corta en 4 partes iguales. Ema usa 3 partes de su cable y Leo usa 2 partes del suyo. ¿Quién usó más cable y qué fracción de su cable usó? | Ema and Leo each have a cable of the same length. Each cable is cut into 4 equal parts. Ema uses 3 parts of her cable and Leo uses 2 parts of his. Who used more cable, and what fraction of their cable did they use? |
| `cmulu2wnt03zb4crhy1jm65rs` | dinosaurios | Una cinta para decorar la sala de los dinosaurios se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cinta y qué fracción usó? | Para decorar la sala de los dinosaurios, Ema y Leo tienen cada uno una cinta del mismo largo. Cada cinta se corta en 4 partes iguales. Ema usa 3 partes de su cinta y Leo usa 2 partes de la suya. ¿Quién usó más cinta y qué fracción de su cinta usó? | To decorate the dinosaur room, Ema and Leo each have a ribbon of the same length. Each ribbon is cut into 4 equal parts. Ema uses 3 parts of her ribbon and Leo uses 2 parts of his. Who used more ribbon, and what fraction of their ribbon did they use? |
| `cmulu2wot040f4crh34hf04h3` | cocina | Una masa de pizza se divide en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más masa y qué fracción usó? | Ema y Leo tienen cada uno una masa de pizza del mismo tamaño. Cada masa se divide en 4 partes iguales. Ema usa 3 partes de su masa y Leo usa 2 partes de la suya. ¿Quién usó más masa y qué fracción de su masa usó? | Ema and Leo each have a pizza dough of the same size. Each dough is divided into 4 equal parts. Ema uses 3 parts of her dough and Leo uses 2 parts of his. Who used more dough, and what fraction of their dough did they use? |
| `cmulu2wpn041e4crh8m7hlhls` | naturaleza | Un cordel se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cordel y qué fracción usó? | Ema y Leo tienen cada uno un cordel del mismo largo. Cada cordel se corta en 4 partes iguales. Ema usa 3 partes de su cordel y Leo usa 2 partes del suyo. ¿Quién usó más cordel y qué fracción de su cordel usó? | Ema and Leo each have a cord of the same length. Each cord is cut into 4 equal parts. Ema uses 3 parts of her cord and Leo uses 2 parts of his. Who used more cord, and what fraction of their cord did they use? |
| `cmulu2wq4041y4crhyvxaqmqa` | deportes | Una cinta de gimnasia se corta en 4 partes iguales. Ema usa 3 partes y Leo usa 2 partes. ¿Quién usó más cinta y qué fracción usó? | Ema y Leo tienen cada uno una cinta de gimnasia del mismo largo. Cada cinta se corta en 4 partes iguales. Ema usa 3 partes de su cinta y Leo usa 2 partes de la suya. ¿Quién usó más cinta y qué fracción de su cinta usó? | Ema and Leo each have a gymnastics ribbon of the same length. Each ribbon is cut into 4 equal parts. Ema uses 3 parts of her ribbon and Leo uses 2 parts of his. Who used more ribbon, and what fraction of their ribbon did they use? |

**Nota de procedimiento propuesta** (se reemplaza "cinta" por el objeto de cada variante):

- ES: "Las dos cintas son iguales y están cortadas en 4 partes iguales, así que todas las partes son del mismo tamaño: usa más cinta quien toma más partes. Luego escribe cuántas partes tomó sobre las 4 partes de su cinta."
- EN: "Both ribbons are the same and are cut into 4 equal parts, so all the parts are the same size: whoever takes more parts uses more ribbon. Then write how many parts they took out of the 4 parts of their ribbon."

La nota inglesa de la variante `espacio` usa "he or she" y la de `dinosaurios` usa "were taken". La propuesta unifica ambas con "they", como el resto.

Alternativas, sin cambios: `Ema, 3/4` (correcta) · `Leo, 2/4` (E1_OP) · `Ema, 4/3` (E2_RES) · `Leo, 3/4` (E3_DATO).

## Alternativa descartada: cambiar los datos

Ejemplo: "Ema usa 2 partes y Leo usa 1 parte" de una sola cinta. Mantiene un único entero, pero cambia los valores, la respuesta correcta ("Ema, 2/4") y los distractores. Eso rompe la relación con los intentos ya registrados y obliga a reclasificar errores. Por eso no se recomienda.

## Cómo aplicarla, una vez aprobada

1. **No basta con editar el seed.** `seedSkill` (prisma/seed/persist.ts) busca los ejercicios existentes **por enunciado**. Si solo se cambia el texto en `grade3.ts` y `themes/*.ts`, el seed crea 8 ejercicios nuevos y deja los antiguos, duplicando el problema.
2. Primero actualiza `prompt`, `promptEn`, `procedureNote` y `procedureNoteEn` de estos 8 IDs directamente en la BD (script puntual por ID; IDs, alternativas e intentos no cambian). Después edita el texto del seed con exactamente los mismos valores.
3. Las variantes se validan con `npx tsx prisma/seed/check.ts check 3`. Si el enunciado base cambia, cambia `baseKeyOf(...)`, así que hay que actualizar también la columna `baseKey` de los 8 registros, o conservar la clave antigua.
