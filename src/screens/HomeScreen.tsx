import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, LoanCase } from '../models/types';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { getCases, createCase } from '../database/database';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try { setCases(await getCases()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createCase(newName.trim());
    setNewName('');
    setShowNew(false);
    nav.navigate('CaseDetail', { caseId: id });
  };

  const processing = cases.filter(c => c.status === 'processing').length;
  const completed = cases.filter(c => c.status === 'completed').length;

  return (
    <View style={s.container}>
      <View style={s.stats}>
        <View style={[s.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={s.statNum}>{cases.length}</Text>
          <Text style={s.statLabel}>全部案件</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#fff3e0' }]}>
          <Text style={s.statNum}>{processing}</Text>
          <Text style={s.statLabel}>处理中</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={s.statNum}>{completed}</Text>
          <Text style={s.statLabel}>已完成</Text>
        </View>
      </View>

      <TouchableOpacity style={s.newBtn} onPress={() => setShowNew(true)}>
        <Text style={s.newBtnText}>+ 新建贷款案件</Text>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>案件列表</Text>
      <FlatList
        data={cases}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => nav.navigate('CaseDetail', { caseId: item.id })}>
            <View style={s.cardLeft}>
              <Text style={s.cardName}>{item.clientName}</Text>
              <Text style={s.cardMeta}>
                资料 {item.documents.length} 份 | {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: item.status === 'completed' ? '#e8f5e9' : '#fff3e0' }]}>
              <Text style={[s.badgeText, { color: item.status === 'completed' ? '#2e7d32' : '#e65100' }]}>
                {item.status === 'completed' ? '已完成' : '处理中'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>暂无案件，点击上方按钮新建</Text>
        }
      />

      <Modal visible={showNew} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>新建贷款案件</Text>
            <TextInput style={s.dialogInput} value={newName} onChangeText={setNewName} placeholder="输入客户姓名" placeholderTextColor={Colors.textLight} autoFocus />
            <View style={s.dialogActions}>
              <TouchableOpacity onPress={() => { setShowNew(false); setNewName(''); }}>
                <Text style={s.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleCreate}>
                <Text style={s.confirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stats: { flexDirection: 'row', padding: Spacing.lg, gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  statNum: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  newBtn: { backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  newBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderRadius: 12, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textLight, marginTop: 60 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.xl },
  dialogTitle: { fontSize: FontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.lg },
  dialogInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: Spacing.md, fontSize: FontSize.md, marginBottom: Spacing.lg },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: FontSize.md, paddingHorizontal: 12, paddingVertical: 8 },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  confirmText: { color: '#fff', fontWeight: '600' },
});
