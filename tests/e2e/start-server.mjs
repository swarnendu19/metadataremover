import { dev } from 'astro';

const server = await dev({
  root: new URL('../../', import.meta.url),
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
});

async function stop() {
  await server.stop();
  process.exit(0);
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
