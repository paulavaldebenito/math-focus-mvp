# Revisión pedagógica de textos — Math Focus

## Resumen

1. **Hay mensajes de error que piden algo que el niño no puede hacer.** Después de un error, la app no deja volver a intentar el mismo ejercicio: el botón "Continuar" pasa al siguiente. Aun así, `ERROR_FEEDBACK` dice "Revisa la cuenta", las variantes dicen "Probemos otra estrategia" y el ícono es ↻. Conviene que estos mensajes lleven a mirar la solución que aparece abajo.
2. **"Detecta el error" confunde al niño cuando se equivoca.** Se muestra "No fue por eso:" seguido de la causa *correcta*, así que se lee como si esa causa fuera la equivocada. Además, `findStepWrong` dice "el error estaba más adelante" aunque el error puede estar en un paso anterior.
3. **Hay textos que no coinciden con lo que hace la app.** La evaluación inicial dice "No hay respuestas malas". El consentimiento dice "al empezar cada práctica", pero el check-in es una vez al día. El tip de concentración habla de "sesiones de 10 minutos" y la app dura de 3 a 5. El hábitat habla de "hacer más espacio", pero lo que se ganan son regalos. Bajo el número de estrellas dice "estrellas ganadas hoy", pero cuenta solo las de esa práctica.
4. **El panel familiar puede interpretar mal los datos.** "Le está costando: acertó un X %" muestra el porcentaje total, pero la alerta se calcula con los últimos 8 intentos, así que puede aparecer "Le está costando" junto a un 75 %. El tip para E2_CAL afirma "El razonamiento ya le sale bien", y el de `abandono` afirma una causa ("es cansancio").
5. **El mismo concepto se nombra de varias formas.** "nivel" tiene cuatro sentidos: nivel adaptativo, nivel de logro, curso y "Nivel actual". También hay sesión/práctica/misión, compañero/mascota, caritas/emojis, profesora/docente, directiva/o vs directivo/a y enunciado/problema/pregunta. El signo % aparece con espacio y sin espacio, y en inglés sale "73 %".
6. **Lectura para 1°–2°.** Los mensajes de error tienen 15 a 20 palabras y usan "enunciado". El "/a" de "sentado/a" o "nervioso/a" no lo puede leer un niño de 6 años y la voz lo lee raro.
7. **Pausas de respiración.** Solo se muestra la primera etiqueta: "inhalar" queda 30 s en pantalla mientras el niño debería sostener y botar el aire.
8. **Taxonomía.** El brief define E2_RES como "forma del resultado", pero la app entera (seed, etiquetas, feedback y chips) lo trata como "reagrupación/procedimiento". Hay que decidir cuál vale antes de corregir los textos.
9. **Juegos para la casa.** Están bien en general. Hay que corregir algunos pasos ambiguos (1° figuras 3D, 4° división, 6° balanza) y el juego de tablas, que premia la rapidez y con dos dados solo llega a la tabla del 6.

Formato de cada hallazgo: `archivo:línea | texto actual | qué pasa | texto nuevo exacto propuesto`.

---

## client/src/lib/i18n.ts

### Corregir

