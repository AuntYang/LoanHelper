import { ExtractedInfo } from "../models/types";
import { recognizeText } from "../../modules/vision-text-recognizer/src/VisionTextRecognizer";

export async function recognizeImage(imageUri: string): Promise<string> {
  try {
    const lines = await recognizeText(imageUri);
    return lines.join("
");
  } catch (error) {
    console.warn("Vision OCR error:", error);
    return "";
  }
}

export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split("
").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // === 1. Name (????????) ===
  const namePatterns = [
    /姓名[：:]\s*([一-鿿\s]{2,8})/,
    /^([一-鿿]{2,4})(?:\s|$)/,
  ];
  for (const p of namePatterns) {
    const m = fullText.match(p);
    if (m && m[1] && m[1].length >= 2 && !info.name) {
      const candidate = m[1].replace(/\s+/g, "");
      if (!/^[姓名性别民族出生]/ .test(candidate)) {
        info.name = candidate;
      }
    }
  }

  // === 2. Gender (??) ===
  const genderPattern = /性别[：:]\s*([男女])/;
  const gm = fullText.match(genderPattern);
  if (gm) info.gender = gm[1];

  // === 3. Ethnicity (??) ===
  const ethnicPattern = /民族[：:]\s*([一-鿿]{1,4})/;
  const em = fullText.match(ethnicPattern);
  if (em) info.ethnicity = em[1];

  // === 4. ID number (18-digit) ===
  const idPatterns = [
    /(\d{17}[\dXx])/,
    /号码[：:]\s*(\d{17}[\dXx])/,
    /身份证[：:]\s*(\d{17}[\dXx])/,
  ];
  for (const p of idPatterns) {
    const m = fullText.match(p);
    if (m && !info.idNumber) {
      info.idNumber = m[1].toUpperCase();
    }
  }

  // Derive gender from ID number if not found
  if (!info.gender && info.idNumber) {
    info.gender = parseInt(info.idNumber[16]) % 2 === 1 ? "男" : "女";
  }

  // === 5. Phone ===
  const phoneMatch = fullText.match(/1[3-9]\d{9}/);
  if (phoneMatch) info.phone = phoneMatch[0];

  // === 6. Address (????, could be multi-line) ===
  // On Chinese ID cards, after ID number, the address follows
  // Try finding "住址" or "住所" label first
  const addrLabelPattern = /(?:住址|住所|地址|住)[：:]\s*(.+?)(?:\d{4}|有效|签发|$)/;
  const am = fullText.match(addrLabelPattern);
  if (am && !info.address) {
    info.address = am[1].replace(/\s+/g, "").substring(0, 100);
  }

  // If address label not found, try to extract from position after ID number
  if (!info.address && info.idNumber) {
    const idIdx = fullText.indexOf(info.idNumber);
    if (idIdx >= 0) {
      const afterId = fullText.substring(idIdx + info.idNumber.length);
      // Look for Chinese address-like text (starts with province/city)
      const addrFromId = afterId.match(/([一-鿿]{6,})/);
      if (addrFromId) {
        const candidate = addrFromId[1];
        // Filter out known non-address patterns
        if (!/^(?:姓名|性别|民族|出生|有效|签发|公民|身份)/ .test(candidate)) {
          info.address = candidate.substring(0, 100);
        }
      }
    }
  }

  // === 7. ID Validity (?????? + ??????) ===
  // Format examples: "20150101-20250101" or "2015.01.01-2025.01.01"
  // Or "有效期 2015.01.01-2025.01.01"
  const validityPatterns = [
    /有效[期期][：:]*\s*([\d\-\.年月日]{10,30})/,
    /(\d{4}[\-\.年]\d{1,2}[\-\.月]\d{1,2}[\-至]\d{4}[\-\.年]\d{1,2}[\-\.月]\d{1,2}[日]?)/,
    /签到\s*(\d{4}[\-\.]\d{1,2}[\-\.]\d{1,2}[\-至]\d{4}[\-\.]\d{1,2}[\-\.]\d{1,2})/,
    /(\d{4}\.\d{1,2}\.\d{1,2}[\-至]\d{4}\.\d{1,2}\.\d{1,2})/,
  ];
  for (const p of validityPatterns) {
    const m = fullText.match(p);
    if (m && !info.idValidity) {
      info.idValidity = m[1].replace(/\s+/g, "");
    }
  }

  // === 8. Issuing authority (????) ===
  const issuePattern = /签发(?:机关|)?[：:]\s*([一-鿿\(\)]{4,30})/;
  const im = fullText.match(issuePattern);
  if (im) info.issuingAuthority = im[1].trim();

  // === 9. Company name (for business license) ===
  const coPatterns = [
    /(?:名称|公司名|企业名)[：:]\s*([一-鿿\(\)]{4,50})/,
    /^([一-鿿]{4,30}(?:有限公司|有限责任公司|股份有限公司|厂|店|社|公司))(\s|$)/,
  ];
  for (const p of coPatterns) {
    const m = fullText.match(p);
    if (m && !info.companyName) {
      info.companyName = m[1].trim();
    }
  }

  // === 10. Business address (for business license) ===
  const baPattern = /(?:住所|经营场所)[：:]\s*([一-鿿\(\)\d]{6,80})/;
  const bm = fullText.match(baPattern);
  if (bm) info.businessAddress = bm[1].trim();

  // === 11. Spouse info (from spouse ID card) ===
  const spouseNamePattern = /配偶[：:]\s*([一-鿿]{2,8})/;
  const sm = fullText.match(spouseNamePattern);
  if (sm) info.spouseName = sm[1];

  const spouseIdPattern = /(?:配偶)?(?:身份证|身份号码|证件号)[：:]\s*(\d{17}[\dXx])/;
  const sim = fullText.match(spouseIdPattern);
  if (sim) info.spouseIdNumber = sim[1].toUpperCase();

  // Derive spouse gender
  if (!info.spouseGender && info.spouseIdNumber) {
    info.spouseGender = parseInt(info.spouseIdNumber[16]) % 2 === 1 ? "男" : "女";
  }

  // === Fallback: try line-by-line parsing for fields missed above ===
  for (const line of lines) {
    // If a line has only Chinese chars that look like a name (2-4 chars) and we have no name yet
    const singleName = line.match(/^([一-鿿]{2,4})$/);
    if (singleName && !info.name) {
      const candidate = singleName[1];
      if (!/^(?:姓名|性别|民族|出生|有效|签发|公民|身份|地址|住址|签发)/ .test(candidate)) {
        info.name = candidate;
      }
    }
  }

  return info;
}
