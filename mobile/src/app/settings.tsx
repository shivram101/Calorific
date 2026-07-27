// src/app/settings.tsx
// Account settings — view/edit profile, change units preference, logout,
// and delete account (danger zone).
// Calls GET /api/profile, PUT /api/profile, DELETE /api/account.

import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, updateProfile, deleteAccount, logout, type UserProfile } from "../api/client";

export default function Settings() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain" | "">("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile()
      .then(p => {
        setProfile(p);
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setHeightCm(p.heightCm ? String(p.heightCm) : "");
        setWeightKg(p.weightKg ? String(p.weightKg) : "");
        setActivityLevel(p.activityLevel ?? "");
        setGoal((p.goal as typeof goal) ?? "");
      })
      .catch(() => Alert.alert("Error", "Couldn't load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        firstName,
        lastName,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        activityLevel: activityLevel || undefined,
        goal: goal || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  async function handleDelete() {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace("/login");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete account");
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center">
        <ActivityIndicator size="large" color="#1FA873" />
        <Text className="text-[#8A8378] mt-3 text-sm">Loading settings...</Text>
      </View>
    );
  }

  const ACTIVITIES = ["Sedentary", "Lightly active", "Active", "Very active"];
  const GOALS: { key: "lose" | "maintain" | "gain"; label: string; icon: string }[] = [
    { key: "lose", label: "Lose", icon: "📉" },
    { key: "maintain", label: "Maintain", icon: "⚖️" },
    { key: "gain", label: "Gain", icon: "📈" },
  ];

  const card = { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 } as const;

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
              <Text className="text-xs text-[#8A8378]">Account</Text>
              <Text className="text-xl font-bold text-[#2D2A26]">Settings</Text>
            </View>
          </View>
          {saved && (
            <View className="bg-[#E1F5EE] px-3 py-1.5 rounded-full">
              <Text className="text-[#0F6E56] text-xs font-bold">Saved ✓</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Account info (read only) */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Account</Text>
          <View className="flex-row items-center gap-3 bg-[#FFF8ED] rounded-xl px-4 py-3">
            <Ionicons name="mail-outline" size={16} color="#8A8378" />
            <Text className="text-sm text-[#2D2A26]">{profile?.email}</Text>
          </View>
          {profile?.isVerified && (
            <View className="flex-row items-center gap-1.5 mt-2 px-1">
              <Ionicons name="checkmark-circle" size={13} color="#1FA873" />
              <Text className="text-xs text-[#1FA873] font-medium">Email verified</Text>
            </View>
          )}
        </View>

        {/* Profile */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Profile</Text>

          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor="#b5ac9d"
                className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26]"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
                placeholderTextColor="#b5ac9d"
                className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26]"
              />
            </View>
          </View>

          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Height (cm)</Text>
              <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
                <TextInput
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="175"
                  placeholderTextColor="#b5ac9d"
                  keyboardType="numeric"
                  className="flex-1 py-3 text-sm text-[#2D2A26]"
                />
                <Text className="text-xs text-[#8A8378]">cm</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Weight (kg)</Text>
              <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
                <TextInput
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="70"
                  placeholderTextColor="#b5ac9d"
                  keyboardType="decimal-pad"
                  className="flex-1 py-3 text-sm text-[#2D2A26]"
                />
                <Text className="text-xs text-[#8A8378]">kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity level */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Activity level</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACTIVITIES.map(a => (
              <TouchableOpacity
                key={a}
                onPress={() => setActivityLevel(a)}
                className="px-3 py-2 rounded-xl"
                style={{ backgroundColor: activityLevel === a ? "#1FA873" : "#FFF8ED" }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: activityLevel === a ? "#fff" : "#8A8378" }}
                >
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Goal</Text>
          <View className="flex-row gap-2">
            {GOALS.map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setGoal(key)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: goal === key ? "#1FA873" : "#FFF8ED" }}
              >
                <Text className="text-lg mb-0.5">{icon}</Text>
                <Text
                  className="text-xs font-bold"
                  style={{ color: goal === key ? "#fff" : "#8A8378" }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-[#1FA873] rounded-2xl py-3.5 items-center mb-4"
          style={{
            opacity: saving ? 0.7 : 1,
            shadowColor: "#1FA873",
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <Text className="text-white text-sm font-bold">
            {saving ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-2xl py-3.5 items-center mb-3 flex-row justify-center gap-2"
          style={card}
        >
          <Ionicons name="log-out-outline" size={18} color="#2D2A26" />
          <Text className="text-sm font-bold text-[#2D2A26]">Log out</Text>
        </TouchableOpacity>

        {/* Danger zone */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#FAEAEA]" style={card}>
          <Text className="text-xs font-bold text-[#DC4C3F] mb-1">Danger zone</Text>
          <Text className="text-xs text-[#8A8378] mb-3">
            Permanently delete your account and all your data. This cannot be undone.
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            className="bg-[#FDF0EE] border border-[#DC4C3F] rounded-xl py-3 items-center"
            style={{ opacity: deleting ? 0.7 : 1 }}
          >
            <Text className="text-sm font-bold text-[#DC4C3F]">
              {deleting ? "Deleting..." : "Delete my account"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
