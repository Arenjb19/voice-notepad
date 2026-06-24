import { createRecognizer } from './speech.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const recordBtn      = document.getElementById('recordBtn');
const statusEl       = document.getElementById('status');
const transcriptEl   = document.getElementById('transcript');
const interimEl      = document.getElementById('interim');
const actionsEl      = document.getElementById('actions');
const formatBtn      = document.getElementById('formatBtn');
const clearBtn       = document.getElementById('clearBtn');
const noteContainer  = document.getElementById('note-container');
const noteOutput     = document.getElementById('note-output');
const saveBtn        = document.getElementById('saveBtn');
const unsupported    = document.getElementById('unsupported');

// ── State ─────────────────────────────────────────────────────────────────────
let finalTranscript = '';
let isRecording     = false;
let recognizer      = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
recognizer = createRecognizer({
  onInterim: (text) => { interimEl.textContent = text; },
  onFinal:   (text) => {
    finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
    transcriptEl.innerHTML = finalTranscript;
    interimEl.textContent  = '';
    actionsEl.style.display = 'flex';
  },
  onError: (err) => setStatus(`Error: ${err}`, false),
});

if (!recognizer) {
  unsupported.style.display = 'block';
  recordBtn.disabled = true;
  setStatus('Speech API not supported in this browser', false);
}

// ── Record button ─────────────────────────────────────────────────────────────
recordBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

function startRecording() {
  finalTranscript = '';
  transcriptEl.innerHTML = '';
  interimEl.textContent  = '';
  noteContainer.style.display = 'none';
  actionsEl.style.display     = 'none';

  recognizer.start();
  isRecording = true;
  recordBtn.classList.add('recording');
  recordBtn.innerHTML = '&#x23F9;'; // stop icon
  setStatus('Listening...', true);
}

function stopRecording() {
  recognizer.stop();
  isRecording = false;
  recordBtn.classList.remove('recording');
  recordBtn.innerHTML = '&#x1F3A4;'; // mic icon
  setStatus(finalTranscript ? 'Done — click Format with AI' : 'Tap to start recording', false);
}

// ── Format button — sends transcript to Flask ─────────────────────────────────
formatBtn.addEventListener('click', async () => {
  if (!finalTranscript.trim()) return;

  formatBtn.disabled = true;
  formatBtn.textContent = 'Formatting...';

  try {
    const res  = await fetch('/api/format', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ transcript: finalTranscript }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Server error');

    noteOutput.innerHTML    = data.html;
    noteContainer.style.display = 'block';
    noteOutput.dataset.markdown  = data.markdown;
  } catch (err) {
    setStatus(`Format failed: ${err.message}`, false);
  } finally {
    formatBtn.disabled    = false;
    formatBtn.textContent = 'Format with AI';
  }
});

// ── Save button — persists note via Flask ─────────────────────────────────────
saveBtn.addEventListener('click', async () => {
  const markdown = noteOutput.dataset.markdown;
  if (!markdown) return;

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch('/api/notes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ markdown, transcript: finalTranscript }),
    });
    if (!res.ok) throw new Error('Save failed');
    setStatus('Note saved!', false);
  } catch (err) {
    setStatus(`Save failed: ${err.message}`, false);
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save Note';
  }
});

// ── Clear button ──────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  finalTranscript = '';
  transcriptEl.innerHTML      = '<span class="placeholder">Your spoken words will appear here as you talk...</span>';
  interimEl.textContent       = '';
  noteContainer.style.display = 'none';
  actionsEl.style.display     = 'none';
  setStatus('Tap to start recording', false);
});

// ── Helper ────────────────────────────────────────────────────────────────────
function setStatus(msg, active) {
  statusEl.textContent = msg;
  statusEl.className   = active ? 'active' : '';
}
