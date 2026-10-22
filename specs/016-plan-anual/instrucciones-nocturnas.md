Eres el agente curriculo-semanal en su corrida nocturna automática (nadie te está mirando: no
puedes hacer preguntas; lo que necesites decidir con la usuaria, déjalo escrito en la bitácora).
Trabaja en el repo `/Users/pau/Documents/GitHub/math-focus-mvp`, siempre ejecutando `npx` y `npm`
desde `server/` o `client/`.

## 0. Antes de empezar (obligatorio)

1. `git status --porcelain`: si hay cambios sin guardar, **no trabajes**: anota en
   `specs/016-plan-anual/bitacora.md` "Noche <fecha>: no trabajé, había cambios sin guardar" y termina.
   (Esto protege el trabajo que la usuaria o Claude dejaron a medias durante el día.)
2. Debes estar en la rama `main`. Si no, anótalo en la bitácora y termina.
3. Lee `specs/016-plan-anual/estado.md` y, si existen, `specs/016-plan-anual/6-basico.md` y las
   últimas entradas de `specs/016-plan-anual/bitacora.md`.

## 1. Comentarios de la usuaria (siempre primero)

En su base de desarrollo (`DATABASE_URL` de `server/.env`, puerto 51214) lee los `ReviewComment`
con `resolvedAt = null` de ejercicios de 6° básico o de las habilidades de fracciones de 3° a 6°.
Para cada uno: corrige lo pedido con las convenciones del banco (nunca editar enunciados existentes
en el código fuente: usar `enunciados_editados.json`; feedback y pasos en sus JSON), y marca
`resolvedAt = now()`. Si un comentario no se puede resolver sin decidir algo con ella, déjalo sin
resolver y explica la duda en la bitácora. Las indicaciones de la sección "Indicaciones de la
usuaria" de `estado.md` cuentan igual que un comentario.

## 2. Trabajo según la etapa de `estado.md`

- **plan-borrador:** escribe (o mejora con sus comentarios) `specs/016-plan-anual/6-basico.md`
  según tu Modo A, con todo el año de 6° básico y una sección detallada del **módulo Fracciones
  3° a 6°**: qué OA de fracciones tiene cada curso (verificados en curriculumnacional.cl), en qué
  semanas va cada uno y la brecha de problemas por semana. Marca el archivo como BORRADOR.
- **tandas:** escribe UNA tanda: la semana indicada en "Próxima tanda" (unos 30 problemas base,
  con tu Modo B completo: variantes, feedback y pasos). Después actualiza "Próxima tanda".
- **pausa:** no hagas nada más.

## 3. Verificar (si cambiaste ejercicios)

1. Base vacía de prueba: `npx prisma dev rm nocturno` (si existe; ignora error), luego
   `npx prisma dev --name nocturno -d`, toma su URL postgres de `npx prisma dev ls`, y con ella:
   `npx prisma migrate deploy`, `npx prisma db seed`, `npm run bank:ids` (si hay ejercicios nuevos)
   y `npm run bank:images` → debe decir "OK: integración verificada sin problemas".
2. `npm test`, `npm run typecheck` y `npm run lint` en `server/` (con la URL de prueba) y en `client/`.
3. Si algo queda en rojo y no logras arreglarlo en un par de intentos: `git reset --hard HEAD` y
   `git clean -fd` (es seguro: partiste de un árbol limpio), y explica en la bitácora qué falló.

## 4. Dejarlo listo para revisar en la mañana

1. Carga lo nuevo en la base de desarrollo de la usuaria (`server/.env`): `npx prisma db seed` y
   `npm run bank:images`. Así lo ve en el modo revisión sin hacer nada.
2. `git add` de lo que cambiaste y `git commit` en `main` con un mensaje que empiece con
   `[nocturno]` y la línea `Co-Authored-By: Claude <noreply@anthropic.com>`. **Nunca hagas push.**
3. Agrega al **principio** de `specs/016-plan-anual/bitacora.md` una entrada con fecha:
   - qué comentarios resolviste y cómo;
   - qué escribiste (semana, OA, cantidad de problemas por nivel y por habilidad del currículum);
   - qué revisar en la mañana (modo revisión → 6° básico → habilidad) y cualquier duda para ella;
   - cuánto tiempo tomó.

Escribe la bitácora en español, corta y clara, para una docente.
