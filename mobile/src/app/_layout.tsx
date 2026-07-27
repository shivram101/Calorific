// src/app/_layout.tsx
// UPDATED: Added all new screens to the Stack navigator.

import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Calorific", headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Log in", headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up", headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: "Get Started", headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset Password", headerShown: false }} />
      <Stack.Screen name="diary" options={{ title: "Diary", headerShown: false }} />
      <Stack.Screen name="barcode" options={{ title: "Scan Barcode", headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="trends" options={{ title: "Trends", headerShown: false }} />
      <Stack.Screen name="goals" options={{ title: "Goals", headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard", headerShown: false }} />
      <Stack.Screen name="food-detail" options={{ title: "Food Detail", headerShown: false }} />
      <Stack.Screen name="custom-food" options={{ title: "New Food", headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerShown: false }} />
    </Stack>
  );
}
