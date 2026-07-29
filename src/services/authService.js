// authService.js
// Implementação Mock usando localStorage para testes imediatos.
// Para usar Firebase real, basta substituir as funções abaixo pelas chamadas do Firebase Auth.

const USERS_KEY = 'site_tur_users';
const CURRENT_USER_KEY = 'site_tur_current_user';

// Usuário mockado padrão – é inserido no localStorage se ainda não existir
const MOCK_USER = {
  id: 'mock-001',
  name: 'Lucas Ferreira',
  email: 'lucas.ferreira@rotavis.com',
  password: 'senha_segura',
  age: '32',
  state: 'SP',
  savedRoutes: [
    { id: 1, name: 'Cataratas + Parque das Aves', date: '2026-07-15' },
    { id: 2, name: 'Marco das Três Fronteiras', date: '2026-07-20' },
    { id: 3, name: 'Itaipu Binacional – Tour Panorâmico', date: '2026-07-25' },
  ],
};

// Garante que o usuário mock exista no "banco"
const seedMockUser = () => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (!users.find((u) => u.email === MOCK_USER.email)) {
    users.push({ ...MOCK_USER });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};
seedMockUser();

// Extrai apenas os dados públicos (sem senha)
const publicData = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  age: user.age || '',
  state: user.state || '',
  savedRoutes: user.savedRoutes || [],
});

export const authService = {
  // Simula registro
  register: async (name, email, password, extraFields = {}) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        if (users.find((u) => u.email === email)) {
          reject(new Error('Este email já está cadastrado.'));
          return;
        }

        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password,
          age: extraFields.age || '',
          state: extraFields.state || '',
          savedRoutes: [],
        };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto login após registro
        const userData = publicData(newUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        resolve(userData);
      }, 800);
    });
  },

  // Simula login
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          reject(new Error('Email ou senha inválidos.'));
          return;
        }

        const userData = publicData(user);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        resolve(userData);
      }, 800);
    });
  },

  // Simula logout
  logout: async () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    return Promise.resolve();
  },

  // Busca usuário atual
  getCurrentUser: () => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Atualiza perfil do usuário (nome, idade, estado)
  updateProfile: async (userId, updates) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const idx = users.findIndex((u) => u.id === userId);

        if (idx === -1) {
          reject(new Error('Usuário não encontrado.'));
          return;
        }

        // Atualiza somente campos permitidos
        if (updates.name !== undefined) users[idx].name = updates.name;
        if (updates.age !== undefined) users[idx].age = updates.age;
        if (updates.state !== undefined) users[idx].state = updates.state;
        if (updates.savedRoutes !== undefined) users[idx].savedRoutes = updates.savedRoutes;

        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        const userData = publicData(users[idx]);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        resolve(userData);
      }, 500);
    });
  },

  // Credenciais mockadas para preencher o login
  getMockCredentials: () => ({
    email: MOCK_USER.email,
    password: MOCK_USER.password,
  }),
};
