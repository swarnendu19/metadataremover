let exifReaderModule;
let pdfModule;
let zipModule;
let piexifModule;

async function loadExifReader() { exifReaderModule ??= await import('exifreader'); return exifReaderModule.default || exifReaderModule; }
async function loadPdf() { pdfModule ??= await import('pdf-lib'); return pdfModule; }
async function loadZip() { zipModule ??= await import('jszip'); return zipModule.default; }
async function loadPiexif() { piexifModule ??= await import('piexifjs'); return piexifModule.default || piexifModule; }

const input = document.querySelector('#file-input');
const choose = document.querySelector('#choose-files');
const dropArea = document.querySelector('.dotted-surface');
const results = document.querySelector('#analysis-results');
const remover = document.querySelector('#remover');
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const state = { files: [], analyses: [], cleaned: [], scanErrors: [], cleanErrors: [] };

const pdfInfoKeys = {
  Title: 'Title',
  Author: 'Author',
  Subject: 'Subject',
  Keywords: 'Keywords',
  Creator: 'Creator',
  Producer: 'Producer',
  'Creation Date': 'CreationDate',
  'Modification Date': 'ModDate',
};

const safeJpegExifTags = {
  '0th': ['Make', 'Model', 'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit'],
  Exif: [
    'ExposureTime', 'FNumber', 'ExposureProgram', 'ISOSpeedRatings', 'SensitivityType',
    'RecommendedExposureIndex', 'ExifVersion', 'ShutterSpeedValue', 'ApertureValue',
    'BrightnessValue', 'ExposureBiasValue', 'MaxApertureValue', 'MeteringMode', 'LightSource',
    'Flash', 'FocalLength', 'ColorSpace', 'PixelXDimension', 'PixelYDimension',
    'FocalPlaneXResolution', 'FocalPlaneYResolution', 'FocalPlaneResolutionUnit', 'SensingMethod',
    'FileSource', 'SceneType', 'CustomRendered', 'ExposureMode', 'WhiteBalance',
    'DigitalZoomRatio', 'FocalLengthIn35mmFilm', 'SceneCaptureType', 'GainControl', 'Contrast',
    'Saturation', 'Sharpness', 'SubjectDistanceRange', 'LensSpecification', 'LensMake', 'LensModel',
  ],
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const size = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const cleanName = (name) => name.replace(/(\.[^.]+)?$/, '-clean$1');

function uniqueFileNames(analyses) {
  const used = new Set();
  return analyses.map((analysis) => {
    const desired = cleanName(analysis.file.name);
    let candidate = desired;
    let number = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = desired.replace(/(\.[^.]+)?$/, `-${number}$1`);
      number += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

function errorList(errors, title) {
  if (!errors.length) return '';
  return `<div class="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-danger"><p class="font-bold">${title}</p><ul class="mt-2 space-y-1">${errors.map((error) => `<li><strong>${escapeHtml(error.fileName)}</strong>: ${escapeHtml(error.message)}</li>`).join('')}</ul></div>`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read image metadata.'));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

function isTechnicalMetadataField(key) {
  const name = key.toLowerCase();
  return /^(profile|colorspacedata|renderingintent|mediawhitepoint|redmatrixcolumn|greenmatrixcolumn|bluematrixcolumn|redtrc|greentrc|bluetrc|exposuretime|fnumber|iso|aperture|shutterspeed|brightness|exposurebias|meteringmode|lightsource|flash|focallength|whitebalance)/.test(name);
}

function signalFor(key) {
  const name = key.toLowerCase();
  if (isTechnicalMetadataField(key)) return { category: 'Technical', score: 0, label: 'Low', meaning: 'This is a display, camera, or exposure setting and is not personally identifying.' };
  if (/gps|latitude|longitude|altitude|location/.test(name)) return { category: 'Location', score: 35, label: 'High', meaning: 'This may reveal where the file was created.' };
  if (/serial|owner|author|artist|creator|company|copyright/.test(name)) return { category: 'Identity', score: 25, label: 'High', meaning: 'This may reveal a person, organization, or device identity.' };
  if (/date|time/.test(name)) return { category: 'Time', score: 12, label: 'Medium', meaning: 'This can reveal when the file was created or edited.' };
  if (/model|make|camera|device/.test(name)) return { category: 'Device', score: 10, label: 'Medium', meaning: 'This identifies hardware used to create the file.' };
  if (/software|producer|application/.test(name)) return { category: 'Software', score: 6, label: 'Low', meaning: 'This reveals software used to create or edit the file.' };
  return { category: 'Other', score: 0, label: 'Low', meaning: 'This field is not usually personally identifying.' };
}

function isStructuralField(key) {
  const normalized = key.replace(/\s+/g, '');
  return /^(file|jfif|pngfile|riff|icc)\./i.test(normalized)
    || /^(imagewidth|imageheight|bitdepth|colortype|compression|filter|interlace|mime|filesize)$/i.test(normalized)
    || isTechnicalMetadataField(key);
}

function riskFor(fields) {
  const sensitive = fields.filter((field) => field.signal.score > 0);
  const score = Math.min(100, sensitive.reduce((total, field) => total + field.signal.score, 0));
  return { score, sensitive, label: score >= 50 ? 'High' : score >= 20 ? 'Medium' : 'Low' };
}

async function imageDimensions(file) {
  const bitmap = await createImageBitmap(file);
  const dimensions = `${bitmap.width} × ${bitmap.height}`;
  bitmap.close();
  return dimensions;
}

function readableTagValue(tag) {
  if (tag === undefined || tag === null) return '';
  if (typeof tag !== 'object') return String(tag);
  if (tag.description !== undefined && tag.description !== '') return String(tag.description);
  if (tag.computed !== undefined && tag.computed !== '') return String(tag.computed);
  const value = tag.value ?? tag;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    const bytes = value.byteLength ?? value.length ?? 0;
    return `Embedded binary metadata (${bytes} bytes)`;
  }
  if (Array.isArray(value)) return value.map((item) => readableTagValue(item)).filter(Boolean).join(', ');
  try { return JSON.stringify(value); } catch { return String(value); }
}

function metadataFields(tags) {
  const fields = [];
  const ignoredGroups = new Set(['thumbnail', 'errors']);
  Object.entries(tags || {}).forEach(([group, entries]) => {
    if (ignoredGroups.has(group.toLowerCase()) || !entries || typeof entries !== 'object') return;
    Object.entries(entries).forEach(([key, tag]) => {
      if (key === '_raw' || key === 'base64' || key === 'image') return;
      const value = readableTagValue(tag);
      if (!value) return;
      const displayKey = ['exif', 'gps', 'composite'].includes(group.toLowerCase()) ? key : `${group}.${key}`;
      fields.push({ key: displayKey, value, signal: signalFor(displayKey) });
    });
  });
  return fields;
}

async function analyzeImage(file) {
  let fields = [];
  try {
    const ExifReader = await loadExifReader();
    const metadata = ExifReader.load(await file.arrayBuffer(), {
      expanded: true,
      computed: true,
      includeUnknown: true,
      excludeTags: { mpf: true },
    });
    fields = metadataFields(metadata);
  } catch (error) {
    throw new Error(`Metadata scan failed: ${error?.message || 'the image metadata could not be parsed.'}`);
  }
  const privacyFields = fields.filter((field) => !isStructuralField(field.key));
  return { file, kind: 'image', dimensions: await imageDimensions(file), fields, privacyFields, structuralFields: fields.filter((field) => isStructuralField(field.key)), ...riskFor(privacyFields) };
}

async function analyzePdf(file) {
  const { PDFDocument } = await loadPdf();
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  const known = [['Title', pdf.getTitle()], ['Author', pdf.getAuthor()], ['Subject', pdf.getSubject()], ['Keywords', pdf.getKeywords()], ['Creator', pdf.getCreator()], ['Producer', pdf.getProducer()], ['Creation Date', pdf.getCreationDate()], ['Modification Date', pdf.getModificationDate()]];
  const fields = known.filter(([, value]) => value).map(([key, value]) => ({ key, value: value instanceof Date ? value.toISOString() : String(value), signal: signalFor(key) }));
  return { file, kind: 'pdf', dimensions: `${pdf.getPageCount()} page${pdf.getPageCount() === 1 ? '' : 's'}`, fields, privacyFields: fields, structuralFields: [], ...riskFor(fields) };
}

function fieldRow(field) {
  const tone = field.signal.label === 'High' ? 'bg-[#fef2f2] text-danger' : field.signal.label === 'Medium' ? 'bg-[#fff7ed] text-warning' : 'bg-surface-card text-muted';
  return `<li class="border-b border-hairline py-3 last:border-0"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-bold text-ink">${escapeHtml(field.key)}</p><p class="mt-1 break-all font-mono text-xs text-muted">${escapeHtml(field.value)}</p><p class="mt-1 text-xs text-body">${escapeHtml(field.signal.meaning)}</p></div><span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone}">${field.signal.label}</span></div></li>`;
}

function presetMarkup(analysis, index) {
  const options = [
    ['privacy', 'Privacy Clean', 'Remove privacy-sensitive information.'],
    ['everything', 'Remove Everything', 'Strip every safe-to-remove metadata field.'],
    ['photographer', 'Photographer Mode', analysis.file.type === 'image/jpeg'
      ? 'Keep safe camera and exposure settings.'
      : analysis.kind === 'image'
        ? 'Use a safe full-removal fallback for this format.'
        : 'Remove identity and exact document dates.'],
  ];
  if (analysis.kind === 'pdf') options.push(['custom', 'Custom', 'Choose individual document fields.']);

  const radios = options.map(([value, title, description], optionIndex) => `<label class="preset-option flex cursor-pointer gap-3 rounded-lg p-3 text-xs text-body"><input type="radio" name="preset-${index}" value="${value}" ${optionIndex === 0 ? 'checked' : ''}> <span><strong class="block text-sm text-ink">${title}</strong>${description}</span></label>`).join('');
  if (analysis.kind !== 'pdf') return `<div class="preset-grid mt-3 grid gap-2 sm:grid-cols-2">${radios}</div>`;

  const fields = analysis.fields.map((field) => `<label class="flex items-start gap-3 rounded-lg border border-hairline bg-white p-3 text-xs text-body"><input class="mt-0.5" type="checkbox" name="custom-${index}" value="${escapeHtml(field.key)}" checked> <span><strong class="block text-sm text-ink">${escapeHtml(field.key)}</strong><span class="mt-0.5 block break-all font-mono text-muted">${escapeHtml(field.value)}</span></span></label>`).join('');
  const customFields = fields || '<p class="text-sm text-muted">No removable document fields were detected.</p>';
  return `<div class="preset-grid mt-3 grid gap-2 sm:grid-cols-2">${radios}</div><fieldset data-custom-fields class="mt-3 hidden rounded-xl border border-hairline p-3"><legend class="px-1 text-sm font-bold text-ink">Fields to remove</legend><p class="mb-3 text-xs text-muted">Selected fields will be removed. Unselected fields will remain.</p><div class="grid gap-2 sm:grid-cols-2">${customFields}</div></fieldset>`;
}

function render() {
  const scanned = state.analyses.length;
  const unsafe = state.analyses.filter((analysis) => analysis.sensitive.length).length;
  results.classList.remove('hidden');
  results.innerHTML = `<div class="rounded-xl border border-hairline bg-white p-4 sm:p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-mono text-xs uppercase tracking-[0.12em] text-muted">Local privacy scan complete</p><h1 class="mt-1 font-display text-xl font-extrabold tracking-[-0.035em]">${scanned} file${scanned === 1 ? '' : 's'} scanned, ${unsafe ? `${unsafe} need attention` : 'ready to share'}</h1></div><div class="flex gap-2"><button id="add-files" class="rounded-lg border border-hairline px-3 py-2 text-xs font-bold text-body">Add files</button><button id="reset-files" class="rounded-lg border border-hairline px-3 py-2 text-xs font-bold text-body">Start over</button></div></div>${state.analyses.map((analysis, index) => `<article class="mt-5 rounded-xl bg-surface-soft p-4"><div class="flex flex-wrap items-start justify-between gap-3"><div><h4 class="break-all text-sm font-extrabold text-ink">${escapeHtml(analysis.file.name)}</h4><p class="mt-1 font-mono text-xs text-muted">${size(analysis.file.size)} · ${analysis.dimensions} · ${analysis.fields.length} metadata fields</p></div><span class="rounded-full px-3 py-1.5 text-xs font-bold ${analysis.score >= 50 ? 'bg-[#fef2f2] text-danger' : analysis.score >= 20 ? 'bg-[#fff7ed] text-warning' : 'bg-[#ecfdf5] text-success'}">${analysis.label} risk · ${analysis.score}/100</span></div>${analysis.privacyFields.length ? `<details class="mt-4"><summary class="cursor-pointer text-sm font-bold text-ink">Review ${analysis.privacyFields.length} privacy field${analysis.privacyFields.length === 1 ? '' : 's'}</summary><ul>${analysis.privacyFields.map(fieldRow).join('')}</ul></details>` : '<div class="mt-4 rounded-lg border border-hairline bg-white p-3 text-sm text-success"><strong>Clear result.</strong> No readable privacy metadata was found.</div>'}<div class="mt-4 border-t border-hairline pt-4"><p class="text-sm font-bold text-ink">Choose how to clean</p><p class="mt-1 text-xs text-muted">Privacy Clean is recommended for most files.</p>${presetMarkup(analysis, index)}<p class="mt-3 text-xs leading-5 text-muted">Images are safely rebuilt in your browser. PDFs keep visible pages unchanged.</p></div></article>`).join('')}${errorList(state.scanErrors, 'Some files could not be scanned')}${scanned ? `<button id="clean-files" class="mt-5 w-full rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white">Clean ${scanned} file${scanned === 1 ? '' : 's'} locally</button>` : ''}</div>`;
  state.analyses.forEach((analysis, index) => {
    const card = results.querySelectorAll('article')[index];
    card.querySelector('.font-mono').textContent = `${size(analysis.file.size)} · ${analysis.dimensions} · ${analysis.privacyFields.length} privacy field${analysis.privacyFields.length === 1 ? '' : 's'} · ${analysis.structuralFields.length} technical properties`;
    const summary = card.querySelector('details summary');
    if (summary && !analysis.privacyFields.length) summary.textContent = `Review ${analysis.structuralFields.length} technical file properties`;
    const customFields = card.querySelector('[data-custom-fields]');
    card.querySelectorAll(`input[name="preset-${index}"]`).forEach((radio) => radio.addEventListener('change', () => {
      customFields?.classList.toggle('hidden', radio.value !== 'custom');
    }));
  });
  document.querySelector('#add-files').addEventListener('click', () => input.click());
  document.querySelector('#reset-files').addEventListener('click', reset);
  document.querySelector('#clean-files')?.addEventListener('click', cleanAll);
}

async function ingest(files) {
  const incoming = [...files];
  if (!incoming.length) return;
  const accepted = incoming.filter((file) => supportedTypes.has(file.type));
  const rejected = incoming.filter((file) => !supportedTypes.has(file.type));
  input.value = '';
  state.files.push(...accepted);
  state.scanErrors.push(...rejected.map((file) => ({ fileName: file.name, message: 'Unsupported format. Choose JPG, PNG, WebP, or PDF.' })));
  remover.classList.add('has-results');
  results.classList.remove('hidden');
  const fileCount = accepted.length;
  results.innerHTML = `<div class="scan-loading flex flex-col items-center justify-center rounded-xl border border-hairline bg-white p-6 text-center" role="status" aria-live="polite"><span class="scan-spinner" aria-hidden="true"></span><p class="mt-5 font-display text-lg font-extrabold text-ink">Scanning ${fileCount} file${fileCount === 1 ? '' : 's'} locally</p><p class="mt-2 max-w-sm text-sm leading-6 text-muted">Checking metadata on this device. Large photos and PDFs can take a little longer.</p><div class="scan-progress mt-6" aria-hidden="true"><span></span></div><p class="mt-4 font-mono text-xs text-muted">Your files are never uploaded</p></div>`;
  const outcomes = await Promise.all(accepted.map(async (file) => {
    try {
      const analysis = file.type === 'application/pdf' ? await analyzePdf(file) : await analyzeImage(file);
      return { analysis };
    } catch (error) {
      return { error: { fileName: file.name, message: error.message || 'This file could not be read safely.' } };
    }
  }));
  state.analyses.push(...outcomes.filter((outcome) => outcome.analysis).map((outcome) => outcome.analysis));
  state.scanErrors.push(...outcomes.filter((outcome) => outcome.error).map((outcome) => outcome.error));
  render();
}

async function cleanImage(analysis, preset, outputName) {
  const bitmap = await createImageBitmap(analysis.file);
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
  const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0); bitmap.close();
  const type = analysis.file.type;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, type === 'image/png' ? undefined : 0.92));
  if (!blob) throw new Error(`Could not safely rebuild ${analysis.file.name}.`);
  if (preset !== 'photographer') return { file: new File([blob], outputName, { type }) };
  if (type !== 'image/jpeg') return {
    file: new File([blob], outputName, { type }),
    cleanupNote: 'Photographer Mode used full metadata removal because this image format cannot safely preserve selected EXIF fields.',
  };

  try {
    const piexif = await loadPiexif();
    const source = piexif.load(await blobToDataUrl(analysis.file));
    const safe = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
    Object.entries(safeJpegExifTags).forEach(([section, names]) => names.forEach((name) => {
      const tag = piexif[`${section === '0th' ? 'Image' : section}IFD`]?.[name];
      if (tag !== undefined && source[section]?.[tag] !== undefined) safe[section][tag] = source[section][tag];
    }));
    const retained = Object.keys(safe['0th']).length + Object.keys(safe.Exif).length;
    if (!retained) return {
      file: new File([blob], outputName, { type }),
      cleanupNote: 'No safe camera or exposure settings were available to retain.',
    };
    const cleanedDataUrl = await blobToDataUrl(blob);
    const output = piexif.insert(piexif.dump(safe), cleanedDataUrl);
    return {
      file: new File([await dataUrlToBlob(output)], outputName, { type }),
      cleanupNote: `Photographer Mode retained ${retained} safe camera and exposure field${retained === 1 ? '' : 's'}.`,
    };
  } catch {
    return {
      file: new File([blob], outputName, { type }),
      cleanupNote: 'Camera settings could not be preserved safely, so all metadata was removed.',
    };
  }
}

function pdfKeysForPreset(analysis, preset, selectedFields = []) {
  const all = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate'];
  if (preset === 'photographer') return ['Author', 'Creator', 'CreationDate', 'ModDate'];
  if (preset === 'privacy') return analysis.fields.filter((field) => field.signal.score > 0).map((field) => pdfInfoKeys[field.key]);
  if (preset === 'custom') return selectedFields.map((field) => pdfInfoKeys[field]).filter(Boolean);
  return all;
}

async function cleanPdf(analysis, preset, selectedFields, outputName) {
  const { PDFDocument, PDFName } = await loadPdf();
  const pdf = await PDFDocument.load(await analysis.file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  const info = pdf.context.lookup(pdf.context.trailerInfo.Info);
  if (info) pdfKeysForPreset(analysis, preset, selectedFields).forEach((key) => info.delete(PDFName.of(key)));
  const bytes = await pdf.save({ useObjectStreams: true, updateFieldAppearances: false });
  return new File([bytes], outputName, { type: 'application/pdf' });
}

async function cleanAll() {
  const button = document.querySelector('#clean-files');
  button.disabled = true; button.textContent = 'Cleaning locally...';
  state.cleaned = [];
  state.cleanErrors = [];
  try {
    const outputNames = uniqueFileNames(state.analyses);
    const outcomes = await Promise.all(state.analyses.map(async (analysis, index) => {
      try {
        const preset = document.querySelector(`input[name="preset-${index}"]:checked`).value;
        const selectedFields = [...document.querySelectorAll(`input[name="custom-${index}"]:checked`)].map((field) => field.value);
        const cleaned = analysis.kind === 'pdf'
          ? { file: await cleanPdf(analysis, preset, selectedFields, outputNames[index]) }
          : await cleanImage(analysis, preset, outputNames[index]);
        const { file, cleanupNote } = cleaned;
        const verified = analysis.kind === 'pdf' ? await analyzePdf(file) : await analyzeImage(file);
        return { item: { original: analysis, file, verified, preset, cleanupNote } };
      } catch (error) {
        return { error: { fileName: analysis.file.name, message: error.message || 'Cleanup or verification failed.' } };
      }
    }));
    state.cleaned = outcomes.filter((outcome) => outcome.item).map((outcome) => outcome.item);
    state.cleanErrors = outcomes.filter((outcome) => outcome.error).map((outcome) => outcome.error);
    renderComplete();
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Try cleaning again';
    state.cleanErrors = [{ fileName: 'Batch', message: error.message || 'Cleanup could not finish.' }];
    renderComplete();
  }
}

function download(file) { const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function comparisonRows(item) {
  const after = new Map(item.verified.fields.map((field) => [field.key, field]));
  return item.original.privacyFields.map((field) => {
    const retained = after.has(field.key);
    return `<li class="flex items-start justify-between gap-3 border-b border-hairline py-3 last:border-0"><div><p class="text-sm font-bold text-ink">${escapeHtml(field.key)}</p><p class="mt-1 break-all font-mono text-xs text-muted">Before: ${escapeHtml(field.value)}</p>${retained ? `<p class="mt-1 break-all font-mono text-xs text-body">After: ${escapeHtml(after.get(field.key).value)}</p>` : ''}</div><span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${retained ? 'bg-[#fff7ed] text-warning' : 'bg-[#ecfdf5] text-success'}">${retained ? 'Retained' : 'Removed'}</span></li>`;
  }).join('') || '<li class="py-3 text-sm text-muted">No privacy metadata was present before cleanup.</li>';
}

function comparisonPanel(item) {
  if (!item.original.privacyFields.length) return '<div class="mt-4 rounded-lg border border-hairline bg-surface-soft p-3 text-sm text-body"><strong class="text-ink">Already private.</strong> No privacy metadata was present before cleanup.</div>';
  return `<details class="mt-4"><summary>Privacy changes <span class="ml-2 font-normal text-muted">${item.original.privacyFields.length} checked</span></summary><ul>${comparisonRows(item)}</ul></details>`;
}

function unexpectedSensitiveFields(item) {
  if (item.preset !== 'photographer') return item.verified.sensitive;
  if (item.original.kind === 'pdf') return item.verified.sensitive.filter((field) => field.key !== 'Producer');
  const expectedCameraField = /^(make|model|lensmake|lensmodel)$/i;
  return item.verified.sensitive.filter((field) => {
    const leafKey = field.key.split('.').pop().replace(/\s+/g, '');
    return !expectedCameraField.test(leafKey);
  });
}

function renderComplete() {
  const remaining = state.cleaned.reduce((total, item) => total + unexpectedSensitiveFields(item).length, 0);
  const failed = state.cleanErrors.length;
  const allFailed = !state.cleaned.length && failed;
  const heading = allFailed ? 'Cleanup could not finish' : failed ? 'Some files could not be cleaned' : remaining ? 'Some selected information remains' : 'Privacy check passed';
  const summary = allFailed
    ? 'No files were changed. Review the errors below and try again.'
    : `${state.cleaned.length} cleaned file${state.cleaned.length === 1 ? '' : 's'} rescanned locally. ${remaining ? `${remaining} sensitive field${remaining === 1 ? '' : 's'} remain.` : 'No unexpected privacy-sensitive metadata remains.'}${failed ? ` ${failed} file${failed === 1 ? '' : 's'} failed without affecting the successful files.` : ''}`;
  const cards = state.cleaned.map((item, index) => `<div class="result-file rounded-lg border border-hairline bg-white p-4"><div class="flex flex-wrap items-center justify-between gap-3"><div class="min-w-0 flex-1"><p class="break-words text-sm font-bold text-ink">${escapeHtml(item.file.name)}</p><p class="mt-1 text-xs text-muted">${item.original.privacyFields.length} privacy field${item.original.privacyFields.length === 1 ? '' : 's'} before · ${item.verified.privacyFields.length} after · ${item.original.dimensions}</p></div><button data-download-index="${index}" class="${state.cleaned.length > 1 ? 'result-download' : 'bg-ink text-white'} rounded-lg px-3 py-2 text-xs font-bold">Download</button></div>${item.cleanupNote ? `<p class="mt-3 rounded-lg bg-surface-card p-3 text-xs leading-5 text-body">${escapeHtml(item.cleanupNote)}</p>` : ''}${comparisonPanel(item)}${item.verified.structuralFields.length ? `<p class="mt-3 text-xs text-muted">${item.verified.structuralFields.length} technical display propert${item.verified.structuralFields.length === 1 ? 'y was' : 'ies were'} retained.</p>` : ''}</div>`).join('');
  results.innerHTML = `<div class="rounded-xl border ${allFailed ? 'border-[#fecaca]' : 'border-hairline'} bg-white p-5"><p class="font-mono text-xs font-medium uppercase tracking-[0.12em] ${allFailed ? 'text-danger' : 'text-success'}">${allFailed ? 'Cleanup stopped safely' : 'Verification complete'}</p><h1 class="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">${heading}</h1><p class="mt-2 text-sm leading-6 text-body">${summary}</p>${cards ? `<div class="mt-5 space-y-3">${cards}</div>` : ''}${errorList(state.cleanErrors, 'Files that were not changed')}<div class="mt-4 flex flex-wrap gap-3">${state.cleaned.length > 1 ? '<button id="download-zip" class="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white">Download all as ZIP</button>' : ''}${failed ? '<button id="retry-clean" class="rounded-lg border border-ink px-4 py-2.5 text-sm font-bold text-ink">Review and try again</button>' : ''}<button id="clean-another" class="rounded-lg px-4 py-2.5 text-sm font-bold text-body">Clean another file</button></div></div>`;
  if (state.cleaned.length && !failed && state.cleaned.every((item) => !item.original.privacyFields.length)) {
    results.querySelector('h1').textContent = 'This file was already safe to share';
    results.querySelector('h1 + p').textContent = 'We found no privacy metadata before cleanup. The file was rescanned and remains free of readable privacy-sensitive metadata.';
  }
  document.querySelectorAll('[data-download-index]').forEach((button) => button.addEventListener('click', () => download(state.cleaned[Number(button.dataset.downloadIndex)].file)));
  document.querySelector('#clean-another').addEventListener('click', reset);
  document.querySelector('#retry-clean')?.addEventListener('click', render);
  const zipButton = document.querySelector('#download-zip');
  if (zipButton) zipButton.addEventListener('click', async () => { zipButton.textContent = 'Preparing ZIP...'; const JSZip = await loadZip(); const zip = new JSZip(); state.cleaned.forEach((item) => zip.file(item.file.name, item.file)); download(new File([await zip.generateAsync({ type: 'blob' })], 'metadata-cleaned-files.zip', { type: 'application/zip' })); zipButton.textContent = 'Download all as ZIP'; });
}

function reset() { state.files = []; state.analyses = []; state.cleaned = []; state.scanErrors = []; state.cleanErrors = []; input.value = ''; remover.classList.remove('has-results'); results.classList.add('hidden'); results.innerHTML = ''; }
choose.addEventListener('click', () => input.click());
input.addEventListener('change', () => ingest(input.files));
['dragenter', 'dragover'].forEach((event) => dropArea.addEventListener(event, (e) => { e.preventDefault(); dropArea.classList.add('border-ink'); }));
['dragleave', 'drop'].forEach((event) => dropArea.addEventListener(event, (e) => { e.preventDefault(); dropArea.classList.remove('border-ink'); }));
dropArea.addEventListener('drop', (event) => ingest(event.dataTransfer.files));
window.addEventListener('paste', (event) => { const images = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/')); if (images.length) ingest(images); });
