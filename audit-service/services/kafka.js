const { Kafka } = require('kafkajs');

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'audit-service', // Unique identifier for this service
  brokers: ['kafka:9092'], // Replace with your Kafka broker address
});

// Create a Kafka producer
const producer = kafka.producer();

// Connect the producer
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Error connecting Kafka producer:', error.message);
  }
};

// Publish an event to a Kafka topic
const publishEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Event published to topic ${topic}:`, message);
  } catch (error) {
    console.error(`Error publishing event to topic ${topic}:`, error.message);
  }
};

module.exports = { connectProducer, publishEvent };