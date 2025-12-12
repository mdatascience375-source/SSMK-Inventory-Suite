# Use an official lightweight Python runtime
FROM python:3.11-slim

# set workdir
WORKDIR /app

# avoid .pyc files and stdout buffering issues
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# install system deps required for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (Docker cache friendly)
COPY requirements.txt .

# Install python packages
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway provides $PORT at runtime)
EXPOSE 5000

# Default start command (Railway still uses service start)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "main:app"]

