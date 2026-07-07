// src/api/client.ts
// Mobile API client for Calorific.
// Mirrors the web frontend's src/api/client.ts but uses:
// - AsyncStorage instead of localStorage for JWT (React Native requirement)
// - A configurable BASE_URL that works on real devices (not localhost)
//
// Usage:
//   import { login, register, searchFoods } from '../api/client';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the DigitalOcean droplet IP for production.
// For local dev on a physical device, replace with your machine's LAN IP
// (e.g. http://192.168.1.x:5000/api) — localhost won't reach your dev machine.
const BASE_URL = 'http://157.230.230.192/api';

// ─── Token helpers ─────────────────────────────────────────────────────────
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem('token', token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem('token');
}

// ─── Base fetch wrapper ────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  auth?: boolean;
  body?: unknown;
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
    const token = await getToken();
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
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
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
  await setToken(result.token);
  return result;
}

export async function logout(): Promise<void> {
  await clearToken();
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('POST', '/forgot-password', {
    auth: false,
    body: { email },
  });
}

// ─── Profile ───────────────────────────────────────────────────────────────
export interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  heightCm: number | null;
  weightKg: number | null;
  sex: string | null;
  activityLevel: string | null;
  goal: 'lose' | 'maintain' | 'gain' | null;
  createdAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('GET', '/profile');
}

export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'heightCm' | 'weightKg' | 'sex' | 'activityLevel' | 'goal'>>
): Promise<{ message: string }> {
  return request('PUT', '/profile', { body: updates });
}

// ─── Foods ─────────────────────────────────────────────────────────────────
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

export async function getFoodDetail(id: string): Promise<Food> {
  return request<Food>('GET', `/foods/${id}`);
}

export async function createCustomFood(food: {
  name: string;
  servingSize?: number;
  servingSizeUnit?: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}): Promise<Food> {
  return request<Food>('POST', '/foods/custom', { body: food });
}

// ─── Logs ──────────────────────────────────────────────────────────────────
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

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
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

export async function deleteLog(id: string): Promise<{ message: string }> {
  return request('DELETE', `/logs/${id}`);
}

// ─── Water ─────────────────────────────────────────────────────────────────
export interface DailyWater {
  date: string;
  entries: { _id: string; amountMl: number; date: string }[];
  totalMl: number;
}

export async function getWater(date: string): Promise<DailyWater> {
  return request<DailyWater>('GET', `/water?date=${date}`);
}

export async function addWater(amountMl: number, date: string): Promise<DailyWater> {
  return request<DailyWater>('POST', '/water', { body: { amountMl, date } });
}

// ─── Targets ───────────────────────────────────────────────────────────────
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

export async function setTargets(targets: {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}): Promise<Targets> {
  return request<Targets>('PUT', '/targets', { body: targets });
}

// ─── Progress ──────────────────────────────────────────────────────────────
export interface WeightEntry {
  _id: string;
  weightKg: number;
  date: string;
}

export async function logWeight(weightKg: number, date?: string): Promise<WeightEntry> {
  return request<WeightEntry>('POST', '/progress/weight', {
    body: { weightKg, date: date ?? todayString() },
  });
}

export async function getWeightHistory(range = 30): Promise<{ range: number; entries: WeightEntry[] }> {
  return request('GET', `/progress/weight?range=${range}`);
}
