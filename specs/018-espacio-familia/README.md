# 018 · Espacio familia (panel de pago) con seguimiento del aprendizaje, emociones y señales sociales

**Pedido de la usuaria (2026-10-26):** el panel del padre será el de pago. El padre debe poder hacer seguimiento del aprendizaje y de cómo se siente su hijo, y recibir señales tempranas de aislamiento social. Todo dentro de la misma app.

**Decisiones aprobadas («perfecto»):**
- 3 preguntas sociales, una vez por semana.
- El colegio no ve las respuestas sociales individuales.
- Separación entre lo gratis y el Plan Familia.
- PIN de 4 dígitos para entrar al espacio familia.

## Qué se construyó

### Espacio familia con PIN (misma app)
- En el inicio del niño, «Ver progreso» se reemplazó por un botón discreto: «👪 Para la familia 🔒».
- El botón pide un PIN de 4 dígitos. El adulto lo crea, o lo recupera, con la contraseña de su cuenta.
- Al entrar, el espacio queda desbloqueado 30 minutos. Se cierra con «🔒 Salir del espacio familia».
- Tras 5 PIN equivocados se bloquea por 5 minutos.
- Quedan detrás del PIN, en el servidor (no solo en la pantalla):
  - el progreso;
  - los juegos para la casa;
  - el vínculo con el curso del colegio;
  - el consentimiento social.
- **Punto de aviso en el botón:** se enciende si hay algo nuevo desde la última visita, sea una señal social o el resumen de una nueva semana con práctica. Se apaga al abrir el panel. Como también se enciende por el resumen semanal, el niño no aprende que su respuesta lo enciende.

### «La semana de…»
Lo primero del panel son 3 tarjetas con un semáforo suave, que comparan esta semana (de lunes a hoy, hora de Chile) con la anterior:

| Tarjeta | Qué muestra | Cuándo pide atención |
|---|---|---|
| 📚 Aprendizaje | Prácticas, respuestas correctas y el tema para reforzar (como dato). | Solo si acierta menos de la mitad (con 8 o más respuestas). |
| 💛 Cómo se siente | Emoción más frecuente, ánimo y cambio respecto de la semana anterior. | Solo con 2 o más registros. |
| 🤝 Con los demás | Estado de la pregunta social. | «Sin señales» solo si respondió esta semana; si no, «aún no responde». |

### Preguntas sociales semanales (niño)
Se hacen al terminar una práctica, una vez por semana y solo con consentimiento aparte. Son con caritas, opcionales y se pueden escuchar, incluido el aviso de que la familia ve las respuestas.
1. «Esta semana en el recreo estuve…»:
   - con mis amigos;
   - con algunos compañeros;
   - sin nadie, y estuve bien;
   - sin nadie, y quería estar con alguien;
   - esta semana no fui al colegio (en ese caso no se hacen las otras dos).
2. «¿Tienes en tu curso a alguien a quien contarle tus cosas?»: Sí / Más o menos / No.
3. «Esta semana, ¿alguien te molestó o te dejó fuera?»: No / Una vez / Varias veces / Prefiero no decir.

Al terminar, todos reciben un mensaje breve: «Si algún día alguien te molesta o te deja fuera, no es tu culpa: cuéntale a un adulto de confianza». Quien contó que lo molestaron, o prefirió no decirlo, recibe la versión completa.

### Señales para conversar (nunca diagnóstico)
Las reglas están en `server/src/domain/social.ts`. Solo cuentan las últimas 6 semanas, así que las señales caducan.

**Atención** (conviene conversar en los próximos días y hablar con el colegio) si:
- lo molestaron o lo dejaron fuera varias veces esta semana; o
- lo contó en 2 de sus últimas 3 respuestas (el acoso es reiterado, Ley 20.536).

**Conversar** si:
- lo molestaron una vez;
- lo contó hace poco pero no en la última respuesta;
- la misma semana estuvo sin nadie queriendo compañía y además no tiene a quién contarle;
- estuvo sin nadie queriendo compañía en 2 de sus últimas 3 respuestas; o
- no tiene a quién contarle en 2 de sus últimas 3 respuestas.

**Nota (no es señal):** prefirió no decir en varias semanas.

**Cada señal trae una guía en tú:**
- cómo abrir la conversación, incluido el ciberacoso;
- qué evitar: no castigar por lo que contó, no revictimizar, no exponerlo en el grupo de apoderados;
- cuándo y cómo ir al colegio: profesor jefe, encargado de convivencia escolar, protocolo, dejarlo por escrito y la Superintendencia de Educación;
- cuándo buscar apoyo profesional;
- **una salida urgente**, verificada en fuentes oficiales el 2026-10-26: línea de prevención del suicidio \*4141 (gratuita, 24 horas), Salud Responde 600 360 7777 (24 horas) y SAMU 131;
- otros apoyos: Fono Infancia 800 200 818 (lunes a viernes, 8:30 a 19:00, crianza de niños de hasta 9 años), Carabineros 133 y PDI 134.

### Privacidad y consentimiento
- **Consentimiento social aparte y opcional,** al crear el perfil o desde el espacio familia. Se guarda su fecha y la versión del texto (`socialConsentVersion`).
- **El niño sabe** que la familia ve sus respuestas, y se le dice también en voz alta.
- **El colegio no ve las respuestas sociales.** No existe ninguna ruta del colegio que las lea.
- **Solo se guardan las últimas 12 semanas;** lo más antiguo se borra.
- **Al desactivar se pueden borrar todas las respuestas.** El borrado es en cascada si se elimina el perfil.

### Plan gratis y Plan Familia
- **Campo `AdultUser.plan`:** todos están en «familia» durante el piloto, hasta habilitar el cobro.
- **Plan gratis:**
  - aprendizaje de la semana y estadísticas básicas;
  - **«Con los demás» completo**, porque una señal de posible acoso no puede quedar detrás de un pago;
  - una invitación al Plan Familia.
- **Plan Familia:** además, cómo se siente, temas y errores con consejos, y juegos para la casa.

## Revisión independiente
Antes de entregar, una revisora independiente (psicología infantil, convivencia escolar, ética de datos de menores) revisó las preguntas y los textos. Su informe está en `revision_independiente.md`. Se aplicaron sus 20 puntos de «Corregir» y la mayoría de los de «Mejorar».

## Pendiente
- **Ley 21.719 de datos personales** (vigente desde diciembre de 2026): revisar con una persona experta el texto del consentimiento, la conservación y el derecho a borrar, antes del despliegue en AWS.
- **Vacaciones escolares:** hoy el niño marca «no fui al colegio». Más adelante se podría no preguntar en las semanas de vacaciones del calendario escolar.
- **Resumen semanal por correo:** cuando esté AWS (requiere un servicio de envío de correos).
- **Cobro real:** Flow, Mercado Pago o Google Play. Lo decide la usuaria al subir a AWS.
