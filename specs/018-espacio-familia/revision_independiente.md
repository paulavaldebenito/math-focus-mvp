# Revisión: pregunta social semanal y espacio familia (specs/018)

## Resumen

La base es buena: tres preguntas cortas, opcionales, con «Prefiero no decir», con transparencia hacia el niño, sin puntaje y con una guía cálida para la familia. Hay **cuatro problemas de fondo** que corregir antes de publicar:

1. **Plan gratis.** Al niño se le pregunta igual («tu familia ve estas respuestas»), pero la familia no ve nada ni puede desactivarlo. El punto de aviso le aparece igual, y lleva a contenido bloqueado. Una señal de posible acoso no debería quedar detrás de un pago.
2. **Señales que no caducan.** Un «sí» de hace meses sigue mostrando «Conversen pronto» con el texto «Esta semana contó…». Y la tarjeta dice «Sin señales esta semana» aunque el niño no haya respondido esta semana.
3. **Acoso repetido.** Un «sí» reiterado no escala ni orienta al protocolo del colegio (Ley 20.536). Tampoco hay salida urgente cuando habla de hacerse daño: faltan las líneas *4141 y SAMU 131.
4. **La guía tiene vacíos.** No dice nada sobre ciberacoso, sobre cómo no revictimizar, sobre no castigar al niño por lo que respondió ni sobre no exponer el caso en el grupo de apoderados. Además mezcla tú y ustedes, y usa «solo/a».

En el niño hay que corregir tres cosas: el título dice «una pregunta» y son tres; el aviso de transparencia y el mensaje de seguridad no se pueden escuchar; y «Gracias por contarme» hace pensar que la app es una persona.

Los números de teléfono propuestos (*4141, 600 360 7777, 131, 133, 134) hay que verificarlos en fuentes oficiales antes de publicarlos.

---

## Corregir

1. **Archivos:** `FamilyDashboardScreen.tsx` / `routes/social.ts` / `routes/homeSummary.ts`.
   - **Actual:** en el plan gratis, `SocialPanel` se oculta (`paid &&`). Pero `GET /social-checkin` solo revisa el consentimiento, y `familyAlert` no revisa el plan.
   - **Qué pasa:** el niño responde creyendo que su familia lo ve, y no es así; eso es engañoso. Un «sí, me molestaron» queda sin ver. La familia gratis no puede desactivar la pregunta, porque el interruptor está dentro del panel oculto. Además, el punto de aviso lleva a contenido bloqueado.
   - **Regla nueva:** «Con los demás» queda disponible en todos los planes, o al menos la señal, la guía y el interruptor. Si se mantiene como función pagada, `due` debe ser `false` y `familyAlert` debe ser `false` cuando `plan === "gratis"`.
   - **PlanTeaser:** quitar el ítem «Con los demás…».

2. **Archivo:** `server/src/domain/social.ts`.
   - **Actual:** `latest = done[0]` (la última respuesta, sea de cuándo sea), y `last3 = done.slice(0, 3)` (las últimas 3 respondidas, sin límite de fecha).
   - **Qué pasa:** la señal no caduca. Un «sí» de marzo sigue en «atención» en junio si el niño saltó la pregunta desde entonces, o si la familia la desactivó y la volvió a activar. Las «3 últimas» pueden abarcar meses, por ejemplo con las vacaciones de por medio.
   - **Regla nueva:** solo cuentan las respuestas de las últimas 6 semanas de calendario (`weekKey >= weekKey(now − 42 días)`). Las reglas de `excluded` sobre la última respuesta se aplican solo si esa respuesta es de esta semana o de la anterior. Hay que pasar `now` a `summarizeSocial(rows, now)`.

3. **Archivo:** `server/src/domain/social.ts`.
   - **Actual:** «atención» se activa solo si la ÚLTIMA respuesta es «si».
   - **Qué pasa:** si el niño dice «sí» una semana y «no» la siguiente, la señal desaparece antes de que la familia la vea. Y un «sí» repetido (el acoso, por definición, es reiterado) no tiene un tratamiento distinto.
   - **Reglas nuevas:**
     - «si» en 2 o más de las últimas 3 respuestas da «atencion», con el motivo `excluded_repeated`.
     - Un «si» en las últimas 3 respuestas (que no sea la última) da «conversar», con el motivo `excluded_recent`.
     - «poco» en 2 o más de las últimas 3 da «conversar», con el motivo `excluded_little_repeated`.

