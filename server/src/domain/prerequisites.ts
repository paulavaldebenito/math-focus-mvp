/**
 * Prerrequisitos entre cursos del eje Números y operaciones (specs/020-ubicacion-adaptativa).
 *
 * Cada habilidad (por su código OA) apunta a las habilidades de las que depende directamente,
 * del mismo curso o de cursos anteriores. Con esto la evaluación de ubicación baja por la cadena
 * hasta encontrar lo que el niño domina, y el repaso sube de vuelta hasta su curso. Ejemplo: a un
 * niño de 5° que no sabe las tablas, la división de 5° lo lleva a la división de 4°, al reparto
 * de 3°, a las tablas de 3° y, si hace falta, a las tablas del 2, 5 y 10 de 2°.
 *
 * Solo enlaces directos (los indirectos salen de recorrer el grafo). Cada enlace lleva su porqué,
 * según la progresión de las Bases Curriculares de Matemática (MINEDUC). Lo revisa un agente
 * pedagógico (specs/020-ubicacion-adaptativa/revision_prerrequisitos.md), contra las Bases
 * Curriculares 2012; sus correcciones ya están aplicadas.
 */
export const NUMBERS_AXIS = "Números y operaciones";

export interface Prerequisite {
  oa: string;
  why: string;
}

export const PREREQUISITES: Readonly<Record<string, readonly Prerequisite[]>> = {
  // 1° básico
  "MA01 OA01": [],
  "MA01 OA04": [{ oa: "MA01 OA01", why: "Para comparar y ordenar hasta 20 hay que conocer la secuencia numérica." }],
  "MA01 OA06": [{ oa: "MA01 OA01", why: "Componer y descomponer hasta 20 se apoya en contar." }],
  "MA01 OA09": [{ oa: "MA01 OA06", why: "Sumar y restar hasta 20 usa la composición y descomposición (p. ej., 8 + 5 = 8 + 2 + 3)." }],
  // 2° básico
  "MA02 OA07": [
    { oa: "MA01 OA01", why: "Contar de 10 en 10 es la base de las decenas." },
    { oa: "MA01 OA06", why: "Agrupar en decenas y unidades extiende la composición de números hasta 20." },
  ],
  "MA02 OA09": [
    { oa: "MA01 OA09", why: "Las estrategias de suma y resta hasta 20 se extienden hasta 100." },
    { oa: "MA02 OA07", why: "Sumar y restar hasta 100 requiere el valor posicional de decenas y unidades." },
  ],
  "MA02 OA11": [
    { oa: "MA01 OA01", why: "Las tablas del 2, 5 y 10 parten del conteo de 2 en 2, de 5 en 5 y de 10 en 10." },
    { oa: "MA02 OA09", why: "La multiplicación se introduce como suma repetida." },
  ],
  // 3° básico
  "MA03 OA05": [{ oa: "MA02 OA07", why: "El valor posicional hasta 1.000 amplía decenas y unidades a centenas." }],
  "MA03 OA06": [
    { oa: "MA02 OA09", why: "Las estrategias de suma y resta hasta 100 se extienden hasta 1.000." },
    { oa: "MA03 OA05", why: "Sumar y restar hasta 1.000 requiere el valor posicional hasta las centenas." },
  ],
  "MA03 OA08": [{ oa: "MA02 OA11", why: "Las tablas hasta el 10 amplían las tablas del 2, 5 y 10." }],
  "MA03 OA09": [{ oa: "MA03 OA08", why: "Dividir es la operación inversa de multiplicar: se apoya en las tablas." }],
  // Revisión: la fracción de 3° es «parte de un todo» (no reparto con tablas); comparar fracciones
  // con material concreto se apoya en comparar cantidades.
  "MA03 OA11": [{ oa: "MA01 OA04", why: "Comparar fracciones de uso común se apoya en comparar y ordenar cantidades." }],
  // 4° básico
  "MA04 OA01": [{ oa: "MA03 OA05", why: "Los números hasta 10.000 amplían el valor posicional hasta 1.000." }],
  "MA04 OA05": [
    { oa: "MA03 OA08", why: "Multiplicar números de tres dígitos por uno usa las tablas hasta el 10." },
    { oa: "MA03 OA05", why: "Se multiplica descomponiendo en centenas, decenas y unidades." },
    { oa: "MA03 OA06", why: "El algoritmo de la multiplicación «lleva»: suma con reserva." },
  ],
  "MA04 OA06": [
    { oa: "MA03 OA09", why: "La división de dos dígitos por uno amplía la división como reparto y agrupación." },
    { oa: "MA03 OA08", why: "Dividir con y sin resto requiere las tablas hasta el 10." },
  ],
  "MA04 OA08": [{ oa: "MA03 OA11", why: "Comparar fracciones y ubicarlas en la recta amplía las fracciones de uso común." }],
  // 5° básico
  "MA05 OA01": [{ oa: "MA04 OA01", why: "Los números naturales grandes amplían el valor posicional hasta 10.000." }],
  "MA05 OA04": [
    { oa: "MA04 OA06", why: "Dividir números de tres cifras amplía la división de dos dígitos por uno." },
    { oa: "MA04 OA05", why: "La multiplicación es la operación inversa con que se comprueba la división." },
  ],
  "MA05 OA07": [
    { oa: "MA04 OA08", why: "La equivalencia y comparación de fracciones propias amplía la comparación de 4°." },
    { oa: "MA03 OA08", why: "Las fracciones equivalentes se obtienen multiplicando o dividiendo numerador y denominador." },
  ],
  // 6° básico
  "MA06 OA03": [
    { oa: "MA05 OA07", why: "Las razones se expresan y comparan como fracciones equivalentes." },
    { oa: "MA05 OA04", why: "Encontrar el valor que falta en una razón divide fuera de las tablas (p. ej., 250 ÷ 5)." },
  ],
  "MA06 OA04": [
    { oa: "MA05 OA07", why: "Un porcentaje es una fracción equivalente de denominador 100." },
    { oa: "MA06 OA03", why: "Un porcentaje es una razón de consecuente 100." },
  ],
  "MA06 OA05": [
    { oa: "MA05 OA07", why: "Pasar de fracción impropia a número mixto usa la fracción como parte de un todo y que n/n = 1." },
    { oa: "MA05 OA04", why: "Convertir una fracción impropia en número mixto es una división con resto." },
  ],
  "MA06 OA06": [
    { oa: "MA06 OA05", why: "Sumar y restar números mixtos requiere convertirlos." },
    { oa: "MA05 OA07", why: "Sumar fracciones de distinto denominador requiere amplificarlas a uno común." },
  ],
};
