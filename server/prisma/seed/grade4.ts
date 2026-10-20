import { block, type ErrorIds, type SeedExercise, type SkillBlock } from "./lib.js";

// Banco de 4° básico. Los OA de cada contenido se verificaron contra
// curriculumnacional.cl (dominio vigente de curriculumnacional.mineduc.cl) el 2026-09-28:
// https://www.curriculumnacional.cl/curriculum/1o-6o-basico/matematica/4-basico/ma04-oa-XX
// Los resultados calculables se derivan con código; los distractores modelan errores reales.

type Code = "E1_OP" | "E2_RES" | "E2_CAL" | "E3_PREG" | "E3_DATO";
type Wrong = [label: string, code: Code];

/// Formato es-CL (punto de miles) y en (coma de miles).
const es = (x: number): string => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const en = (x: number): string => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const peso = (x: number): string => `$${es(x)}`;
/// Montos en pesos chilenos: en inglés se nombra la moneda ("345 pesos"), así el valor no cambia y el contexto se entiende.
const pesoEn = (x: number): string => `${en(x)} pesos`;

/// Número a partir de sus dígitos posicionales (para armar distractores de valor posicional).
const num = (um: number, c: number, d: number, u: number): number => um * 1000 + c * 100 + d * 10 + u;

/// Producto "sin llevar": error típico de reagrupación en el algoritmo de la multiplicación.
function noCarryProduct(a: number, b: number): number {
  const digits = a.toString().split("").map(Number);
  return digits.reduce((acc, d, i) => acc + ((d * b) % 10) * 10 ** (digits.length - 1 - i), 0);
}

