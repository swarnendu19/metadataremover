import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import piexifImport from 'piexifjs';

const piexif = piexifImport.default || piexifImport;

async function makePdf(name = 'document.pdf', metadata = {}) {
  const pdf = await PDFDocument.create();
  pdf.addPage([320, 240]);
  pdf.setTitle(metadata.title ?? 'Private project title');
  pdf.setAuthor(metadata.author ?? 'Private Person');
  pdf.setSubject(metadata.subject ?? 'Confidential subject');
  pdf.setCreator(metadata.creator ?? 'Metadata Remover tests');
  pdf.setProducer(metadata.producer ?? 'Playwright fixture');
  pdf.setCreationDate(new Date('2026-08-21T08:30:00.000Z'));
  pdf.setModificationDate(new Date('2026-08-21T09:45:00.000Z'));
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) };
}

async function makeImage(page, mimeType, name, { exif = false } = {}) {
  const dataUrl = await page.evaluate((type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext('2d');
    context.fillStyle = '#10b981';
    context.fillRect(0, 0, 8, 8);
    return canvas.toDataURL(type, 0.92);
  }, mimeType);

  let encoded = dataUrl;
  if (exif) {
    const zeroth = {};
    zeroth[piexif.ImageIFD.Make] = 'Test Camera Co';
    zeroth[piexif.ImageIFD.Model] = 'Safe Model 1';
    zeroth[piexif.ImageIFD.Artist] = 'Private Photographer';
    zeroth[piexif.ImageIFD.DateTime] = '2026:08:21 14:15:16';
    const exifFields = {};
    exifFields[piexif.ExifIFD.ExposureTime] = [1, 125];
    exifFields[piexif.ExifIFD.FNumber] = [28, 10];
    const gps = {};
    gps[piexif.GPSIFD.GPSLatitudeRef] = 'N';
    gps[piexif.GPSIFD.GPSLatitude] = [[22, 1], [34, 1], [0, 1]];
    gps[piexif.GPSIFD.GPSLongitudeRef] = 'E';
    gps[piexif.GPSIFD.GPSLongitude] = [[88, 1], [21, 1], [0, 1]];
    encoded = piexif.insert(piexif.dump({ '0th': zeroth, Exif: exifFields, GPS: gps }), dataUrl);
  }

  return { name, mimeType, buffer: Buffer.from(encoded.split(',')[1], 'base64') };
}

async function upload(page, files) {
  await page.locator('#file-input').setInputFiles(files);
}

async function waitForScan(page, count) {
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`${count} file${count === 1 ? '' : 's'} scanned`);
}

function chromiumDesktopOnly(testInfo) {
  return testInfo.project.name !== 'chromium';
}

test('the selected theme persists after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
});

