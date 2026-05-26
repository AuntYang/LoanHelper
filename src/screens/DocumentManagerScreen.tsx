import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DocType, DocTypeLabels, DocOrder, DocumentRecord } from '../models/types';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { getDocuments, addDocument, deleteDocument } from '../database/database';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DocumentManager'>;
type Route = RouteProp<RootStackParamList, 'DocumentManager'>;

// 按 PDF 顺序显示的快捷标签
const quickTypes: DocType[] = [
  'business_license', 'id_card_client', 'id_card_spouse',
  'marriage_cert', 'household_register', 'property_cert',
  'lease_contract', 'credit_report', 'bank_format_doc',
  'site_visit_photo', 'inventory_cert',
];

export default function DocumentManagerScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [permission, requestPermission] = useCameraPermissions();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showImportAction, setShowImportAction] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocType>('id_card_client');
  const cameraRef = useRef<CameraView>(null);

  useFocusEffect(useCallback(() => { loadDocs(); }, []));

  const loadDocs = async () => setDocs(await getDocuments(route.params.caseId));

  // ===== 拍照 =====
  const openCamera = (type: DocType) => {
    setSelectedType(type);
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    if (photo?.uri) {
      // Close camera first, then show type picker with delay
      setShowCamera(false);
      setPendingUri(photo.uri);
      // Need setTimeout to let camera modal fully unmount
      setTimeout(() => setShowQuickCapture(true), 600);
    }
  };

  // ===== 从相册导入 =====
  const pickFromAlbum = async () => {
    setShowImportAction(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要权限', '请在设置中开启相册权限');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPendingUri(result.assets[0].uri);
      setShowTypePicker(true);
    }
  };

  // ===== 从文件导入 =====
  const pickFromFile = async () => {
    setShowImportAction(false);
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      setPendingUri(result.assets[0].uri);
      setShowTypePicker(true);
    }
  };

  // ===== 保存文档 =====
  const saveDoc = async (type: DocType) => {
    if (!pendingUri) return;
    const destDir = `${FileSystem.documentDirectory}cases/${route.params.caseId}/`;
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    const ext = pendingUri.match(/\.(\w+)$/)?.[1] || 'jpg';
    const fileName = `${type}_${Date.now()}.${ext}`;
    const dest = `${destDir}${fileName}`;
    try {
      // Copy (not move) in case source is from camera roll
      await FileSystem.copyAsync({ from: pendingUri, to: dest });
    } catch {
      await FileSystem.moveAsync({ from: pendingUri, to: dest });
    }

    await addDocument(route.params.caseId, type, dest, DocTypeLabels[type]);
    setPendingUri(null);
    setShowTypePicker(false);
    setShowQuickCapture(false);
    await loadDocs();
  };

  const handleDelete = (doc: DocumentRecord) => {
    Alert.alert('删除', `删除这份${DocTypeLabels[doc.type]}？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteDocument(doc.id); loadDocs(); }},
    ]);
  };

  // 按PDF顺序分组显示
  const groupedDocs = DocOrder.map(t => ({
    type: t,
    label: DocTypeLabels[t],
    items: docs.filter(d => d.type === t),
  })).filter(g => g.items.length > 0);

  return (
    <View style={s.container}>
      {/* 快捷拍摄标签 */}
      <View style={s.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickTypes.map(t => (
            <TouchableOpacity key={t} style={s.quickChip} onPress={() => openCamera(t)}>
              <Text style={s.quickChipText}>{DocTypeLabels[t]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={s.importBtn} onPress={() => setShowImportAction(true)}>
        <Text style={s.importBtnText}>从相册/文件导入</Text>
      </TouchableOpacity>

      <Text style={s.secTitle}>已拍摄资料（{docs.length}份）</Text>
      <ScrollView style={s.list}>
        {groupedDocs.map(group => (
          <View key={group.type}>
            <Text style={s.groupLabel}>{group.label}</Text>
            {group.items.map(doc => (
              <TouchableOpacity key={doc.id} style={s.docItem} onLongPress={() => handleDelete(doc)}>
                <Image source={{ uri: doc.uri }} style={s.thumb} />
                <View style={s.docInfo}>
                  <Text style={s.docName}>{doc.fileName}</Text>
                  <Text style={s.docDate}>{new Date(doc.createdAt).toLocaleString('zh-CN')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {docs.length === 0 && <Text style={s.empty}>点击上方标签快速拍摄，或从文件导入</Text>}
      </ScrollView>

      {/* 相机 - 使用条件渲染而非Modal防止触摸穿透 */}
      {showCamera && (
        <View style={StyleSheet.absoluteFill}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
            <View style={s.camOverlay}>
              <TouchableOpacity style={s.camClose} onPress={() => setShowCamera(false)}>
                <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
              <View style={s.camBottom}>
                <TouchableOpacity style={s.shootBtn} onPress={handleCapture}>
                  <View style={s.shootInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {/* 导入方式选择 */}
      <Modal visible={showImportAction} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>选择导入方式</Text>
            <TouchableOpacity style={s.importOption} onPress={pickFromAlbum}>
              <Text style={s.importOptionText}>从相册选择照片</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.importOption} onPress={pickFromFile}>
              <Text style={s.importOptionText}>从文件管理器选择</Text>
            </TouchableOpacity>
            <View style={s.dialogActions}>
              <TouchableOpacity onPress={() => setShowImportAction(false)}>
                <Text style={{ color: Colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 拍照后快速选择类型 */}
      <Modal visible={showQuickCapture} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>保存为哪类资料？</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {quickTypes.map(t => (
                <TouchableOpacity key={t} style={[s.typeRow, selectedType === t && s.typeRowActive]} onPress={() => setSelectedType(t)}>
                  <Text style={[s.typeRowText, selectedType === t && s.typeRowTextActive]}>{DocTypeLabels[t]}</Text>
                  {selectedType === t && <Text style={{ color: Colors.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.dialogActions}>
              <TouchableOpacity onPress={() => { setShowQuickCapture(false); setPendingUri(null); }}>
                <Text style={{ color: Colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={() => saveDoc(selectedType)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 从文件/相册导入后选类型 */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>选择资料类型</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {DocOrder.filter(t => t !== 'cover' && t !== 'due_diligence').map(t => (
                <TouchableOpacity key={t} style={[s.typeRow, selectedType === t && s.typeRowActive]} onPress={() => setSelectedType(t)}>
                  <Text style={[s.typeRowText, selectedType === t && s.typeRowTextActive]}>{DocTypeLabels[t]}</Text>
                  {selectedType === t && <Text style={{ color: Colors.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.dialogActions}>
              <TouchableOpacity onPress={() => { setShowTypePicker(false); setPendingUri(null); }}>
                <Text style={{ color: Colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={() => saveDoc(selectedType)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>保存</Text>
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
  quickRow: { paddingVertical: Spacing.md, paddingLeft: Spacing.lg },
  quickChip: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  quickChipText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '500' },
  importBtn: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: 12, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  importBtnText: { fontSize: FontSize.md, color: Colors.text },
  secTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md },
  list: { flex: 1, paddingHorizontal: Spacing.lg },
  groupLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  docItem: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: Spacing.md, marginBottom: Spacing.xs, alignItems: 'center' },
  thumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: Colors.background },
  docInfo: { flex: 1, marginLeft: Spacing.md },
  docName: { fontSize: FontSize.sm, color: Colors.text },
  docDate: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  empty: { textAlign: 'center', color: Colors.textLight, marginTop: 40 },
  camOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', padding: 30 },
  camClose: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  camBottom: { alignItems: 'center', marginBottom: 40 },
  shootBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shootInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.xl, maxHeight: '70%' },
  dialogTitle: { fontSize: FontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.lg },
  importOption: { backgroundColor: Colors.background, borderRadius: 10, padding: Spacing.lg, marginBottom: Spacing.sm, alignItems: 'center' },
  importOptionText: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderRadius: 8, marginBottom: 2 },
  typeRowActive: { backgroundColor: '#e3f2fd' },
  typeRowText: { fontSize: FontSize.md, color: Colors.text },
  typeRowTextActive: { color: Colors.primary, fontWeight: '600' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: Spacing.lg },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
});