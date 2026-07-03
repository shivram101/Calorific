import { Link } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

// Web-frontend equivalent: LandingPage.tsx
// Will be used to test other pages for now until they have been ported over...
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
      <Link href="/login" style={styles.link}> 
        Go to Login
      </Link>
      <Link href="/signup" style={styles.link}>
        Go to Sign Up
      </Link>
      <Link href="/onboarding" style={styles.link}>
        Go to Onboarding
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    marginTop: 20,
    fontSize: 18,
    color: "blue",
  },
});
