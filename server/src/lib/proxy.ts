import type { Express } from "express";

type Entorno = Record<string, string | undefined>;

/// Cuántos proxies hay entre el navegador y Node (specs/025). En AWS el camino es
/// navegador → CloudFront → balanceador (ALB) → nginx de Elastic Beanstalk → Node: cada salto
/// agrega a `X-Forwarded-For` la IP de quien le habló, así que la IP real del niño o la familia
/// queda 3 posiciones antes del final y hay que poner `TRUST_PROXY_HOPS=3`.
///
/// Con un número menor, Express toma la IP de un proxy (todas las familias comparten el límite
/// de intentos y una sola persona bloquea el login de todas). Con uno mayor, cualquiera puede
/// inventar su IP mandando su propio `X-Forwarded-For` y saltarse el límite. Por eso el valor
/// por defecto es 1 (nunca cree lo que manda el cliente) y la topología real lo fija explícito.
export function saltosDeProxy(env: Entorno = process.env): number {
  const valor = env.TRUST_PROXY_HOPS;
  if (valor === undefined || valor === "") return 1;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    throw new Error(`TRUST_PROXY_HOPS="${valor}" debe ser un entero entre 0 y 10.`);
  }
  return n;
}

/// `trust proxy` con el número de saltos: además de la IP real, hace que `req.secure` lea el
/// `X-Forwarded-Proto: https` que pone el ALB, y sin eso la cookie `secure` nunca se manda.
export function configurarProxy(app: Express, env: Entorno = process.env): number {
  const saltos = saltosDeProxy(env);
  app.set("trust proxy", saltos);
  return saltos;
}
