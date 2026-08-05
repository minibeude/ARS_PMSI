(() => {
  'use strict';

  // Confidentialité : les RTF, PNG, PDF et ZIP restent exclusivement dans ce navigateur.
  // Aucun fetch, XMLHttpRequest, formulaire ou appel API ne transmet les documents utilisateur.
  const RTF_ENGINE_ERROR = 'Le moteur de lecture RTF n’a pas pu être chargé. Vérifiez votre connexion réseau puis rechargez la page.';
  const RTF_PARSE_ERROR = 'Ce document RTF n’a pas pu être interprété correctement. Vérifiez qu’il s’ouvre dans Microsoft Word et qu’il a bien été enregistré au format RTF standard.';
  const RTF_METADATA_ERROR = 'Le fichier RTF n’a pas été interprété correctement : des métadonnées techniques apparaissent dans le document.';
  const A4 = { width: 210, height: 297, margin: 18 };
  const PX_PER_MM = 96 / 25.4;

  const state = { files: [], signature: null, signatureUrl: null, generated: [], processing: false, previewDone: false };
  const els = {
    rtfInput: document.getElementById('rtfInput'), rtfDropZone: document.getElementById('rtfDropZone'), rtfError: document.getElementById('rtfError'), rtfCount: document.getElementById('rtfCount'), rtfList: document.getElementById('rtfList'), clearRtfButton: document.getElementById('clearRtfButton'),
    signatureInput: document.getElementById('signatureInput'), signatureDropZone: document.getElementById('signatureDropZone'), signatureError: document.getElementById('signatureError'), signaturePreview: document.getElementById('signaturePreview'), removeSignatureButton: document.getElementById('removeSignatureButton'),
    signatureWidth: document.getElementById('signatureWidth'), signatureAlignment: document.getElementById('signatureAlignment'), spacingLines: document.getElementById('spacingLines'), previewButton: document.getElementById('previewButton'), rtfPreview: document.getElementById('rtfPreview'), previewMessage: document.getElementById('previewMessage'), generateButton: document.getElementById('generateButton'), downloadZipButton: document.getElementById('downloadZipButton'), resetButton: document.getElementById('resetButton'), globalProgress: document.getElementById('globalProgress'), progressText: document.getElementById('progressText'), resultMessage: document.getElementById('resultMessage')
  };

  const fmtSize = bytes => bytes < 1024 ? `${bytes} o` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} Ko` : `${(bytes / 1048576).toFixed(1)} Mo`;
  const isRtf = file => /\.rtf$/i.test(file.name) || ['application/rtf', 'text/rtf'].includes(file.type);
  const isPng = file => /\.png$/i.test(file.name) || file.type === 'image/png';
  const keyOf = file => `${file.name}-${file.size}-${file.lastModified}`;
  const yieldUi = () => new Promise(resolve => setTimeout(resolve, 0));

  function setMessage(el, message = '') { el.textContent = message; }
  function updateButtons() {
    els.generateButton.disabled = state.processing || state.files.length === 0 || !state.signature;
    els.previewButton.disabled = state.processing || state.files.length === 0;
    els.downloadZipButton.disabled = state.processing || state.generated.length === 0;
    els.clearRtfButton.disabled = state.processing || state.files.length === 0;
    els.removeSignatureButton.disabled = state.processing || !state.signature;
  }

  function addRtfFiles(fileList) {
    const errors = [];
    [...fileList].forEach(file => {
      if (!isRtf(file)) { errors.push(`${file.name} n’est pas un fichier RTF.`); return; }
      if (state.files.some(item => item.key === keyOf(file))) { errors.push(`${file.name} est déjà sélectionné.`); return; }
      state.files.push({ key: keyOf(file), file, status: 'En attente', message: '', pdfBlob: null, pdfName: file.name.replace(/\.rtf$/i, '.pdf') });
    });
    state.previewDone = false; clearPreview(); setMessage(els.rtfError, errors.join(' ')); renderFiles();
  }

  function renderFiles() {
    els.rtfCount.textContent = `${state.files.length} fichier${state.files.length > 1 ? 's' : ''} sélectionné${state.files.length > 1 ? 's' : ''}`;
    els.rtfList.innerHTML = '';
    if (!state.files.length) { els.rtfList.innerHTML = '<tr><td colspan="5">Aucun fichier RTF sélectionné.</td></tr>'; updateButtons(); return; }
    state.files.forEach(item => {
      const tr = document.createElement('tr');
      const download = item.pdfBlob ? `<button class="btn btn-secondary" type="button" data-download="${item.key}">Télécharger le PDF</button>` : '';
      tr.innerHTML = `<td>${escapeHtml(item.file.name)}</td><td>${fmtSize(item.file.size)}</td><td>${item.status}</td><td>${escapeHtml(item.message || '')}</td><td>${download}<button class="btn btn-secondary" type="button" data-remove="${item.key}" ${state.processing ? 'disabled' : ''}>Retirer</button></td>`;
      els.rtfList.appendChild(tr);
    });
    updateButtons();
  }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }

  function setSignature(file) {
    if (!file) return;
    if (!isPng(file)) { setMessage(els.signatureError, `${file.name} n’est pas une image PNG.`); return; }
    clearSignature(); state.signature = file; state.signatureUrl = URL.createObjectURL(file);
    els.signaturePreview.innerHTML = `<img src="${state.signatureUrl}" alt="Aperçu de la signature sélectionnée"><p><strong>${escapeHtml(file.name)}</strong> — ${fmtSize(file.size)}</p>`;
    setMessage(els.signatureError); updateButtons();
  }
  function clearSignature() { if (state.signatureUrl) URL.revokeObjectURL(state.signatureUrl); state.signature = null; state.signatureUrl = null; els.signatureInput.value = ''; els.signaturePreview.textContent = 'Aucune signature sélectionnée.'; updateButtons(); }
  function clearPreview() { els.rtfPreview.innerHTML = '<p class="hint">Aucune prévisualisation générée.</p>'; setMessage(els.previewMessage); }

  function ensureRtfEngine() {
    if (!window.RTFJS || !window.RTFJS.Document || !window.html2canvas || !window.jspdf || !window.JSZip) throw new Error('RTF_ENGINE_MISSING');
    if (window.RTFJS.loggingEnabled) window.RTFJS.loggingEnabled(false);
    if (window.WMFJS && window.WMFJS.loggingEnabled) window.WMFJS.loggingEnabled(false);
    if (window.EMFJS && window.EMFJS.loggingEnabled) window.EMFJS.loggingEnabled(false);
  }

  async function renderRtfFile(file) {
    ensureRtfEngine();
    if (!file.size) throw new Error('EMPTY_RTF');
    const buffer = await file.arrayBuffer();
    const doc = new window.RTFJS.Document(buffer);
    const elements = await doc.render();
    const container = document.createElement('article');
    container.className = 'rtf-rendered-content';
    elements.forEach(element => container.appendChild(element));
    if (!container.textContent.trim()) throw new Error('UNSUPPORTED_RTF');
    assertNoTechnicalMetadata(container);
    return container;
  }

  function assertNoTechnicalMetadata(container) {
    const head = container.textContent.split(/\n+/).map(line => line.trim()).filter(Boolean).slice(0, 8).join(' ');
    const suspicious = /(Times New Roman\s*;?\s*Arial\s*;|Courier New\s*;.*Wingdings|fonttbl|colortbl|stylesheet|\\rtf1|\\ansi|\\f\d+|\\fs\d+)/i;
    if (suspicious.test(head)) throw new Error('RTF_METADATA_VISIBLE');
  }

  async function previewFirst() {
    if (!state.files.length) return setMessage(els.previewMessage, 'Sélectionnez au moins un fichier RTF.');
    setMessage(els.previewMessage, 'Prévisualisation en cours…'); els.previewButton.disabled = true;
    try {
      const rendered = await renderRtfFile(state.files[0].file);
      els.rtfPreview.innerHTML = ''; els.rtfPreview.appendChild(rendered);
      state.previewDone = true; setMessage(els.previewMessage, 'Vérifiez cette prévisualisation avant de générer les PDF. La mise en page du PDF doit reprendre ce contenu.');
    } catch (error) { console.error('Erreur de prévisualisation RTF', error); setMessage(els.previewMessage, friendlyError(error)); state.previewDone = false; }
    updateButtons();
  }

  async function generateAll() {
    if (!state.files.length) return setMessage(els.resultMessage, 'Sélectionnez au moins un fichier RTF.');
    if (!state.signature) return setMessage(els.resultMessage, 'Sélectionnez une signature PNG.');
    if (!state.previewDone && !window.confirm('Aucune prévisualisation n’a été effectuée. Vérifiez idéalement le premier arrêté avant de générer les PDF. Continuer ?')) return;
    state.processing = true; state.generated = []; els.globalProgress.value = 0; setMessage(els.resultMessage, 'Génération en cours…'); updateButtons();
    state.files.forEach(item => { item.status = 'En attente'; item.message = ''; item.pdfBlob = null; }); renderFiles();
    for (let i = 0; i < state.files.length; i += 1) {
      const item = state.files[i]; item.status = 'En cours'; renderFiles(); await yieldUi();
      try { item.pdfBlob = await createPdf(item.file); item.status = 'Terminé'; item.message = 'PDF généré.'; state.generated.push(item); }
      catch (error) { console.error(`Erreur de génération pour ${item.file.name}`, error); item.status = 'Erreur'; item.message = friendlyError(error); }
      els.globalProgress.value = Math.round(((i + 1) / state.files.length) * 100); els.progressText.textContent = `${i + 1} fichier${i ? 's' : ''} traité${i ? 's' : ''} sur ${state.files.length}.`; renderFiles(); await yieldUi();
    }
    state.processing = false; const failures = state.files.filter(item => item.status === 'Erreur').length;
    setMessage(els.resultMessage, `${state.generated.length} PDF généré${state.generated.length > 1 ? 's' : ''}, ${failures} échec${failures > 1 ? 's' : ''}.`); updateButtons();
  }

  async function createPdf(file) {
    const content = await renderRtfFile(file);
    const signatureDataUrl = await fileToDataUrl(state.signature);
    const signatureImage = await loadImage(signatureDataUrl);
    const printable = buildPrintableDocument(content, signatureDataUrl, signatureImage);
    document.body.appendChild(printable.host);
    try { return await htmlToPagedPdf(printable.pages); } finally { printable.host.remove(); }
  }

  function buildPrintableDocument(content, signatureDataUrl, img) {
    const host = document.createElement('div'); host.className = 'pdf-render-host';
    const pages = [createPage()]; let page = pages[0]; host.appendChild(page);
    Array.from(content.childNodes).forEach(node => appendFlowNode(host, pages, page, node));
    page = pages[pages.length - 1];
    const sig = document.createElement('div'); sig.className = `pdf-signature signature-align-${els.signatureAlignment.value}`; sig.style.marginTop = `${(Number(els.spacingLines.value) || 0) * 6}mm`;
    const image = document.createElement('img'); image.src = signatureDataUrl; image.style.width = `${Math.min(Math.max(Number(els.signatureWidth.value) || 45, 10), 180)}mm`; image.style.height = 'auto'; image.alt = 'Signature'; sig.appendChild(image);
    page.appendChild(sig);
    if (page.scrollHeight > page.clientHeight) { sig.remove(); page = createPage(); pages.push(page); host.appendChild(page); page.appendChild(sig); }
    return { host, pages };
  }
  function createPage() { const page = document.createElement('section'); page.className = 'pdf-page'; return page; }
  function appendFlowNode(host, pages, pageRef, node) { let page = pages[pages.length - 1]; const clone = node.cloneNode(true); page.appendChild(clone); if (page.scrollHeight > page.clientHeight && page.childNodes.length > 1) { clone.remove(); page = createPage(); pages.push(page); host.appendChild(page); page.appendChild(clone); } }

  async function htmlToPagedPdf(pages) {
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    for (let i = 0; i < pages.length; i += 1) {
      if (i) doc.addPage();
      const canvas = await window.html2canvas(pages[i], { scale: 2, backgroundColor: '#ffffff', useCORS: false });
      doc.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, A4.width, A4.height);
    }
    return doc.output('blob');
  }

  const fileToDataUrl = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('READ_SIGNATURE')); reader.readAsDataURL(file); });
  const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('READ_SIGNATURE')); img.src = src; });
  function friendlyError(error) { const messages = { EMPTY_RTF: 'Le fichier RTF est vide.', UNSUPPORTED_RTF: RTF_PARSE_ERROR, RTF_ENGINE_MISSING: RTF_ENGINE_ERROR, RTF_METADATA_VISIBLE: RTF_METADATA_ERROR, READ_SIGNATURE: 'La signature PNG est illisible.' }; if (error && /memory|allocation/i.test(error.message)) return 'Mémoire insuffisante pour générer ce PDF.'; return messages[error && error.message] || RTF_PARSE_ERROR; }
  async function downloadZip() { try { const zip = new JSZip(); state.generated.forEach(item => zip.file(item.pdfName, item.pdfBlob)); const blob = await zip.generateAsync({ type: 'blob' }); triggerDownload(blob, `arretes_versement_signes_${dateStamp()}.zip`); } catch (error) { console.error('Erreur de génération du ZIP', error); setMessage(els.resultMessage, 'Erreur de génération du ZIP. Les PDF individuels restent téléchargeables.'); } }
  function triggerDownload(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function dateStamp() { const d = new Date(), pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`; }
  function resetAll() { state.files = []; state.generated = []; state.processing = false; state.previewDone = false; clearSignature(); clearPreview(); els.rtfInput.value = ''; els.signatureWidth.value = 45; els.signatureAlignment.value = 'right'; els.spacingLines.value = 2; els.globalProgress.value = 0; els.progressText.textContent = '0 fichier traité sur 0.'; setMessage(els.rtfError); setMessage(els.signatureError); setMessage(els.resultMessage); renderFiles(); }

  els.rtfInput.addEventListener('change', e => addRtfFiles(e.target.files)); els.signatureInput.addEventListener('change', e => setSignature(e.target.files[0]));
  [['dragenter', 'dragover'], ['dragleave', 'drop']].forEach((events, i) => events.forEach(name => document.addEventListener(name, e => { e.preventDefault(); if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.toggle('drag-over', i === 0); })));
  els.rtfDropZone.addEventListener('drop', e => addRtfFiles(e.dataTransfer.files)); els.signatureDropZone.addEventListener('drop', e => setSignature(e.dataTransfer.files[0]));
  els.rtfList.addEventListener('click', e => { const remove = e.target.dataset.remove, download = e.target.dataset.download; if (remove) { state.files = state.files.filter(item => item.key !== remove); state.generated = state.generated.filter(item => item.key !== remove); state.previewDone = false; clearPreview(); renderFiles(); } if (download) { const item = state.files.find(i => i.key === download); if (item && item.pdfBlob) triggerDownload(item.pdfBlob, item.pdfName); } });
  els.clearRtfButton.addEventListener('click', () => { state.files = []; state.generated = []; state.previewDone = false; clearPreview(); renderFiles(); });
  els.removeSignatureButton.addEventListener('click', clearSignature); els.previewButton.addEventListener('click', previewFirst); els.generateButton.addEventListener('click', generateAll); els.downloadZipButton.addEventListener('click', downloadZip); els.resetButton.addEventListener('click', resetAll);
  renderFiles();
})();
