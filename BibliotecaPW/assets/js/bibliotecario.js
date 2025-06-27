const API_LIVROS_URL = 'http://localhost:3000/api/livros';
const API_ACERVO_URL = 'http://localhost:3000/api/acervo';
const API_EMPRESTIMOS_URL = 'http://localhost:3000/api/emprestimos';

let resultadosDaBuscaAtual = [];
let acervoAtual = [];
let emprestimosAtuais = [];
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuarioJSON = sessionStorage.getItem('usuarioLogado');
    if (!usuarioJSON) {
        alert('Acesso não autorizado. Por favor, faça o login.');
        window.location.href = 'login.html';
        return;
    }

    usuarioLogado = JSON.parse(usuarioJSON);
    
    if (usuarioLogado.perfil !== 'bibliotecario') {
        alert('Acesso negado. Esta página é apenas para bibliotecários.');
        window.location.href = 'leitor.html';
        return;
    }

    document.getElementById('nome-usuario-display').textContent = usuarioLogado.nome;
    document.getElementById('perfil-usuario-display').textContent = 'Bibliotecário';
    
    document.getElementById('logout').addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        alert('Você foi desconectado.');
        window.location.href = 'login.html';
    });

    document.getElementById('btn-busca-api').addEventListener('click', buscarLivrosNaApi);
    
    mostrarSecao('secao-cadastro');
    carregarAcervoLocal();
    carregarTodosEmprestimos();
});

function mostrarSecao(idSecao) {
    document.querySelectorAll('.secao').forEach(secao => {
        secao.style.display = 'none';
    });
    const secaoAtiva = document.getElementById(idSecao);
    if (secaoAtiva) {
        secaoAtiva.style.display = 'block';
    }
}

async function buscarLivrosNaApi() {
    const termoBusca = document.getElementById('campo-busca-api').value;
    if (!termoBusca) return alert('Por favor, digite um termo para buscar.');
    const containerResultados = document.getElementById('container-resultados-api');
    containerResultados.innerHTML = '<p>Buscando...</p>';
    try {
        const response = await fetch(`${API_LIVROS_URL}?q=${termoBusca}`);
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error(data.mensagem || 'Ocorreu um erro no servidor.');
        resultadosDaBuscaAtual = data;
        containerResultados.innerHTML = '';
        if (data.length === 0) {
            containerResultados.innerHTML = '<p>Nenhum livro encontrado para este termo.</p>';
            return;
        }
        data.forEach((livro, index) => {
            const divLivro = document.createElement('div');
            divLivro.className = 'item-resultado';
            divLivro.innerHTML = `
                <img src="${livro.url_imagem || '[https://i.imgur.com/bCbavXU.png](https://i.imgur.com/bCbavXU.png)'}" alt="Capa de ${livro.titulo}">
                <div class="info">
                    <strong>${livro.titulo}</strong><br>
                    <small>${livro.autor} (${livro.ano_publicacao || 'N/A'})</small>
                </div>
                <div class="acoes">
                    <input type="number" class="form-control form-control-sm" id="qtd-${livro.google_id}" value="1" min="1" aria-label="Quantidade">
                    <button class="btn btn-success btn-sm" onclick="adicionarAoEstoque(${index})">Adicionar</button>
                </div>
            `;
            containerResultados.appendChild(divLivro);
        });
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        containerResultados.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

async function adicionarAoEstoque(indexDoLivro) {
    const livroParaAdicionar = resultadosDaBuscaAtual[indexDoLivro];
    const quantidade = document.getElementById(`qtd-${livroParaAdicionar.google_id}`).value;
    if (!quantidade || quantidade < 1) return alert('Por favor, insira uma quantidade válida.');
    try {
        const response = await fetch(API_ACERVO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ livro: livroParaAdicionar, quantidade: parseInt(quantidade) })
        });
        const data = await response.json();
        alert(data.mensagem);
        if (response.ok) carregarAcervoLocal();
    } catch(error) {
        console.error('Erro ao adicionar ao estoque:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}

async function carregarAcervoLocal() {
    try {
        const response = await fetch(API_ACERVO_URL);
        acervoAtual = await response.json();
        const tabelaCorpo = document.getElementById('tabela-acervo-corpo');
        tabelaCorpo.innerHTML = '';
        acervoAtual.forEach(livro => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${livro.id}</td>
                <td>${livro.titulo}</td>
                <td>${livro.autor}</td>
                <td>${livro.ano_publicacao || ''}</td>
                <td>${livro.quantidade_disponivel}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="abrirModalEdicao(${livro.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="removerLivro(${livro.id}, '${livro.titulo.replace(/'/g, "\\'")}')">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar acervo:', error);
    }
}

function abrirModalEdicao(id) {
    const livro = acervoAtual.find(l => l.id === id);
    if (!livro) return;
    const containerModais = document.getElementById('container-modais');
    containerModais.innerHTML = `
        <div class="modal fade" id="modal-editar" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form onsubmit="salvarEdicao(event, ${id})">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Livro: ${livro.titulo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Título</label>
                                <input type="text" class="form-control" name="titulo" value="${livro.titulo}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Autor</label>
                                <input type="text" class="form-control" name="autor" value="${livro.autor}">
                            </div>
                             <div class="mb-3">
                                <label class="form-label">Quantidade em Estoque</label>
                                <input type="number" class="form-control" name="quantidade_disponivel" value="${livro.quantidade_disponivel}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('modal-editar'));
    modal.show();
}

async function salvarEdicao(event, id) {
    event.preventDefault();
    const form = event.target;
    const dados = {
        titulo: form.titulo.value,
        autor: form.autor.value,
        quantidade_disponivel: parseInt(form.quantidade_disponivel.value)
    };
    try {
        const response = await fetch(`${API_ACERVO_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!response.ok) throw new Error('Falha ao atualizar.');
        alert('Livro atualizado com sucesso!');
        const modalEl = document.getElementById('modal-editar');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        await carregarAcervoLocal();
    } catch (err) {
        alert('Erro ao atualizar o livro.');
    }
}

