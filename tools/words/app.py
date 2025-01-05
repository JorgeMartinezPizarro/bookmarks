from flask import Flask, jsonify, request
import sqlite3
from gtts import gTTS
import os
import random

app = Flask(__name__)

DATABASE = '/app/scowl.db'

@app.route('/word', methods=['GET'])
@app.route('/word/<string:word>', methods=['GET'])
def get_word(word=None):
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()

        if word:
            query = "SELECT word FROM scowl_v0 WHERE word = ? LIMIT 1"
            cursor.execute(query, (word,))
        else:
            query = "SELECT word FROM scowl_v0 ORDER BY RANDOM() LIMIT 1"
            cursor.execute(query)

        result = cursor.fetchone()
        if not result:a
            return jsonify({"error": "Word not found"}), 404

        word = result[0]
        audio_path = f"/app/audio/{word}.mp3"

        # Generar audio si no existe
        if not os.path.exists(audio_path):
            tts = gTTS(word, lang='en')
            os.makedirs('/app/audio', exist_ok=True)
            tts.save(audio_path)

        return jsonify({
            "word": word,
            "audio": f"/audio/{word}.mp3",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
