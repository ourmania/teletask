import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => router.push('/admin')}
          activeOpacity={0.7}>
          <View style={styles.adminCardLeft}>
            <View style={styles.adminIcon}>
              <LayoutDashboard size={22} color={Colors.accent} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.adminTitle}>Диспетчерская</Text>
              <Text style={styles.adminSubtitle}>Панель управления задачами</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 16,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  adminCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  adminIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  adminSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
