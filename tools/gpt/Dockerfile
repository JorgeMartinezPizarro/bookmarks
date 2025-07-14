# Etapa 1: Construcción con dependencias necesarias
FROM python:3.9-slim AS build

ENV DEBIAN_FRONTEND=noninteractive

# Instala dependencias necesarias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    libstdc++6 \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Etapa 2: Imagen final, limpia y mínima
FROM python:3.9-slim

ENV HF_HOME=/app/.cache
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copia sólo lo necesario desde la etapa de construcción
COPY --from=build /usr/local /usr/local
COPY load_model.py /app/load_model.py

# Crea el directorio de caché para Hugging Face
RUN mkdir -p /app/.cache

# Exponer el puerto de la API
EXPOSE 5000

RUN apt-get update && apt-get install -y curl && apt-get clean

# Comando de ejecución con Gunicorn (optimizado para CPU)
CMD ["gunicorn", "--workers=1", "--threads=10", "--bind", "0.0.0.0:5000", "load_model:app"]
