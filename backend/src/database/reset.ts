import { pool } from './connection';
import { initDatabase } from './setup';

export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Operação cancelada: reset de banco não é permitido em ambiente de produção.');
  }

  console.log('⚠️  Limpando todas as tabelas e estruturas existentes...');
  try {
    // Dropa todo o schema public e recria limpo (remove tabelas, triggers, sequências e índices)
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('✅ Schema public recriado com sucesso.');

    // Executa a criação a partir do init-database.sql e cadastra o usuário admin padrão
    await initDatabase();
    console.log('🚀 Banco de dados completamente recriado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao resetar o banco de dados:', error);
    throw error;
  }
}

if (require.main === module) {
  resetDatabase()
    .finally(async () => {
      await pool.end();
    })
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
