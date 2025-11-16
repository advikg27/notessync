import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { authExtendedRoutes } from './routes/auth-extended';
import { moduleRoutes } from './routes/modules';
import { courseRoutes } from './routes/courses';
import { compilerRoutes } from './routes/compiler';

dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
});

// Auth decorator
server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
server.register(authRoutes, { prefix: '/auth' });
server.register(authExtendedRoutes, { prefix: '/auth' });
server.register(moduleRoutes, { prefix: '/modules' });
server.register(courseRoutes, { prefix: '/courses' });
server.register(compilerRoutes, { prefix: '/compiler' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

