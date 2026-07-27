// src/app/goals.tsx
// Goals screen — set calorie & macro targets, with a built-in TDEE calculator.
// Prefills from the user's onboarding profile (GET /profile), estimates
// maintenance calories (Mifflin-St Jeor, or Katch-McArdle when body fat %
// is given), applies cut/maintain/bulk, offers macro splits, and saves via
// PUT /targets — which the diary and trends screens read.
//
// NOTE: onboarding collects age but the backend doesn't store it yet
// (profile has no age field) — so age is asked here. Small backend add later.
//
// Offline (server unreachable): the calculator still works with defaults and
// shows a sample-mode pill; saving is disabled with a clear message.

import { useState, useEffect } from "react";
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
import {
  getProfile,
  getTargets,
  setTargets,
  type Targets,
} from "../api/client";

const KG_PER_LB = 0.453592;
const CM_PER_IN = 2.54;

const ACTIVITY_LEVELS = [
  { label: "Sedentary", mult: 1.2 },
  { label: "Lightly active", mult: 1.375 },
  { label: "Active", mult: 1.55 },
  { label: "Very active", mult: 1.725 },
  { label: "Athlete", mult: 1.9 },
];

const GOAL_MODES = [
  { key: "lose", label: "Lose", delta: -500, blurb: "~1 lb/week down" },
  { key: "maintain", label: "Maintain", delta: 0, blurb: "Stay here" },
  { key: "gain", label: "Gain", delta: 500, blurb: "~1 lb/week up" },
];

// [protein%, fat%, carb%] — same trio as the web goals research
const MACRO_SPLITS = [
  { key: "moderate", label: "Moderate carb", note: "Balanced", pcts: [30, 35, 35] },
  { key: "lower", label: "Lower carb", note: "Highest protein", pcts: [40, 40, 20] },
  { key: "higher", label: "Higher carb", note: "High activity", pcts: [30, 20, 50] },
];

