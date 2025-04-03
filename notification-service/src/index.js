const { Kafka } = require('kafkajs');
const axios = require('axios');
const app = require('./server');
const { startKafkaConsumer } = require('./controllers/notification.controller');

const kafka = new Kafka({ clientId: 'notification-service', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'notification-group' });

const sendNotification = async (adminEmail, auditDetails) => {
  try {
    // Example: Send email notification
    await axios.post(process.env.EMAIL_SERVICE_URL, {
      to: adminEmail,
      subject: 'Audit Program Submitted for Approval',
      body: `An audit program has been submitted for approval. Details: ${JSON.stringify(auditDetails)}`,
    });
    console.log(`Notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('Failed to send notification:', error.message);
  }
};

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'audit.submitted', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value.toString()}`);
      const event = JSON.parse(message.value.toString());

      const { adminEmail, auditDetails } = event;
      await sendNotification(adminEmail, auditDetails);
    },
  });
};

run().catch(console.error);

process.on('SIGTERM', async () => {
  await consumer.disconnect();
  console.log('Consumer disconnected');
  process.exit(0);
});

const PORT = process.env.PORT || 5006;

app.listen(PORT, async () => {
  console.log(`Notification service running on port ${PORT}`);
  await startKafkaConsumer(); // Start Kafka consumer when the server starts
});
