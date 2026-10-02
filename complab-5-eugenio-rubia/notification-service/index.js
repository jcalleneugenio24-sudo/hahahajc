const amqp = require('amqplib');

const BROKER_URL = process.env.BROKER_URL || 'amqp://guest:guest@localhost:5672';

async function start() {
  try {
    const connection = await amqp.connect(BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange('PaymentSuccess', 'fanout', { durable: true });

    // Note: worksheet mentions notification_payment_queue or notification_service_queue
    const queue = 'notification_service_queue';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'PaymentSuccess', '');

    console.log('Notification Service waiting for PaymentSuccess events...');

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const payment = JSON.parse(msg.content.toString());
        console.log('Sending notification for successful payment of order:', payment.orderId, '- Amount:', payment.amount);
        // Simulate sending email/SMS notification
        channel.ack(msg);
      }
    }, { noAck: false });

  } catch (err) {
    console.error('Notification Service error, retrying in 5s...', err.message);
    setTimeout(start, 5000);
  }
}

start();