4. **Archivo:** `server/src/domain/social.ts`.
   - **Actual:** recreo = 4 y confidente = 3 solo cuentan por separado, y cada uno necesita 2 de 3 semanas.
   - **Qué pasa:** en la misma semana, «jugué sin nadie y quería jugar con alguien» más «no tengo a quién contarle» es la señal de soledad más fuerte, y hoy no levanta nada hasta otra semana más.
   - **Regla nueva:** si en la última respuesta (de esta semana o la anterior) `recess === 4 && confidant === 3`, da «conversar» con el motivo `alone_and_no_confidant`.
   - **Texto ES:** «En su última respuesta contó que jugó sin nadie en el recreo queriendo jugar con alguien, y que no tiene en su curso a quién contarle cosas.»
   - **Texto EN:** "In their latest answer they said they played alone at recess wanting company, and that they don't have anyone in their class to tell things to."

5. **Archivo:** `server/src/domain/social.ts`, `reasons.excluded` y `reasons.excluded_little`.
   - **Actual:** «Esta semana contó que alguien lo molestó o lo dejó fuera.»
   - **Qué pasa:** es falso cuando la respuesta es de una semana anterior.
   - **Texto nuevo ES:** «En su última respuesta contó que alguien lo molestó o lo dejó fuera.» y «En su última respuesta contó que alguien lo molestó o lo dejó fuera «un poco».»
   - **Texto nuevo EN:** "In their latest answer they said someone was mean to them or left them out." y "…“a little”."
   - **Fecha:** mostrar en el panel la fecha de esa semana junto al motivo.

6. **Archivo:** `server/src/domain/social.ts`, nuevos `reasons`.
   - **Actual:** no existen.
   - **Qué pasa:** hacen falta para las reglas 3 y 4.
   - **`excluded_repeated`**
     - ES: «En 2 de sus últimas 3 respuestas contó que alguien lo molestó o lo dejó fuera. Si se repite, puede ser acoso escolar: conviene hablar con el colegio esta semana.»
     - EN: "In 2 of their last 3 answers they said someone was mean to them or left them out. When it keeps happening it may be bullying: it's worth talking with the school this week."
   - **`excluded_recent`**
     - ES: «Hace poco contó que alguien lo molestó o lo dejó fuera; esta semana no lo repitió. Vale la pena preguntarle cómo sigue eso.»
     - EN: "Recently they said someone was mean to them or left them out; this week they didn't. It's worth asking how that is going."
   - **`excluded_little_repeated`**
     - ES: «En 2 de sus últimas 3 respuestas contó que alguien lo molestó o lo dejó fuera «un poco».»
     - EN: "In 2 of their last 3 answers they said someone was mean to them or left them out “a little”."

7. **Archivo:** `server/src/domain/weekly.ts`.
   - **Actual:** `socialStatus` da «bien» cuando no hay señal y `answeredWeeks > 0`.
   - **Qué pasa:** la tarjeta dice «Sin señales esta semana» aunque el niño no haya respondido esta semana. Es una falsa tranquilidad.
   - **Regla nueva:** «bien» solo si `answeredThisWeek`. Si no, «sin_datos».
   - **Texto nuevo ES:** `socialStatus.sin_datos`: «Aún no responde la pregunta de esta semana»; `bien`: «Sin señales en su respuesta».
   - **Texto nuevo EN:** "Hasn't answered this week's question yet" / "No signals in their answer".

