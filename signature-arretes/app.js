(() => {
  'use strict';

  const state = { files: [], signature: null, signatureUrl: null, generated: [], processing: false };
  const els = {
    rtfInput: document.getElementById('rtfInput'), rtfDropZone: document.getElementById('rtfDropZone'), rtfError: document.getElementById('rtfError'), rtfCount: document.getElementById('rtfCount'), rtfList: document.getElementById('rtfList'), clearRtfButton: document.getElementById('clearRtfButton'),
    signatureInput: document.getElementById('signatureInput'), signatureDropZone: document.getElementById('signatureDropZone'), signatureError: document.getElementById('signatureError'), signaturePreview: document.getElementById('signaturePreview'), removeSignatureButton: document.getElementById('removeSignatureButton'),
    signatureWidth: document.getElementById('signatureWidth'), signatureAlignment: document.getElementById('signatureAlignment'), spacingLines: document.getElementById('spacingLines'), generateButton: document.getElementById('generateButton'), downloadZipButton: document.getElementById('downloadZipButton'), resetButton: document.getElementById('resetButton'), globalProgress: document.getElementById('globalProgress'), progressText: document.getElementById('progressText'), resultMessage: document.getElementById('resultMessage')
  };

  const fmtSize = bytes => bytes < 1024 ? `${bytes} o` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} Ko` : `${(bytes / 1048576).toFixed(1)} Mo`;
  const isRtf = file => /\.rtf$/i.test(file.name) || ['application/rtf', 'text/rtf'].includes(file.type);
  const isPng = file => /\.png$/i.test(file.name) || file.type === 'image/png';
  const keyOf = file => `${file.name}-${file.size}-${file.lastModified}`;
  const yieldUi = () => new Promise(resolve => setTimeout(resolve, 0));

  function setMessage(el, message = '') { el.textContent = message; }
  function updateButtons() {
    els.generateButton.disabled = state.processing || state.files.length === 0 || !state.signature;
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
    setMessage(els.rtfError, errors.join(' '));
    renderFiles();
  }

  function renderFiles() {
    els.rtfCount.textContent = `${state.files.length} fichier${state.files.length > 1 ? 's' : ''} sélectionné${state.files.length > 1 ? 's' : ''}`;
    els.rtfList.innerHTML = '';
    if (!state.files.length) {
      els.rtfList.innerHTML = '<tr><td colspan="5">Aucun fichier RTF sélectionné.</td></tr>';
      updateButtons();
      return;
    }
    state.files.forEach(item => {
      const tr = document.createElement('tr');
      const download = item.pdfBlob ? `<button class="btn btn-secondary" type="button" data-download="${item.key}">Télécharger le PDF</button>` : '';
      tr.innerHTML = `<td>${escapeHtml(item.file.name)}</td><td>${fmtSize(item.file.size)}</td><td>${item.status}</td><td>${escapeHtml(item.message || '')}</td><td>${download}<button class="btn btn-secondary" type="button" data-remove="${item.key}" ${state.processing ? 'disabled' : ''}>Retirer</button></td>`;
      els.rtfList.appendChild(tr);
    });
    updateButtons();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function setSignature(file) {
    if (!file) return;
    if (!isPng(file)) { setMessage(els.signatureError, `${file.name} n’est pas une image PNG.`); return; }
    clearSignature();
    state.signature = file;
    state.signatureUrl = URL.createObjectURL(file);
    els.signaturePreview.innerHTML = `<img src="${state.signatureUrl}" alt="Aperçu de la signature sélectionnée"><p><strong>${escapeHtml(file.name)}</strong> — ${fmtSize(file.size)}</p>`;
    setMessage(els.signatureError);
    updateButtons();
  }

  function clearSignature() {
    if (state.signatureUrl) URL.revokeObjectURL(state.signatureUrl);
    state.signature = null; state.signatureUrl = null; els.signatureInput.value = '';
    els.signaturePreview.textContent = 'Aucune signature sélectionnée.';
    updateButtons();
  }

  async function generateAll() {
    if (!state.files.length) return setMessage(els.resultMessage, 'Sélectionnez au moins un fichier RTF.');
    if (!state.signature) return setMessage(els.resultMessage, 'Sélectionnez une signature PNG.');
    state.processing = true; state.generated = []; els.globalProgress.value = 0; setMessage(els.resultMessage, 'Génération en cours…'); updateButtons();
    state.files.forEach(item => { item.status = 'En attente'; item.message = ''; item.pdfBlob = null; });
    renderFiles();
    const total = state.files.length;
    for (let i = 0; i < total; i += 1) {
      const item = state.files[i]; item.status = 'En cours'; item.message = ''; item.pdfBlob = null; renderFiles(); await yieldUi();
      try {
        item.pdfBlob = await createPdf(item.file); item.status = 'Terminé'; item.message = 'PDF généré.'; state.generated.push(item);
      } catch (error) {
        console.error(`Erreur de génération pour ${item.file.name}`, error);
        item.status = 'Erreur'; item.message = friendlyError(error);
      }
      els.globalProgress.value = Math.round(((i + 1) / total) * 100); els.progressText.textContent = `${i + 1} fichier${i ? 's' : ''} traité${i ? 's' : ''} sur ${total}.`; renderFiles(); await yieldUi();
    }
    state.processing = false;
    const failures = state.files.filter(item => item.status === 'Erreur').length;
    setMessage(els.resultMessage, `${state.generated.length} PDF généré${state.generated.length > 1 ? 's' : ''}, ${failures} échec${failures > 1 ? 's' : ''}.`);
    updateButtons();
  }

  async function createPdf(file) {
    if (!file.size) throw new Error('EMPTY_RTF');
    const rtf = await file.text();
    if (!rtf.trim()) throw new Error('EMPTY_RTF');
    if (!/^\s*\{\\rtf/i.test(rtf)) throw new Error('UNSUPPORTED_RTF');
    const paragraphs = parseRtf(rtf);
    const signatureDataUrl = await fileToDataUrl(state.signature);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 20, pageWidth = doc.internal.pageSize.getWidth(), pageHeight = doc.internal.pageSize.getHeight(), lineHeight = 6;
    let y = margin;
    paragraphs.forEach(p => {
      const lines = doc.splitTextToSize(p.text || ' ', pageWidth - margin * 2);
      lines.forEach(line => { if (y > pageHeight - margin) { doc.addPage(); y = margin; } doc.text(line, margin, y); y += lineHeight; });
      y += 2;
    });
    y += Math.max(0, Number(els.spacingLines.value) || 0) * lineHeight;
    const width = Math.min(Math.max(Number(els.signatureWidth.value) || 45, 10), 180);
    const img = await loadImage(signatureDataUrl); const height = width * (img.naturalHeight / img.naturalWidth);
    if (y + height > pageHeight - margin) { doc.addPage(); y = margin; }
    const align = els.signatureAlignment.value;
    const x = align === 'left' ? margin : align === 'center' ? (pageWidth - width) / 2 : pageWidth - margin - width;
    doc.addImage(signatureDataUrl, 'PNG', x, y, width, height);
    return doc.output('blob');
  }

  function parseRtf(rtf) {
    let text = rtf.replace(/\r?\n/g, ' ');
    text = text.replace(/\\'[0-9a-fA-F]{2}/g, m => String.fromCharCode(parseInt(m.slice(2), 16)));
    text = text.replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(Number(n) < 0 ? Number(n) + 65536 : Number(n)));
    text = text.replace(/\\(par|line)\b/g, '\n').replace(/\\page\b/g, '\n\n');
    text = text.replace(/[{}]/g, '').replace(/\\[a-zA-Z]+-?\d* ?/g, '').replace(/\\[^a-zA-Z\s]/g, '');
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean).map(text => ({ text }));
    if (!paragraphs.length) throw new Error('UNSUPPORTED_RTF');
    return paragraphs;
  }

  const fileToDataUrl = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('READ_SIGNATURE')); reader.readAsDataURL(file); });
  const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('READ_SIGNATURE')); img.src = src; });
  function friendlyError(error) {
    const messages = { EMPTY_RTF: 'Le fichier RTF est vide.', UNSUPPORTED_RTF: 'Le fichier RTF est illisible ou non pris en charge.', READ_SIGNATURE: 'La signature PNG est illisible.' };
    if (error && /memory|allocation/i.test(error.message)) return 'Mémoire insuffisante pour générer ce PDF.';
    return messages[error && error.message] || 'Échec de génération du PDF.';
  }

  async function downloadZip() {
    try {
      const zip = new JSZip(); state.generated.forEach(item => zip.file(item.pdfName, item.pdfBlob));
      const blob = await zip.generateAsync({ type: 'blob' }); triggerDownload(blob, `arretes_versement_signes_${dateStamp()}.zip`);
    } catch (error) { console.error('Erreur de génération du ZIP', error); setMessage(els.resultMessage, 'Erreur de génération du ZIP. Les PDF individuels restent téléchargeables.'); }
  }
  function triggerDownload(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function dateStamp() { const d = new Date(), pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`; }
  function resetAll() { state.files = []; state.generated = []; state.processing = false; clearSignature(); els.rtfInput.value = ''; els.signatureWidth.value = 45; els.signatureAlignment.value = 'right'; els.spacingLines.value = 2; els.globalProgress.value = 0; els.progressText.textContent = '0 fichier traité sur 0.'; setMessage(els.rtfError); setMessage(els.signatureError); setMessage(els.resultMessage); renderFiles(); }

  els.rtfInput.addEventListener('change', e => addRtfFiles(e.target.files));
  els.signatureInput.addEventListener('change', e => setSignature(e.target.files[0]));
  [['dragenter', 'dragover'], ['dragleave', 'drop']].forEach((events, i) => events.forEach(name => document.addEventListener(name, e => { e.preventDefault(); if (e.target.closest('.drop-zone')) e.target.closest('.drop-zone').classList.toggle('drag-over', i === 0); })));
  els.rtfDropZone.addEventListener('drop', e => addRtfFiles(e.dataTransfer.files));
  els.signatureDropZone.addEventListener('drop', e => setSignature(e.dataTransfer.files[0]));
  els.rtfList.addEventListener('click', e => { const remove = e.target.dataset.remove, download = e.target.dataset.download; if (remove) { state.files = state.files.filter(item => item.key !== remove); state.generated = state.generated.filter(item => item.key !== remove); renderFiles(); } if (download) { const item = state.files.find(i => i.key === download); if (item && item.pdfBlob) triggerDownload(item.pdfBlob, item.pdfName); } });
  els.clearRtfButton.addEventListener('click', () => { state.files = []; state.generated = []; renderFiles(); });
  els.removeSignatureButton.addEventListener('click', clearSignature); els.generateButton.addEventListener('click', generateAll); els.downloadZipButton.addEventListener('click', downloadZip); els.resetButton.addEventListener('click', resetAll);
  renderFiles();
})();
