// 1. Importações principais
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 2. Criação do Pool de Conexão com o Banco (imutável)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 3. Configurações do servidor Express
const app = express();
const PORT = 3000;

// 4. Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// 5. "Injetando" o pool de conexão em todas as requisições
// Isso permite que nossos roteadores acessem o banco de dados facilmente
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// 6. Importando e usando os roteadores
const authRoutes = require('./routes/auth');
const livrosRoutes = require('./routes/livros');
const emprestimosRoutes = require('./routes/emprestimos');

app.use('/api', authRoutes); // Rotas: /api/login, /api/register
app.use('/api', livrosRoutes); // Rotas: /api/livros, /api/acervo, etc.
app.use('/api', emprestimosRoutes); // Rotas: /api/emprestimos

// 7. Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});