import Fastify from 'fastify';
import app from '../src/app';

const fastify = Fastify({
  logger: true
});

// This flag checks if the app is ready
let isReady = false;

// Initialize and register the app only once
fastify.register(app).ready(err => {
  if (err) throw err;

  console.log('Routes:', fastify.printRoutes());
  isReady = true;
});

export default async (req, res) => {
  if (!isReady) {
    res.statusCode = 503;
    res.end('Server is not ready yet');
    return;
  }

  fastify.server.emit('request', req, res);
};
