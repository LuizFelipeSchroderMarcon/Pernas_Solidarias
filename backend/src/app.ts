import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Desativa o header 'X-Powered-By' para ocultar a identificação da tecnologia
app.disable('x-powered-by');

// Configuração de CORS com origens explicitamente autorizadas
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Tratamento de erros centralizado
app.use(errorHandler);

export { app };
