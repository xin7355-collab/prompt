import { chromium } from 'playwright';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYEJRIAAIAAX/wL+n1J5AgAAAABJRU5ErkJggg==';
const OUT='/tmp/claude-0/-home-user-prompt/8a53d792-e047-521b-be16-5ad18f4a3af3/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport:{width:1200,height:900} });
const errors=[]; page.on('pageerror',e=>errors.push(e.message.slice(0,90)));

let captured=null;
await page.route('**/generativelanguage.googleapis.com/**', r=>{
  captured={url:r.request().url(), body:JSON.parse(r.request().postData()||'{}')};
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:PNG}}]}}]})});
});

await page.goto('http://localhost:8099/poster.html',{waitUntil:'networkidle'});
await page.evaluate(()=>localStorage.setItem('spellbox.poster.key','K'));
await page.reload({waitUntil:'networkidle'});
await page.waitForTimeout(1200);

// 1c. 按鈕中文
const btns = await page.locator('.card:first-child .btn').allTextContents();
console.log('1c. 卡片按鈕:', JSON.stringify(btns));

// 1a. 模型下拉
const isSelect = await page.locator('#openSettings').click().then(()=>page.waitForTimeout(300)).then(()=>page.evaluate(()=>document.getElementById('modelInput').tagName));
const opts = await page.locator('#modelInput option').allTextContents();
console.log('1a. 模型欄位是:', isSelect, '| 選項數:', opts.length, '| 第一個:', opts[0]?.slice(0,30));
await page.locator('#closeSettings').click();
await page.waitForTimeout(300);

// 1d. 上傳照片 → 生成時帶進 request
const upload = 'data:image/png;base64,'+PNG;
await page.evaluate((u)=>{ localStorage.setItem('spellbox.poster.face', u); }, upload);
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1000);
const faceShown = await page.locator('#facePreview').isVisible();
const hint = await page.locator('#faceHint').textContent();
console.log('1d. 上傳預覽顯示:', faceShown, '| 提示:', hint.slice(0,24));

await page.locator('.card .btn.primary').first().click();
await page.waitForTimeout(1800);
const parts = captured?.body?.contents?.[0]?.parts || [];
const hasImagePart = parts.some(p=>p.inlineData);
const textPart = parts.find(p=>p.text)?.text || '';
console.log('1d. request 帶了照片:', hasImagePart?'✅':'❌', '| 文字前綴:', textPart.slice(0,42));
console.log('    出圖:', await page.locator('.card img').count()?'✅':'❌');
await page.screenshot({ path:`${OUT}/B0-poster-face.png` });

console.log('errors:', errors.slice(0,3));
await browser.close();
