# Plan técnico — Fase 2: Preparación pedagógica

**Última revisión:** 2026-08-13

La mayoría de esta fase es trabajo de contenido/criterio humano, no ingeniería. Este plan cubre la
parte que sí es técnica: cómo dejar el terreno listo para que alguien con criterio pedagógico
pueda ejecutar 1–4, y cómo construir el ítem 5.

## 1. Completar OA

Sin acción técnica hasta tener la fuente MINEDUC. Cuando exista: un script de migración de datos
(no de schema) que rellene `MathSkill.oaCode` por `MathSkill.id`, con el código citado desde la
fuente oficial en el commit — no completar "a ojo" ni por inferencia de un modelo.

## 2. Auditar el banco de ejercicios

Generar un reporte legible (no solo abrir la DB) de los 24 ejercicios actuales: prompt, nivel de
dificultad, opciones y su `errorTypeId`. Un script en `server/prisma/` que exporte esto a Markdown
o CSV es suficiente — el objetivo es que un docente pueda revisar sin tocar Prisma Studio ni SQL.

## 3. Validar reglas adaptativas

`adaptiveEngine.ts` (125 líneas) ya es legible y sus reglas están en código, no ocultas — el
trabajo aquí es documentar cada regla en lenguaje no técnico junto a su `ruleCode` (para que
alguien sin leer TypeScript entienda qué dispara cada cambio de nivel) y someterlas a revisión.
Cualquier cambio de umbral que resulte de la revisión debe mantener la garantía de
`specs/001-mvp-regulado/spec.md`: determinista y auditable, cada decisión con motivo persistido.

## 4. Revisar español e inglés

Extraer todas las cadenas de `client/src/lib/i18n.ts` (218 líneas) a un formato revisable fuera de
código (hoja de cálculo o Markdown con clave/ES/EN) para que la revisión no requiera leer el
archivo fuente ni tocar TypeScript.

## 5. Consola mínima de contenido

Opción más simple compatible con lo que ya existe: extender `server/prisma/seed.ts` (que ya es
idempotente, confirmado en Fase D) a un script CLI que acepte un archivo de ejercicios en un
formato estructurado (JSON/CSV) en vez de tenerlos hardcodeados en el propio script. No requiere
UI ni autenticación nueva — es la vía mínima para que alguien edite un archivo de datos en vez de
código TypeScript. Una consola con UI real es explícitamente un paso posterior, no parte de este
mínimo.
