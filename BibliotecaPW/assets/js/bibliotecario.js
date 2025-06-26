// URLs das nossas rotas de backend
const API_ACERVO_URL = 'http://localhost:3000/api/acervo';

// --- LÓGICA DE AUTENTICAÇÃO E SESSÃO ---

// Executa o código principal quando todo o HTML da página estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Pega os dados do usuário que foram salvos no sessionStorage
    const usuarioJSON = sessionStorage.getItem('usuarioLogado');

    // 2. Se não houver dados, o usuário não está logado. Expulsa ele para a página de login.
    if (!usuarioJSON) {
        alert('Acesso não autorizado. Por favor, faça o login.');
        window.location.href = 'login.html';
        return; // Para a execução do script
    }

    // 3. Se os dados existem, converte de volta para um objeto
    const usuario = JSON.parse(usuarioJSON);

    // 4. Preenche as informações na tela
    const nomeDisplay = document.getElementById('nome-usuario-display');
    const perfilDisplay = document.getElementById('perfil-usuario-display');
    if(nomeDisplay) nomeDisplay.textContent = usuario.nome;
    if(perfilDisplay) perfilDisplay.textContent = usuario.perfil.charAt(0).toUpperCase() + usuario.perfil.slice(1);

    // 5. Configura o botão de logout
    const botaoLogout = document.getElementById('logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', () => {
            sessionStorage.removeItem('usuarioLogado'); // Limpa a sessão
            alert('Você foi desconectado.');
            window.location.href = 'login.html'; // Volta para a página de login
        });
    }

    // 6. Configura os outros eventos da página
    const botaoBusca = document.getElementById('btn-busca-api');
    if (botaoBusca) {
        botaoBusca.addEventListener('click', buscarLivrosNaApi);
    }
    
    // 7. Carrega a tabela do acervo local
    carregarAcervoLocal();
});


// --- RESTANTE DO CÓDIGO (FUNÇÕES DE GERENCIAMENTO) ---
// (O código abaixo permanece o mesmo que já tínhamos)

let resultadosDaBuscaAtual = [];

async function buscarLivrosNaApi() {
    // Código da função buscarLivrosNaApi... (idêntico ao anterior)
}
async function adicionarAoEstoque(indexDoLivro) {
    // Código da função adicionarAoEstoque... (idêntico ao anterior)
}
async function carregarAcervoLocal() {
    // Código da função carregarAcervoLocal... (idêntico ao anterior)
}
async function editarLivro(id, quantidadeAtual) {
    // Código da função editarLivro... (idêntico ao anterior)
}
async function removerLivro(id, titulo) {
    // Código da função removerLivro... (idêntico ao anterior)
}

// Para garantir, cole as funções completas abaixo no lugar das suas
async function buscarLivrosNaApi() {
    const termoBusca = document.getElementById('campo-busca-api').value;
    if (!termoBusca) return alert('Por favor, digite um termo para buscar.');
    const containerResultados = document.getElementById('container-resultados-api');
    containerResultados.innerHTML = '<p>Buscando...</p>';
    try {
        const response = await fetch(`http://localhost:3000/api/livros?q=${termoBusca}`);
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
            divLivro.innerHTML = `<img src="${livro.url_imagem || 'https://i.imgur.com/bCbavXU.png'}" alt="Capa de ${livro.titulo}"><div class="info"><strong>${livro.titulo}</strong><br><small>${livro.autor} (${livro.ano_publicacao || 'N/A'})</small></div><div class="acoes"><input type="number" class="form-control form-control-sm" id="qtd-${livro.google_id}" value="1" min="1" aria-label="Quantidade"><button class="btn btn-success btn-sm" onclick="adicionarAoEstoque(${index})">Adicionar</button></div>`;
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
        const response = await fetch('http://localhost:3000/api/acervo', {
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
        const response = await fetch('http://localhost:3000/api/acervo');
        const livrosDoAcervo = await response.json();
        const tabelaCorpo = document.getElementById('tabela-acervo-corpo');
        tabelaCorpo.innerHTML = '';
        livrosDoAcervo.forEach(livro => {
            const linha = document.createElement('tr');
            linha.innerHTML = `<td>${livro.id}</td><td>${livro.titulo}</td><td>${livro.autor}</td><td>${livro.ano_publicacao || ''}</td><td>${livro.quantidade_disponivel}</td><td><button class="btn btn-warning btn-sm" onclick="editarLivro(${livro.id}, ${livro.quantidade_disponivel})">Editar</button><button class="btn btn-danger btn-sm" onclick="removerLivro(${livro.id}, '${livro.titulo.replace(/'/g, "\\'")}')">Excluir</button></td>`;
            tabelaCorpo.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar acervo:', error);
    }
}

async function editarLivro(id, quantidadeAtual) {
    const novaQuantidade = prompt(`Editando Livro ID ${id}.\nQuantidade atual: ${quantidadeAtual}\n\nDigite a nova quantidade em estoque:`, quantidadeAtual);
    if (novaQuantidade !== null && !isNaN(novaQuantidade) && novaQuantidade >= 0) {
        try {
            const response = await fetch(`http://localhost:3000/api/acervo/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantidade_disponivel: parseInt(novaQuantidade) })
            });
            if (!response.ok) throw new Error('Falha ao atualizar.');
            alert('Livro atualizado com sucesso!');
            await carregarAcervoLocal();
        } catch (err) {
            alert('Erro ao atualizar o livro.');
        }
    }
}

async function removerLivro(id, titulo) {
    if (confirm(`Tem certeza que deseja excluir o livro "${titulo}" (ID: ${id})?`)) {
        try {
            const response = await fetch(`http://localhost:3000/api/acervo/${id}`, { method: 'DELETE' });
            const data = await response.json();
            alert(data.mensagem);
            if (response.ok) await carregarAcervoLocal();
        } catch (err) {
            alert('Erro ao remover o livro.');
        }
    }
}