const { Kafka } = require('kafkajs');
const axios = require('axios');

const kafka = new Kafka({ clientId: 'notification-service', brokers: [process.env.KAFKA_BROKER || 'kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'notification-group' });

const sendNotification = async (adminEmail, auditDetails) => {
  try {
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

const startKafkaConsumer = async () => {
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

module.exports = { startKafkaConsumer };
