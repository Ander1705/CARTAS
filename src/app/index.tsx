import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { getItem, setItem } from "../state/db";

export default function Index() {
  const hasIncremented = useRef(false);
  const [opens, setOpens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    async function incrementOpens() {
      try {
        const storedOpens = await getItem("app_opens");
        const parsedOpens = Number.parseInt(storedOpens ?? "", 10);
        const nextOpens = (Number.isNaN(parsedOpens) ? 0 : parsedOpens) + 1;
        await setItem("app_opens", String(nextOpens));
        setOpens(nextOpens);
      } catch (caughtError) {
        console.error(caughtError);
        setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
      }
    }

    void incrementOpens();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F14", alignItems: "center", justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ color: "#F5F7FA", fontSize: 28 }}>
        Contador Hi-Lo
      </Text>
      <Text style={{ color: error ? "#FF6B6B" : "#F5F7FA", fontSize: 18 }}>
        {error ? `Error de guardado: ${error}` : `Aperturas: ${opens ?? "\u2026"}`}
      </Text>
    </View>
  );
}
