// src/app/barcode.tsx
// Barcode scanner screen — mobile-only stretch feature.
// Uses expo-camera to scan a barcode, looks up the UPC in the USDA FDC API,
// and if found navigates back to the diary with the food pre-selected.
//
// IMPORTANT: expo-camera must be installed first:
//   npx expo install expo-camera
//
// Also add camera permission to app.json:
//   "plugins": [["expo-camera", { "cameraPermission": "Allow Calorific to scan food barcodes." }]]

import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../api/client";

const BASE_URL = "http://157.230.230.192/api";

export default function BarcodeScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1FA873" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-off-outline" size={48} color="#8A8378" />
        <Text style={styles.permText}>Camera access is needed to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant camera access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#8A8378", fontSize: 14 }}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleBarCodeScanned({ data }: { type: string; data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/foods/barcode/${encodeURIComponent(data)}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const food = await response.json();

      if (!response.ok) {
        // 404 means the barcode isn't in the FDC branded foods database
        Alert.alert(
          "Food not found",
          food.error || `No food found for barcode ${data}. You can add it as a custom food.`,
          [
            { text: "Try again", onPress: () => setScanned(false) },
            { text: "Go back", onPress: () => router.back() },
          ]
        );
        return;
      }

      // Navigate to diary with the scanned food's _id so it can be pre-selected
      router.replace({
        pathname: "/diary",
        params: { scannedFoodId: food._id, scannedFoodName: food.name },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to look up barcode", [
        { text: "Try again", onPress: () => setScanned(false) },
        { text: "Go back", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "upc_e", "ean13", "ean8", "code128", "code39"],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hint}>
            {loading ? "Looking up food..." : "Point at a food barcode"}
          </Text>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1FA873" />
          </View>
        )}

        {/* Retry button if scanned but no result yet */}
        {scanned && !loading && (
          <View style={styles.retryContainer}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setScanned(false)}>
              <Text style={styles.retryText}>Scan again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8ED", padding: 24 },
  permText: { fontSize: 15, color: "#8A8378", textAlign: "center", marginTop: 16, marginBottom: 24, lineHeight: 22 },
  permBtn: { backgroundColor: "#1FA873", paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  permBtnText: { color: "white", fontWeight: "600", fontSize: 14 },
  overlay: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  title: { color: "white", fontSize: 17, fontWeight: "600" },
  viewfinderContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  viewfinder: { width: 260, height: 160, position: "relative", marginBottom: 20 },
  hint: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#1FA873", },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER },
  loadingContainer: { alignItems: "center", paddingBottom: 60 },
  retryContainer: { alignItems: "center", paddingBottom: 60 },
  retryBtn: { backgroundColor: "#1FA873", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  retryText: { color: "white", fontWeight: "600", fontSize: 15 },
});
