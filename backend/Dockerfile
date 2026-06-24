FROM python:3.11-slim

# Set working directory
WORKDIR /code

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy backend files
COPY . .

# Run the app on port 7860 (Hugging Face Spaces default port)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