- i18n.ts:17 | «Ese paso está bien. El error estaba más adelante.» | Es falso cuando el niño marca un paso posterior al equivocado. | «Ese paso está bien. El error está en otro paso: míralo abajo.»
- i18n.ts:199 | «That step is fine. The mistake was further on.» | Mismo problema. | «That step is fine. The mistake is in another step: look below.»
- i18n.ts:116 | «No fue por eso:» (+ chip con la causa CORRECTA) | Se lee "No fue por eso: Se confundió de operación", es decir, niega justo la respuesta correcta. Además, después de dos puntos va minúscula. | «Buen intento, pero fue otra cosa.» (el chip queda como frase aparte: «Buen intento, pero fue otra cosa. Se confundió de operación.»)
- i18n.ts:294 | «That's not quite it:» | Mismo problema. | «Good try, but it was something else.»
- i18n.ts:95 | «Unas preguntas cortas para saber cómo ayudarte mejor. No hay respuestas malas.» | En una evaluación con respuestas correctas, esto es falso, y el niño lo nota cuando se equivoca. | «Unas preguntas cortas para saber cómo ayudarte. Si no sabes alguna, no pasa nada.»
- i18n.ts:277 | «…There are no wrong answers.» | Mismo problema. | «A few short questions so I know how to help you. If you don't know one, that's okay.»
- i18n.ts:119 | «Mira nuevamente este dato.» | "Este dato" no apunta a nada, y el mensaje aparece cuando respondió muy rápido (FAST_THEN_WRONG). | «Respondiste muy rápido. La próxima vez, lee con calma antes de elegir.»
- i18n.ts:301 | «Take another look at this.» | Mismo problema. | «You answered very fast. Next time, read calmly before you choose.»
- i18n.ts:389 | «Probemos otra estrategia.» / «Casi. Intentemos de otra forma.» / «Vamos por otro camino.» | Promete un nuevo intento que no existe, porque "Continuar" pasa a otro ejercicio. | «Esta vez no salió. ¡Mira abajo cómo se hace!» / «Equivocarse también es aprender. Mira cómo se resuelve.» / «Casi. Revisemos juntos cómo se resuelve.»
- i18n.ts:390 | «Let's try another strategy.» / «So close. Let's try it another way.» / «Let's take another path.» | Mismo problema. | «Not this time. Look below to see how it's done!» / «Mistakes help us learn. See how to solve it.» / «So close. Let's look at how to solve it.»
- i18n.ts:410 | «Antes de calcular, piensa bien qué necesitas hacer con estos números para responder la pregunta.» | Son 18 palabras para niños de 1°–2°. "Piensa bien" insinúa que no pensó, y "Antes de calcular" no sirve porque ya respondió. | «Lee otra vez el problema: ¿qué hay que hacer con estos números? Abajo ves cómo se resuelve.»
- i18n.ts:411 | «Revisa tu procedimiento paso a paso: puede que se haya saltado un paso o que el orden no sea el correcto.» | El "se" impersonal es confuso y no hay forma de revisar porque no hay reintento. **Además: el brief define E2_RES como "forma del resultado" y la app lo usa como "procedimiento". Hay que decidir cuál vale.** | Si es procedimiento: «Ibas bien, pero un paso cambió. Busca abajo el paso marcado.» / Si es forma del resultado: «¡Tu cuenta iba bien! Fíjate cómo hay que escribir la respuesta. Mira abajo cómo era.»
- i18n.ts:412 | «Parece que hubo un error de cálculo. Revisa la cuenta paso a paso, con calma.» | Pide revisar algo que ya no se puede rehacer. | «¡Casi! Hubo un error en la cuenta. Mira abajo dónde estuvo.»
- i18n.ts:414 | «Revisa los números del enunciado: puede que hayas usado uno equivocado.» | "Enunciado" es jerga para 1°–2°. | «Mira otra vez los números del problema. ¿Usaste los que servían?»
- i18n.ts:417 | «Before calculating, think carefully about what you need to do with these numbers to answer the question.» | Es la versión en inglés de :410, con el mismo problema. | «Read the problem again: what do you need to do with these numbers? See below how to solve it.»
- i18n.ts:418 | «Check your steps one by one: a step may have been skipped or done in the wrong order.» | Es la versión en inglés de :411, con el mismo problema. | Procedimiento: «You were on track, but one step changed. Find the marked step below.» / Forma: «Your math was on track! Check how the answer should be written. See below.»
- i18n.ts:419 | «It looks like there was a calculation mistake. Check your work step by step.» | Es la versión en inglés de :412, con el mismo problema. | «So close! There was a mistake in the math. See below where it was.»
- i18n.ts:421 | «Check the numbers in the problem — you may have used the wrong one.» | Es la versión en inglés de :414. El sentido está bien; se acorta y se iguala al ES. | «Look at the numbers in the problem again. Did you use the right ones?»
- i18n.ts:143 | «Con cada sesión le haces más espacio a» | No calza con la mecánica real: cada mascota recibe regalos según las estrellas (SceneHabitat). Además, es abstracto para 1°–2°. | «Cada estrella que ganas es un regalo para»
- i18n.ts:325 | «Every session makes more room for» | Mismo problema. | «Every star you earn is a gift for»
- i18n.ts:188 | «estrellas ganadas hoy» | El número que lo acompaña es solo de esta práctica, no del día, y tampoco incluye la estrella de la pausa. | «estrellas en esta práctica»
- i18n.ts:370 | «stars earned today» | Mismo problema. | «stars this practice»
- i18n.ts:165–166 | «Faltan» + n + «estrellas para el siguiente rango» | Con n = 1 queda «Faltan 1 estrellas». Hay que usar una clave en singular. | Singular: «Falta 1 estrella para el siguiente rango» / Plural: «Faltan {n} estrellas para el siguiente rango»
- i18n.ts:348 | «stars to the next rank» | Con n = 1 queda «1 stars». | Singular: «1 star to the next rank»
- i18n.ts:77 | «MVP: de 1° a 6° básico. Sin datos de salud ni diagnósticos.» | "MVP" es jerga interna y no le dice nada a la familia. | «Para estudiantes de 1° a 6° básico. No pedimos datos de salud ni diagnósticos.»
- i18n.ts:259 | «MVP: 1st to 6th grade. No health data or diagnoses.» | Mismo problema. | «For students in 1st to 6th grade. We don't ask for health data or diagnoses.»
- i18n.ts:138 | «Prefiero seguirla sentado/a» | "/a" no se puede leer en voz alta y un niño de 1° no lo lee. "Seguirla" es ambiguo. | «Prefiero hacerlo en mi silla»
- i18n.ts:11 | «Aquí te desviaste» | "Desviarse" es poco usado por niños de 6–8 años. Además, el texto va antes de lo que el niño hizo. | «Tú hiciste»
- i18n.ts:193 | «This is where you went off track» | Mismo cambio. | «You did»

### Mejorar

