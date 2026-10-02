# Laboratory Worksheet 5 - Proof of Concept (PoC) for Event-Driven Microservices Architecture

PL4107 - System Integration and Architecture 2  
Occidental Mindoro State University

## Project Structure

```
complab-5-lastname/
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── public/
│       └── index.html
├── inventory-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── notification-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── order-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── payment-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
└── docker-compose.yml
```

## How to Run

1. Make sure Docker and Docker Compose are installed.
2. Open terminal in the project folder.
3. Run:

```bash
docker compose up --build -d
```

4. Wait about 30-60 seconds for all services (especially RabbitMQ) to fully start.

## Testing

### Frontend
- Open http://localhost:3000
- Fill the form and submit an order.

### RabbitMQ Management
- Open http://localhost:15672
- Login: guest / guest
- Check Exchanges tab → should see OrderPlaced and PaymentSuccess (fanout)
- Check Queues tab → inventory_service_queue, payment_service_queue, notification_service_queue

### Fault Tolerance Test
1. Stop notification-service:
   ```bash
   docker stop notification-service
   ```
2. Submit a new order via frontend.
3. Go to RabbitMQ Queues → notification_service_queue should have Ready messages > 0
4. Restart:
   ```bash
   docker start notification-service
   ```
5. Messages should be consumed (Ready goes back to 0).

## Architecture Flow

Frontend → API Gateway → Order Service → publishes OrderPlaced (fanout)

- Payment Service consumes OrderPlaced → publishes PaymentSuccess
- Inventory Service consumes OrderPlaced
- Notification Service consumes PaymentSuccess

## Notes

- Used Node.js + Express + amqplib for all backend services.
- Frontend is simple static HTML served by nginx.
- All services retry connection to RabbitMQ if not ready yet.
