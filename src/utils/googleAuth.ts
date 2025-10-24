// Google OAuth usando Supabase Authentication
import { supabase } from './supabase/client';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Inicia sesión con Google usando Supabase OAuth
 * Esta función redirige al usuario a Google para completar la autenticación
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    // Usar Supabase para autenticación con Google
    // Esto redirigirá automáticamente al usuario a Google
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // La función termina aquí, el usuario será redirigido a Google
    // Cuando vuelva, checkGoogleAuthSession() detectará la sesión
  } catch (error) {
    console.error('Error en signInWithGoogle:', error);
    throw error;
  }
}

/**
 * Verifica si hay una sesión activa después de la redirección de OAuth
 * @returns Promise con la información del usuario o null
 */
export async function checkGoogleAuthSession(): Promise<GoogleUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return null;
    }

    const user = session.user;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
      picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    };
  } catch (error) {
    console.error('Error verificando sesión de Google:', error);
    return null;
  }
}

/**
 * Cierra la sesión de Google
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    throw error;
  }
}

/**
 * Escucha cambios en el estado de autenticación
 * @param callback Función que se ejecuta cuando cambia el estado
 */
export function onAuthStateChange(
  callback: (user: GoogleUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        callback({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
          picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    }
  );

  // Retornar función para cancelar la suscripción
  return () => {
    subscription.unsubscribe();
  };
}
