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
        
        alert(data.mensagem); 

        sessionStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));

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
    const confirmarSenha = document.getElementById('register-confirmar-senha').value;
    const perfil = document.getElementById('register-perfil').value;

    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem. Por favor, tente novamente.');
        return; 
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

        alert(data.mensagem); 
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Erro no registro:', error);
        alert(`Erro no registro: ${error.message}`);
    }
}