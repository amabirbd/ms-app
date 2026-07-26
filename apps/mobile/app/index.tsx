import { SafeAreaView, Text, View } from "react-native";
export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7f9" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ color: "#125c4a", fontWeight: "700", letterSpacing: 2 }}>
          MERIDIAN BUYER
        </Text>
        <Text
          style={{
            color: "#102238",
            fontWeight: "800",
            fontSize: 38,
            marginTop: 16,
          }}
        >
          Purchasing that moves with you.
        </Text>
        <Text
          style={{
            color: "#5b6878",
            fontSize: 17,
            lineHeight: 25,
            marginTop: 16,
          }}
        >
          Review approvals, reorder essentials, and track deliveries from your
          organization’s secure workspace.
        </Text>
      </View>
    </SafeAreaView>
  );
}
