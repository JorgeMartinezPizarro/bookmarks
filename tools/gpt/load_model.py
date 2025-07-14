import threading
import logging
from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
import concurrent.futures

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

model_ready = threading.Event()
generator = None

MAX_PROMPT_LENGTH = 1000

def load_model():
    global generator
    logging.info("Cargando modelo...")

    torch.set_num_threads(12)
    torch.set_num_interop_threads(2)

    model_name = "EleutherAI/gpt-j-6B"

    try:
        if torch.cuda.is_available():
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            device = 0
            # NO hacer model.to() aquí porque device_map="auto" ya gestiona los dispositivos
        else:
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True
            )
            model.to("cpu")
            device = -1

        tokenizer = AutoTokenizer.from_pretrained(model_name)

        generator = pipeline(
			"text-generation",
			model=model,
			tokenizer=tokenizer,
			device=device,
			max_length=60,          # para evitar respuestas largas
			do_sample=False,        # para evitar divagaciones
			eos_token_id=tokenizer.eos_token_id,
			pad_token_id=tokenizer.eos_token_id,
			repetition_penalty=1.1,
		)

        model_ready.set()
        logging.info("✅ Modelo cargado y listo.")
    except Exception as e:
        logging.error(f"❌ Error cargando modelo: {e}")

@app.route("/health", methods=["GET"])
def health():
    return ("ready", 200) if model_ready.is_set() else ("loading", 503)

def generate_text(prompt):
    logging.info(f"Generando texto con prompt:\n{prompt}\n---")
    # Uso max_new_tokens=150 para controlar tokens generados sin chocar con longitud prompt
    result = generator(prompt, max_new_tokens=150, return_full_text=False, num_return_sequences=1)[0]["generated_text"]
    logging.info(f"Texto generado:\n{result}\n---")
    return result

@app.route("/gpt", methods=["POST"])
def chat():
    if not model_ready.is_set():
        return jsonify({"error": "Model not ready"}), 503

    data = request.json or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    prompt = "\n".join(m.get("content", "") for m in messages)
    if len(prompt) > MAX_PROMPT_LENGTH:
        prompt = prompt[-MAX_PROMPT_LENGTH:]

    logging.info(f"Received prompt of length {len(prompt)}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(generate_text, prompt)
        try:
            response = future.result(timeout=120)
        except concurrent.futures.TimeoutError:
            return jsonify({"error": "Generation timeout"}), 504

    logging.info(f"Generated response length: {len(response)}")

    return jsonify({"response": response.strip()})

# Lanzar carga del modelo en hilo al importar el módulo, para que Gunicorn lo ejecute
threading.Thread(target=load_model, daemon=True).start()
