import { ExtractedInfo } from '../models/types';
import { recognizeText } from '../../modules/vision-text-recognizer/src/VisionTextRecognizer';

/**
 * 閫氳繃 iOS Vision 妗嗘灦锛堢绾匡級璇嗗埆鍥剧墖涓殑鏂囧瓧
 */
export async function recognizeImage(imageUri: string): Promise<string> {
  try {
    
    const lines = await recognizeText(imageUri);
    return lines.join('\n');
  } catch (error) {
    console.warn('Vision OCR error:', error);
    return '';
  }
}

/**
 * 浠嶰CR鏂囨湰涓彁鍙栧鎴?閰嶅伓+缁忚惀淇℃伅
 */
export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    // Name
    const nameMatch = t.match(/^濮撳悕[锛?]\s*(.+)/);
    if (nameMatch && !info.name) info.name = nameMatch[1].replace(/\s+/g, '');

    // Gender
    const genderMatch = t.match(/^鎬у埆[锛?]\s*(.+)/);
    if (genderMatch) info.gender = genderMatch[1].replace(/\s+/g, '');

    // Chinese 18-digit ID number
    const idMatch = t.match(/\d{17}[\dXx]/);
    if (idMatch && !info.idNumber) {
      info.idNumber = idMatch[0];
      if (!info.gender) {
        info.gender = parseInt(idMatch[0][16]) % 2 === 1 ? '鐢? : '濂?;
      }
    }

    // Phone
    const phoneMatch = t.match(/1[3-9]\d{9}/);
    if (phoneMatch && !info.phone) info.phone = phoneMatch[0];

    // Address
    const addrMatch = t.match(/^浣廩鍧€鍧€][锛?]\s*(.+)/);
    if (addrMatch && !info.address) info.address = addrMatch[1].replace(/\s+/g, '');

    // ID validity
    const valMatch = t.match(/(鏈夋晥[鏈熸湡]|绛惧彂[鏈哄叧鍏砞)[锛?]\s*(.+)/);
    if (valMatch) info.idValidity = valMatch[2].replace(/\s+/g, '');

    // Company name (from business license)
    const coMatch = t.match(/^[缁熸敞]?[涓€鍐宂?[绀句俊]?[浼氱敤]?[浠ｄ俊]?[鐮佹伅]?[鍚嶇О绉癩[锛?]\s*(.+)/);
    if (coMatch && !info.companyName) info.companyName = coMatch[1].replace(/\s+/g, '');

    // Business address
    const baMatch = t.match(/^(浣忔墍|缁忚惀[鍦烘墍])[锛?]\s*(.+)/);
    if (baMatch && !info.businessAddress) info.businessAddress = baMatch[2].replace(/\s+/g, '');

    // Spouse name from marriage cert
    const spouseMatch = t.match(/^閰嶅伓[锛?]\s*(.+)/);
    if (spouseMatch && !info.spouseName) info.spouseName = spouseMatch[1].replace(/\s+/g, '');

    // Spouse ID from marriage cert / spouse ID card
    const spouseIdMatch = t.match(/(?:閰嶅伓)?[韬唤韬唤璇佸彿璇佸彿鐮佺爜][锛?]\s*(\d{17}[\dXx])/);
    if (spouseIdMatch && !info.spouseIdNumber) {
      info.spouseIdNumber = spouseIdMatch[1];
      if (!info.spouseGender) {
        info.spouseGender = parseInt(spouseIdMatch[1][16]) % 2 === 1 ? '鐢? : '濂?;
      }
    }
  }

  // Derive gender from ID if not found
  if (info.name && !info.gender && info.idNumber) {
    info.gender = parseInt(info.idNumber[16]) % 2 === 1 ? '鐢? : '濂?;
  }

  return info;
}
