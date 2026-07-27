// src/app/login.tsx
// UPDATED: Replaced console.log placeholder with real login() API call.
// On success stores JWT via AsyncStorage and navigates to diary.

import { Link, useRouter } from "expo-router";
import { useState } from "react";
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
import { login } from "../api/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/diary");
    } catch (err: any) {
      Alert.alert("Login failed", err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

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
        <View className="px-6 py-14 items-center">
          {/* Badge */}
          <View className="bg-[#E1F5EE] px-3 py-1.5 rounded-full mb-4">
            <Text className="text-[#0F6E56] text-[11px] font-semibold">
              🌱 Welcome back
            </Text>
          </View>

          {/* Heading */}
          <Text className="text-[32px] font-semibold text-[#2D2A26] text-center leading-[38px] mb-3">
            Good to see you{"\n"}
            again, <Text className="text-[#1FA873]">friend.</Text>
          </Text>
          <Text className="text-sm text-[#8A8378] text-center max-w-[320px] mb-8 leading-5">
            Log in to keep tracking your meals, macros, and progress right
            where you left off.
          </Text>

          {/* Card */}
          <View
            className="w-full max-w-[420px] bg-white rounded-[18px] p-6"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
            }}
          >
            {/* Email */}
            <Text className="text-xs font-semibold text-[#2D2A26] mb-1.5">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8A8378"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-[#FFF8ED] border border-[#E3E8E5] rounded-xl px-4 py-3 text-sm text-[#2D2A26] mb-4"
            />

            {/* Password */}
            <Text className="text-xs font-semibold text-[#2D2A26] mb-1.5">
              Password
            </Text>
            <View className="flex-row items-center bg-[#FFF8ED] border border-[#E3E8E5] rounded-xl px-4 mb-2">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#8A8378"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-3 text-sm text-[#2D2A26]"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text className="text-[11px] font-semibold text-[#1FA873]">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <Link href="/forgot-password" asChild>
              <TouchableOpacity className="self-end mb-5">
                <Text className="text-xs font-semibold text-[#8A8378]">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Log in button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-[#1FA873] rounded-2xl py-3.5 items-center mb-5"
              style={{
                opacity: loading ? 0.7 : 1,
                shadowColor: "#1FA873",
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <Text className="text-white text-sm font-semibold">
                {loading ? "Logging in..." : "Log in"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-5">
              <View className="flex-1 h-[1px] bg-[#E3E8E5]" />
              <Text className="text-[10px] text-[#8A8378] mx-3">or</Text>
              <View className="flex-1 h-[1px] bg-[#E3E8E5]" />
            </View>

            {/* Sign up prompt */}
            <View className="flex-row justify-center">
              <Text className="text-xs text-[#8A8378]">
                Don't have an account?{" "}
              </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-xs font-semibold text-[#1FA873]">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