export default function GoalsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sampleMode, setSampleMode] = useState(false);
  const [currentTargets, setCurrentTargets] = useState<Targets | null>(null);

  // calculator inputs
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("22");
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  const [weightLbs, setWeightLbs] = useState("165");
  const [weightKgIn, setWeightKgIn] = useState("75");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [heightCmIn, setHeightCmIn] = useState("175");
  const [activityIdx, setActivityIdx] = useState(2);
  const [bodyFat, setBodyFat] = useState("");
  const [goalMode, setGoalMode] = useState("maintain");
  const [splitKey, setSplitKey] = useState("moderate");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [profile, targets] = await Promise.all([getProfile(), getTargets()]);
        setCurrentTargets(targets);
        if (profile.sex === "male" || profile.sex === "female") setSex(profile.sex);
        if (profile.weightKg) {
          setWeightKgIn(String(Math.round(profile.weightKg * 10) / 10));
          setWeightLbs(String(Math.round((profile.weightKg / KG_PER_LB) * 10) / 10));
        }
        if (profile.heightCm) {
          setHeightCmIn(String(Math.round(profile.heightCm)));
          const totalIn = profile.heightCm / CM_PER_IN;
          setHeightFt(String(Math.floor(totalIn / 12)));
          setHeightIn(String(Math.round(totalIn % 12)));
        }
        if (profile.activityLevel) {
          const idx = ACTIVITY_LEVELS.findIndex(a =>
            profile.activityLevel!.toLowerCase().startsWith(a.label.toLowerCase().slice(0, 4))
          );
          if (idx >= 0) setActivityIdx(idx);
        }
        if (profile.goal) setGoalMode(profile.goal);
        setSampleMode(false);
      } catch {
        setSampleMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- the math ----
  const kg = unit === "metric" ? Number(weightKgIn) || 0 : (Number(weightLbs) || 0) * KG_PER_LB;
  const cm =
    unit === "metric"
      ? Number(heightCmIn) || 0
      : ((Number(heightFt) || 0) * 12 + (Number(heightIn) || 0)) * CM_PER_IN;
  const ageN = Number(age) || 0;

  let bmr = 0;
  const bf = Number(bodyFat);
  const usingKatch = bodyFat !== "" && bf > 0 && bf < 60;
  if (kg > 0 && cm > 0 && ageN > 0) {
    bmr = usingKatch
      ? 370 + 21.6 * (kg * (1 - bf / 100))
      : 10 * kg + 6.25 * cm - 5 * ageN + (sex === "male" ? 5 : -161);
  }

  const tdee = Math.round(bmr * ACTIVITY_LEVELS[activityIdx].mult);
  const goal = GOAL_MODES.find(g => g.key === goalMode)!;
  const targetCalories = Math.max(tdee + goal.delta, 0);

  const split = MACRO_SPLITS.find(s => s.key === splitKey)!;
  const [pPct, fPct, cPct] = split.pcts;
  const proteinG = Math.round((targetCalories * pPct) / 100 / 4);
  const fatG = Math.round((targetCalories * fPct) / 100 / 9);
  const carbsG = Math.round((targetCalories * cPct) / 100 / 4);

  const ready = tdee > 0;

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      const updated = await setTargets({
        calorieTarget: targetCalories,
        proteinTarget: proteinG,
        carbTarget: carbsG,
        fatTarget: fatG,
      });
      setCurrentTargets(updated);
      setSaved(true);
      setTimeout(() => router.back(), 900);
    } catch {
      setSaveError("Couldn't reach the server — targets not saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center">
        <ActivityIndicator size="large" color="#1FA873" />
        <Text className="text-[#8A8378] mt-3 text-sm">Loading your goals...</Text>
      </View>
    );
  }

  const card = { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 } as const;

  return (
    <View className="flex-1 bg-[#FFF8ED]">
      {/* Header */}
      <View
        className="bg-white px-5 pt-12 pb-4"
        style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#2D2A26" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs text-[#8A8378]">Targets</Text>
            <Text className="text-xl font-bold text-[#2D2A26]">Goals</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {sampleMode && (
          <View className="bg-[#FAEEDA] border border-[#EF9F27] rounded-xl px-4 py-2.5 mb-3">
            <Text className="text-xs text-[#854F0B]">
              Couldn't reach the server — calculator works, saving is disabled.
            </Text>
          </View>
        )}

        {/* Current targets */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-1.5">Current goals</Text>
          {currentTargets ? (
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-base font-bold text-[#1FA873]">{currentTargets.calorieTarget}</Text>
                <Text className="text-[9px] text-[#8A8378]">kcal</Text>
              </View>
              <View className="items-center">
                <Text className="text-base font-bold text-[#DC4C3F]">{currentTargets.proteinTarget}g</Text>
                <Text className="text-[9px] text-[#8A8378]">protein</Text>
              </View>
              <View className="items-center">
                <Text className="text-base font-bold text-[#EF9F27]">{currentTargets.carbTarget}g</Text>
                <Text className="text-[9px] text-[#8A8378]">carbs</Text>
              </View>
              <View className="items-center">
                <Text className="text-base font-bold text-[#378ADD]">{currentTargets.fatTarget}g</Text>
                <Text className="text-[9px] text-[#8A8378]">fat</Text>
              </View>
            </View>
          ) : (
            <Text className="text-xs text-[#8A8378]">
              No goals set yet — calculate below, or you can track freely without any.
            </Text>
          )}
        </View>

        {/* Calculator */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Calculate</Text>

          {/* sex + units */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row gap-1.5">
              {(["male", "female"] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSex(s)}
                  className={`px-3 py-2 rounded-xl ${sex === s ? "bg-[#1FA873]" : "bg-[#FFF8ED]"}`}
                >
                  <Text className={`text-xs font-bold ${sex === s ? "text-white" : "text-[#8A8378]"}`}>
                    {s === "male" ? "Male" : "Female"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-1.5">
              {(["imperial", "metric"] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  className={`px-3 py-2 rounded-xl ${unit === u ? "bg-[#1FA873]" : "bg-[#FFF8ED]"}`}
                >
                  <Text className={`text-xs font-bold ${unit === u ? "text-white" : "text-[#8A8378]"}`}>
                    {u === "imperial" ? "lbs/ft" : "kg/cm"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* stat inputs — value + unit suffix inside each pill, no labels */}
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1 flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
              <TextInput
                className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
              <Text className="text-xs text-[#8A8378]">yrs</Text>
            </View>
            <View className="flex-[1.3] flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
              <TextInput
                className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
                keyboardType="decimal-pad"
                value={unit === "imperial" ? weightLbs : weightKgIn}
                onChangeText={unit === "imperial" ? setWeightLbs : setWeightKgIn}
              />
              <Text className="text-xs text-[#8A8378]">{unit === "imperial" ? "lbs" : "kg"}</Text>
            </View>
            {unit === "imperial" ? (
              <View className="flex-[1.4] flex-row items-center bg-[#FFF8ED] rounded-xl px-3 gap-1">
                <TextInput
                  className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
                  keyboardType="number-pad"
                  value={heightFt}
                  onChangeText={setHeightFt}
                />
                <Text className="text-xs text-[#8A8378]">ft</Text>
                <TextInput
                  className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
                  keyboardType="number-pad"
                  value={heightIn}
                  onChangeText={setHeightIn}
                />
                <Text className="text-xs text-[#8A8378]">in</Text>
              </View>
            ) : (
              <View className="flex-[1.4] flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
                <TextInput
                  className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
                  keyboardType="number-pad"
                  value={heightCmIn}
                  onChangeText={setHeightCmIn}
                />
                <Text className="text-xs text-[#8A8378]">cm</Text>
              </View>
            )}
          </View>

          {/* body fat (optional) */}
          <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3 mb-3">
            <TextInput
              className="flex-1 py-2.5 text-sm font-bold text-[#2D2A26]"
              keyboardType="decimal-pad"
              placeholder="Body fat — optional"
              placeholderTextColor="#B5AFA3"
              value={bodyFat}
              onChangeText={setBodyFat}
            />
            <Text className="text-xs text-[#8A8378]">%</Text>
          </View>

          {/* activity */}
          <View className="flex-row flex-wrap gap-1.5">
            {ACTIVITY_LEVELS.map((a, i) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => setActivityIdx(i)}
                className={`px-3 py-2 rounded-xl ${activityIdx === i ? "bg-[#1FA873]" : "bg-[#FFF8ED]"}`}
              >
                <Text className={`text-[11px] font-bold ${activityIdx === i ? "text-white" : "text-[#8A8378]"}`}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {ready && (
          <>
            {/* Maintenance */}
            <View className="bg-[#F0FBF6] rounded-2xl p-4 mb-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-sm font-semibold text-[#2D2A26]">Maintenance</Text>
                <Text className="text-2xl font-bold text-[#1FA873]">{tdee.toLocaleString()} kcal</Text>
              </View>
              <Text className="text-[10px] text-[#8A8378] mt-0.5">
                {usingKatch ? "Katch-McArdle formula" : "Mifflin-St Jeor formula"} • {ACTIVITY_LEVELS[activityIdx].label}
              </Text>
            </View>

            {/* Goal */}
            <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
              <Text className="text-sm font-bold text-[#2D2A26] mb-2">Your goal</Text>
              <View className="flex-row gap-2">
                {GOAL_MODES.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGoalMode(g.key)}
                    className={`flex-1 rounded-xl p-2.5 items-center ${
                      goalMode === g.key ? "bg-[#E1F5EE] border border-[#1FA873]" : "bg-[#FFF8ED]"
                    }`}
                  >
                    <Text className="text-xs font-bold text-[#2D2A26]">{g.label}</Text>
                    <Text className="text-sm font-bold text-[#1FA873] mt-0.5">
                      {(tdee + g.delta).toLocaleString()}
                    </Text>
                    <Text className="text-[9px] text-[#8A8378]">{g.blurb}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Macro split */}
            <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
              <Text className="text-sm font-bold text-[#2D2A26] mb-2">Macro split</Text>
              {MACRO_SPLITS.map(s => {
                const [p, f, c] = s.pcts;
                const pg = Math.round((targetCalories * p) / 100 / 4);
                const fg = Math.round((targetCalories * f) / 100 / 9);
                const cg = Math.round((targetCalories * c) / 100 / 4);
                const active = splitKey === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSplitKey(s.key)}
                    className={`rounded-xl p-3 mb-2 flex-row justify-between items-center ${
                      active ? "bg-[#E1F5EE] border border-[#1FA873]" : "bg-[#FFF8ED]"
                    }`}
                  >
                    <View>
                      <Text className="text-xs font-bold text-[#2D2A26]">{s.label}</Text>
                      <Text className="text-[9px] text-[#8A8378]">{s.note} • {p}/{f}/{c}</Text>
                    </View>
                    <View className="flex-row gap-3">
                      <Text className="text-xs font-bold text-[#DC4C3F]">{pg}g P</Text>
                      <Text className="text-xs font-bold text-[#EF9F27]">{cg}g C</Text>
                      <Text className="text-xs font-bold text-[#378ADD]">{fg}g F</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save */}
            {saveError !== "" && (
              <View className="bg-[#FDF0EE] border border-[#DC4C3F] rounded-xl px-4 py-2.5 mb-2">
                <Text className="text-xs text-[#DC4C3F]">{saveError}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || sampleMode}
              className={`rounded-2xl py-3.5 items-center ${sampleMode ? "bg-[#C7C2B8]" : "bg-[#1FA873]"}`}
            >
              <Text className="text-white text-sm font-bold">
                {saved ? "Saved ✓" : saving ? "Saving..." : `Save goals • ${targetCalories.toLocaleString()} kcal`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
