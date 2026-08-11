import { api } from "./client.js";
import type {
  AdultUser,
  AttemptResult,
  ChildProfile,
  Consent,
  ExercisePublic,
  InitialAssessmentResponse,
  InitialAssessmentResult,
  ProgressResponse,
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

export function createChild(consentId: string, displayName: string) {
  return api.post<ChildProfile>("/api/children", { consentId, displayName });
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

export function startSession(childId: string) {
  return api.post<StartSessionResponse>(`/api/children/${childId}/sessions`);
}

export function getNextExercise(childId: string, sessionId: string) {
  return api.get<ExercisePublic>(`/api/children/${childId}/next-exercise?sessionId=${sessionId}`);
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

export interface PauseEventInput {
  kind: "respiracion" | "movimiento";
  accepted: boolean;
  durationMs?: number;
}

export function submitPauseEvent(sessionId: string, input: PauseEventInput) {
  return api.post<{ id: string; accepted: boolean }>(`/api/sessions/${sessionId}/pause-events`, input);
}

export function getProgress(childId: string) {
  return api.get<ProgressResponse>(`/api/children/${childId}/progress`);
}
