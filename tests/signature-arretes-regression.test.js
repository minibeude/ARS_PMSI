const fs = require('fs');
const assert = require('assert');

const app = fs.readFileSync('signature-arretes/app.js', 'utf8');
const html = fs.readFileSync('signature-arretes/index.html', 'utf8');
const css = fs.readFileSync('assets/css/style.css', 'utf8');

const fixtures = {
  fonts: String.raw`{\rtf1\ansi{\fonttbl{\f0 Times New Roman;}{\f1 Arial;}{\f2 Courier New;}}\pard ARR\'caT\'c9 DE VERSEMENT\par}`,
  accents: String.raw`{\rtf1\ansi\ansicpg1252 \u201tablissement \u8211? p\'e9riode de janvier \u224? mars \u8211? montant arr\'eat\'e9\par}`,
  formatting: String.raw`{\rtf1\ansi{\fonttbl{\f0 Arial;}}\qc\b Titre centr\'e9\b0\par\ql Premier paragraphe.\par Deuxi\'e8me paragraphe.\par{\trowd\cellx2000\cellx4000 A\cell B\cell\row}\page\qr Texte align\'e9 \u224? droite\par}`,
  invalid: 'not an rtf document',
  secondValid: String.raw`{\rtf1\ansi\pard Second document valide\par}`,
};

assert(!/function\s+parseRtf\s*\(/.test(app), 'ancien parseRtf supprimé');
assert(!/file\.text\s*\(/.test(app), 'file.text ne doit pas être la source RTF');
assert(/file\.arrayBuffer\s*\(/.test(app), 'lecture RTF via arrayBuffer');
assert(/new window\.RTFJS\.Document\(buffer\)/.test(app), 'RTFJS reçoit le buffer');
assert(/RTF_METADATA_VISIBLE/.test(app), 'contrôle anti-régression des métadonnées');
assert(/RTF_ENGINE_ERROR/.test(app), 'message moteur RTF absent prévu');
assert(/html2canvas/.test(app) && /addImage/.test(app), 'PDF généré depuis pages HTML rendues');
assert(/signature-align-/.test(app) && /spacingLines/.test(app), 'signature alignée et espacée');
assert(/state\.generated\.push\(item\)/.test(app), 'les fichiers valides continuent dans une série');
assert(/catch \(error\)/.test(app), 'un invalide est isolé par fichier');
assert(!/validations-pmsi/.test(app), 'aucune logique validations-pmsi dans app signature');

assert(html.includes('rtf.js@3.0.7/dist/RTFJS.bundle.js'), 'version RTFJS figée');
assert(html.includes('Prévisualiser le premier arrêté'), 'bouton de prévisualisation');
assert(html.includes('Vérifiez cette prévisualisation avant de générer les PDF'), 'consigne de prévisualisation');
assert(html.includes('html2canvas@1.4.1'), 'html2canvas versionné');
assert(css.includes('.rtf-preview') && css.includes('.pdf-page'), 'styles de prévisualisation et pagination');

assert(fixtures.fonts.includes('Times New Roman') && fixtures.fonts.includes('Arial') && fixtures.fonts.includes('ARR'), 'fixture table de polices');
assert(fixtures.accents.includes('période') || fixtures.accents.includes("\\'e9riode"), 'fixture accents');
assert(fixtures.formatting.includes('\\qc') && fixtures.formatting.includes('\\b') && fixtures.formatting.includes('\\trowd') && fixtures.formatting.includes('\\page') && fixtures.formatting.includes('\\qr'), 'fixture mise en forme');
assert(fixtures.invalid && fixtures.secondValid.includes('Second document valide'), 'fixture série valide/invalide/valide');

console.log('Tests de régression signature-arretes OK');
