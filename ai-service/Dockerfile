FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Run model training to generate the joblib binary on build
RUN python fraud_model.py

EXPOSE 5000

ENV FLASK_ENV=production
ENV PORT=5000

CMD ["python", "app.py"]
