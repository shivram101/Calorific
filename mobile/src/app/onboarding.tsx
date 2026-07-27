// src/app/onboarding.tsx
// UPDATED: Was a placeholder. Now a real 3-step onboarding flow
// that calls PUT /api/profile via updateProfile() on completion.

import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { updateProfile } from "../api/client";

type GoalType = "lose" | "maintain" | "gain";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState<GoalType | "">("");
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    if (!activityLevel || !goal) {
      Alert.alert("Missing info", "Please select an activity level and goal");
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        goal: goal as GoalType,
      });
      router.replace("/diary");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  const ACTIVITIES = [
    { label: "Sedentary", icon: "🛋️" },
    { label: "Lightly active", icon: "🚶" },
    { label: "Active", icon: "🏃" },
    { label: "Very active", icon: "🏋️" },
  ];

  const GOALS: { label: GoalType; display: string; icon: string }[] = [
    { label: "lose", display: "Lose", icon: "📉" },
    { label: "maintain", display: "Maintain", icon: "⚖️" },
    { label: "gain", display: "Gain", icon: "📈" },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FFF8ED]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-14">
          {/* Progress */}
          <View className="flex-row gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{ backgroundColor: i <= step ? "#1FA873" : "#F0E9DA" }}
              />
            ))}
          </View>

          {/* Step 1: Body stats */}
          {step === 1 && (
            <View>
              <Text className="text-2xl font-semibold text-[#2D2A26] mb-1">Your body stats</Text>
              <Text className="text-sm text-[#8A8378] mb-6">Step 1 of 3</Text>

              <Text className="text-xs font-medium text-[#2D2A26] mb-2">Sex</Text>
              <View className="flex-row gap-3 mb-5">
                {["Male", "Female"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSex(s)}
                    className="flex-1 py-4 rounded-2xl items-center"
                    style={{ backgroundColor: sex === s ? "#1FA873" : "#FFF8ED" }}
                  >
                    <Text className="text-xl mb-1">{s === "Male" ? "♂️" : "♀️"}</Text>
                    <Text style={{ color: sex === s ? "#fff" : "#2D2A26", fontWeight: "600", fontSize: 13 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-medium text-[#2D2A26] mb-2">Height (cm)</Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="175"
                placeholderTextColor="#b5ac9d"
                keyboardType="numeric"
                className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26] mb-4"
              />

              <Text className="text-xs font-medium text-[#2D2A26] mb-2">Weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="70"
                placeholderTextColor="#b5ac9d"
                keyboardType="numeric"
                className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26] mb-8"
              />

              <TouchableOpacity
                onPress={() => setStep(2)}
                className="bg-[#1FA873] rounded-2xl py-3.5 items-center"
                style={{ shadowColor: "#1FA873", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
              >
                <Text className="text-white text-sm font-semibold">Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Activity */}
          {step === 2 && (
            <View>
              <Text className="text-2xl font-semibold text-[#2D2A26] mb-1">Activity level</Text>
              <Text className="text-sm text-[#8A8378] mb-6">Step 2 of 3</Text>

              <View className="gap-3 mb-8">
                {ACTIVITIES.map(({ label, icon }) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setActivityLevel(label)}
                    className="flex-row items-center px-4 py-4 rounded-2xl"
                    style={{ backgroundColor: activityLevel === label ? "#1FA873" : "#FFF8ED" }}
                  >
                    <Text className="text-lg mr-3">{icon}</Text>
                    <Text style={{ color: activityLevel === label ? "#fff" : "#2D2A26", fontWeight: "600", fontSize: 14 }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setStep(1)} className="flex-1 bg-[#FFF8ED] rounded-2xl py-3.5 items-center">
                  <Text className="text-[#2D2A26] text-sm font-semibold">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  className="flex-[2] bg-[#1FA873] rounded-2xl py-3.5 items-center"
                  style={{ shadowColor: "#1FA873", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
                >
                  <Text className="text-white text-sm font-semibold">Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <View>
              <Text className="text-2xl font-semibold text-[#2D2A26] mb-1">Your goal</Text>
              <Text className="text-sm text-[#8A8378] mb-6">Step 3 of 3</Text>

              <View className="flex-row gap-3 mb-8">
                {GOALS.map(({ label, display, icon }) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setGoal(label)}
                    className="flex-1 py-5 rounded-2xl items-center"
                    style={{ backgroundColor: goal === label ? "#1FA873" : "#FFF8ED" }}
                  >
                    <Text className="text-2xl mb-2">{icon}</Text>
                    <Text style={{ color: goal === label ? "#fff" : "#2D2A26", fontWeight: "700", fontSize: 13 }}>{display}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setStep(2)} className="flex-1 bg-[#FFF8ED] rounded-2xl py-3.5 items-center">
                  <Text className="text-[#2D2A26] text-sm font-semibold">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFinish}
                  disabled={submitting}
                  className="flex-[2] bg-[#1FA873] rounded-2xl py-3.5 items-center"
                  style={{ opacity: submitting ? 0.7 : 1, shadowColor: "#1FA873", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
                >
                  <Text className="text-white text-sm font-semibold">{submitting ? "Saving..." : "Finish"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
