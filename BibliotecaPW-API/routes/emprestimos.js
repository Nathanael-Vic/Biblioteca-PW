const express = require('express');
const router = express.Router();

// Bibliotecário: Lista TODOS os empréstimos
router.get('/emprestimos', async (req, res) => {
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        const sql = `
            SELECT 
                e.id, 
                e.data_emprestimo, 
                e.data_devolucao_prevista,
                e.status,
                u.nome AS leitor_nome,
                l.titulo AS livro_titulo
            FROM emprestimos e
            JOIN usuarios u ON e.leitor_id = u.id
            JOIN livros l ON e.livro_id = l.id
            ORDER BY e.data_emprestimo DESC
        `;
        const [emprestimos] = await connection.execute(sql);
        res.status(200).json(emprestimos);
    } catch (error) {
        console.error('Erro ao listar empréstimos:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

// Leitor: Solicita um novo empréstimo
router.post('/emprestimos', async (req, res) => {
    // No futuro, o leitor_id viria do token de autenticação
    const { livro_id, leitor_id, data_emprestimo, data_devolucao_prevista } = req.body;
    const pool = req.pool;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Inicia uma transação

        // 1. Verifica se há estoque do livro
        const [livros] = await connection.execute('SELECT quantidade_disponivel FROM livros WHERE id = ? FOR UPDATE', [livro_id]);
        if (livros.length === 0 || livros[0].quantidade_disponivel <= 0) {
            await connection.rollback(); // Desfaz a transação
            return res.status(400).json({ mensagem: 'Livro indisponível para empréstimo.' });
        }

        // 2. Decrementa o estoque
        await connection.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?', [livro_id]);

        // 3. Cria o registro do empréstimo
        const status = 'ativo';
        await connection.execute(
            'INSERT INTO emprestimos (livro_id, leitor_id, data_emprestimo, data_devolucao_prevista, status) VALUES (?, ?, ?, ?, ?)',
            [livro_id, leitor_id, data_emprestimo, data_devolucao_prevista, status]
        );

        await connection.commit(); // Confirma a transação
        res.status(201).json({ mensagem: 'Empréstimo realizado com sucesso!' });

    } catch (error) {
        if (connection) await connection.rollback(); // Desfaz em caso de erro
        console.error('Erro ao solicitar empréstimo:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

// Bibliotecário: Aprova uma devolução
router.put('/emprestimos/:id/devolver', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Pega o ID do livro do empréstimo
        const [emprestimos] = await connection.execute('SELECT livro_id, status FROM emprestimos WHERE id = ?', [id]);
        if (emprestimos.length === 0 || emprestimos[0].status === 'devolvido') {
            await connection.rollback();
            return res.status(400).json({ mensagem: 'Empréstimo não encontrado ou já devolvido.' });
        }
        const livro_id = emprestimos[0].livro_id;

        // 2. Atualiza o status do empréstimo
        const data_devolucao_real = new Date().toISOString().slice(0, 10); // Data de hoje
        await connection.execute(
            "UPDATE emprestimos SET status = 'devolvido', data_devolucao_real = ? WHERE id = ?",
            [data_devolucao_real, id]
        );

        // 3. Incrementa o estoque do livro
        await connection.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?', [livro_id]);

        await connection.commit();
        res.status(200).json({ mensagem: 'Devolução confirmada com sucesso!' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao devolver livro:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;