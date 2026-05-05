import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, StatusLabels } from '@/lib/theme';

const STATUSES = ['all', 'new', 'accepted', 'en_route', 'in_progress', 'done'] as const;
const STATUS_KEYS: Record<string, string> = {
  all: 'Все',
  ...StatusLabels,
};

type StatusFilterProps = {
  selected: string;
  onSelect: (status: string) => void;
};

export function StatusFilter({ selected, onSelect }: StatusFilterProps) {
  return (
    <View style={styles.container}>
      {STATUSES.map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.chip,
            selected === status && styles.chipActive,
          ]}
          onPress={() => onSelect(status)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.chipText,
              selected === status && styles.chipTextActive,
            ]}>
            {STATUS_KEYS[status]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
