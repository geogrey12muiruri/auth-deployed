const { Kafka } = require('kafkajs');
const { PrismaClient } = require('@prisma/client');
const { sendOTP, logEvent } = require('../controllers/authController'); // Import reusable functions

const prisma = new PrismaClient();
const kafka = new Kafka({ clientId: 'auth-service', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'auth-service-group' });
const producer = kafka.producer();

const consumeEvents = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'role.created', fromBeginning: true });
  await consumer.subscribe({ topic: 'user.registered', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      console.log(`Received event from topic ${topic}:`, event);

      try {
        if (topic === 'role.created') {
          await prisma.role.create({
            data: {
              id: event.id,
              name: event.name,
              description: event.description,
              tenantId: event.tenantId,
            },
          });
          console.log('Role created successfully in auth-service:', event);
        } else if (topic === 'user.registered') {
          await prisma.user.create({
            data: {
              id: event.id,
              email: event.email,
              roleId: event.roleId,
              tenantId: event.tenantId,
            },
          });
          console.log('User registered successfully in auth-service:', event);

          // Send OTP to the user
          await sendOTP(event.email);

          // Log the event
          await logEvent('user.registered', event);

          // Optionally, publish a new event
          await producer.connect();
          await producer.send({
            topic: 'user.synchronized',
            messages: [{ value: JSON.stringify({ id: event.id, tenantId: event.tenantId }) }],
          });
          await producer.disconnect();
        }
      } catch (error) {
        console.error(`Error processing event from topic ${topic}:`, error.message);
      }
    },
  });
};

module.exports = { consumeEvents };