import fs from 'fs';
import path from 'path';
import { pool } from './connection';

export async function initDatabase() {
  let sqlPath = path.join(__dirname, 'init-database.sql');
  if (!fs.existsSync(sqlPath)) {
    sqlPath = path.resolve(__dirname, '../../src/database/init-database.sql');
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Iniciando execução do script de banco de dados...');
  try {
    await pool.query(sql);
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Processo de inicialização finalizado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha na inicialização:', err);
      process.exit(1);
    });
}