8. **Archivo:** `server/src/domain/social.ts`, `professional`.
   - **Actual:** «…o si habla de hacerse daño.», mezclado con criterios de «varias semanas».
   - **Qué pasa:** hablar de hacerse daño es urgente y no puede ir en la misma lista que criterios que esperan semanas. Además falta a quién llamar.
   - **Separar en `urgent` (Bi), que se muestra siempre que haya una señal, al final y destacado:**
     - ES: «Si habla de hacerse daño, de no querer vivir o de desaparecer, no esperes: busca ayuda hoy. Llama gratis las 24 horas a la línea de prevención del suicidio *4141 o a Salud Responde 600 360 7777; si hay peligro inmediato, al SAMU 131. Tómalo en serio aunque lo diga «en broma».»
     - EN: "If they talk about hurting themselves, not wanting to live or disappearing, don't wait: get help today. Call Chile's suicide prevention line *4141 (free, 24/7) or Salud Responde 600 360 7777; if there is immediate danger, call SAMU 131. Take it seriously even if it's said “as a joke”."
   - **`professional` queda así:**
     - ES: «Busca apoyo profesional (psicólogo o psicóloga del colegio, tu CESFAM o centro de salud, o su pediatra) si la tristeza o el aislamiento duran varias semanas, si cambian su sueño o su apetito, si se queja seguido de dolor de guata o de cabeza antes del colegio, o si no quiere ir al colegio.»
     - EN: "Seek professional support (the school psychologist, your local health center or their pediatrician) if sadness or isolation lasts several weeks, if their sleep or appetite changes, if they often complain of stomachaches or headaches before school, or if they don't want to go to school."

9. **Archivo:** `server/src/domain/social.ts`, `school`.
   - **Actual:** «…pidan hablar también con el encargado de convivencia escolar: todo colegio en Chile debe tener uno.»
   - **Qué pasa:** es correcto, pero no dice qué pedir ni qué hacer si el colegio no responde. Tampoco cubre el caso en que quien molesta es un adulto.
   - **Texto nuevo ES:** «Si se repite o le cuesta ir al colegio, conversa con su profesor o profesora jefe. Si alguien lo molesta o lo deja fuera, pide hablar también con el encargado de convivencia escolar (todo colegio en Chile debe tener uno) y pide que se aplique el protocolo ante maltrato o acoso escolar de su reglamento interno. Deja por escrito lo que contaste (correo o libreta) y pide que te informen qué harán. Si quien lo molesta es un adulto del colegio, es igual de grave: avisa directamente a la dirección. Si el colegio no responde, puedes hacer una denuncia en la Superintendencia de Educación.»
   - **Texto nuevo EN:** "If it keeps happening or school becomes hard for them, talk with their homeroom teacher. If someone is bothering them or leaving them out, also ask to talk with the school's encargado de convivencia escolar (the staff member in charge of school climate and bullying; every school in Chile must have one) and ask them to apply the school's anti-bullying protocol. Put what you reported in writing (email or school notebook) and ask them to tell you what they will do. If the person bothering them is a school adult, it is just as serious: tell the principal's office directly. If the school doesn't respond, you can file a complaint with the Superintendencia de Educación."

10. **Archivo:** `server/src/domain/social.ts`, `avoid`.
    - **Actual:** no hay nada sobre castigar, revictimizar ni exponer.
    - **Qué pasa:** este es el mayor riesgo de mal uso. Si al niño lo retan o le quitan el celular por lo que respondió, deja de contar, también fuera de la app.
    - **Agregar ES:**
      - «No lo retes, castigues ni le quites el celular o la tablet por algo que contó: lo importante es que siga contándote.»
      - «Evita hacerle repetir lo que pasó muchas veces o preguntarle «¿y tú qué hiciste?»: puede sentir que fue su culpa. Dile claramente: «No es tu culpa».»
      - «No enfrentes tú al otro niño ni a su familia, y no lo cuentes en el grupo de apoderados: eso suele empeorar las cosas para tu hijo o hija. Ve por el colegio.»
      - «Evita aconsejarle «pégale de vuelta» o ponerle etiquetas como «tímido» o «raro».»
    - **Agregar EN:**
      - "Don't scold or punish them, or take away their phone or tablet, for something they shared: what matters is that they keep telling you."
      - "Avoid making them retell what happened many times or asking “and what did you do?”: they may feel it was their fault. Tell them clearly: “It's not your fault.”"
      - "Don't confront the other child or their family yourself, and don't share it in the parents' group chat: it usually makes things worse for your child. Go through the school."
      - "Avoid advising them to “hit back” or labeling them “shy” or “weird”."

