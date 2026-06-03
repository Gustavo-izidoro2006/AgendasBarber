import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    slowMo: 300,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allLogs = [];
  const network = [];

  page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text().substring(0, 500)}`);
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('appwrite.io/v1')) {
      const shortUrl = url.replace('https://sfo.cloud.appwrite.io', '');
      let body = '';
      try { body = (await res.text()).substring(0, 500); } catch {}
      network.push({ status: res.status(), url: shortUrl, body });
    }
  });

  const shot = async (name) => {
    await page.screenshot({ path: path.join(__dirname, `test-${name}.png`) });
  };

  try {
    // 1. CADASTRO
    console.log('=== 1. CADASTRO ===');
    await page.goto(`${BASE}/cadastro`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const ts = Date.now();
    const email = `test${ts}@test.com`;
    const senha = 'Senha123!';

    await page.fill('input[placeholder*="Ex:"]', `Barbearia Teste ${ts}`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', senha);
    await page.click('button:has-text("Criar conta")');
    await page.waitForTimeout(6000);
    console.log('URL após cadastro:', page.url());

    // 2. ONBOARDING
    if (!page.url().includes('onboarding')) {
      await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    if (page.url().includes('onboarding')) {
      // Horários
      for (const dia of ['Segunda', 'Quarta', 'Sexta']) {
        await page.locator(`label:has-text("${dia}")`).first().click().catch(() => {});
      }
      const inicioInp = page.locator('input[placeholder*="início" i], input[placeholder*="inicio" i]').first();
      const fimInp = page.locator('input[placeholder*="término" i], input[placeholder*="termino" i]').first();
      if (await inicioInp.count()) await inicioInp.fill('09:00');
      if (await fimInp.count()) await fimInp.fill('18:00');
      await page.click('button:has-text("Continuar"), button[type="submit"]').catch(() => {});
      await page.waitForTimeout(2500);

      // Serviços
      const btnAdd = page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first();
      if (await btnAdd.count()) await btnAdd.click();
      await page.waitForTimeout(500);
      const nomeInp = page.locator('input[placeholder*="Ex:" i], input[placeholder*="Corte" i]').first();
      if (await nomeInp.count()) await nomeInp.fill('Corte Teste');
      const numInp = page.locator('input[type="number"]').first();
      if (await numInp.count()) await numInp.fill('45');
      await page.click('button:has-text("Continuar"), button[type="submit"]').catch(() => {});
      await page.waitForTimeout(2500);

      // Preços
      const precoInp = page.locator('input[placeholder*="Preço" i], input[placeholder*="R$"], input[type="number"]').first();
      if (await precoInp.count()) await precoInp.fill('50');

      // CONCLUIR
      await page.click('button:has-text("Concluir"), button:has-text("Finalizar")').catch(() => {});
      await page.waitForTimeout(7000);
    }

    console.log('URL final:', page.url());

    // RESULTADO
    console.log('\n========== RESULTADO ==========');
    const isDashboard = page.url().includes('dashboard');
    console.log('No dashboard?', isDashboard);

    // TODOS os logs
    console.log('\n=== TODOS OS LOGS DO CONSOLE ===');
    allLogs.forEach(l => console.log(l));

    // Requisições com erro
    const failedReqs = network.filter(n => n.status >= 400 && n.status !== 401);
    if (failedReqs.length > 0) {
      console.log('\n=== REQUISIÇÕES COM ERRO ===');
      failedReqs.forEach(r => console.log(r.status, r.url.substring(0, 120), '\n  BODY:', r.body.substring(0, 150)));
    }

    // Todas as escritas
    const writes = network.filter(n => n.url.includes('/documents'));
    console.log(`\n=== TODAS AS REQUISIÇÕES DOCUMENTS (${writes.length}) ===`);
    writes.forEach(w => console.log(w.status, w.url.substring(0, 130)));

    console.log(isDashboard ? '\n✅✅✅ SUCESSO!' : '\n❌ FALHA');

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await browser.close();
  }
})();
