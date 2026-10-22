import { api } from "./client.js";
import type {
  AdultUser,
  AttemptResult,
  ChildProfile,
  Consent,
  HomeSummary,
  InitialAssessmentResponse,
  InitialAssessmentResult,
  NextExercisePublic,
  ProgressResponse,
  ReflectionInput,
  ReviewAnswerResult,
  ReviewComment,
  ReviewExercise,
  ReviewExerciseSummary,
  ReviewPendingComment,
  ReviewSkill,
  SkillPathResult,
  StartSessionResponse,
} from "./types.js";

export function register(email: string, password: string) {
  return api.post<AdultUser>("/api/auth/register", { email, password });
}

export function login(email: string, password: string) {
  return api.post<AdultUser>("/api/auth/login", { email, password });
}

export function logout() {
  return api.post<void>("/api/auth/logout");
}

export function me() {
  return api.get<AdultUser>("/api/auth/me");
}

export function createConsent(scope: string) {
  return api.post<Consent>("/api/consent", { scope });
}

export function createChild(consentId: string, displayName: string, grade: number) {
  return api.post<ChildProfile>("/api/children", { consentId, displayName, grade });
}

export async function listChildren(): Promise<ChildProfile[]> {
  const { children } = await api.get<{ children: ChildProfile[] }>("/api/children");
  return children;
}

export function getInitialAssessment(childId: string) {
  return api.get<InitialAssessmentResponse>(`/api/children/${childId}/initial-assessment`);
}

export interface InitialAssessmentAttemptInput {
  exerciseId: string;
  selectedOptionId: string;
  responseTimeMs?: number;
}

export function submitInitialAssessment(childId: string, attempts: InitialAssessmentAttemptInput[]) {
  return api.post<InitialAssessmentResult>(`/api/children/${childId}/initial-assessment/attempts`, {
    attempts,
  });
}

export function startSession(childId: string, mathSkillId?: string) {
  return api.post<StartSessionResponse>(`/api/children/${childId}/sessions`, mathSkillId ? { mathSkillId } : undefined);
}

export function getSkillPath(childId: string) {
  return api.get<SkillPathResult>(`/api/children/${childId}/skill-path`);
}

export function getNextExercise(childId: string, sessionId: string) {
  return api.get<NextExercisePublic>(`/api/children/${childId}/next-exercise?sessionId=${sessionId}`);
}

export interface SubmitAttemptInput {
  exerciseId: string;
  selectedOptionId: string;
  responseTimeMs?: number;
  hintsUsed?: number;
}

export function submitAttempt(sessionId: string, input: SubmitAttemptInput) {
  return api.post<AttemptResult>(`/api/sessions/${sessionId}/attempts`, input);
}

export interface SubmitSpotErrorAttemptInput {
  exerciseId: string;
  wrongOptionId: string;
  chosenCode: string;
}

export function submitSpotErrorAttempt(sessionId: string, input: SubmitSpotErrorAttemptInput) {
  return api.post<AttemptResult>(`/api/sessions/${sessionId}/spot-error-attempts`, input);
}

export interface PauseEventInput {
  kind: "respiracion" | "movimiento";
  accepted: boolean;
  durationMs?: number;
  /** Ejercicio concreto de la pausa (lib/pauses.ts), para no repetirlo en la sesión. */
  exerciseKey?: string;
}

/** Autorreporte con caritas (1-5) en la primera práctica del día; vacío = lo saltó. */
export interface CheckInInput {
  mood?: number;
  mathFeeling?: number;
}

export function submitCheckIn(sessionId: string, input: CheckInInput) {
  return api.post<{ id: string }>(`/api/sessions/${sessionId}/check-in`, input);
}

export function submitPauseEvent(sessionId: string, input: PauseEventInput) {
  return api.post<{ id: string; accepted: boolean }>(`/api/sessions/${sessionId}/pause-events`, input);
}

export function getProgress(childId: string) {
  return api.get<ProgressResponse>(`/api/children/${childId}/progress`);
}

export function setCompanion(childId: string, companion: string) {
  return api.patch<{ id: string; companion: string }>(`/api/children/${childId}/companion`, { companion });
}

export function setInterests(childId: string, interests: string[]) {
  return api.patch<{ id: string; interests: string[] }>(`/api/children/${childId}/interests`, { interests });
}

export function setMascotName(childId: string, mascotName: string) {
  return api.patch<{ id: string; mascotName: string }>(`/api/children/${childId}/mascot-name`, { mascotName });
}

export function submitReflection(sessionId: string, input: ReflectionInput) {
  return api.post<{ id: string }>(`/api/sessions/${sessionId}/reflection`, input);
}

export function playHomeGame(childId: string, mathSkillId: string) {
  return api.post<{ timesPlayed: number }>(`/api/children/${childId}/home-games`, { mathSkillId });
}

export function completeSession(sessionId: string) {
  return api.post<{ id: string; starAwarded: boolean }>(`/api/sessions/${sessionId}/complete`);
}

export function getHomeSummary(childId: string) {
  return api.get<HomeSummary>(`/api/children/${childId}/home`);
}

// ---- Modo revisión ----

export function reviewSkills(grade: number) {
  return api.get<{ grade: number; skills: ReviewSkill[] }>(`/api/review/skills?grade=${grade}`);
}

export function reviewSkillExercises(skillId: string) {
  return api.get<{ skill: ReviewExercise["skill"]; exercises: ReviewExerciseSummary[] }>(`/api/review/skills/${skillId}/exercises`);
}

export function reviewExercise(exerciseId: string) {
  return api.get<ReviewExercise>(`/api/review/exercises/${exerciseId}`);
}

export function reviewAnswer(exerciseId: string, selectedOptionId: string) {
  return api.post<ReviewAnswerResult>(`/api/review/exercises/${exerciseId}/answer`, { selectedOptionId });
}

export function reviewAddComment(exerciseId: string, text: string) {
  return api.post<ReviewComment>(`/api/review/exercises/${exerciseId}/comments`, { text });
}

export function reviewDeleteComment(commentId: string) {
  return api.delete<void>(`/api/review/comments/${commentId}`);
}

export async function reviewPendingComments(): Promise<ReviewPendingComment[]> {
  const { comments } = await api.get<{ comments: ReviewPendingComment[] }>("/api/review/comments");
  return comments;
}
