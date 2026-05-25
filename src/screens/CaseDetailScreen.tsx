import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, LoanCase, DocTypeLabels, DocOrder } from '../models/types';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { getCase, deleteCase } from '../database/database';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CaseDetail'>;
type Route = RouteProp<RootStackParamList, 'CaseDetail'>;

export default function CaseDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [c, setC] = useState<LoanCase | null>(null);

  const load = useCallback(async () => setC(await getCase(route.params.caseId)), [route.params.caseId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!c) return <View style={s.center}><Text style={{ color: Colors.textSecondary }}>加载中...</Text></View>;

  const info = c.extractedInfo;

  // 按PDF排列顺序统计
  const docStats = DocOrder.map(t => ({
    type: t,
    label: DocTypeLabels[t],
    count: c.documents.filter(d => d.type === t).length,
  })).filter(d => d.label);

  const hasInfo = info.name || info.idNumber;
  const hasPdf = !!c.pdfUri;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      {/* 头部信息 */}
      <View style={s.header}>
        <Text style={s.clientName}>{c.clientName}</Text>
        <View style={[s.badge, { backgroundColor: c.status === 'completed' ? '#e8f5e9' : '#fff3e0' }]}>
          <Text style={[s.badgeText, { color: c.status === 'completed' ? '#2e7d32' : '#e65100' }]}>
            {c.status === 'completed' ? '已完成' : '处理中'}
          </Text>
        </View>
      </View>

      {/* 操作流程 */}
      <Text style={s.secTitle}>工作流程</Text>
      <View style={s.workflow}>
        <Step icon={c.documents.length > 0 ? '?' : '??'} label="拍摄/导入资料" desc={c.documents.length > 0 ? `已拍 ${c.documents.length} 份` : '点击开始收集资料'} onPress={() => nav.navigate('DocumentManager', { caseId: c.id })} />
        <Step icon={hasInfo ? '?' : '??'} label="提取客户信息" desc={hasInfo ? `${info.name} / ${info.idNumber}` : '从身份证OCR提取或手动录入'} onPress={() => nav.navigate('InfoExtractor', { caseId: c.id })} />
        <Step icon={hasPdf ? '?' : '??'} label="编译审批PDF" desc={hasPdf ? '已生成，可重新编译' : `${c.documents.length}份资料 → 按序合稿`} onPress={() => nav.navigate('PdfCompiler', { caseId: c.id })} />
      </View>

      {/* 资料清单（按PDF顺序显示） */}
      <Text style={s.secTitle}>资料清单（{c.documents.length}份）</Text>
      <View style={s.docGrid}>
        {docStats.map(d => (
          <View key={d.type} style={[s.docTypeCard, d.count > 0 && s.docTypeCardHas]}>
            <Text style={[s.docTypeLabel, d.count > 0 && { color: Colors.text, fontWeight: '600' }]}>{d.label}</Text>
            <Text style={[s.docTypeCount, d.count > 0 && { color: Colors.primary }]}>{d.count}份</Text>
          </View>
        ))}
      </View>

      {/* 信息摘要 */}
      {hasInfo && (
        <>
          <Text style={s.secTitle}>已提取信息</Text>
          <View style={s.infoCard}>
            <InfoLine label="客户姓名" value={info.name} />
            <InfoLine label="身份证号" value={info.idNumber} />
            <InfoLine label="手机号" value={info.phone} />
            <InfoLine label="配偶" value={info.spouseName || '-'} />
            <InfoLine label="营业执照" value={info.companyName || '-'} />
          </View>
        </>
      )}

      {/* 底部按钮 */}
      <View style={s.bottom}>
        {c.status === 'processing' && hasPdf && (
          <TouchableOpacity style={s.actionBtn} onPress={() => {}}>
            <Text style={s.actionBtnText}>? 已完成 — 查看PDF</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.deleteBtn} onPress={() => {
          Alert.alert('删除案件', '确定删除？所有资料将丢失。', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: async () => { await deleteCase(c.id); nav.goBack(); }},
          ]);
        }}>
          <Text style={s.deleteBtnText}>删除案件</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Step({ icon, label, desc, onPress }: { icon: string; label: string; desc: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={stepStyle.card} onPress={onPress}>
      <Text style={stepStyle.icon}>{icon}</Text>
      <View style={stepStyle.text}>
        <Text style={stepStyle.label}>{label}</Text>
        <Text style={stepStyle.desc}>{desc}</Text>
      </View>
      <Text style={stepStyle.arrow}>?</Text>
    </TouchableOpacity>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoLine}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const stepStyle = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.sm },
  icon: { fontSize: 24, marginRight: 12 },
  text: { flex: 1 },
  label: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  desc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 24, color: Colors.textLight },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.xl, margin: Spacing.lg, borderRadius: 12 },
  clientName: { fontSize: FontSize.xl, fontWeight: '700' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  secTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md },
  workflow: { marginHorizontal: Spacing.lg },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: Spacing.lg, gap: 6 },
  docTypeCard: { width: '31%', backgroundColor: Colors.surface, borderRadius: 8, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.divider },
  docTypeCardHas: { borderColor: Colors.primary, backgroundColor: '#eef4ff' },
  docTypeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  docTypeCount: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  infoCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg },
  infoLine: { flexDirection: 'row', marginVertical: 3 },
  infoLabel: { width: 72, fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  bottom: { padding: Spacing.xl, gap: 10 },
  actionBtn: { backgroundColor: Colors.secondary, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  deleteBtn: { borderRadius: 12, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger },
  deleteBtnText: { color: Colors.danger },
});
