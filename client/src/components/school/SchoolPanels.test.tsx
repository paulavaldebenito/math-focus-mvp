import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DirectorDashboardData, TeacherDashboardData } from "../../api/types.js";
import { TeacherDashboard } from "./TeacherDashboard.js";
import { DirectorDashboard } from "./DirectorDashboard.js";

const skills = [
  { id: "frac", name: "Fracciones", nameEn: "Fractions", oaCode: "MA03 OA11", axis: "Números y operaciones", axisEn: "Numbers and operations", order: 1, grade: 3 },
  { id: "geo", name: "Figuras 3D", nameEn: null, oaCode: "MA03 OA15", axis: "Geometría", axisEn: "Geometry", order: 2, grade: 3 },
];
const zero = { orgullo: 0, alegria: 0, calma: 0, aburrimiento: 0, rabia: 0, nervios: 0 };
const cell = (level: string, acc: number | null) => ({ level, attempts: 5, recentAccuracy: acc, mainError: null }) as never;

const teacher: TeacherDashboardData = {
  classroom: { id: "c1", name: "3° B", grade: 3, joinCode: "3B-K7Q2X" },
  students: [
    { id: "a", name: "Ana", shareEmotions: true },
    { id: "b", name: "Beto", shareEmotions: false },
  ],
  skills,
  heatmap: { a: { frac: cell("inicial", 0.3), geo: cell("sin", null) }, b: { frac: cell("logrado", 0.9), geo: cell("sin", null) } },
  skillSummary: [
    { skillId: "frac", levels: { inicial: 1, desarrollo: 0, logrado: 1, pocos: 0, sin: 0 }, assessed: 2, topError: { code: "E3_PREG", count: 4 } },
    { skillId: "geo", levels: { inicial: 0, desarrollo: 0, logrado: 0, pocos: 0, sin: 2 }, assessed: 0, topError: null },
  ],
  groups: [],
  participation: [
    { childId: "a", lastPractice: "2026-10-22", daysSinceLast: 1, sessions7d: 2, minutes7d: 20, inactive: false, hintRate: 0.5, fastRate: 0, homeGames: 1 },
    { childId: "b", lastPractice: null, daysSinceLast: null, sessions7d: 0, minutes7d: 0, inactive: true, hintRate: null, fastRate: null, homeGames: 0 },
  ],
  week: { activeStudents: 1, minutes: 20, sessions: 2 },
  climate: { emotionCounts: { ...zero, nervios: 3 }, reporters: 1, difficultSkills: [{ skillId: "frac", reports: 3, students: 1 }], alerts: [{ childId: "a", reason: "emociones_dificiles", count: 3, skillId: "frac" }] },
  coverage: { practiced: 1, total: 2 },
  actions: [
    { kind: "reensenar", skillId: "frac", inicial: 1, assessed: 2, errorCode: "E3_PREG" },
    { kind: "inactivos", childIds: ["b"] },
  ],
};

describe("TeacherDashboard", () => {
  it("muestra acciones concretas, el mapa de calor accesible y las alertas solo de quien autorizó", async () => {
    const onOpen = vi.fn();
    render(<TeacherDashboard data={teacher} lang="es" onOpenStudent={onOpen} />);
    expect(screen.getByText(/Volver a enseñar MA03 OA11 Fracciones al curso: 1 de los 2 estudiantes que lo practicaron están en nivel Inicial. Error más común: Entender qué se pregunta/)).toBeInTheDocument();
    expect(screen.getByText(/Sin practicar desde hace 7 días o más: Beto. Conviene/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ana, MA03 OA11 Fracciones: Inicial (30 %)")).toHaveTextContent("30");
    expect(screen.getAllByText("1/2", { selector: ".dash-stat-value" })).toHaveLength(2); // practicaron y OA con práctica
    expect(screen.getByText(/Reportó rabia o nervios 3 veces, sobre todo en MA03 OA11/)).toBeInTheDocument();
    expect(screen.getByText(/Solo estudiantes cuyas familias autorizaron/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getAllByRole("button", { name: "Ana" })[0]!);
    expect(onOpen).toHaveBeenCalledWith("a");
  });

  it("sin estudiantes explica cómo invitar a las familias con el código", () => {
    render(<TeacherDashboard data={{ ...teacher, students: [] }} lang="es" onOpenStudent={vi.fn()} />);
    expect(screen.getByText(/Comparte el código 3B-K7Q2X con las familias/)).toBeInTheDocument();
  });
});

describe("DirectorDashboard", () => {
  it("muestra agregados y «pocos datos» cuando un grupo tiene menos de 5", () => {
    const data: DirectorDashboardData = {
      school: { id: "s", name: "Colegio", staffCode: "COL-X" },
      skills,
      totals: { classes: 2, students: 30, activeStudents7d: 20, teachersUsingPanel7d: 1, teachers: 2 },
      masteryByGradeAxis: [
        { grade: 3, axis: "Números y operaciones", axisEn: null, logrado: { ok: true, value: 0.62, students: 25 } },
        { grade: 3, axis: "Geometría", axisEn: null, logrado: { ok: false, students: 3 } },
      ],
      monthly: [{ grade: 3, month: "2026-10", accuracy: { ok: true, value: 0.7, students: 20 } }],
      classes: [
        { id: "A", name: "3° A", grade: 3, teacherEmail: "t1@x", teacherLastPanelAt: null, enrolled: 15, active7d: 5, minutes7d: 100, logrado: { ok: true, value: 0.5, students: 15 }, difficultEmotionShare: { ok: false, students: 2 }, homeGames: 4 },
      ],
      parallel: [],
      wellbeingByGrade: [{ grade: 3, counts: { ok: false, students: 2 } }],
      alerts: [{ kind: "baja_participacion", classId: "A", share: 1 / 3 }],
    };
    render(<DirectorDashboard data={data} lang="es" />);
    expect(screen.getByText("62 %")).toBeInTheDocument();
    expect(screen.getAllByText("pocos datos").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("3° A: solo el 33 % de los estudiantes practicó esta semana.")).toBeInTheDocument();
    expect(screen.getByText(/Ningún grupo con menos de 5 estudiantes/)).toBeInTheDocument();
  });
});
