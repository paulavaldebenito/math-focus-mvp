# Estructura visual por curso (1.º a 6.º básico)

Criterio basado en las **Bases Curriculares de Matemática (MINEDUC)**: el enfoque **COPISI** (Concreto → Pictórico → Simbólico) y la habilidad **Representar**. Es una propuesta de diseño que conviene validar con docentes de 1.º y 2.º ciclo y observando a niños; no reemplaza esa validación.

**Regla general:** cada ejercicio muestra **un solo** apoyo visual, nunca dos que dupliquen cantidades. El enunciado siempre sigue como texto. El componente que decide es `client/src/components/ExerciseIllustration.tsx`:

1. Pictograma de emojis (si existe), si no
2. Imagen del banco visual, si no
3. Dibujo de emojis del descriptor `visual`, si no
4. Solo texto.

## 1.º y 2.º básico (6–8 años) · etapa pictórica concreta

Los niños cuentan, juntan y quitan objetos de la historia y están aprendiendo a leer. El apoyo debe **ser** lo que dice el enunciado (🐒 = mono), sin traducciones intermedias ni leyendas que leer.

| Contenido | Estilo | Por qué |
|---|---|---|
| Sumas, restas y comparaciones con objetos | **Dibujo de emojis** (🐒 🍎 ⚽). Más de 20 objetos van en bloques de 10 y las cantidades que se quitan aparecen tachadas | Concreto y ligado a la historia. Se personaliza con el interés del niño. Los bloques de 10 apoyan el valor posicional de 2.º |
| Pictogramas "1 dibujo = 1" | **Pictograma de emojis**: una fila por categoría, con su nombre al lado, sin letras | Se compara el largo de las filas y se lee el nombre directo. En pantallas angostas el nombre va sobre su fila y la fila nunca se parte |
| Pictogramas con escala (cada dibujo vale 2, 5 o 10) | **Banco visual** (símbolo neutro con la clave "= 5") | Con emojis literales el niño contaría dibujos en vez de aplicar la escala |
| Figuras 2D/3D, patrones, relojes, longitudes, partes y todo | **Banco visual** | Se necesita forma o medida exacta |

## 3.º y 4.º básico (8–10 años) · pictórico estructurado

Aparecen fracciones, gráficos con escala, cuerpos geométricos, simetría y área. Los modelos deben ser **exactos**: partes iguales, escalas correctas y medidas.

| Contenido | Estilo |
|---|---|
| Fracciones, gráficos con escala, redes de cuerpos, simetría, área y perímetro, repartos | **Banco visual**, con leyenda A/B/C fuera de la imagen cuando los nombres se pueden verificar |

## 5.º y 6.º básico (10–12 años) · hacia lo simbólico

Plano cartesiano, ángulos, volumen, porcentajes y gráficos circulares y dobles. Se usa un estilo sobrio y preciso, y la imagen se muestra **solo cuando ayuda a modelar**, porque el currículo espera razonamiento simbólico y no conviene sobre-apoyar.

| Contenido | Estilo |
|---|---|
| Plano, ángulos, volumen, porcentajes, gráficos | **Banco visual** |
| Problemas netamente simbólicos (ecuaciones, operaciones) | **Solo texto** (la mayoría) |

## Estado actual (2026-09-30)

| Curso | Dibujo de emojis | Pictograma de emojis | Banco visual | Solo texto |
|---|---:|---:|---:|---:|
| 1.º | 231 | 62 | 269 | 81 |
| 2.º | 103 | 0 | 288 | 85 |
| 3.º | 0 | 0 | 343 | 129 |
| 4.º | 0 | 0 | 287 | 62 |
| 5.º | 0 | 0 | 199 | 111 |
| 6.º | 0 | 0 | 326 | 17 |

- **Pictogramas de emojis:** los 62 son de 1.º. Los 11 pictogramas "1 dibujo = 1" de 2.º (y otros 10 de 1.º) no traen filas de emojis en el enunciado, porque piden construir el pictograma a partir de un listado ("5 niños prefieren gatos…"). Por eso mantienen la imagen del banco; no se inventan emojis.
- **Dibujos de emojis:** 334 ejercicios de 1.º y 2.º tienen su propio dibujo, que se prefiere a la imagen de fichas del banco.

## Pendientes y validación sugerida

1. **Prueba con usuarios:** mostrar 5 o 6 ejemplos de cada estilo a una profesora de 1.º ciclo y observar a 2 o 3 niños por curso resolviéndolos (¿entienden la leyenda A/B? ¿cuentan bien con escala?).
2. ~~Emojis repetidos en el enunciado~~ **Hecho (2026-09-30):** los 62 enunciados ya no dicen "pictograma" ni repiten las filas de emojis. Empiezan con "Mira los dibujos." ("Look at the pictures.") y conservan la pregunta, los datos y la respuesta. También se quitó "del pictograma" de 8 pistas. Los cambios están registrados con su texto anterior en `server/prisma/seed/traducciones/enunciados_editados.json` (aplicador `applyPromptEdits.ts`, dentro de `npm run bank:images`) y también en las fuentes del seed. El texto alternativo describe las filas ("Filas de dibujos: Manzanas, 7; Plátanos, 4."). Ojo: el nombre de la habilidad en el mapa ("Leer e interpretar pictogramas") conserva la palabra, porque es el término del currículo.
3. **Pictogramas "construye tú" de 1.º y 2.º (21):** evaluar si la imagen del banco no les resuelve la tarea de construir el pictograma.
