// src/app/food-detail.tsx
// Shows full nutrient breakdown for a food item before logging it.
// Receives foodId + optional preselected meal via router params.
// Calls GET /api/foods/:id, then POST /api/logs on confirm.

import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { getFoodDetail, addLog, todayString, type Food, type Meal } from "../api/client";

const MEALS: { key: Meal; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "☀️" },
  { key: "lunch", label: "Lunch", icon: "🌤️" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
  { key: "snack", label: "Snack", icon: "🍎" },
];

export default function FoodDetail() {
  const router = useRouter();
  const { foodId, meal: mealParam } = useLocalSearchParams<{ foodId: string; meal?: string }>();

  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState("1");
  const [meal, setMeal] = useState<Meal>((mealParam as Meal) || "breakfast");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!foodId) return;
    getFoodDetail(foodId)
      .then(setFood)
      .catch(() => Alert.alert("Error", "Couldn't load food details"))
      .finally(() => setLoading(false));
  }, [foodId]);

  const qty = Math.max(Number(quantity) || 1, 0.1);
  const cal = Math.round((food?.calories ?? 0) * qty);
  const pro = Math.round((food?.protein ?? 0) * qty * 10) / 10;
  const fat = Math.round((food?.fat ?? 0) * qty * 10) / 10;
  const carb = Math.round((food?.carbs ?? 0) * qty * 10) / 10;

  async function handleAdd() {
    if (!food) return;
    setAdding(true);
    try {
      await addLog({ foodId: food._id, quantity: qty, meal, date: todayString() });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log food");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center">
        <ActivityIndicator size="large" color="#1FA873" />
        <Text className="text-[#8A8378] mt-3 text-sm">Loading food details...</Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center px-6">
        <Text className="text-lg font-bold text-[#2D2A26] mb-2">Food not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#1FA873] font-semibold">← Go back</Text>
        </TouchableOpacity>
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
          <View className="flex-1">
            <Text className="text-xs text-[#8A8378]" numberOfLines={1}>
              {food.brand ?? "Food detail"}
            </Text>
            <Text className="text-xl font-bold text-[#2D2A26]" numberOfLines={1}>
              {food.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Macro summary */}
        <View className="bg-[#F0FBF6] rounded-2xl p-4 mb-3">
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-sm font-semibold text-[#2D2A26]">
              {qty} × {food.servingSize}{food.servingSizeUnit}
            </Text>
            <Text className="text-3xl font-bold text-[#1FA873]">{cal} kcal</Text>
          </View>
          <View className="flex-row justify-between">
            {[
              { label: "Protein", value: pro, unit: "g", color: "#DC4C3F" },
              { label: "Carbs", value: carb, unit: "g", color: "#EF9F27" },
              { label: "Fat", value: fat, unit: "g", color: "#378ADD" },
            ].map(({ label, value, unit: u, color }) => (
              <View key={label} className="items-center">
                <Text style={{ fontSize: 18, fontWeight: "700", color }}>{value}{u}</Text>
                <Text className="text-[10px] text-[#8A8378] mt-0.5">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Serving size + quantity */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Serving size</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setQuantity(String(Math.max(0.5, qty - 0.5)))}
              className="w-10 h-10 bg-[#FFF8ED] rounded-xl items-center justify-center"
            >
              <Ionicons name="remove" size={18} color="#2D2A26" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-[#FFF8ED] rounded-xl px-3">
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                className="flex-1 py-2.5 text-lg font-bold text-[#2D2A26] text-center"
              />
              <Text className="text-xs text-[#8A8378]">servings</Text>
            </View>
            <TouchableOpacity
              onPress={() => setQuantity(String(qty + 0.5))}
              className="w-10 h-10 bg-[#1FA873] rounded-xl items-center justify-center"
            >
              <Ionicons name="add" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-[#8A8378] text-center mt-2">
            1 serving = {food.servingSize} {food.servingSizeUnit}
          </Text>
        </View>

        {/* Meal selector */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Add to meal</Text>
          <View className="flex-row gap-2">
            {MEALS.map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setMeal(key)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: meal === key ? "#1FA873" : "#FFF8ED" }}
              >
                <Text className="text-base mb-0.5">{icon}</Text>
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: meal === key ? "#fff" : "#8A8378" }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrient breakdown */}
        <View className="bg-white rounded-2xl p-4 mb-3" style={card}>
          <Text className="text-sm font-bold text-[#2D2A26] mb-3">Nutrition facts</Text>
          <Text className="text-xs text-[#8A8378] mb-3">Per {qty} serving{qty !== 1 ? "s" : ""}</Text>
          {[
            { label: "Calories", value: `${cal} kcal`, bold: true },
            { label: "Protein", value: `${pro}g`, color: "#DC4C3F" },
            { label: "Carbohydrates", value: `${carb}g`, color: "#EF9F27" },
            { label: "Fat", value: `${fat}g`, color: "#378ADD" },
          ].map(({ label, value, bold, color }) => (
            <View
              key={label}
              className="flex-row justify-between py-2.5 border-b border-[#F5F3F0]"
            >
              <Text
                className="text-sm"
                style={{ color: "#2D2A26", fontWeight: bold ? "700" : "500" }}
              >
                {label}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{ color: color ?? "#2D2A26" }}
              >
                {value}
              </Text>
            </View>
          ))}

          {food.source === "fdc" && (
            <Text className="text-[9px] text-[#C7C2B8] mt-3">
              Source: USDA FoodData Central
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add to diary button — fixed at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-3 pb-8"
        style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
      >
        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding}
          className="bg-[#1FA873] rounded-2xl py-3.5 items-center"
          style={{
            opacity: adding ? 0.7 : 1,
            shadowColor: "#1FA873",
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <Text className="text-white text-sm font-bold">
            {adding ? "Adding..." : `Add ${cal} kcal to ${meal}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