11. **Archivo:** `server/src/domain/social.ts`, `open` (nuevo ítem).
    - **Actual:** no hay nada sobre ciberacoso.
    - **Qué pasa:** entre 4° y 6° básico ya hay WhatsApp, juegos en línea y TikTok. La Ley 20.536 incluye el acoso por medios tecnológicos.
    - **Texto nuevo ES:** «Si pasa por celular, juegos en línea o redes: guarden juntos capturas de pantalla con la fecha, no respondan, bloqueen y reporten la cuenta. El colegio también debe actuar si es entre compañeros, aunque pase fuera del horario de clases.»
    - **Texto nuevo EN:** "If it happens by phone, online games or social media: save screenshots with the date together, don't reply, and block and report the account. The school must also act if it's between classmates, even outside school hours."

12. **Archivo:** `server/src/domain/social.ts`, `avoid[1]`.
    - **Actual:** «Evitar mostrarle sus respuestas de la app ni pedirle que explique cada una: son suyas, y se las confió.»
    - **Qué pasa:** «ni» no va después de un verbo que no está en negativo. Además, «Evitar» en infinitivo no calza con los imperativos del resto. Y el niño ya sabe que la familia las ve, así que el problema real es interrogarlo.
    - **Texto nuevo ES:** «Evita interrogarlo sobre cada respuesta de la app o leérselas una por una: úsalas como punto de partida para conversar, no como prueba.»
    - **Texto nuevo EN:** "Avoid quizzing them on each answer in the app or reading them back one by one: use them as a starting point for a conversation, not as evidence."

13. **Archivo:** `social.ts` (`SOCIAL_GUIDANCE`) / `FamilyWeek.tsx` / `ConsentScreen.tsx`.
    - **Actual:** la guía usa ustedes («Busquen», «Pregunten», «validen»), el panel usa tú («Solo tú ves», «puedes»), `avoid` usa el infinitivo («Evitar…») y el consentimiento dice «Se puede desactivar cuando quieras».
    - **Qué pasa:** el trato es inconsistente. El resto del espacio familia usa tú («Crea un PIN», «Ingresa»).
    - **Texto nuevo:** todo en tú.
      - «Busca un momento tranquilo…», «Pregunta por momentos concretos…», «Escucha más de lo que hablas y valida lo que siente…», «Ayúdale a buscar oportunidades de juego…».
      - El consentimiento: «Puedes desactivarlo cuando quieras desde el espacio familia.»
      - En `school`: «conversa», «pide».

14. **Archivo:** `client/src/components/FamilyWeek.tsx`, `recessText` y la cabecera `excluded`.
    - **Actual:** «😌 solo/a, y le gustó», «😔 solo/a, quería compañía».
    - **Qué pasa:** usa «/a», contra la norma del proyecto, y no coincide con lo que leyó el niño.
    - **Texto nuevo ES:** `3: "😌 sin nadie, y le gustó"`, `4: "😔 sin nadie, y quería jugar con alguien"`.

15. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `title`.
    - **Actual:** «🤝 Una pregunta de la semana» / "This week's question".
    - **Qué pasa:** son tres preguntas. Prometer una y mostrar tres rompe la confianza y cansa.
    - **Texto nuevo:** «🤝 Tres preguntas de la semana» / "🤝 This week's three questions".

16. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `note` y `trusted`.
    - **Actual:** el botón 🔊 lee solo la pregunta y sus opciones. El aviso «Tu familia ve estas respuestas…» y el mensaje de seguridad no se pueden escuchar.
    - **Qué pasa:** un niño de 1° o 2° que no lee con fluidez no se entera de que su familia ve las respuestas, así que el consentimiento informado del niño no se cumple. Tampoco escucha el mensaje de ayuda, que es justamente el más importante.
    - **Regla nueva:**
      - Un botón 🔊 junto a `note` que lea `c.note`.
      - El primer 🔊 (recreo) antepone `c.note`.
      - En la pantalla de gracias, un botón 🔊 que lea `thanks` + `trusted`.
      - El aviso, en tamaño normal y no como `hint-text`.

17. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `thanks`.
    - **Actual:** «¡Gracias por contarme! 💙» / "Thanks for telling me!".
    - **Qué pasa:** «contarme» hace pensar que la app es alguien que escucha y guarda el secreto. Eso contradice «tu familia ve estas respuestas».
    - **Texto nuevo:** «¡Gracias por contarlo! 💙» / "Thanks for sharing! 💙".

18. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `trusted`.
    - **Actual:** «Si alguien te molesta o te deja fuera, cuéntale a un adulto de confianza: a tu familia o a tu profesor o profesora. Contarlo está bien.»
    - **Qué pasa:** está bien en general, pero falta lo central para no culpabilizar al niño. «Contarlo está bien» es tibio.
    - **Texto nuevo ES:** «Si alguien te molesta o te deja fuera, no es tu culpa. Cuéntale a un adulto de confianza: a tu familia o a tu profesor o profesora. Contarlo es lo correcto.»
    - **Texto nuevo EN:** "If someone is mean to you or leaves you out, it's not your fault. Tell an adult you trust: your family or your teacher. Telling is the right thing to do."

19. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `RECESS`.
    - **Actual:** no hay opción para semanas sin colegio.
    - **Qué pasa:** en vacaciones (diciembre a febrero, julio), en feriados largos o cuando el niño está enfermo, puede marcar «sin nadie», y eso da un falso positivo. Aunque no lo marque, la pregunta no tiene sentido esas semanas.
    - **Regla nueva:** agregar `{ value: 5, emoji: "🏠", label: { es: "esta semana no fui al colegio", en: "I didn't go to school this week" } }`. El valor 5 no cuenta en las señales, y si `recess === 5` no se muestran las otras dos preguntas.
    - **Además:** que no se pregunte (`due = false`) en las semanas de vacaciones del calendario escolar de Chile.

20. **Archivos:** `ConsentScreen.tsx` (`SOCIAL_CONSENT`) / `FamilyWeek.tsx` (`offConsent`).
    - **Actual:** «…y si alguien lo molestó)…». No se dice que el niño sabe, ni cuánto se guarda, ni cómo se borra.
    - **Qué pasa:** el consentimiento queda incompleto. Omite «lo dejó fuera», no avisa que el niño está informado y no habla de conservación ni de borrado. Además, al desactivar, los datos se guardan, y no existe ninguna ruta para borrarlos.
    - **Texto nuevo ES:** «Opcional: autorizo que una vez por semana, al terminar una práctica, le preguntemos con caritas cómo le fue con sus compañeros (con quién jugó en el recreo, si tiene a quién contarle cosas y si alguien lo molestó o lo dejó fuera). Le diremos que su familia ve sus respuestas y que puede saltarlas. Solo quien tenga el PIN del espacio familia las ve, como señales para conversar, nunca como diagnóstico; el colegio no las ve. Guardamos sus últimas 12 semanas. Puedes desactivarlo y borrar sus respuestas cuando quieras desde el espacio familia.»
    - **Texto nuevo EN:** "Optional: I allow the app to ask them once a week, at the end of a practice and with faces, how things went with their classmates (who they played with at recess, whether they have someone to talk to, and whether anyone was mean to them or left them out). We'll tell them their family sees their answers and that they can skip them. Only whoever has the family area PIN sees them, as signals for a conversation, never as a diagnosis; the school doesn't see them. We keep their last 12 weeks. You can turn this off and delete their answers at any time from the family area."
    - **Regla nueva:** al desactivar, ofrecer «Desactivar y borrar sus respuestas». Borrar automáticamente lo que tenga más de 12 semanas. Agregar `onDelete: Cascade` en la relación `SocialCheckIn.childProfile`.

---

## Mejorar

1. **Archivo:** `client/src/components/SocialCheckIn.tsx`, pregunta `EXCLUDED`.
   - **Actual:** «Esta semana alguien me molestó o me dejó fuera.» con «No / Un poco / Sí / Prefiero no decir».
   - **Qué pasa:** «Un poco» mide intensidad, y para un niño de 6 años es ambiguo. Lo que distingue un roce aislado de un acoso es la **frecuencia**, que es lo que exige la Ley 20.536 (que sea reiterado). Además, junta «molestar» y «dejar fuera» en una sola pregunta.
   - **Texto nuevo ES:** pregunta «Esta semana, ¿alguien te molestó o te dejó fuera?»; opciones «No», «Una vez», «Varias veces», «Prefiero no decir».
   - **Texto nuevo EN:** "This week, was anyone mean to you or did anyone leave you out?" con "No", "Once", "Several times", "I'd rather not say".
   - **Regla:** «Una vez» da «conversar» y «Varias veces» da «atencion».

2. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `RECESS.q` y opciones.
   - **Actual:** «Esta semana en el recreo jugué…», «sin nadie, y me gustó».
   - **Qué pasa:** no todos «juegan» en el recreo (conversan, comen, leen, se quedan en la sala). «Jugué sin nadie» suena forzado. «Me gustó» excluye al que simplemente estuvo tranquilo.
   - **Texto nuevo ES:** pregunta «Esta semana en el recreo estuve…»; opciones «con mis amigos», «con algunos compañeros», «sin nadie, y estuve bien», «sin nadie, y quería estar con alguien».
   - **Texto nuevo EN:** "This week at recess I was…" con "with my friends", "with some classmates", "by myself, and I was fine", "by myself, and I wanted to be with someone".

3. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `CONFIDANT.q`.
   - **Actual:** «En mi curso tengo a alguien a quien contarle cosas.» (una afirmación respondida con Sí o No).
   - **Qué pasa:** en 1° y 2° básico se entiende mejor una pregunta directa que una afirmación. Así, además, queda en el mismo formato que la pregunta 3.
   - **Texto nuevo ES:** «¿Tienes en tu curso a alguien a quien contarle tus cosas?»
   - **Texto nuevo EN:** "Do you have someone in your class you can tell things to?"

4. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `EXCLUDED` en inglés.
   - **Actual:** "someone bothered me" / "If someone bothers you".
   - **Qué pasa:** en inglés infantil, "bothered" es débil y ambiguo.
   - **Texto nuevo EN:** "someone was mean to me or left me out" / "If someone is mean to you or leaves you out".
   - **Panel:** `excluded` como "Someone was mean or left them out".

5. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `trusted`.
   - **Actual:** solo se muestra si responde «si» o «poco».
   - **Qué pasa:** el niño puede notar que un mensaje aparece según lo que contestó. Además, el niño que marcó «Prefiero no decir» puede ser justamente el que más lo necesita.
   - **Regla:** mostrar una versión breve a todos los que respondan. A quienes marquen «si», «poco» o «prefiero_no», mostrar la completa.
   - **Versión breve ES:** «Si algún día alguien te molesta o te deja fuera, no es tu culpa: cuéntale a un adulto de confianza.»
   - **Versión breve EN:** "If someone is ever mean to you or leaves you out, it's not your fault: tell an adult you trust."

6. **Archivo:** `client/src/components/SocialCheckIn.tsx`, `note`.
   - **Actual:** «Tu familia ve estas respuestas para poder ayudarte. Puedes saltarlas.»
   - **Qué pasa:** está bien, pero conviene decirle que no hay respuestas buenas o malas, para que no conteste lo que «queda bien».
   - **Texto nuevo ES:** «No hay respuestas buenas ni malas. Tu familia las ve para poder ayudarte. Puedes saltarlas.»
   - **Texto nuevo EN:** "There are no right or wrong answers. Your family sees them so they can help you. You can skip them."

7. **Archivo:** `client/src/components/SocialCheckIn.tsx`, emojis.
   - **Actual:** «con mis amigos» 😄 y «con algunos compañeros» 🙂.
   - **Qué pasa:** ordenan las respuestas de mejor a peor y sugieren cuál es la «buena». Algunos niños eligen por la carita.
   - **Regla:** usar emojis descriptivos que no expresen ánimo en las dos primeras: «👫 con mis amigos», «🧒🧒 con algunos compañeros». Las caritas quedan solo en «sin nadie», donde el sentimiento es justamente lo que se mide.

8. **Archivo:** `server/src/routes/homeSummary.ts`, `familyAlert`.
   - **Actual:** el punto en «Para la familia» aparece solo cuando hay una señal social, y no se apaga aunque la familia ya la haya visto.
   - **Qué pasa:** el niño (o un hermano) aprende que contestar «sí» enciende el punto, y puede dejar de responder con honestidad. Además, si el punto nunca se apaga, la familia termina ignorándolo.
   - **Regla:** encender el punto también por cosas neutras (por ejemplo, «el resumen de la semana está listo») y apagarlo cuando la familia abre el panel. Guardar `familySeenWeekKey`.

