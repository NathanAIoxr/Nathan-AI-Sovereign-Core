FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && useradd --uid 10001 --create-home --shell /usr/sbin/nologin edgeuser \
    && mkdir -p /data \
    && chown 10001:10001 /data \
    && chmod 700 /data

COPY micro_edge.py macro_fabric.py encrypted_store.py runner.py ./
USER 10001:10001
VOLUME ["/data"]

# No ports, web server or network requirement at runtime.
CMD ["python", "runner.py", "--demo"]
