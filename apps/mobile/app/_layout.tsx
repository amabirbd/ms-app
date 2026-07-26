import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0c3028" },
        headerTintColor: "#fff",
      }}
    />
  );
}
