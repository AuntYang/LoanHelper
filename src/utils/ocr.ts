import { ExtractedInfo } from '../models/types';
import { recognizeText } from '../../modules/vision-text-recognizer/src/VisionTextRecognizer';

export async function recognizeImage(imageUri: string): Promise<string> {
  try {
    const lines = await recognizeText(imageUri);
    return lines.join('\n');
  } catch (error) {
    console.warn('Vision OCR error:', error);
    return '';
  }
}

export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const nameMatch = t.match(/^\u59d3\u540d[\uff1a:]\s*(.+)/);
    if (nameMatch && !info.name) info.name = nameMatch[1].replace(/\s+/g, '');

    const genderMatch = t.match(/^\u6027\u522b[\uff1a:]\s*(.+)/);
    if (genderMatch) info.gender = genderMatch[1].replace(/\s+/g, '');

    const idMatch = t.match(/\d{17}[\dXx]/);
    if (idMatch && !info.idNumber) {
      info.idNumber = idMatch[0];
      if (!info.gender) {
        info.gender = parseInt(idMatch[0][16]) % 2 === 1 ? '\u7537' : '\u5973';
      }
    }

    const phoneMatch = t.match(/1[3-9]\d{9}/);
    if (phoneMatch && !info.phone) info.phone = phoneMatch[0];

    const addrMatch = t.match(/^\u4f4f[\u5740\u5740][\uff1a:]\s*(.+)/);
    if (addrMatch && !info.address) info.address = addrMatch[1].replace(/\s+/g, '');

    const valMatch = t.match(/(\u6709\u6548[\u671f\u671f]|\u7b7e\u53d1[\u673a\u5173\u5173])[\uff1a:]\s*(.+)/);
    if (valMatch) info.idValidity = valMatch[2].replace(/\s+/g, '');

    const coMatch = t.match(/^[\u7edf\u6ce8]?[\u4e00\u518c]?[\u793e\u4fe1]?[\u4f1a\u7528]?[\u4ee3\u4fe1]?[\u7801\u606f]?[\u540d\u79f0\u79f0][\uff1a:]\s*(.+)/);
    if (coMatch && !info.companyName) info.companyName = coMatch[1].replace(/\s+/g, '');

    const baMatch = t.match(/^(\u4f4f\u6240|\u7ecf\u8425[\u573a\u6240])[\uff1a:]\s*(.+)/);
    if (baMatch && !info.businessAddress) info.businessAddress = baMatch[2].replace(/\s+/g, '');

    const spouseMatch = t.match(/^\u914d\u5076[\uff1a:]\s*(.+)/);
    if (spouseMatch && !info.spouseName) info.spouseName = spouseMatch[1].replace(/\s+/g, '');

    const spouseIdMatch = t.match(/(?:\u914d\u5076)?[\u8eab\u4efd\u8eab\u4efd\u8bc1\u53f7\u8bc1\u53f7\u7801\u7801][\uff1a:]\s*(\d{17}[\dXx])/);
    if (spouseIdMatch && !info.spouseIdNumber) {
      info.spouseIdNumber = spouseIdMatch[1];
      if (!info.spouseGender) {
        info.spouseGender = parseInt(spouseIdMatch[1][16]) % 2 === 1 ? '\u7537' : '\u5973';
      }
    }
  }

  if (info.name && !info.gender && info.idNumber) {
    info.gender = parseInt(info.idNumber[16]) % 2 === 1 ? '\u7537' : '\u5973';
  }

  return info;
}
