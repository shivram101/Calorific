import { Text, View, StyleSheet } from "react-native";

// Web-frontend equivalent: LoginPage.tsx
export default function Login() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Edit src/app/login.tsx to edit this screen.</Text>
    </View>
  );
} 
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
