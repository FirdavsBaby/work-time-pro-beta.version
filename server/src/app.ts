import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`WorkTime Pro API listening on http://localhost:${port}`);
  });
}
