from flask import Flask, request
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
torch.set_num_threads(12)
torch.set_num_interop_threads(3)

# 🔹 Carga del modelo optimizada para CPU
model_name = "EleutherAI/gpt-j-6B"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float32,
    device_map={"": "cpu"}
)

# 🔹 Cargamos el tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token  # 🔹 Define token de padding

app = Flask(__name__)

@app.route("/gpt", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return "Error: No messages provided", 400

    # 🔹 Solo tomamos la última pregunta
    ultima_pregunta = messages[-1]["content"] if messages else ""

    # 🔹 Reformulamos el prompt para enfocarlo en resultados matemáticos
    prompt = f"{ultima_pregunta}"

    # 🔹 Tokenización optimizada
    inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)

    # 🔹 Inferencia optimizada sin gradientes para mejorar velocidad
    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"], 
            attention_mask=inputs["attention_mask"],  
            max_new_tokens=150,  # 🔹 Genera respuestas más rápidas y concretas
            num_return_sequences=1,
            temperature=0.2,  # 🔹 Prioriza precisión sobre creatividad
            top_k=30,  
            top_p=0.8,  # 🔹 Reduce la variabilidad de respuestas
            repetition_penalty=1.2,  # 🔹 Evita que repita frases sin sentido
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
            do_sample=False  
        )

    # 🔹 Procesamos la respuesta para eliminar el prompt y limpiar el texto
    response = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    # 🔹 Eliminamos la pregunta si el modelo la repite
    response = response.replace(ultima_pregunta, "").strip()
    
    # 🔹 Eliminamos cualquier línea en blanco que haya quedado
    response = "\n".join([line.strip() for line in response.split("\n") if line.strip()])

    # 🔹 Devuelve texto puro, sin JSON
    print(response)  # 🔹 Se verá en los logs de Docker
    return response, 200, {"Content-Type": "text/plain"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
