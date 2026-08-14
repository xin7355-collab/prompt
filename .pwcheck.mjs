import { chromium } from 'playwright';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYEJRIAAIAAX/wL+n1J5AgAAAABJRU5ErkJggg==';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function trial(label, model, reply){
  const page = await browser.newPage({ viewport:{width:1200,height:900} });
  let captured=null;
  await page.route('**/generativelanguage.googleapis.com/**', r=>{
    captured={url:r.request().url(), body:JSON.parse(r.request().postData()||'{}')};
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(reply)});
  });
  await page.goto('http://localhost:8099/poster.html',{waitUntil:'networkidle'});
  await page.evaluate((m)=>{ localStorage.setItem('spellbox.poster.key','K'); if(m) localStorage.setItem('spellbox.poster.model',m); else localStorage.removeItem('spellbox.poster.model'); localStorage.removeItem('spellbox.poster.v1'); }, model);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1200);
  await page.locator('.card .btn.primary').first().click();
  await page.waitForTimeout(2000);
  const endpoint=(captured?.url||'').split('/models/')[1]?.split('?')[0];
  const saved=await page.locator('.card img').count();
  console.log(`[${label}] 端點: ${endpoint} | body keys: ${Object.keys(captured?.body||{}).join(',')} | 出圖: ${saved?'✅':'❌'}`);
  await page.close();
}

// 預設（免費 Gemini）→ 應走 :generateContent
await trial('預設免費模型', null, { candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:PNG}}]}}] });
// 手動填 imagen（付費）→ 應走 :predict
await trial('imagen 付費', 'imagen-4.0-generate-001', { predictions:[{bytesBase64Encoded:PNG}] });

// 付費牆錯誤訊息
const page = await browser.newPage();
await page.route('**/generativelanguage.googleapis.com/**', r=>r.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{message:'Imagen API is only accessible to billed users'}})}));
await page.goto('http://localhost:8099/poster.html',{waitUntil:'networkidle'});
await page.evaluate(()=>{localStorage.setItem('spellbox.poster.key','K');localStorage.setItem('spellbox.poster.model','imagen-4.0-generate-001');});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1000);
await page.locator('.card .btn.primary').first().click(); await page.waitForTimeout(1200);
const toast=await page.evaluate(()=>document.body.innerText.match(/[^\n]*免費[^\n]*/)?.[0]||'(無)');
console.log('[付費牆訊息]', toast.trim().slice(0,80));
await browser.close();
