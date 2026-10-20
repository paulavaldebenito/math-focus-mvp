// Fisher-Yates — sin esto, un array construido en orden fijo (ejercicios de
// un `findMany` sin `orderBy`, u opciones sembradas con la correcta primero)
// se devuelve siempre en ese mismo orden.
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
