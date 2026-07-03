import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

// Web-frontend equivalent: SignUpPage.tsx
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
      } else {
        setSuccess("Account created! Please check your email to verify.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FFF8ED]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Decorative background emoji */}
      <Text
        className="absolute text-[110px] opacity-50"
        style={{ top: -30, left: -30 }}
      >
        🍃
      </Text>
      <Text
        className="absolute text-[90px] opacity-50"
        style={{ bottom: -20, right: -10 }}
      >
        🥑
      </Text>
      <Text
        className="absolute text-[50px] opacity-30"
        style={{ top: "10%", right: "12%" }}
      >
        🍓
      </Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-14 items-center">
          {/* Card */}
          <View
            className="w-full max-w-[380px] bg-white rounded-3xl px-[26px] py-10"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.07,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
            }}
          >
            {/* Logo */}
            <View className="items-center mb-6">
              <Text className="text-4xl mb-2">🥗</Text>
              <Text className="text-xl font-semibold text-[#2D2A26]">
                Calorific
              </Text>
              <Text className="text-xs text-[#8A8378] mt-1">
                Create your account
              </Text>
            </View>

            {/* Error banner */}
            {!!error && (
              <View className="bg-[#FDF0EE] border border-[#DC4C3F] rounded-xl px-4 py-3 mb-4">
                <Text className="text-[#DC4C3F] text-[13px]">{error}</Text>
              </View>
            )}

            {/* Success banner */}
            {!!success && (
              <View className="bg-[#E1F5EE] border border-[#1FA873] rounded-xl px-4 py-3 mb-4">
                <Text className="text-[#0F6E56] text-[13px]">{success}</Text>
              </View>
            )}

            {/* Full name */}
            <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">
              Full name
            </Text>
            <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3.5 mb-3.5">
              <Ionicons name="person-outline" size={15} color="#b5ac9d" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#b5ac9d"
                className="flex-1 py-3 px-2 text-[13px] text-[#2D2A26]"
              />
            </View>

            {/* Email */}
            <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">
              Email address
            </Text>
            <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3.5 mb-3.5">
              <Ionicons name="mail-outline" size={15} color="#b5ac9d" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#b5ac9d"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-3 px-2 text-[13px] text-[#2D2A26]"
              />
            </View>

            {/* Password */}
            <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">
              Password
            </Text>
            <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3.5 mb-5">
              <Ionicons name="lock-closed-outline" size={15} color="#b5ac9d" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#b5ac9d"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-3 px-2 text-[13px] text-[#2D2A26]"
              />
            </View>

            {/* Confirm password */}
            <Text className="text-xs font-medium text-[#2D2A26] mb-1.5">
              Confirm password
            </Text>
            <View className="flex-row items-center bg-[#FFF8ED] rounded-xl px-3.5 mb-5">
              <Ionicons name="lock-closed-outline" size={15} color="#b5ac9d" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#b5ac9d"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-3 px-2 text-[13px] text-[#2D2A26]"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={submitting}
              className="w-full bg-[#1FA873] rounded-2xl py-3.5 items-center"
              style={{
                opacity: submitting ? 0.7 : 1,
                shadowColor: "#1FA873",
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <Text className="text-white text-[13px] font-semibold">
                {submitting ? "Signing up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Login link */}
            <View className="flex-row justify-center mt-5">
              <Text className="text-[13px] text-[#8A8378]">
                Already have an account?{" "}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-[13px] font-semibold text-[#1FA873]">
                    Log In
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