export function grade4(errorTypeByCode: ErrorIds): SkillBlock[] {
  const mk = (
    level: 1 | 2 | 3,
    prompt: string,
    promptEn: string,
    procedureNote: string,
    procedureNoteEn: string,
    correct: string,
    wrong: Wrong[],
  ): SeedExercise => {
    const labels = [correct, ...wrong.map((w) => w[0])];
    if (wrong.length !== 3 || new Set(labels).size !== 4) {
      throw new Error(`grade4: opciones inválidas en "${prompt}"`);
    }
    return {
      prompt,
      promptEn,
      procedureNote,
      procedureNoteEn,
      difficultyLevel: level,
      visual: null,
      options: [
        { label: correct, isCorrect: true },
        ...wrong.map(([label, code]) => ({ label, isCorrect: false, errorTypeId: errorTypeByCode[code] })),
      ],
    };
  };

  const blocks: SkillBlock[] = [];

  // ===================================================================
  // 1. MA04 OA 01 — Números hasta 10.000 (Números y operaciones)
  // ===================================================================
  {
    const s = num(3, 4, 5, 2);
    blocks.push(block(
      {
        grade: 4,
        axis: "Números y operaciones",
        name: "Números hasta 10.000: valor posicional, orden y descomposición",
        axisEn: "Numbers and Operations",
        nameEn: "Numbers to 10,000: place value, ordering and expanded form",
        oaCode: "MA04 OA01",
      },
      [
        mk(1,
          "¿Qué número se forma con 3 unidades de mil, 4 centenas, 5 decenas y 2 unidades?",
          "Which number is made of 3 thousands, 4 hundreds, 5 tens and 2 ones?",
          "Escribe cada cantidad en su lugar: primero los miles, luego las centenas, las decenas y al final las unidades.",
          "Write each amount in its place: thousands first, then hundreds, tens and finally ones.",
          es(s), [
            [es(num(4, 3, 5, 2)), "E1_OP"],
            [es(num(3, 5, 4, 2)), "E2_RES"],
            [es(num(3, 4, 5, 0)), "E3_DATO"],
          ]),
        mk(1,
          "En el número 5.273, ¿cuál es el valor del dígito 7?",
          "In the number 5,273, what is the value of the digit 7?",
          "Ubica el 7 en la tabla de posiciones (mil, centena, decena, unidad) y piensa cuánto vale ese lugar.",
          "Place the 7 in the place-value chart (thousands, hundreds, tens, ones) and think how much that place is worth.",
          "70", [
            ["7", "E1_OP"],
            ["700", "E2_RES"],
            ["7.000", "E2_RES"],
          ]),
        mk(1,
          "Cuentas de 100 en 100: 2.300, 2.400, 2.500… ¿Qué número sigue?",
          "You count by 100s: 2,300, 2,400, 2,500… Which number comes next?",
          "Al contar de 100 en 100 cambia solo el dígito de las centenas; los demás se mantienen.",
          "When counting by 100s only the hundreds digit changes; the others stay the same.",
          es(2500 + 100), [
            [es(2500 + 10), "E1_OP"],
            [es(2500 + 200), "E2_CAL"],
            [es(3500), "E2_RES"],
          ]),
        mk(2,
          "¿Qué suma corresponde al número 7.086?",
          "Which sum matches the number 7,086?",
          "Cada dígito vale según su lugar. Fíjate en qué lugar está el 8 y qué lugar ocupa el 0.",
          "Each digit is worth what its place says. Notice which place the 8 is in and which place the 0 holds.",
          "7.000 + 80 + 6", [
            ["7.000 + 800 + 6", "E2_RES"],
            ["700 + 80 + 6", "E1_OP"],
            ["7.000 + 8 + 6", "E2_RES"],
          ]),
        mk(2,
          "Ordena de menor a mayor: 4.205, 4.025, 4.250, 4.052.",
          "Order from least to greatest: 4,205, 4,025, 4,250, 4,052.",
          "Todos tienen 4 unidades de mil. Compara primero las centenas, y si empatan, las decenas.",
          "All have 4 thousands. Compare the hundreds first, and if they tie, the tens.",
          "4.025, 4.052, 4.205, 4.250", [
            ["4.250, 4.205, 4.052, 4.025", "E3_PREG"],
            ["4.025, 4.052, 4.250, 4.205", "E2_RES"],
            ["4.052, 4.025, 4.205, 4.250", "E2_CAL"],
          ]),
        mk(2,
          "En una recta numérica partes en 2.000 y avanzas 3 saltos de 1.000. ¿En qué número llegas?",
          "On a number line you start at 2,000 and take 3 jumps of 1,000. Which number do you reach?",
          "Cada salto suma 1.000. Avanza de a un salto y anota dónde caes, sin contar el punto de partida como salto.",
          "Each jump adds 1,000. Move one jump at a time and note where you land, without counting the starting point as a jump.",
          es(2000 + 3 * 1000), [
            [es(2000 + 2 * 1000), "E2_CAL"],
            [es(2003), "E1_OP"],
            [es(3000), "E3_DATO"],
          ]),
        mk(3,
          "Un estadio tiene capacidad para 7.508 personas. ¿Cómo se lee esa cantidad?",
          "A stadium holds 7,508 people. How is that number read?",
          "Lee primero los miles, luego las centenas y al final las decenas y unidades. Ojo con lo que pasa con el lugar de las decenas.",
          "Read the thousands first, then the hundreds, and last the tens and ones. Watch what happens in the tens place.",
          "siete mil quinientos ocho", [
            ["siete mil quinientos ochenta", "E2_RES"],
            ["setenta y cinco mil ocho", "E1_OP"],
            ["siete mil cincuenta y ocho", "E2_RES"],
          ]),
        mk(3,
          "Diego tiene 2.450 puntos en un juego. Gana 100 puntos por cada nivel que supera y supera 3 niveles. ¿Cuántos puntos tiene ahora?",
          "Diego has 2,450 points in a game. He earns 100 points for each level he passes and he passes 3 levels. How many points does he have now?",
          "Primero averigua cuántos puntos gana en total con los 3 niveles y luego súmalos a los que ya tenía.",
          "First find how many points he earns in total from the 3 levels, then add them to the points he already had.",
          es(2450 + 3 * 100), [
            [es(2450 + 3 * 10), "E3_DATO"],
            [es(2450 + 3 * 1000), "E2_RES"],
            [es(2450 + 100), "E3_DATO"],
          ]),
        mk(3,
          "Anita arma el número más pequeño de 4 cifras con los dígitos 5, 0, 3 y 8, usando cada uno una vez. ¿Qué número arma?",
          "Anita builds the smallest 4-digit number using the digits 5, 0, 3 and 8, each once. Which number does she build?",
          "Un número de 4 cifras no puede empezar con 0. Elige el dígito más pequeño posible para cada lugar, empezando por los miles.",
          "A 4-digit number cannot start with 0. Choose the smallest possible digit for each place, starting with the thousands.",
          es(3058), [
            [es(3085), "E2_RES"],
            [es(8530), "E3_PREG"],
            [es(3508), "E2_RES"],
          ]),
      ],
    ));
  }

  // ===================================================================
  // 2. MA04 OA 05 — Multiplicación de 3 dígitos por 1 dígito
  // ===================================================================
  {
    const cs = (a: number, b: number): number => a * b;
    blocks.push(block(
      {
        grade: 4,
        axis: "Números y operaciones",
        name: "Multiplicación de números de tres dígitos por uno",
        axisEn: "Numbers and Operations",
        nameEn: "Multiplying three-digit numbers by a one-digit number",
        oaCode: "MA04 OA05",
      },
      [
        mk(1,
          "¿Cuánto es 120 × 3?",
          "What is 120 × 3?",
          "Multiplica 12 decenas por 3 y recuerda que el resultado también está en decenas.",
          "Multiply 12 tens by 3 and remember the result is also in tens.",
          es(cs(120, 3)), [
            [es(123), "E1_OP"],
            [es(cs(12, 3)), "E2_RES"],
            [es(cs(110, 3)), "E2_CAL"],
          ]),
        mk(1,
          "¿Cuánto es 212 × 3?",
          "What is 212 × 3?",
          "Multiplica por separado las centenas, las decenas y las unidades, y junta los resultados.",
          "Multiply the hundreds, the tens and the ones separately, then put the results together.",
          es(cs(212, 3)), [
            [es(212 + 3), "E1_OP"],
            [es(cs(212, 3) - 10), "E2_CAL"],
            [es(cs(200, 3) + cs(2, 3)), "E3_DATO"],
          ]),
        mk(1,
          "Sabes que 8 × 7 = 56. ¿Cuánto es 80 × 7?",
          "You know that 8 × 7 = 56. What is 80 × 7?",
          "80 es 8 decenas. Usa la tabla que ya conoces y piensa en qué lugar queda el resultado.",
          "80 is 8 tens. Use the times table you already know and think about which place the result goes in.",
          es(80 * 7), [
            [es(56), "E3_DATO"],
            [es(5600), "E2_RES"],
            [es(87), "E1_OP"],
          ]),
        mk(2,
          "¿Cuánto es 234 × 3?",
          "What is 234 × 3?",
          "Multiplica desde las unidades. Cuando un producto pasa de 9, escribe las unidades y lleva las decenas al lugar siguiente.",
          "Start with the ones. When a product goes past 9, write the ones and carry the tens to the next place.",
          es(cs(234, 3)), [
            [es(noCarryProduct(234, 3)), "E2_RES"],
            [es(234 + 3), "E1_OP"],
            [es(cs(234, 3) + 10), "E2_CAL"],
          ]),
        mk(2,
          "Sofía calcula 213 × 4 así: 200 × 4 + 10 × 4 + 3 × 4. ¿Cuál es el resultado?",
          "Sofia calculates 213 × 4 like this: 200 × 4 + 10 × 4 + 3 × 4. What is the result?",
          "Calcula cada producto por separado y luego súmalos, uno a uno.",
          "Work out each product separately and then add them up, one at a time.",
          es(200 * 4 + 10 * 4 + 3 * 4), [
            [es(200 * 4 + 10 * 4 + 2), "E2_RES"],
            [es(200 * 4 + 10 * 4 + 3), "E3_DATO"],
            [es(200 * 4 + 10 * 4 + 3 * 4 + 10), "E2_CAL"],
          ]),
        mk(2,
          "Para estimar 398 × 5, redondeas 398 a la centena más cercana. ¿Cuál es la estimación?",
          "To estimate 398 × 5, you round 398 to the nearest hundred. What is the estimate?",
          "Redondea 398 a la centena más cercana y multiplica ese número por 5. Una estimación no necesita ser exacta.",
          "Round 398 to the nearest hundred and multiply that number by 5. An estimate does not need to be exact.",
          es(400 * 5), [
            [es(500), "E2_RES"],
            [es(398 + 5), "E1_OP"],
            [es(500 * 5), "E3_DATO"],
          ]),
        mk(3,
          "Un bus recorre 157 km cada día. ¿Cuántos kilómetros recorre en 6 días?",
          "A bus travels 157 km every day. How many kilometers does it travel in 6 days?",
          "Se repite la misma distancia varios días, así que conviene multiplicar. Cuida los reagrupamientos al llevar.",
          "The same distance repeats over several days, so multiplying makes sense. Be careful with carrying.",
          `${es(cs(157, 6))} km`, [
            [`${es(noCarryProduct(157, 6))} km`, "E2_RES"],
            [`${es(157 + 6)} km`, "E1_OP"],
            [`${es(cs(157, 6) + 10)} km`, "E2_CAL"],
          ]),
        mk(3,
          `Cada paquete de galletas cuesta ${peso(345)}. ¿Cuánto cuestan 4 paquetes?`,
          `Each pack of cookies costs ${pesoEn(345)}. How much do 4 packs cost?`,
          "Descompón 345 en 300, 40 y 5, multiplica cada parte por 4 y suma los tres resultados.",
          "Break 345 into 300, 40 and 5, multiply each part by 4 and add the three results.",
          peso(cs(345, 4)), [
            [peso(300 * 4 + 40 * 4), "E3_DATO"],
            [peso(345 + 4), "E1_OP"],
            [peso(cs(345, 4) - 100), "E2_CAL"],
          ]),
        mk(3,
          `Ana compra 3 cuadernos de ${peso(950)} cada uno. ¿Cuánto paga en total?`,
          `Ana buys 3 notebooks at ${pesoEn(950)} each. How much does she pay in total?`,
          "Puedes pensar 950 como 900 más 50. Multiplica cada parte por 3 y junta los resultados.",
          "You can think of 950 as 900 plus 50. Multiply each part by 3 and put the results together.",
          peso(cs(950, 3)), [
            [peso(900 * 3), "E3_DATO"],
            [peso(950 + 3), "E1_OP"],
            [peso(cs(950, 3) - 100), "E2_CAL"],
          ]),
      ],
    ));
  }

  // ===================================================================
  // 3. MA04 OA 06 — División con dividendos de dos dígitos
  // ===================================================================
  {
    blocks.push(block(
      {
        grade: 4,
        axis: "Números y operaciones",
        name: "División de dos dígitos por uno, con y sin resto",
        axisEn: "Numbers and Operations",
        nameEn: "Dividing two-digit numbers by a one-digit number, with and without remainders",
        oaCode: "MA04 OA06",
      },
      [
        mk(1,
          "¿Cuánto es 48 ÷ 6?",
          "What is 48 ÷ 6?",
          "Piensa qué número multiplicado por 6 da 48. Recorre la tabla del 6.",
          "Think which number times 6 gives 48. Go through the 6 times table.",
          String(48 / 6), [
            [String(48 + 6), "E1_OP"],
            [String(48 / 6 - 1), "E2_CAL"],
            [String(48 / 6 + 1), "E2_CAL"],
          ]),
        mk(1,
          "Sabes que 7 × 6 = 42. ¿Cuánto es 42 ÷ 6?",
          "You know that 7 × 6 = 42. What is 42 ÷ 6?",
          "La división deshace la multiplicación: pregúntate qué número por 6 da 42.",
          "Division undoes multiplication: ask yourself which number times 6 gives 42.",
          String(42 / 6), [
            [String(42 + 6), "E1_OP"],
            [String(6), "E3_DATO"],
            [String(42 / 6 + 1), "E2_CAL"],
          ]),
        mk(1,
          "¿Cuánto es 84 ÷ 4?",
          "What is 84 ÷ 4?",
          "Descompón 84 en 80 y 4. Divide cada parte por 4 y suma los resultados.",
          "Break 84 into 80 and 4. Divide each part by 4 and add the results.",
          String(84 / 4), [
            [String(84 + 4), "E1_OP"],
            [String(80 / 4), "E3_DATO"],
            [String(84 / 4 + 1), "E2_CAL"],
          ]),
        mk(2,
          "¿Cuánto es 75 ÷ 5?",
          "What is 75 ÷ 5?",
          "Piensa en 75 como 50 más 25. Divide cada parte por 5 y junta los resultados.",
          "Think of 75 as 50 plus 25. Divide each part by 5 and put the results together.",
          String(75 / 5), [
            [String(75 + 5), "E1_OP"],
            [String(75 / 5 - 1), "E2_CAL"],
            [String(75 / 5 + 1), "E2_CAL"],
          ]),
        mk(2,
          "Al dividir 47 ÷ 5, ¿cuál es el cociente y cuál es el resto?",
          "When dividing 47 ÷ 5, what are the quotient and the remainder?",
          "Busca el número más grande que, multiplicado por 5, no se pase de 47. Lo que sobra es el resto, y debe ser menor que 5.",
          "Find the largest number that, multiplied by 5, does not go over 47. What is left is the remainder, and it must be smaller than 5.",
          `${Math.floor(47 / 5)} y resto ${47 % 5}`, [
            [`${Math.floor(47 / 5) - 1} y resto ${47 - (Math.floor(47 / 5) - 1) * 5}`, "E2_RES"],
            [`${Math.floor(47 / 5)} y resto ${47 % 5 + 1}`, "E2_CAL"],
            [`${47 % 5} y resto ${Math.floor(47 / 5)}`, "E1_OP"],
          ]),
        mk(2,
          "¿Con cuál de estas operaciones puedes comprobar que 56 ÷ 8 = 7?",
          "Which of these operations lets you check that 56 ÷ 8 = 7?",
          "Para comprobar una división, multiplica el resultado por el divisor y mira si recuperas el número que dividiste.",
          "To check a division, multiply the result by the divisor and see whether you get back the number you divided.",
          `7 × 8 = ${7 * 8}`, [
            [`56 + 8 = ${56 + 8}`, "E1_OP"],
            [`56 − 7 = ${56 - 7}`, "E1_OP"],
            [`7 × 7 = ${7 * 7}`, "E2_CAL"],
          ]),
        mk(3,
          "Un cordón de 78 cm se corta en 6 partes iguales. ¿Cuánto mide cada parte?",
          "A 78 cm cord is cut into 6 equal parts. How long is each part?",
          "Repartir en partes iguales es dividir. Descompón 78 en 60 y 18, y divide cada parte por 6.",
          "Sharing into equal parts is dividing. Break 78 into 60 and 18, and divide each part by 6.",
          `${78 / 6} cm`, [
            [`${78 + 6} cm`, "E1_OP"],
            [`${78 / 6 - 1} cm`, "E2_CAL"],
            [`${78 / 6 + 1} cm`, "E2_CAL"],
          ]),
        mk(3,
          "Repartes 50 galletas en partes iguales entre 6 amigos. ¿Cuántas galletas sobran?",
          "You share 50 cookies equally among 6 friends. How many cookies are left over?",
          "Primero averigua cuántas galletas recibe cada amigo sin pasarte de 50. Luego mira cuántas quedan sin repartir.",
          "First find how many cookies each friend gets without going over 50. Then see how many are left unshared.",
          String(50 % 6), [
            [String(Math.floor(50 / 6)), "E3_PREG"],
            [String(50 % 6 + 2), "E2_CAL"],
            [String(50 - 6), "E1_OP"],
          ]),
        mk(3,
          "Van 45 personas a un paseo y cada auto lleva 4 personas. ¿Cuántos autos se necesitan para que nadie quede sin lugar?",
          "45 people are going on a trip and each car takes 4 people. How many cars are needed so nobody is left without a seat?",
          "Divide 45 por 4 y mira qué pasa con lo que sobra: esas personas también necesitan un auto.",
          "Divide 45 by 4 and look at what is left over: those people also need a car.",
          String(Math.floor(45 / 4) + 1), [
            [String(Math.floor(45 / 4)), "E2_RES"],
            [String(45 - 4), "E1_OP"],
            [String(Math.floor(45 / 4) + 2), "E2_CAL"],
          ]),
      ],
    ));
  }

  // ===================================================================
  // 4. MA04 OA 08 — Fracciones (denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2)
  // ===================================================================
  blocks.push(block(
    {
      grade: 4,
      axis: "Números y operaciones",
      name: "Fracciones: parte de un todo, comparación y recta numérica",
      axisEn: "Numbers and Operations",
      nameEn: "Fractions: parts of a whole, comparing and the number line",
      oaCode: "MA04 OA08",
    },
    [
      mk(1,
        "Una pizza está cortada en 8 partes iguales y Camila come 3. ¿Qué fracción de la pizza comió?",
        "A pizza is cut into 8 equal parts and Camila eats 3. What fraction of the pizza did she eat?",
        "El denominador dice en cuántas partes iguales se dividió el todo; el numerador, cuántas partes tomas.",
        "The denominator tells into how many equal parts the whole was divided; the numerator, how many parts you take.",
        "3/8", [
          ["3/5", "E1_OP"],
          ["8/3", "E1_OP"],
          ["5/8", "E3_PREG"],
        ]),
      mk(1,
        "En un grupo de 10 niños, 3 usan lentes. ¿Qué fracción del grupo usa lentes?",
        "In a group of 10 children, 3 wear glasses. What fraction of the group wears glasses?",
        "El todo es el grupo completo. Pon abajo cuántos niños hay en total y arriba cuántos cumplen lo que piden.",
        "The whole is the entire group. Write the total number of children below and how many match on top.",
        "3/10", [
          ["3/7", "E1_OP"],
          ["7/10", "E3_PREG"],
          ["10/3", "E1_OP"],
        ]),
      mk(1,
        "¿Cuál de estas fracciones es la mayor?",
        "Which of these fractions is the greatest?",
        "Todas tienen 1 parte, pero el todo se corta en distinta cantidad de partes. Mientras más partes, más chicas son.",
        "All have 1 part, but the whole is cut into a different number of parts. The more parts, the smaller each one is.",
        "1/2", [
          ["1/8", "E1_OP"],
          ["1/4", "E1_OP"],
          ["1/5", "E1_OP"],
        ]),
      mk(2,
        "Ordena de menor a mayor: 1/2, 1/8, 1/4.",
        "Order from least to greatest: 1/2, 1/8, 1/4.",
        "Imagina tres barras iguales cortadas en 2, 8 y 4 partes. Compara el tamaño de una sola parte en cada una.",
        "Picture three equal bars cut into 2, 8 and 4 parts. Compare the size of a single part in each.",
        "1/8, 1/4, 1/2", [
          ["1/2, 1/4, 1/8", "E3_PREG"],
          ["1/4, 1/8, 1/2", "E2_RES"],
          ["1/8, 1/2, 1/4", "E2_CAL"],
        ]),
      mk(2,
        "Una recta numérica va de 0 a 1 y está dividida en 5 partes iguales. ¿Qué fracción marca el punto que está en el tercer salto desde el 0?",
        "A number line goes from 0 to 1 and is divided into 5 equal parts. What fraction does the point at the third jump from 0 mark?",
        "Cada salto mide una de las 5 partes iguales. Cuenta saltos desde el 0, no marcas.",
        "Each jump is one of the 5 equal parts. Count jumps from 0, not tick marks.",
        "3/5", [
          ["3/6", "E2_RES"],
          ["5/3", "E1_OP"],
          ["2/5", "E2_CAL"],
        ]),
      mk(2,
        "¿Cuál de estas fracciones es igual a 1/2?",
        "Which of these fractions is equal to 1/2?",
        "Una fracción vale 1/2 cuando la parte que tomas es la mitad del total de partes.",
        "A fraction equals 1/2 when the parts you take are half of the total number of parts.",
        "4/8", [
          ["1/4", "E1_OP"],
          ["4/4", "E2_RES"],
          ["2/8", "E2_CAL"],
        ]),
      mk(3,
        "Martina tiene 12 lápices: 5 rojos, 4 azules y 3 verdes. ¿Qué fracción de los lápices es azul?",
        "Martina has 12 pencils: 5 red, 4 blue and 3 green. What fraction of the pencils is blue?",
        "El todo son todos los lápices, no solo algunos colores. Compara los azules con el total.",
        "The whole is all the pencils, not just some colors. Compare the blue ones with the total.",
        "4/12", [
          ["4/8", "E1_OP"],
          ["8/12", "E3_PREG"],
          ["4/3", "E3_DATO"],
        ]),
      mk(3,
        "En una carrera de 100 m, Lucas ya corrió 25 m. ¿Qué fracción del recorrido ha corrido?",
        "In a 100 m race, Lucas has already run 25 m. What fraction of the course has he run?",
        "Compara lo que corrió con el largo total de la carrera. Ese total es el denominador.",
        "Compare what he ran with the total length of the race. That total is the denominator.",
        "25/100", [
          ["25/75", "E1_OP"],
          ["75/100", "E3_PREG"],
          ["100/25", "E1_OP"],
        ]),
      mk(3,
        "Ana comió 2/6 de un queque y Pedro comió 3/6 del mismo queque. ¿Quién comió más?",
        "Ana ate 2/6 of a cake and Pedro ate 3/6 of the same cake. Who ate more?",
        "Es el mismo queque, cortado en partes del mismo tamaño. Compara cuántas partes tomó cada uno.",
        "It is the same cake, cut into equal-sized parts. Compare how many parts each one took.",
        "Pedro", [
          ["Ana", "E1_OP"],
          ["Comieron lo mismo", "E1_OP"],
          ["No se puede saber", "E3_DATO"],
        ]),
    ],
  ));

  // ===================================================================
  // 5. MA04 OA 14 — Ecuaciones e inecuaciones de un paso (Patrones y álgebra)
  // ===================================================================
  blocks.push(block(
    {
      grade: 4,
      axis: "Patrones y álgebra",
      name: "Ecuaciones e inecuaciones de un paso con suma y resta",
      axisEn: "Patterns and Algebra",
      nameEn: "One-step equations and inequalities with addition and subtraction",
      oaCode: "MA04 OA14",
    },
    [
      mk(1,
        "¿Qué número completa la igualdad? □ + 25 = 60",
        "Which number completes the equation? □ + 25 = 60",
        "Usa la relación inversa: para encontrar el sumando que falta, resta al total el sumando que conoces.",
        "Use the inverse relationship: to find the missing addend, subtract the addend you know from the total.",
        String(60 - 25), [
          [String(60 + 25), "E1_OP"],
          [String(60 - 25 + 1), "E2_CAL"],
          [String(25), "E3_DATO"],
        ]),
      mk(1,
        "¿Qué número completa la igualdad? □ − 20 = 45",
        "Which number completes the equation? □ − 20 = 45",
        "Al número que buscas le quitaron 20 y quedó 45. Piensa qué operación deshace esa resta.",
        "20 was taken away from the number you are looking for and 45 was left. Think of the operation that undoes that subtraction.",
        String(45 + 20), [
          [String(45 - 20), "E1_OP"],
          [String(45 + 20 + 10), "E2_CAL"],
          [String(45), "E3_DATO"],
        ]),
      mk(1,
        "¿Cuál de estos números hace verdadera la desigualdad? □ + 10 > 30",
        "Which of these numbers makes the inequality true? □ + 10 > 30",
        "Prueba cada número: súmale 10 y mira si el resultado es mayor que 30 (no basta con que sea igual).",
        "Try each number: add 10 and check whether the result is greater than 30 (being equal is not enough).",
        "45", [
          ["20", "E2_CAL"],
          ["15", "E1_OP"],
          ["10", "E1_OP"],
        ]),
      mk(2,
        "¿Qué número completa la igualdad? □ + 37 = 82",
        "Which number completes the equation? □ + 37 = 82",
        "Resta 37 de 82. Si en las unidades no alcanza, canjea una decena.",
        "Subtract 37 from 82. If the ones are not enough, trade one ten.",
        String(82 - 37), [
          [String(82 + 37), "E1_OP"],
          ["55", "E2_RES"],
          [String(82 - 37 - 1), "E2_CAL"],
        ]),
      mk(2,
        "¿Qué número completa la igualdad? □ − 46 = 29",
        "Which number completes the equation? □ − 46 = 29",
        "Usa la relación inversa entre resta y suma: junta lo que quedó con lo que se quitó. Cuida el reagrupamiento en las unidades.",
        "Use the inverse relationship between subtraction and addition: put together what was left and what was taken away. Take care with regrouping in the ones.",
        String(29 + 46), [
          [String(46 - 29), "E1_OP"],
          ["65", "E2_RES"],
          [String(29 + 46 - 1), "E2_CAL"],
        ]),
      mk(2,
        "¿Cuál de estos números hace verdadera la desigualdad? □ + 15 < 40",
        "Which of these numbers makes the inequality true? □ + 15 < 40",
        "Prueba cada número: súmale 15 y mira si el resultado es menor que 40 (igual a 40 no sirve).",
        "Try each number: add 15 and check whether the result is less than 40 (equal to 40 does not work).",
        "20", [
          ["25", "E2_CAL"],
          ["30", "E1_OP"],
          ["55", "E1_OP"],
        ]),
      mk(3,
        "Tenía algunas figuritas. Me regalaron 24 y ahora tengo 60. ¿Cuántas figuritas tenía al principio?",
        "I had some stickers. I was given 24 and now I have 60. How many stickers did I have at the start?",
        "Lo que tenía más lo que me regalaron es igual a lo que tengo ahora. Averigua la parte que falta usando la operación inversa.",
        "What I had plus what I was given equals what I have now. Find the missing part using the inverse operation.",
        String(60 - 24), [
          [String(60 + 24), "E1_OP"],
          [String(60 - 24 - 1), "E2_CAL"],
          [String(24), "E3_PREG"],
        ]),
      mk(3,
        "En un bus iban 52 pasajeros. Bajaron algunos y quedaron 37. ¿Cuántos pasajeros bajaron?",
        "There were 52 passengers on a bus. Some got off and 37 were left. How many passengers got off?",
        "Los que iban menos los que bajaron es igual a los que quedaron. Busca el número que falta.",
        "Those who were on board minus those who got off equals those who were left. Find the missing number.",
        String(52 - 37), [
          [String(52 + 37), "E1_OP"],
          ["25", "E2_RES"],
          [String(37), "E3_PREG"],
        ]),
      mk(3,
        "Marta tenía $45, compró un helado y le quedaron $27. ¿Cuánto costó el helado?",
        "Marta had 45 pesos, bought an ice cream and had 27 pesos left. How much did the ice cream cost?",
        "Lo que tenía menos lo que costó el helado es igual a lo que le quedó. Encuentra el valor que falta con la operación inversa.",
        "What she had minus what the ice cream cost equals what she had left. Find the missing value using the inverse operation.",
        `$${45 - 27}`, [
          [`$${45 + 27}`, "E1_OP"],
          [`$${45 - 27 + 10}`, "E2_RES"],
          [`$${27}`, "E3_PREG"],
        ]),
    ],
  ));

  // ===================================================================
  // 6. MA04 OA 17 — Líneas de simetría (Geometría)
  // ===================================================================
  blocks.push(block(
    {
      grade: 4,
      axis: "Geometría",
      name: "Simetría: líneas de simetría en figuras 2D",
      axisEn: "Geometry",
      nameEn: "Symmetry: lines of symmetry in 2D shapes",
      oaCode: "MA04 OA17",
    },
    [
      mk(1,
        "¿Cuántas líneas de simetría tiene un cuadrado?",
        "How many lines of symmetry does a square have?",
        "Imagina doblar el cuadrado de modo que las dos mitades calcen justo. Prueba doblando por el medio y también por las esquinas.",
        "Imagine folding the square so both halves match exactly. Try folding through the middle and also through the corners.",
        "4", [
          ["1", "E1_OP"],
          ["2", "E2_RES"],
          ["8", "E2_CAL"],
        ]),
      mk(1,
        "¿Cuántas líneas de simetría tiene un rectángulo que no es cuadrado?",
        "How many lines of symmetry does a rectangle that is not a square have?",
        "Prueba doblar el rectángulo por el medio a lo largo y a lo ancho. Luego prueba por una esquina y mira si las mitades calzan.",
        "Try folding the rectangle in half lengthwise and widthwise. Then try folding through a corner and see whether the halves match.",
        "2", [
          ["4", "E1_OP"],
          ["1", "E2_RES"],
          ["0", "E1_OP"],
        ]),
      mk(1,
        "¿Cuál de estas letras tiene una línea de simetría vertical (de arriba hacia abajo)?",
        "Which of these letters has a vertical line of symmetry (top to bottom)?",
        "Imagina una línea vertical al medio de cada letra. La correcta se ve igual a ambos lados, como un espejo.",
        "Picture a vertical line down the middle of each letter. The right one looks the same on both sides, like a mirror.",
        "A", [
          ["F", "E1_OP"],
          ["G", "E1_OP"],
          ["R", "E1_OP"],
        ]),
      mk(2,
        "Un triángulo equilátero tiene sus 3 lados iguales. ¿Cuántas líneas de simetría tiene?",
        "An equilateral triangle has all 3 sides equal. How many lines of symmetry does it have?",
        "Prueba doblar el triángulo desde cada vértice hasta el punto medio del lado de enfrente.",
        "Try folding the triangle from each vertex to the midpoint of the opposite side.",
        "3", [
          ["1", "E1_OP"],
          ["2", "E2_CAL"],
          ["6", "E2_CAL"],
        ]),
      mk(2,
        "¿Cuál de estas figuras no tiene ninguna línea de simetría?",
        "Which of these shapes has no line of symmetry at all?",
        "Imagina doblar cada figura de todas las formas posibles. Busca la única en que las mitades nunca calzan.",
        "Imagine folding each shape every possible way. Look for the only one whose halves never match.",
        "Un paralelogramo de lados contiguos distintos y sin ángulos rectos", [
          ["Un cuadrado", "E1_OP"],
          ["Un círculo", "E1_OP"],
          ["Un triángulo isósceles", "E1_OP"],
        ]),
      mk(2,
        "El punto A está a 3 cuadritos a la izquierda de una línea de simetría. ¿A cuántos cuadritos a la derecha de la línea está su punto simétrico?",
        "Point A is 3 squares to the left of a line of symmetry. How many squares to the right of the line is its matching point?",
        "En una simetría, un punto y su reflejo quedan a la misma distancia de la línea, cada uno por su lado.",
        "With a line of symmetry, a point and its reflection are the same distance from the line, each on its own side.",
        "3", [
          ["6", "E1_OP"],
          ["0", "E3_DATO"],
          ["2", "E2_CAL"],
        ]),
      mk(3,
        "Un pentágono regular tiene 5 lados iguales y 5 ángulos iguales. ¿Cuántas líneas de simetría tiene?",
        "A regular pentagon has 5 equal sides and 5 equal angles. How many lines of symmetry does it have?",
        "Cada línea de simetría pasa por un vértice y llega al medio del lado opuesto. Cuenta cuántos vértices hay.",
        "Each line of symmetry goes through a vertex and reaches the middle of the opposite side. Count how many vertices there are.",
        "5", [
          ["10", "E2_CAL"],
          ["1", "E1_OP"],
          ["0", "E1_OP"],
        ]),
      mk(3,
        "Un artesano quiere hacer una placa con exactamente 2 líneas de simetría. ¿Qué forma le sirve?",
        "A craftsman wants to make a plaque with exactly 2 lines of symmetry. Which shape works?",
        "Cuenta las líneas de simetría de cada figura y busca la que tiene justo 2, ni más ni menos.",
        "Count the lines of symmetry of each shape and find the one with exactly 2, no more and no less.",
        "Un rectángulo que no es cuadrado", [
          ["Un cuadrado", "E1_OP"],
          ["Un triángulo equilátero", "E1_OP"],
          ["Un triángulo isósceles", "E1_OP"],
        ]),
      mk(3,
        "Se dobla una hoja cuadrada por una de sus diagonales y queda un triángulo con un ángulo recto y dos lados iguales. ¿Cuántas líneas de simetría tiene ese triángulo?",
        "A square sheet is folded along one of its diagonals, leaving a triangle with a right angle and two equal sides. How many lines of symmetry does that triangle have?",
        "Busca cómo doblar el triángulo para que las mitades calcen. Solo sirve doblar por el ángulo recto hacia el lado que tiene enfrente.",
        "Look for a way to fold the triangle so the halves match. Only a fold from the right angle to the side facing it works.",
        "1", [
          ["2", "E2_RES"],
          ["3", "E1_OP"],
          ["0", "E3_PREG"],
        ]),
    ],
  ));

  // ===================================================================
  // 7. MA04 OA 23 — Área de rectángulos y cuadrados (Medición)
  // ===================================================================
  blocks.push(block(
    {
      grade: 4,
      axis: "Medición",
      name: "Área de rectángulos y cuadrados",
      axisEn: "Measurement",
      nameEn: "Area of rectangles and squares",
      oaCode: "MA04 OA23",
    },
    [
      mk(1,
        "Un rectángulo mide 5 cm de largo y 3 cm de ancho. ¿Cuál es su área?",
        "A rectangle is 5 cm long and 3 cm wide. What is its area?",
        "El área cuenta cuántos cuadrados de 1 cm de lado caben adentro: hay filas y columnas de cuadrados.",
        "Area counts how many squares of side 1 cm fit inside: there are rows and columns of squares.",
        `${5 * 3} cm²`, [
          [`${2 * (5 + 3)} cm²`, "E3_PREG"],
          [`${5 + 3} cm²`, "E1_OP"],
          [`${5 * 3} cm`, "E2_RES"],
        ]),
      mk(1,
        "Un cuadrado tiene lados de 6 cm. ¿Cuál es su área?",
        "A square has sides of 6 cm. What is its area?",
        "En un cuadrado el largo y el ancho son iguales. Multiplica una medida por la otra y usa la unidad cuadrada.",
        "In a square the length and the width are the same. Multiply one measure by the other and use the square unit.",
        `${6 * 6} cm²`, [
          [`${4 * 6} cm²`, "E3_PREG"],
          [`${6 + 6} cm²`, "E1_OP"],
          [`${6 * 6 + 10} cm²`, "E2_CAL"],
        ]),
      mk(1,
        "¿Qué unidad conviene más para medir el área del piso de una sala de clases?",
        "Which unit is most convenient for measuring the area of a classroom floor?",
        "El piso de una sala es una superficie grande. Elige una unidad cuadrada, y de un tamaño que no te obligue a usar números enormes.",
        "A classroom floor is a big surface. Choose a square unit, and a size that does not force you to use huge numbers.",
        "m²", [
          ["m", "E1_OP"],
          ["cm", "E1_OP"],
          ["cm²", "E2_RES"],
        ]),
      mk(2,
        "Un patio rectangular mide 8 m de largo y 5 m de ancho. ¿Cuál es su área?",
        "A rectangular yard is 8 m long and 5 m wide. What is its area?",
        "Multiplica el largo por el ancho y escribe el resultado en metros cuadrados.",
        "Multiply the length by the width and write the result in square meters.",
        `${8 * 5} m²`, [
          [`${2 * (8 + 5)} m²`, "E3_PREG"],
          [`${8 + 5} m²`, "E1_OP"],
          [`${8 * 5} m`, "E2_RES"],
        ]),
      mk(2,
        "Un rectángulo tiene un área de 24 cm² y su largo mide 6 cm. ¿Cuánto mide su ancho?",
        "A rectangle has an area of 24 cm² and its length is 6 cm. How wide is it?",
        "El área es largo por ancho. Piensa qué número multiplicado por 6 da 24.",
        "Area is length times width. Think which number times 6 gives 24.",
        `${24 / 6} cm`, [
          [`${24 * 6} cm`, "E1_OP"],
          [`${24 - 6} cm`, "E1_OP"],
          [`${24 / 6 + 1} cm`, "E2_CAL"],
        ]),
      mk(2,
        "¿Cuál de estos rectángulos tiene un área de 12 cm²?",
        "Which of these rectangles has an area of 12 cm²?",
        "Multiplica las dos medidas de cada opción y compara con el área que buscas.",
        "Multiply the two measures of each option and compare with the area you are looking for.",
        "3 cm por 4 cm", [
          ["5 cm por 7 cm", "E1_OP"],
          ["2 cm por 5 cm", "E2_CAL"],
          ["3 cm por 3 cm", "E2_CAL"],
        ]),
      mk(3,
        "Una pared rectangular mide 4 m de largo y 3 m de alto y se va a pintar completa. ¿Cuántos metros cuadrados hay que pintar?",
        "A rectangular wall is 4 m long and 3 m high and will be painted completely. How many square meters need painting?",
        "Pintar toda la superficie pide el área, no el contorno. Multiplica las dos medidas.",
        "Painting the whole surface calls for the area, not the border. Multiply the two measures.",
        `${4 * 3} m²`, [
          [`${2 * (4 + 3)} m²`, "E3_PREG"],
          [`${4 + 3} m²`, "E1_OP"],
          [`${4 * 3} m`, "E2_RES"],
        ]),
      mk(3,
        "Un jardín cuadrado tiene lados de 9 m y se planta pasto en todo el jardín. ¿Cuántos metros cuadrados de pasto se necesitan?",
        "A square garden has sides of 9 m and grass is planted over the whole garden. How many square meters of grass are needed?",
        "Se cubre toda la superficie, así que busca el área. En un cuadrado, multiplica el lado por sí mismo.",
        "The whole surface is covered, so look for the area. In a square, multiply the side by itself.",
        `${9 * 9} m²`, [
          [`${4 * 9} m²`, "E3_PREG"],
          [`${9 + 9} m²`, "E1_OP"],
          [`${9 * 9 + 10} m²`, "E2_CAL"],
        ]),
      mk(3,
        "¿Cuál de estas parejas de rectángulos tiene la misma área?",
        "Which of these pairs of rectangles has the same area?",
        "Calcula el área de cada rectángulo de la pareja y compara. Ojo: figuras con el mismo contorno pueden tener áreas distintas.",
        "Work out the area of each rectangle in the pair and compare. Careful: shapes with the same border length can have different areas.",
        "2 cm × 6 cm y 3 cm × 4 cm", [
          ["4 cm × 4 cm y 2 cm × 6 cm", "E3_PREG"],
          ["2 cm × 6 cm y 3 cm × 5 cm", "E2_CAL"],
          ["2 cm × 5 cm y 3 cm × 4 cm", "E2_CAL"],
        ]),
    ],
  ));

  // ===================================================================
  // 8. MA04 OA 27 — Pictogramas y gráficos de barras con escala (Datos)
  // ===================================================================
  blocks.push(block(
    {
      grade: 4,
      axis: "Datos y probabilidades",
      name: "Pictogramas y gráficos de barras con escala",
      axisEn: "Data and Probability",
      nameEn: "Pictographs and scaled bar graphs",
      oaCode: "MA04 OA27",
    },
    [
      mk(1,
        "En un pictograma, cada símbolo vale 5 puntos. El equipo Rojo tiene 4 símbolos. ¿Cuántos puntos tiene?",
        "In a pictograph, each symbol stands for 5 points. The Red team has 4 symbols. How many points does it have?",
        "Lee primero la escala: cuánto vale cada símbolo. Luego multiplica por la cantidad de símbolos.",
        "Read the scale first: how many each symbol stands for. Then multiply by the number of symbols.",
        String(5 * 4), [
          ["4", "E3_DATO"],
          ["9", "E1_OP"],
          [String(5 * 4 + 5), "E2_CAL"],
        ]),
      mk(1,
        "En un gráfico de barras la escala sube de 10 en 10 desde el 0. La barra de los gatos llega a la tercera línea después del 0. ¿Cuántos gatos hay?",
        "In a bar graph the scale goes up by 10s from 0. The cats' bar reaches the third line after 0. How many cats are there?",
        "Cada línea del gráfico vale lo que dice la escala. Cuenta las líneas que sube la barra y lee cuánto valen.",
        "Each line on the graph stands for what the scale says. Count how many lines the bar goes up and read what they stand for.",
        String(3 * 10), [
          ["3", "E3_DATO"],
          ["13", "E1_OP"],
          [String(4 * 10), "E2_CAL"],
        ]),
      mk(1,
        "Un gráfico de barras muestra votos: Rojo 12, Azul 18 y Verde 9. ¿Qué color tiene la barra más alta?",
        "A bar graph shows votes: Red 12, Blue 18 and Green 9. Which color has the tallest bar?",
        "La barra más alta es la que tiene el valor mayor. Compara los tres números.",
        "The tallest bar is the one with the greatest value. Compare the three numbers.",
        "Azul", [
          ["Rojo", "E2_CAL"],
          ["Verde", "E3_PREG"],
          ["Ninguno, las barras son iguales", "E1_OP"],
        ]),
      mk(2,
        "Un gráfico de barras muestra los votos: Rojo 12, Azul 18 y Verde 9. ¿Cuántos votos hubo en total?",
        "A bar graph shows the votes: Red 12, Blue 18 and Green 9. How many votes were there in total?",
        "El total incluye todas las barras, no solo algunas. Suma los tres valores.",
        "The total includes all the bars, not just some. Add the three values.",
        String(12 + 18 + 9), [
          [String(12 + 18), "E3_DATO"],
          [String(18), "E3_PREG"],
          [String(12 + 18 + 9 + 10), "E2_CAL"],
        ]),
      mk(2,
        "En el gráfico de votos, Azul tiene 18 y Verde tiene 9. ¿Cuántos votos más tiene Azul que Verde?",
        "In the vote graph, Blue has 18 and Green has 9. How many more votes does Blue have than Green?",
        "\"Cuántos más\" pide comparar dos cantidades: mira qué operación te dice la diferencia entre ellas.",
        "\"How many more\" asks you to compare two amounts: think which operation gives the difference between them.",
        String(18 - 9), [
          [String(18 + 9), "E1_OP"],
          [String(18), "E3_DATO"],
          [String(18 - 9 + 1), "E2_CAL"],
        ]),
      mk(2,
        "En un pictograma cada símbolo vale 10 libros. El martes hay 2 símbolos y medio. ¿Cuántos libros se prestaron el martes?",
        "In a pictograph each symbol stands for 10 books. On Tuesday there are 2 and a half symbols. How many books were borrowed on Tuesday?",
        "Un símbolo entero vale 10; medio símbolo vale la mitad. Suma lo que valen los símbolos enteros y el medio símbolo.",
        "A whole symbol stands for 10; half a symbol stands for half. Add what the whole symbols and the half symbol stand for.",
        String(2 * 10 + 5), [
          [String(2 * 10), "E2_RES"],
          [String(3 * 10), "E2_CAL"],
          [String(2 + 10), "E1_OP"],
        ]),
      mk(3,
        "La biblioteca tuvo 15 visitas el lunes, 25 el martes y 20 el miércoles. ¿Cuál es la diferencia entre el día con más visitas y el día con menos visitas?",
        "The library had 15 visits on Monday, 25 on Tuesday and 20 on Wednesday. What is the difference between the day with the most visits and the day with the fewest?",
        "Primero busca el mayor y el menor de los tres valores. Luego compara solo esos dos.",
        "First find the greatest and the least of the three values. Then compare only those two.",
        String(25 - 15), [
          [String(15 + 25 + 20), "E1_OP"],
          [String(25), "E3_PREG"],
          [String(25 - 20), "E3_DATO"],
        ]),
      mk(3,
        "En un gráfico de barras con escala de 20 en 20, la barra de María llega justo a la mitad entre 40 y 60 y la de Juan llega a 80. ¿Cuántos puntos más tiene Juan?",
        "In a bar graph with a scale of 20s, María's bar reaches exactly halfway between 40 and 60 and Juan's reaches 80. How many more points does Juan have?",
        "Primero lee cuánto vale la barra de María: está justo entre dos líneas. Luego compara con la de Juan.",
        "First read the value of María's bar: it sits exactly between two lines. Then compare with Juan's.",
        String(80 - (40 + 60) / 2), [
          [String(80 + (40 + 60) / 2), "E1_OP"],
          [String(80 - 60), "E2_RES"],
          [String(80 - 40), "E2_CAL"],
        ]),
      mk(3,
        "En un pictograma cada símbolo vale 6 helados. El lunes hay 3 símbolos y el martes 5. ¿Cuántos helados se vendieron entre los dos días?",
        "In a pictograph each symbol stands for 6 ice creams. On Monday there are 3 symbols and on Tuesday 5. How many ice creams were sold over the two days?",
        "Cuenta los símbolos de los dos días y multiplica por lo que vale cada símbolo.",
        "Count the symbols for both days and multiply by what each symbol stands for.",
        String((3 + 5) * 6), [
          [String(3 + 5), "E3_DATO"],
          [String(5 * 6), "E3_DATO"],
          [String((3 + 5) * 6 - 6), "E2_CAL"],
        ]),
    ],
  ));

  return blocks;
}