test('supported formats scan and clean locally', async ({ page }) => {
  await page.goto('/');
  const files = [
    await makeImage(page, 'image/jpeg', 'photo.jpg', { exif: true }),
    await makeImage(page, 'image/png', 'graphic.png'),
    await makeImage(page, 'image/webp', 'preview.webp'),
    await makePdf('report.pdf'),
  ];
  await upload(page, files);
  await waitForScan(page, 4);
  await expect(page.locator('#analysis-results article')).toHaveCount(4);

  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy check passed');
  await expect(page.locator('.result-file')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Custom PDF cleanup retains unchecked fields and removes checked fields', async ({ page }, testInfo) => {
  test.skip(chromiumDesktopOnly(testInfo), 'Focused preset coverage runs once in desktop Chromium.');
  await page.goto('/');
  await upload(page, [await makePdf('custom-fields.pdf')]);
  await waitForScan(page, 1);
  await page.getByLabel(/CustomChoose individual document fields/).check();
  await page.locator('input[name="custom-0"][value="Title"]').uncheck();
  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy check passed');
  await page.locator('.result-file details summary').click();
  await expect(page.locator('.result-file li').filter({ hasText: 'Title' })).toContainText('Retained');
  await expect(page.locator('.result-file li').filter({ hasText: 'Author' })).toContainText('Removed');
});

test('Remove Everything strips every detected PDF document field', async ({ page }, testInfo) => {
  test.skip(chromiumDesktopOnly(testInfo), 'Focused preset coverage runs once in desktop Chromium.');
  await page.goto('/');
  await upload(page, [await makePdf('remove-everything.pdf')]);
  await waitForScan(page, 1);
  await page.getByLabel(/Remove EverythingStrip every safe-to-remove metadata field/).check();
  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy check passed');
  await expect(page.locator('.result-file')).toContainText('0 after');
});

test('Photographer Mode retains safe JPEG camera data without unexpected privacy fields', async ({ page }, testInfo) => {
  test.skip(chromiumDesktopOnly(testInfo), 'Focused preset coverage runs once in desktop Chromium.');
  await page.goto('/');
  await upload(page, [await makeImage(page, 'image/jpeg', 'photographer.jpg', { exif: true })]);
  await waitForScan(page, 1);
  await page.getByLabel(/Photographer ModeKeep safe camera and exposure settings/).check();
  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy check passed');
  await expect(page.locator('.result-file')).toContainText(/Photographer Mode retained \d+ safe camera and exposure field/);
});

test('additive batches isolate scan failures and create collision-safe downloads and ZIP entries', async ({ page }, testInfo) => {
  test.skip(chromiumDesktopOnly(testInfo), 'Detailed batch verification runs once in desktop Chromium.');
  await page.goto('/');
  await upload(page, [await makePdf('duplicate.pdf', { author: 'First Author' })]);
  await waitForScan(page, 1);
  await upload(page, [
    await makePdf('duplicate.pdf', { author: 'Second Author' }),
    { name: 'corrupt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') },
  ]);
  await waitForScan(page, 2);
  await expect(page.getByText(/corrupt\.pdf: .*PDF/i)).toBeVisible();

  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy check passed');
  await expect(page.locator('.result-file')).toHaveCount(2);
  await expect(page.locator('.result-file')).toContainText(['duplicate-clean.pdf', 'duplicate-clean-2.pdf']);

  const individualDownload = page.waitForEvent('download');
  await page.locator('[data-download-index="0"]').click();
  await expect((await individualDownload).suggestedFilename()).toBe('duplicate-clean.pdf');

  const zipDownload = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const downloadedZip = await zipDownload;
  expect(downloadedZip.suggestedFilename()).toBe('metadata-cleaned-files.zip');
  const zip = await JSZip.loadAsync(await readFile(await downloadedZip.path()));
  expect(Object.keys(zip.files).sort()).toEqual(['duplicate-clean-2.pdf', 'duplicate-clean.pdf']);
});

test('one cleanup failure does not discard successful files', async ({ page }, testInfo) => {
  test.skip(chromiumDesktopOnly(testInfo), 'Injected failure verification runs once in desktop Chromium.');
  await page.goto('/');
  await upload(page, [await makePdf('successful.pdf'), await makeImage(page, 'image/png', 'fails-cleanup.png')]);
  await waitForScan(page, 2);
  await page.evaluate(() => {
    const realCreateImageBitmap = window.createImageBitmap;
    window.createImageBitmap = (file, ...args) => file?.name === 'fails-cleanup.png'
      ? Promise.reject(new Error('Simulated isolated cleanup failure'))
      : realCreateImageBitmap(file, ...args);
  });
  await page.locator('#clean-files').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Some files could not be cleaned');
  await expect(page.locator('.result-file')).toHaveCount(1);
  await expect(page.locator('.result-file')).toContainText('successful-clean.pdf');
  await expect(page.getByText(/fails-cleanup\.png: Simulated isolated cleanup failure/)).toBeVisible();
  await expect(page.locator('#retry-clean')).toBeVisible();
});
