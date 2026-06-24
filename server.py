import os
import json
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from groq import Groq
from dotenv import load_dotenv
import markdown as md

load_dotenv()

app = Flask(__name__, static_folder='.')
NOTES_DIR = Path('notes')
NOTES_DIR.mkdir(exist_ok=True)

groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

SYSTEM_PROMPT = """You are a note-formatting assistant.
The user will give you a raw speech transcript — messy, with filler words, repetitions, and no structure.
Your job is to return a clean, well-structured markdown note.

Rules:
- Remove filler words (um, uh, like, you know, basically)
- Remove repetitions and false starts
- Add a short H1 title that captures the topic
- Use bullet points for lists of items or tasks
- Use H2 headings to separate distinct topics if there are multiple
- Add 3-5 relevant tags at the bottom as: Tags: #tag1 #tag2
- Keep the content — do not summarise away important details
- Return ONLY the markdown, no explanations"""


# ── Serve frontend ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)


# ── API: format transcript with Groq ──────────────────────────────────────────

@app.route('/api/format', methods=['POST'])
def format_note():
    data       = request.get_json()
    transcript = (data or {}).get('transcript', '').strip()

    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400

    try:
        response = groq_client.chat.completions.create(
            model='openai/gpt-oss-20b',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': transcript},
            ],
        )
        markdown_text = response.choices[0].message.content.strip()
        html          = md.markdown(markdown_text)
        return jsonify({'markdown': markdown_text, 'html': html})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── API: save note ─────────────────────────────────────────────────────────────

@app.route('/api/notes', methods=['POST'])
def save_note():
    data = request.get_json()
    note = {
        'id':         str(uuid.uuid4()),
        'created_at': datetime.now().isoformat(),
        'transcript': data.get('transcript', ''),
        'markdown':   data.get('markdown', ''),
    }
    path = NOTES_DIR / f"{note['id']}.json"
    path.write_text(json.dumps(note, indent=2), encoding='utf-8')
    return jsonify({'id': note['id']}), 201


# ── API: list notes ────────────────────────────────────────────────────────────

@app.route('/api/notes', methods=['GET'])
def list_notes():
    notes = []
    for f in sorted(NOTES_DIR.glob('*.json'), reverse=True):
        try:
            notes.append(json.loads(f.read_text(encoding='utf-8')))
        except Exception:
            pass
    return jsonify(notes)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
