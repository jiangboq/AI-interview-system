FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download all required model files (Silero VAD, turn-detector, etc.)
RUN python -m livekit.agents download-files || true

COPY . .

CMD ["python", "agent.py", "start"]
