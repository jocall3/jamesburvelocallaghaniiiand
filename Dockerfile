FROM python:3.9-slim-buster

WORKDIR /app

# Install system dependencies if any (e.g., for specific Python packages)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Command to run the application using Gunicorn
# Assumes your main application file is `main.py` and the Flask/FastAPI app instance is named `app`
# Adjust `main:app` if your entry point is different (e.g., `api:app` or `server:create_app()`)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "main:app"]