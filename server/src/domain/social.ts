/**
 * Pregunta social semanal y señales para la familia (specs/018).
 *
 * El niño responde una vez por semana, con caritas y de forma opcional, cómo le fue con los demás:
 * con quién estuvo en el recreo, si tiene a alguien a quien contarle sus cosas y si alguien lo
 * molestó o lo dejó fuera (y cuántas veces). Las preguntas están adaptadas de escalas de soledad
 * infantil usadas en investigación, pero aquí NO se puntúan como escala: la app no diagnostica.
 * Solo levanta SEÑALES PARA CONVERSAR cuando algo se repite, o de inmediato si cuenta que lo
 * molestaron varias veces (el acoso escolar es, por definición, reiterado: Ley 20.536).
 *
 * Reglas (deterministas, auditables). Solo cuentan las respuestas de las últimas WINDOW_WEEKS
 * semanas, y las que miran "la última respuesta" solo si es de esta semana o la anterior, para que
 * una señal vieja no siga encendida. Una semana saltada, "prefiero no decir" o "no fui al colegio"
 * no cuentan ni a favor ni en contra.
 * - "atencion":
 *   - la última respuesta dice que lo molestaron o dejaron fuera "varias veces";
 *   - o lo dijo (una vez o varias) en 2 de las últimas 3 respuestas.
 * - "conversar":
 *   - la última respuesta dice "una vez";
 *   - o lo dijo en alguna de las últimas 3 pero no en la última;
 *   - o en la última estuvo sin nadie queriendo compañía Y no tiene a quién contarle;
 *   - o estuvo sin nadie queriendo compañía en 2 de las últimas 3;
 *   - o no tiene a quién contarle en 2 de las últimas 3.
 * - Nota (no es señal): prefirió no decir si lo molestaron en 2 de las últimas 3.
 * Módulo puro, sin acceso a BD.
 */
import { APP_TIME_ZONE } from "./wellbeing.js";

/// 1 con mis amigos, 2 con algunos compañeros, 3 sin nadie y estuvo bien, 4 sin nadie y quería
/// estar con alguien, 5 esta semana no fue al colegio (no cuenta para las señales).
export const RECESS = [1, 2, 3, 4, 5] as const;
export const NO_SCHOOL = 5;
export const CONFIDANT = [1, 2, 3] as const; // sí, más o menos, no
export const EXCLUDED = ["no", "una_vez", "varias", "prefiero_no"] as const;
export type Excluded = (typeof EXCLUDED)[number];
/// Versión del texto de consentimiento de la pregunta social (ConsentScreen y espacio familia).
export const SOCIAL_CONSENT_VERSION = "2026-10-26";
/// Semanas que cuentan para las señales y que se muestran a la familia.
export const WINDOW_WEEKS = 6;
/// Semanas que se guardan; lo más antiguo se borra (minimización de datos).
export const RETENTION_WEEKS = 12;

