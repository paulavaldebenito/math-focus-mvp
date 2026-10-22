# 014 — Paneles escolares: docente y directivos

**Fecha:** 2026-10-23 · Decisiones de la usuaria: vínculo por **código de curso** que ingresa la familia;
emociones individuales visibles para la docente **solo con un consentimiento aparte** de la familia.

## Modelo

`School` (con `staffCode`) → `SchoolStaff` (rol `director` o `teacher`, `lastPanelAt`) → `Classroom`
(curso, nivel, `joinCode`) → `ClassEnrollment` (niño en el curso, `shareEmotions`, `leftAt`) y
`TeacherNote` (notas privadas). Migración `20261023120000_colegio_cursos_y_paneles`.

- Crear un colegio deja a la cuenta como directiva; docentes se unen con `COL-XXXXX`.
- La docente crea su curso y comparte `3B-XXXXX` con las familias.
- La familia vincula desde su panel ("🏫 Su curso en el colegio"): la casilla de compartir el progreso es
  obligatoria (unirse = consentimiento); la de emociones es aparte, opcional y revocable. Un curso a la
  vez; el código debe ser del mismo nivel que el perfil (409 si no). "Desvincular" lo saca de los paneles.
- Entrada: botón "🏫 Colegio" para quien tiene rol; "🏫 Soy docente o directivo/a" antes de crear un niño.

## Panel docente (`buildTeacherDashboard`)

- **Dominio actual por OA** = últimos 10 intentos: Inicial < 50 %, En desarrollo < 80 %, Logrado ≥ 80 %;
  con menos de 3 intentos "pocos datos".
- Semana: estudiantes activos, minutos (sesiones topadas en 30 min), OA con práctica.
- **Qué hacer esta semana** (máx. 3): reenseñar un OA si ≥ 40 % de quienes lo practicaron está en Inicial
  (si no, grupo de refuerzo), estudiantes sin práctica en 7+ días, OA con 3+ reportes de rabia/nervios.
- **Mapa de calor OA × estudiante** (accesible, con % en cada celda) y clic a la ficha.
- **Dominio del curso por OA** (barra apilada por nivel) y error más común.
- **Grupos sugeridos**: estudiantes en Inicial de un OA agrupados por su error principal (máx. 5).
- **Participación y esfuerzo**: última práctica, sesiones y minutos (7 días), % con pista, % muy rápidas
  (< 3 s), juegos en casa; inactivos resaltados.
- **Clima del curso** (14 días, agregado de todos) y **para acompañar**: alertas individuales (3+ rabia/
  nervios o ánimo ≤ 2 en los últimos 3 inicios) **solo de quienes tienen `shareEmotions`**.
- **Ficha del estudiante**: dominio y tendencia por OA, errores, participación, emociones (o el aviso de
  que la familia no autorizó) y notas privadas.

## Panel directivo (`buildDirectorDashboard`)

Siempre agregado, sin nombres de estudiantes, y **ningún grupo con menos de 5 estudiantes** ("pocos
datos"). Totales (cursos, estudiantes, activos, docentes que usaron el panel), % Logrado por eje y
nivel, aciertos por nivel mes a mes (6 meses), tabla de cursos (matrícula, activos, minutos, % Logrado,
% rabia/nervios, juegos en casa, último uso del panel), cursos paralelos por OA, bienestar por nivel y
alertas (baja de aciertos ≥ 10 puntos mes a mes, ≥ 40 % rabia/nervios en un curso, < 50 % activos).

## Demostración

`npm run demo:colegio [-- correo]` (solo desarrollo): "Colegio Demo Los Aromos (ficticio)", 3° A, 3° B y
4° A con 74 estudiantes ficticios y 8 semanas de práctica simulada. Cuentas `demo.directora@…`,
`demo.profe3a@…`, `demo.profe3b@…`, `demo.profe4a@example.test`, clave `demo-colegio-1234`. Con un
correo, además lo deja como directiva del colegio demo.

## Pendiente

- Cobertura curricular contra la **planificación** de la docente (falta el modelo de planificación).
- **Equidad** (PIE/NEE, género, prioritarios): requiere datos sensibles y decisión del colegio.
- Revisión pedagógica de umbrales (`server/src/domain/schoolAnalytics.ts`) y textos.
- Antes de producción: revisar con asesoría legal el consentimiento escolar y la retención de datos.
