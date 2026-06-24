// Wraps the Web Speech API.
// Returns a recognizer object with start() / stop(), or null if unsupported.
export function createRecognizer({ onInterim, onFinal, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const rec = new SR();
  rec.continuous = true;      // keep listening until we call stop()
  rec.interimResults = true;  // stream partial results as you speak
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    let interim = '';
    let finalText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += chunk;
      } else {
        interim += chunk;
      }
    }

    if (finalText) onFinal(finalText);
    onInterim(interim);
  };

  rec.onerror = (e) => onError(e.error);
  rec.onend   = ()  => onInterim('');

  return rec;
}
