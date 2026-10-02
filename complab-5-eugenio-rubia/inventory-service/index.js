const amqp = require('amqplib');

const BROKER_URL = process.env.BROKER_URL || 'amqp://guest:guest@localhost:5672';

async function start() {
  try {
    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange('OrderPlaced', 'fanout', { durable: true });

    const queue = 'inventory_service_queue';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'OrderPlaced', '');

    console.log('Inventory Service waiting for OrderPlaced events...');

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log('Updating inventory for order:', order.id, '- Product:', order.product, 'Qty:', order.quantity);
        // Simulate inventory update
        channel.ack(msg);
      }
    }, { noAck: false });

  } catch (err) {
    console.error('Inventory Service error, retrying in 5s...', err.message);
    setTimeout(start, 5000);
  }
}

start();
