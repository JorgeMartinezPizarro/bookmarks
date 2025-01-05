FROM python:3.9-slim

# Instalar dependencias
RUN apt-get update && apt-get install -y git sqlite3 make gcc && \
    pip install flask gtts

# Clonar el repositorio SCOWL
WORKDIR /app
RUN git clone https://github.com/en-wl/wordlist.git libscowl

# Configurar SCOWL
WORKDIR /app/libscowl
RUN make && \
    mv scowl.db /app/scowl.db

# Crear carpetas para audio
WORKDIR /app
RUN mkdir -p /app/audio

# Copiar la aplicación Flask
COPY app.py /app/app.py

# Exponer el puerto de Flask
EXPOSE 5000

# Comando por defecto
CMD ["python", "app.py"]
