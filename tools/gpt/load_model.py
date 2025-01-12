from transformers import AutoModelForCausalLM, AutoTokenizer
from flask import Flask, request, jsonify

# Carga el modelo y el tokenizer
model_name = "EleutherAI/gpt-j-6B"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

app = Flask(__name__)

@app.route("/gpt", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    # Combina el historial de mensajes
    prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=100, num_return_sequences=1)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
