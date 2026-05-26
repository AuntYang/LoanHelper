import { ExtractedInfo } from '../models/types';

// OCR.space Free API key (public test key, 25k requests/month limit)
const OCR_API_KEY = 'K87625047988957';

// OCR result interface
interface OcrSpaceResult {
  ParsedResults: Array<{
    ParsedText: string;
    ErrorMessage: string | null;
    FileParseExitCode: number;
  }>;
  OCRExitCode: number;
  ErrorMessage: string[];
}

/**
 * 通过 OCR.space API 识别图片中的文字
 */
export async function recognizeImage(imageUri: string): Promise<string> {
  try {
    const fs = require('expo-file-system');
    const imageBase64 = await fs.FileSystem.readAsStringAsync(imageUri, {
      encoding: fs.EncodingType.Base64,
    });

    const formData = new FormData();
    // Use base64 image
    formData.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
    formData.append('language', 'chs'); // Chinese simplified
    formData.append('isOverlayRequired', 'false');
    formData.append('apikey', OCR_API_KEY);
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    const result: OcrSpaceResult = await response.json();

    if (result.OCRExitCode === 1 && result.ParsedResults?.length > 0) {
      return result.ParsedResults[0].ParsedText || '';
    } else {
      console.warn('OCR failed:', result.ErrorMessage);
      return '';
    }
  } catch (error) {
    console.warn('OCR error:', error);
    return '';
  }
}

/**
 * 从OCR文本中提取客户+配偶+经营信息
 */
export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split('\n').filter(l => l.trim());

  // Try to extract name and ID from first few lines (ID card front)
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    // Name patterns
    const nameMatch = t.match(/^姓名[：:]\s*(.+)/);
    if (nameMatch && !info.name) info.name = nameMatch[1].replace(/\s+/g, '');

    // Gender
    const genderMatch = t.match(/^性别[：:]\s*(.+)/);
    if (genderMatch) info.gender = genderMatch[1].replace(/\s+/g, '');

    // Nationality (skip, not in our schema)
    // Year/Month/Day for DOB

    // Chinese 18-digit ID number
    const idMatch = t.match(/\d{17}[\dXx]/);
    if (idMatch && !info.idNumber) {
      info.idNumber = idMatch[0];
      if (!info.gender) {
        info.gender = parseInt(idMatch[0][16]) % 2 === 1 ? '男' : '女';
      }
    }

    // Phone number
    const phoneMatch = t.match(/1[3-9]\d{9}/);
    if (phoneMatch && !info.phone) info.phone = phoneMatch[0];

    // Address
    const addrMatch = t.match(/^住[址址][：:]\s*(.+)/);
    if (addrMatch && !info.address) info.address = addrMatch[1].replace(/\s+/g, '');

    // ID validity
    const valMatch = t.match(/(有效[期期]|签发[机关关])[：:]\s*(.+)/);
    if (valMatch) info.idValidity = valMatch[2].replace(/\s+/g, '');

    // Company name (if business license)
    const coMatch = t.match(/^[统注]?[一册]?[社信]?[会用]?[代信]?[码息]?[名称称][：:]\s*(.+)/);
    if (coMatch && !info.companyName) info.companyName = coMatch[1].replace(/\s+/g, '');

    // Business address
    const baMatch = t.match(/^(住所|经营[场所])[：:]\s*(.+)/);
    if (baMatch && !info.businessAddress) info.businessAddress = baMatch[2].replace(/\s+/g, '');

    // Spouse info from marriage cert
    const spouseMatch = t.match(/^配偶[：:]\s*(.+)/);
    if (spouseMatch && !info.spouseName) info.spouseName = spouseMatch[1].replace(/\s+/g, '');

    const spouseIdMatch = t.match(/(?:配偶)?[身份身份证号证号码码][：:]\s*(\d{17}[\dXx])/);
    if (spouseIdMatch && !info.spouseIdNumber) {
      info.spouseIdNumber = spouseIdMatch[1];
      if (!info.spouseGender) {
        info.spouseGender = parseInt(spouseIdMatch[1][16]) % 2 === 1 ? '男' : '女';
      }
    }
  }

  // If we found a name without gender but have ID number, derive from ID
  if (info.name && !info.gender && info.idNumber) {
    info.gender = parseInt(info.idNumber[16]) % 2 === 1 ? '男' : '女';
  }

  return info;
}