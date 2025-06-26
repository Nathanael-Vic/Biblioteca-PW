const API_LOGIN_URL = 'http://localhost:3000/api/login';
const API_REGISTER_URL = 'http://localhost:3000/api/register';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(event) {
    event.preventDefault(); 
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const response = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensagem);
        }
        
        // --- ALTERAÇÃO PRINCIPAL AQUI ---
        // 1. Avisa sobre o sucesso
        alert(data.mensagem); 

        // 2. Salva o objeto do usuário no sessionStorage (convertido para texto JSON)
        sessionStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));

        // 3. Redireciona para a página correta baseada no perfil
        if (data.usuario.perfil === 'leitor') {
            window.location.href = 'leitor.html';
        } else if (data.usuario.perfil === 'bibliotecario') {
            window.location.href = 'bibliotecario.html';
        }

    } catch (error) {
        console.error('Erro no login:', error);
        alert(`Erro no login: ${error.message}`);
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const nome = document.getElementById('register-nome').value;
    const email = document.getElementById('register-email').value;
    const senha = document.getElementById('register-senha').value;
    const confirmarSenha = document.getElementById('register-confirmar-senha').value; // Pega o valor da confirmação
    const perfil = document.getElementById('register-perfil').value;

    // --- NOVA VALIDAÇÃO ---
    // Verifica se as senhas coincidem antes de enviar
    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem. Por favor, tente novamente.');
        return; // Para a execução
    }

    if (!perfil) {
        alert('Por favor, selecione um perfil.');
        return;
    }

    try {
        const response = await fetch(API_REGISTER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, perfil })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensagem);
        }

        alert(data.mensagem); // "Usuário registrado com sucesso!"
        window.location.href = 'login.html'; // Redireciona para a página de login

    } catch (error) {
        console.error('Erro no registro:', error);
        alert(`Erro no registro: ${error.message}`);
    }
}