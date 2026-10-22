/**
 * Juegos para la casa (specs/013): uno por cada habilidad del banco, para
 * que la familia practique SIN pantalla y como juego los temas que más le
 * cuestan al niño. Cada juego trae emoji, nombre, minutos, materiales que hay
 * en cualquier casa y 3 pasos cortos. Reemplaza a las sugerencias de una
 * línea que había antes (familyTips.ts, misma idea de cada una, ahora como juego). Clave:
 * `${grade}|${name}` con el nombre en español de MathSkill; una prueba
 * (prisma/seed/__tests__/homeGames.test.ts) exige uno por habilidad sembrada.
 */
export interface Bilingual {
  es: string;
  en: string;
}

export interface HomeGame {
  emoji: string;
  name: Bilingual;
  minutes: number;
  materials: Bilingual;
  steps: { es: [string, string, string]; en: [string, string, string] };
}

const g = (
  emoji: string,
  name: [string, string],
  minutes: number,
  materials: [string, string],
  es: [string, string, string],
  en: [string, string, string],
): HomeGame => ({ emoji, name: { es: name[0], en: name[1] }, minutes, materials: { es: materials[0], en: materials[1] }, steps: { es, en } });

export const HOME_GAMES: Record<string, HomeGame> = {
  // 1° básico
  "1|Adición y sustracción dentro de 20": g("🫘", ["La tiendita de porotos", "The bean shop"], 10, ["Porotos, botones o fideos y dos platos", "Beans, buttons or pasta and two plates"],
    ["Pon algunos porotos en cada plato y pregunta cuántos hay si los juntamos.", "Quita unos pocos y pregunta cuántos quedan. Que lo haga primero con las manos.", "Cambien de rol: ahora tu hijo/a inventa la pregunta y tú respondes (a veces equivócate a propósito para que te corrija)."],
    ["Put some beans on each plate and ask how many there are if we put them together.", "Take a few away and ask how many are left. Let them use their hands first.", "Switch roles: your child makes up the question and you answer (sometimes get it wrong on purpose so they can correct you)."]),
  "1|Comparar y ordenar números dentro de 20": g("🃏", ["¿Quién tiene más?", "Who has more?"], 10, ["Tarjetas o papelitos con números del 0 al 20", "Cards or slips of paper numbered 0 to 20"],
    ["Cada uno saca una tarjeta: gana quien tenga el número mayor (y una ronda, el menor).", "Antes de decidir, armen cada número con objetos para ver cuál tiene más.", "Al final, ordenen todas las tarjetas como una fila, del más chico al más grande."],
    ["Each of you draws a card: the bigger number wins (and in one round, the smaller one).", "Before deciding, build each number with objects to see which has more.", "At the end, line up all the cards from smallest to biggest."]),
  "1|Contar hasta 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10": g("🪜", ["Saltos contados", "Counting jumps"], 5, ["Una escalera, un pasillo o espacio para saltar", "Stairs, a hallway or space to jump"],
    ["Cuenten en voz alta cada escalón o salto, de 1 en 1.", "Ahora digan solo los números «saltados»: 2, 4, 6… o 10, 20, 30…", "Cierren contando pares de calcetines de 2 en 2 o monedas de $10 de 10 en 10."],
    ["Count out loud each step or jump, by 1s.", "Now say only the “skip” numbers: 2, 4, 6… or 10, 20, 30…", "Finish by counting pairs of socks by 2s or 10-peso coins by 10s."]),
  "1|Componer y descomponer números hasta 20": g("🥤", ["¿Cuántos se esconden?", "How many are hiding?"], 10, ["10 objetos chicos y una taza", "10 small objects and a cup"],
    ["Muestren 7 objetos y, sin que mire, esconde algunos bajo la taza.", "Pregunta: «se ven 4, ¿cuántos se esconden?». Levanten la taza para comprobar.", "Busquen juntos todas las formas de armar el número: 7 = 5 + 2 = 4 + 3…"],
    ["Show 7 objects and, without them looking, hide some under the cup.", "Ask: “I can see 4, how many are hiding?”. Lift the cup to check.", "Find together all the ways to make the number: 7 = 5 + 2 = 4 + 3…"]),
  "1|Patrones repetitivos y numéricos hasta 20": g("👏", ["El patrón loco", "The silly pattern"], 5, ["Cucharas, tapas de colores o solo las manos", "Spoons, colored lids or just your hands"],
    ["Armen una fila que se repite: tapa roja, azul, roja, azul…", "Pregunta qué sigue y por qué. Luego hagan el patrón con aplausos y saltos.", "Tu hijo/a inventa un patrón y tú lo continúas."],
    ["Make a repeating row: red lid, blue, red, blue…", "Ask what comes next and why. Then do the pattern with claps and jumps.", "Your child makes up a pattern and you continue it."]),
  "1|Figuras 3D y 2D del entorno": g("🔍", ["Detectives de formas", "Shape detectives"], 10, ["Objetos de la casa (latas, cajas, dados, platos), papel y lápiz", "Things at home (cans, boxes, dice, plates), paper and pencil"],
    ["Busquen en la casa un cubo, un cilindro, una esfera y una caja.", "Pongan cada objeto sobre el papel y tracen su borde: ¿qué figura plana queda?", "Adivina tú: describe un objeto («es redondo y rueda») y que lo encuentre."],
    ["Find a cube, a cylinder, a sphere and a box around the house.", "Put each object on the paper and trace around it: what flat shape do you get?", "Your turn to guess: describe an object (“it’s round and it rolls”) and let them find it."]),
  "1|Comparar la longitud de objetos: largo y corto": g("📏", ["La carrera de lo largo", "The long-and-short race"], 5, ["Lápices, cucharas, zapatos, cordones", "Pencils, spoons, shoes, shoelaces"],
    ["Cada uno elige 3 objetos de la casa.", "Pónganlos lado a lado partiendo desde la misma línea y vean cuál es más largo.", "Ordénenlos todos del más corto al más largo."],
    ["Each of you picks 3 things from around the house.", "Line them up side by side from the same starting line and see which is longer.", "Order all of them from shortest to longest."]),
  "1|Leer e interpretar pictogramas": g("🍎", ["La encuesta de la familia", "The family survey"], 10, ["Papel y lápices de colores", "Paper and colored pencils"],
    ["Pregunten a la familia su fruta favorita.", "Dibujen una carita por cada voto, en una columna por fruta.", "Pregunten: ¿cuál ganó? ¿cuántos votos más tiene que la otra?"],
    ["Ask the family about their favorite fruit.", "Draw one face for each vote, in a column for each fruit.", "Ask: which one won? how many more votes does it have than the other?"]),

  // 2° básico
  "2|Adición y sustracción dentro de 100": g("🥢", ["Atados de palitos", "Stick bundles"], 10, ["Palitos de helado o fósforos usados y elásticos", "Craft sticks or used matches and rubber bands"],
    ["Armen atados de 10 palitos con un elástico y dejen algunos sueltos.", "Sumen y resten moviendo primero los atados (decenas) y después los sueltos (unidades).", "Pídele que explique en voz alta cómo lo pensó."],
    ["Make bundles of 10 sticks with a rubber band and leave some loose.", "Add and subtract by moving the bundles (tens) first, then the loose ones (ones).", "Ask them to explain out loud how they thought about it."]),
  "2|Decenas y unidades en números hasta 100": g("🎩", ["¿Qué número tengo?", "What number do I have?"], 5, ["Atados de 10 palitos y palitos sueltos", "Bundles of 10 sticks and loose sticks"],
    ["Esconde detrás de tu espalda algunos atados y sueltos.", "Muéstralos y pregunta qué número es (3 atados y 4 sueltos = 34).", "Cambia un atado o un suelto y pregunta cómo cambió el número."],
    ["Hide some bundles and loose sticks behind your back.", "Show them and ask what number it is (3 bundles and 4 loose = 34).", "Change one bundle or one loose stick and ask how the number changed."]),
  "2|Multiplicación como suma repetida: tablas del 2, 5 y 10": g("🧦", ["Cazadores de grupos", "Group hunters"], 10, ["Zapatos, calcetines, manos, monedas de $10", "Shoes, socks, hands, 10-peso coins"],
    ["Busquen grupos iguales: pares de zapatos, dedos de una mano, monedas de $10.", "Cuenten de 2 en 2, de 5 en 5 o de 10 en 10.", "Díganlo de dos formas: «5 + 5 + 5» y «3 veces 5»."],
    ["Look for equal groups: pairs of shoes, fingers on a hand, 10-peso coins.", "Count by 2s, by 5s or by 10s.", "Say it two ways: “5 + 5 + 5” and “3 times 5”."]),
  "2|Patrones numéricos: continuar y completar": g("🕵️", ["La regla secreta", "The secret rule"], 5, ["Nada, solo la voz (o papel)", "Nothing, just your voices (or paper)"],
    ["Di una serie: 5, 10, 15…, y que tu hijo/a la continúe.", "Pregunta cuál es la regla secreta.", "Cambien: tu hijo/a inventa una serie y tú adivinas la regla."],
    ["Say a sequence: 5, 10, 15…, and let your child continue it.", "Ask what the secret rule is.", "Switch: your child makes up a sequence and you guess the rule."]),
  "2|Figuras 2D: triángulos, cuadrados, rectángulos y círculos": g("🍝", ["Figuras de fideos", "Pasta shapes"], 10, ["Fideos largos o palitos y un plato", "Long pasta or sticks and a plate"],
    ["Armen con fideos un triángulo, un cuadrado y un rectángulo.", "Cuenten los lados y las esquinas de cada uno.", "Pregunten en qué se parecen y en qué se diferencian el cuadrado y el rectángulo."],
    ["Use pasta to build a triangle, a square and a rectangle.", "Count the sides and corners of each one.", "Ask how the square and the rectangle are alike and how they’re different."]),
  "2|Horas y medias horas en el reloj digital": g("⏰", ["El reloj de la rutina", "The routine clock"], 5, ["El reloj del microondas o del celular", "The microwave or phone clock"],
    ["Durante el día, pídele que lea la hora en voz alta.", "Conecten la hora con la rutina: «a las 7:30 tomamos once».", "Pregunta qué hora será en media hora más."],
    ["During the day, ask them to read the time out loud.", "Link the time to the routine: “at 7:30 we have a snack”.", "Ask what time it will be in half an hour."]),
  "2|Pictogramas con escala y gráficos de barra simple": g("📊", ["Votos que valen doble", "Votes worth double"], 10, ["Papel y lápices", "Paper and pencils"],
    ["Hagan una votación familiar (juego o comida favorita).", "Dibujen un pictograma donde cada dibujo vale 2 votos.", "Pregunten: ¿cuánto vale medio dibujo? ¿qué opción tiene más?"],
    ["Hold a family vote (favorite game or food).", "Draw a picture graph where each picture stands for 2 votes.", "Ask: what is half a picture worth? which option has the most?"]),

  // 3° básico
  "3|Valor posicional: unidades, decenas y centenas": g("💵", ["El banco de la casa", "The home bank"], 10, ["Billetes y monedas de juguete o papelitos de $100, $10 y $1", "Play money or paper slips of 100, 10 and 1 pesos"],
    ["Pide una cantidad, por ejemplo $352, y que la arme con billetes y monedas.", "Pregunta cuánto vale cada dígito: en 352, el 5 vale 50.", "Cambien de rol: tu hijo/a es el cajero y tú pides."],
    ["Ask for an amount, for example 352 pesos, and let them build it with bills and coins.", "Ask what each digit is worth: in 352, the 5 is worth 50.", "Switch roles: your child is the cashier and you ask."]),
  "3|Adición y sustracción hasta 1.000": g("🛒", ["Compras al ojo", "Shopping guesses"], 10, ["Una boleta o precios del supermercado", "A receipt or supermarket prices"],
    ["Elijan dos productos y estimen el total «al ojo» (como 300 más 200).", "Calculen el total exacto.", "Comparen: ¿quién estuvo más cerca con su estimación?"],
    ["Pick two products and estimate the total roughly (about 300 plus 200).", "Work out the exact total.", "Compare: whose estimate was closest?"]),
  "3|Tablas de multiplicar hasta el 10": g("🎲", ["Dados multiplicadores", "Multiplying dice"], 10, ["Dos dados (o cartas)", "Two dice (or cards)"],
    ["Lancen los dos dados y multipliquen los números.", "El primero en decir el resultado gana un punto (dale ventaja si lo necesita).", "Busquen atajos juntos: el 4 es el doble del 2, el 9 es «10 menos 1»."],
    ["Roll both dice and multiply the numbers.", "The first to say the answer wins a point (give them a head start if needed).", "Find shortcuts together: 4 is double 2, 9 is “10 minus 1”."]),
  "3|División como reparto y agrupación": g("🍪", ["Repartir galletas", "Sharing cookies"], 10, ["Galletas, cartas o porotos y algunos platos", "Cookies, cards or beans and a few plates"],
    ["Repartan 12 galletas en partes iguales entre 3 platos.", "Ahora al revés: armen grupos de 4 y cuenten cuántos grupos salen.", "Prueben con un número que no se reparte exacto y conversen qué hacer con lo que sobra."],
    ["Share 12 cookies equally among 3 plates.", "Now the other way: make groups of 4 and count how many groups you get.", "Try a number that doesn’t share evenly and talk about what to do with the leftovers."]),
  "3|Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4": g("🥪", ["El sándwich en partes", "The sandwich in parts"], 10, ["Hojas de papel o un sándwich", "Sheets of paper or a sandwich"],
    ["Doblen una hoja en 2, otra en 3 y otra en 4 partes iguales.", "Pinten 1/2, 1/3 y 1/4 y comparen cuál es más grande.", "Al comer, corten el sándwich en partes iguales y nombren la fracción de cada uno."],
    ["Fold one sheet into 2, one into 3 and one into 4 equal parts.", "Color 1/2, 1/3 and 1/4 and compare which is biggest.", "At mealtime, cut the sandwich into equal parts and name each person’s fraction."]),
  "3|Patrones numéricos que crecen y decrecen": g("🚀", ["Cuenta regresiva secreta", "Secret countdown"], 5, ["Nada, solo la voz", "Nothing, just your voices"],
    ["Di números que bajan siempre igual: 100, 90, 80…", "Que adivine la regla y siga la serie hasta llegar a 0 (¡despegue!).", "Ahora una que sube y la inventa tu hijo/a."],
    ["Say numbers that always go down the same way: 100, 90, 80…", "Let them guess the rule and continue to 0 (blast off!).", "Now one that goes up, made up by your child."]),
  "3|Figuras 3D, sus caras y sus redes": g("📦", ["Desarmar cajas", "Unfold the box"], 10, ["Cajas de cereal o de remedios vacías", "Empty cereal or medicine boxes"],
    ["Cuenten caras, aristas y vértices de la caja.", "Desármenla con cuidado para ver su red plana.", "Vuelvan a armarla y adivinen qué caras quedan enfrentadas."],
    ["Count the faces, edges and corners of the box.", "Carefully unfold it to see its flat net.", "Fold it back up and guess which faces end up opposite each other."]),
  "3|Perímetro de cuadrados, rectángulos y otras figuras": g("🧶", ["La vuelta completa", "All the way around"], 10, ["Cordel o lana y una huincha", "String or yarn and a tape measure"],
    ["Rodeen con el cordel el borde de una mesa, un libro o una alfombra.", "Midan cada lado y súmenlos.", "Comparen con el largo del cordel: es «la vuelta completa»."],
    ["Wrap the string around the edge of a table, a book or a rug.", "Measure each side and add them up.", "Compare with the length of string: that’s “all the way around”."]),
  "3|Pictogramas y gráficos de barra simple": g("☀️", ["El diario del clima", "The weather diary"], 5, ["Papel cuadriculado y lápices", "Grid paper and pencils"],
    ["Durante una semana, anoten algo de cada día (días de sol, frutas comidas).", "Dibujen un gráfico de barras con esos datos.", "Hagan preguntas de comparación: ¿qué día hubo más? ¿cuántos más?"],
    ["For a week, note something each day (sunny days, fruit eaten).", "Draw a bar graph with that data.", "Ask comparison questions: which day had the most? how many more?"]),

  // 4° básico
  "4|Números hasta 10.000: valor posicional, orden y descomposición": g("🏷️", ["El precio desarmado", "Taking prices apart"], 10, ["Catálogos, boletas o etiquetas de precios", "Catalogs, receipts or price tags"],
    ["Busquen precios de 4 cifras.", "Desarmen cada uno: 4.305 = 4.000 + 300 + 5.", "Ordenen los precios de mayor a menor."],
    ["Find 4-digit prices.", "Take each one apart: 4,305 = 4,000 + 300 + 5.", "Order the prices from greatest to least."]),
  "4|Multiplicación de números de tres dígitos por uno": g("🛍️", ["La compra por mayor", "Buying in bulk"], 10, ["Precios del supermercado y papel", "Supermarket prices and paper"],
    ["Elijan un producto, por ejemplo $345, y pregunten cuánto cuestan 4.", "Calculen por partes: 4 × 300, 4 × 40 y 4 × 5.", "Sumen las partes y comparen con una estimación (4 × 350)."],
    ["Pick a product, for example 345 pesos, and ask how much 4 of them cost.", "Work it out in parts: 4 × 300, 4 × 40 and 4 × 5.", "Add the parts and compare with an estimate (4 × 350)."]),
  "4|División de dos dígitos por uno, con y sin resto": g("🍽️", ["¿Y lo que sobra?", "What about the leftovers?"], 10, ["Porotos o fideos y algunos platos", "Beans or pasta and a few plates"],
    ["Repartan 47 porotos en 5 platos, todos con la misma cantidad.", "Cuenten cuántos tiene cada plato y cuántos sobran.", "Inventen una historia: si fueran personas en autos, ¿qué hacemos con los que sobran?"],
    ["Share 47 beans among 5 plates, all with the same amount.", "Count how many each plate has and how many are left over.", "Make up a story: if they were people in cars, what do we do with the leftovers?"]),
  "4|Fracciones: parte de un todo, comparación y recta numérica": g("🎗️", ["Tiras de fracciones", "Fraction strips"], 10, ["Tiras de papel del mismo largo y cinta adhesiva", "Paper strips of the same length and tape"],
    ["Doblen tiras en 2, 4 y 8 partes iguales.", "Comparen: ¿cuántos octavos caben en un medio?", "Hagan una recta con cinta en el suelo y salten hasta 1/2, 3/4…"],
    ["Fold strips into 2, 4 and 8 equal parts.", "Compare: how many eighths fit in one half?", "Make a number line with tape on the floor and jump to 1/2, 3/4…"]),
  "4|Ecuaciones e inecuaciones de un paso con suma y resta": g("🔮", ["Adivina mi número", "Guess my number"], 5, ["Nada, solo la voz", "Nothing, just your voices"],
    ["Di: «pensé un número, le sumé 24 y me dio 60».", "Que tu hijo/a lo descubra y lo compruebe sumando.", "Cambien de rol, y prueben también «es mayor que…»."],
    ["Say: “I thought of a number, added 24 and got 60”.", "Let your child find it and check by adding.", "Switch roles, and also try “it’s greater than…”."]),
  "4|Simetría: líneas de simetría en figuras 2D": g("🦋", ["Mariposas espejo", "Mirror butterflies"], 10, ["Papel, tijeras y un espejo", "Paper, scissors and a mirror"],
    ["Doblen un papel y recorten media mariposa o medio corazón.", "Ábranlo: la línea del doblez es la línea de simetría.", "Pongan un espejo sobre dibujos y busquen dónde se ve la figura completa."],
    ["Fold a sheet of paper and cut out half a butterfly or heart.", "Open it: the fold is the line of symmetry.", "Put a mirror on drawings and find where you see the whole shape."]),
  "4|Área de rectángulos y cuadrados": g("🟨", ["Cubrir la mesa", "Cover the table"], 10, ["Post-its, galletas cuadradas o papelitos iguales", "Sticky notes, square crackers or equal paper squares"],
    ["Cubran un libro o una bandeja con cuadrados iguales, sin dejar huecos.", "Cuenten filas y columnas.", "Descubran el atajo: filas × columnas = cuadrados (largo × ancho)."],
    ["Cover a book or a tray with equal squares, leaving no gaps.", "Count the rows and columns.", "Discover the shortcut: rows × columns = squares (length × width)."]),
  "4|Pictogramas y gráficos de barras con escala": g("📰", ["Lectores de gráficos", "Graph readers"], 5, ["Un gráfico de diario, boleta o internet", "A graph from a newspaper, bill or the internet"],
    ["Busquen un gráfico de barras real.", "Lean juntos la escala: ¿cuánto vale cada línea?", "Pregunten cuánto marca una barra que llega a la mitad entre dos líneas."],
    ["Find a real bar graph.", "Read the scale together: what is each line worth?", "Ask what a bar halfway between two lines shows."]),

  // 5° básico
  "5|Números naturales grandes: valor posicional, comparación y aproximación": g("🌎", ["Números gigantes", "Giant numbers"], 10, ["Datos reales: habitantes de ciudades, distancias", "Real data: city populations, distances"],
    ["Busquen números grandes reales y léanlos en voz alta.", "Redondéenlos a la unidad de mil o de millón más cercana.", "Ordénenlos y comparen cuántas veces más grande es uno que otro."],
    ["Find real big numbers and read them out loud.", "Round them to the nearest thousand or million.", "Order them and compare how many times bigger one is than another."]),
  "5|División con dividendo de tres cifras y divisor de una cifra": g("🎯", ["Estima y comprueba", "Estimate and check"], 10, ["Papel y lápiz", "Paper and pencil"],
    ["Antes de dividir, estimen: «275 entre 4 es un poco menos de 70».", "Hagan la división.", "Comprueben: cociente × divisor + resto debe dar el número inicial."],
    ["Before dividing, estimate: “275 divided by 4 is a bit less than 70”.", "Do the division.", "Check: quotient × divisor + remainder should give the starting number."]),
  "5|Fracciones propias: equivalencia y comparación": g("🍫", ["El chocolate partido", "The broken chocolate bar"], 10, ["Una barra de chocolate o tiras de papel", "A chocolate bar or paper strips"],
    ["Partan la barra para mostrar que 1/2 = 2/4 = 4/8.", "Comparen 2/3 y 3/4 llevándolas al mismo número de partes.", "Que tu hijo/a invente dos fracciones y tú adivines cuál es mayor (y lo explique)."],
    ["Break the bar to show that 1/2 = 2/4 = 4/8.", "Compare 2/3 and 3/4 by changing them to the same number of parts.", "Let your child make up two fractions, you guess which is bigger (and they explain)."]),
  "5|Ecuaciones e inecuaciones de un paso": g("🧩", ["Acertijos de láminas", "Sticker riddles"], 5, ["Nada, solo la voz", "Nothing, just your voices"],
    ["Plantea: «tenía x láminas, me regalaron 8 y ahora tengo 15».", "Que encuentre x y lo compruebe reemplazándolo en la frase.", "Que invente un acertijo para ti."],
    ["Pose: “I had x stickers, got 8 more and now I have 15”.", "Let them find x and check by putting it back in the sentence.", "Let them make up a riddle for you."]),
  "5|Plano cartesiano: coordenadas en el primer cuadrante": g("🚢", ["Batalla naval", "Battleship"], 15, ["Papel cuadriculado y lápices", "Grid paper and pencils"],
    ["Dibujen dos cuadrículas con números en los ejes.", "Cada uno esconde 3 barcos sin mostrarlos.", "Disparen diciendo coordenadas: primero a la derecha (x), después hacia arriba (y)."],
    ["Draw two grids with numbers on the axes.", "Each of you hides 3 ships without showing them.", "Take shots by calling coordinates: first right (x), then up (y)."]),
  "5|Perímetro y área de rectángulos": g("🎀", ["Cinta o alfombra", "Ribbon or rug"], 10, ["Una huincha y una mesa o pieza", "A tape measure and a table or room"],
    ["Midan el largo y el ancho de una mesa.", "Pregunta: para ponerle una cinta en el borde, ¿cuánta se necesita? (perímetro).", "Y para cubrirla con un mantel, ¿cuánto? (área)."],
    ["Measure the length and width of a table.", "Ask: to put ribbon around the edge, how much do we need? (perimeter).", "And to cover it with a tablecloth, how much? (area)."]),
  "5|Promedio de un conjunto de datos": g("🧱", ["Emparejar torres", "Leveling towers"], 10, ["Bloques, monedas o tapas", "Blocks, coins or lids"],
    ["Armen torres de distinta altura (por ejemplo, minutos de lectura de cada día).", "Muevan bloques de las altas a las bajas hasta que todas queden iguales.", "Esa altura es el promedio. Compruébenlo sumando y dividiendo."],
    ["Build towers of different heights (for example, minutes read each day).", "Move blocks from the tall towers to the short ones until they’re all equal.", "That height is the average. Check by adding and dividing."]),

  // 6° básico
  "6|Razones y proporciones": g("🧁", ["La receta que crece", "The growing recipe"], 15, ["Una receta sencilla", "A simple recipe"],
    ["Lean una receta para 4 personas.", "Calculen cuánto de cada ingrediente se necesita para 6 o para 2.", "Hablen de «por cada»: por cada 2 tazas de harina, 1 de leche."],
    ["Read a recipe for 4 people.", "Work out how much of each ingredient you need for 6 or for 2.", "Talk about “for every”: for every 2 cups of flour, 1 of milk."]),
  "6|Porcentajes y su relación con fracciones y decimales": g("🏷️", ["Cazadores de ofertas", "Sale hunters"], 10, ["Catálogos o avisos de ofertas", "Catalogs or sale ads"],
    ["Busquen ofertas con porcentaje de descuento.", "Calculen el descuento: 25% es 1/4 del precio, 10% es dividir por 10.", "¿Cuánto se paga al final? ¿Cuál oferta conviene más?"],
    ["Find sales with a percent discount.", "Work out the discount: 25% is 1/4 of the price, 10% is dividing by 10.", "How much do you pay in the end? Which sale is the better deal?"]),
  "6|Adición y sustracción de fracciones y números mixtos": g("🥄", ["Tazas medidoras", "Measuring cups"], 10, ["Tazas o cucharas medidoras y agua o arroz", "Measuring cups or spoons and water or rice"],
    ["Junten 1/2 taza y 1/4 de taza en un recipiente.", "Pregunten cuánto hay en total y compruébenlo con la taza de 1/4.", "Recuerden: solo se suman partes del mismo tamaño."],
    ["Pour 1/2 cup and 1/4 cup into one bowl.", "Ask how much there is in total and check with the 1/4 cup.", "Remember: you can only add parts of the same size."]),
  "6|Ecuaciones de primer grado con una incógnita": g("⚖️", ["La balanza mágica", "The magic balance"], 10, ["Papel y lápiz (o una balanza de cocina)", "Paper and pencil (or a kitchen scale)"],
    ["Dibujen una balanza: a un lado 3 bolsas iguales y 2 sueltos, al otro 14.", "Lo que se quita de un lado se quita del otro, hasta que quede una bolsa sola.", "Comprueben poniendo el valor en la balanza original."],
    ["Draw a balance: on one side 3 equal bags and 2 loose, on the other 14.", "Whatever you take from one side you take from the other, until one bag is alone.", "Check by putting the value back on the original balance."]),
  "6|Suma de ángulos interiores de triángulos y cuadriláteros": g("✂️", ["Las esquinas viajeras", "Traveling corners"], 10, ["Papel, tijeras y lápiz", "Paper, scissors and a pencil"],
    ["Recorten un triángulo cualquiera y marquen sus tres esquinas.", "Corten las esquinas y júntenlas: forman una línea recta (180°).", "Repitan con un cuadrilátero: forman una vuelta completa (360°)."],
    ["Cut out any triangle and mark its three corners.", "Cut off the corners and put them together: they make a straight line (180°).", "Repeat with a four-sided shape: they make a full turn (360°)."]),
  "6|Volumen de cubos y paralelepípedos": g("🎲", ["Llenar la caja", "Fill the box"], 10, ["Una caja chica y cubos iguales (dados, bloques)", "A small box and equal cubes (dice, blocks)"],
    ["Llenen el fondo de la caja con una capa de cubos y cuéntenlos.", "Cuenten cuántas capas caben.", "Descubran el atajo: cubos de una capa × número de capas = volumen."],
    ["Fill the bottom of the box with one layer of cubes and count them.", "Count how many layers fit.", "Discover the shortcut: cubes in one layer × number of layers = volume."]),
  "6|Gráficos de barra doble y circulares": g("🥧", ["El gráfico de la casa", "The home graph"], 10, ["Una boleta (luz, agua) o un gráfico de noticias", "A bill (power, water) or a news graph"],
    ["Busquen un gráfico de barras dobles o circular real.", "Pregunten qué compara y qué grupo es mayor.", "En el circular, conecten mitades y cuartos con 50% y 25%."],
    ["Find a real double bar graph or pie chart.", "Ask what it compares and which group is bigger.", "On the pie chart, link halves and quarters to 50% and 25%."]),
};

export function homeGameFor(grade: number, skillName: string): HomeGame | null {
  return HOME_GAMES[`${grade}|${skillName}`] ?? null;
}
