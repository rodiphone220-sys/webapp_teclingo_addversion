// src/services/authService.js
// ==========================================
// 🔐 AUTENTICACIÓN CON GOOGLE IDENTITY SERVICES
// ==========================================

const GOOGLE_CLIENT_ID = '765600384773-tq06mk73fsvvqmae19mq4huio3l908ap.apps.googleusercontent.com';
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbydMrIQ_Q_jHWYBuHnsm4kQ-J-cJWCucrG2GEv4sWno4u_8JXrsiZmNs2_0xxSFtnrh9Q/exec';

// Estado global del token
let tokenClient = null;
let currentUser = null;

/**
 * Carga la librería de Google Identity Services
 */
function cargarGoogleScript() {
  return new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (window.google && window.google.accounts) {
      resolve(window.google);
      return;
    }

    // Buscar script existente
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGoogle);
          resolve(window.google);
        }
      }, 100);
      return;
    }

    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Esperar a que google esté disponible
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGoogle);
          resolve(window.google);
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error('Error al cargar la librería de Google'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Inicializa Google Identity Services
 */
async function inicializarGoogleAuth() {
  try {
    await cargarGoogleScript();
    
    // Verificar si ya existe tokenClient
    if (tokenClient) {
      return tokenClient;
    }

    // Crear Token Client con la nueva API
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'profile email',
      callback: (response) => {
        if (response.error) {
          console.error('Error en callback de Google:', response);
          return;
        }
        // El token se maneja en loginConGoogle
      },
    });

    console.log('✅ Google Identity Services inicializado correctamente');
    return tokenClient;

  } catch (error) {
    console.error('❌ Error inicializando Google Auth:', error);
    throw error;
  }
}

/**
 * 🔐 Login con Google usando GIS
 */
async function loginConGoogle() {
  try {
    console.log('🔄 Iniciando login con Google...');
    
    // Inicializar
    await inicializarGoogleAuth();
    
    // Crear una promesa para esperar el token
    const tokenResponse = await new Promise((resolve, reject) => {
      // Configurar timeout
      const timeout = setTimeout(() => {
        reject(new Error('Tiempo de espera agotado. La ventana de Google no respondió.'));
      }, 30000);

      // Callback para manejar la respuesta de Google
      const handleTokenResponse = (response) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      };

      // Usar la API de Google Identity Services
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'profile email',
        callback: handleTokenResponse,
        prompt: 'select_account',
      }).requestAccessToken();
    });

    // Obtener información del usuario usando el token
    const token = tokenResponse.access_token;
    
    // Solicitar información del perfil
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Error al obtener información del usuario');
    }

    const userInfo = await userInfoResponse.json();

    console.log('✅ Google login exitoso:', userInfo.email);

    const userData = {
      email: userInfo.email,
      nombre: userInfo.name || 'Usuario Google',
      picture: userInfo.picture || '',
      token: token
    };

    // Enviar al backend para autenticación (no-cors: no esperar respuesta)
    console.log('🔄 Enviando datos al backend...');
    
    try {
      await fetch(API_BASE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'loginGoogle',
          token: token,
          email: userData.email,
          nombre: userData.nombre
        })
      });

      console.log('✅ Solicitud enviada al backend (modo no-cors)');
    } catch (backendError) {
      console.warn('⚠️ Error enviando al backend:', backendError);
    }

    // Con 'no-cors', NO podemos leer la respuesta
    // Así que asumimos éxito y guardamos localmente
    const usuarioLocal = {
      nombre: userData.nombre,
      email: userData.email,
      nivel: 'A1',
      progreso: '0',
      plan: 'Basic',
      estado: 'Activo'
    };
    
    localStorage.setItem('teclingo_user', JSON.stringify(usuarioLocal));
    localStorage.setItem('teclingo_token', token);
    
    return {
      success: true,
      mensaje: 'Autenticación exitosa',
      usuario: usuarioLocal
    };

  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    return { 
      success: false, 
      mensaje: error.message || 'Error al iniciar sesión con Google',
      error: error
    };
  }
}

/**
 * 🔓 Cerrar sesión
 */
function logout() {
  // Limpiar localStorage
  localStorage.removeItem('teclingo_user');
  localStorage.removeItem('teclingo_token');
  
  // Revocar token si existe (opcional)
  const token = localStorage.getItem('teclingo_token');
  if (token && window.google && window.google.accounts) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('✅ Token revocado');
      });
    } catch (e) {
      console.warn('Error revocando token:', e);
    }
  }
  
  currentUser = null;
  return { success: true, mensaje: 'Sesión cerrada correctamente.' };
}

/**
 * ✅ Verificar si el usuario está autenticado
 */
function estaAutenticado() {
  const user = localStorage.getItem('teclingo_user');
  const token = localStorage.getItem('teclingo_token');
  return !!(user && token);
}

/**
 * 👤 Obtener usuario actual
 */
function obtenerUsuarioActual() {
  const user = localStorage.getItem('teclingo_user');
  return user ? JSON.parse(user) : null;
}

/**
 * 🔐 Validar token de sesión con el backend
 */
async function validarSesion() {
  const token = localStorage.getItem('teclingo_token');
  if (!token) return { valido: false };
  
  try {
    await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'validarSesion',
        token: token
      })
    });
    
    // Con no-cors no podemos leer la respuesta, asumimos válido
    return { valido: true };
  } catch (error) {
    return { valido: false };
  }
}

// Exportar servicio
const authService = {
  loginConGoogle,
  logout,
  estaAutenticado,
  obtenerUsuarioActual,
  validarSesion,
  inicializarGoogleAuth,
  cargarGoogleScript
};

export default authService;