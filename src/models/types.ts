// 资料类型（按最终PDF排列顺序）
export type DocType =
  | 'cover'               // 封面
  | 'due_diligence'       // 尽职调查信息表
  | 'business_license'    // 营业执照
  | 'id_card_client'      // 客户身份证
  | 'id_card_spouse'      // 配偶身份证
  | 'marriage_cert'       // 结婚证
  | 'household_register'  // 户口本
  | 'property_cert'       // 房产证明
  | 'lease_contract'      // 租赁合同
  | 'credit_report'       // 征信报告
  | 'bank_format_doc'     // 行内格式文本（需签字按手印）
  | 'site_visit_photo'    // 上门照片
  | 'inventory_cert'      // 存货证明
  | 'other';              // 其他

export const DocTypeLabels: Record<DocType, string> = {
  cover: '封面',
  due_diligence: '尽职调查信息表',
  business_license: '营业执照',
  id_card_client: '客户身份证',
  id_card_spouse: '配偶身份证',
  marriage_cert: '结婚证',
  household_register: '户口本',
  property_cert: '房产证明',
  lease_contract: '租赁合同',
  credit_report: '征信报告',
  bank_format_doc: '行内格式文本（签字页）',
  site_visit_photo: '上门照片',
  inventory_cert: '存货证明',
  other: '其他',
};

// 最终PDF中的排列顺序
export const DocOrder: DocType[] = [
  'cover', 'due_diligence', 'business_license',
  'id_card_client', 'id_card_spouse', 'marriage_cert',
  'household_register', 'property_cert', 'lease_contract',
  'credit_report', 'bank_format_doc', 'site_visit_photo',
  'inventory_cert', 'other',
];

// ===== 提取的客户信息 =====
export interface ExtractedInfo {
  // 客户本人
  name: string;
  gender: string;
  idNumber: string;
  idValidity: string;       // 证件有效期
  phone: string;
  address: string;
  // 配偶
  spouseName: string;
  spouseGender: string;
  spouseIdNumber: string;
  spousePhone: string;
  spouseIdValidity: string;
  // 经营信息
  companyName: string;      // 营业执照名称
  businessAddress: string;  // 经营地址
  // 补充
  loanAmount: string;
  notes: string;
}

export const defaultExtractedInfo: ExtractedInfo = {
  name: '', gender: '', idNumber: '', idValidity: '', phone: '', address: '',
  spouseName: '', spouseGender: '', spouseIdNumber: '', spousePhone: '', spouseIdValidity: '',
  companyName: '', businessAddress: '',
  loanAmount: '', notes: '',
};

// 信息分组（用于显示）
export interface InfoGroup {
  title: string;
  fields: { key: keyof ExtractedInfo; label: string }[];
}

export const infoGroups: InfoGroup[] = [
  {
    title: '客户本人信息',
    fields: [
      { key: 'name', label: '姓名' },
      { key: 'gender', label: '性别' },
      { key: 'idNumber', label: '身份证号码' },
      { key: 'idValidity', label: '证件有效期' },
      { key: 'phone', label: '手机号码' },
      { key: 'address', label: '住址' },
    ],
  },
  {
    title: '配偶信息',
    fields: [
      { key: 'spouseName', label: '配偶姓名' },
      { key: 'spouseGender', label: '配偶性别' },
      { key: 'spouseIdNumber', label: '配偶身份证号码' },
      { key: 'spousePhone', label: '配偶手机号码' },
      { key: 'spouseIdValidity', label: '配偶证件有效期' },
    ],
  },
  {
    title: '经营信息',
    fields: [
      { key: 'companyName', label: '营业执照名称' },
      { key: 'businessAddress', label: '经营地址' },
    ],
  },
  {
    title: '贷款信息',
    fields: [
      { key: 'loanAmount', label: '贷款金额' },
      { key: 'notes', label: '备注' },
    ],
  },
];

// ===== 资料记录 =====
export interface DocumentRecord {
  id: string;
  caseId: string;
  type: DocType;
  uri: string;
  fileName: string;
  order: number;           // 排序用
  createdAt: string;
}

// ===== 贷款案件 =====
export type CaseStatus = 'processing' | 'completed';

export interface LoanCase {
  id: string;
  clientName: string;
  status: CaseStatus;
  extractedInfo: ExtractedInfo;
  documents: DocumentRecord[];
  pdfUri: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 导航 =====
export type RootStackParamList = {
  Home: undefined;
  CaseDetail: { caseId: string };
  DocumentManager: { caseId: string };
  InfoExtractor: { caseId: string };
  PdfCompiler: { caseId: string };
};
