// authService.js
// Implementação Mock usando localStorage para testes imediatos.
// Para usar Firebase real, basta substituir as funções abaixo pelas chamadas do Firebase Auth.

const USERS_KEY = 'site_tur_users';
const CURRENT_USER_KEY = 'site_tur_current_user';

export const authService = {
  // Simula registro
  register: async (name, email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        if (users.find(u => u.email === email)) {
          reject(new Error('Este email já está cadastrado.'));
          return;
        }

        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Auto login após registro
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }));
        resolve(newUser);
      }, 800);
    });
  },

  // Simula login
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          reject(new Error('Email ou senha inválidos.'));
          return;
        }

        const userData = { id: user.id, name: user.name, email: user.email };
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
  }
};