/// Semana ISO local ("2026-W44"): lunes a domingo en la zona horaria de la app.
export function weekKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .split("-")
    .map(Number) as [number, number, number];
  const local = new Date(Date.UTC(y, m - 1, d));
  const dow = local.getUTCDay() || 7; // lunes = 1 … domingo = 7
  local.setUTCDate(local.getUTCDate() + 4 - dow); // jueves de esa semana
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((local.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const weeksAgo = (now: Date, n: number) => weekKey(new Date(now.getTime() - n * 7 * 86400000));

export interface SocialRow {
  weekKey: string;
  createdAt: Date;
  recess: number | null;
  confidant: number | null;
  excluded: string | null;
}

export type SignalLevel = "conversar" | "atencion";
export type SignalReason =
  | "excluded_often"
  | "excluded_repeated"
  | "excluded_once"
  | "excluded_recent"
  | "alone_and_no_confidant"
  | "alone_recess"
  | "no_confidant";
export type SocialNote = "prefers_not_say";

export interface SocialAnswer {
  weekKey: string;
  recess: number | null;
  confidant: number | null;
  excluded: string | null;
}

export interface SocialSummary {
  /** Semanas respondidas (no saltadas) dentro de la ventana. */
  answeredWeeks: number;
  latest: SocialAnswer | null;
  /** Respuestas de las últimas WINDOW_WEEKS semanas, de la más reciente a la más antigua. */
  history: SocialAnswer[];
  signal: { level: SignalLevel; reasons: SignalReason[] } | null;
  notes: SocialNote[];
}

const answered = (r: SocialRow) => r.recess !== null || r.confidant !== null || r.excluded !== null;
const hurt = (e: string | null) => e === "una_vez" || e === "varias";

export function summarizeSocial(rows: SocialRow[], now: Date = new Date()): SocialSummary {
  const from = weeksAgo(now, WINDOW_WEEKS - 1);
  const done = rows
    .filter((r) => answered(r) && r.weekKey >= from)
    .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1));
  const strip = ({ weekKey, recess, confidant, excluded }: SocialRow): SocialAnswer => ({ weekKey, recess, confidant, excluded });
  const latest = done[0] ?? null;
  const fresh = latest !== null && latest.weekKey >= weeksAgo(now, 1); // de esta semana o la anterior
  const last3 = done.slice(0, 3);

  const reasons: SignalReason[] = [];
  let atencion = false;
  if (fresh && latest!.excluded === "varias") {
    reasons.push("excluded_often");
    atencion = true;
  } else if (last3.filter((r) => hurt(r.excluded)).length >= 2) {
    reasons.push("excluded_repeated");
    atencion = true;
  } else if (fresh && latest!.excluded === "una_vez") {
    reasons.push("excluded_once");
  } else if (last3.some((r) => hurt(r.excluded))) {
    reasons.push("excluded_recent");
  }
  if (fresh && latest!.recess === 4 && latest!.confidant === 3) reasons.push("alone_and_no_confidant");
  else {
    if (last3.filter((r) => r.recess === 4).length >= 2) reasons.push("alone_recess");
    if (last3.filter((r) => r.confidant === 3).length >= 2) reasons.push("no_confidant");
  }
  const notes: SocialNote[] = last3.filter((r) => r.excluded === "prefiero_no").length >= 2 ? ["prefers_not_say"] : [];

  return {
    answeredWeeks: done.length,
    latest: latest ? strip(latest) : null,
    history: done.map(strip),
    signal: reasons.length ? { level: atencion ? "atencion" : "conversar", reasons } : null,
    notes,
  };
}

type Bi = { es: string; en: string };

