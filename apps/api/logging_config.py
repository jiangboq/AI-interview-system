import json
import logging
import os
import sys
import traceback

_RESERVED_ATTRS = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__.keys()) | {"message"}


class JsonFormatter(logging.Formatter):
    """Renders log records as one JSON object per line, for stdout capture by
    a Splunk forwarder in prod and `docker compose logs` locally."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in _RESERVED_ATTRS:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = "".join(traceback.format_exception(*record.exc_info))
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel((os.getenv("LOG_LEVEL") or "INFO").upper())
