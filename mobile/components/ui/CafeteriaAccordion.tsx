import React, { useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/foundations/colors";
import Typography from "@/foundations/typography";
import Spacing from "@/foundations/spacing";

interface AccordionItemProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function Accordion({ options, selected, onSelect }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  const unselectedOptions = options.filter((o) => o !== selected);

  return (
    <View>
      <Pressable style={styles.selectedRow} onPress={() => setOpen((prev) => !prev)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.selectedText}>{selected}</Text>
        <FontAwesome name={open ? "chevron-up" : "chevron-right"} size={14} color={Colors.primary} />
      </Pressable>

      {open &&
        unselectedOptions.map((option) => (
          <Pressable
            key={option}
            style={styles.optionRow}
            onPress={() => {
              onSelect(option);
              setOpen(false);
            }}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  selectedText: {
    ...Typography.body1,
    color: Colors.primary,
  },
  optionRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionText: {
    ...Typography.body2,
    color: Colors.textPrimary,
  },
});
