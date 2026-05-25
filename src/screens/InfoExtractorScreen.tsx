import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList, ExtractedInfo, defaultExtractedInfo, infoGroups, DocTypeLabels } from '../models/types';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { getCase, updateCaseInfo, getDocuments } from '../database/database';

type Route = RouteProp<RootStackParamList, 'InfoExtractor'>;

export default function InfoExtractorScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const [info, setInfo] = useState<ExtractedInfo>(defaultExtractedInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getCase(route.params.caseId);
      if (c) setInfo({ ...defaultExtractedInfo, ...c.extractedInfo });
      setLoading(false);
    })();
  }, []);

  const update = (key: keyof ExtractedInfo, value: string) => setInfo(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCaseInfo(route.params.caseId, info);
      Alert.alert('保存成功', '信息已保存，可在电脑上打开 Excel 填写', [{ text: '好的' }]);
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    }
    setSaving(false);
  };

  // 一键复制某段文本到剪贴板
  const copyText = (text: string) => {
    if (!text) return;
    Clipboard.setStringAsync(text).then(() => Alert.alert('已复制', text));
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  // 拼接 Excel 粘贴用的文本
  const excelRow = [
    info.name, info.gender, info.idNumber, info.phone, info.idValidity, info.address,
    info.companyName, info.businessAddress,
    info.spouseName, info.spouseGender, info.spouseIdNumber, info.spousePhone, info.spouseIdValidity,
  ].join('\t');

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      {/* 信息提取提示 */}
      <View style={s.tipCard}>
        <Text style={s.tipTitle}>?? 操作说明</Text>
        <Text style={s.tipText}>
          1. 先拍摄客户身份证照（在「资料管理」页）{'\n'}
          2. 拍照后OCR会自动识别填入下方{'\n'}
          3. 手动校对和补充完整{'\n'}
          4. 保存后，一键复制到电脑 Excel
        </Text>
      </View>

      {/* 一键复制到 Excel */}
      <View style={s.excelBar}>
        <Text style={s.excelHint}>点击复制，粘贴到 Excel（按Tab分隔）</Text>
        <TouchableOpacity style={s.copyBtn} onPress={() => copyText(excelRow)}>
          <Text style={s.copyBtnText}>?? 复制所有信息</Text>
        </TouchableOpacity>
      </View>

      {/* 分组字段 */}
      {infoGroups.map(group => (
        <View key={group.title}>
          <Text style={s.groupTitle}>{group.title}</Text>
          <View style={s.fieldCard}>
            {group.fields.map(f => (
              <View key={f.key} style={s.fieldRow}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.fieldInputRow}>
                  <TextInput
                    style={s.fieldInput}
                    value={info[f.key]}
                    onChangeText={(v) => update(f.key, v)}
                    placeholderTextColor={Colors.textLight}
                  />
                  <TouchableOpacity style={s.copySmall} onPress={() => copyText(info[f.key])}>
                    <Text style={s.copySmallText}>复制</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <Text style={s.saveBtnText}>{saving ? '保存中...' : '保存信息'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tipCard: { backgroundColor: '#e3f2fd', margin: Spacing.lg, borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primary },
  tipTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary },
  tipText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.sm },
  excelBar: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.secondary, borderStyle: 'dashed' },
  excelHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  copyBtn: { backgroundColor: Colors.secondary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  copyBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
  groupTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  fieldCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.sm },
  fieldRow: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center' },
  fieldInput: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  copySmall: { marginLeft: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: Colors.background, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  copySmallText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
