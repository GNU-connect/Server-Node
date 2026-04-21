import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import Colors from "@/foundations/colors";

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="meal"
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.backgroundPrimary,
        },
        headerShown: useClientOnlyValue(false, false),
      }}
    >
      <Tabs.Screen
        name="meal"
        options={{
          title: "학식",
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shuttle"
        options={{
          title: "셔틀",
          tabBarIcon: ({ color }) => <TabBarIcon name="bus" color={color} />,
        }}
      />
    </Tabs>
  );
}