- i18n.ts:13 | «Así era» | Combina mejor con «Tú hiciste». | «Lo correcto era»
- i18n.ts:195 | «It should have been» | Mismo cambio. | «The right way was»
- i18n.ts:110 | «¡Vas increíble! Sigue así» | Es un elogio genérico; conviene elogiar el esfuerzo o la estrategia (la racha es de 3 aciertos). | «¡Tres seguidas! Se nota que lees con atención.»
- i18n.ts:297 | «You're doing amazing! Keep it up» | Mismo cambio. | «Three in a row! You're reading carefully.»
- i18n.ts:112 | «¡Qué bien lo estás haciendo!» | Elogia el resultado; es mejor elogiar el esfuerzo. | «¡Llegaste a la mitad con mucho esfuerzo!»
- i18n.ts:299 | «You're doing so great!» | Mismo cambio. | «You made it halfway with lots of effort!»
- i18n.ts:97 | «¡Perfecto!» | Puede leerse como "te fue perfecto" aunque se haya equivocado. | «¡Listo!»
- i18n.ts:279 | «Perfect!» | Mismo problema. | «All done!»
- i18n.ts:129 | «¿Hacemos un momento de calma antes de la misión?» | Una de las opciones es "Movimiento", que no es "calma". Además, "misión" convive con sesión y práctica. | «¿Hacemos una pausa corta antes de empezar?»
- i18n.ts:311 | «Want a calm moment before the mission?» | Mismo cambio. | «Want a short break before we start?»
- i18n.ts:123 + 125 | «¿Cómo estás hoy?» + «¿Cómo te sientes hoy?» | El título y la primera pregunta dicen casi lo mismo. | Título: «¡Hola! Antes de empezar…»
- i18n.ts:305 | «How are you today?» | Mismo cambio. | «Hi! Before we start…»
- i18n.ts:139 | «Comprueba que tienes espacio a tu alrededor.» | "Comprueba" es difícil para 1°–2°. | «Mira que tengas espacio a tu alrededor.»
- i18n.ts:175 | «Elige tu compañero» | En Inicio se habla de "mascota" (:178); conviene usar una sola palabra. | «Elige tu mascota»
- i18n.ts:357 | «Choose your companion» | Mismo cambio. | «Choose your pet»
- i18n.ts:178 | «Cambiar tu mascota o su nombre» | El botón de al lado dice «Cambiar mis intereses»: mezcla "tu" y "mis". | «Cambiar mi mascota o su nombre»
- i18n.ts:360 | «Change your mascot or its name» | Mismo cambio, y en EN se usa "pet". | «Change my pet or its name»
- i18n.ts:183 | «¡Listo, empezar!» | Cuando se entra desde Inicio para cambiar intereses, no se "empieza" nada. | «¡Listo!»
- i18n.ts:162 | «Ver mapa» | Es el botón principal del niño; conviene que invite a practicar. | «¡A practicar!»
- i18n.ts:149 | «Precisión general:» | "Precisión" es un término técnico para la familia. | «Respuestas correctas (total):»
- i18n.ts:151 | «Nivel actual:» | Se confunde con el nivel de logro y con el curso. Es el nivel adaptativo de dificultad. | «Nivel de dificultad actual:»
- i18n.ts:333 | «Current level:» | Mismo cambio. | «Current difficulty level:»
- i18n.ts:152 | «Dónde practicar más:» | La lista es de tipos de error, no de lugares ni temas. | «En qué fijarse más:»
- i18n.ts:334 | «Where to practice more:» | Mismo cambio. | «What to focus on:»
- i18n.ts:19 | «🏫 Soy docente o directivo/a» | copy.ts usa «directiva/o»; conviene unificar. | (dejar así y cambiar copy.ts)

---

## client/src/lib/feedback.ts

### Mejorar

- feedback.ts:16 | `feedbackReview` solo si no hay código de error | Si el niño respondió muy rápido Y el error tiene código, se pierde el aviso "respondiste muy rápido". Con el texto nuevo de :119 se podrían mostrar los dos (anteponer el aviso). Es un cambio de lógica, no solo de texto. | —

---

## client/src/lib/errorLabels.ts (etiquetas para familia y docentes)

### Corregir

- errorLabels.ts:7 | «Reagrupación/procedimiento» | La barra y "reagrupación" son jerga para la familia, y la etiqueta está bajo el título «Dónde practicar más». Además hay que alinearla con la definición de E2_RES que se decida. | «Seguir los pasos del procedimiento»
- errorLabels.ts:17 | «Regrouping/procedure» | Mismo cambio. | «Following the steps»

### Mejorar

Se proponen etiquetas en clave de habilidad a practicar, no de falta, porque se muestran bajo «En qué fijarse más»:

- errorLabels.ts:6 | «Confusión de operación» | | «Elegir qué operación usar»
- errorLabels.ts:8 | «Cálculo puntual» | Es ambiguo. | «Hacer los cálculos con cuidado»
- errorLabels.ts:9 | «Comprensión del enunciado» | | «Entender qué se pregunta»
- errorLabels.ts:10 | «Uso de un dato del enunciado» | | «Usar bien los datos del problema»
- errorLabels.ts:11 | «Respuestas muy rápidas» | | «Tomarse tiempo antes de responder»
- errorLabels.ts:12 | «Actividades sin terminar» | | «Terminar las actividades»
- errorLabels.ts:13 | «Pistas usadas seguido» | | «Intentar antes de pedir pista»
- errorLabels.ts:16–23 | (EN) | Mismo cambio. | «Choosing the operation» / «Calculating carefully» / «Understanding the question» / «Using the problem's data» / «Taking time before answering» / «Finishing activities» / «Trying before asking for a hint»

---

## client/src/lib/emotions.ts

### Corregir

