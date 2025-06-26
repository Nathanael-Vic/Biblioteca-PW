# 📚 Biblioteca do Saber

Sistema de gerenciamento de biblioteca desenvolvido para fins educacionais, integrando uma API externa (Google Books) com um banco de dados local para controle de acervo e usuários.

## 📌 Objetivo

Criar uma aplicação web completa com frontend interativo e backend robusto para gerenciar uma biblioteca. O sistema deve permitir a busca de livros em uma API externa, a persistência desses dados em um banco MySQL, o cadastro de usuários e a exibição do acervo de forma dinâmica.

## 🛠️ Tecnologias Utilizadas

- **Back-end**: Node.js + Express.js
- **Banco de Dados**: MySQL 8.x
- **Conexão**: mysql2
- **Front-end**: HTML, CSS, JavaScript
- **Servidor de Desenvolvimento Front-end**: Vite
- **Segurança**: Hash seguro de senhas com bcrypt

## 🧱 Estrutura do Projeto

| Arquivo/Pasta | Descrição |
| :--- | :--- |
| **`BibliotecaPW-API/`** | **Pasta com todo o código do back-end (servidor e API).** |
| `server.js` | Controlador principal com as rotas Express da API. |
| `package.json` | Lista de dependências e scripts do back-end. |
| `.env` | Arquivo de configuração de ambiente (não versionado). |
| **`BibliotecaPW/`** | **Pasta com todo o código do front-end (o site).** |
| `leitor.html`, `index.html` | Arquivos HTML que compõem as páginas do site. |
| `package.json` | Lista de dependências e scripts do front-end (Vite). |
| **`assets/`** | **Pasta com arquivos estáticos do front-end (CSS, JS, imagens).** |

---

## 🔐 Funcionalidades Principais

### ⚙️ Gerenciamento do Sistema (Backend)
- Cadastro de usuários com senha criptografada.
- Busca de livros na API do Google Books.
- Persistência dos livros pesquisados no banco de dados local para criação de um acervo.
- API para servir os dados do acervo local para o frontend.

### 👤 Interação do Usuário (Frontend)
- Visualização dinâmica do catálogo de livros em carrosséis.
- Modais para exibição de detalhes de cada livro.
- (Futuro) Sistema de login e empréstimos.

## 🚀 Configuração e Execução

Siga os passos abaixo para rodar o projeto. É necessário ter o Node.js e o MySQL instalados na máquina.

### Passo 1: Configuração do Banco de Dados
Para a aplicação funcionar, ela precisa se conectar a um banco de dados MySQL.

#### Crie o Banco de Dados:
Abra o MySQL Workbench e execute o seguinte comando para criar o banco de dados vazio que será usado pela aplicação:
```bash
CREATE SCHEMA IF NOT EXISTS biblioteca_db;
```

### Passo 2: Configuração do Backend (API)
Navegue até a pasta do backend para instalar suas dependências e configurar o ambiente.

#### Instale as Dependências:
```bash
cd BibliotecaPW-API
npm install
```

#### Crie o Arquivo de Ambiente:
Dentro da pasta BibliotecaPW-API, crie um novo arquivo chamado .env. Este arquivo é crucial e deve conter as seguintes informações:

A sua chave da API do Google (GOOGLE_API_KEY).
As suas credenciais de conexão com o banco de dados MySQL (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).

### Passo 3: Configuração do Frontend
Em um novo terminal, navegue até a pasta do frontend para instalar suas dependências.
```bash
cd BibliotecaPW
npm install
```

### Passo 4: Executar a Aplicação
Para a aplicação funcionar, o backend e o frontend precisam rodar ao mesmo tempo, cada um em seu próprio terminal.

#### Terminal 1 - Rodando o Backend:
```bash
cd BibliotecaPW-API
npm run server
```

O servidor da API estará disponível em http://localhost:3000

#### Terminal 2 - Rodando o Frontend:
```bash
cd BibliotecaPW
npm run dev
```

O servidor do site estará disponível em um endereço como http://localhost:5173 (verifique a URL exata no seu terminal). É esta URL que você deve abrir no navegador.

## 👨‍💻 Desenvolvedores

Nathanael Victor Paiva Magno

