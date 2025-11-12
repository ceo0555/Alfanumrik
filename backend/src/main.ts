import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { registerApiRoutes } from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

registerApiRoutes(app);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});