- emotions.ts:14 | «Es normal cuando algo cuesta. ¡Respiramos y seguimos! 💪» | Aparece al terminar la práctica, cuando ya no hay "seguimos". Además, conviene nombrar la emoción para validarla. | «Es normal sentir rabia cuando algo cuesta. La próxima vez respiramos y lo intentamos de nuevo. 💪»
- emotions.ts:14 | «That's normal when something is hard. Let's breathe and keep going! 💪» | Mismo problema. | «It's normal to feel frustrated when something is hard. Next time we'll breathe and try again. 💪»

### Mejorar

- emotions.ts:10 | «¡Tienes razón en sentirte así! 🌟» | Suena raro, y es mejor reforzar el esfuerzo. | «¡Qué bueno! Te esforzaste y se nota. 🌟»
- emotions.ts:10 | «You should feel proud! 🌟» | Mismo cambio. | «Great! You worked hard and it shows. 🌟»
- emotions.ts:13 | «¡La próxima probemos algo nuevo! 🚀» | Promete algo que la app no garantiza. | «Gracias por decírmelo. Puedes elegir otro tema en el mapa. 🚀»
- emotions.ts:13 | «Next time let's try something new! 🚀» | Mismo cambio. | «Thanks for telling me. You can pick another topic on the map. 🚀»

---

## client/src/lib/moodFaces.ts

### Corregir

- moodFaces.ts:16–20 | «Muy nervioso/a», «Un poco nervioso/a», «Tranquilo/a», «¡Muy tranquilo/a!» | Los niños de 1°–2° no pueden leer "/a", y la voz lo lee como "nervioso barra a". | «Con muchos nervios» / «Con algunos nervios» / «Más o menos» / «Con calma» / «¡Con mucha calma!»

---

## client/src/lib/pauses.ts (respiración y movimiento)

### Corregir

- pauses.ts:25 | labels «huele la flor 🌸», «sopla la vela 🕯️» | BreathingPause.tsx:102 muestra solo `labels[0]`, así que durante los 30 s se lee "huele la flor" y nunca "sopla la vela". | Una sola etiqueta: «huele la flor 🌸 y sopla la vela 🕯️, despacito»
- pauses.ts:26 | (EN) | Mismo problema. | «smell the flower 🌸 and blow out the candle 🕯️, slowly»
- pauses.ts:49 | «inhalar», «sostener», «exhalar» | Solo se ve «inhalar» durante 30 s. Además, usa infinitivo y el resto de la app usa imperativo. | Una sola etiqueta: «inflas la panza como un globo, aguantas un poquito y botas el aire lento»
- pauses.ts:50 | «breathe in», «hold», «breathe out» | Mismo problema. | «fill your tummy like a balloon, hold a little, then let the air out slowly»
- pauses.ts:97/106/124/133 | «…, sentado/a» | Mismo problema de lectura con "/a". | Reemplazar «sentado/a» por «en tu silla» (p. ej. «Abre y cierra los brazos por encima de la cabeza, en tu silla»; «Igual, en tu silla: mueve los brazos unos segundos y después congélate»)

### Mejorar

- pauses.ts:320–323 | «¡50 %!» (con espacio) | homeGames.ts usa «25%» sin espacio; conviene unificar en ES. En EN la norma es sin espacio (ya está así aquí). | ES: dejar «50 %» y cambiar homeGames.ts:165/183 a «25 %», «50 %».
- pauses.ts:96 | «Do 10 star jumps…» | En inglés de aula es más común "jumping jacks". | «Do 10 jumping jacks (arms and legs opening and closing)»
- pauses.ts:290 | «da 3 pasos a la derecha y 2 hacia adelante» | La versión sentada dice "hacia arriba"; conviene ligarlos explícitamente al eje y. | «…da 3 pasos a la derecha y 2 hacia adelante (eso es "hacia arriba" en la cuadrícula): ¡llegaste al punto (3, 2)! Vuelve y ve al (1, 4)»

---

## client/src/lib/companions.ts

### Mejorar

- companions.ts:15 | ES «Búho» / EN «Hoot» | Las otras mascotas se traducen literalmente (Zorro/Fox, Conejo/Bunny); "Hoot" es un nombre propio y "Búho" no. | EN «Owl» (o, si se quiere un nombre propio, ES «Ulises» / EN «Hoot»)

---

## client/src/components/WorkedSolution.tsx

Usa las claves de i18n.ts:11–13 y 193–195 (ver arriba). Sin otros hallazgos.

---

## client/src/components/SessionReflection.tsx

### Mejorar

- SessionReflection.tsx:83–87 | Botón «🔊 Escuchar» solo para la pregunta de emociones | La segunda pregunta (clima, energía o lo más difícil) y las etiquetas de las opciones no se pueden escuchar, y en 1°–2° no las leen. Es un cambio de código: leer también `t(lang, q.question)`. | —
- SessionReflection.tsx:26–28 | «Poquita» / «Normal» / «¡Mucha!» — EN «A little» / «Some» / «Lots!» | "Normal" (ES) y "Some" (EN) no son equivalentes, y "Normal" no ordena bien la escala poca → mucha. | ES «Normal» → «Algo» (EN «Some» se mantiene)

---

## client/src/screens/PracticeScreen.tsx

### Corregir

