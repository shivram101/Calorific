// src/app/trends.tsx
// Progress/Trends screen — mobile twin of the web ProgressPage.
// Stat cards, month calendar, weight trend, calorie bars vs target.
// Charts are plain Views — no chart/svg dependency needed.
// Wired to real API: /progress/weight, /progress/summary, /targets.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getWeightHistory,
  getProgressSummary,
  getTargets,
  logWeight,
  todayString,
  type WeightEntry,
  type DailySummary,
} from "../api/client";

const RANGES = [7, 30, 90];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const KG_PER_LB = 0.453592;

function sampleData(range: number) {
  const weights: WeightEntry[] = [];
  const summary: DailySummary[] = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const drift = (range - i) * (1.2 / range);
    if (i % 2 === 0) {
      weights.push({
        _id: date,
        date,
        weightKg: Math.round((82 - drift + Math.sin(i * 1.7) * 0.4) * 10) / 10,
      });
    }
    summary.push({
      date,
      calories: i % 7 === 3 ? 0 : Math.round(1950 + Math.sin(i * 2.3) * 350 + (i % 3) * 90),
      protein: Math.round(140 + Math.sin(i) * 30),
      carbs: Math.round(210 + Math.cos(i) * 40),
      fat: Math.round(65 + Math.sin(i * 1.3) * 12),
    });
  }
  return { weights, summary, calorieTarget: 2186 };
}

