# Spec — Fase 1: Robustez técnica

**Estado:** en curso · **Última revisión:** 2026-08-13

## Objetivo

Llevar el MVP (`specs/001-mvp-regulado/`) de "funciona en mi máquina, probado a mano" a "seguro
para operar sin supervisión constante". Fase 1 no agrega funcionalidad pedagógica nueva — endurece
lo que ya existe.

## Alcance

1. **CI** — lint, typecheck y tests corren automáticamente en cada push/PR; nada llega a `main`
   con la suite rota.
2. **Pruebas E2E** — cobertura del recorrido completo (registro → consentimiento → perfil →
   evaluación inicial → sesión de práctica → panel familiar) tal como lo usaría un adulto real,
   más allá de lo que cubren los tests de integración por endpoint.
3. **Migraciones automatizadas** — todo cambio de schema pasa por una migración committeada y
   aplicada en CI, no por `db push` manual (extiende el fix de H1 en `specs/001-mvp-regulado/`).
4. **Seguridad de sesiones** — auditoría de la cookie httpOnly propia: flags (`Secure`,
   `SameSite`), expiración, rotación en login, invalidación en logout, resistencia a fijación de
   sesión.
5. **Control de acceso** — todo endpoint que toca datos de un niño verifica que el
   `ChildProfile.adultUserId` pertenece al adulto de la sesión, no solo que la sesión sea válida
   (evita que un adulto autenticado acceda a datos de hijos de otro adulto por IDOR).
6. **Errores y reintentos** — respuestas de error consistentes desde el servidor, y en el cliente:
   qué pasa si `fetch` falla a media sesión de práctica (¿se pierde el intento? ¿se reintenta?).

## Fuera de alcance

- Contenido pedagógico nuevo (eso es Fase 2, `specs/003-fase2-preparacion-pedagogica/`).
- Infraestructura de despliegue a producción (dominios, hosting, monitoreo) — no está definida
  todavía dónde vivirá el MVP fuera de entornos locales.

## Principios que aplican aquí

Los mismos de `specs/001-mvp-regulado/spec.md`: nada de esto puede debilitar el requisito de
consentimiento explícito, ni introducir tracking o exposición de datos infantiles más allá de lo
ya modelado.

## Cómo se prioriza dentro de la fase

Orden sugerido por dependencia y riesgo, no necesariamente el orden en que se ejecuten:

1. CI primero — da red de seguridad para todo lo que sigue.
2. Migraciones automatizadas — CI ya las ejercita (`prisma migrate deploy` en el job de servidor).
3. Control de acceso y seguridad de sesiones — mismo dominio (auth), conviene auditarlos juntos.
4. Errores y reintentos.
5. E2E al final — cubre el recorrido ya endurecido por los puntos anteriores.
