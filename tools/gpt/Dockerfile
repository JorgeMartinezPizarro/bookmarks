# Imagen base con PyTorch y Transformers de Hugging Face optimizada para CPU
FROM python:3.9-slim

# Instala dependencias necesarias
RUN pip install flask gunicorn transformers torch
RUN pip install accelerate

# Copia el archivo Python
COPY load_model.py /app/load_model.py

WORKDIR /app

# Comando para iniciar la API Flask
CMD ["python", "load_model.py"]
