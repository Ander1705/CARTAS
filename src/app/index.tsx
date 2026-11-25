import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F14", alignItems: "center", justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ color: "#F5F7FA", fontSize: 28 }}>
        Contador Hi-Lo
      </Text>
    </View>
  );
}
