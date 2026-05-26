import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { LoanCase, DocTypeLabels, DocOrder, DocumentRecord, ExtractedInfo, infoGroups } from '../models/types';

/**
 * 编译完整审批资料 PDF（固定顺序）
 */
export async function compileFinalPdf(loanCase: LoanCase): Promise<string> {
  const { clientName, extractedInfo, documents } = loanCase;

  // 按 DocOrder 排序文档
  const sortedDocs = [...documents].sort((a, b) => a.order - b.order);

  // 分组显示
  const docGroups = DocOrder.filter(t => documents.some(d => d.type === t));
  const docListHtml = docGroups.map(t => {
    const groupDocs = documents.filter(d => d.type === t);
    if (groupDocs.length === 0) return '';
    return `<li><strong>${DocTypeLabels[t]}</strong>（${groupDocs.length}份）</li>`;
  }).filter(Boolean).join('\n');

  // 信息摘要 - 生成表格形式方便核对
  const infoRows = infoGroups.map(g => {
    const fields = g.fields.map(f =>
      `<tr><td style="padding:6px 10px;border:1px solid #ddd;background:#f9f9f9;color:#666;width:120px">${f.label}</td><td style="padding:6px 10px;border:1px solid #ddd">${extractedInfo[f.key] || '-'}</td></tr>`
    ).join('\n');
    return `<h3 style="margin-top:16px;">${g.title}</h3><table style="width:100%;border-collapse:collapse;margin:4px 0;">${fields}</table>`;
  }).join('\n');

  // 资料图片占位（实际改为文件名列表，因为打印时将图片嵌入PDF会很大）
  const docImagesHtml = sortedDocs.map(d =>
    `<div style="page-break-inside:avoid;margin:12px 0;padding:10px;border:1px solid #ddd;border-radius:4px;">
       <p style="color:#1a73e8;font-weight:600;margin:0 0 4px 0;">?? ${DocTypeLabels[d.type]} — ${d.fileName}</p>
       <img src="${d.uri}" style="max-width:100%;max-height:600px;object-fit:contain;" />
     </div>`
  ).join('\n');

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #333; }
  .cover { page-break-after: always; text-align: center; padding: 120px 40px; }
  .cover h1 { font-size: 28px; color: #1a73e8; border: none; margin-bottom: 10px; }
  .cover .sub { color: #666; font-size: 16px; margin: 8px 0; }
  .cover .date { color: #999; font-size: 14px; margin-top: 40px; }
  .section-title { font-size: 20px; color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 8px; margin: 24px 0 12px; }
  .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 11px; border-top: 1px solid #eee; padding-top: 8px; }
</style></head><body>

<!-- 封面 -->
<div class="cover">
  <h1>贷款审批资料</h1>
  <p class="sub">客户姓名：${clientName}</p>
  <p class="sub">资料共计 ${documents.length} 份</p>
  <p class="date">生成日期：${new Date().toLocaleDateString('zh-CN')}</p>
</div>

<!-- 尽职调查信息表摘要 -->
<div style="page-break-before: always;">
  <div class="section-title">一、尽职调查信息表</div>
  <p style="color:#999;font-size:13px;">以下信息由 App 从证件资料中提取，请核对无误后签字。</p>
  ${infoRows}
</div>

<!-- 资料清单 -->
<div style="page-break-before: always;">
  <div class="section-title">二、资料总览</div>
  <ul style="line-height:1.8;font-size:15px;">${docListHtml}</ul>
</div>

<!-- 资料正文 -->
<div style="page-break-before: always;">
  <div class="section-title">三、资料正文</div>
  ${docImagesHtml}
</div>

<div class="footer">
  <p>本文件由「贷款助手」App 自动生成 | ${new Date().toLocaleString('zh-CN')}</p>
</div>

</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, width: 595.28, height: 841.89 });

  // 移动到专属目录
  const destDir = `${FileSystem.documentDirectory}pdf/`;
  await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  const dest = `${destDir}审批资料_${clientName}_${Date.now()}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });

  return dest;
}
