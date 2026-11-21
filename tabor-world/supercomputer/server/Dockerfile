FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /srv/tabor
COPY app.py /srv/tabor/app.py
RUN useradd --uid 10001 --create-home tabor
USER tabor
EXPOSE 8080
CMD ["python","/srv/tabor/app.py"]
