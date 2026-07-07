// src/app/forgot-password.tsx
// New screen — calls POST /api/forgot-password via forgotPassword() from client.

import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { forgotPassword } from "../api/client";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
          <View
            className="w-full max-w-[380px] bg-white rounded-3xl px-[26px] py-10"
            style={{ shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 }}
          >
            {!sent ? (
              <>
                <View className="items-center mb-6">
                  <Text className="text-4xl mb-2">🔑</Text>
                  <Text className="text-xl font-semibold text-[#2D2A26]">Forgot password?</Text>
                  <Text className="text-xs text-[#8A8378] mt-1 text-center">No worries, we'll send you reset instructions</Text>
                </View>

                {!!error && (
                  <View className="bg-[#FDF0EE] border border-[#DC4C3F] rounded-xl px-4 py-3 mb-4">
                    <Text className="text-[#DC4C3F] text-[13px]">{error}</Text>
                  </View>
                )}

                <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">Email address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#b5ac9d"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-[#FFF8ED] rounded-xl px-4 py-3 text-sm text-[#2D2A26] mb-5"
                />

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#1FA873] rounded-2xl py-3.5 items-center"
                  style={{ opacity: loading ? 0.7 : 1, shadowColor: "#1FA873", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}
                >
                  <Text className="text-white text-[13px] font-semibold">
                    {loading ? "Sending..." : "Reset password"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center">
                <Text className="text-4xl mb-3">📩</Text>
                <Text className="text-xl font-semibold text-[#2D2A26] mb-2">Check your email</Text>
                <Text className="text-[13px] text-[#8A8378] text-center leading-5">
                  We've sent a reset link to{"\n"}
                  <Text className="font-semibold text-[#2D2A26]">{email}</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
              <Text className="text-[13px] font-semibold text-[#1FA873]">← Back to log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
