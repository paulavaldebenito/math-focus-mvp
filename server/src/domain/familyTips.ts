/**
 * Sugerencias para la familia de cómo trabajar EN CASA (sin pantalla, con
 * objetos cotidianos) cada contenido del banco — se muestran en el panel
 * familiar junto a los contenidos que al niño le cuesta más. Clave:
 * `${grade}|${name}` con el nombre en español de MathSkill. Lenguaje para
 * adultos, concreto y sin culpar; una prueba (familyTips.test.ts) exige que
 * cada habilidad sembrada tenga su sugerencia en ambos idiomas.
 */
export interface FamilyTip {
  es: string;
  en: string;
}

export const FAMILY_TIPS: Record<string, FamilyTip> = {
  // 1° básico
  "1|Adición y sustracción dentro de 20": {
    es: "Jueguen a juntar y quitar con objetos reales (porotos, bloques, fruta): «tienes 8, te doy 5, ¿cuántos hay?». Que primero lo haga con las manos y después lo diga en voz alta.",
    en: "Play at putting together and taking away with real objects (beans, blocks, fruit): “you have 8, I give you 5, how many now?”. Let them do it with their hands first, then say it out loud.",
  },
  "1|Comparar y ordenar números dentro de 20": {
    es: "Formen dos grupos de objetos y pregunten cuál tiene más o menos; luego ordenen tarjetas con números del 0 al 20 de menor a mayor, como una fila.",
    en: "Make two groups of objects and ask which has more or fewer; then put number cards from 0 to 20 in order from smallest to largest, like a line.",
  },
  "1|Contar hasta 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10": {
    es: "Cuenten en voz alta mientras suben escaleras, saltan o aplauden; luego cuenten monedas de $10 o pares de calcetines para practicar de 10 en 10 y de 2 en 2.",
    en: "Count out loud while climbing stairs, jumping or clapping; then count 10-peso coins or pairs of socks to practice counting by 10s and 2s.",
  },
  "1|Componer y descomponer números hasta 20": {
    es: "Con 10 objetos, escondan algunos bajo una taza y pregunten cuántos faltan. Busquen juntos todas las formas de armar un número (7 = 5 + 2 = 4 + 3…).",
    en: "With 10 objects, hide some under a cup and ask how many are missing. Find together all the ways to make a number (7 = 5 + 2 = 4 + 3…).",
  },
  "1|Patrones repetitivos y numéricos hasta 20": {
    es: "Armen collares, filas de cucharas o secuencias de aplausos (rojo, azul, rojo, azul…) y pídanle que diga qué sigue y por qué.",
    en: "Make bead necklaces, rows of spoons or clapping sequences (red, blue, red, blue…) and ask what comes next and why.",
  },
  "1|Figuras 3D y 2D del entorno": {
    es: "Salgan a buscar formas en la casa: una lata es un cilindro, un dado un cubo, un plato un círculo. Tracen el contorno de objetos sobre papel para ver la figura plana.",
    en: "Go on a shape hunt at home: a can is a cylinder, a die is a cube, a plate is a circle. Trace around objects on paper to see the flat shape.",
  },
  "1|Comparar la longitud de objetos: largo y corto": {
    es: "Comparen lápices, cucharas o zapatos poniéndolos uno al lado del otro desde el mismo punto de partida, y ordénenlos del más corto al más largo.",
    en: "Compare pencils, spoons or shoes by lining them up side by side from the same starting point, and order them from shortest to longest.",
  },
  "1|Leer e interpretar pictogramas": {
    es: "Hagan una encuesta familiar (fruta favorita) y dibujen una carita por cada voto en columnas. Luego pregunten: ¿cuál tiene más? ¿cuántos más?",
    en: "Take a family survey (favorite fruit) and draw one face per vote in columns. Then ask: which has the most? how many more?",
  },
  // 2° básico
  "2|Adición y sustracción dentro de 100": {
    es: "Usen atados de 10 palitos o fósforos y palitos sueltos para sumar y restar: primero las decenas, después las unidades. Pídale que explique cómo lo pensó.",
    en: "Use bundles of 10 sticks plus loose sticks to add and subtract: tens first, then ones. Ask them to explain how they thought about it.",
  },
  "2|Decenas y unidades en números hasta 100": {
    es: "Armen números con atados de 10 y unidades sueltas (34 = 3 atados y 4 sueltos). Jueguen a «¿qué número tengo?» cambiando la cantidad de atados.",
    en: "Build numbers with bundles of 10 and loose ones (34 = 3 bundles and 4 loose). Play “what number do I have?” by changing the number of bundles.",
  },
  "2|Multiplicación como suma repetida: tablas del 2, 5 y 10": {
    es: "Busquen grupos iguales en la casa: pares de zapatos (de 2 en 2), dedos de una mano (de 5 en 5), monedas de $10. Cuéntenlos como suma repetida y luego como multiplicación.",
    en: "Look for equal groups at home: pairs of shoes (by 2s), fingers on a hand (by 5s), 10-peso coins. Count them as repeated addition and then as multiplication.",
  },
  "2|Patrones numéricos: continuar y completar": {
    es: "Digan una secuencia (5, 10, 15…) y dejen que el niño la continúe; luego al revés: él inventa una y ustedes descubren la regla.",
    en: "Say a sequence (5, 10, 15…) and let your child continue it; then switch: they invent one and you find the rule.",
  },
  "2|Figuras 2D: triángulos, cuadrados, rectángulos y círculos": {
    es: "Con palitos o fideos armen figuras y cuenten lados y esquinas. Pregunten en qué se parecen y en qué se diferencian un cuadrado y un rectángulo.",
    en: "Build shapes with sticks or pasta and count sides and corners. Ask how a square and a rectangle are alike and how they are different.",
  },
  "2|Horas y medias horas en el reloj digital": {
    es: "Durante el día pregúntenle la hora en el reloj del microondas o del celular, y conecten horas con rutinas: «a las 7:30 tomamos once».",
    en: "During the day, ask them the time on the microwave or phone clock, and link times to routines: “at 7:30 we have a snack”.",
  },
  "2|Pictogramas con escala y gráficos de barra simple": {
    es: "Hagan un gráfico con votos de la familia donde cada dibujo valga 2. Pregunten cuántos representa medio dibujo y qué barra es la más alta.",
    en: "Make a chart of family votes where each picture stands for 2. Ask what half a picture stands for and which bar is tallest.",
  },
  // 3° básico
  "3|Valor posicional: unidades, decenas y centenas": {
    es: "Usen billetes y monedas de juguete de $100, $10 y $1 para armar números; pregunten cuánto vale cada dígito (en 352, el 5 vale 50).",
    en: "Use play money (100-, 10- and 1-peso) to build numbers; ask what each digit is worth (in 352, the 5 is worth 50).",
  },
  "3|Adición y sustracción hasta 1.000": {
    es: "Hagan cuentas con precios reales del supermercado. Anímenlo a estimar primero («como 300 más 200») y luego a calcular, comparando ambos resultados.",
    en: "Do sums with real supermarket prices. Encourage estimating first (“about 300 plus 200”) and then calculating, comparing both answers.",
  },
  "3|Tablas de multiplicar hasta el 10": {
    es: "Practiquen pocas tablas a la vez, con juegos cortos (dados, cartas) más que memorizando de corrido. Busquen atajos: el 4 es el doble del 2.",
    en: "Practice a few tables at a time with short games (dice, cards) rather than reciting them all. Look for shortcuts: 4 is double 2.",
  },
  "3|División como reparto y agrupación": {
    es: "Repartan galletas, cartas o porotos en partes iguales entre platos, y también armen grupos de un tamaño dado. Hablen de lo que sobra.",
    en: "Share cookies, cards or beans equally among plates, and also make groups of a given size. Talk about what is left over.",
  },
  "3|Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4": {
    es: "Doblen hojas de papel o corten una pizza o sándwich en partes iguales. Recalquen que las partes deben ser iguales y que se comparan partes de enteros del mismo tamaño.",
    en: "Fold sheets of paper or cut a pizza or sandwich into equal parts. Stress that the parts must be equal and that you compare parts of wholes of the same size.",
  },
  "3|Patrones numéricos que crecen y decrecen": {
    es: "Jueguen a «la regla secreta»: uno dice números que suben o bajan siempre igual (100, 90, 80…) y el otro adivina la regla y sigue la serie.",
    en: "Play “secret rule”: one says numbers that go up or down by the same amount (100, 90, 80…) and the other guesses the rule and continues.",
  },
  "3|Figuras 3D, sus caras y sus redes": {
    es: "Desarmen cajas de cereal o de remedios para ver su red plana, y cuenten caras, aristas y vértices antes de volver a armarlas.",
    en: "Unfold cereal or medicine boxes to see the flat net, and count faces, edges and vertices before folding them back.",
  },
  "3|Perímetro de cuadrados, rectángulos y otras figuras": {
    es: "Midan el borde de una mesa, un libro o una alfombra con una huincha o con cordel, y sumen todos los lados. Es «la vuelta completa».",
    en: "Measure around a table, a book or a rug with a tape measure or string, and add all the sides. It's “the whole way around”.",
  },
  "3|Pictogramas y gráficos de barra simple": {
    es: "Registren algo de la semana (horas de sol, frutas comidas) en un gráfico de barras en papel cuadriculado y hagan preguntas de comparación.",
    en: "Record something over the week (sunny hours, fruit eaten) on a bar graph on grid paper and ask comparison questions.",
  },
  // 4° básico
  "4|Números hasta 10.000: valor posicional, orden y descomposición": {
    es: "Lean juntos números grandes de precios o kilometrajes y descompónganlos (4.305 = 4.000 + 300 + 5). Ordenen precios de mayor a menor.",
    en: "Read big numbers together from prices or odometers and break them apart (4,305 = 4,000 + 300 + 5). Order prices from greatest to least.",
  },
  "4|Multiplicación de números de tres dígitos por uno": {
    es: "Calculen el costo de varias unidades iguales (4 paquetes de $345), separando por valor posicional: 4 × 300, 4 × 40, 4 × 5, y luego sumando.",
    en: "Work out the cost of several equal items (4 packs at 345 pesos) by place value: 4 × 300, 4 × 40, 4 × 5, then add.",
  },
  "4|División de dos dígitos por uno, con y sin resto": {
    es: "Repartan objetos reales (por ejemplo 47 porotos en 5 platos) y conversen qué significa el resto en la situación: ¿qué hacemos con lo que sobra?",
    en: "Share real objects (for example 47 beans on 5 plates) and talk about what the remainder means in the situation: what do we do with the leftovers?",
  },
  "4|Fracciones: parte de un todo, comparación y recta numérica": {
    es: "Doblen tiras de papel del mismo largo en 2, 4 y 8 partes para comparar fracciones, y marquen fracciones en una «recta» hecha con cinta en el suelo.",
    en: "Fold paper strips of the same length into 2, 4 and 8 parts to compare fractions, and mark fractions on a “number line” made with tape on the floor.",
  },
  "4|Ecuaciones e inecuaciones de un paso con suma y resta": {
    es: "Jueguen a «adivina mi número»: «pensé un número, le sumé 24 y me dio 60». Usen una balanza imaginaria: lo que se hace a un lado se hace al otro.",
    en: "Play “guess my number”: “I thought of a number, added 24 and got 60”. Use an imaginary balance: what you do to one side you do to the other.",
  },
  "4|Simetría: líneas de simetría en figuras 2D": {
    es: "Doblen papeles recortados (corazones, mariposas) y busquen dónde calzan exactamente las dos mitades. Usen un espejo sobre dibujos.",
    en: "Fold paper cut-outs (hearts, butterflies) and find where both halves match exactly. Use a mirror on drawings.",
  },
  "4|Área de rectángulos y cuadrados": {
    es: "Cubran una superficie con cuadrados iguales (post-its, galletas cuadradas) y cuenten filas por columnas; conecten con largo × ancho.",
    en: "Cover a surface with equal squares (sticky notes, square crackers) and count rows by columns; connect it to length × width.",
  },
  "4|Pictogramas y gráficos de barras con escala": {
    es: "Miren gráficos de diarios o boletas y lean juntos la escala: si cada línea vale 10, ¿cuánto marca una barra que llega a la mitad?",
    en: "Look at graphs in newspapers or bills and read the scale together: if each line is worth 10, how much is a bar that reaches halfway?",
  },
  // 5° básico
  "5|Números naturales grandes: valor posicional, comparación y aproximación": {
    es: "Busquen números grandes reales (habitantes de ciudades, distancias) y redondéenlos a la unidad de mil o de millón más cercana para compararlos.",
    en: "Find real big numbers (city populations, distances) and round them to the nearest thousand or million to compare them.",
  },
  "5|División con dividendo de tres cifras y divisor de una cifra": {
    es: "Antes de dividir, estimen el resultado («275 entre 4 es un poco menos de 70»), y después comprueben multiplicando el cociente por el divisor y sumando el resto.",
    en: "Before dividing, estimate the answer (“275 ÷ 4 is a bit less than 70”), then check by multiplying the quotient by the divisor and adding the remainder.",
  },
  "5|Fracciones propias: equivalencia y comparación": {
    es: "Con tiras de papel o una barra de chocolate, muestren que 1/2 = 2/4 = 4/8. Para comparar, ayúdenlo a llevar ambas fracciones al mismo denominador.",
    en: "With paper strips or a chocolate bar, show that 1/2 = 2/4 = 4/8. To compare, help them rewrite both fractions with the same denominator.",
  },
  "5|Ecuaciones e inecuaciones de un paso": {
    es: "Planteen acertijos cotidianos («tenía x láminas, me regalaron 8 y ahora tengo 15») y pídanle que compruebe su respuesta reemplazándola en la frase.",
    en: "Pose everyday puzzles (“I had x cards, got 8 more and now have 15”) and ask them to check their answer by putting it back into the sentence.",
  },
  "5|Plano cartesiano: coordenadas en el primer cuadrante": {
    es: "Jueguen «batalla naval» en papel cuadriculado o escondan un objeto en una cuadrícula dibujada: primero se avanza a la derecha (x), después hacia arriba (y).",
    en: "Play “Battleship” on grid paper or hide an object on a drawn grid: first move right (x), then up (y).",
  },
  "5|Perímetro y área de rectángulos": {
    es: "Midan una pieza o una mesa: el perímetro es el borde (para poner una cinta) y el área es lo de adentro (para cubrirla). Pregunten qué se necesita en cada caso.",
    en: "Measure a room or a table: perimeter is the edge (to put a ribbon around) and area is the inside (to cover it). Ask which one you need in each case.",
  },
  "5|Promedio de un conjunto de datos": {
    es: "Calculen el promedio de algo real (minutos de lectura de la semana): junten todo y repártanlo en partes iguales, como emparejar torres de bloques.",
    en: "Find the average of something real (reading minutes this week): put it all together and share it equally, like leveling towers of blocks.",
  },
  // 6° básico
  "6|Razones y proporciones": {
    es: "Cocinen juntos y agranden o achiquen una receta: si para 4 personas se usan 2 tazas, ¿cuántas para 6? Hablen de «por cada».",
    en: "Cook together and scale a recipe up or down: if 4 people need 2 cups, how many for 6? Talk about “for every”.",
  },
  "6|Porcentajes y su relación con fracciones y decimales": {
    es: "Calculen descuentos reales en ofertas (25% = 1/4 del precio) y relacionen 50% con la mitad y 10% con dividir por 10.",
    en: "Work out real sale discounts (25% = 1/4 of the price) and connect 50% with half and 10% with dividing by 10.",
  },
  "6|Adición y sustracción de fracciones y números mixtos": {
    es: "Usen tazas medidoras o una receta: sumar 1/2 taza y 1/4 de taza. Recuerden que solo se suman partes del mismo tamaño (mismo denominador).",
    en: "Use measuring cups or a recipe: add 1/2 cup and 1/4 cup. Remember you can only add parts of the same size (same denominator).",
  },
  "6|Ecuaciones de primer grado con una incógnita": {
    es: "Resuelvan acertijos con una balanza imaginaria: lo que se quita o agrega de un lado se hace también en el otro. Siempre comprueben reemplazando.",
    en: "Solve puzzles with an imaginary balance: whatever you add or remove on one side you also do on the other. Always check by substituting.",
  },
  "6|Suma de ángulos interiores de triángulos y cuadriláteros": {
    es: "Recorten un triángulo de papel, corten sus tres esquinas y júntenlas: forman una línea recta (180°). Con un cuadrilátero, forman una vuelta completa (360°).",
    en: "Cut out a paper triangle, tear off its three corners and put them together: they make a straight line (180°). With a quadrilateral, they make a full turn (360°).",
  },
  "6|Volumen de cubos y paralelepípedos": {
    es: "Llenen una caja con cubos iguales (dados, bloques) contando capas: largo × ancho da una capa, y se multiplica por la cantidad de capas.",
    en: "Fill a box with equal cubes (dice, blocks) by counting layers: length × width gives one layer, then multiply by the number of layers.",
  },
  "6|Gráficos de barra doble y circulares": {
    es: "Miren gráficos de noticias o de la cuenta de la luz y pregunten qué comparan. En un gráfico circular, conecten mitades y cuartos con 50% y 25%.",
    en: "Look at graphs in the news or on the electric bill and ask what they compare. In a pie chart, connect halves and quarters with 50% and 25%.",
  },
};

export function familyTipFor(grade: number, skillName: string): FamilyTip | null {
  return FAMILY_TIPS[`${grade}|${skillName}`] ?? null;
}
