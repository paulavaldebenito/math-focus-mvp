# «Cómo funciona Eureka»: video de 1:30

Un solo video (1920×1080, unos 92 s) que recorre la app de punta a punta: intereses, pausa de
respiración, una pregunta con su respuesta y retroalimentación, una respuesta correcta, pausa de
movimiento, cierre del niño, espacio familia, panel docente y panel directivo. Cada corte lleva su
título en pantalla, así que también se entiende sin voz.

## Cómo se genera

```bash
cd server && npm run demo:colegio          # datos demo limpios (las tomas agregan práctica)
cd ../e2e && PW_CHANNEL=chrome npx playwright test -c playwright.video.config.ts demo/video-como-funciona.spec.ts
cd .. && python3 specs/019-video-colegios/montar.py   # → ~/Desktop/Eureka-video/eureka-como-funciona.mp4
```

- Las tomas de celular se graban en el proyecto `celular-hd`: un celular de 390 px dibujado al doble
  con zoom, porque Playwright graba en píxeles CSS y si no el texto queda borroso.
- Cada toma deja un `marcas.json` con el segundo en que empieza cada momento. `montar.py` corta por
  esas marcas. Para la retroalimentación toma la primera pregunta respondida con error, y para
  «aprende con lo que le gusta» la primera respondida bien.
- Para cambiar un título, un texto o la duración de un corte, se edita `CUTS` en `montar.py` y se
  vuelve a montar. No hace falta grabar de nuevo.

## Guion de voz (unas 210 palabras, ritmo tranquilo)

| Tiempo | En pantalla | Voz |
|---|---|---|
| 0:00 | Portada | Esto es Eureka: práctica diaria de matemáticas de primero a sexto básico. |
| 0:03 | Elige sus intereses | Cada niño elige lo que le gusta, y los problemas hablan de eso. |
| 0:08 | Pausa de respiración | Antes de empezar, puede hacer una pausa breve de respiración para llegar con calma. |
| 0:17 | Pregunta, respuesta y retroalimentación | Lee la pregunta, la puede escuchar y responde. Si se equivoca, Eureka le muestra qué pasó y cómo se resuelve paso a paso. Cada alternativa incorrecta corresponde a un error típico, así que la ayuda apunta justo a ese error. |
| 0:31 | Aprende con lo que le gusta | Cuando acierta, se celebra, y la dificultad se ajusta a su ritmo. |
| 0:41 | Pausa de movimiento | Durante la práctica también hay pausas de movimiento, con desafíos matemáticos para el cuerpo. |
| 0:50 | Cierra contando cómo le fue | Al terminar cuenta cómo se sintió y qué le costó. |
| 0:54 | Espacio familia, con PIN | La familia entra con un PIN y ve su semana: qué aprendió, cómo se ha sentido y, si aparece, una señal temprana para conversar, con orientaciones concretas. |
| 1:05 | Panel docente | La profesora ve el nivel de logro por OA y por estudiante, y qué hacer esta semana… |
| 1:13 | Ficha de cada estudiante | …y en la ficha de cada estudiante, su participación y sus errores más frecuentes. |
| 1:18 | Panel directivo | El equipo directivo ve el logro por eje y curso, los cursos paralelos y el bienestar, siempre en datos agregados y sin rankings. |
| 1:27 | Cierre | Eureka: cada niño practica a su ritmo, la profesora sabe qué reforzar y la familia acompaña. |

Para grabar la voz, en iMovie o CapCut se importa `eureka-como-funciona.mp4` y se graba la narración
encima con «Voz en off», usando la tabla como guía de tiempos. Si hace falta, también se puede
agregar música suave a bajo volumen.
