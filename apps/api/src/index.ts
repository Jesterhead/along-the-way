import { config } from './config.js';
import { createPrismaClient } from './db.js';
import { createApp } from './server.js';

const prisma = createPrismaClient(config.databaseUrl);
const { app, apollo } = await createApp({ prisma, localUserEmail: config.localUserEmail });

const server = app.listen(config.port, () => {
  console.log(`API ready at http://localhost:${config.port}/graphql`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await apollo.stop();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
