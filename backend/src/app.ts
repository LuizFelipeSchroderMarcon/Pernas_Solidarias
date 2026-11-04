import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Tratamento de erros centralizado
app.use(errorHandler);

export { app };