9. **Archivo:** `server/src/domain/social.ts`, `prefiero_no` y semanas saltadas.
   - **Actual:** no cuentan nunca.
   - **Qué pasa:** respetar el silencio está bien, pero «prefiero no decir» varias semanas seguidas, o saltar la pregunta justo después de un «sí», es información útil. No conviene tratarlo como alarma.
   - **Regla:** no es una señal. Es una nota en el panel cuando hay 2 o más «prefiero_no» en las últimas 3 respuestas.
   - **ES:** «En varias semanas prefirió no responder si alguien lo molestó. Es su derecho; si te parece, ofrécele conversar sin presionar.»
   - **EN:** "In several weeks they preferred not to say whether anyone was mean to them. That's their right; if you like, offer to talk without pressure."

10. **Archivo:** `client/src/components/FamilyWeek.tsx`, historial.
    - **Actual:** no hay ninguna aclaración sobre «sin nadie, y le gustó».
    - **Qué pasa:** algunas familias se alarman igual al leer «sin nadie».
    - **Nota bajo la tabla ES:** «Estar sin nadie a ratos y pasarlo bien es normal: muchos niños lo necesitan. Lo que importa es cuando quería estar con alguien y no pudo.»
    - **Nota bajo la tabla EN:** "Spending some time alone and enjoying it is normal: many children need it. What matters is when they wanted company and didn't have it."

11. **Archivo:** `server/src/domain/social.ts`, `reasons.alone_recess` y `reasons.no_confidant`.
    - **Actual:** «En varias semanas recientes…».
    - **Qué pasa:** es vago, y «varias» suena a más de lo que es (2 de 3).
    - **Texto nuevo ES:** «En 2 de sus últimas 3 respuestas contó que…»
    - **Texto nuevo EN:** "In 2 of their last 3 answers they said…"

12. **Archivo:** `server/src/domain/social.ts`, `open[2]`.
    - **Actual:** «…validen lo que siente: «Entiendo que eso te haya dolido». Agradezcan que lo haya contado.»
    - **Qué pasa:** falta preguntarle qué quiere que pase y no prometer un secreto que después no se puede cumplir.
    - **Texto nuevo ES:** «Escucha más de lo que hablas y valida lo que siente: «Entiendo que eso te haya dolido». Agradécele que te lo haya contado, pregúntale qué le gustaría que pasara y cuéntale qué vas a hacer antes de hacerlo. No le prometas guardar un secreto si después vas a tener que hablar con el colegio.»
    - **Texto nuevo EN:** "Listen more than you talk and validate the feeling: “I understand that hurt.” Thank them for telling you, ask what they'd like to happen, and tell them what you'll do before you do it. Don't promise to keep it secret if you may need to talk with the school."

13. **Archivo:** `client/src/components/FamilyWeek.tsx`, `privacy`.
    - **Actual:** «Solo tú ves estas respuestas: el colegio no las ve.»
    - **Qué pasa:** es inexacto si dos adultos comparten la cuenta o el PIN. Tampoco le recuerda a la familia que el niño sabe que ella lo ve.
    - **Texto nuevo ES:** «Solo quien tiene el PIN del espacio familia ve estas respuestas; el colegio no las ve. Tu hijo o hija sabe que las ves. Es lo que contó, no un diagnóstico.»
    - **Texto nuevo EN:** "Only whoever has the family area PIN sees these answers; the school doesn't. Your child knows you see them. It's what they shared, not a diagnosis."

14. **Archivo:** `client/src/components/FamilyWeek.tsx`, cabecera `excluded`.
    - **Actual:** «Lo molestaron o lo dejaron fuera».
    - **Qué pasa:** el «lo» genérico choca con el «hijo o hija» del resto del panel.
    - **Texto nuevo ES:** «Alguien lo molestó o dejó fuera» o, en forma neutra, «Molestias o quedar fuera».

