import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import path from 'path';
const exe = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const mode = process.argv[2] || 'stills';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.resolve('index.html'));
await page.evaluate(async () => {
  for (const w of [400,500,600,700,800]) await document.fonts.load(`${w} 20px Inter`);
  await document.fonts.load('20px Ion'); await document.fonts.load('20px MCI');
  await window.ready;
});
if (mode === 'stills') {
  const times = process.argv.slice(3).map(Number);
  for (const t of times) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: `stills/s_${t.toFixed(2)}.png` });
  }
} else {
  const fps = 30, dur = 22.0, N = Math.round(fps * dur);
  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','png','-i','-',
    '-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-movflags','+faststart','video_noaudio.mp4'], { stdio: ['pipe','inherit','inherit'] });
  for (let i = 0; i < N; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