async function removerLivro(id, titulo) {
    if (confirm(`Tem certeza que deseja excluir o livro "${titulo}" (ID: ${id})?`)) {
        try {
            const response = await fetch(`${API_ACERVO_URL}/${id}`, { method: 'DELETE' });
            const data = await response.json();
            alert(data.mensagem);
            if (response.ok) await carregarAcervoLocal();
        } catch (err) {
            alert('Erro ao remover o livro.');
        }
    }
}

async function carregarTodosEmprestimos() {
    try {
        const response = await fetch(API_EMPRESTIMOS_URL);
        emprestimosAtuais = await response.json();
        const tabelaCorpo = document.getElementById('tabela-emprestimos-corpo');
        tabelaCorpo.innerHTML = '';
        if (emprestimosAtuais.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum empréstimo registrado.</td></tr>';
            return;
        }
        emprestimosAtuais.forEach(emp => {
            const linha = document.createElement('tr');
            let statusBadge = '';
            if (emp.status === 'ativo') statusBadge = '<span class="badge bg-primary">Ativo</span>';
            else if (emp.status === 'pendente') statusBadge = '<span class="badge bg-warning">Pendente</span>';
            else if (emp.status === 'devolvido') statusBadge = '<span class="badge bg-success">Devolvido</span>';
            else if (emp.status === 'atrasado') statusBadge = '<span class="badge bg-danger">Atrasado</span>';
            
            let botaoAcao = 'N/A';
            if (emp.status === 'pendente') {
                botaoAcao = `<button class="btn btn-success btn-sm" onclick="aprovarDevolucao(${emp.id})">Aprovar Devolução</button>`;
            }

            linha.innerHTML = `
                <td>${emp.id}</td>
                <td>${emp.leitor_nome}</td>
                <td>${emp.livro_titulo}</td>
                <td>${new Date(emp.data_emprestimo).toLocaleDateString()}</td>
                <td>${statusBadge}</td>
                <td>${botaoAcao}</td>
            `;
            tabelaCorpo.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
    }
}

async function aprovarDevolucao(id) {
    if (!confirm('Tem certeza que deseja confirmar a devolução deste livro?')) return;
    try {
        const response = await fetch(`${API_EMPRESTIMOS_URL}/${id}/aprovar-devolucao`, { method: 'PUT' });
        const data = await response.json();
        alert(data.mensagem);
        if (response.ok) {
            carregarTodosEmprestimos();
            carregarAcervoLocal();
        }
    } catch (error) {
        alert('Erro ao aprovar devolução.');
    }
}