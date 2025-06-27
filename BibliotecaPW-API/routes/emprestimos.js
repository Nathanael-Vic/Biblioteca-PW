const express = require('express');
const router = express.Router();

router.put('/emprestimos/:id/solicitar-devolucao', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;

    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            "UPDATE emprestimos SET status = 'pendente' WHERE id = ? AND status = 'ativo'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Empréstimo não encontrado ou já está em processo de devolução.' });
        }

        res.status(200).json({ mensagem: 'Solicitação de devolução enviada com sucesso! Aguarde a aprovação do bibliotecário.' });
    } catch (error) {
        console.error('Erro ao solicitar devolução:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.put('/emprestimos/:id/aprovar-devolucao', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [emprestimos] = await connection.execute("SELECT livro_id, status FROM emprestimos WHERE id = ? FOR UPDATE", [id]);
        if (emprestimos.length === 0 || emprestimos[0].status !== 'pendente') {
            await connection.rollback();
            return res.status(400).json({ mensagem: 'Este empréstimo não está pendente de devolução.' });
        }
        
        const livro_id = emprestimos[0].livro_id;
        const data_devolucao_real = new Date().toISOString().slice(0, 10);

        await connection.execute("UPDATE emprestimos SET status = 'devolvido', data_devolucao_real = ? WHERE id = ?", [data_devolucao_real, id]);
        await connection.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?', [livro_id]);
        
        await connection.commit();
        res.status(200).json({ mensagem: 'Devolução confirmada com sucesso! Estoque atualizado.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao aprovar devolução:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/emprestimos', async (req, res) => {
    const { livro_id, leitor_id } = req.body;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [livros] = await connection.execute('SELECT quantidade_disponivel FROM livros WHERE id = ? FOR UPDATE', [livro_id]);
        if (livros.length === 0 || livros[0].quantidade_disponivel <= 0) {
            await connection.rollback();
            return res.status(400).json({ mensagem: 'Livro indisponível para empréstimo.' });
        }
        await connection.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?', [livro_id]);
        const data_emprestimo = new Date().toISOString().slice(0, 10);
        const data_devolucao = new Date();
        data_devolucao.setDate(data_devolucao.getDate() + 14);
        const data_devolucao_prevista = data_devolucao.toISOString().slice(0, 10);
        await connection.execute('INSERT INTO emprestimos (livro_id, leitor_id, data_emprestimo, data_devolucao_prevista, status) VALUES (?, ?, ?, ?, ?)', [livro_id, leitor_id, data_emprestimo, data_devolucao_prevista, 'ativo']);
        await connection.commit();
        res.status(201).json({ mensagem: 'Empréstimo realizado com sucesso!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao solicitar empréstimo:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor ao processar o empréstimo.' });
    } finally {
        if (connection) connection.release();
    }
});

router.put('/emprestimos/:id/solicitar-devolucao', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            "UPDATE emprestimos SET status = 'pendente' WHERE id = ? AND status = 'ativo'",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Empréstimo não encontrado ou já está em processo de devolução.' });
        }
        res.status(200).json({ mensagem: 'Solicitação de devolução enviada com sucesso! Aguarde a aprovação do bibliotecário.' });
    } catch (error) {
        console.error('Erro ao solicitar devolução:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/emprestimos/meus/:leitorId', async (req, res) => {
    const { leitorId } = req.params;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        const sql = `
            SELECT 
                e.id, e.data_emprestimo, e.data_devolucao_prevista, e.status,
                l.titulo AS livro_titulo
            FROM emprestimos e
            JOIN livros l ON e.livro_id = l.id
            WHERE e.leitor_id = ?
            ORDER BY FIELD(e.status, 'ativo', 'pendente', 'atrasado', 'devolvido'), e.data_emprestimo DESC
        `;
        const [meusEmprestimos] = await connection.execute(sql, [leitorId]);
        res.status(200).json(meusEmprestimos);
    } catch (error) {
        console.error(`Erro ao buscar empréstimos do leitor ${leitorId}:`, error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/emprestimos', async (req, res) => {
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        const sql = `
            SELECT 
                e.id, e.data_emprestimo, e.data_devolucao_prevista, e.status,
                u.nome AS leitor_nome,
                l.titulo AS livro_titulo
            FROM emprestimos e
            JOIN usuarios u ON e.leitor_id = u.id
            JOIN livros l ON e.livro_id = l.id
            ORDER BY FIELD(e.status, 'pendente', 'ativo', 'atrasado', 'devolvido'), e.data_emprestimo DESC
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

router.put('/emprestimos/:id/aprovar-devolucao', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [emprestimos] = await connection.execute("SELECT livro_id, status FROM emprestimos WHERE id = ? FOR UPDATE", [id]);
        if (emprestimos.length === 0 || emprestimos[0].status !== 'pendente') {
            await connection.rollback();
            return res.status(400).json({ mensagem: 'Este empréstimo não está pendente de devolução.' });
        }
        const livro_id = emprestimos[0].livro_id;
        const data_devolucao_real = new Date().toISOString().slice(0, 10);
        await connection.execute("UPDATE emprestimos SET status = 'devolvido', data_devolucao_real = ? WHERE id = ?", [data_devolucao_real, id]);
        await connection.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?', [livro_id]);
        await connection.commit();
        res.status(200).json({ mensagem: 'Devolução confirmada com sucesso! Estoque atualizado.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao aprovar devolução:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router;