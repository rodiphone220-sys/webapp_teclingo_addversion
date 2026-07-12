import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import authService from "../services/authService";

interface LoginProps {
  onLoginSuccess: (userData: { name: string; email: string; role: string }) => void;
  language: "es" | "en";
  theme: "light" | "dark";
}

export default function Login({ onLoginSuccess, language, theme }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  
  // Passcode States
  const [showDemoInput, setShowDemoInput] = useState(false);
  const [demoPasscode, setDemoPasscode] = useState("");
  
  // Feedback States
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Google Auth States
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Inicializar Google Auth al montar el componente
  useEffect(() => {
    authService.inicializarGoogleAuth().catch(console.warn);
  }, []);

  const showMessage = (text: string, type: "success" | "error" = "error") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showMessage(
        language === "es" ? "❌ Ingresa correo y contraseña." : "❌ Enter email and password.",
        "error"
      );
      return;
    }

    try {
      const storedUsersRaw = localStorage.getItem("teclingo_users");
      const users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const user = users.find((u: any) => u.email === loginEmail && u.password === loginPassword);

      if (!user) {
        showMessage(
          language === "es" ? "❌ Correo o contraseña incorrectos." : "❌ Incorrect email or password.",
          "error"
        );
        return;
      }

      showMessage(
        language === "es" ? "✅ ¡Bienvenido! Iniciando sesión..." : "✅ Welcome! Signing in...",
        "success"
      );
      setTimeout(() => {
        onLoginSuccess({ name: user.name, email: user.email, role: "user" });
      }, 1000);
    } catch (err) {
      console.error(err);
      showMessage("Error", "error");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      showMessage(
        language === "es" ? "❌ Todos los campos son obligatorios." : "❌ All fields are required.",
        "error"
      );
      return;
    }
    if (regPassword !== regConfirm) {
      showMessage(
        language === "es" ? "❌ Las contraseñas no coinciden." : "❌ Passwords do not match.",
        "error"
      );
      return;
    }
    if (regPassword.length < 6) {
      showMessage(
        language === "es" ? "❌ Mínimo 6 caracteres." : "❌ Minimum 6 characters.",
        "error"
      );
      return;
    }

    try {
      const storedUsersRaw = localStorage.getItem("teclingo_users");
      const users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      if (users.some((u: any) => u.email === regEmail)) {
        showMessage(
          language === "es" ? "❌ Este correo ya está registrado." : "❌ This email is already registered.",
          "error"
        );
        return;
      }

      const newUser = { name: regName, email: regEmail, password: regPassword };
      users.push(newUser);
      localStorage.setItem("teclingo_users", JSON.stringify(users));

      showMessage(
        language === "es" ? "✅ Cuenta creada exitosamente. ¡Inicia sesión!" : "✅ Account created successfully. Sign in!",
        "success"
      );
      
      // Clear values and redirect to login tab
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");
      setTimeout(() => {
        setActiveTab("login");
      }, 1200);
    } catch (err) {
      console.error(err);
      showMessage("Error", "error");
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const resultado = await authService.loginConGoogle();
      if (resultado.success) {
        onLoginSuccess({
          name: resultado.usuario.nombre,
          email: resultado.usuario.email,
          role: 'google'
        });
      } else {
        showMessage(
          language === 'es' 
            ? '❌ Error al iniciar sesión con Google: ' + resultado.mensaje
            : '❌ Google login error: ' + resultado.mensaje,
          'error'
        );
      }
    } catch (error: any) {
      showMessage(
        language === 'es' 
          ? '❌ Error al iniciar sesión con Google'
          : '❌ Google login error',
        'error'
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = demoPasscode.trim();
    if (!code) {
      showMessage(
        language === "es" ? "❌ Ingresa un passcode." : "❌ Enter a passcode.",
        "error"
      );
      return;
    }

    if (code === "passcode2026") {
      showMessage(
        language === "es" ? "✅ Passcode Master correcto. Bienvenido." : "✅ Master Passcode correct. Welcome.",
        "success"
      );
      setTimeout(() => {
        onLoginSuccess({ name: "Demo Master", email: "demo@tecling.com", role: "demo_master" });
      }, 1000);
    } else if (code === "demo123" || code === "cliente456") {
      showMessage(
        language === "es" ? "✅ Passcode Demo válido. Bienvenido." : "✅ Demo Passcode valid. Welcome.",
        "success"
      );
      setTimeout(() => {
        onLoginSuccess({ name: "Teclingo Guest", email: "guest@tecling.com", role: "demo" });
      }, 1000);
    } else {
      showMessage(
        language === "es" ? "❌ Passcode inválido." : "❌ Invalid passcode.",
        "error"
      );
      setDemoPasscode("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBFD] dark:bg-[#0f1013] transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#15161a] border border-gray-150/80 dark:border-gray-800/80 rounded-[32px] shadow-2xl p-8 md:p-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-tr from-[#0058bc] to-cyan-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="text-[#0058bc] shrink-0 animate-pulse" size={24} />
            TECLINGO AI
          </h1>
          <p className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-wider mt-2">
            {language === "es" ? "Inmersión lingüística con IA" : "AI Linguistic Immersion"}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-50 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8">
          <button
            onClick={() => {
              setActiveTab("login");
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-white dark:bg-[#15161a] text-[#0058bc] dark:text-blue-400 shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogIn size={14} />
              {language === "es" ? "Iniciar Sesión" : "Sign In"}
            </span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("register");
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-white dark:bg-[#15161a] text-[#0058bc] dark:text-blue-400 shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <UserPlus size={14} />
              {language === "es" ? "Registrarse" : "Sign Up"}
            </span>
          </button>
        </div>

        {/* Feedback messages */}
        {feedback && (
          <div 
            className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-bounce ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30"
                : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/30 dark:border-rose-900/30"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Correo electrónico" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Contraseña" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-tr from-[#0058bc] to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer mt-2"
            >
              {language === "es" ? "Iniciar Sesión" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Nombre Completo" : "Full Name"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Ana Pérez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Correo electrónico" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Contraseña" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                {language === "es" ? "Confirmar Contraseña" : "Confirm Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800/80 rounded-2xl text-sm font-semibold outline-hidden focus:border-[#0058bc] dark:focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-tr from-[#0058bc] to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer mt-2"
            >
              {language === "es" ? "Crear Cuenta" : "Create Account"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-gray-150 dark:border-gray-800"></span>
          <span className="relative bg-white dark:bg-[#15161a] px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {language === "es" ? "o continúa con" : "or continue with"}
          </span>
        </div>

        {/* Third-Party Logins */}
        <div className="space-y-3">
          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3 border border-gray-150 dark:border-gray-800 bg-white hover:bg-gray-50 dark:bg-[#15161a] dark:hover:bg-gray-800/40 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
          >
            {loadingGoogle ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0058bc] rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            {loadingGoogle 
              ? (language === "es" ? "Verificando..." : "Verifying...")
              : (language === "es" ? "Continuar con Google" : "Continue with Google")}
          </button>

          {/* Demo passcode option */}
          <div className="pt-2">
            {!showDemoInput ? (
              <button
                onClick={() => setShowDemoInput(true)}
                className="w-full py-2.5 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 text-[#0058bc] dark:text-blue-400 border border-dashed border-blue-200/50 dark:border-blue-900/40 rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound size={13} />
                {language === "es" ? "Acceso Demo (Passcode)" : "Demo Access (Passcode)"}
              </button>
            ) : (
              <form onSubmit={handleDemoLogin} className="flex gap-2 animate-fadeIn">
                <input
                  type="password"
                  required
                  placeholder={language === "es" ? "Escribe tu passcode..." : "Enter passcode..."}
                  value={demoPasscode}
                  onChange={(e) => setDemoPasscode(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold outline-hidden focus:border-[#0058bc] transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0058bc] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {language === "es" ? "Entrar" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoInput(false);
                    setDemoPasscode("");
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
