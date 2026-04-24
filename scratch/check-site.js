const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to https://fundtrack-rho.vercel.app/ ...');
  try {
    await page.goto('https://fundtrack-rho.vercel.app/', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (e) {
    console.log('Goto timeout or error:', e.message);
  }

  await page.screenshot({ path: 'scratch/screenshot.png' });
  console.log('Screenshot saved to scratch/screenshot.png');
  
  await browser.close();
  console.log('Done.');
})();
