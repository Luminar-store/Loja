import { supabase } from '@/lib/supabase';

export const authService = {
  /**
   * signIn: Realiza o login utilizando email e senha (ex: admin).
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err: any) {
      console.error('Erro no login:', err.message);
      throw err;
    }
  },

  /**
   * signOut: Desconecta o usuário atual
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Erro no logout:', err.message);
      throw err;
    }
  },

  /**
   * getSession: Retorna a sessão ativa, se houver
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw new Error(error.message);
      }
      return data.session;
    } catch (err: any) {
      console.error('Erro ao recuperar sessão:', err.message);
      throw err;
    }
  },
};
