import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Wrench, Phone } from 'lucide-react-native';
import { Colors, StatusLabels, StatusColors, type Task } from '@/lib/theme';

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  const statusColor = StatusColors[task.status] || Colors.textMuted;
  const statusLabel = StatusLabels[task.status] || task.status;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.workType}>{task.task_type}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.infoText} numberOfLines={2}>{task.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.infoText}>{task.client_phone}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoSection: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
});
