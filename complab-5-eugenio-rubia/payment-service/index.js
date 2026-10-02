const amqp = require('amqplib');

const BROKER_URL = process.env.BROKER_URL || 'amqp://guest:guest@localhost:5672';

async function start() {
  try {
    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createChannel();

    // Assert exchanges
    await channel.assertExchange('OrderPlaced', 'fanout', { durable: true });
    await channel.assertExchange('PaymentSuccess', 'fanout', { durable: true });

    // Create and bind queue for this service
    const queue = 'payment_service_queue';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'OrderPlaced', '');

    console.log('Payment Service waiting for OrderPlaced events...');

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log('Processing payment for order:', order.id);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 500));

        const paymentEvent = {
          orderId: order.id,
          status: 'success',
          amount: (order.quantity || 1) * 100, // dummy amount
          timestamp: new Date().toISOString()
        };

        // Publish PaymentSuccess
        channel.publish('PaymentSuccess', '', Buffer.from(JSON.stringify(paymentEvent)), {
          persistent: true
        });

        console.log('PaymentSuccess published for order:', order.id);
        channel.ack(msg);
      }
    }, { noAck: false });

  } catch (err) {
    console.error('Payment Service error, retrying in 5s...', err.message);
    setTimeout(start, 5000);
  }
}

start();