- PracticeScreen.tsx:799 | ícono «↻» en la tarjeta de error | Indica "reintentar", pero no hay reintento. | «💡»
- PracticeScreen.tsx:83 | `${prefix} ${chip}.` | Con el prefijo actual queda «No fue por eso: Se confundió…» (después de dos puntos va minúscula, y además se niega la causa correcta). Con el texto nuevo de i18n:116 el formato funciona sin cambios. | (ver i18n.ts:116)

---

## client/src/screens/ConsentScreen.tsx

### Corregir

- ConsentScreen.tsx:10 | «Al empezar cada práctica le preguntaremos, con caritas y siempre de forma opcional, cómo se siente y cómo se siente con las matemáticas, y al terminar, qué sintió al practicar…» | El check-in es una vez al día (wellbeing.ts, FamilyInsights.tsx:29), no en cada práctica. Además repite "cómo se siente". | «Guardaremos el nombre y curso de tu hijo/a, y un registro de sus respuestas, pistas usadas y pausas, solo para adaptar la práctica y mostrarte su progreso. Una vez al día, al empezar, le preguntaremos con caritas cómo está y cómo se siente con las matemáticas; al terminar cada práctica, qué sintió. Siempre puede saltarse estas preguntas. Lo usamos para sugerirte cómo acompañarlo/a en casa. No guardamos diagnósticos médicos. Puedes pedir que borremos estos datos cuando quieras.»
- ConsentScreen.tsx:11 | (EN) | Mismo problema. | «We'll store your child's name and grade, along with a record of their answers, hints used and pauses, only to adapt their practice and show you their progress. Once a day, at the start, we'll ask them with faces how they are and how they feel about math; at the end of each practice, how they felt. They can always skip these questions. We use this to suggest how to support them at home. We don't store medical diagnoses. You can ask us to delete this data at any time.»

---

## client/src/screens/FamilyDashboardScreen.tsx (HOME_TIPS)

### Corregir

- FamilyDashboardScreen.tsx:25 | «El razonamiento ya le sale bien — unos minutos…» | Afirma algo que los datos no muestran (el error se clasificó por la alternativa elegida). | «Suele elegir bien el camino; unos minutos de cálculo mental al día, jugando, ayudan a que los números salgan con más soltura.»
- FamilyDashboardScreen.tsx:35 | «The reasoning is already solid — …» | Mismo problema. | «They usually pick the right approach; a few minutes of playful mental math a day helps the numbers come more easily.»
- FamilyDashboardScreen.tsx:29 | «…puede ser una señal de cansancio, no de que el contenido sea difícil.» | Descarta una causa sin evidencia (va contra la regla "nunca concluir causas"). | «Prueben sesiones en otro momento del día. Dejar actividades sin terminar puede deberse a cansancio, a que el tema le cuesta o a otras cosas: conversen con tu hijo/a para saber qué le pasa.»
- FamilyDashboardScreen.tsx:39 | «…it can be a sign of tiredness, not that the content is too hard.» | Mismo problema. | «Try a different time of day. Leaving activities unfinished can come from tiredness, from a hard topic or other reasons: talk with your child to find out.»

### Mejorar

- FamilyDashboardScreen.tsx:27 | «Practiquen marcando en voz alta los números importantes…» | "Marcar en voz alta" es confuso. | «Antes de resolver, que subraye o diga en voz alta los números importantes del problema, para no perder ni cambiar un dato.»
- FamilyDashboardScreen.tsx:37 | «Practice pointing out loud to the important numbers…» | Mismo problema. | «Before solving, have them underline or say out loud the important numbers in the problem, so no detail gets lost or swapped.»
- FamilyDashboardScreen.tsx:28,30 | «Anímalo…», «intentarlo solo» | Usa masculino genérico, mientras el resto del panel usa "tu hijo/a". | «Anima a tu hijo/a a decir en voz alta qué va a hacer antes de responder: parar un segundo mejora la precisión sin quitarle las ganas.» / «…dale un poco más de tiempo para intentarlo por su cuenta antes de usar la pista, y celebra el intento aunque se equivoque.»
- FamilyDashboardScreen.tsx:125 | `${…}%` (sin espacio) | FamilyInsights.tsx:18 y school/copy.ts:233 usan «X %»; conviene unificar. | ES «73 %», EN «73%» (formatear según el idioma)

---

## client/src/components/FamilyInsights.tsx

### Corregir

- FamilyInsights.tsx:278 | «Le está costando: acertó un ${p} de ${n} preguntas.» | Muestra el % y el n **totales**, pero la marca "le está costando" se calcula con los **últimos 8 intentos** (feelings.ts:279–281). Puede aparecer "Le está costando: acertó un 75 % de 20 preguntas". Hay que pasar la precisión reciente. | «Le está costando: en sus últimas ${n} preguntas acertó ${c} (${p}).» (con n = intentos recientes, c = correctas recientes)
- FamilyInsights.tsx:297 | «It's been tricky: they got ${p} of ${n} questions right.» | Mismo problema. | «It's been tricky lately: in their last ${n} questions they got ${c} right (${p}).»
- FamilyInsights.tsx:27 | «🙂 Ánimo al empezar el día y aciertos» | La pregunta se hace en la primera práctica del día, no al empezar el día. | «🙂 Ánimo al empezar a practicar y aciertos»
- FamilyInsights.tsx:49 | «🙂 Mood at the start of the day and results» | Mismo problema. | «🙂 Mood before practicing and correct answers»
- FamilyInsights.tsx:18 | `${…} %` también en EN | En inglés no se escribe espacio antes de %. | EN: «73%»

