import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { pool } from './database/connection';

const PORT = process.env.PORT || 3000;

// Teste inicial de conexão ao iniciar
pool
  .query('SELECT NOW()')
  .then(() => {
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('Aviso: Não foi possível conectar ao PostgreSQL na inicialização.', err.message);
  });

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
