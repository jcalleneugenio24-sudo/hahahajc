const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const BROKER_URL = process.env.BROKER_URL || 'amqp://guest:guest@localhost:5672';
let channel;

async function connectRabbit() {
  try {
    const connection = await amqp.connect(BROKER_URL);
    channel = await connection.createChannel();
    
    // Declare fanout exchange for OrderPlaced
    await channel.assertExchange('OrderPlaced', 'fanout', { durable: true });
    
    console.log('Order Service connected to RabbitMQ');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ, retrying in 5s...', err.message);
    setTimeout(connectRabbit, 5000);
  }
}

app.post('/orders', async (req, res) => {
  try {
    const order = {
      id: uuidv4(),
      product: req.body.product || 'Sample Product',
      quantity: req.body.quantity || 1,
      customer: req.body.customer || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    if (!channel) {
      return res.status(503).json({ error: 'Message broker not ready' });
    }

    // Publish OrderPlaced event
    channel.publish('OrderPlaced', '', Buffer.from(JSON.stringify(order)), {
      persistent: true
    });

    console.log('Order placed and event published:', order.id);
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
  connectRabbit();
});
