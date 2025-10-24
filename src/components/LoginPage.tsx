import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { signInWithGoogle, checkGoogleAuthSession } from '../utils/googleAuth';
import { supabase } from '../utils/supabase/client';
import { authAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface LoginPageProps {
  onLogin: (user: { id: string; email: string; name: string; role: 'admin' | 'ciudadano' }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingGoogleSession, setCheckingGoogleSession] = useState(true);

  // Verificar si hay una sesión de Google OAuth al cargar la página
  useEffect(() => {
    async function checkGoogleSession() {
      try {
        const googleUser = await checkGoogleAuthSession();
        
        if (googleUser) {
          setLoading(true);
          
          // Google OAuth users are auto-verified by Google
          // Create user with auto-confirmed email since Google already verified it
          try {
            // Try to login first
            const response = await authAPI.signin(googleUser.email, `google-oauth-${googleUser.id}`);
            localStorage.setItem('accessToken', response.accessToken);
            onLogin(response.user);
            toast.success(`Bienvenido de nuevo, ${response.user.name}`);
          } catch (loginError) {
            // User doesn't exist in our system, need to register
            // For Google OAuth users, we use their Google ID as part of password
            try {
              await authAPI.signup(googleUser.email, `google-oauth-${googleUser.id}`, googleUser.name);
              // Try login again
              const loginResponse = await authAPI.signin(googleUser.email, `google-oauth-${googleUser.id}`);
              localStorage.setItem('accessToken', loginResponse.accessToken);
              onLogin(loginResponse.user);
              toast.success(`Cuenta creada. ¡Bienvenido, ${googleUser.name}!`);
            } catch (signupError) {
              console.error('Error en registro con Google:', signupError);
              setError('Error al crear cuenta con Google. Por favor intenta de nuevo.');
            }
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error verificando sesión de Google:', error);
        setError('Error al verificar sesión de Google');
      } finally {
        setCheckingGoogleSession(false);
      }
    }
    
    checkGoogleSession();
  }, [onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase
      const response = await authAPI.signin(loginEmail, loginPassword);
      
      if (response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        onLogin(response.user);
        toast.success(`Bienvenido, ${response.user.name}`);
        setLoading(false);
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!registerName || !registerEmail || !registerPassword) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      if (registerPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      // Sign up with Supabase - Now requires email verification
      const response = await authAPI.signup(registerEmail, registerPassword, registerName);
      
      if (response.user) {
        // Show success message and switch to login
        setSuccessMessage('¡Cuenta creada exitosamente! Por favor revisa tu correo electrónico y haz clic en el enlace de verificación antes de iniciar sesión. Revisa también tu carpeta de spam.');
        toast.success('Cuenta creada. Por favor verifica tu correo electrónico.');
        
        // Clear form
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        
        // Switch to login after 3 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 5000);
        
        setLoading(false);
      } else {
        setError('Error al crear la cuenta. Por favor intenta de nuevo.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordMessage('');
    setLoading(true);
    
    if (!forgotEmail) {
      setForgotPasswordMessage('Por favor ingresa tu correo electrónico');
      setLoading(false);
      return;
    }

    try {
      // Use Supabase's built-in password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Error sending reset email:', error);
        // Don't reveal if email exists for security
        setForgotPasswordMessage('Si tu correo está registrado, recibirás un enlace de recuperación. Por favor revisa tu bandeja de entrada y spam.');
        toast.success('Solicitud procesada');
      } else {
        setForgotPasswordMessage('Te hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada y carpeta de spam.');
        toast.success('Correo enviado exitosamente');
      }
    } catch (error) {
      console.error('Error en forgot password:', error);
      setForgotPasswordMessage('Si tu correo está registrado, recibirás un enlace de recuperación.');
      toast.info('Solicitud procesada');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Iniciar el flujo de OAuth con Google usando Supabase
      await signInWithGoogle();
      
      // Nota: El resto del flujo se maneja en useEffect cuando la página recarga
      // después de la redirección de Google
      toast.info('Redirigiendo a Google...');
    } catch (error) {
      console.error('Error en Google OAuth:', error);
      setError('No se pudo iniciar sesión con Google. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica sesión de Google
  if (checkingGoogleSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-yellow-400 to-lime-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-4 border-white/50 backdrop-blur-sm bg-white/95">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Verificando sesión...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-yellow-400 to-lime-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="shadow-2xl border-4 border-white/50 backdrop-blur-sm bg-white/95">
          <CardContent className="p-8">
            {/* Logo Header - Ahora dentro del recuadro blanco */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 bg-clip-text text-transparent mb-2">
                Reporte de Buenaventura
              </h1>
              <p className="text-gray-600 text-sm md:text-base mb-6">
                Una plataforma de reportes ciudadanos
              </p>
            </div>

            {/* Tab-like header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl text-green-800 mb-2">
                {isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta'}
              </h2>
              <p className="text-sm text-gray-600">
                {isLogin 
                  ? 'Ingresa a tu cuenta para reportar' 
                  : 'Regístrate para empezar a reportar'}
              </p>
            </div>

            {isLogin ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-green-800">Correo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="nombre@ejemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-9 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-green-800">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-11 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white rounded-xl shadow-lg" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

                <div className="text-center pt-3 pb-2">
                  <button
                    type="button"
                    className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotEmail('');
                      setForgotPasswordMessage('');
                    }}
                  >
                    ¿Has olvidado la contraseña?
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-green-800">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Juan Pérez"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-9 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-green-800">Correo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="nombre@ejemplo.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-9 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-green-800">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <Input
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-9 pr-11 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="rounded-xl border-green-500 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 ml-2">{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white rounded-xl shadow-lg" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="my-8">
              <Separator className="bg-gray-200" />
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Conectando...' : 'Continuar con Google'}
            </Button>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                {isLogin ? '¿Eres nuevo?' : '¿Ya tienes cuenta?'}{' '}
              </p>
              <Button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white rounded-xl shadow-lg"
              >
                {isLogin ? 'Registrar' : 'Iniciar Sesión'}
              </Button>
            </div>

            {/* Admin Info */}
            {isLogin && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border-2 border-green-200">
                <p className="text-xs text-green-900 mb-2">🔑 Cuenta de prueba Admin:</p>
                <div className="space-y-1">
                  <p className="text-xs text-green-700">Email: admin@buenaventura.gov.co</p>
                  <p className="text-xs text-green-700">Contraseña: admin123</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-white/90 text-sm drop-shadow-md">
            © 2025 ZPservicioTecnico
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-3 h-3 text-white/80" />
              <a 
                href="mailto:johnvalenciazp@gmail.com" 
                className="text-white/90 text-xs drop-shadow-md hover:text-white transition-colors"
              >
                johnvalenciazp@gmail.com
              </a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-3 h-3 text-white/80" />
              <a 
                href="mailto:jhon.william.angulo@correounivalle.edu.co" 
                className="text-white/90 text-xs drop-shadow-md hover:text-white transition-colors"
              >
                jhon.william.angulo@correounivalle.edu.co
              </a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <a 
                href="https://wa.me/573106507940" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 text-xs drop-shadow-md hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-3 h-3 text-white/80" />
              <a 
                href="tel:+573106507940" 
                className="text-white/90 text-xs drop-shadow-md hover:text-white transition-colors"
              >
                +57 3106507940
              </a>
            </div>
          </div>
          <p className="text-white/90 text-sm drop-shadow-md pt-2">
            Desarrollado con un ❤️ para Buenaventura
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-800">Recuperar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electrónico para recibir un enlace de recuperación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-green-800">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                <Input
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-9 h-12 border-2 border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
            </div>

            {forgotPasswordMessage && (
              <Alert className={
                forgotPasswordMessage.includes('no registrado') 
                  ? "border-yellow-500 bg-yellow-50" 
                  : forgotPasswordMessage.includes('✅')
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }>
                <AlertDescription className="text-sm">{forgotPasswordMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-600 hover:to-yellow-500 text-white rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Enlace'
                )}
              </Button>

              {forgotPasswordMessage.includes('no registrado') && (
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setIsLogin(false);
                    setRegisterEmail(forgotEmail);
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-green-200 hover:bg-green-50 text-green-700 rounded-xl"
                >
                  Registrar Usuario
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
