FROM python:3.11-slim

WORKDIR /app

# Install Docker CLI so the python script can interact with the host docker daemon via /var/run/docker.sock
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8082

CMD ["python", "start.py"]
