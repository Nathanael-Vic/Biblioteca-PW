const API_ACERVO_URL = 'http://localhost:3000/api/acervo';

// --- CÓDIGO DE SESSÃO E INICIALIZAÇÃO DA PÁGINA ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Pega os dados do usuário que foram salvos no sessionStorage
    const usuarioJSON = sessionStorage.getItem('usuarioLogado');

    // 2. Se não houver dados, o usuário não está logado. Redireciona para o login.
    if (!usuarioJSON) {
        alert('Acesso não autorizado. Por favor, faça o login.');
        // O caminho para o login a partir da pasta 'pages'
        window.location.href = 'login.html'; 
        return; 
    }

    // 3. Se os dados existem, converte de volta para um objeto
    const usuario = JSON.parse(usuarioJSON);

    // 4. Preenche as informações na tela
    const nomeDisplay = document.getElementById('nome-usuario-display');
    const perfilDisplay = document.getElementById('perfil-usuario-display');
    if (nomeDisplay) nomeDisplay.textContent = usuario.nome;
    // Transforma "leitor" em "Leitor"
    if (perfilDisplay) perfilDisplay.textContent = usuario.perfil.charAt(0).toUpperCase() + usuario.perfil.slice(1);

    // 5. Configura o botão de logout
    const botaoLogout = document.getElementById('logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', () => {
            sessionStorage.removeItem('usuarioLogado'); // Limpa a sessão
            alert('Você foi desconectado.');
            window.location.href = 'login.html'; // Volta para a página de login
        });
    }
    
    // 6. Agora que sabemos que o usuário está logado, carregamos o catálogo de livros
    carregarCatalogo();
});


// --- CÓDIGO DAS FUNCIONALIDADES DA PÁGINA (CARROSSEL, MODAIS, ETC.) ---
// (O código abaixo permanece o mesmo que já tínhamos)

function criarCardHTML(livro) {
    return `
        <div class="card">
            <img src="${livro.url_imagem || '../assets/img/default-book.png'}" class="card-img-top" alt="Capa de ${livro.titulo}">
            <div class="card-body">
                <h5 class="card-title">${livro.titulo}</h5>
                <p class="card-text">
                    ID: #${livro.id} <br>
                    Autor: ${livro.autor}
                </p>
                <a href="#" class="btn" data-bs-toggle="modal" data-bs-target="#modal-livro-${livro.id}">Visualizar</a>
            </div>
        </div>
    `;
}

function criarModalHTML(livro, modalId) {
    return `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="titulo-${modalId}" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="titulo-${modalId}">Detalhes do Livro</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Título:</strong> ${livro.titulo}</p>
                        <p><strong>Autor:</strong> ${livro.autor}</p>
                        <p><strong>Ano:</strong> ${livro.ano_publicacao || 'N/A'}</p>
                        <p><strong>Descrição:</strong> ${livro.descricao || 'Descrição não disponível.'}</p>
                        <p><strong>Quantidade em Estoque:</strong> ${livro.quantidade_disponivel}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-fechar" data-bs-dismiss="modal">Fechar</button>
                        <button class="btn btn-emprestimo">Solicitar empréstimo</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function popularCarrossel(carouselId, moldeId, livros) {
    const carouselInner = document.querySelector(`#${carouselId} .carousel-inner`);
    const cardMolde = document.querySelector(`#${moldeId}`);
    
    carouselInner.innerHTML = ''; 
    if (cardMolde) carouselInner.appendChild(cardMolde);

    if (!livros.length) {
        carouselInner.innerHTML = '<p class="text-center">Nenhum livro encontrado no acervo.</p>';
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
            const novoCard = cardMolde.cloneNode(true);
            novoCard.removeAttribute('id');
            novoCard.style.display = 'flex'; // Usar 'flex' para manter a consistência com o CSS

            novoCard.querySelector('.card-img-top').src = livro.url_imagem || '../assets/img/default-book.png';
            novoCard.querySelector('.card-img-top').alt = `Capa de ${livro.titulo}`;
            novoCard.querySelector('.card-title').textContent = livro.titulo;
            novoCard.querySelector('.card-text').innerHTML = `
                ID: #${livro.id} <br>
                Autor: ${livro.autor} <br>
                Ano: ${livro.ano_publicacao || 'N/A'} <br>
                Quantidade Disponível: ${livro.quantidade_disponivel}
            `;
            
            const modalId = `modal-livro-${livro.id}`;
            novoCard.querySelector('.btn').setAttribute('data-bs-target', `#${modalId}`);
            
            listaLivros.appendChild(novoCard);
            document.body.insertAdjacentHTML('beforeend', criarModalHTML(livro, modalId));
        });

        slide.appendChild(listaLivros);
        carouselInner.appendChild(slide);
    }
}

async function carregarCatalogo() {
    try {
        const response = await fetch(API_ACERVO_URL);
        if (!response.ok) throw new Error('Erro ao buscar dados do acervo.');
        const todosOsLivros = await response.json();

        popularCarrossel('carouselExampleDark1', 'card-molde-favoritos', todosOsLivros);
        popularCarrossel('carouselNovidades', 'card-molde-novidades', todosOsLivros.slice().reverse());

    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
    }
}