function buildMonthCells(monthDate: Date): (string | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

export default function TrendsScreen() {
  const router = useRouter();

  const [range, setRange] = useState(30);
  const [unit, setUnit] = useState<"kg" | "lbs">("lbs");
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sampleMode, setSampleMode] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayString());

  useEffect(() => {
    AsyncStorage.getItem("weight_unit").then(u => {
      if (u === "kg" || u === "lbs") setUnit(u);
    });
  }, []);

  function switchUnit(u: "kg" | "lbs") {
    setUnit(u);
    AsyncStorage.setItem("weight_unit", u);
  }

  const disp = (kg: number) =>
    unit === "kg" ? Math.round(kg * 10) / 10 : Math.round((kg / KG_PER_LB) * 10) / 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, s, t] = await Promise.all([
        getWeightHistory(range),
        getProgressSummary(range),
        getTargets(),
      ]);
      setWeights(w.entries ?? []);
      setSummary(s.summary ?? []);
      setCalorieTarget(t?.calorieTarget ?? null);
      setSampleMode(false);
    } catch {
      const demo = sampleData(range);
      setWeights(demo.weights);
      setSummary(demo.summary);
      setCalorieTarget(demo.calorieTarget);
      setSampleMode(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogWeight() {
    const entered = Number(weightInput);
    if (!entered || entered <= 0) return;
    const kg = unit === "kg" ? entered : Math.round(entered * KG_PER_LB * 10) / 10;
    setSavingWeight(true);
    try {
      await logWeight(kg);
      setWeightInput("");
      await load();
    } finally {
      setSavingWeight(false);
    }
  }

  // ---- derived ----
  const latest = weights.length ? weights[weights.length - 1].weightKg : null;
  const first = weights.length ? weights[0].weightKg : null;
  const change = latest !== null && first !== null ? Math.round((latest - first) * 10) / 10 : null;

  const loggedDays = summary.filter(d => d.calories > 0);
  const avgCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((a, d) => a + d.calories, 0) / loggedDays.length)
    : 0;
  const adherence =
    calorieTarget && loggedDays.length
      ? Math.round(
          (loggedDays.filter(d => d.calories <= calorieTarget * 1.1).length / loggedDays.length) * 100
        )
      : null;
  const avg = (key: "protein" | "carbs" | "fat") =>
    loggedDays.length
      ? Math.round(loggedDays.reduce((a, d) => a + d[key], 0) / loggedDays.length)
      : 0;

  const summaryByDate: Record<string, DailySummary> = {};
  summary.forEach(d => (summaryByDate[d.date] = d));
  const weightByDate: Record<string, number> = {};
  weights.forEach(w => (weightByDate[w.date] = w.weightKg));

  const selectedDay = summaryByDate[selectedDate];
  const selectedWeight = weightByDate[selectedDate];

  // weight chart bounds
  const wVals = weights.map(w => w.weightKg);
  const wMin = wVals.length ? Math.min(...wVals) : 0;
  const wMax = wVals.length ? Math.max(...wVals) : 1;
  const wSpan = wMax - wMin || 1;

  // calorie chart bounds
  const maxCal = Math.max(...summary.map(d => d.calories), calorieTarget ?? 0, 1) * 1.05;

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center">
        <ActivityIndicator size="large" color="#1FA873" />
        <Text className="text-[#8A8378] mt-3 text-sm">Loading your trends...</Text>
      </View>
    );
  }

  const stats = [
    { label: "Current weight", value: latest !== null ? `${disp(latest)} ${unit}` : "—" },
    {
      label: `Change (${range}d)`,
      value:
        change !== null
          ? `${change > 0 ? "+" : change < 0 ? "-" : ""}${disp(Math.abs(change))} ${unit}`
          : "—",
      green: change !== null && change < 0,
    },
    { label: "Avg calories", value: avgCalories ? String(avgCalories) : "—" },
    { label: "On target", value: adherence !== null ? `${adherence}%` : "—", green: true },
  ];

  return (
    <View className="flex-1 bg-[#FFF8ED]">
      {/* Header */}
      <View
        className="bg-white px-5 pt-12 pb-4"
        style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#2D2A26" />
            </TouchableOpacity>
            <View>
              <Text className="text-xs text-[#8A8378]">Progress</Text>
              <Text className="text-xl font-bold text-[#2D2A26]">Trends</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 30 }}>
        {sampleMode && (
          <View className="bg-[#FAEEDA] border border-[#EF9F27] rounded-xl px-4 py-2.5 mb-3">
            <Text className="text-xs text-[#854F0B]">
              Sample data — couldn't reach the server. Fills in automatically.
            </Text>
          </View>
        )}

        {/* Range + unit chips */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row gap-2">
            {RANGES.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                className={`px-4 py-2 rounded-xl ${range === r ? "bg-[#1FA873]" : "bg-white"}`}
              >
                <Text className={`text-xs font-bold ${range === r ? "text-white" : "text-[#8A8378]"}`}>
                  {r} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-1.5">
            {(["lbs", "kg"] as const).map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => switchUnit(u)}
                className={`px-3 py-2 rounded-xl ${unit === u ? "bg-[#1FA873]" : "bg-white"}`}
              >
                <Text className={`text-xs font-bold ${unit === u ? "text-white" : "text-[#8A8378]"}`}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stat cards */}
        <View className="flex-row flex-wrap gap-2.5 mb-3">
          {stats.map(s => (
            <View
              key={s.label}
              className="bg-white rounded-2xl px-4 py-3"
              style={{ width: "48%", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
            >
              <Text className={`text-lg font-bold ${s.green ? "text-[#1FA873]" : "text-[#2D2A26]"}`}>
                {s.value}
              </Text>
              <Text className="text-[10px] text-[#8A8378] mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View
          className="bg-white rounded-2xl p-4 mb-3"
          style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity
              onPress={() => setMonthDate(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="bg-[#FFF8ED] rounded-lg w-7 h-7 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={14} color="#2D2A26" />
            </TouchableOpacity>
            <Text className="text-sm font-bold text-[#2D2A26]">
              {monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </Text>
            <TouchableOpacity
              onPress={() => setMonthDate(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="bg-[#FFF8ED] rounded-lg w-7 h-7 items-center justify-center"
            >
              <Ionicons name="chevron-forward" size={14} color="#2D2A26" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap">
            {DOW.map((d, i) => (
              <View key={`${d}${i}`} style={{ width: "14.28%" }} className="items-center py-1">
                <Text className="text-[9px] font-bold text-[#C7C2B8]">{d}</Text>
              </View>
            ))}
            {buildMonthCells(monthDate).map((cell, idx) => {
              if (!cell) return <View key={`e${idx}`} style={{ width: "14.28%", height: 38 }} />;
              const day = summaryByDate[cell];
              const logged = day && day.calories > 0;
              const over = logged && calorieTarget ? day.calories > calorieTarget * 1.1 : false;
              const isSelected = cell === selectedDate;
              const isToday = cell === todayString();
              const bg = isSelected ? "#1FA873" : logged ? (over ? "#FAEEDA" : "#E1F5EE") : "transparent";
              const fg = isSelected ? "#fff" : logged ? (over ? "#854F0B" : "#085041") : "#8A8378";
              return (
                <TouchableOpacity
                  key={cell}
                  onPress={() => setSelectedDate(cell)}
                  style={{ width: "14.28%", height: 38 }}
                  className="items-center justify-center"
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: bg,
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      borderColor: "#1FA873",
                    }}
                  >
                    <Text className="text-[11px] font-bold" style={{ color: fg }}>
                      {Number(cell.slice(8, 10))}
                    </Text>
                    <View
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: cell in weightByDate ? (isSelected ? "#fff" : "#378ADD") : "transparent",
                      }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day detail */}
          <View className="bg-[#FFF8ED] rounded-xl px-3 py-2 mt-2">
            <Text className="text-[10px] font-bold text-[#8A8378]">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {selectedDay && selectedDay.calories > 0 ? (
              <View className="flex-row gap-3 mt-0.5 flex-wrap">
                <Text className="text-xs font-bold text-[#2D2A26]">{selectedDay.calories} kcal</Text>
                <Text className="text-xs font-bold text-[#DC4C3F]">{selectedDay.protein}g P</Text>
                <Text className="text-xs font-bold text-[#EF9F27]">{selectedDay.carbs}g C</Text>
                <Text className="text-xs font-bold text-[#378ADD]">{selectedDay.fat}g F</Text>
                {selectedWeight !== undefined && (
                  <Text className="text-xs text-[#8A8378]">{disp(selectedWeight)} {unit}</Text>
                )}
              </View>
            ) : (
              <Text className="text-xs text-[#8A8378] mt-0.5">
                {selectedWeight !== undefined
                  ? `Weighed in: ${disp(selectedWeight)} ${unit} — no food logged`
                  : "Nothing logged this day"}
              </Text>
            )}
          </View>
        </View>

        {/* Weight card */}
        <View
          className="bg-white rounded-2xl p-4 mb-3"
          style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-bold text-[#2D2A26]">Weight</Text>
              {change !== null && change !== 0 && (
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: change < 0 ? "#1FA873" : "#8A8378" }}
                >
                  {change > 0 ? "+" : "-"}{disp(Math.abs(change))} {unit} over {range} days
                </Text>
              )}
            </View>
          </View>

          {weights.length >= 2 ? (
            <View className="h-28 relative mb-1">
              {weights.map((w, i) => {
                const left = (i / (weights.length - 1)) * 92 + 4;
                const bottom = ((w.weightKg - wMin) / wSpan) * 75 + 10;
                return (
                  <View
                    key={w._id}
                    className="absolute w-2 h-2 rounded-full bg-[#1FA873]"
                    style={{ left: `${left}%`, bottom: `${bottom}%` }}
                  />
                );
              })}
              <Text className="absolute right-0 top-0 text-[9px] text-[#8A8378]">{disp(wMax)}</Text>
              <Text className="absolute right-0 bottom-0 text-[9px] text-[#8A8378]">{disp(wMin)}</Text>
            </View>
          ) : (
            <View className="bg-[#FFF8ED] rounded-xl py-6 items-center mb-1">
              <Text className="text-xs text-[#8A8378] text-center px-4">
                Not enough weigh-ins yet — log below and the trend builds itself.
              </Text>
            </View>
          )}

          <View className="flex-row gap-2 mt-2">
            <TextInput
              className="flex-1 bg-[#FFF8ED] rounded-xl px-3 py-2 text-sm text-[#2D2A26]"
              placeholder={`Today's weight (${unit})`}
              placeholderTextColor="#8A8378"
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <TouchableOpacity
              onPress={handleLogWeight}
              disabled={savingWeight}
              className="bg-[#1FA873] rounded-xl px-4 justify-center"
            >
              <Text className="text-white text-xs font-bold">{savingWeight ? "..." : "Log"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calories card */}
        <View
          className="bg-white rounded-2xl p-4 mb-3"
          style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold text-[#2D2A26]">Calories</Text>
            {calorieTarget && (
              <Text className="text-[11px] font-bold text-[#8A8378]">target {calorieTarget}</Text>
            )}
          </View>

          {loggedDays.length > 0 ? (
            <View className="h-28 relative">
              <View className="flex-row items-end h-full gap-[2px]">
                {summary.map(d => (
                  <View
                    key={d.date}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: d.calories > 0 ? `${Math.min((d.calories / maxCal) * 100, 100)}%` : 2,
                      backgroundColor: d.calories > 0 ? "#1FA873" : "#EFE9DE",
                    }}
                  />
                ))}
              </View>
              {calorieTarget && (
                <View
                  className="absolute left-0 right-0"
                  style={{
                    bottom: `${(calorieTarget / maxCal) * 100}%`,
                    borderTopWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: "#2D2A26",
                    opacity: 0.4,
                  }}
                />
              )}
            </View>
          ) : (
            <View className="bg-[#FFF8ED] rounded-xl py-6 items-center">
              <Text className="text-xs text-[#8A8378]">No logged days in this range yet.</Text>
            </View>
          )}
        </View>

        {/* Macro averages */}
        <View className="flex-row gap-2.5">
          {[
            { label: "Avg protein", value: avg("protein"), color: "#DC4C3F" },
            { label: "Avg carbs", value: avg("carbs"), color: "#EF9F27" },
            { label: "Avg fat", value: avg("fat"), color: "#378ADD" },
          ].map(m => (
            <View
              key={m.label}
              className="flex-1 bg-white rounded-2xl px-3 py-3 items-center"
              style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
            >
              <Text className="text-base font-bold" style={{ color: m.color }}>
                {m.value}g
              </Text>
              <Text className="text-[9px] text-[#8A8378] mt-0.5">{m.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