15. **Archivo:** `client/src/screens/FamilyGateScreen.tsx`, `createIntro`.
    - **Actual:** «…tu hijo o hija practica tranquilo en la app, y su progreso, cómo se siente y las señales para conversar quedan solo para ti.»
    - **Qué pasa:** «tranquilo» queda en masculino, y «solo para ti» puede leerse como algo secreto para el niño, cuando él sabe que la familia lo ve.
    - **Texto nuevo ES:** «Crea un PIN de 4 dígitos. Así tu hijo o hija practica con tranquilidad, y su progreso, cómo se siente y las señales para conversar quedan en un espacio solo para la familia. Elige un PIN que no sea fácil de adivinar, como 1234 o tu año de nacimiento.»
    - **Texto nuevo EN:** "Create a 4-digit PIN. That way your child can practice calmly, and their progress, how they feel and the signals to talk about stay in a family-only area. Pick a PIN that isn't easy to guess, like 1234 or your birth year."

16. **Archivo:** `client/src/screens/FamilyGateScreen.tsx` / el panel.
    - **Actual:** no hay un botón para salir del espacio familia (el desbloqueo vence solo, por tiempo).
    - **Qué pasa:** en un dispositivo compartido, el niño puede encontrarse el panel abierto.
    - **Regla:** un botón «🔒 Salir del espacio familia» / "🔒 Leave family area", que llame a un `lock` en el servidor. Que el panel se bloquee también al volver a la pantalla del niño.

17. **Archivo:** `server/src/domain/weekly.ts`, `feelingsStatus`.
    - **Actual:** si `difficultShare >= 0.5` o `moodAvg <= 2`, da «conversar», aunque sea con una sola reflexión o un solo registro.
    - **Qué pasa:** una sola práctica con «nervios» deja la tarjeta en «Conviene conversar». Es un falso positivo frecuente, sobre todo en semanas con pocas prácticas.
    - **Regla nueva:** exigir `emotions.length >= 2` para usar `difficultShare` y `moods.length >= 2` para usar `moodAvg`. Si no, «bien» o «sin_datos».

18. **Archivo:** `server/src/domain/weekly.ts`, `learningStatus`.
    - **Actual:** da «atento» si hay cualquier `focusTopic`.
    - **Qué pasa:** casi siempre hay algún tema que necesita apoyo, así que la tarjeta queda permanentemente en «Hay un tema para reforzar». La familia se acostumbra y deja de mirarla.
    - **Regla nueva:** «atento» solo si `accuracy !== null && accuracy < 0.5`. El `focusTopic` se muestra como dato con el estado «bien».

19. **Archivo:** `client/src/components/FamilyWeek.tsx`, `signal.atencion` y `status.atencion`.
    - **Actual:** «🧡 Conversen pronto» / "Talk soon".
    - **Qué pasa:** «Conversen» es ustedes y no calza con el tú. Además, no dice en qué plazo.
    - **Texto nuevo ES:** «🧡 Conviene conversar en los próximos días».
    - **Texto nuevo EN:** "🧡 Worth talking in the next few days".
    - **Tarjeta:** «Conviene conversar pronto» / "Worth talking soon".

20. **Archivo:** `server/src/domain/social.ts`, recursos (nuevo ítem `resources` o al final de `professional`).
    - **Actual:** no hay.
    - **Qué pasa:** a una familia que no sabe a quién acudir le sirve tener un apoyo gratuito.
    - **Texto nuevo ES:** «Si necesitas orientación sobre crianza, puedes llamar gratis a Fono Infancia 800 200 818. Si hay violencia física grave o abuso, es un delito: denuncia a Carabineros (133), PDI (134) o la Fiscalía, o acude a la Oficina Local de la Niñez de tu comuna.»
    - **Texto nuevo EN:** "For parenting guidance you can call Fono Infancia for free at 800 200 818. Serious physical violence or abuse is a crime: report it to Carabineros (133), PDI (134) or the Public Prosecutor's Office, or go to your municipality's Oficina Local de la Niñez."
    - **Antes de publicar:** verificar los números.

21. **Archivo:** `ConsentScreen.tsx` y los datos en general.
    - **Actual:** no menciona la normativa.
    - **Qué pasa:** desde diciembre de 2026 rige la Ley 21.719 de protección de datos personales. Pide mayor resguardo para los datos de niños y niñas, y datos sobre su bienestar y sobre maltrato pueden considerarse sensibles.
    - **Regla:** revisar con una persona experta en la ley el texto, la conservación y el derecho a borrar antes del despliegue en AWS. Registrar la versión del texto de `SOCIAL_CONSENT` aceptado, como ya se hace con `CONSENT_TEXT`.
