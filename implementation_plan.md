# Implementação de Autenticação e Perfil de Usuário

Este plano detalha a criação de um perfil interativo, a inserção de um usuário mockado para facilitar os testes de login e a finalização do fluxo de cadastro.

## Perguntas em Aberto

> [!IMPORTANT]  
> Você gostaria que o e-mail e senha mockados já viessem preenchidos automaticamente na tela de Login para facilitar os testes, ou apenas que eles existam no banco "mockado" (localStorage)?

> [!NOTE]  
> Na página de perfil, além de nome, e-mail e senha, gostaria de exibir algum outro dado, como "Rotas Salvas" (mesmo que com dados falsos inicialmente)?

## Mudanças Propostas

### 1. Serviço de Autenticação (`src/services/authService.js`)
Vamos adicionar um usuário inicial padrão (mock) para que sempre seja possível testar o login sem precisar criar uma conta antes.
- **Usuário Mockado Sugerido:** 
  - Email: `teste@rotavis.com`
  - Senha: `123456`
  - Nome: `Usuário Teste`

### 2. Tela de Perfil (`src/pages/Profile.jsx`)
Criação de uma nova página seguindo a estética *glassmorphism* (liquid-glass) do site.
- Exibição de Nome, Email e Senha (com botão de olhinho para revelar/ocultar a senha).
- Opção de editar o nome (mockado no localStorage).
- Botão para Sair (Logout).

#### [NEW] src/pages/Profile.jsx

### 3. Ajustes de Navegação e Rotas
Atualizaremos o cabeçalho (Header) e as rotas principais.

#### [MODIFY] src/App.jsx
- Adicionar a rota `/perfil` apontando para o componente `Profile`.
- No Header, quando o usuário estiver logado, transformar o ícone do usuário em um link/menu que leva para a página de Perfil, ao invés de apenas mostrar o nome e o botão de sair.

### 4. Melhorias no Cadastro e Login
- **Cadastro (`src/pages/Register.jsx`)**: Já existe uma lógica funcional gravando no `localStorage`. Vamos garantir que o redirecionamento pós-cadastro seja fluido e dar feedback visual de sucesso.
- **Login (`src/pages/Login.jsx`)**: Caso aprovado, podemos preencher automaticamente os dados do usuário mockado (ou adicionar um botão "Entrar como Mock") para agilizar a apresentação.

## Plano de Validação

### Testes Manuais
- Acessar a tela de login, testar o usuário mockado e validar o redirecionamento.
- Clicar no menu superior e acessar o "Meu Perfil".
- Alterar visibilidade da senha no perfil.
- Realizar o processo de cadastro de um novo usuário para validar se o fluxo de criação está perfeito.
