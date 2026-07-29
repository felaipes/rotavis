import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, extraFields = {}) => {
    const userData = await authService.register(name, email, password, extraFields);
    setUser(userData);
    return userData;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Nenhum usuário logado.');
    const updatedUser = await authService.updateProfile(user.id, updates);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
