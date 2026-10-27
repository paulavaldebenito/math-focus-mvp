# Video de Eureka para colegios: guion

**Duración:** de 3 a 4 minutos.
**Para:** directores, jefes de UTP y sostenedores de colegios.
**Tono:** profesional y cercano. Hablas tú, como profesora.

Ritmo: unas 130 palabras por minuto. Si una escena queda larga, se acorta el video, no la voz.

| # | Archivo | Pantalla | Duración |
|---|---|---|---|
| 1 | `eureka-hero.jpg` (imagen fija) | Portada | 15 s |
| 2 | `2-nino-practica.mp4` | Celular: el niño practica | 50 s |
| 3 | `3-panel-docente.mp4` | Computador: panel docente | 50 s |
| 4 | `4-espacio-familia.mp4` | Celular: espacio familia | 35 s |
| 5 | `5-panel-directivo.mp4` | Computador: panel directivo | 30 s |
| 6 | `eureka-logo.png` (imagen fija) | Cierre | 15 s |

---

## Escena 1 · Portada (15 s)
**En pantalla:** la ilustración de Eureka.

> «Soy profesora, y sé que en una sala de 30 niños es muy difícil saber, a tiempo, quién no está entendiendo y por qué. Por eso creamos Eureka.»

## Escena 2 · El niño practica (50 s)
**En pantalla:** Sofía entra, ve su mascota, elige Fracciones en el mapa y responde. Cuando se equivoca, aparece un mensaje y el desarrollo paso a paso.

> «Eureka es una práctica diaria de matemáticas de tres a cinco minutos, para niños de primero a sexto básico.
> Cada pregunta está alineada a un Objetivo de Aprendizaje de las Bases Curriculares, y la dificultad se ajusta sola a cada niño.
> Cuando se equivoca, no le decimos solo "incorrecto": le mostramos en qué paso se desvió y cómo se resuelve. Cada alternativa incorrecta corresponde a un error típico, y eso es lo que después ve la profesora.
> Al terminar, el niño cuenta cómo se sintió al practicar.»

## Escena 3 · Panel docente (50 s)
**En pantalla:** el curso 3° A con el mapa de calor por OA y estudiante, las acciones sugeridas y la ficha de Sofía.

> «La profesora ve a su curso por Objetivo de Aprendizaje: quién está en nivel Inicial, En desarrollo o Logrado, según sus últimos intentos.
> El panel le sugiere acciones concretas, por ejemplo volver a enseñar un OA cuando varios estudiantes están en nivel Inicial, y le dice cuál es el error más común.
> También ve quién lleva días sin practicar y, solo si la familia lo autorizó, cómo se sienten sus estudiantes al practicar.
> Y en la ficha de cada estudiante, su avance tema por tema.»

## Escena 4 · Espacio familia (35 s)
**En pantalla:** «Para la familia», el PIN, «La semana de Sofía» y la sección «Con los demás».

> «Las familias tienen su propio espacio, protegido con un PIN, dentro de la misma app.
> Ven cómo va su hijo cada semana, cómo se siente y qué temas reforzar en casa, con juegos sin pantalla.
> Además, si la familia lo autoriza, una vez por semana le preguntamos al niño cómo le fue con sus compañeros. Si aparece una señal, por ejemplo que lo dejaron fuera, la familia recibe una guía para conversar y para acudir al colegio. Esas respuestas nunca las ve el colegio: son de la familia.»

## Escena 5 · Panel directivo (30 s)
**En pantalla:** el panel del colegio con los cursos, el logro por eje, la evolución mes a mes y el bienestar.

> «El equipo directivo ve el colegio completo: cuánto se practica en cada curso, el logro por eje y su evolución mes a mes, y el clima de bienestar.
> Todo con datos agregados, para tomar decisiones pedagógicas sin exponer a ningún niño.»

## Escena 6 · Cierre (15 s)
**En pantalla:** el logo de Eureka y tus datos de contacto.

> «Eureka: práctica diaria, aprendizaje visible y familias acompañando. Nos encantaría hacer un piloto con su colegio.»

---

## Cómo armarlo en iMovie (Mac)
1. Abre iMovie, haz clic en **Crear nuevo** y elige **Película**.
2. Arrastra a la ventana los archivos de la carpeta **Escritorio › Eureka-video**: los 4 videos `.mp4` y las imágenes `eureka-hero.jpg` y `eureka-logo.png`.
3. Ponlos en la línea de tiempo en el orden del guion (1 a 6).
4. **Grabar tu voz:**
   - Ubica el cursor al inicio de la escena.
   - Haz clic en el **micrófono** (bajo el visor) y luego en el botón rojo.
   - Lee el texto de esa escena y repite con cada una.
   - Usa audífonos con micrófono, en un lugar silencioso.
5. **Ajustar los tiempos:**
   - Si la voz es más corta que el video, recorta el video arrastrando su borde.
   - Si es más larga, haz clic derecho sobre el clip, elige **Velocidad** y pon **Lento**, o duplica un tramo.
6. **Títulos (opcional):** en **Títulos**, elige uno simple y escribe, por ejemplo, «Panel docente» o «Espacio familia».
7. **Música suave (opcional):** en **Audio y video › Efectos de sonido** o con una pista libre de derechos, a volumen bajo (10–15 %).
8. **Exportar:** botón **Compartir** › **Archivo** › resolución **1080p**.

**Alternativa:** CapCut (gratis, para Mac y celular). Los pasos son los mismos: importar, ordenar, **Grabar voz** y **Exportar** en 1080p.

## Volver a grabar las escenas
Desde la carpeta del proyecto:
1. En `server/`: `npm run demo:colegio`. Recarga los datos demo; la familia de Sofía usa el PIN 2468.
2. En `e2e/`: `PW_CHANNEL=chrome npx playwright test -c playwright.video.config.ts`.
3. `bash specs/019-video-colegios/exportar.sh`. Convierte los videos a MP4 y los deja en **Escritorio › Eureka-video**.
