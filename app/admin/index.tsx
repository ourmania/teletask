import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { Plus, X, ChevronDown, Clock, User, Search, ListFilter as Filter, ChartBar as BarChart3, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Timer } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import {
  Colors,
  StatusLabels,
  StatusColors,
  type Task,
  type Installer,
} from '@/lib/theme';

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '--';
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

type TaskRow = Task & { installer_name: string | null };

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, installers:assigned_to(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const rows: TaskRow[] = data.map((t: any) => ({
        ...t,
        installer_name: t.installers?.name ?? null,
      }));
      setTasks(rows);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchInstallers = useCallback(async () => {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .order('name');

    if (!error && data) {
      setInstallers(data as Installer[]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchInstallers();
  }, [fetchTasks, fetchInstallers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.address.toLowerCase().includes(q) ||
        t.task_type.toLowerCase().includes(q) ||
        (t.installer_name && t.installer_name.toLowerCase().includes(q)) ||
        t.client_phone.includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const newCount = tasks.filter((t) => t.status === 'new').length;
  const completedWithDuration = tasks.filter((t) => t.duration_minutes !== null);
  const avgDuration =
    completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) /
            completedWithDuration.length
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 size={28} color={Colors.accent} strokeWidth={2} />
          <View>
            <Text style={styles.headerTitle}>Диспетчерская</Text>
            <Text style={styles.headerSubtitle}>Панель управления задачами</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}>
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Новая задача</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollPadding}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.statusNew }]}>
            <Text style={styles.statValue}>{newCount}</Text>
            <Text style={styles.statLabel}>Новых</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.statusInProgress }]}>
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>В работе</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.statusDone }]}>
            <Text style={styles.statValue}>{doneCount}</Text>
            <Text style={styles.statLabel}>Выполнено</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.accent }]}>
            <Text style={styles.statValue}>
              {avgDuration !== null ? formatDuration(avgDuration) : '--'}
            </Text>
            <Text style={styles.statLabel}>Ср. время</Text>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск по адресу, типу, монтажнику..."
              placeholderTextColor={Colors.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={Colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <Filter size={14} color={Colors.textMuted} strokeWidth={2} style={{ marginRight: 4 }} />
            <TouchableOpacity
              style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
              onPress={() => setFilterStatus(null)}>
              <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>
                Все ({tasks.length})
              </Text>
            </TouchableOpacity>
            {Object.entries(StatusLabels).map(([key, label]) => {
              const count = tasks.filter((t) => t.status === key).length;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, filterStatus === key && styles.filterChipActive]}
                  onPress={() => setFilterStatus(filterStatus === key ? null : key)}>
                  <View style={[styles.filterDot, { backgroundColor: StatusColors[key] }]} />
                  <Text style={[styles.filterChipText, filterStatus === key && styles.filterChipTextActive]}>
                    {label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Task Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thType]}>Тип работ</Text>
            <Text style={[styles.th, styles.thAddress]}>Адрес</Text>
            <Text style={[styles.th, styles.thInstaller]}>Монтажник</Text>
            <Text style={[styles.th, styles.thStatus]}>Статус</Text>
            <Text style={[styles.th, styles.thDuration]}>Время</Text>
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyTable}>
              <AlertCircle size={32} color={Colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTableText}>Задачи не найдены</Text>
            </View>
          ) : (
            filteredTasks.map((item) => {
              const statusColor = StatusColors[item.status] || Colors.textMuted;
              return (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.tdType]} numberOfLines={1}>
                    {item.task_type}
                  </Text>
                  <Text style={[styles.td, styles.tdAddress]} numberOfLines={2}>
                    {item.address}
                  </Text>
                  <View style={styles.tdInstaller}>
                    {item.installer_name ? (
                      <View style={styles.installerChip}>
                        <User size={10} color={Colors.accent} strokeWidth={2} />
                        <Text style={styles.installerName} numberOfLines={1}>
                          {item.installer_name}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noValue}>--</Text>
                    )}
                  </View>
                  <View style={styles.tdStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {StatusLabels[item.status] || item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tdDuration}>
                    {item.duration_minutes !== null ? (
                      <View style={styles.durationChip}>
                        <Timer size={10} color={Colors.statusDone} strokeWidth={2} />
                        <Text style={styles.durationText}>
                          {formatDuration(item.duration_minutes)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noValue}>--</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <CreateTaskModal
        visible={showCreate}
        installers={installers}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchTasks();
        }}
      />
    </View>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────

type CreateTaskModalProps = {
  visible: boolean;
  installers: Installer[];
  onClose: () => void;
  onCreated: () => void;
};

function CreateTaskModal({ visible, installers, onClose, onCreated }: CreateTaskModalProps) {
  const [taskType, setTaskType] = useState('');
  const [address, setAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedInstaller, setSelectedInstaller] = useState<string | null>(null);
  const [showInstallerPicker, setShowInstallerPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!taskType.trim() || !address.trim() || !clientPhone.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('tasks').insert({
      task_type: taskType.trim(),
      address: address.trim(),
      client_phone: clientPhone.trim(),
      status: 'new',
      assigned_to: selectedInstaller,
      photos: [],
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTaskType('');
    setAddress('');
    setClientPhone('');
    setSelectedInstaller(null);
    onCreated();
  };

  const selectedName = installers.find((i) => i.id === selectedInstaller)?.name ?? null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новая задача</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={Colors.danger} strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Тип работ *</Text>
            <TextInput
              style={styles.input}
              value={taskType}
              onChangeText={setTaskType}
              placeholder="Например: Установка роутера"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Адрес *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="ул. Пушкина, д. 10, кв. 5"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Телефон клиента *</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="+7 (900) 123-45-67"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Монтажник</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowInstallerPicker(!showInstallerPicker)}
              activeOpacity={0.7}>
              <Text style={[styles.pickerText, !selectedName && styles.pickerPlaceholder]}>
                {selectedName || 'Выберите монтажника'}
              </Text>
              <ChevronDown size={18} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {showInstallerPicker && (
              <View style={styles.pickerDropdown}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedInstaller(null);
                    setShowInstallerPicker(false);
                  }}>
                  <Text style={styles.pickerOptionTextMuted}>Не назначать</Text>
                </TouchableOpacity>
                {installers.map((inst) => (
                  <TouchableOpacity
                    key={inst.id}
                    style={[styles.pickerOption, selectedInstaller === inst.id && styles.pickerOptionSelected]}
                    onPress={() => {
                      setSelectedInstaller(inst.id);
                      setShowInstallerPicker(false);
                    }}>
                    <View style={styles.pickerOptionContent}>
                      <User
                        size={14}
                        color={selectedInstaller === inst.id ? Colors.accent : Colors.textSecondary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedInstaller === inst.id && styles.pickerOptionTextSelected,
                        ]}>
                        {inst.name}
                      </Text>
                    </View>
                    {inst.phone ? <Text style={styles.pickerOptionPhone}>{inst.phone}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.submitButtonText}>Создать задачу</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

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
    gap: 12,
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  // Controls
  controlsRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Filter
  filterRow: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Table
  tableContainer: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thType: { width: 120 },
  thAddress: { flex: 1, paddingHorizontal: 10 },
  thInstaller: { width: 120 },
  thStatus: { width: 100 },
  thDuration: { width: 80, textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  td: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  tdType: {
    width: 120,
    fontWeight: '500',
  },
  tdAddress: {
    flex: 1,
    paddingHorizontal: 10,
    color: Colors.textSecondary,
  },
  tdInstaller: {
    width: 120,
  },
  installerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  installerName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  noValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tdStatus: {
    width: 100,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tdDuration: {
    width: 80,
    alignItems: 'flex-end',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.statusDone + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.statusDone,
  },
  emptyTable: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTableText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    width: '90%',
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.danger + '15',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  pickerPlaceholder: {
    color: Colors.textMuted,
  },
  pickerDropdown: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '60',
  },
  pickerOptionSelected: {
    backgroundColor: Colors.accent + '10',
  },
  pickerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  pickerOptionTextMuted: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  pickerOptionPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: 22,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
