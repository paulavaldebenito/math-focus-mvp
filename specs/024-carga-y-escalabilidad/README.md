# 024 · Pruebas de carga, desgaste y escalabilidad

**Pedido (2026-10-28):** pruebas de desgaste, estabilidad y escalabilidad con, por ejemplo, 100 mil
usuarios simulados.

## Herramientas

- **`server/prisma/carga/sembrar-volumen.ts`**: crea N familias ficticias, cada una con un hijo,
  su consentimiento y un historial de prácticas e intentos. Las cuentas son
  `carga.<i>@example.test` con la clave `carga-de-prueba-1234`. Se niega a correr en producción
  o contra la base de `server/.env`.
- **`carga/generador.mjs`**: generador propio, en Node y sin dependencias. Cada usuario virtual
  hace el recorrido real de un niño:
  1. Entra a la cuenta, abre el inicio y el mapa.
  2. Practica 6 preguntas, incluidas «detecta el error» y «encuentra el paso», con una pausa
     para pensar de unos 8 s.
  3. Cierra la práctica, mira su progreso y vuelve a empezar.

  Tiene cuatro escenarios: `humo`, `carga`, `estres` (sube por escalones hasta romperse) y
  `desgaste` (con `--pid`, vigila la memoria del servidor). No se usó k6 porque la descarga del
  binario fue rechazada por los permisos de la sesión. Se puede volver a evaluar si se autoriza.

## Modelo: ¿qué significa «100 mil usuarios»?

100 mil familias registradas no se conectan todas a la vez. En una app escolar, en la hora de
más uso se conecta entre el 2 % y el 5 % de los registrados. Eso da entre 2.000 y 5.000 niños
practicando al mismo tiempo. Como cada niño hace una petición cada 8–10 s, el servidor recibe
entre **300 y 500 peticiones por segundo**. Esa es la meta para la prueba real.

## Volumen cargado (base aislada `eureka-carga`, `prisma dev`)

| Tabla | Filas |
|---|---|
| Familias (`AdultUser`), consentimientos, niños | 100.000 cada una |
| Prácticas (`Session`) | 200.000 |
| Intentos (`Attempt`) | 60.000 (solo las primeras 5.000 familias) |

La meta eran 1,2 millones de intentos. En un solo INSERT, no terminaron en más de 8 horas.
Repartidos en tandas, la primera tanda (60 mil) tardó 6 s y la segunda quedó pegada más de
10 min. **`prisma dev` (PGlite, Postgres compilado a WebAssembly) no aguanta este volumen.** En
Postgres real (RDS), esa misma carga toma minutos. El script ya inserta por tandas.

## Resultados

### 1. Un solo usuario, sin pausas: costo de cada paso

| Ruta | p50 sin índices | p50 con índices | p95 sin índices → con índices |
|---|---|---|---|
| `GET /children/:id/home` | 172 ms | **108 ms** | 264 → 114 ms |
| `GET /children/:id/skill-path` | 159 ms | **119 ms** | 202 → 137 ms |
| `GET /children` | 181 ms | **126 ms** | — |
| `GET /children/:id/next-exercise` | 168 ms | 156 ms | 185 → 169 ms |
| `POST /children/:id/sessions` | 149 ms | 155 ms | 251 → 164 ms |
| `POST /sessions/:id/attempts` | 219 ms | 213 ms | 273 → 228 ms |
| `POST /auth/login` | 493 ms | 310 ms | — |

Los índices bajan entre 25 % y 40 % las rutas que buscan por niño o por familia, y cortan la
cola (p95). Lo que queda, unos 100–200 ms por paso, es el costo fijo de PGlite por consulta. En
Postgres real se espera que cada paso tarde decenas de milisegundos.

### 2. Estrés: punto de quiebre en el computador

| Escalón | Peticiones/s | Errores | p95 máx |
|---|---|---|---|
| 10 niños | 3,3 | 0 % | 1,6 s |
| 25 niños | 5,7 | 0 % | **4,4 s → quiebre** |

**El cuello de botella es la base, no la app.** Durante la carga, la base de prueba estuvo al
74–84 % de CPU y el servidor Node, al 0–5 %. Hay dos razones:

- PGlite atiende una sola conexión, y por eso se usa `PG_POOL_MAX=1`.
- Por lo mismo, todas las consultas de todos los niños hacen una sola fila.

Esta prueba no mide la capacidad real de la app. Solo confirma que el servidor no es el límite.

### 3. Desgaste (estabilidad y memoria)

Fueron 10 niños con pausas reales. El Mac se suspendió a mitad de la prueba, así que **solo se
midieron unos 4 minutos continuos**, más un tramo al despertar.

- 0 errores en 640 peticiones.
- Memoria del servidor: 96 MB al inicio, entre 101 y 110 MB durante la prueba y 81 MB al final.
  No crece, así que **no hay señal de fuga**. Para descartarla del todo hace falta una prueba de
  desgaste de 1 a 2 horas en AWS.

## Arreglos hechos

1. **Contraseñas con scrypt asíncrono** (`server/src/auth/password.ts`). `scryptSync` bloqueaba el
   servidor 62 ms por login, lo que limitaba todo el servidor a unos 16 logins por segundo.
   Ahora corre fuera del hilo principal. Los hashes antiguos siguen funcionando, y hay una
   prueba que lo comprueba.
2. **18 índices de claves foráneas**, en la migración `20261028120000_indices_claves_foraneas`.
   Postgres no los crea solo, y sin ellos cada consulta «las prácticas de este niño» recorre la
   tabla entera. Van en las tablas que crecen con los usuarios: prácticas, intentos, estrellas,
   ánimo, pausas, decisiones adaptativas, pistas, consentimientos, niños por familia y tablas
   de colegio.
3. **La siembra de volumen inserta por tandas**, con el avance visible.

**Verificación (2026-10-29), con `scripts/ambiente-test.sh` sobre una base nueva:** migraciones y
chequeo de drift ok; servidor 283/283, cliente 151/151, E2E 23/23.

Nota: si el Mac se suspende, los procesos largos se congelan unos 15 minutos y parecen colgados.
Hay que correrlos con `caffeinate -dims` y conectado a la corriente.

## Pendiente: la prueba real de 100 mil, en AWS

En el computador no se puede medir la capacidad real, porque no hay Docker ni Postgres
instalado, solo PGlite. Se propone:

1. **Staging en sa-east-1:** RDS Postgres (por ejemplo db.t4g.medium) y la API en Elastic
   Beanstalk, con 2 instancias. Así quedaría la producción.
2. Sembrar 100 mil familias con el historial completo (1,2 M de intentos).
3. Correr `carga/generador.mjs` desde una instancia EC2 de la misma región:
   - carga sostenida de 2.000 niños;
   - estrés hasta encontrar el quiebre;
   - desgaste de 1 a 2 horas con 500 niños, vigilando memoria, CPU y conexiones de RDS en
     CloudWatch.
4. **Metas:** p95 bajo 500 ms con 300–500 peticiones/s, menos de 0,1 % de errores y memoria
   estable.
5. **Antes de escalar a varias instancias:** los límites de intentos viven en memoria (ver
   specs/023), así que con varias instancias hay que moverlos a un almacén compartido o
   aceptarlo. Además, hay que ajustar `PG_POOL_MAX` según las conexiones de RDS.
6. Al terminar, borrar el staging para no pagarlo.

Cada paso que crea recursos en AWS necesita aprobación explícita antes de ejecutarse.
