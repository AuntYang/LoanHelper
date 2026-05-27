import { ExtractedInfo } from "../models/types";
import { recognizeText } from "../../modules/vision-text-recognizer/src/VisionTextRecognizer";

export async function recognizeImage(imageUri: string): Promise<string> {
  try {
    const lines = await recognizeText(imageUri);
    return lines.join("\n");
  } catch (error) {
    console.warn("Vision OCR error:", error);
    return "";
  }
}

export function parseOcrText(text: string): Partial<ExtractedInfo> {
  const info: Partial<ExtractedInfo> = {};
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // === 1. Name ===
  const namePatterns = [
    /姓名[：:]\s*([\u4e00-\u9fff\s]{2,8})/,
    /^([\u4e00-\u9fff]{2,4})(?:\s|$)/,
  ];
  for (const p of namePatterns) {
    const m = fullText.match(p);
    if (m && m[1] && m[1].length >= 2 && !info.name) {
      const candidate = m[1].replace(/\s+/g, '');
      if (!/^[\u59d3\u540d\u6027\u522b\u6c11\u65cf\u51fa\u751f]/.test(candidate)) {
        info.name = candidate;
      }
    }
  }

  // === 2. Gender ===
  const gm = fullText.match(/性别[：:]\s*([男|女])/);
  if (gm) info.gender = gm[1];

  // === 3. Ethnicity ===
  const em = fullText.match(/民族[：:]\s*([\u4e00-\u9fff]{1,4})/);
  if (em) info.ethnicity = em[1];

  // === 4. ID number (18-digit) ===
  const idMatch = fullText.match(/(\d{17}[\dXx])/);
  if (idMatch && !info.idNumber) {
    info.idNumber = idMatch[1].toUpperCase();
  }
  if (!info.gender && info.idNumber) {
    info.gender = parseInt(info.idNumber[16]) % 2 === 1 ? "男" : "女";
  }

  // === 5. Phone ===
  const phoneMatch = fullText.match(/1[3-9]\d{9}/);
  if (phoneMatch) info.phone = phoneMatch[0];

  // === 6. Address ===
  const am = fullText.match(/(?:住址|住所|地址|住)[：:]\s*(.+?)(?:\d{4}|有效|签发|$)/);
  if (am && !info.address) {
    info.address = am[1].replace(/\s+/g, '').substring(0, 100);
  }
  if (!info.address && info.idNumber) {
    const idIdx = fullText.indexOf(info.idNumber);
    if (idIdx >= 0) {
      const afterId = fullText.substring(idIdx + info.idNumber.length);
      const addrFromId = afterId.match(/([\u4e00-\u9fff]{6,})/);
      if (addrFromId && !/^(?:姓名|性别|民族|出生|有效|签发|公民|身份)/.test(addrFromId[1])) {
        info.address = addrFromId[1].substring(0, 100);
      }
    }
  }

  // === 7. ID Validity ===
  const validityPatterns = [
    /有效[期期][：:]*\s*([\d\-\.\u5e74\u6708\u65e5]{10,30})/,
    /(\d{4}[\-\.\u5e74]\d{1,2}[\-\.\u6708]\d{1,2}[-\u81f3]\d{4}[\-\.\u5e74]\d{1,2}[\-\.\u6708]\d{1,2}[\u65e5]?)/,
    /(\d{4}\.\d{1,2}\.\d{1,2}[-\u81f3]\d{4}\.\d{1,2}\.\d{1,2})/,
  ];
  for (const p of validityPatterns) {
    const m = fullText.match(p);
    if (m && !info.idValidity) {
      info.idValidity = m[1].replace(/\s+/g, '');
    }
  }

  // === 8. Issuing authority ===
  const im = fullText.match(/签发(?:机关|)?[：:]\s*([\u4e00-\u9fff()]{4,30})/);
  if (im) info.issuingAuthority = im[1].trim();

  // === 9. Company name ===
  const cm = fullText.match(/(?:名称|公司名|企业名)[：:]\s*([\u4e00-\u9fff()]{4,50})/);
  if (cm && !info.companyName) info.companyName = cm[1].trim();

  // === 10. Business address ===
  const bm = fullText.match(/(?:住所|经营场所)[：:]\s*([\u4e00-\u9fff()\d]{6,80})/);
  if (bm) info.businessAddress = bm[1].trim();

  // === 11. Spouse info ===
  const sm = fullText.match(/配偶[：:]\s*([\u4e00-\u9fff]{2,8})/);
  if (sm) info.spouseName = sm[1];
  const sim = fullText.match(/(?:配偶)?(?:身份证|身份号码|证件号)[：:]\s*(\d{17}[\dXx])/);
  if (sim) info.spouseIdNumber = sim[1].toUpperCase();
  if (!info.spouseGender && info.spouseIdNumber) {
    info.spouseGender = parseInt(info.spouseIdNumber[16]) % 2 === 1 ? "男" : "女";
  }

  return info;
}