/// Qué hacer ante una señal: conversar sin interrogar, qué evitar, cuándo ir al colegio, cuándo
/// buscar apoyo profesional y qué hacer si es urgente. Para la familia, en tú; nunca culpa ni
/// etiqueta al niño. Teléfonos verificados en fuentes oficiales (Minsal, Fundación Integra) el
/// 2026-10-26.
export const SOCIAL_GUIDANCE: {
  open: Bi[];
  avoid: Bi[];
  school: Bi;
  professional: Bi;
  urgent: Bi;
  resources: Bi;
  reasons: Record<SignalReason, Bi>;
  notes: Record<SocialNote, Bi>;
} = {
  open: [
    {
      es: "Busca un momento tranquilo y sin pantallas, haciendo algo juntos (cocinar, caminar). Los niños hablan más cuando no sienten que es un interrogatorio.",
      en: "Find a calm, screen-free moment while doing something together (cooking, walking). Children talk more when it doesn't feel like an interrogation.",
    },
    {
      es: "Pregunta por momentos concretos: «¿Con quién te sentaste a almorzar?», «¿Qué hiciste en el recreo?», en vez de «¿Cómo te fue?».",
      en: "Ask about specific moments: “Who did you sit with at lunch?”, “What did you do at recess?”, instead of “How was school?”.",
    },
    {
      es: "Escucha más de lo que hablas y valida lo que siente: «Entiendo que eso te haya dolido». Agradécele que te lo haya contado, pregúntale qué le gustaría que pasara y cuéntale qué vas a hacer antes de hacerlo. No le prometas guardar un secreto si después vas a tener que hablar con el colegio.",
      en: "Listen more than you talk and validate the feeling: “I understand that hurt.” Thank them for telling you, ask what they'd like to happen, and tell them what you'll do before you do it. Don't promise to keep it secret if you may need to talk with the school.",
    },
    {
      es: "Ayúdale a buscar oportunidades para estar con otros: invitar a un compañero a la casa, un taller o un deporte que le guste.",
      en: "Help them find chances to be with others: inviting a classmate over, a club or a sport they enjoy.",
    },
    {
      es: "Si pasa por celular, juegos en línea o redes: guarden juntos capturas de pantalla con la fecha, no respondan, bloqueen y reporten la cuenta. El colegio también debe actuar si es entre compañeros, aunque pase fuera del horario de clases.",
      en: "If it happens by phone, online games or social media: save screenshots with the date together, don't reply, and block and report the account. The school must also act if it's between classmates, even outside school hours.",
    },
  ],
  avoid: [
    {
      es: "No le restes importancia («no le hagas caso», «ya se le pasará») ni reacciones con enojo: puede hacer que deje de contarte.",
      en: "Don't brush it off (“just ignore them”, “it'll pass”) or react with anger: it can make them stop telling you.",
    },
    {
      es: "No lo retes, castigues ni le quites el celular o la tablet por algo que contó: lo importante es que siga contándote.",
      en: "Don't scold or punish them, or take away their phone or tablet, for something they shared: what matters is that they keep telling you.",
    },
    {
      es: "Evita hacerle repetir lo que pasó muchas veces o preguntarle «¿y tú qué hiciste?»: puede sentir que fue su culpa. Dile claramente: «No es tu culpa».",
      en: "Avoid making them retell what happened many times or asking “and what did you do?”: they may feel it was their fault. Tell them clearly: “It's not your fault.”",
    },
    {
      es: "No enfrentes tú al otro niño ni a su familia, y no lo cuentes en el grupo de apoderados: suele empeorar las cosas para tu hijo o hija. Ve por el colegio.",
      en: "Don't confront the other child or their family yourself, and don't share it in the parents' group chat: it usually makes things worse for your child. Go through the school.",
    },
    {
      es: "Evita aconsejarle «pégale de vuelta» o ponerle etiquetas como «tímido» o «raro».",
      en: "Avoid advising them to “hit back” or labeling them “shy” or “weird”.",
    },
    {
      es: "Evita interrogarle sobre cada respuesta de la app o leérselas una por una: úsalas como punto de partida para conversar, no como prueba.",
      en: "Avoid quizzing them on each answer in the app or reading them back one by one: use them as a starting point for a conversation, not as evidence.",
    },
  ],
  school: {
    es: "Si se repite o le cuesta ir al colegio, conversa con su profesor o profesora jefe. Si alguien lo molesta o lo deja fuera, pide hablar también con el encargado de convivencia escolar (todo colegio en Chile debe tener uno) y pide que se aplique el protocolo ante maltrato o acoso escolar de su reglamento interno. Deja por escrito lo que contaste (correo o libreta) y pide que te informen qué harán. Si quien lo molesta es un adulto del colegio, es igual de grave: avisa directamente a la dirección. Si el colegio no responde, puedes hacer una denuncia en la Superintendencia de Educación.",
    en: "If it keeps happening or school becomes hard for them, talk with their homeroom teacher. If someone is bothering them or leaving them out, also ask to talk with the school's encargado de convivencia escolar (the staff member in charge of school climate and bullying; every school in Chile must have one) and ask them to apply the school's anti-bullying protocol. Put what you reported in writing (email or school notebook) and ask them to tell you what they will do. If the person bothering them is a school adult, it is just as serious: tell the principal's office directly. If the school doesn't respond, you can file a complaint with the Superintendencia de Educación.",
  },
  professional: {
    es: "Busca apoyo profesional (psicólogo o psicóloga del colegio, tu CESFAM o centro de salud, o su pediatra) si la tristeza o el aislamiento duran varias semanas, si cambian su sueño o su apetito, si se queja seguido de dolor de guata o de cabeza antes del colegio, o si no quiere ir al colegio.",
    en: "Seek professional support (the school psychologist, your local health center or their pediatrician) if sadness or isolation lasts several weeks, if their sleep or appetite changes, if they often complain of stomachaches or headaches before school, or if they don't want to go to school.",
  },
  urgent: {
    es: "Si habla de hacerse daño, de no querer vivir o de desaparecer, no esperes: busca ayuda hoy. Llama gratis las 24 horas a la línea de prevención del suicidio *4141 o a Salud Responde 600 360 7777; si hay peligro inmediato, al SAMU 131. Tómalo en serio aunque lo diga «en broma».",
    en: "If they talk about hurting themselves, not wanting to live or disappearing, don't wait: get help today. Call Chile's suicide prevention line *4141 (free, 24/7) or Salud Responde 600 360 7777 (24/7); if there is immediate danger, call SAMU 131. Take it seriously even if it's said “as a joke”.",
  },
  resources: {
    es: "Para orientación sobre crianza de niños de hasta 9 años, puedes llamar gratis a Fono Infancia 800 200 818 (lunes a viernes, 8:30 a 19:00). Si hay violencia física grave o abuso, es un delito: denuncia a Carabineros (133), a la PDI (134) o a la Fiscalía.",
    en: "For parenting guidance for children up to 9, you can call Fono Infancia for free at 800 200 818 (Monday to Friday, 8:30 to 19:00). Serious physical violence or abuse is a crime: report it to Carabineros (133), the PDI (134) or the Public Prosecutor's Office.",
  },
  reasons: {
    excluded_often: {
      es: "En su última respuesta contó que alguien lo molestó o lo dejó fuera varias veces esta semana. Si se repite, puede ser acoso escolar: conviene hablar con el colegio en los próximos días.",
      en: "In their latest answer they said someone was mean to them or left them out several times this week. When it keeps happening it may be bullying: it's worth talking with the school in the next few days.",
    },
    excluded_repeated: {
      es: "En 2 de sus últimas 3 respuestas contó que alguien lo molestó o lo dejó fuera. Si se repite, puede ser acoso escolar: conviene hablar con el colegio en los próximos días.",
      en: "In 2 of their last 3 answers they said someone was mean to them or left them out. When it keeps happening it may be bullying: it's worth talking with the school in the next few days.",
    },
    excluded_once: {
      es: "En su última respuesta contó que una vez alguien lo molestó o lo dejó fuera.",
      en: "In their latest answer they said that once someone was mean to them or left them out.",
    },
    excluded_recent: {
      es: "Hace poco contó que alguien lo molestó o lo dejó fuera; en su última respuesta no lo repitió. Vale la pena preguntarle cómo sigue eso.",
      en: "Recently they said someone was mean to them or left them out; in their latest answer they didn't. It's worth asking how that is going.",
    },
    alone_and_no_confidant: {
      es: "En su última respuesta contó que en el recreo estuvo sin nadie queriendo estar con alguien, y que no tiene en su curso a quién contarle sus cosas.",
      en: "In their latest answer they said they were alone at recess wanting company, and that they don't have anyone in their class to tell things to.",
    },
    alone_recess: {
      es: "En 2 de sus últimas 3 respuestas contó que en el recreo estuvo sin nadie y que le hubiera gustado estar con alguien.",
      en: "In 2 of their last 3 answers they said they were alone at recess and would have liked to be with someone.",
    },
    no_confidant: {
      es: "En 2 de sus últimas 3 respuestas contó que no tiene en su curso a alguien a quien contarle sus cosas.",
      en: "In 2 of their last 3 answers they said they don't have anyone in their class to tell things to.",
    },
  },
  notes: {
    prefers_not_say: {
      es: "En varias semanas prefirió no responder si alguien lo molestó. Es su derecho; si te parece, ofrécele conversar sin presionar.",
      en: "In several weeks they preferred not to say whether anyone was mean to them. That's their right; if you like, offer to talk without pressure.",
    },
  },
};