### Mejorar

- FamilyInsights.tsx:276 | «Para los temas que más le cuestan o que le hacen sentir rabia o nervios.» | "Le hacen sentir" atribuye una causa. | «Para los temas que más le cuestan o en los que hace poco sintió rabia o nervios. Sin pantalla, de 5 a 15 minutos.»
- FamilyInsights.tsx:295 | «…or that make them feel frustrated or nervous.» | Mismo cambio. | «For the topics they find hardest or where they recently felt frustrated or nervous. No screens, 5 to 15 minutes.»
- FamilyInsights.tsx:159 | «con emojis» | En el resto de la app se dice "caritas". | «Aún no hay respuestas. Al terminar cada práctica le preguntamos, con caritas y de forma opcional, qué sintió.»
- FamilyInsights.tsx:172 | «with emojis» | Mismo cambio. | «…with faces and always optionally…»
- FamilyInsights.tsx:306 | «↘ Getting harder» | Sugiere que el tema se volvió más difícil; el ES dice "le está costando más". | «↘ Finding it harder lately»
- FamilyInsights.tsx:32 | «…dijo sentirse nervioso/a…; …se sintió tranquilo/a…» | Para adultos se puede leer, pero se evita el "/a". | «Los días en que dijo sentir nervios con las matemáticas acertó un ${a}; los días en que se sintió con calma, un ${b}.»
- FamilyInsights.tsx:37 | «Si se siente nervioso/a con las matemáticas» | Mismo cambio. | «Si siente nervios con las matemáticas»

---

## client/src/components/ClassroomLink.tsx

### Corregir

- ClassroomLink.tsx:9 | «Si la profesora te dio un código de curso, ingrésalo para que pueda ver su progreso y apoyarlo en clases.» | Asume que el docente es mujer, usa "apoyarlo" en masculino y "su" es ambiguo. | «Si el colegio te dio un código de curso, ingrésalo para que su docente pueda ver el progreso de tu hijo/a y apoyarle en clases.»
- ClassroomLink.tsx:12 | «…autorizo que la profesora vea… Si no lo marcas, solo cuenta en el clima general del curso, sin su nombre.» | "Profesora", "lo" en vez de "la" (casilla) y "clima general" es jerga. | «Además, autorizo que su docente vea cómo se siente al practicar (sus emociones). Si no marcas esta casilla, sus emociones solo se suman al resumen general del curso, sin su nombre.»
- ClassroomLink.tsx:15–16, 20 | «La profesora puede ver…», «La profesora no ve…», «Revísalo con la profesora.» | Mismo problema. | «Su docente puede ver sus emociones.» / «Su docente no ve sus emociones individuales.» / «No encontramos ese código. Revísalo con su docente.»

### Mejorar

- ClassroomLink.tsx:38 | «That code is for a grade ${g} class…» | El resto de la app usa "3rd grade". | «That code is for a ${ordinal} grade class and this profile is in a different grade.»

---

## client/src/components/school/copy.ts (paneles docente/directivo)

### Corregir

- copy.ts:44 | «Reenseñar ${oa} a todo el curso: ${n} de ${total} están en nivel Inicial…» | "Reenseñar" no es una palabra estándar. Además, `total` = estudiantes **que practicaron ese OA**, no todo el curso, así que la frase sobredimensiona. | «Volver a enseñar ${oa} al curso: ${n} de los ${total} estudiantes que lo practicaron están en nivel Inicial${err ? `. Error más común: ${err}` : ""}.»
- copy.ts:154 | «Reteach ${oa} to the whole class: ${n} of ${total}…» | Mismo problema. | «Reteach ${oa} to the class: ${n} of the ${total} students who practiced it are at the Beginning level…»
- copy.ts:48 | «${oa} genera rabia o nervios en ${n} estudiantes: parte la clase con algo que ya dominan y normaliza el error.» | Atribuye la causa al OA (la regla es ser solo descriptivo). "Parte la clase" es ambiguo. | «${n} estudiantes reportaron rabia o nervios al practicar ${oa}: empieza la clase con algo que ya dominan y muestra el error como parte de aprender.»
- copy.ts:158 | «${oa} brings frustration or nerves for…» | Mismo problema. | «${n} students reported frustration or nerves while practicing ${oa}: start with something they've mastered and treat mistakes as part of learning.»
- copy.ts:88 | «📝 Notas de la docente (privadas)» | Asume que el docente es mujer. | «📝 Notas docentes (privadas)»
- copy.ts:18, 24 | «quedarás como directiva/o», «Directiva/o» | i18n.ts:19 usa «directivo/a». | «quedarás como directivo/a» / «Directivo/a»

### Mejorar

