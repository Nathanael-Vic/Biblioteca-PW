const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const pool = req.pool;
    let connection;

    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
        }

        const usuario = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
        }

        res.status(200).json({
            mensagem: 'Login bem-sucedido!',
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
        });
    } catch (error) {
        console.error('Erro em /login:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/register', async (req, res) => {
    const { nome, email, senha, perfil } = req.body;
    const pool = req.pool;
    let connection;

    if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    }
    
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
        }

        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        const [result] = await connection.execute(
            'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senhaCriptografada, perfil]
        );

        res.status(201).json({ mensagem: 'Usuário registrado com sucesso!', usuarioId: result.insertId });
    } catch (error) {
        console.error('Erro em /register:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;