const express = require('express');
const axios = require('axios');
const router = express.Router();

// Rota para BUSCAR livros na API do Google (NÃO TOCA MAIS NO BANCO DE DADOS)
router.get('/livros', async (req, res) => {
    const termoBusca = req.query.q;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!termoBusca) return res.status(400).json({ mensagem: 'Termo de busca é obrigatório.' });
    if (!apiKey) return res.status(500).json({ mensagem: 'Chave da API do Google não configurada.' });

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termoBusca)}&key=${apiKey}&maxResults=10`;

    try {
        const response = await axios.get(url);
        if (!response.data.items) return res.json([]);

        const livrosDaApi = response.data.items.map(item => {
            const vi = item.volumeInfo;
            return {
                google_id: item.id,
                titulo: vi.title || 'Título não disponível',
                autor: (vi.authors || ['Autor desconhecido']).join(', '),
                ano_publicacao: vi.publishedDate ? parseInt(vi.publishedDate.substring(0, 4)) : null,
                descricao: vi.description || 'Descrição não disponível.',
                url_imagem: vi.imageLinks?.thumbnail || null
            };
        });
        
        res.json(livrosDaApi);

    } catch (error) {
        console.error("Erro na rota /livros:", error.message);
        res.status(500).json({ mensagem: "Erro ao se comunicar com a API do Google." });
    }
});

// Rota para ADICIONAR um livro ao nosso acervo ou ATUALIZAR seu estoque
router.post('/acervo', async (req, res) => {
    const { livro, quantidade } = req.body;
    const pool = req.pool;
    let connection;

    if (!livro || !livro.google_id || quantidade === undefined) {
        return res.status(400).json({ mensagem: 'Dados do livro e quantidade são obrigatórios.' });
    }

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM livros WHERE google_id = ?', [livro.google_id]);

        if (rows.length > 0) {
            const livroExistente = rows[0];
            const novaQuantidade = livroExistente.quantidade_disponivel + parseInt(quantidade);
            await connection.execute('UPDATE livros SET quantidade_disponivel = ? WHERE id = ?', [novaQuantidade, livroExistente.id]);
            res.status(200).json({ mensagem: 'Estoque do livro atualizado com sucesso!' });
        } else {
            await connection.execute(
                'INSERT INTO livros (titulo, autor, ano_publicacao, google_id, descricao, url_imagem, quantidade_disponivel) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [livro.titulo, livro.autor, livro.ano_publicacao, livro.google_id, livro.descricao, livro.url_imagem, parseInt(quantidade)]
            );
            res.status(201).json({ mensagem: 'Livro adicionado ao acervo com sucesso!' });
        }
    } catch (error) {
        console.error('Erro ao adicionar/atualizar no acervo:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/acervo', async (req, res) => {
    const { google_id } = req.query;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        let sql = 'SELECT * FROM livros ORDER BY titulo';
        let params = [];
        if (google_id) {
            sql = 'SELECT * FROM livros WHERE google_id = ?';
            params = [google_id];
        }
        const [livros] = await connection.execute(sql, params);
        res.status(200).json(livros);
    } catch (error) {
        console.error('Erro ao buscar o acervo:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.put('/acervo/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;
    const pool = req.pool;
    let connection;

    try {
        connection = await pool.getConnection();
        const fields = [];
        const values = [];
        if (titulo) { fields.push('titulo = ?'); values.push(titulo); }
        if (autor) { fields.push('autor = ?'); values.push(autor); }
        if (ano_publicacao) { fields.push('ano_publicacao = ?'); values.push(ano_publicacao); }
        if (quantidade_disponivel !== undefined) { fields.push('quantidade_disponivel = ?'); values.push(quantidade_disponivel); }
        if (fields.length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum campo para atualizar foi fornecido.' });
        }
        values.push(id);
        const sql = `UPDATE livros SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await connection.execute(sql, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: `Livro com ID ${id} não encontrado.` });
        }
        res.status(200).json({ mensagem: `Livro com ID ${id} atualizado com sucesso.` });
    } catch (error) {
        console.error(`Erro ao editar o livro ${id}:`, error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

router.delete('/acervo/:id', async (req, res) => {
    const { id } = req.params;
    const pool = req.pool;
    let connection;
    try {
        connection = await pool.getConnection();
        const [emprestimos] = await connection.execute("SELECT id FROM emprestimos WHERE livro_id = ? AND status = 'ativo'", [id]);
        if (emprestimos.length > 0) {
            return res.status(400).json({ mensagem: 'Não é possível excluir o livro, pois existem empréstimos ativos para ele.' });
        }
        const [result] = await connection.execute('DELETE FROM livros WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: `Livro com ID ${id} não encontrado.` });
        }
        res.status(200).json({ mensagem: `Livro com ID ${id} removido com sucesso.` });
    } catch (error) {
        console.error(`Erro ao deletar o livro ${id}:`, error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;