import type { Lang } from "./i18n.js";

/**
 * Nombre corto, para el niño, de cada habilidad del mapa y del chip de práctica (specs/017). El
 * nombre oficial (con su OA) se sigue mostrando a la familia y a los docentes. Clave: el nombre
 * oficial exacto (MathSkill.name). Sin entrada, se usa el nombre oficial.
 */
const SHORT: Record<string, { es: string; en: string }> = {
  // 1° básico
  "Contar hasta 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10": { es: "Contar hasta 100", en: "Counting to 100" },
  "Comparar y ordenar números dentro de 20": { es: "Comparar números hasta 20", en: "Comparing numbers to 20" },
  "Componer y descomponer números hasta 20": { es: "Armar y desarmar números", en: "Making and breaking numbers" },
  "Adición y sustracción dentro de 20": { es: "Sumar y restar hasta 20", en: "Adding and subtracting to 20" },
  "Patrones repetitivos y numéricos hasta 20": { es: "Patrones", en: "Patterns" },
  "Figuras 3D y 2D del entorno": { es: "Figuras y cuerpos", en: "Shapes and solids" },
  "Comparar la longitud de objetos: largo y corto": { es: "Largo y corto", en: "Long and short" },
  "Leer e interpretar pictogramas": { es: "Pictogramas", en: "Pictographs" },
  // 2° básico
  "Decenas y unidades en números hasta 100": { es: "Decenas y unidades", en: "Tens and ones" },
  "Adición y sustracción dentro de 100": { es: "Sumar y restar hasta 100", en: "Adding and subtracting to 100" },
  "Multiplicación como suma repetida: tablas del 2, 5 y 10": { es: "Tablas del 2, 5 y 10", en: "Times tables 2, 5 and 10" },
  "Patrones numéricos: continuar y completar": { es: "Patrones de números", en: "Number patterns" },
  "Figuras 2D: triángulos, cuadrados, rectángulos y círculos": { es: "Figuras planas", en: "Flat shapes" },
  "Horas y medias horas en el reloj digital": { es: "La hora", en: "Telling time" },
  "Pictogramas con escala y gráficos de barra simple": { es: "Pictogramas y gráficos", en: "Pictographs and graphs" },
  // 3° básico
  "Valor posicional: unidades, decenas y centenas": { es: "Unidades, decenas y centenas", en: "Ones, tens and hundreds" },
  "Adición y sustracción hasta 1.000": { es: "Sumar y restar hasta 1.000", en: "Adding and subtracting to 1,000" },
  "Tablas de multiplicar hasta el 10": { es: "Tablas de multiplicar", en: "Times tables" },
  "División como reparto y agrupación": { es: "Repartir y agrupar", en: "Sharing and grouping" },
  "Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4": { es: "Fracciones", en: "Fractions" },
  "Patrones numéricos que crecen y decrecen": { es: "Patrones de números", en: "Number patterns" },
  "Figuras 3D, sus caras y sus redes": { es: "Cuerpos y sus caras", en: "Solids and their faces" },
  "Perímetro de cuadrados, rectángulos y otras figuras": { es: "Perímetro", en: "Perimeter" },
  "Pictogramas y gráficos de barra simple": { es: "Pictogramas y gráficos", en: "Pictographs and graphs" },
  // 4° básico
  "Números hasta 10.000: valor posicional, orden y descomposición": { es: "Números hasta 10.000", en: "Numbers to 10,000" },
  "Multiplicación de números de tres dígitos por uno": { es: "Multiplicar", en: "Multiplying" },
  "División de dos dígitos por uno, con y sin resto": { es: "Dividir", en: "Dividing" },
  "Fracciones: parte de un todo, comparación y recta numérica": { es: "Fracciones", en: "Fractions" },
  "Ecuaciones e inecuaciones de un paso con suma y resta": { es: "Encontrar el número que falta", en: "Finding the missing number" },
  "Simetría: líneas de simetría en figuras 2D": { es: "Simetría", en: "Symmetry" },
  "Área de rectángulos y cuadrados": { es: "Área", en: "Area" },
  "Pictogramas y gráficos de barras con escala": { es: "Gráficos con escala", en: "Graphs with a scale" },
  // 5° básico
  "Números naturales grandes: valor posicional, comparación y aproximación": { es: "Números grandes", en: "Big numbers" },
  "División con dividendo de tres cifras y divisor de una cifra": { es: "Dividir", en: "Dividing" },
  "Fracciones propias: equivalencia y comparación": { es: "Fracciones equivalentes", en: "Equivalent fractions" },
  "Ecuaciones e inecuaciones de un paso": { es: "Ecuaciones", en: "Equations" },
  "Plano cartesiano: coordenadas en el primer cuadrante": { es: "Coordenadas", en: "Coordinates" },
  "Perímetro y área de rectángulos": { es: "Perímetro y área", en: "Perimeter and area" },
  "Promedio de un conjunto de datos": { es: "Promedio", en: "Average" },
  // 6° básico
  "Razones y proporciones": { es: "Razones", en: "Ratios" },
  "Porcentajes y su relación con fracciones y decimales": { es: "Porcentajes", en: "Percentages" },
  "Fracciones impropias y números mixtos": { es: "Números mixtos", en: "Mixed numbers" },
  "Adición y sustracción de fracciones y números mixtos": { es: "Sumar y restar fracciones", en: "Adding and subtracting fractions" },
  "Ecuaciones de primer grado con una incógnita": { es: "Ecuaciones", en: "Equations" },
  "Suma de ángulos interiores de triángulos y cuadriláteros": { es: "Ángulos de las figuras", en: "Angles in shapes" },
  "Volumen de cubos y paralelepípedos": { es: "Volumen", en: "Volume" },
  "Gráficos de barra doble y circulares": { es: "Gráficos", en: "Graphs" },
};

export function shortSkillName(lang: Lang, name: string, nameEn?: string | null): string {
  const s = SHORT[name];
  if (s) return s[lang];
  return lang === "en" && nameEn ? nameEn : name;
}
