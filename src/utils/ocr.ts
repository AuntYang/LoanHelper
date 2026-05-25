import { ExtractedInfo } from '../models/types';

/**
 * 从OCR文本中提取客户+配偶+经营信息
 */
export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const t = line.trim();

    const nameMatch = t.match(/^姓名[：:]\s*(.+)/);
    if (nameMatch) info.name = nameMatch[1];

    const genderMatch = t.match(/^性别[：:]\s*(.+)/);
    if (genderMatch) info.gender = genderMatch[1];

    const idMatch = t.match(/\d{17}[\dXx]/);
    if (idMatch) {
      info.idNumber = idMatch[0];
      if (!info.gender) info.gender = parseInt(idMatch[0][16]) % 2 === 1 ? '男' : '女';
    }

    const phoneMatch = t.match(/1[3-9]\d{9}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const addrMatch = t.match(/^住[址址][：:]\s*(.+)/);
    if (addrMatch) info.address = addrMatch[1];

    const valMatch = t.match(/有效[期期][：:]\s*(.+)/);
    if (valMatch) info.idValidity = valMatch[1];

    const coMatch = t.match(/^[企单]?[业位]?名称[：:]\s*(.+)/);
    if (coMatch) info.companyName = coMatch[1];

    const baMatch = t.match(/^经营[地址址][：:]\s*(.+)/);
    if (baMatch) info.businessAddress = baMatch[1];
  }

  return info;
}
