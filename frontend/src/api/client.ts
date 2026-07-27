// src/api/client.ts
// Central API client for Calorific.
// All fetch calls go through here — pages import named functions instead of
// writing raw fetch calls with hardcoded URLs.
//
// Usage examples:
//   import { login, register, searchFoods, getLogs } from '../api/client';
//   const { token, user } = await login('email@test.com', 'password123');

// Dev: talk to the local backend directly.
// Production build: use a relative /api path — nginx on the droplet forwards it to the backend.
const BASE_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
// The JWT is stored in localStorage after login and attached to every
// protected request automatically.

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  auth?: boolean;       // attach Bearer token (default: true for non-auth routes)
  body?: unknown;       // JSON body for POST/PUT
}

async function request<T>(
  method: Method,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, body } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the error message from the API so pages can display it directly
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterResult {
  message: string;
  userId: string;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<RegisterResult> {
  return request<RegisterResult>('POST', '/register', {
    auth: false,
    body: { email, password, firstName, lastName },
  });
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await request<LoginResult>('POST', '/login', {
    auth: false,
    body: { email, password },
  });
  // Store the JWT so all subsequent calls are automatically authenticated
  setToken(result.token);
  // Store first name so any page can greet the user without an extra API call
  localStorage.setItem('calorific_user', JSON.stringify({ firstName: result.user.firstName }));
  return result;
}

export function getStoredFirstName(): string {
  try {
    const raw = localStorage.getItem('calorific_user');
    if (raw) return JSON.parse(raw).firstName || '';
  } catch {}
  return '';
}

export function logout(): void {
  clearToken();
  window.location.href = '/login';
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return request<{ message: string }>('GET', `/verify-email/${token}`, { auth: false });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('POST', '/resend-verification', { auth: false, body: { email } });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('POST', '/forgot-password', {
    auth: false,
    body: { email },
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  return request<{ message: string }>('POST', `/reset-password/${token}`, {
    auth: false,
    body: { newPassword },
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: string | null;
  activityLevel: string | null;
  goal: 'lose' | 'maintain' | 'build' | 'gain' | null;
  createdAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('GET', '/profile');
}

export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'age' | 'heightCm' | 'weightKg' | 'sex' | 'activityLevel' | 'goal'>>
): Promise<{ message: string; updates: typeof updates }> {
  return request('PUT', '/profile', { body: updates });
}

export async function deleteAccount(): Promise<{ message: string }> {
  return request('DELETE', '/account');
}

// ─── Foods ────────────────────────────────────────────────────────────────────

export interface Food {
  _id: string;
  source: 'fdc' | 'user-submitted';
  fdcId?: number;
  name: string;
  brand: string | null;
  servingSize: number;
  servingSizeUnit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function searchFoods(query: string): Promise<Food[]> {
  return request<Food[]>('GET', `/foods/search?q=${encodeURIComponent(query)}`);
}

export async function createCustomFood(data: {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: number;
  servingSizeUnit?: string;
}): Promise<Food> {
  return request<Food>('POST', '/foods/custom', { body: data });
}

export async function getFoodDetail(id: string): Promise<Food> {
  return request<Food>('GET', `/foods/${id}`);
}

// ─── Micronutrients ───────────────────────────────────────────────────────────

export interface MicronutrientEntry {
  name: string;
  amount: number;
  unit: string;
}

export interface MicronutrientsResult {
  foodId: string;
  foodName: string;
  servingSize: number;
  servingSizeUnit: string;
  source: string;
  micronutrients: Record<string, MicronutrientEntry[]>;
}

export async function getMicronutrients(foodId: string): Promise<MicronutrientsResult> {
  return request<MicronutrientsResult>('GET', `/foods/${foodId}/micronutrients`);
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LogEntry {
  _id: string;
  userId: string;
  foodId: string;
  foodName: string;
  quantity: number;
  meal: Meal;
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  createdAt: string;
}

export interface DailyLog {
  date: string;
  entries: LogEntry[];
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

// Returns today's date as a YYYY-MM-DD string in the user's LOCAL timezone.
// toISOString() returns UTC which can be a day behind for US timezones — use
// toLocaleDateString('en-CA') instead, which gives "YYYY-MM-DD" in local time.
export function todayString(): string {
  return new Date().toLocaleDateString('en-CA');
}

export async function getLogs(date: string): Promise<DailyLog> {
  return request<DailyLog>('GET', `/logs?date=${date}`);
}

export async function addLog(entry: {
  foodId: string;
  quantity: number;
  meal: Meal;
  date: string;
}): Promise<LogEntry> {
  return request<LogEntry>('POST', '/logs', { body: entry });
}

export async function updateLog(
  id: string,
  updates: { quantity?: number; meal?: Meal }
): Promise<{ message: string }> {
  return request('PUT', `/logs/${id}`, { body: updates });
}

export async function deleteLog(id: string): Promise<{ message: string }> {
  return request('DELETE', `/logs/${id}`);
}

// ─── Water ────────────────────────────────────────────────────────────────────

export interface DailyWater {
  date: string;
  entries: { _id: string; amountMl: number; date: string; createdAt: string }[];
  totalMl: number;
}

export async function getWater(date: string): Promise<DailyWater> {
  return request<DailyWater>('GET', `/water?date=${date}`);
}

export async function addWater(amountMl: number, date: string): Promise<DailyWater> {
  return request<DailyWater>('POST', '/water', { body: { amountMl, date } });
}

export async function deleteWater(id: string): Promise<{ message: string }> {
  return request<{ message: string }>('DELETE', `/water/${id}`);
}

// ─── Targets ──────────────────────────────────────────────────────────────────

export interface Targets {
  _id: string;
  userId: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  updatedAt: string;
}

export async function getTargets(): Promise<Targets | null> {
  return request<Targets | null>('GET', '/targets');
}

export async function getSuggestedTargets(): Promise<{
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}> {
  return request('GET', '/targets/suggested');
}

export async function setTargets(targets: {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}): Promise<Targets> {
  return request<Targets>('PUT', '/targets', { body: targets });
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface WeightEntry {
  _id: string;
  userId: string;
  weightKg: number;
  date: string;
  createdAt: string;
}

export async function logWeight(weightKg: number, date?: string): Promise<WeightEntry> {
  return request<WeightEntry>('POST', '/progress/weight', {
    body: { weightKg, date: date ?? todayString() },
  });
}

export async function getWeightHistory(range = 30): Promise<{ range: number; entries: WeightEntry[] }> {
  return request('GET', `/progress/weight?range=${range}`);
}

export interface DailySummary {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function getProgressSummary(range = 30): Promise<{ range: number; summary: DailySummary[] }> {
  return request('GET', `/progress/summary?range=${range}`);
}
