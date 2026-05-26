import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList, LoanCase, DocTypeLabels, DocOrder } from '../models/types';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { getCase, updateCasePdf } from '../database/database';
import { compileFinalPdf } from '../utils/pdfCompiler';

type Route = RouteProp<RootStackParamList, 'PdfCompiler'>;

export default function PdfCompilerScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const [c, setC] = useState<LoanCase | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [pdfUri, setPdfUri] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getCase(route.params.caseId);
      setC(data);
      if (data?.pdfUri && await FileSystem.getInfoAsync(data.pdfUri).then(r => r.exists).catch(() => false)) {
        setPdfUri(data.pdfUri);
      }
    })();
  }, []);

  if (!c) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  // 按 PDF 顺序列资料清单
  const docOrderCheck = DocOrder.map(t => ({
    type: t,
    label: DocTypeLabels[t],
    count: c.documents.filter(d => d.type === t).length,
  })).filter(d => d.label);

  const totalDocs = c.documents.length;
  const hasInfo = c.extractedInfo.name || c.extractedInfo.idNumber;

  const handleCompile = async () => {
    if (totalDocs === 0) {
      Alert.alert('资料不足', '请先拍摄资料');
      return;
    }
    if (!hasInfo) {
      Alert.alert('信息不足', '建议先提取客户信息');
      return;
    }

    setCompiling(true);
    try {
      const uri = await compileFinalPdf(c);
      await updateCasePdf(c.id, uri);
      setPdfUri(uri);
      Alert.alert('编译成功', '审批资料 PDF 已生成');
    } catch (e: any) {
      Alert.alert('编译失败', e.message);
    }
    setCompiling(false);
  };

  const handleShare = async () => {
    if (!pdfUri) return;
    try {
      await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf' });
    } catch {
      Alert.alert('分享失败');
    }
  };

  return (
    <ScrollView style={s.container}>
      {/* 编译概览 */}
      <View style={s.summary}>
        <Text style={s.summaryTitle}>审批资料编译</Text>
        <Text style={s.summaryDesc}>
          将按以下顺序合并为一份 PDF：{'\n'}
          封面 → 尽职调查信息表 → 营业执照 → 客户身份证 → 配偶身份证 → 结婚证 → 户口本 → 房产证明 → 租赁合同 → 征信报告 → 签字格式文本 → 上门照片 → 存货证明 → 其他
        </Text>
      </View>

      {/* 资料清单检查 */}
      <Text style={s.secTitle}>资料完整性</Text>
      <View style={s.checkGrid}>
        {docOrderCheck.map(d => (
          <View key={d.type} style={[s.checkItem, d.count > 0 && s.checkItemDone]}>
            <Text style={[s.checkStatus, d.count > 0 ? { color: Colors.secondary } : { color: Colors.textLight }]}>
              {d.count > 0 ? '?' : '?'}
            </Text>
            <Text style={[s.checkLabel, d.count > 0 && { color: Colors.text, fontWeight: '600' }]}>{d.label}</Text>
            <Text style={s.checkCount}>{d.count}份</Text>
          </View>
        ))}
      </View>

      {/* 已提取信息状态 */}
      <Text style={s.secTitle}>信息提取状态</Text>
      <View style={s.infoStatus}>
        <Text style={s.infoStatusIcon}>{hasInfo ? '?' : '??'}</Text>
        <View style={s.infoStatusText}>
          <Text style={s.infoStatusLabel}>
            {hasInfo ? '客户信息已提取' : '尚未提取客户信息'}
          </Text>
          {hasInfo && (
            <Text style={s.infoStatusDetail}>
              {c.extractedInfo.name} / {c.extractedInfo.idNumber}
              {c.extractedInfo.spouseName ? ` / 配偶:${c.extractedInfo.spouseName}` : ''}
            </Text>
          )}
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.compileBtn, compiling && { opacity: 0.6 }]}
          onPress={handleCompile}
          disabled={compiling}
        >
          {compiling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.compileBtnIcon}>??</Text>
              <Text style={s.compileBtnText}>
                {pdfUri ? '重新编译 PDF' : '编译完整审批资料 PDF'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {pdfUri ? (
          <>
            <View style={s.successCard}>
              <Text style={s.successIcon}>?</Text>
              <Text style={s.successText}>PDF 已生成</Text>
              <Text style={s.successDetail}>{totalDocs}份资料已按序合稿</Text>
            </View>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnText}>?? 分享/导出 PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.doneBtn}
              onPress={async () => {
                await updateCasePdf(c.id, pdfUri);
                nav.goBack();
              }}
            >
              <Text style={s.doneBtnText}>完成，返回案件详情</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.tipCard}>
            <Text style={s.tipText}>
              编译后将生成含以下内容的 PDF：{'\n'}
              ① 封面（客户姓名+日期）{'\n'}
              ② 尽职调查信息表（提取的信息汇总）{'\n'}
              ③ 资料正文（按序排列所有照片）{'\n\n'}
              生成后可通过分享导出到电脑打印、提交。
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { backgroundColor: Colors.surface, margin: Spacing.lg, borderRadius: 12, padding: Spacing.lg },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  summaryDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  secTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: Spacing.lg, gap: 6 },
  checkItem: { width: '31%', backgroundColor: Colors.surface, borderRadius: 8, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.divider },
  checkItemDone: { borderColor: Colors.secondary, backgroundColor: '#f1f8e9' },
  checkStatus: { fontSize: 14 },
  checkLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  checkCount: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 1 },
  infoStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg },
  infoStatusIcon: { fontSize: 24, marginRight: 12 },
  infoStatusText: { flex: 1 },
  infoStatusLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  infoStatusDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  actions: { padding: Spacing.lg, gap: 12 },
  compileBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.xl, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  compileBtnIcon: { fontSize: 20 },
  compileBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  successCard: { backgroundColor: '#e8f5e9', borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  successIcon: { fontSize: 28 },
  successText: { fontSize: FontSize.md, fontWeight: '600', color: '#2e7d32', marginTop: 4 },
  successDetail: { fontSize: FontSize.sm, color: '#558b2f', marginTop: 2 },
  shareBtn: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  shareBtnText: { color: Colors.primary, fontWeight: '600' },
  doneBtn: { borderRadius: 12, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  doneBtnText: { color: Colors.textSecondary },
  tipCard: { backgroundColor: '#fff8e1', borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: '#ffe082' },
  tipText: { fontSize: FontSize.sm, color: '#795548', lineHeight: 20 },
});
