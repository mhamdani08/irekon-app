import os
import dramatiq
from dramatiq.brokers.rabbitmq import RabbitmqBroker

rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
rabbitmq_broker = RabbitmqBroker(url=rabbitmq_url)
dramatiq.set_broker(rabbitmq_broker)

@dramatiq.actor
def ping_task(message: str):
    print(f"[Worker] Received ping message: {message}")
    return f"Processed: {message}"
