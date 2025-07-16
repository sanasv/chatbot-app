FROM python:3.10-slim

WORKDIR /app
COPY . .
COPY templates/ templates/
COPY static/ static/

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "app.py"]

