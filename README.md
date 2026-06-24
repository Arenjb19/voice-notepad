# Voice Notepad

Speak your thoughts — get back organized notes instantly.

Voice Notepad captures your voice in real time, then uses AI to clean it up into structured markdown: headings, bullet points, and tags. No typing, no subscription, no cloud storage.

## Features

- Real-time speech-to-text via the browser's Web Speech API
- AI formatting powered by Groq (LLaMA 3) — removes filler words, adds structure
- Notes saved locally as JSON files — your data stays on your machine
- Works in Chrome on desktop and Android

## Tech Stack

| Layer | Tool |
|---|---|
| Voice input | Web Speech API (browser built-in) |
| AI formatting | Groq API (LLaMA 3) |
| Backend | Python / Flask |
| Storage | Local JSON files |
| Frontend | Vanilla JS (ES modules) |

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/your-username/voice-notepad.git
cd voice-notepad
```

**2. Install Python dependencies**
```bash
pip install -r requirements.txt
```

**3. Add your Groq API key**

Get a free key at [console.groq.com](https://console.groq.com), then create a `.env` file:
```
GROQ_API_KEY=your_key_here
```

**4. Run**
```bash
python server.py
```

Open `http://localhost:5000` in Chrome.

## How to Use

1. Click the red mic button and speak naturally
2. Your words appear live as you talk
3. Click **Format with AI** — your rambling becomes a clean structured note
4. Click **Save Note** to store it locally

## Project Structure

```
voice-notepad/
├── server.py           # Flask backend — serves files, calls Groq, saves notes
├── requirements.txt
├── index.html          # App UI
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Main orchestrator
│   └── speech.js       # Web Speech API wrapper
└── notes/              # Saved notes (auto-created, not committed)
```

## Cost

$0. The Groq free tier is more than enough for personal use.
