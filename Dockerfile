FROM justsong/one-api:latest

EXPOSE 3000

CMD ["--port", "3000", "--log-dir", "/data/logs"]
