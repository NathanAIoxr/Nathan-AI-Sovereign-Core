FROM python:3.12-slim
WORKDIR /opt/christmas-toy-drive
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --system --uid 10001 ctd && chown -R ctd:ctd /opt/christmas-toy-drive
USER ctd
EXPOSE 8000
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8000"]
