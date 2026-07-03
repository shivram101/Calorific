import { Text, View, StyleSheet } from "react-native";

// Web-frontend equivalent: OnboardingPage.tsx
export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/onboarding.tsx to edit this screen.</Text>
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
