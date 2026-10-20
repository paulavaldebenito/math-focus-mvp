-- Marca las filas de Attempt que vienen de una ronda "detecta el error"
-- (diagnosticar una respuesta ajena ya errada) en vez de resolver el
-- ejercicio. Se excluyen del historial del motor adaptativo y de las
-- estadísticas de precisión del panel familiar — es una habilidad distinta.
ALTER TABLE "Attempt" ADD COLUMN "isSpotError" BOOLEAN NOT NULL DEFAULT false;
