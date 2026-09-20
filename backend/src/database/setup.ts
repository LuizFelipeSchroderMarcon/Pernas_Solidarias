import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { pool } from './connection';

export async function initDatabase() {
  let sqlPath = path.join(__dirname, 'init-database.sql');
  if (!fs.existsSync(sqlPath)) {
    sqlPath = path.resolve(__dirname, '../../src/database/init-database.sql');
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Iniciando execução do script de criação das tabelas...');
  try {
    await pool.query(sql);
    console.log('Tabelas e índices verificados/criados com sucesso!');

    // Seed initial coordinator user if table is empty
    const userCheck = await pool.query('SELECT COUNT(*) FROM "USER"');
    const totalUsers = parseInt(userCheck.rows[0].count, 10);

    if (totalUsers === 0) {
      const defaultEmail = 'admin@pernassolidarias.org.br';
      const defaultPass = 'admin123';
      const hash = await bcrypt.hash(defaultPass, 10);
      await pool.query('INSERT INTO "USER" (email, senha) VALUES ($1, $2)', [defaultEmail, hash]);
      console.log(`\n🔑 Usuário coordenador padrão criado com sucesso:`);
      console.log(`   E-mail: ${defaultEmail}`);
      console.log(`   Senha:  ${defaultPass}\n`);
    }
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

if (require.main === module || process.argv[1]?.includes('setup')) {
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
