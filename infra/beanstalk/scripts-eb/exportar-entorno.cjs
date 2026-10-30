// Lee en stdin el JSON de `/opt/elasticbeanstalk/bin/get-config environment` y escribe líneas
// `export NOMBRE='valor'` para `eval` en bash. Comillas simples: $, ` y \ quedan literales.
const env = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
for (const [nombre, valor] of Object.entries(env)) {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(nombre)) continue;
  const seguro = String(valor).replace(/'/g, "'\\''");
  console.log(`export ${nombre}='${seguro}'`);
}
