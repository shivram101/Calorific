// src/app/custom-food.tsx
// Lets users create a food not in the USDA database.
// Calls POST /api/foods/custom then navigates to food-detail with the new food's id.

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
import { Ionicons } from "@expo/vector-icons";
import { createCustomFood } from "../api/client";

interface Field {
  key: string;
  label: string;
  placeholder: string;
  unit: string;
  color?: string;
  required?: boolean;
}

const FIELDS: Field[] = [
  { key: "calories", label: "Calories", placeholder: "0", unit: "kcal", required: true },
  { key: "protein", label: "Protein", placeholder: "0", unit: "g", color: "#DC4C3F" },
  { key: "carbs", label: "Carbohydrates", placeholder: "0", unit: "g", color: "#EF9F27" },
  { key: "fat", label: "Fat", placeholder: "0", unit: "g", color: "#378ADD" },
];

export default function CustomFood() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("1");
  const [servingSizeUnit, setServingSizeUnit] = useState("serving");
  const [values, setValues] = useState<Record<string, string>>({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [saving, setSaving] = useState(false);

  function setField(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }));
  }

  const cal = Number(values.calories) || 0;
  const pro = Number(values.protein) || 0;
  const carb = Number(values.carbs) || 0;
  const fat = Number(values.fat) || 0;
  const macroCals = pro * 4 + carb * 4 + fat * 9;

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter a food name");
      return;
    }
    if (!values.calories || cal <= 0) {
      Alert.alert("Missing info", "Please enter the calories");
      return;
    }

    setSaving(true);
    try {
      const food = await createCustomFood({
        name: name.trim(),
        servingSize: Number(servingSize) || 1,
        servingSizeUnit: servingSizeUnit.trim() || "serving",
        calories: cal,
        protein: pro,
        carbs: carb,
        fat,
      });
      // Navigate to food-detail so user can immediately log it
      router.replace({ pathname: "/food-detail", params: { foodId: food._id } });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create food");
    } finally {
      setSaving(false);
    }
  }

  const card = { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 } as const;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FFF8ED]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            <Text className="text-xs text-[#8A8378]">Add food</Text>
            <Text className="text-xl font-bold text-[#2D2A26]">New Food</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Preview */}
        {cal > 0 && (
          <View className="bg-[#F0FBF6] rounded-2xl p-4 mb-3">
            <Text className="text-sm font-semibold text-[#2D2A26] mb-2">
              {name.trim() || "New food"} · {servingSize} {servingSizeUnit}
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#1FA873]">{cal}</Text>
                <Text className="text-[10px] text-[#8A8378]">kcal</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-[#DC4C3F]">{pro}g</Text>
                <Text className="text-[10px] text-[#8A8378]">protein</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-[#EF9F27]">{carb}g</Text>
                <Text className="text-[10px] text-[#8A8378]">carbs</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-[#378ADD]">{fat}g</Text>
                <Text className="text-[10px] text-[#8A8378]">fat</Text>
              </View>
            </View>
            {macroCals > 0 && Math.abs(macroCals - cal) > 20 && (
              <Text className="text-[10px] text-[#EF9F27] mt-2">
                ⚠ Macro calories ({macroCals} kcal) don't quite match total — double check your numbers
              </Text>
            )}
          </View>
        )}

        {/* Food name */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Food details</Text>

          <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Food name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Grandma's Chicken Soup"
            placeholderTextColor="#b5ac9d"
            className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26] mb-4"
          />

          <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Serving size</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="1"
              placeholderTextColor="#b5ac9d"
              keyboardType="decimal-pad"
              className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26] w-24"
            />
            <TextInput
              value={servingSizeUnit}
              onChangeText={setServingSizeUnit}
              placeholder="serving"
              placeholderTextColor="#b5ac9d"
              className="flex-1 bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26]"
            />
          </View>
        </View>

        {/* Nutrition fields */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Nutrition per serving</Text>
          {FIELDS.map(({ key, label, placeholder, unit, color, required }) => (
            <View key={key} className="mb-3">
              <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">
                {label} {required ? "*" : ""}
              </Text>
              <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-4">
                <TextInput
                  value={values[key]}
                  onChangeText={v => setField(key, v)}
                  placeholder={placeholder}
                  placeholderTextColor="#b5ac9d"
                  keyboardType="decimal-pad"
                  className="flex-1 py-3 text-sm text-[#2D2A26] font-bold"
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: color ?? "#8A8378" }}
                >
                  {unit}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-3 pb-8"
        style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-[#1FA873] rounded-2xl py-3.5 items-center"
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
            {saving ? "Saving..." : "Save food & log it"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
