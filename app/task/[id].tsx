import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Wrench, Phone, Clock, Camera } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, StatusLabels, StatusColors, StatusButtonLabels, NextStatus, type Task } from '@/lib/theme';

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '';
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)}ч ${minutes % 60}мин`;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
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

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const advanceStatus = async () => {
    if (!task) return;
    const nextStatus = NextStatus[task.status];
    if (!nextStatus) return;

    setUpdating(true);

    const updates: Record<string, any> = { status: nextStatus };

    if (nextStatus === 'in_progress') {
      updates.in_progress_at = new Date().toISOString();
    }

    if (nextStatus === 'done') {
      updates.completed_at = new Date().toISOString();
      if (task.in_progress_at) {
        const start = new Date(task.in_progress_at).getTime();
        const end = Date.now();
        updates.duration_minutes = Math.round((end - start) / 60000);
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id);

    if (!error) {
      setTask({ ...task, ...updates });
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
        <Text style={styles.errorText}>Задача не найдена</Text>
      </View>
    );
  }

  const statusColor = StatusColors[task.status] || Colors.textMuted;
  const statusLabel = StatusLabels[task.status] || task.status;
  const nextStatus = NextStatus[task.status];
  const buttonLabel = nextStatus ? StatusButtonLabels[task.status] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.taskType}>{task.task_type}</Text>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MapPin size={18} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.infoText}>{task.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={18} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.infoText}>{task.client_phone}</Text>
        </View>
        {task.duration_minutes !== null && (
          <View style={styles.infoRow}>
            <Clock size={18} color={Colors.statusDone} strokeWidth={2} />
            <Text style={styles.durationText}>{formatDuration(task.duration_minutes)}</Text>
          </View>
        )}
      </View>

      {task.photos && task.photos.length > 0 && (
        <View style={styles.photosSection}>
          <View style={styles.sectionHeader}>
            <Camera size={18} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Фото ({task.photos.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
            {task.photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        </View>
      )}

      {buttonLabel && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: statusColor }]}
          onPress={advanceStatus}
          disabled={updating}
          activeOpacity={0.8}>
          {updating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskType: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  durationText: {
    fontSize: 15,
    color: Colors.statusDone,
    fontWeight: '600',
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  photoScroll: {
    gap: 10,
  },
  photo: {
    width: 160,
    height: 120,
    borderRadius: 10,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
