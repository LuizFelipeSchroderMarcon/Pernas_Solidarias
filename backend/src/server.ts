import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { pool } from './database/connection';
import { initDatabase } from './database/setup';

const PORT = process.env.PORT || 3000;

// Teste inicial de conexão e inicialização/migração automática das tabelas ao iniciar
pool
  .query('SELECT NOW()')
  .then(async () => {
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');
    await initDatabase();
  })
  .catch((err) => {
    console.error('Aviso: Não foi possível conectar ao PostgreSQL na inicialização.', err.message);
  });

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
