import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Wrench, Phone, Clock } from 'lucide-react-native';
import { Colors, StatusLabels, StatusColors, type Task } from '@/lib/theme';

type TaskCardProps = {
  task: Task;
};

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '';
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)}ч ${minutes % 60}мин`;
}

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
        <View style={styles.rightContent}>
          {task.duration_minutes !== null && (
            <View style={styles.durationBadge}>
              <Clock size={12} color={Colors.statusDone} strokeWidth={2} />
              <Text style={styles.durationText}>{formatDuration(task.duration_minutes)}</Text>
            </View>
          )}
          <Text style={styles.workType}>{task.task_type}</Text>
        </View>
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
    alignItems: 'flex-start',
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
  rightContent: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  workType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.statusDone + '15',
    borderRadius: 10,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.statusDone,
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