- copy.ts:49, 80, 54, 164 | «Dominio por OA…» junto a niveles «Inicial / En desarrollo / Logrado» | En Chile se habla de "nivel de logro"; "dominio" convive con "Logrado" y además hay "nivel" adaptativo. | «🗺️ Nivel de logro por OA y estudiante» / «Nivel de logro por OA» / «📚 Nivel de logro del curso por OA»
- copy.ts:50 | «Según los últimos 10 intentos de cada OA…» | Falta aclarar que es una estimación de la app y no una calificación. | «Estimación según los últimos 10 intentos de cada OA (no es una calificación). Toca un nombre para ver su ficha.»
- copy.ts:99, 101, 113 | «…por eje y nivel», «Aciertos por nivel», «Bienestar por nivel» | Aquí "nivel" significa curso, mientras en la app significa dificultad o logro. | «📚 % Logrado por eje y curso» / «📈 Aciertos por curso, mes a mes» / «💛 Bienestar por curso (14 días)»
- copy.ts:46 | «Sin práctica hace 7 días o más: …» | La construcción es forzada. | «Sin practicar desde hace 7 días o más: ${names}. Conviene un recordatorio a la familia.»
- copy.ts:63–64 | «Con pista», «Muy rápidas» | Encabezados ambiguos. | «Respuestas con pista» / «Respuestas muy rápidas»
- copy.ts:77 | «Nadie necesita un acompañamiento especial por ahora.» | Afirma más de lo que el dato permite (solo cubre a quienes autorizaron compartir). | «Sin alertas de bienestar por ahora (solo se consideran estudiantes con autorización de su familia).»
- copy.ts:118 | «solo ${p} de los estudiantes practicó esta semana.» | Falta el artículo. | «solo el ${p} de los estudiantes practicó esta semana.»
- copy.ts:143 | «Grade ${g}» | i18n usa «3rd grade». | «${ordinal} grade»
- copy.ts:233 | `${…} %` en EN | Sin espacio en inglés. | EN: «73%»

---

## server/src/domain/feelings.ts (orientación a familias)

### Corregir

- feelings.ts:152 | «Elijan un momento sin pantallas ni ruido, sesiones de 10 minutos, y acepten las pausas que ofrece la app.» | Contradice la app: es de pantalla y dura de 3 a 5 minutos. | «Elijan un momento tranquilo, sin ruido ni otras pantallas encendidas, con prácticas cortas, y acepten las pausas que ofrece la app.»
- feelings.ts:153 | «Pick a time without screens or noise, 10-minute sessions…» | Mismo problema. | «Pick a quiet time, with no noise or other screens on, keep practices short, and accept the breaks the app offers.»

### Mejorar

- feelings.ts:115 | ««Aquí equivocarse está permitido.»» | En casa, "aquí" queda ambiguo. | ««Equivocarse está permitido: así se aprende.»»
- feelings.ts:116 | «“Mistakes are allowed here.”» | Mismo cambio. | «“Mistakes are allowed: that's how we learn.”»
- feelings.ts:67 | ««Te vi con mucha concentración.»» | El adulto puede no haberlo visto. | ««Se nota que estabas concentrado/a.»»
- feelings.ts:99 | label EN «Frustration» vs ES «Rabia» | Sin cambio: se acepta. Solo se nota que en las guías ES se dice "enojarse", y conviene usar "rabia" para mantener una sola palabra. | feelings.ts:102 ES: ««Es normal sentir rabia cuando algo cuesta. Equivocarse es parte de aprender.»»

---

## server/src/domain/homeGames.ts (juegos para la casa)

### Corregir

