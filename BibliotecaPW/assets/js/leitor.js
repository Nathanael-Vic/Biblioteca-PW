const API_ACERVO_URL = 'http://localhost:3000/api/acervo';
const API_EMPRESTIMOS_URL = 'http://localhost:3000/api/emprestimos';

let usuarioLogado = null;
let acervoAtual = [];

document.addEventListener('DOMContentLoaded', () => {
    const usuarioJSON = sessionStorage.getItem('usuarioLogado');
    if (!usuarioJSON) {
        alert('Acesso não autorizado. Por favor, faça o login.');
        window.location.href = 'login.html'; 
        return; 
    }
    usuarioLogado = JSON.parse(usuarioJSON);
    document.getElementById('nome-usuario-display').textContent = usuarioLogado.nome;
    document.getElementById('perfil-usuario-display').textContent = usuarioLogado.perfil.charAt(0).toUpperCase() + usuarioLogado.perfil.slice(1);
    document.getElementById('logout').addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        alert('Você foi desconectado.');
        window.location.href = 'login.html';
    });
    mostrarSecao('secao-catalogo');
    carregarCatalogo();
    carregarMeusEmprestimos();
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

async function carregarCatalogo() {
    try {
        const response = await fetch(API_ACERVO_URL);
        acervoAtual = await response.json();
        popularCarrossel('carouselExampleDark1', acervoAtual);
        popularCarrossel('carouselNovidades', acervoAtual.slice().reverse());
    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
    }
}

function popularCarrossel(carouselId, livros) {
    const carouselInner = document.querySelector(`#${carouselId} .carousel-inner`);
    const containerModais = document.getElementById('container-modais-leitor');
    carouselInner.innerHTML = '';
    if (!livros || livros.length === 0) {
        carouselInner.innerHTML = '<p class="text-center p-3">Nenhum livro encontrado no acervo.</p>';
        return;
    }
    const livrosPorSlide = 5;
    for (let i = 0; i < livros.length; i += livrosPorSlide) {
        const slide = document.createElement('div');
        slide.className = `carousel-item ${i === 0 ? 'active' : ''}`;
        const listaLivros = document.createElement('div');
        listaLivros.className = 'lista-livros';
        const fatiaDeLivros = livros.slice(i, i + livrosPorSlide);
        fatiaDeLivros.forEach(livro => {
            listaLivros.innerHTML += criarCardHTML(livro);
            containerModais.insertAdjacentHTML('beforeend', criarModalHTML(livro));
        });
        slide.appendChild(listaLivros);
        carouselInner.appendChild(slide);
    }
}

function criarCardHTML(livro) {
    return `<div class="card"><img src="${livro.url_imagem || '../assets/img/default-book.png'}" class="card-img-top" alt="Capa de ${livro.titulo}"><button class="btn" data-bs-toggle="modal" data-bs-target="#modal-livro-${livro.id}">Visualizar</button><div class="card-body"><h5 class="card-title" title="${livro.titulo}">${livro.titulo}</h5><p class="card-author" title="${livro.autor}">Autor: ${livro.autor}</p><p class="card-stock">Estoque: ${livro.quantidade_disponivel}</p></div></div>`;
}

function criarModalHTML(livro) {
    return `<div class="modal fade" id="modal-livro-${livro.id}" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${livro.titulo}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body row"><div class="col-md-4"><img src="${livro.url_imagem || '../assets/img/default-book.png'}" class="img-fluid rounded"></div><div class="col-md-8"><p><strong>Autor:</strong> ${livro.autor}</p><p><strong>Ano:</strong> ${livro.ano_publicacao || 'N/A'}</p><p><strong>Estoque:</strong> ${livro.quantidade_disponivel}</p><hr><p><strong>Descrição:</strong> ${livro.descricao || 'Descrição não disponível.'}</p></div></div><div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button><button class="btn btn-success" onclick="solicitarEmprestimo(${livro.id})">Solicitar Empréstimo</button></div></div></div></div>`;
}

async function carregarMeusEmprestimos() {
    if (!usuarioLogado) return;
    try {
        const response = await fetch(`${API_EMPRESTIMOS_URL}/meus/${usuarioLogado.id}`);
        const emprestimos = await response.json();
        const tabelaCorpo = document.getElementById('tabela-meus-emprestimos-corpo');
        tabelaCorpo.innerHTML = '';
        if (emprestimos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="5" class="text-center">Você não possui empréstimos.</td></tr>';
            return;
        }
        emprestimos.forEach(emp => {
            const linha = document.createElement('tr');
            const dataEmprestimo = new Date(emp.data_emprestimo).toLocaleDateString('pt-BR');
            const dataDevolucao = new Date(emp.data_devolucao_prevista).toLocaleDateString('pt-BR');
            let statusBadge = '';
            if (emp.status === 'ativo') statusBadge = '<span class="badge bg-primary">Ativo</span>';
            else if (emp.status === 'pendente') statusBadge = '<span class="badge bg-warning">Pendente</span>';
            else if (emp.status === 'devolvido') statusBadge = '<span class="badge bg-success">Devolvido</span>';
            else if (emp.status === 'atrasado') statusBadge = '<span class="badge bg-danger">Atrasado</span>';
            let botaoAcao = 'N/A';
            if (emp.status === 'ativo') {
                botaoAcao = `<button class="btn btn-info btn-sm" onclick="solicitarDevolucao(${emp.id})">Solicitar Devolução</button>`;
            }
            linha.innerHTML = `<td>${emp.livro_titulo}</td><td>${dataEmprestimo}</td><td>${dataDevolucao}</td><td>${statusBadge}</td><td>${botaoAcao}</td>`;
            tabelaCorpo.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar meus empréstimos:', error);
    }
}

async function solicitarEmprestimo(livroId) {
    if (!confirm('Deseja realmente solicitar o empréstimo deste livro?')) return;
    const livro = acervoAtual.find(l => l.id === livroId);
    if(livro.quantidade_disponivel <= 0) {
        return alert('Desculpe, este livro não está disponível em estoque no momento.');
    }
    try {
        const response = await fetch(API_EMPRESTIMOS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                livro_id: livroId,
                leitor_id: usuarioLogado.id
            })
        });
        const data = await response.json();
        alert(data.mensagem);
        if(response.ok) {
            carregarCatalogo();
            carregarMeusEmprestimos();
            const modalEl = document.getElementById(`modal-livro-${livroId}`);
            if(modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }
    } catch (error) {
        alert('Erro ao solicitar empréstimo.');
    }
}

async function solicitarDevolucao(emprestimoId) {
    if (!confirm('Deseja solicitar a devolução deste livro?')) return;
    try {
        const response = await fetch(`${API_EMPRESTIMOS_URL}/${emprestimoId}/solicitar-devolucao`, {
            method: 'PUT'
        });
        const data = await response.json();
        alert(data.mensagem);
        if (response.ok) {
            carregarMeusEmprestimos();
        }
    } catch (error) {
        console.error('Erro ao solicitar devolução:', error);
        alert('Ocorreu um erro de comunicação ao tentar solicitar a devolução.');
    }
}
