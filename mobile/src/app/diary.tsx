// src/app/diary.tsx
// Main diary/dashboard screen — equivalent of web DashboardPage.tsx
// Wired to real API: food search, diary logs, water tracking.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getLogs,
  addLog,
  deleteLog,
  searchFoods,
  getWater,
  addWater,
  logout,
  todayString,
  type Food,
  type LogEntry,
  type Meal,
} from "../api/client";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const TODAY = todayString();

export default function Diary() {
  const router = useRouter();

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [waterMl, setWaterMl] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Log food modal state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [addingLog, setAddingLog] = useState(false);

  const loadDiary = useCallback(async () => {
    try {
      const [log, water] = await Promise.all([
        getLogs(TODAY),
        getWater(TODAY),
      ]);
      setEntries(log.entries);
      setTotals(log.totals);
      setWaterMl(water.totalMl);
    } catch (err: any) {
      if (err.message?.includes("Invalid or expired token")) {
        await logout();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDiary(); }, [loadDiary]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchFoods(searchQuery.trim());
      setSearchResults(results);
    } catch (err: any) {
      Alert.alert("Search failed", err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddLog() {
    if (!selectedFood) return;
    setAddingLog(true);
    try {
      await addLog({
        foodId: selectedFood._id,
        quantity: Number(quantity) || 1,
        meal,
        date: TODAY,
      });
      setSelectedFood(null);
      setQuantity("1");
      setSearchQuery("");
      setSearchResults([]);
      setShowSearch(false);
      await loadDiary();
    } catch (err: any) {
      Alert.alert("Failed to log food", err.message);
    } finally {
      setAddingLog(false);
    }
  }

  async function handleDeleteLog(id: string) {
    Alert.alert("Remove entry", "Remove this food from your diary?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLog(id);
            await loadDiary();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  }

  async function handleAddWater(amount: number) {
    try {
      const result = await addWater(amount, TODAY);
      setWaterMl(result.totalMl);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const grouped = MEALS.reduce((acc, m) => {
    acc[m] = entries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<Meal, LogEntry[]>);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8ED] items-center justify-center">
        <ActivityIndicator size="large" color="#1FA873" />
        <Text className="text-[#8A8378] mt-3 text-sm">Loading your diary...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFF8ED]">
      {/* Header */}
      <View className="bg-white px-5 pt-12 pb-4" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-xs text-[#8A8378]">{today}</Text>
            <Text className="text-xl font-bold text-[#2D2A26]">Diary</Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <TouchableOpacity onPress={() => router.push("/barcode")} className="bg-[#E1F5EE] p-2 rounded-xl">
              <Ionicons name="barcode-outline" size={20} color="#1FA873" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#8A8378" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calorie summary */}
        <View className="bg-[#F0FBF6] rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-[#2D2A26]">Calories</Text>
            <Text className="text-2xl font-bold text-[#1FA873]">{totals.calories}</Text>
          </View>
          <View className="flex-row justify-between">
            {[
              { label: "Protein", value: totals.protein, color: "#DC4C3F" },
              { label: "Carbs", value: totals.carbs, color: "#EF9F27" },
              { label: "Fat", value: totals.fat, color: "#378ADD" },
            ].map(({ label, value, color }) => (
              <View key={label} className="items-center">
                <Text style={{ fontSize: 16, fontWeight: "700", color }}>{value}g</Text>
                <Text className="text-[10px] text-[#8A8378] mt-0.5">{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Water tracker */}
        <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-[#2D2A26]">💧 Water</Text>
            <Text className="text-sm font-bold text-[#378ADD]">{waterMl} ml</Text>
          </View>
          <View className="flex-row gap-2">
            {[150, 250, 350, 500].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => handleAddWater(amt)}
                className="flex-1 bg-[#EEF4FF] rounded-xl py-2 items-center"
              >
                <Text className="text-[11px] font-semibold text-[#378ADD]">+{amt}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meal sections */}
        {MEALS.map((m) => {
          const items = grouped[m];
          const mealCals = items.reduce((s, i) => s + i.calories, 0);
          return (
            <View key={m} className="bg-white rounded-2xl mb-3 overflow-hidden" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}>
              <View className="flex-row justify-between items-center px-4 py-3 bg-[#F9F7F4]">
                <Text className="text-sm font-bold text-[#2D2A26]">{MEAL_LABELS[m]}</Text>
                <Text className="text-xs text-[#8A8378]">{mealCals} kcal</Text>
              </View>
              {items.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="text-xs text-[#C7C2B8]">No entries yet</Text>
                </View>
              ) : (
                items.map((item) => (
                  <View key={item._id} className="flex-row justify-between items-center px-4 py-3 border-t border-[#F5F3F0]">
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold text-[#2D2A26]" numberOfLines={1}>{item.foodName}</Text>
                      <Text className="text-xs text-[#8A8378]">{item.quantity}x · {item.protein}g P · {item.carbs}g C · {item.fat}g F</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-sm font-bold text-[#2D2A26]">{item.calories} kcal</Text>
                      <TouchableOpacity onPress={() => handleDeleteLog(item._id)}>
                        <Ionicons name="close-circle-outline" size={18} color="#DC4C3F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}

        <View className="h-24" />
      </ScrollView>

      {/* Add food FAB */}
      <TouchableOpacity
        onPress={() => setShowSearch(true)}
        className="absolute bottom-8 right-6 bg-[#1FA873] w-14 h-14 rounded-full items-center justify-center"
        style={{ shadowColor: "#1FA873", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Food search modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-[#FFF8ED]">
          <View className="bg-white px-5 pt-12 pb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#2D2A26]">Add food</Text>
              <TouchableOpacity onPress={() => { setShowSearch(false); setSelectedFood(null); setSearchResults([]); setSearchQuery(""); }}>
                <Ionicons name="close" size={24} color="#2D2A26" />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View className="flex-row gap-2">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholder="Search foods..."
                placeholderTextColor="#b5ac9d"
                returnKeyType="search"
                className="flex-1 bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26]"
              />
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searching}
                className="bg-[#1FA873] rounded-xl px-4 items-center justify-center"
              >
                {searching ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="search" size={18} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/barcode")}
                className="bg-[#E1F5EE] rounded-xl px-3 items-center justify-center"
              >
                <Ionicons name="barcode-outline" size={20} color="#1FA873" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selected food — log form */}
          {selectedFood && (
            <View className="mx-4 mt-4 bg-white rounded-2xl p-4" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-sm font-bold text-[#2D2A26] flex-1 mr-2">{selectedFood.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <Ionicons name="close" size={18} color="#DC4C3F" />
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-[#8A8378] mb-3">
                Per serving: {selectedFood.calories} kcal · {selectedFood.protein}g P · {selectedFood.carbs}g C · {selectedFood.fat}g F
              </Text>

              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  className="bg-[#FFF8ED] rounded-xl px-4 py-2 text-sm text-[#2D2A26] w-20"
                />
                <Text className="text-sm text-[#8A8378] self-center">servings</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  {MEALS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMeal(m)}
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: meal === m ? "#1FA873" : "#FFF8ED" }}
                    >
                      <Text style={{ color: meal === m ? "#fff" : "#2D2A26", fontSize: 12, fontWeight: "600" }}>
                        {MEAL_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleAddLog}
                disabled={addingLog}
                className="bg-[#1FA873] rounded-xl py-3 items-center"
                style={{ opacity: addingLog ? 0.7 : 1 }}
              >
                <Text className="text-white text-sm font-semibold">
                  {addingLog ? "Adding..." : "Add to diary"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search results */}
          {!selectedFood && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              className="mt-2 px-4"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedFood(item)}
                  className="bg-white rounded-xl px-4 py-3 mb-2 flex-row justify-between items-center"
                  style={{ shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-semibold text-[#2D2A26]" numberOfLines={1}>{item.name}</Text>
                    {item.brand && <Text className="text-xs text-[#8A8378]">{item.brand}</Text>}
                  </View>
                  <Text className="text-sm font-bold text-[#1FA873]">{item.calories} kcal</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
