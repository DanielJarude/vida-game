import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL='http://localhost:4185/';
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(URL);
await p.evaluate(s=>{localStorage.clear();localStorage.setItem('VIDA_GAME_SAVE_V1',s);}, readFileSync(process.env.HOME+'/vida-trabalho/qa129/saves/vida-r129-empresaria.json','utf8'));
await p.goto(URL);
await p.waitForTimeout(800);
for (let k=0;k<3 && await p.locator('.veu').count();k++){ const f=p.locator('.veu button').last(); await f.click().catch(()=>{}); await p.waitForTimeout(300);} 
await p.getByRole('button',{name:/Continuar a vida/}).click();
await p.waitForTimeout(800);
for (let k=0;k<3 && await p.locator('.veu').count();k++){ const f=p.locator('.veu button').last(); await f.click().catch(()=>{}); await p.waitForTimeout(300);}
await p.waitForTimeout(1500);
const nomes=await p.$$eval('nav button, [role=tab]', bs=>bs.map(b=>b.textContent.trim()).slice(0,40));
console.log(nomes.join(' | '));
for (const n of [/^Vida$/]) { const bt=p.getByRole('button',{name:n}).first(); if(await bt.count()){await bt.click(); await p.waitForTimeout(800);} }
console.log((await p.$$eval('[role=tab], nav button', bs=>bs.map(b=>b.textContent.trim()))).join(' | '));
for (const n of [/^Patrimônio$/]) { const t=p.getByRole('tab',{name:n}).first(); if(await t.count()){await t.click(); await p.waitForTimeout(800);} }
console.log((await p.$$eval('[role=tab]', bs=>bs.map(b=>b.textContent.trim()))).join(' | '));
console.log((await p.$$eval('main button, main a', bs=>bs.map(b=>b.textContent.trim()).slice(0,40))).join(' | '));
const emp=p.locator('main button, main a').filter({hasText:/^Empresas/}).first(); if(await emp.count()){await emp.click(); await p.waitForTimeout(1500);}
const ev=p.locator('.e129-evolucao').first();
console.log('evolucao', await ev.count());
if(await ev.count()){ await ev.scrollIntoViewIfNeeded(); await ev.screenshot({path:process.env.OUT+'/app-evolucao.png'}); console.log(await ev.locator('svg').evaluate(s=>JSON.stringify({w:s.getBoundingClientRect().width,h:s.getBoundingClientRect().height,pts:s.querySelector('polyline')?.getAttribute('points'),stroke:getComputedStyle(s.querySelector('polyline')).stroke}))); }
await p.screenshot({path:process.env.OUT+'/app-empresas.png', fullPage:true});
await b.close();
