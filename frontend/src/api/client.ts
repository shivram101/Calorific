// src/api/client.ts
// Central API client for Calorific.
// All fetch calls go through here — pages import named functions instead of
// writing raw fetch calls with hardcoded URLs.
//
// AUTH0 MIGRATION NOTE: this file is a plain module, not a React component,
// so it can't use the useAuth0() hook to read the current session (hooks
// only work inside components). Instead we create a second, lightweight
// Auth0Client instance here using the same config as the Auth0Provider in
// main.tsx. Because both instances use cacheLocation: 'localstorage', they
// share the exact same underlying session — logging in via the Provider in
// main.tsx makes the token immediately available here too, with no extra
// network round-trip or duplicate login prompt.

import { Auth0Client } from '@auth0/auth0-spa-js';

// Dev: talk to the local backend directly.
// Production build: hit the deployed Azure backend directly.
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5001/api'
  : 'https://calorific-api-begdg4bhf0gga5d2.northcentralus-01.azurewebsites.net/api';

// Must exactly match the domain/clientId/audience used in main.tsx's
// Auth0Provider, or this instance won't see the same session.
const auth0Client = new Auth0Client({
  domain: 'dev-vqru0yyw14evmlui.us.auth0.com',
  clientId: 'WvuIm5jylPNX2XVVdr1Dt2reWtg6Mum2',
  authorizationParams: {
    audience: 'https://calorific-api.azurewebsites.net',
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
});

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  auth?: boolean;       // attach Bearer token (default: true for protected routes)
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
    try {
      // Returns a cached token if still valid, or silently refreshes it
      // using the active Auth0 session — never prompts a login redirect
      // from inside a plain fetch call.
      const token = await auth0Client.getTokenSilently();
      headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // No active Auth0 session. Proceed without a token — the backend
      // correctly rejects this with 401, and ProtectedRoute normally
      // redirects to login before this code path is even reachable.
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
// Registration, login, email verification, and password reset are all now
// handled by Auth0's hosted Universal Login page — this module no longer
// implements any of that itself. logout() and getStoredFirstName() remain
// here since pages already call them, now backed by Auth0 instead of a
// custom JWT.

export function logout(): void {
  auth0Client.logout({ logoutParams: { returnTo: window.location.origin } });
}

// Reads the user's first name from Auth0's cached session info (set after
// login completes), so pages can greet the user without an extra API call.
// Falls back to an empty string if the session hasn't loaded yet — pages
// already handle that by showing "there" as a friendly default.
export function getStoredFirstName(): string {
  try {
    const claims = JSON.parse(localStorage.getItem(
      `@@auth0spajs@@::WvuIm5jylPNX2XVVdr1Dt2reWtg6Mum2::https://calorific-api.azurewebsites.net::openid profile email`
    ) || 'null');
    const name = claims?.body?.decodedToken?.user?.given_name
      || claims?.body?.decodedToken?.user?.name;
    return name || '';
  } catch {
    return '';
  }
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
