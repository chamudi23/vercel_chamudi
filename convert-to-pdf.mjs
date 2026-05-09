import { readFileSync } from 'fs';

const md = readFileSync('C:\\Users\\hp\\.gemini\\antigravity\\brain\\ca226357-2df0-4b53-8ae5-c8600ab3c8ba\\OAHRIS_Skeletal_Analysis_Methodology.md', 'utf-8');

// Simple markdown to HTML converter
function mdToHtml(text) {
  let html = text;
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Bold + italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Headings
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  // Blockquotes
  html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '');
    const isHeader = cells.every(c => /^[\s:-]+$/.test(c));
    if (isHeader) return '<!--sep-->';
    const tag = 'td';
    return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
  });
  // Wrap table rows
  html = html.replace(/((<tr>.*<\/tr>\n?)+)/g, (block) => {
    const rows = block.trim().split('\n').filter(r => r !== '<!--sep-->');
    if (rows.length === 0) return '';
    const first = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
    const rest = rows.slice(1).join('\n');
    return `<table><thead>${first}</thead><tbody>${rest}</tbody></table>`;
  });
  html = html.replace(/<!--sep-->\n?/g, '');
  // Numbered lists
  html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, '<ol>$1</ol>');
  // Paragraphs - wrap remaining text
  html = html.replace(/^(?!<[a-z]|$)(.*$)/gm, '<p>$1</p>');
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

const body = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>OAHRIS Skeletal Analysis Methodology</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; color: #1a1a2e; line-height: 1.7; padding: 60px 70px; font-size: 11pt; }
h1 { font-size: 22pt; color: #0f3460; margin: 30px 0 8px; border-bottom: 3px solid #e94560; padding-bottom: 8px; }
h2 { font-size: 16pt; color: #0f3460; margin: 28px 0 10px; border-bottom: 2px solid #ddd; padding-bottom: 6px; }
h3 { font-size: 13pt; color: #16213e; margin: 20px 0 8px; }
h4 { font-size: 11pt; color: #533483; margin: 16px 0 6px; }
p { margin: 6px 0; text-align: justify; }
hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
th { background: #0f3460; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
tr:nth-child(even) { background: #f8f9fa; }
blockquote { background: #f0f4ff; border-left: 4px solid #533483; padding: 12px 16px; margin: 12px 0; font-style: italic; color: #333; }
pre { background: #1a1a2e; color: #e0e0e0; padding: 14px; border-radius: 6px; margin: 12px 0; font-size: 10pt; overflow-x: auto; }
code { font-family: 'Consolas', monospace; }
ol { margin: 8px 0 8px 24px; }
li { margin: 4px 0; }
strong { color: #16213e; }
@media print { body { padding: 40px 50px; } @page { margin: 1.5cm; size: A4; } }
</style></head><body>${body}</body></html>`;

import { writeFileSync } from 'fs';
const outPath = 'c:\\Users\\hp\\oahris-research-project-main\\OAHRIS_Skeletal_Analysis_Methodology.html';
writeFileSync(outPath, fullHtml, 'utf-8');
console.log('HTML written to: ' + outPath);
