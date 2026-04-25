import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Wrench, Phone, Camera, CircleCheck as CheckCircle, Clock, MapPin as MapTrack } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, StatusLabels, StatusColors, StatusButtonLabels, NextStatus, type Task } from '@/lib/theme';
import { locationTracker, type LocationCoordinate } from '@/lib/location';
import { TrackMap } from '@/components/TrackMap';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackLocations, setTrackLocations] = useState<LocationCoordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const fetchTask = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setTask(data as Task);
    }
    setLoading(false);
  }, [id]);

  const loadTrack = useCallback(async () => {
    if (!id) return;
    const locations = await locationTracker.getTaskTrack(id);
    setTrackLocations(locations);
  }, [id]);

  useEffect(() => {
    fetchTask();
    loadTrack();
  }, [fetchTask, loadTrack]);

  const startTracking = async () => {
    if (!id || !task) return;
    const success = await locationTracker.startTracking(id);
    if (success) {
      setIsTracking(true);
    }
  };

  const stopTracking = async () => {
    const locations = await locationTracker.stopTracking();
    setTrackLocations(locations);
    setIsTracking(false);
    await loadTrack();
  };

  const advanceStatus = async () => {
    if (!task) return;
    const nextStatus = NextStatus[task.status];
    if (!nextStatus) return;

    // Start tracking when leaving ('en_route')
    if (task.status === 'accepted' && nextStatus === 'en_route') {
      await startTracking();
    }

    // Stop tracking when finishing
    if (task.status === 'in_progress' && nextStatus === 'done') {
      await stopTracking();
    }

    setUpdating(true);
    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', task.id);

    if (!error) {
      setTask({ ...task, status: nextStatus });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Задача не найдена</Text>
      </View>
    );
  }

  const statusColor = StatusColors[task.status];
  const statusLabel = StatusLabels[task.status];
  const buttonLabel = StatusButtonLabels[task.status];
  const isDone = task.status === 'done';

  const statusSteps: { key: string; label: string }[] = [
    { key: 'new', label: 'Новая' },
    { key: 'accepted', label: 'Принята' },
    { key: 'en_route', label: 'В пути' },
    { key: 'in_progress', label: 'В работе' },
    { key: 'done', label: 'Выполнена' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === task.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Задача</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15', borderLeftColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBannerText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Wrench size={20} color={Colors.accent} strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Тип работ</Text>
                <Text style={styles.infoValue}>{task.task_type}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MapPin size={20} color={Colors.accent} strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Адрес</Text>
                <Text style={styles.infoValue}>{task.address}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Phone size={20} color={Colors.accent} strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Телефон клиента</Text>
                <Text style={styles.infoValue}>{task.client_phone}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Clock size={20} color={Colors.accent} strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Создана</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Прогресс</Text>
          <View style={styles.progressCard}>
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isLast = index === statusSteps.length - 1;
              const stepColor = isCompleted
                ? Colors.statusDone
                : isCurrent
                ? StatusColors[step.key]
                : Colors.textMuted;

              return (
                <View key={step.key} style={styles.stepContainer}>
                  <View style={styles.stepRow}>
                    <View style={[styles.stepCircle, { borderColor: stepColor, backgroundColor: isCompleted || isCurrent ? stepColor + '20' : 'transparent' }]}>
                      {isCompleted ? (
                        <CheckCircle size={18} color={stepColor} strokeWidth={2} />
                      ) : (
                        <View style={[styles.stepInnerDot, { backgroundColor: isCurrent ? stepColor : Colors.textMuted }]} />
                      )}
                    </View>
                    <Text style={[styles.stepLabel, { color: stepColor }]}>{step.label}</Text>
                  </View>
                  {!isLast && (
                    <View style={[styles.stepLine, { backgroundColor: isCompleted ? Colors.statusDone : Colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {(task.status === 'en_route' || task.status === 'in_progress' || task.status === 'done') && (
          <View style={styles.section}>
            <View style={styles.trackingHeader}>
              <Text style={styles.sectionTitle}>Маршрут</Text>
              {isTracking && (
                <View style={styles.trackingBadge}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Запись</Text>
                </View>
              )}
            </View>
            <TrackMap locations={trackLocations} />
            <Text style={styles.trackingInfo}>
              {trackLocations.length} точек отслеживания
            </Text>
          </View>
        )}

        {task.photos && task.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фото</Text>
            <View style={styles.photosRow}>
              {task.photos.map((url, i) => (
                <View key={i} style={styles.photoPlaceholder}>
                  <Camera size={24} color={Colors.textMuted} strokeWidth={1.5} />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!isDone && buttonLabel && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: statusColor }, updating && styles.actionButtonDisabled]}
            onPress={advanceStatus}
            disabled={updating}
            activeOpacity={0.8}>
            {updating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 34,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepContainer: {
    alignItems: 'flex-start',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepLine: {
    width: 2,
    height: 20,
    marginLeft: 15,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.danger + '20',
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  trackingInfo: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