- homeGames.ts:44 | «Muestren 7 objetos y, sin que mire, esconde algunos bajo la taza.» | Mezcla "ustedes" y "tú", y no queda claro quién no mira. | «Muestra 7 objetos y, sin que tu hijo/a mire, esconde algunos bajo la taza.»
- homeGames.ts:50 | «Busquen en la casa un cubo, un cilindro, una esfera y una caja.» | "Caja" no es una figura 3D; el término es prisma. | «Busquen en la casa un cubo (un dado), un cilindro (una lata), una esfera (una pelota) y un prisma (una caja).»
- homeGames.ts:50 | «Pongan cada objeto sobre el papel y tracen su borde…» | Una esfera no se puede trazar así. | «Pongan la lata, la caja y el dado sobre el papel y tracen su borde: ¿qué figura plana queda?»
- homeGames.ts:50 | «Adivina tú: describe un objeto («es redondo y rueda») y que lo encuentre.» | Contradictorio: dice "adivina tú", pero el adulto describe y el niño adivina. | «A adivinar: describe un objeto («es redondo y rueda») y que tu hijo/a lo encuentre. Luego cambien.»
- homeGames.ts:51 | «Your turn to guess: describe an object…» | Mismo problema. | «Guessing game: describe an object (“it's round and it rolls”) and let your child find it. Then switch.»
- homeGames.ts:89–90 | «Dos dados (o cartas)» / «El primero en decir el resultado gana un punto…» | Con dos dados solo se llega a 6 × 6, y la tabla es hasta el 10. Además, la competencia de velocidad aumenta la ansiedad matemática (y contradice la guía de "nervios"). | Materiales: «Cartas del 1 al 10 (o dos dados)»; paso 2: «Túrnense: quien saca las cartas dice el resultado, sin apuro. Si lo necesita, puede contar con los dedos o dibujar.»
- homeGames.ts:91 | «The first to say the answer wins a point…» | Mismo problema. | Materiales: «Cards 1 to 10 (or two dice)»; paso 2: «Take turns: whoever draws says the answer, no rush. They can count on fingers or draw if needed.»
- homeGames.ts:119 | «Inventen una historia: si fueran personas en autos, ¿qué hacemos con los que sobran?» | Es confuso porque no dice cuántos caben en cada auto. | «Inventen una historia: si son 47 personas y en cada auto caben 5, ¿cuántos autos se necesitan? ¿Qué pasa con las que sobran?»
- homeGames.ts:120 | «Make up a story: if they were people in cars…» | Mismo problema. | «Make up a story: if 47 people need rides and 5 fit in each car, how many cars do you need? What happens to the ones left over?»
- homeGames.ts:174 | «Papel y lápiz (o una balanza de cocina)» / «…a un lado 3 bolsas iguales y 2 sueltos, al otro 14.» | Una balanza de cocina digital no funciona como balanza de dos platos. "2 sueltos" no dice de qué. | Materiales: «Papel, lápiz y porotos»; paso 1: «Dibujen una balanza: a un lado 3 bolsas con la misma cantidad de porotos y 2 porotos sueltos; al otro, 14 porotos.»
- homeGames.ts:175 | (EN) | Mismo problema. | Materiales: «Paper, pencil and beans»; paso 1: «Draw a balance: on one side 3 bags with the same number of beans and 2 loose beans; on the other, 14 beans.»

### Mejorar

- homeGames.ts:61 | «fósforos usados» | No es un material recomendable para niños de 2°. | «Palitos de helado o bombillas cortadas y elásticos»
- homeGames.ts:122 | «Hagan una recta con cinta en el suelo y salten hasta 1/2, 3/4…» | Faltan las marcas 0 y 1. | «Hagan una recta con cinta en el suelo, marquen el 0 y el 1, y salten hasta 1/2, 3/4…»
- homeGames.ts:125 | «Cambien de rol, y prueben también «es mayor que…».» | Es vago para padres sin formación matemática. | «Cambien de rol. Prueben también: «pensé un número, le sumé 10 y me dio más que 25: ¿qué números pueden ser?».»
- homeGames.ts:145 | «Comparen 2/3 y 3/4 llevándolas al mismo número de partes.» | Los padres pueden no saber cómo hacerlo. | «Comparen 2/3 y 3/4 llevándolas al mismo número de partes (8/12 y 9/12): ¿cuál es mayor?»
- homeGames.ts:102–103 | EN «edges and corners» | En inglés de aula el término es "vertices". | «Count the faces, edges and vertices (corners) of the box.»
- homeGames.ts:165, 183 | «25%», «50% y 25%» | El signo % se usa sin espacio y pauses.ts lo usa con espacio. | «25 %», «50 % y 25 %» (en EN se mantiene sin espacio)

---

## server/prisma/seed.ts (aunque hoy no se muestra en el cliente, alimenta futuras pantallas)

### Mejorar

- seed.ts:13 | «No identifica correctamente qué operación (suma o resta) corresponde usar.» | Solo vale para 1°–2°; el banco llega a 6°. | «No identifica qué operación corresponde usar para resolver el problema.»
- seed.ts:14 | «…se equivoca al pedir prestado, reagrupar…» | "Pedir prestado" es un término desaconsejado (las Bases Curriculares usan "reagrupar/canjear"). Además falta resolver la definición de E2_RES. | «Entiende la idea, pero se equivoca al reagrupar o al seguir un paso del procedimiento.»

---

## Consistencia transversal (aplicar en todos los archivos)

- **sesión / práctica / misión** (i18n.ts:89, 98, 129, 141, 143, 147; FamilyInsights; copy.ts:61) | Hay tres nombres para lo mismo. | Usar «práctica» con niño y familia («¡Práctica terminada!» en :141, «Prácticas realizadas:» en :147, «armar tu primera práctica» en :98). Los docentes pueden mantener "sesiones".
- **nivel** | Tiene cuatro sentidos: dificultad adaptativa (pantalla del niño: «nivel 3»), «Nivel actual» (familia), «nivel Inicial» (logro, docente) y «por nivel» (curso, directivo). | Dificultad → «nivel de dificultad»; logro → «nivel de logro»; curso → «curso».
- **compañero / mascota** | | «mascota» en todo el texto visible.
- **caritas / emojis** | | «caritas».
- **profesora / docente** | | «docente».
- **directivo/a / directiva/o** | | «directivo/a».
- **enunciado / problema / pregunta** (para el niño) | | «problema» para el texto completo y «pregunta» para lo que se pide; nunca «enunciado» con niños.
- **Género con "/a" en textos para niños** | | Usar formas neutras («con calma», «en tu silla»). En textos para adultos se puede mantener «tu hijo/a».
- **Signo %** | | ES «73 %» (norma RAE, con espacio fino o normal); EN «73%». Hoy se mezclan en FamilyDashboardScreen, FamilyInsights, copy.ts, pauses.ts y homeGames.ts.
- **Curso en inglés** | «3rd grade» (i18n) vs «Grade 3» (copy.ts, ClassroomLink). | Unificar en «3rd grade».
- **Nombres de habilidades del mapa** (vienen de MathSkill.name) | Para 1°–2° son largos y técnicos («Ecuaciones e inecuaciones de un paso con suma y resta», «Adición y sustracción dentro de 20»). | Agregar un nombre corto para el niño en el mapa y en el chip de práctica (p. ej. «Sumar y restar hasta 20») y dejar el nombre oficial y el OA para la familia y los docentes.
