import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Settings, 
  ArrowRight, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Compass, 
  Sparkles,
  Info,
  CheckCircle2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sliders,
  Clock,
  Mic,
  Sun,
  Moon,
  LogOut,
  Flame,
  X,
  Shield,
  Lock,
  HelpCircle,
  ChevronDown,
  Menu,
  Brain,
  LockOpen,
  Database,
  Plus,
  Trash,
  Save,
  Key,
  Unlock,
  AlertTriangle,
  Megaphone
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

// Import modular lab screens
import PronunciationLab from "./components/PronunciationLab";
import ListeningLab from "./components/ListeningLab";
import SafeZoneChat from "./components/SafeZoneChat";
import AITutor from "./components/AITutor";
import TOEFLSimulator from "./components/TOEFLSimulator";
import GrammarLab from "./components/GrammarLab";
import ReadingLab from "./components/ReadingLab";
import VocabularyCenter from "./components/VocabularyCenter";
import Login from "./components/Login";

// Import core tabs
import ProgressPanel from "./components/ProgressPanel";
import LibraryPanel from "./components/LibraryPanel";
import PremiumPanel from "./components/PremiumPanel";
import SettingsPanel from "./components/SettingsPanel";
import DynamicCarousel from "./components/DynamicCarousel";
import ChatTutor from "./components/ChatTutor";
import ActionStack from "./components/ActionStack";

interface SavedVocab {
  term: string;
  definition: string;
  example: string;
}

interface UserStats {
  streak: number;
  lastActiveDate: string;
  totalPractices: number;
  savedWords: SavedVocab[];
  grammarChecks: number;
  weeklyActivity: { [key: string]: number };
  toeflScores: { [key: string]: number };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "labs" | "progress" | "library" | "premium" | "settings">("dashboard");
  const [currentLab, setCurrentLab] = useState<null | "pronunciation" | "listening" | "chat" | "tutor" | "toefl" | "grammar" | "reading" | "vocabulary">(null);

  // Language state (default to Spanish)
  const [language, setLanguage] = useState<"es" | "en">("es");

  // Theme state: "light" or "dark" (defaults to light if not stored, otherwise checks system preference)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Popup state for Terms, Privacy, Support, and Summer Course
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "support" | "summer" | "secret" | "notifications" | null>(null);

  // Secret portal security and navigation states
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [secretPasscodeAttempt, setSecretPasscodeAttempt] = useState("");
  const [secretPasscodeError, setSecretPasscodeError] = useState(false);
  const [activeSecretTab, setActiveSecretTab] = useState<"assistant" | "course" | "tools" | "system" | "messages" | "knowledge">("assistant");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<"architecture" | "backend" | "frontend" | "deploy">("architecture");

  // Pre-populated default database values for developer settings
  const [kbDatabase, setKbDatabase] = useState<{ id: string; question: string; answer: string }[]>(() => {
    const raw = localStorage.getItem("teclingo_secret_kb_db");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      { id: "1", question: "Alineación TecNM", answer: "Teclingo AI se alinea al programa oficial del TecNM, cubriendo el vocabulario de ingeniería para Sistemas, Industrial, Mecatrónica y Administración." },
      { id: "2", question: "Beca de Estudios de Conceptos AI MX", answer: "Los estudiantes de universidades públicas reciben una beca automática del 50% en suscripciones bilingües. Contacta a becas@conceptosai.mx." },
      { id: "3", question: "Certificado en Blockchain", answer: "Al concluir los 12 niveles, se emite un certificado digital oficial respaldado por un contrato inteligente en la red Ethereum para su validación." }
    ];
  });

  const [behaviorSettings, setBehaviorSettings] = useState(() => {
    const raw = localStorage.getItem("teclingo_secret_behavior");
    let parsed = {
      systemInstruction: "You are Teclingo's Public Support AI Assistant created by Conceptos AI MX.\nRespond in a warm, polite, and professional bilingüe manner (mostly Spanish). Highlight our 12 levels, TOEFL simulators, and Blockchain certification.",
      tone: "bilingue_empatico",
      temperature: 0.7,
      appMasterInfo: "Teclingo es la plataforma líder de aprendizaje de inglés técnico para ingenieros en México, creada por Conceptos AI MX.\n\nDetalles Clave de la Plataforma:\n1. Alineación Curricular: Diseñado específicamente para alinearse con el programa oficial del TecNM (Tecnológico Nacional de México), cubriendo el vocabulario de ingeniería para Sistemas, Industrial, Mecatrónica y Administración.\n2. Estructura Educativa: Ofrece 12 niveles de aprendizaje continuo basados en el Marco Común Europeo de Referencia (MCER - B1/B2).\n3. Laboratorios con Inteligencia Artificial:\n   - AI Pronunciation Lab: Evaluación y corrección interactiva de acento con soporte fonético e IPA (Alfabeto Fonético Internacional) en tiempo real.\n   - AI Listening Lab: Conversaciones de ingeniería realistas y audios dinámicos con quizzes automatizados.\n   - SafeZone Chat: Un entorno privado de conversación con Motor de Auditoría que detecta errores y te guía de manera empática.\n   - TOEFL Simulator: Simulador completo con rúbricas de evaluación calibradas y feedback técnico instantáneo.\n4. Certificación Blockchain: Certificado digital verificado y guardado en un contrato inteligente sobre la red Ethereum para máxima autenticidad corporativa.\n5. Beneficios Sociales: Beca automática del 50% en suscripciones para todos los estudiantes de universidades públicas en México enviando su solicitud a becas@conceptosai.mx."
    };
    if (raw) {
      try {
        const loaded = JSON.parse(raw);
        parsed = { ...parsed, ...loaded };
      } catch (e) {}
    }
    return parsed;
  });

  const [courseDB, setCourseDB] = useState<{ id: string; level: string; topic: string; desc: string; duration: string }[]>(() => {
    const raw = localStorage.getItem("teclingo_secret_course_db");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      { id: "1", level: "A1 (Básico)", topic: "Presentaciones e Ingeniería de Campo", desc: "Vocabulario básico, estructuras simples, saludar a otros ingenieros y describir componentes físicos en el taller.", duration: "20 Horas" },
      { id: "2", level: "A2 (Pre-Intermedio)", topic: "Sistemas de Automatización y Reportes", desc: "Redacción de reportes simples de fallas técnicas, procesos automatizados, y operaciones lógicas.", duration: "24 Horas" },
      { id: "3", level: "B1 (Intermedio)", topic: "Gestión de Proyectos de Software y SCRUM", desc: "Conversaciones sobre metodologías ágiles, sprints, requerimientos de software y arquitectura del sistema.", duration: "30 Horas" },
      { id: "4", level: "B2 (Intermedio Alto)", topic: "Defensa de Patentes y Artículos Científicos", desc: "Comprensión de patentes avanzadas, redacción de abstracts científicos y justificación teórica de hipótesis.", duration: "35 Horas" }
    ];
  });

  const [toolsSettings, setToolsSettings] = useState(() => {
    const raw = localStorage.getItem("teclingo_secret_tool_settings");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return {
      pronunciation: { difficulty: "medium", maxAttempts: 5, model: "Whisper-v3" },
      listening: { speed: "1.0x", accent: "american", backgroundNoise: "none" },
      chat: { grammarCorrection: "immediate", subjectItAudit: true, focusArea: "technical_dialogs" },
      tutor: { method: "socratic", speed: "normal", maxDailyPrompts: 100 },
      toefl: { testSection: "all", timerLimit: 45, maxAttempts: 3 },
      grammar: { provider: "Gemini 1.5 Pro", strictness: "high", fallbackEnabled: true },
      reading: { passageDensity: "medium", category: "technology", questionCount: 5 },
      vocabulary: { method: "flashcards", dailyWordsTarget: 10, repeatMultiplier: 1.5 }
    };
  });

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem("teclingo_secret_kb_db", JSON.stringify(kbDatabase));
  }, [kbDatabase]);

  useEffect(() => {
    localStorage.setItem("teclingo_secret_behavior", JSON.stringify(behaviorSettings));
  }, [behaviorSettings]);

  useEffect(() => {
    localStorage.setItem("teclingo_secret_course_db", JSON.stringify(courseDB));
  }, [courseDB]);

  useEffect(() => {
    localStorage.setItem("teclingo_secret_tool_settings", JSON.stringify(toolsSettings));
  }, [toolsSettings]);

  // Notifications State and synchronization
  const [notifications, setNotifications] = useState<{ id: string; title: string; content: string; date: string; type: "info" | "success" | "warning" | "update"; active: boolean }[]>(() => {
    const raw = localStorage.getItem("teclingo_notifications");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      { id: "1", title: "¡Bienvenidos a Teclingo 2.0!", content: "Explora los nuevos laboratorios de Pronunciación 3D, Listening de Ingeniería y nuestro Simulador TOEFL adaptativo calibrado.", date: "2026-07-12", type: "success", active: true },
      { id: "2", title: "Becas de Conceptos AI MX", content: "Los estudiantes de universidades públicas en México reciben una beca automática del 50% en suscripciones bilingües. Contacta a becas@conceptosai.mx para postularte.", date: "2026-07-11", type: "info", active: true },
      { id: "3", title: "Actualización de Motor AI", content: "Hemos integrado Gemini 3.5 Flash en todos los laboratorios para darte feedback instantáneo y corrección de gramática más veloz.", date: "2026-07-10", type: "update", active: true }
    ];
  });

  const [lastCheckedNotifications, setLastCheckedNotifications] = useState<string>(() => {
    return localStorage.getItem("teclingo_last_checked_notifications") || "2026-01-01T00:00:00.000Z";
  });

  useEffect(() => {
    localStorage.setItem("teclingo_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("teclingo_last_checked_notifications", lastCheckedNotifications);
  }, [lastCheckedNotifications]);

  const [notiForm, setNotiForm] = useState<{ id: string; title: string; content: string; type: "info" | "success" | "warning" | "update"; date: string; active: boolean }>({
    id: "",
    title: "",
    content: "",
    type: "update",
    date: new Date().toISOString().slice(0, 10),
    active: true
  });

  // Mobile navigation drawer open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Durable State synced with localStorage
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 5,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    totalPractices: 14,
    savedWords: [],
    grammarChecks: 0,
    weeklyActivity: { Mon: 2, Tue: 4, Wed: 1, Thu: 5, Fri: 3, Sat: 2, Sun: 3 },
    toeflScores: {}
  });

  // Load from localStorage on mount (including theme & user session)
  useEffect(() => {
    try {
      const sessionUser = localStorage.getItem("teclingo_user");
      if (sessionUser) {
        const parsedUser = JSON.parse(sessionUser);
        setCurrentUser(parsedUser);
        
        // Load their specific user statistics
        const statsKey = `teclingo_user_${parsedUser.email}_stats`;
        const storedStats = localStorage.getItem(statsKey);
        if (storedStats) {
          setUserStats(JSON.parse(storedStats));
        } else {
          // Initialize stats with template defaults
          const initialStats: UserStats = {
            streak: 5,
            lastActiveDate: new Date().toISOString().slice(0, 10),
            totalPractices: 14,
            savedWords: [],
            grammarChecks: 0,
            weeklyActivity: { Mon: 2, Tue: 4, Wed: 1, Thu: 5, Fri: 3, Sat: 2, Sun: 3 },
            toeflScores: {}
          };
          localStorage.setItem(statsKey, JSON.stringify(initialStats));
          setUserStats(initialStats);
        }
      }

      const storedTheme = localStorage.getItem("teclingo_theme") as "light" | "dark" | null;
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(systemPrefersDark ? "dark" : "light");
      }
    } catch (e) {
      console.error("Failed to load local state", e);
    }
  }, []);

  // Update root element classes when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("teclingo_theme", theme);
    } catch (e) {
      console.error("Failed to save theme state", e);
    }
  }, [theme]);

  // Save helper
  const saveStats = (newStats: UserStats) => {
    setUserStats(newStats);
    if (currentUser) {
      const statsKey = `teclingo_user_${(currentUser as any).email}_stats`;
      localStorage.setItem(statsKey, JSON.stringify(newStats));
    }
  };

  // Sync helpers
  const handleSaveVocabulary = (term: string, definition: string, example: string) => {
    const updatedWords = [...userStats.savedWords];
    if (!updatedWords.some(v => v.term === term)) {
      updatedWords.push({ term, definition, example });
      const newStats = { ...userStats, savedWords: updatedWords };
      saveStats(newStats);
    }
  };

  const handleRemoveVocabulary = (term: string) => {
    const updatedWords = userStats.savedWords.filter(v => v.term !== term);
    const newStats = { ...userStats, savedWords: updatedWords };
    saveStats(newStats);
  };

  const handleLogTOEFLScore = (score: number, section: string) => {
    const updatedScores = { ...userStats.toeflScores, [section]: score };
    const newStats = { ...userStats, toeflScores: updatedScores };
    saveStats(newStats);
  };

  const handleLogGrammarAccuracy = (errorsCount: number) => {
    const newCount = (userStats.grammarChecks || 0) + 1;
    const newStats = { ...userStats, grammarChecks: newCount };
    saveStats(newStats);
  };

  // 8 Lab cards metadata matching the design guidelines exactly
  const CARDS = [
    {
      id: "pronunciation",
      title: "AI Pronunciation Lab",
      desc: language === "es" ? "Perfecciona tu acento y pronunciación con IA" : "Perfect your accent and pronunciation with AI",
      bgClass: "bg-[#E8F1FF]",
      borderClass: "border-[#E8F1FF]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCb6Z_d0w2lE5VIzaIzs3_tXsrvBab3waMXEwZ7-DzQGoYoDY3nsLxAUK-e0sTdCRQXPWFd14hFkRxjQPYSeq4BpEUZlybiRndeNA2CMYWoRa1_vPCGeDn6Fbh7QJF3cQmvj6RGJoCX_iVQfyI8axzkXQ72YiPuv3qUIeWNTcILMN5THT-bmQfKT8WcvE-V626u0_XRaDDiLzvoxL6oK5rhUwKmWgODVnch41E7kXWpqnDP25ODxT9zzoMRxLfTPZ8k1Q4DBwBoj_k"
    },
    {
      id: "listening",
      title: "AI Listening Lab",
      desc: language === "es" ? "Entrena tu oído con situaciones reales" : "Train your listening ear with real situations",
      bgClass: "bg-[#F3EFFF]",
      borderClass: "border-[#F3EFFF]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5_Di8cj8qA-Fag-Z5TSk4Y23h5nEMSyDUNMu4mCWoIabp4K6_Uv2V_YjRJoIA1L8gN4S3_4-7Np7dlYDXWV_3R_mf4yb7jBIo4rTNBX-Q3tORro1E7DNZPsiIL7KaBPm-xAZRs7u9swsGslkB9XOmuxT_8YGi71cJW_3-8euOtoZV88TS5DI40he_N6HMUIVIgidbf92Ryyw-f4gcYbbccHQv6GApr4-aPzM-zOcZ4d9TSm3ZTxilsvaxv0GdlZh7zLcienRqCXA"
    },
    {
      id: "chat",
      title: "SafeZone Chat",
      desc: language === "es" ? "Conversa en un entorno seguro y privado" : "Chat in a secure and private AI environment",
      bgClass: "bg-[#E1F9F7]",
      borderClass: "border-[#E1F9F7]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMd8pf1MRokhv9ttUGAcxYgFrFhulCMsYYqlPSuIBLfwxOjaw12_hvt4t7YV60NB7VlOgdPYnBmcKBkOzVnw3uFhO0UfDWhG-Vo5UZMnwJ_8UOCrw-sGwY3WFuV6tQR9ke4iKKL1NiypY4Jjrm1ijIsWBEW83lq8VEMF4eTndlD4SinYuBC90LEvxh5paNtbBuEd0IgZmMzknWaSL3AuE9rh2Nu-5vaMk9RpxV9G_L31mauI0wpkn01FAxxjhsziHcavTLk0btigo"
    },
    {
      id: "tutor",
      title: "AI Tutor",
      desc: language === "es" ? "Tu profesor personal disponible 24/7" : "Your personal AI professor available 24/7",
      bgClass: "bg-[#F5F5F7]",
      borderClass: "border-gray-200/40",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjcGBhnAytyblJdeQJfZ0832VcvVzSIaUXrjX2pSdG_9ypws2IYEaU7T5jtJm7MyWTaQzc2iE_pZTOgm8phcQ-M6Lt-sFBo3O7tJdI3y6RulYQI6IGNlLgg4W7TXC3JXnDyMXTXhnY5bGH40TFyNIEUcVkiqFcgECKIMZrAoEpmeD8XsGqBNrr10xZVMCa8z4-g6IDCToDhFdavGIWZgRImXnr_XwhpADDQz4BZ1rzuORJdUqxWDFUE7ynDn3oh0hB2caDpmqpCbU"
    },
    {
      id: "toefl",
      title: "TOEFL Simulator",
      desc: language === "es" ? "Simula el examen oficial con resultados reales" : "Simulate the official exam with realistic scores",
      bgClass: "bg-[#001E41]/10",
      borderClass: "border-[#001E41]/20",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWG8AE4uZY286OUl9yOBa2yBbCn0t_EdWxuW0bF5Xs1C2NvfKw7Kn5re2eIZ43uQpS07GJjjqOe6hDdPA86_WNBbeGYr9Eg7YHmLct5WHkXKNKhkSN2tcWwsJS1z3PAu351nAI2_ni-WFogqHwhP9qItg1pZRUypbAfr77jYeoF1-aj_zrcNxVhjpgYEqq55euf2L2gbTEjoMxHegUovgdPzVMpt8ssVVQUvxY0tUoGntXKqiLRGPBnaDE6qIN5_fFB-uIa07Z-sA"
    },
    {
      id: "grammar",
      title: "Grammar Lab",
      desc: language === "es" ? "Corrige errores y domina la estructura" : "Correct writing and master structure",
      bgClass: "bg-[#EDF2F6]",
      borderClass: "border-[#EDF2F6]",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuApHizyMVQQ5g15lB0Dz6-VFpFhcAcsnee3sSaI8KmR-WQg_Qjo8mX8gZlJMsBRCw1NqhQkmqv0M3eAC4sruWwTzRH3leEODM9nj3RIKnojtYZ8eBjZDdKCaadt0TH7FBnOMBn8VvIxPByTqqyTOBSFp96epjlICVO9SPLo3FYwuG7xpNzYTNBB5OjAOB_AENMGBSYNwxxMsUBuvSd3wEM41IusjYffgOrafHvl_u0N3JAwaxyH_7NRYazD5Lhe8X7Xy9r6H9ekcyU"
    },
    {
      id: "reading",
      title: "Reading Lab",
      desc: language === "es" ? "Entrena tu comprensión lectora con IA" : "Boost your reading comprehension with AI",
      bgClass: "bg-[#FFF4E5]",
      borderClass: "border-[#FFF4E5]",
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "vocabulary",
      title: language === "es" ? "Centro de Vocabulario" : "Vocabulary Center",
      desc: language === "es" ? "Amplía tu vocabulario con tarjetas y juegos" : "Extend your vocabulary with cards & practice",
      bgClass: "bg-[#FDF2F8]",
      borderClass: "border-[#FDF2F8]",
      imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop"
    }
  ];

  const handleEnterLab = (labId: string) => {
    setCurrentLab(labId as any);

    // Increment practice counts & update streak when entering any lab
    const today = new Date().toISOString().slice(0, 10);
    const updatedStats = { ...userStats };

    // Increment total practices
    updatedStats.totalPractices = (updatedStats.totalPractices || 0) + 1;

    // Update weekly activity
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayDay = daysOfWeek[new Date().getDay()]; // e.g. "Mon"
    if (!updatedStats.weeklyActivity) {
      updatedStats.weeklyActivity = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    }
    updatedStats.weeklyActivity[todayDay] = (updatedStats.weeklyActivity[todayDay] || 0) + 1;

    // Update streak
    if (updatedStats.lastActiveDate !== today) {
      if (updatedStats.lastActiveDate) {
        const lastDate = new Date(updatedStats.lastActiveDate);
        const currDate = new Date(today);
        const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          updatedStats.streak += 1;
        } else if (diffDays > 1) {
          updatedStats.streak = 1;
        }
      } else {
        updatedStats.streak = 1;
      }
      updatedStats.lastActiveDate = today;
    }

    saveStats(updatedStats);
  };

  const handleExitLab = () => {
    setCurrentLab(null);
  };

  // Translations
  const navText = {
    dashboard: language === "es" ? "Dashboard" : "Dashboard",
    labs: language === "es" ? "IA Labs" : "AI Labs",
    progress: language === "es" ? "Progreso" : "Progress",
    library: language === "es" ? "Biblioteca" : "Library",
    premium: language === "es" ? "Plan Premium" : "Premium Plan",
    title: language === "es" ? "¿Qué quieres practicar hoy?" : "What do you want to practice today?",
    subtitle: language === "es" 
      ? "Ocho laboratorios de inmersión y práctica lingüística impulsados por Inteligencia Artificial de última generación."
      : "Eight immersion and language practice laboratories powered by next-generation Artificial Intelligence.",
    featureTitle: language === "es" ? "Características Destacadas" : "Key Highlights",
    featureSubtitle: language === "es" 
      ? "Conoce las tecnologías, integraciones y utilidades de la plataforma Teclingo AI."
      : "Explore the advanced capabilities and tools integrated into Teclingo AI.",
    enterBtn: language === "es" ? "Entrar" : "Enter",
  };

  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={(userData) => {
          setCurrentUser(userData);
          localStorage.setItem("teclingo_user", JSON.stringify(userData));

          // Load or initialize their stats upon login
          const statsKey = `teclingo_user_${userData.email}_stats`;
          const storedStats = localStorage.getItem(statsKey);
          if (storedStats) {
            setUserStats(JSON.parse(storedStats));
          } else {
            const initialStats: UserStats = {
              streak: 5,
              lastActiveDate: new Date().toISOString().slice(0, 10),
              totalPractices: 14,
              savedWords: [],
              grammarChecks: 0,
              weeklyActivity: { Mon: 2, Tue: 4, Wed: 1, Thu: 5, Fri: 3, Sat: 2, Sun: 3 },
              toeflScores: {}
            };
            localStorage.setItem(statsKey, JSON.stringify(initialStats));
            setUserStats(initialStats);
          }
        }}
        language={language}
        theme={theme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1a1b1f] flex flex-col justify-between selection:bg-[#0058bc]/10">
      {/* Top Glassmorphic Navigation Bar */}
      <nav className="sticky top-0 w-full z-50 bg-white/85 dark:bg-[#0b0c0e]/85 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/80 shadow-xs transition-all duration-300">
        <div className="flex justify-between items-center px-4 md:px-12 py-3.5 max-w-7xl mx-auto gap-3">
          {/* Logo */}
          <div 
            onClick={() => { setActiveTab("dashboard"); setCurrentLab(null); }}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#0058bc] dark:text-blue-400">TECLINGO</span>
          </div>

          {/* Navigation Items (Desktop only: hidden below lg) */}
          <div className="hidden lg:flex gap-4 md:gap-8 overflow-x-auto scrollbar-none shrink-0 py-1">
            <button 
              onClick={() => { setActiveTab("dashboard"); setCurrentLab(null); }}
              className={`font-semibold text-sm pb-1 border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === "dashboard" && currentLab === null
                  ? "text-[#0058bc] dark:text-blue-400 border-[#0058bc] dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-[#0058bc] dark:hover:text-blue-400"
              }`}
            >
              {navText.dashboard}
            </button>
            <button 
              onClick={() => { setActiveTab("progress"); setCurrentLab(null); }}
              className={`font-semibold text-sm pb-1 border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === "progress"
                  ? "text-[#0058bc] dark:text-blue-400 border-[#0058bc] dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-[#0058bc] dark:hover:text-blue-400"
              }`}
            >
              {navText.progress}
            </button>
            <button 
              onClick={() => { setActiveTab("library"); setCurrentLab(null); }}
              className={`font-semibold text-sm pb-1 border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === "library"
                  ? "text-[#0058bc] dark:text-blue-400 border-[#0058bc] dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-[#0058bc] dark:hover:text-blue-400"
              }`}
            >
              {navText.library}
            </button>
            <button 
              onClick={() => { setActiveTab("premium"); setCurrentLab(null); }}
              className={`font-semibold text-sm pb-1 border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === "premium"
                  ? "text-[#0058bc] dark:text-blue-400 border-[#0058bc] dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-[#0058bc] dark:hover:text-blue-400"
              }`}
            >
              {navText.premium}
            </button>
          </div>

          {/* Controls: Language Selector Toggle, Notification, Settings, Profile */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Language Toggle Switch (Desktop only: hidden below lg) */}
            <div className="hidden lg:flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5 border border-gray-200 dark:border-gray-700/50">
              <button
                onClick={() => setLanguage("es")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  language === "es"
                    ? "bg-[#0058bc] text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-450 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                ESP
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  language === "en"
                    ? "bg-[#0058bc] text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-450 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                ENG
              </button>
            </div>

            {/* Dark/Light Mode Switcher (Desktop only: hidden below lg) */}
            <div className="hidden lg:block">
              <button
                onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Toggle Dark/Light Mode"
                title={language === "es" ? "Cambiar Tema" : "Toggle Theme"}
              >
                {theme === "dark" ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-slate-700" />
                )}
              </button>
            </div>

            {/* Notifications - Desktop & Mobile */}
            <button 
              onClick={() => {
                setActiveModal("notifications");
                // Mark all notifications as read upon opening
                const now = new Date().toISOString();
                setLastCheckedNotifications(now);
              }}
              className="relative text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={language === "es" ? "Centro de Notificaciones" : "Notification Center"}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifications.filter(n => n.active && new Date(n.date).getTime() > new Date(lastCheckedNotifications).getTime()).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#111216] rounded-full animate-pulse" />
              )}
            </button>

            {/* Settings - Desktop only */}
            <button 
              onClick={() => { setActiveTab("settings"); setCurrentLab(null); }}
              className={`p-2 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer hidden lg:flex ${
                activeTab === "settings"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60"
              }`}
              title={language === "es" ? "Configuración" : "Settings"}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>

            {/* Log Out - Desktop only */}
            {currentUser && (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem("teclingo_user");
                }}
                className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center shrink-0 hidden lg:flex"
                title={language === "es" ? "Cerrar Sesión" : "Log Out"}
              >
                <LogOut size={18} />
              </button>
            )}

            {/* Profile Avatar always visible */}
            <button 
              onClick={() => { setActiveTab("settings"); setCurrentLab(null); }}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs shrink-0 hover:scale-105 transition-transform cursor-pointer"
              title={language === "es" ? "Ver Perfil / Configuración" : "View Profile / Settings"}
            >
              <img 
                alt="User Profile avatar" 
                src={currentUser ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.name || "Teclingo"}` : "https://lh3.googleusercontent.com/aida-public/AB6AXuB2bor_bbzXcH43bL-ACy4E--05xPDhx3pJiK2m_UTN3cOEfMmDgPVRROLAsJ5aRg8suS3q5xKnBE9UNF-M-oXf3akaS9BHIpyeZtHkVa1B4Kgwuf5pl8OqZsrpUNOwR9ZfYGA-Z0L3hbuQbJiSdGvHy7aVy_3vQlG5DkPgClYXYnMv9G9-zgZWv2bkcd593q__JabNu3EMzhXQqusRSo0sElvv_d2hl6706y7jXuAQZ779bOyrw0-w1nmlyOXYK3wjOusr_NPMQwg"}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Mobile Menu Icon Toggle (Mobile only: hidden on lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-xl bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-gray-200/50 dark:border-gray-700/50"
              aria-label="Open menu"
              title={language === "es" ? "Abrir menú" : "Open menu"}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (Menu Lateral) overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-[#111216] border-l border-gray-100 dark:border-gray-800/80 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto lg:hidden"
            >
              <div className="space-y-6">
                {/* Header with Close button */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800/60">
                  <span className="font-extrabold text-xl tracking-tight text-[#0058bc] dark:text-blue-400">TECLINGO</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-450 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Profile Section inside sidebar */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-gray-200 dark:border-gray-750 shrink-0">
                    <img 
                      alt="User Profile avatar" 
                      src={currentUser ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.name || "Teclingo"}` : "https://lh3.googleusercontent.com/aida-public/AB6AXuB2bor_bbzXcH43bL-ACy4E--05xPDhx3pJiK2m_UTN3cOEfMmDgPVRROLAsJ5aRg8suS3q5xKnBE9UNF-M-oXf3akaS9BHIpyeZtHkVa1B4Kgwuf5pl8OqZsrpUNOwR9ZfYGA-Z0L3hbuQbJiSdGvHy7aVy_3vQlG5DkPgClYXYnMv9G9-zgZWv2bkcd593q__JabNu3EMzhXQqusRSo0sElvv_d2hl6706y7jXuAQZ779bOyrw0-w1nmlyOXYK3wjOusr_NPMQwg"}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-black text-xs text-gray-850 dark:text-gray-100 truncate">
                      {currentUser ? currentUser.name : (language === "es" ? "Invitado de Honor" : "Guest User")}
                    </h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold truncate">
                      {currentUser ? currentUser.email : (language === "es" ? "Acceso de Prueba" : "Trial Access")}
                    </p>
                  </div>
                </div>

                {/* Preferences inside sidebar */}
                <div className="space-y-3">
                  <span className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                    {language === "es" ? "PREFERENCIAS" : "PREFERENCES"}
                  </span>
                  
                  {/* Language Selector */}
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-gray-100 dark:border-gray-800/30">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                      {language === "es" ? "Idioma" : "Language"}
                    </span>
                    <div className="flex items-center bg-gray-150 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => { setLanguage("es"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${
                          language === "es"
                            ? "bg-[#0058bc] text-white shadow-xs"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
                        }`}
                      >
                        ESP
                      </button>
                      <button
                        onClick={() => { setLanguage("en"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${
                          language === "en"
                            ? "bg-[#0058bc] text-white shadow-xs"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
                        }`}
                      >
                        ENG
                      </button>
                    </div>
                  </div>

                  {/* Dark Mode Switcher */}
                  <div className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-gray-100 dark:border-gray-800/30">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                      {language === "es" ? "Tema de Interfaz" : "Interface Theme"}
                    </span>
                    <button
                      onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer border border-gray-200 dark:border-gray-700"
                    >
                      {theme === "dark" ? (
                        <div className="flex items-center gap-1">
                          <Sun size={14} className="text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-500">{language === "es" ? "Claro" : "Light"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Moon size={14} className="text-slate-700" />
                          <span className="text-[10px] font-bold text-slate-700">{language === "es" ? "Oscuro" : "Dark"}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Navigation Items list */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest block pb-1">
                    {language === "es" ? "NAVEGACIÓN" : "NAVIGATION"}
                  </span>
                  
                  <button 
                    onClick={() => { setActiveTab("dashboard"); setCurrentLab(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
                      activeTab === "dashboard" && currentLab === null
                        ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border-l-4 border-[#0058bc]"
                        : "text-gray-600 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <Compass size={15} />
                    {navText.dashboard}
                  </button>

                  <button 
                    onClick={() => { setActiveTab("progress"); setCurrentLab(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
                      activeTab === "progress"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border-l-4 border-[#0058bc]"
                        : "text-gray-600 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <TrendingUp size={15} />
                    {navText.progress}
                  </button>

                  <button 
                    onClick={() => { setActiveTab("library"); setCurrentLab(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
                      activeTab === "library"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border-l-4 border-[#0058bc]"
                        : "text-gray-600 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <BookOpen size={15} />
                    {navText.library}
                  </button>

                  <button 
                    onClick={() => { setActiveTab("premium"); setCurrentLab(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
                      activeTab === "premium"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border-l-4 border-[#0058bc]"
                        : "text-gray-600 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <Sparkles size={15} className="text-amber-500" />
                    {navText.premium}
                  </button>

                  <button 
                    onClick={() => { setActiveTab("settings"); setCurrentLab(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
                      activeTab === "settings"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border-l-4 border-[#0058bc]"
                        : "text-gray-600 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <Settings size={15} />
                    {language === "es" ? "Configuración" : "Settings"}
                  </button>
                </div>
              </div>

              {/* Log out footer inside sidebar */}
              {currentUser ? (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem("teclingo_user");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-rose-50 dark:bg-rose-950/10 hover:bg-rose-100 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut size={15} />
                    {language === "es" ? "Cerrar Sesión" : "Log Out"}
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60">
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setCurrentLab(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 text-[#0058bc] dark:text-blue-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {language === "es" ? "Registrarse / Entrar" : "Register / Login"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Eye-catching Summer Courses Banner */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 mt-6 -mb-6 relative z-30 flex justify-center md:justify-start">
        <button
          onClick={() => setActiveModal("summer")}
          className="relative group flex items-center gap-3.5 px-6 py-3 bg-gradient-to-r from-[#ff7c00] via-[#ff3b40] to-[#ff0073] hover:from-[#ff881a] hover:via-[#ff4b50] hover:to-[#ff1a84] text-white rounded-full shadow-[0_6px_25px_rgba(255,124,0,0.35)] hover:shadow-[0_8px_30px_rgba(255,124,0,0.5)] active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
        >
          {/* Glowing yellow dot/badge matching the image */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-white dark:border-[#0b0c0e]"></span>
          </span>

          {/* Icon */}
          <GraduationCap className="text-white shrink-0 group-hover:rotate-12 transition-transform duration-300" size={18} />

          {/* Text Content */}
          <div className="flex items-center gap-2.5">
            <span className="font-black text-xs md:text-sm tracking-wider uppercase">
              {language === "es" ? "CURSOS DE VERANO 2026" : "SUMMER COURSES 2026"}
            </span>

            {/* Pill Capsule / Tag */}
            <span className="bg-white/20 backdrop-blur-xs text-[10px] md:text-xs font-extrabold uppercase px-3 py-0.5 rounded-full border border-white/30 text-white tracking-wide">
              {language === "es" ? "SECUNDARIA & PREPARATORIA" : "MIDDLE & HIGH SCHOOL"}
            </span>
          </div>

          {/* Chevron dropdown indicator matching the image */}
          <ChevronDown size={14} className="text-white/85 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-grow py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Render drill down lab or general tab panel */}
        {currentLab === "pronunciation" ? (
          <PronunciationLab onBack={handleExitLab} />
        ) : currentLab === "listening" ? (
          <ListeningLab onBack={handleExitLab} onSaveVocabulary={handleSaveVocabulary} />
        ) : currentLab === "chat" ? (
          <SafeZoneChat onBack={handleExitLab} />
        ) : currentLab === "tutor" ? (
          <AITutor onBack={handleExitLab} />
        ) : currentLab === "toefl" ? (
          <TOEFLSimulator onBack={handleExitLab} onLogTOEFLScore={handleLogTOEFLScore} />
        ) : currentLab === "grammar" ? (
          <GrammarLab onBack={handleExitLab} onLogGrammarAccuracy={handleLogGrammarAccuracy} />
        ) : currentLab === "reading" ? (
          <ReadingLab onBack={handleExitLab} onSaveVocabulary={handleSaveVocabulary} />
        ) : currentLab === "vocabulary" ? (
          <VocabularyCenter 
            onBack={handleExitLab} 
            savedVocabulary={userStats.savedWords}
            onSaveVocabulary={handleSaveVocabulary}
            onRemoveVocabulary={handleRemoveVocabulary}
            language={language}
          />
        ) : activeTab === "progress" ? (
          <ProgressPanel 
            userStats={userStats}
          />
        ) : activeTab === "library" ? (
          <LibraryPanel 
            savedVocabulary={userStats.savedWords} 
            onRemoveVocabulary={handleRemoveVocabulary} 
          />
        ) : activeTab === "premium" ? (
          <PremiumPanel language={language} />
        ) : activeTab === "settings" ? (
          <SettingsPanel 
            currentUser={currentUser}
            userStats={userStats}
            onUpdateUser={(updatedUserData) => {
              setCurrentUser(updatedUserData);
              localStorage.setItem("teclingo_user", JSON.stringify(updatedUserData));
            }}
            onResetStats={() => {
              const defaultStats: UserStats = {
                streak: 0,
                lastActiveDate: "",
                totalPractices: 0,
                savedWords: [],
                grammarChecks: 0,
                weeklyActivity: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
                toeflScores: {}
              };
              saveStats(defaultStats);
            }}
            language={language}
            theme={theme}
            onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        ) : (
          /* Dashboard default screen with 8 labs and a highlight carousel */
          <div className="space-y-16">
            {/* Hero Section */}
            <header className="apple-fade-in max-w-3xl space-y-2">
              <span className="text-xs font-bold text-[#0058bc] dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/25 px-3 py-1 rounded-full border border-blue-100/30 dark:border-blue-900/30">
                {language === "es" ? "Panel del Alumno" : "Student Panel"}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight leading-tight pt-1">
                {language === "es" ? "¡Hola de nuevo," : "Welcome back,"} <span className="bg-gradient-to-tr from-[#0058bc] to-cyan-500 bg-clip-text text-transparent">{currentUser.name}</span>! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm leading-relaxed">
                {language === "es" 
                  ? "Sigue de cerca tus avances, repasa vocabulario y continúa perfeccionando tu inglés con inteligencia artificial."
                  : "Track your progress, review saved vocabulary, and continue perfecting your language skills with AI."}
              </p>
            </header>

            {/* 8 Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {CARDS.map((card, idx) => (
                <div 
                  key={card.id}
                  className="card-hover apple-fade-in group relative h-[420px] rounded-3xl overflow-hidden bg-white dark:bg-[#15161a] border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between"
                  style={{ animationDelay: `${(idx + 1) * 0.05}s` }}
                >
                  {/* Decorative illustrative header area */}
                  <div className={`flex-grow flex items-center justify-center relative overflow-hidden p-6 ${card.bgClass} dark:bg-gray-900/35 border-b ${card.borderClass} dark:border-gray-800/60`}>
                    <div className="absolute inset-0 opacity-25 bg-gradient-to-br from-white to-transparent dark:from-black/10"></div>
                    <img 
                      alt={card.title} 
                      className="w-[85%] h-auto max-h-[180px] object-contain z-10 transition-transform duration-700 group-hover:scale-105 filter drop-shadow-sm" 
                      src={card.imageUrl}
                    />
                  </div>

                  {/* Info card footer */}
                  <div className="p-6 bg-white dark:bg-[#15161a] shrink-0">
                    <h3 className="font-extrabold text-gray-950 text-base group-hover:text-[#0058bc] transition-colors">{card.title}</h3>
                    <p className="text-gray-400 text-[11px] font-semibold mt-1 leading-normal">{card.desc}</p>
                    <button 
                      onClick={() => handleEnterLab(card.id)}
                      className="flex items-center text-[#0058bc] font-bold text-xs mt-4 hover:translate-x-1.5 transition-transform"
                    >
                      {navText.enterBtn} <ArrowRight size={13} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* High-Impact Dynamic Benefits Carousel */}
            <DynamicCarousel language={language} />
          </div>
        )}
      </main>

      {/* Footer Area matches Design guidelines */}
      <footer className="w-full bg-white dark:bg-[#0b0c0e] border-t border-gray-100 dark:border-gray-800/80 mt-16 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 md:px-12 max-w-7xl mx-auto gap-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-gray-900 dark:text-gray-100 tracking-tight">TECLINGO AI</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#0058bc] dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded">Conceptos AI MX</span>
                <button
                  onClick={() => setActiveModal("secret")}
                  className="p-1 rounded-lg text-[#0058bc] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-100/30 dark:border-blue-900/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title={language === "es" ? "Panel Secreto de Desarrollador" : "Secret Developer Console"}
                  aria-label="Developer Panel"
                >
                  <Brain size={12} className="animate-pulse" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 max-w-sm">
              {language === "es" 
                ? "Plataforma de inmersión lingüística interactiva de última generación para el perfeccionamiento y preparación integral."
                : "Next-generation interactive linguistic immersion platform for comprehensive improvement and training."}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-[#0058bc] dark:text-blue-400 tracking-wider uppercase mr-1">
                {language === "es" ? "Compatible con el MCER / TOEFL / SEP / SENNI" : "Compatible with CEFR / TOEFL / SEP / SENNI"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* MCER Logo Badge */}
                <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-950/40 text-[#0058bc] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Marco Común Europeo de Referencia para las lenguas">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  MCER
                </span>
                {/* TOEFL Logo Badge */}
                <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Test of English as a Foreign Language">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  TOEFL
                </span>
                {/* SEP Logo Badge */}
                <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-150 dark:border-amber-900/50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Secretaría de Educación Pública">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  SEP
                </span>
                {/* SENNI Logo Badge */}
                <span className="text-[9px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 px-2 py-0.5 rounded-md flex items-center gap-1" title="CENNI / SENNI Certificación Nacional de Nivel de Idioma">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  SENNI
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex gap-6 text-xs text-gray-400 font-semibold">
              <button 
                onClick={() => setActiveModal("terms")} 
                className="hover:text-[#0058bc] dark:hover:text-blue-400 transition-colors cursor-pointer outline-hidden"
              >
                {language === "es" ? "Términos" : "Terms"}
              </button>
              <button 
                onClick={() => setActiveModal("privacy")} 
                className="hover:text-[#0058bc] dark:hover:text-blue-400 transition-colors cursor-pointer outline-hidden"
              >
                {language === "es" ? "Privacidad" : "Privacy"}
              </button>
              <button 
                onClick={() => setActiveModal("support")} 
                className="hover:text-[#0058bc] dark:hover:text-blue-400 transition-colors cursor-pointer outline-hidden"
              >
                {language === "es" ? "Soporte" : "Support"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              © 2026 TECLINGO AI / Conceptos AI MX. {language === "es" ? "Todos los derechos reservados." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Action Stack */}
      <ActionStack language={language} />

      {/* Minimalist, Discrete Popup Modal for Terms, Privacy, Support */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className={`bg-white dark:bg-[#15161a] border border-gray-150 dark:border-gray-800 rounded-[28px] ${
              activeModal === "secret" && isSecretUnlocked ? "max-w-4xl" : "max-w-lg"
            } w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative scrollbar-thin animate-scaleUp`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setActiveModal(null)}
              className={`absolute top-4 right-4 p-2 transition-colors rounded-full cursor-pointer z-35 ${
                activeModal === "summer" 
                  ? "text-white hover:text-white/90 bg-black/25 hover:bg-black/40" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Modal Content */}
            {activeModal === "notifications" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="flex items-center gap-2.5 text-[#0058bc] dark:text-blue-400">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                      <Bell size={18} className="text-[#0058bc] dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-950 dark:text-gray-100">
                        {language === "es" ? "Centro de Noticias" : "Notification Center"}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {language === "es" ? "Anuncios y Updates" : "Announcements & Updates"}
                      </p>
                    </div>
                  </div>
                  
                  {notifications.filter(n => n.active && new Date(n.date).getTime() > new Date(lastCheckedNotifications).getTime()).length > 0 && (
                    <button
                      onClick={() => {
                        const now = new Date().toISOString();
                        setLastCheckedNotifications(now);
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-gray-150 dark:border-gray-800"
                    >
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      {language === "es" ? "Leídas" : "Mark read"}
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                  {notifications.filter(n => n.active).length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-850/60 rounded-full flex items-center justify-center mx-auto text-gray-350 dark:text-gray-600">
                        <Megaphone size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-wide">
                          {language === "es" ? "Todo al día" : "All Caught Up"}
                        </p>
                        <p className="text-[11px] text-gray-400 italic">
                          {language === "es" 
                            ? "No hay nuevos anuncios ni actualizaciones por el momento." 
                            : "There are no new announcements or updates at this time."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.filter(n => n.active).map((noti) => {
                      const isUnread = new Date(noti.date).getTime() > new Date(lastCheckedNotifications).getTime();
                      return (
                        <div 
                          key={noti.id}
                          className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                            isUnread 
                              ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-150/50 dark:border-blue-900/40" 
                              : "bg-white dark:bg-[#15161a] border-gray-150 dark:border-gray-850"
                          } border-l-4 ${
                            noti.type === "success" 
                              ? "border-l-emerald-500"
                              : noti.type === "warning"
                              ? "border-l-amber-500"
                              : noti.type === "update"
                              ? "border-l-indigo-500"
                              : "border-l-blue-500"
                          }`}
                        >
                          {isUnread && (
                            <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                          )}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                noti.type === "success" 
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : noti.type === "warning"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                  : noti.type === "update"
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                              }`}>
                                {noti.type}
                              </span>
                              <span className="text-[9px] text-gray-400 font-mono font-bold">{noti.date}</span>
                            </div>
                            <h4 className="font-black text-xs text-gray-950 dark:text-gray-100 tracking-tight leading-tight">
                              {noti.title}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                              {noti.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeModal === "terms" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0058bc] dark:text-blue-400">
                  <Shield size={20} />
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {language === "es" ? "Términos de Servicio" : "Terms of Service"}
                  </h3>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-3 font-medium leading-relaxed overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                  <p className="font-bold text-gray-750 dark:text-gray-300">
                    {language === "es" 
                      ? "Bienvenido a Teclingo AI. Al utilizar nuestros laboratorios, aceptas los siguientes términos:"
                      : "Welcome to Teclingo AI. By using our labs, you agree to the following terms:"}
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>
                      <strong>{language === "es" ? "Propósito Educativo:" : "Educational Purpose:"}</strong>{" "}
                      {language === "es" 
                        ? "Teclingo AI es una plataforma educativa de Conceptos AI MX para practicar inglés. El uso está limitado a fines académicos."
                        : "Teclingo AI is an educational platform by Conceptos AI MX for practicing English. Use is limited to academic purposes."}
                    </li>
                    <li>
                      <strong>{language === "es" ? "Servicios de IA:" : "AI Services:"}</strong>{" "}
                      {language === "es" 
                        ? "Las correcciones y simulaciones son generadas por modelos de IA de última generación. Úsalos como una herramienta de apoyo."
                        : "Corrections and simulations are generated by state-of-the-art AI models. Use them as supporting tools."}
                    </li>
                    <li>
                      <strong>{language === "es" ? "Cuentas Demo:" : "Demo Accounts:"}</strong>{" "}
                      {language === "es" 
                        ? "Las cuentas demo guardan datos a nivel de navegador y pueden ser restablecidas en la sección de configuración."
                        : "Demo accounts save data locally in your browser and can be reset under the settings section."}
                    </li>
                  </ul>
                  <p className="pt-2 text-[10px] text-gray-400">
                    {language === "es" ? "Última actualización: Julio 2026" : "Last updated: July 2026"}
                  </p>
                </div>
              </div>
            )}

            {activeModal === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0058bc] dark:text-blue-400">
                  <Lock size={20} />
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {language === "es" ? "Política de Privacidad" : "Privacy Policy"}
                  </h3>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-3 font-medium leading-relaxed overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                  <p className="font-bold text-gray-750 dark:text-gray-300">
                    {language === "es" 
                      ? "En Teclingo AI valoramos tu confianza y protegemos tu privacidad al máximo:"
                      : "At Teclingo AI we value your trust and fully protect your privacy:"}
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>
                      <strong>{language === "es" ? "Almacenamiento Local:" : "Local Storage:"}</strong>{" "}
                      {language === "es" 
                        ? "Tus datos de progreso, racha y palabras guardadas no se suben a servidores externos sin autorización; residen localmente en tu dispositivo."
                        : "Your progress, streak, and saved words are not uploaded to external servers without authorization; they reside locally on your device."}
                    </li>
                    <li>
                      <strong>{language === "es" ? "Privacidad de Audio:" : "Voice Privacy:"}</strong>{" "}
                      {language === "es" 
                        ? "El audio de tu micrófono en el laboratorio de pronunciación y chat se procesa exclusivamente para evaluación temporal y no se almacena permanentemente."
                        : "Your microphone audio in the pronunciation lab and chat is processed solely for temporary evaluation and is not permanently stored."}
                    </li>
                    <li>
                      <strong>{language === "es" ? "No Comercialización:" : "No Selling of Data:"}</strong>{" "}
                      {language === "es" 
                        ? "Conceptos AI MX nunca venderá ni compartirá tu información personal con terceras partes con fines comerciales."
                        : "Conceptos AI MX will never sell or share your personal information with third parties for commercial purposes."}
                    </li>
                  </ul>
                  <p className="pt-2 text-[10px] text-gray-400">
                    {language === "es" ? "Última actualización: Julio 2026" : "Last updated: July 2026"}
                  </p>
                </div>
              </div>
            )}

            {activeModal === "support" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0058bc] dark:text-blue-400">
                  <HelpCircle size={20} />
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {language === "es" ? "Soporte Técnico" : "Technical Support"}
                  </h3>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-3 font-medium leading-relaxed">
                  <p className="text-gray-755 dark:text-gray-300 font-bold">
                    {language === "es" 
                      ? "¿Tienes dudas, comentarios o problemas con el servicio?"
                      : "Have questions, feedback, or issues with the service?"}
                  </p>
                  <p>
                    {language === "es" 
                      ? "Nuestro equipo técnico y de tutores está siempre disponible para ayudarte a aprovechar al máximo la plataforma de inmersión."
                      : "Our technical and tutoring team is always available to help you make the most of the immersion platform."}
                  </p>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800/50 space-y-2 mt-4 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-bold">{language === "es" ? "Soporte Oficial:" : "Official Support:"}</span>
                      <a href="mailto:soporte@teclingo.ai" className="text-[#0058bc] dark:text-blue-400 font-extrabold hover:underline">
                        soporte@teclingo.ai
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">{language === "es" ? "Entidad de Operación:" : "Operating Entity:"}</span>
                      <span className="font-bold text-gray-750 dark:text-gray-300">Conceptos AI MX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">{language === "es" ? "Tiempo de Respuesta:" : "Response Time:"}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {language === "es" ? "< 24 horas hábiles" : "< 24 business hours"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "summer" && (
              <div className="space-y-4">
                {/* Ambient header matching the vibrant image gradient */}
                <div className="h-24 -mx-6 md:-mx-8 -mt-6 md:-mt-8 bg-gradient-to-r from-[#ff7c00] via-[#ff3b40] to-[#ff0073] flex items-center px-6 md:px-8 text-white relative">
                  <div className="flex items-center gap-3">
                    <GraduationCap size={28} className="animate-bounce" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                        {language === "es" ? "Convocatoria Abierta" : "Open Enrollment"}
                      </span>
                      <h3 className="text-base md:text-lg font-black tracking-tight leading-none mt-1">
                        {language === "es" ? "Cursos de Verano 2026" : "Summer Courses 2026"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-2xl border border-orange-100/30 dark:border-orange-900/30">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#ff7c00]">
                        {language === "es" ? "Dirigido a:" : "Target Audience:"}
                      </span>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {language === "es" ? "Secundaria & Preparatoria" : "Middle & High School Students"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-white dark:bg-[#15161a] border border-orange-150 dark:border-orange-900/40 text-[#ff7c00] dark:text-orange-400 px-3 py-1 rounded-full uppercase">
                      12 a 18 {language === "es" ? "años" : "years"}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-3 font-medium leading-relaxed">
                    <p className="font-bold text-gray-750 dark:text-gray-300">
                      {language === "es" 
                        ? "Acelera tu nivel de inglés este verano con tecnología avanzada e inmersión conversacional interactiva con tutores de IA en tiempo real." 
                        : "Accelerate your English level this summer with advanced technology and interactive conversational immersion with real-time AI tutors."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800/50">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">{language === "es" ? "Fechas" : "Dates"}</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">20 Jul - 14 Ago 2026</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800/50">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">{language === "es" ? "Horario" : "Schedule"}</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">9:00 AM - 1:00 PM</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black uppercase text-gray-900 dark:text-gray-100 tracking-wider pt-2 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      {language === "es" ? "¿Qué incluye el programa?" : "What's Included?"}
                    </h4>

                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-350">
                      <li>
                        <strong>{language === "es" ? "Práctica Conversacional AI:" : "AI Conversational Practice:"}</strong>{" "}
                        {language === "es" ? "Evaluaciones de voz y pronunciación diaria en entornos interactivos." : "Daily voice and pronunciation evaluation in simulated interactive scenes."}
                      </li>
                      <li>
                        <strong>{language === "es" ? "TOEFL Junior & MCER:" : "TOEFL Junior & CEFR:"}</strong>{" "}
                        {language === "es" ? "Simulacros oficiales con retroalimentación inmediata." : "Official simulated tests with immediate targeted feedback."}
                      </li>
                      <li>
                        <strong>{language === "es" ? "Proyectos Colaborativos:" : "Collaborative Projects:"}</strong>{" "}
                        {language === "es" ? "Debates, club de lectura y actividades inmersivas grupales." : "Debating clubs, interactive reading, and group immersion activities."}
                      </li>
                    </ul>

                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30 p-3.5 rounded-2xl text-[11px] font-bold mt-2">
                      {language === "es"
                        ? "✨ Certificación Nacional de Idioma CENNI / SEP incluida al finalizar con éxito el curso."
                        : "✨ CENNI / SEP national language certification included upon successful completion of the course."}
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://wa.me/521234567890?text=Hola,%20quiero%20más%20información%20del%20Curso%20de%20Verano%20Teclingo%202026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💬 {language === "es" ? "Saber más por WhatsApp" : "Learn More via WhatsApp"}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "secret" && !isSecretUnlocked && (
              <div className="space-y-6 max-w-sm mx-auto py-4">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400">
                    <Key size={32} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
                      {language === "es" ? "Panel Secreto: Conceptos AI" : "Secret Portal: Conceptos AI"}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {language === "es" ? "Acceso de Desarrollador Autorizado" : "Authorized Developer Access"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#0e0f12] p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {language === "es" 
                    ? "Bienvenido al panel oculto de ingeniería. Para acceder a él, debes ingresar el passcode del sistema."
                    : "Welcome to the hidden engineering console. To gain entry, you must input the authorized system passcode."}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    {language === "es" ? "Código de Acceso (Passcode)" : "System Passcode"}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={secretPasscodeAttempt}
                    onChange={(e) => {
                      setSecretPasscodeAttempt(e.target.value);
                      setSecretPasscodeError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (secretPasscodeAttempt === "passcode2026") {
                          setIsSecretUnlocked(true);
                          setSecretPasscodeError(false);
                        } else {
                          setSecretPasscodeError(true);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0e0f12] border border-gray-200 dark:border-gray-800 rounded-xl text-center font-mono font-bold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {secretPasscodeError && (
                    <p className="text-[10px] font-black text-red-500 text-center animate-bounce mt-1">
                      ⚠️ {language === "es" ? "Passcode Incorrecto. Intenta de nuevo." : "Invalid Passcode. Please try again."}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      if (secretPasscodeAttempt === "passcode2026") {
                        setIsSecretUnlocked(true);
                        setSecretPasscodeError(false);
                      } else {
                        setSecretPasscodeError(true);
                      }
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Unlock size={14} />
                    {language === "es" ? "Desbloquear" : "Unlock"}
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {activeModal === "secret" && isSecretUnlocked && (
              <div className="space-y-6">
                {/* Header with quick close / lock back action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <Brain size={24} className="animate-spin-slow text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                        {language === "es" ? "Panel Secreto: Conceptos AI" : "Secret Portal: Conceptos AI"}
                      </h3>
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">
                        {language === "es" ? "Acceso de Desarrollador Autorizado" : "Authorized Developer Access"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ● {language === "es" ? "SISTEMA DESBLOQUEADO" : "SYSTEM UNLOCKED"}
                    </span>
                    <button
                      onClick={() => {
                        setIsSecretUnlocked(false);
                        setSecretPasscodeAttempt("");
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title={language === "es" ? "Bloquear Panel" : "Lock Panel"}
                    >
                      <Lock size={15} />
                    </button>
                  </div>
                </div>

                {/* Tab selector */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto gap-1.5 pb-0.5 scrollbar-thin">
                  <button
                    onClick={() => setActiveSecretTab("assistant")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "assistant"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    🧠 {language === "es" ? "Tutor IA" : "AI Tutor"}
                  </button>
                  <button
                    onClick={() => setActiveSecretTab("course")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "course"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    📚 {language === "es" ? "Curso de Inglés" : "English Syllabus"}
                  </button>
                  <button
                    onClick={() => setActiveSecretTab("tools")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "tools"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    ⚙️ {language === "es" ? "Ajustes Herramientas AI" : "AI Tools Settings"}
                  </button>
                  <button
                    onClick={() => setActiveSecretTab("system")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "system"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    🛠️ {language === "es" ? "Simulación y QA" : "Simulation & QA"}
                  </button>
                  <button
                    onClick={() => setActiveSecretTab("messages")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "messages"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    🔔 {language === "es" ? "Mensajería & Updates" : "Messaging & Updates"}
                  </button>
                  <button
                    onClick={() => setActiveSecretTab("knowledge")}
                    className={`px-4 py-2.5 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeSecretTab === "knowledge"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    🔌 {language === "es" ? "Base de Conocimiento RAG" : "RAG Knowledge Base"}
                  </button>
                </div>

                {/* Tab content */}
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-4">
                  
                  {/* TAB 1: TECLINGO AI TUTOR — Chat + Knowledge Base + Exercises */}
                  {activeSecretTab === "assistant" && (
                    <div className="h-[600px]">
                      <ChatTutor onBack={() => setActiveSecretTab("tools")} language={language as "es" | "en"} />
                    </div>
                  )}

                  {/* TAB 2: COURSE SYLLABUS DATABASE */}
                  {activeSecretTab === "course" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                            <BookOpen size={13} />
                            {language === "es" ? "Base de Datos de Temario & Niveles de Inglés" : "English Course Syllabus Database"}
                          </h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {language === "es" ? "Define los contenidos, duraciones y enfoques curriculares de la aplicación." : "Fine-tune levels, durations, and thematic focuses of Teclingo."}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newCourse = {
                              id: Date.now().toString(),
                              level: "Nuevo Nivel",
                              topic: "Tema Técnico Nuevo",
                              desc: "Descripción del contenido y habilidades que el estudiante aprenderá.",
                              duration: "20 Horas"
                            };
                            setCourseDB([...courseDB, newCourse]);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] rounded-lg tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          {language === "es" ? "Nuevo Nivel" : "Add Course"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                        {courseDB.map((course) => (
                          <div 
                            key={course.id}
                            className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3 relative group"
                          >
                            <div className="flex justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase block">{language === "es" ? "Nivel / MCER" : "MCER Level"}</label>
                                    <input
                                      type="text"
                                      value={course.level}
                                      onChange={(e) => {
                                        const updated = courseDB.map(c => c.id === course.id ? { ...c, level: e.target.value } : c);
                                        setCourseDB(updated);
                                      }}
                                      className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 focus:border-indigo-500 focus:outline-hidden w-full mt-0.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase block">{language === "es" ? "Duración" : "Hours"}</label>
                                    <input
                                      type="text"
                                      value={course.duration}
                                      onChange={(e) => {
                                        const updated = courseDB.map(c => c.id === course.id ? { ...c, duration: e.target.value } : c);
                                        setCourseDB(updated);
                                      }}
                                      className="font-mono text-xs text-gray-800 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 focus:border-indigo-500 focus:outline-hidden w-full mt-0.5"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase block">{language === "es" ? "Tema de Enfoque" : "Technical Topic"}</label>
                                  <input
                                    type="text"
                                    value={course.topic}
                                    onChange={(e) => {
                                      const updated = courseDB.map(c => c.id === course.id ? { ...c, topic: e.target.value } : c);
                                      setCourseDB(updated);
                                    }}
                                    className="font-black text-xs text-gray-950 dark:text-gray-150 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 focus:border-indigo-500 focus:outline-hidden w-full"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setCourseDB(courseDB.filter(c => c.id !== course.id));
                                }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 rounded-lg h-fit transition-colors"
                              >
                                <Trash size={13} />
                              </button>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase block">{language === "es" ? "Descripción" : "Description"}</label>
                              <textarea
                                rows={2}
                                value={course.desc}
                                onChange={(e) => {
                                  const updated = courseDB.map(c => c.id === course.id ? { ...c, desc: e.target.value } : c);
                                  setCourseDB(updated);
                                }}
                                className="w-full p-2 bg-white dark:bg-[#15161a] text-[10px] text-gray-500 dark:text-gray-400 border border-gray-150 dark:border-gray-800 rounded-lg focus:outline-hidden focus:border-indigo-500 leading-normal"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ADJUSTMENTS FOR ALL AI TOOLS (DIVIDED BY CATEGORIES) */}
                  {activeSecretTab === "tools" && (
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <Sliders size={14} className="text-indigo-500" />
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-gray-900 dark:text-gray-100 tracking-wider">
                            {language === "es" ? "Ajustes de Herramientas de Inteligencia Artificial" : "AI Core Engines & Parameters"}
                          </h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {language === "es" ? "Configura los motores de cada herramienta y ajusta su severidad y velocidad al instante." : "Fine-tune model versions, audit parameters, and threshold limits across the platform."}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. AI Pronunciation Lab */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            🎙️ 1. AI Pronunciation Lab
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Nivel de Rigor" : "Accent Evaluation Rigor"}</span>
                              <select
                                value={toolsSettings.pronunciation.difficulty}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  pronunciation: { ...toolsSettings.pronunciation, difficulty: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="easy">{language === "es" ? "Relajado (Easy)" : "Lenient (Easy)"}</option>
                                <option value="medium">{language === "es" ? "Intermedio (Medium)" : "Balanced (Medium)"}</option>
                                <option value="hard">{language === "es" ? "Estricto Nativo (Hard)" : "Strict Native (Hard)"}</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Intentos Máximos" : "Max Recording Recs"}</span>
                              <input
                                type="number"
                                min={1}
                                max={15}
                                value={toolsSettings.pronunciation.maxAttempts}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  pronunciation: { ...toolsSettings.pronunciation, maxAttempts: parseInt(e.target.value) || 5 }
                                })}
                                className="w-14 px-2 py-0.5 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg text-right font-bold text-[10px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. AI Listening Lab */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            🎧 2. AI Listening Lab
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Velocidad de Voz" : "Voice Speed"}</span>
                              <select
                                value={toolsSettings.listening.speed}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  listening: { ...toolsSettings.listening, speed: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="0.75x">0.75x (Lento)</option>
                                <option value="1.0x">1.0x (Normal)</option>
                                <option value="1.25x">1.25x (Rápido)</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Acento Predominante" : "Voice Accent Focus"}</span>
                              <select
                                value={toolsSettings.listening.accent}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  listening: { ...toolsSettings.listening, accent: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="american">American English</option>
                                <option value="british">British Accent</option>
                                <option value="australian">Australian Accent</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 3. SafeZone Chat */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            💬 3. SafeZone Chat
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Modo de Corrección" : "Feedback Method"}</span>
                              <select
                                value={toolsSettings.chat.grammarCorrection}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  chat: { ...toolsSettings.chat, grammarCorrection: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="immediate">{language === "es" ? "Inmediato (En conversación)" : "Immediate Inline"}</option>
                                <option value="post">{language === "es" ? "Post-Chat (Resumen)" : "Post-Session Report"}</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Auditoría de Sujeto 'It'" : "Subject 'It' Audit"}</span>
                              <input
                                type="checkbox"
                                checked={toolsSettings.chat.subjectItAudit}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  chat: { ...toolsSettings.chat, subjectItAudit: e.target.checked }
                                })}
                                className="w-4 h-4 rounded-md accent-indigo-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. AI Tutor */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            👨‍🏫 4. AI Tutor
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Metodología" : "Tutoring Philosophy"}</span>
                              <select
                                value={toolsSettings.tutor.method}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  tutor: { ...toolsSettings.tutor, method: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="socratic">{language === "es" ? "Socrático (Guía preguntas)" : "Socratic (Inquisitive)"}</option>
                                <option value="direct">{language === "es" ? "Directo (Explicativo)" : "Direct Lecture"}</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Límite Prompts Diario" : "Max Prompts Per Session"}</span>
                              <input
                                type="number"
                                min={10}
                                max={500}
                                value={toolsSettings.tutor.maxDailyPrompts}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  tutor: { ...toolsSettings.tutor, maxDailyPrompts: parseInt(e.target.value) || 100 }
                                })}
                                className="w-14 px-2 py-0.5 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg text-right font-bold text-[10px]"
                              />
                            </div>
                            {/* System Instructions for Tutor */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                                {language === "es" ? "Instrucciones de Sistema (System Prompt)" : "System Instructions Prompt"}
                              </label>
                              <textarea
                                rows={2}
                                value={behaviorSettings.systemInstruction}
                                onChange={(e) => setBehaviorSettings({ ...behaviorSettings, systemInstruction: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-[10px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg font-mono text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-normal"
                                placeholder={language === "es" ? "Instrucciones personalizadas para el comportamiento del tutor..." : "Custom instructions for tutor behavior..."}
                              />
                            </div>
                            {/* Tone */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Tono" : "Tone"}</span>
                              <select
                                value={behaviorSettings.tone}
                                onChange={(e) => setBehaviorSettings({ ...behaviorSettings, tone: e.target.value })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="bilingue_empatico">{language === "es" ? "Bilingüe Empático" : "Empathetic Bilingual"}</option>
                                <option value="tecnico_riguroso">{language === "es" ? "Técnico Riguroso" : "Rigorous Technical"}</option>
                                <option value="casual_academico">{language === "es" ? "Casual Académico" : "Casual Academic"}</option>
                              </select>
                            </div>
                            {/* Temperature */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">
                                {language === "es" ? "Temperatura: " : "Temperature: "}
                                <span className="font-mono font-bold text-indigo-600">{behaviorSettings.temperature}</span>
                              </span>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={behaviorSettings.temperature}
                                onChange={(e) => setBehaviorSettings({ ...behaviorSettings, temperature: parseFloat(e.target.value) })}
                                className="w-20 accent-indigo-600 cursor-pointer h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none"
                              />
                            </div>
                            {/* App Master Info */}
                            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                                {language === "es" ? "Info Master de Teclingo" : "Teclingo Master Info"}
                              </label>
                              <textarea
                                rows={2}
                                value={behaviorSettings.appMasterInfo || ""}
                                onChange={(e) => setBehaviorSettings({ ...behaviorSettings, appMasterInfo: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-[10px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg font-mono text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-normal"
                                placeholder={language === "es" ? "Información clave de la app para alimentar la IA..." : "Key app details to feed the AI..."}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 5. TOEFL Simulator */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            📝 5. TOEFL Simulator
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Sección del Examen" : "Section Calibration"}</span>
                              <select
                                value={toolsSettings.toefl.testSection}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  toefl: { ...toolsSettings.toefl, testSection: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="all">{language === "es" ? "Examen Completo (All)" : "Full Exam (All)"}</option>
                                <option value="reading">Reading & Vocabulary</option>
                                <option value="listening">Listening Core</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Límite de Tiempo" : "Timer Cap (Mins)"}</span>
                              <input
                                type="number"
                                min={5}
                                max={180}
                                value={toolsSettings.toefl.timerLimit}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  toefl: { ...toolsSettings.toefl, timerLimit: parseInt(e.target.value) || 45 }
                                })}
                                className="w-14 px-2 py-0.5 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg text-right font-bold text-[10px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 6. Grammar Lab */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            🔬 6. Grammar Lab
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Proveedor del Motor" : "Engine Provider"}</span>
                              <select
                                value={toolsSettings.grammar.provider}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  grammar: { ...toolsSettings.grammar, provider: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                                <option value="Gemini 3.5 Flash">Gemini 3.5 Flash</option>
                                <option value="Llama-3-Groq">Llama-3-Groq (Super Fast)</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Sensibilidad" : "Strictness Level"}</span>
                              <select
                                value={toolsSettings.grammar.strictness}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  grammar: { ...toolsSettings.grammar, strictness: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="high">{language === "es" ? "Académica Alta" : "Academic (High)"}</option>
                                <option value="medium">{language === "es" ? "Comunicativa Media" : "Communicative (Medium)"}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 7. Reading Lab */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            📖 7. Reading Lab
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Género de Lecturas" : "Syllabus Category"}</span>
                              <select
                                value={toolsSettings.reading.category}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  reading: { ...toolsSettings.reading, category: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="technology">{language === "es" ? "Tecnología e IA" : "Tech & AI Papers"}</option>
                                <option value="engineering">{language === "es" ? "Ingeniería de Planta" : "Process Engineering"}</option>
                                <option value="academic">General TOEFL Reading</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Preguntas por Texto" : "Comprehension Questions"}</span>
                              <input
                                type="number"
                                min={3}
                                max={10}
                                value={toolsSettings.reading.questionCount}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  reading: { ...toolsSettings.reading, questionCount: parseInt(e.target.value) || 5 }
                                })}
                                className="w-14 px-2 py-0.5 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg text-right font-bold text-[10px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 8. Vocabulary Center */}
                        <div className="p-4 bg-gray-50 dark:bg-[#121316] border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[9px] block">
                            🗂️ 8. Vocabulary Center
                          </span>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Estilo del Juego" : "Study Method"}</span>
                              <select
                                value={toolsSettings.vocabulary.method}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  vocabulary: { ...toolsSettings.vocabulary, method: e.target.value }
                                })}
                                className="px-2.5 py-1 bg-white dark:bg-[#15161a] border border-gray-205 dark:border-gray-800 rounded-lg text-[10px]"
                              >
                                <option value="flashcards">{language === "es" ? "Tarjetas Inteligentes" : "Flashcards Deck"}</option>
                                <option value="quiz">Interactive Quiz</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-400">{language === "es" ? "Objetivo de Palabras" : "Daily Target Words"}</span>
                              <input
                                type="number"
                                min={5}
                                max={50}
                                value={toolsSettings.vocabulary.dailyWordsTarget}
                                onChange={(e) => setToolsSettings({
                                  ...toolsSettings,
                                  vocabulary: { ...toolsSettings.vocabulary, dailyWordsTarget: parseInt(e.target.value) || 10 }
                                })}
                                className="w-14 px-2 py-0.5 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-800 rounded-lg text-right font-bold text-[10px]"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 4: SYSTEM CONFIGS & OVERRIDES (SLIDERS, QA, ROLE SWITCHERS) */}
                  {activeSecretTab === "system" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-[#0e0f12] p-4 rounded-2xl border border-gray-150 dark:border-gray-850">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">{language === "es" ? "Entidad Creadora" : "Creator Entity"}</span>
                          <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 font-bold">Conceptos AI MX</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">{language === "es" ? "Versión del Core" : "Core Build Version"}</span>
                          <span className="font-mono text-xs font-black text-gray-750 dark:text-gray-300">v2.6.4-prod</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">{language === "es" ? "Rol de Usuario" : "User Role"}</span>
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 uppercase font-bold">
                            {currentUser?.role || "Guest"}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">{language === "es" ? "Pestaña Activa" : "Active Tab"}</span>
                          <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 uppercase font-bold">{activeTab}</span>
                        </div>
                      </div>

                      {/* Sliders for System Stats */}
                      <div className="bg-gray-50 dark:bg-[#0e0f12] p-4 rounded-2xl border border-gray-150 dark:border-gray-850 space-y-4">
                        <h4 className="text-[11px] font-black uppercase text-gray-950 dark:text-gray-150 tracking-wider flex items-center gap-1.5">
                          <Sliders size={13} className="text-indigo-500" />
                          {language === "es" ? "Manipulación de Estadísticas Real" : "Real-time Stats Override"}
                        </h4>

                        {/* Streak (Racha) Editor */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Flame size={16} className="text-orange-500" />
                            <div>
                              <span className="font-bold text-gray-750 dark:text-gray-300 block text-[11px]">{language === "es" ? "Racha Diaria" : "Daily Streak"}</span>
                              <span className="text-[10px] text-gray-400">{language === "es" ? "Días consecutivos" : "Consecutive days"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="1" 
                              max="999" 
                              value={userStats.streak} 
                              onChange={(e) => {
                                const newStreak = parseInt(e.target.value) || 1;
                                const updated = { ...userStats, streak: newStreak };
                                setUserStats(updated);
                                if (currentUser) {
                                  localStorage.setItem(`teclingo_user_${currentUser.email}_stats`, JSON.stringify(updated));
                                } else {
                                  localStorage.setItem("teclingo_guest_stats", JSON.stringify(updated));
                                }
                              }}
                              className="w-24 sm:w-32 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="font-mono font-bold text-gray-800 dark:text-gray-200 w-10 text-right">{userStats.streak}</span>
                          </div>
                        </div>

                        {/* Practices Editor */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-500" />
                            <div>
                              <span className="font-bold text-gray-750 dark:text-gray-300 block text-[11px]">{language === "es" ? "Prácticas Totales" : "Total Practices"}</span>
                              <span className="text-[10px] text-gray-400">{language === "es" ? "Sesiones completadas" : "Sessions completed"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="0" 
                              max="9999" 
                              value={userStats.totalPractices} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const updated = { ...userStats, totalPractices: val };
                                setUserStats(updated);
                                if (currentUser) {
                                  localStorage.setItem(`teclingo_user_${currentUser.email}_stats`, JSON.stringify(updated));
                                } else {
                                  localStorage.setItem("teclingo_guest_stats", JSON.stringify(updated));
                                }
                              }}
                              className="w-16 px-2 py-1 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-700 rounded-lg text-right font-mono font-bold text-gray-800 dark:text-gray-200"
                            />
                          </div>
                        </div>

                        {/* Grammar Editor */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            <div>
                              <span className="font-bold text-gray-750 dark:text-gray-300 block text-[11px]">{language === "es" ? "Chequeos de Gramática" : "Grammar Checks"}</span>
                              <span className="text-[10px] text-gray-400">{language === "es" ? "Análisis de textos con IA" : "AI text analyses"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="0" 
                              max="9999" 
                              value={userStats.grammarChecks || 0} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const updated = { ...userStats, grammarChecks: val };
                                setUserStats(updated);
                                if (currentUser) {
                                  localStorage.setItem(`teclingo_user_${currentUser.email}_stats`, JSON.stringify(updated));
                                } else {
                                  localStorage.setItem("teclingo_guest_stats", JSON.stringify(updated));
                                }
                              }}
                              className="w-16 px-2 py-1 bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-700 rounded-lg text-right font-mono font-bold text-gray-800 dark:text-gray-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Developer Roles & Factory Resets */}
                      <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-[11px] font-black uppercase text-gray-900 dark:text-gray-100 tracking-wider flex items-center gap-1.5">
                          <LockOpen size={13} className="text-indigo-500" />
                          {language === "es" ? "Simulación y Permisos Avanzados" : "Simulation & Advanced Access"}
                        </h4>

                        {/* Developer Admin Role Switcher */}
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/40 dark:border-indigo-900/30 rounded-2xl">
                          <div>
                            <span className="font-bold text-indigo-900 dark:text-indigo-300 block text-[11px]">
                              {language === "es" ? "Rol: Administrador Demo Master" : "Role: Demo Master Admin"}
                            </span>
                            <span className="text-[9px] text-indigo-500 block">
                              {language === "es" ? "Otorga todos los accesos del sistema y labs" : "Grants full authorization & testing powers"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                // Automatically sign in temporary user for dev testing
                                const devUser = { name: "Conceptos AI Tester", email: "dev@conceptosai.mx", role: "demo_master" };
                                setCurrentUser(devUser);
                                localStorage.setItem("teclingo_user", JSON.stringify(devUser));
                              } else {
                                const nextRole = currentUser.role === "demo_master" ? "demo" : "demo_master";
                                const updatedUser = { ...currentUser, role: nextRole };
                                setCurrentUser(updatedUser);
                                localStorage.setItem("teclingo_user", JSON.stringify(updatedUser));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              currentUser?.role === "demo_master"
                                ? "bg-indigo-600 text-white shadow-md"
                                : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                            }`}
                          >
                            {currentUser?.role === "demo_master" ? (language === "es" ? "¡ACTIVO!" : "ACTIVE!") : (language === "es" ? "ACTIVAR" : "ACTIVATE")}
                          </button>
                        </div>

                        {/* Sandbox Boost and Factory Reset Button Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              const boostedStats = {
                                ...userStats,
                                streak: 100,
                                totalPractices: 250,
                                grammarChecks: 85,
                              };
                              setUserStats(boostedStats);
                              if (currentUser) {
                                  localStorage.setItem(`teclingo_user_${currentUser.email}_stats`, JSON.stringify(boostedStats));
                              } else {
                                  localStorage.setItem("teclingo_guest_stats", JSON.stringify(boostedStats));
                              }
                            }}
                            className="py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles size={13} />
                            {language === "es" ? "Cargar Kit de Prueba (Racha 100)" : "Load QA Kit (Streak 100)"}
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(language === "es" ? "¿Seguro que deseas restablecer los ajustes de fábrica?" : "Are you sure you want to reset to default?")) {
                                localStorage.removeItem("teclingo_secret_kb_db");
                                localStorage.removeItem("teclingo_secret_behavior");
                                localStorage.removeItem("teclingo_secret_course_db");
                                localStorage.removeItem("teclingo_secret_tool_settings");
                                window.location.reload();
                              }
                            }}
                            className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash size={13} />
                            {language === "es" ? "Valores de Fábrica (Factory Reset)" : "Factory Reset Settings"}
                          </button>
                        </div>
                      </div>

                      {/* Company Signature */}
                      <div className="pt-4 border-t border-gray-150 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                        {language === "es"
                          ? "Impulsando el ecosistema tecnológico educativo mexicano desde Conceptos AI MX."
                          : "Fostering the Mexican educational technology ecosystem by Conceptos AI MX."}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: MESSAGING & NOTIFICATION CENTER SETTINGS */}
                  {activeSecretTab === "messages" && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-[#0e0f12] p-4 rounded-2xl border border-gray-150 dark:border-gray-850 space-y-4">
                        <h4 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                          <Megaphone size={13} />
                          {language === "es" ? "Administrar Mensajes Generales, Noticias y Updates" : "Manage General Messages, News & Updates"}
                        </h4>
                        <p className="text-[10px] text-gray-500">
                          {language === "es" 
                            ? "Los mensajes creados aquí aparecerán en tiempo real cuando los alumnos hagan clic en el ícono de campana (Bell) de la plataforma."
                            : "Messages created here will appear in real time when students click on the Bell icon across the platform."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* FORM: Create or Edit (2 Columns on MD) */}
                        <div className="md:col-span-2 space-y-4 bg-gray-50 dark:bg-[#0e0f12] p-4 rounded-2xl border border-gray-150 dark:border-gray-850">
                          <h5 className="font-extrabold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                            {notiForm.id 
                              ? (language === "es" ? "📝 Editar Mensaje" : "📝 Edit Message") 
                              : (language === "es" ? "➕ Nuevo Mensaje" : "➕ New Message")}
                          </h5>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">{language === "es" ? "Título" : "Title"}</label>
                              <input 
                                type="text"
                                value={notiForm.title}
                                onChange={(e) => setNotiForm({ ...notiForm, title: e.target.value })}
                                placeholder={language === "es" ? "Ej. Gran Actualización de Julio" : "e.g., Big July Update"}
                                className="w-full px-2.5 py-1.5 text-[11px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-850 rounded-xl text-gray-800 dark:text-gray-200"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">{language === "es" ? "Contenido / Cuerpo" : "Content / Body"}</label>
                              <textarea 
                                rows={3}
                                value={notiForm.content}
                                onChange={(e) => setNotiForm({ ...notiForm, content: e.target.value })}
                                placeholder={language === "es" ? "Detalles del anuncio para los estudiantes..." : "Announcement details for students..."}
                                className="w-full px-2.5 py-1.5 text-[11px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-850 rounded-xl text-gray-800 dark:text-gray-200"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">{language === "es" ? "Categoría" : "Category"}</label>
                                <select 
                                  value={notiForm.type}
                                  onChange={(e) => setNotiForm({ ...notiForm, type: e.target.value as any })}
                                  className="w-full px-2 py-1.5 text-[11px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-850 rounded-xl text-gray-800 dark:text-gray-200"
                                >
                                  <option value="info">Info (Azul)</option>
                                  <option value="success">Success (Verde)</option>
                                  <option value="warning">Warning (Ámbar)</option>
                                  <option value="update">Update (Indigo)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">{language === "es" ? "Fecha" : "Date"}</label>
                                <input 
                                  type="date"
                                  value={notiForm.date}
                                  onChange={(e) => setNotiForm({ ...notiForm, date: e.target.value })}
                                  className="w-full px-2 py-1.5 text-[11px] bg-white dark:bg-[#15161a] border border-gray-200 dark:border-gray-850 rounded-xl text-gray-800 dark:text-gray-200"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                              <input 
                                type="checkbox"
                                id="noti_active"
                                checked={notiForm.active}
                                onChange={(e) => setNotiForm({ ...notiForm, active: e.target.checked })}
                                className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500"
                              />
                              <label htmlFor="noti_active" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer">
                                {language === "es" ? "Anuncio Activo / Visible" : "Active / Visible Announcement"}
                              </label>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => {
                                  if (!notiForm.title.trim() || !notiForm.content.trim()) {
                                    alert(language === "es" ? "Por favor completa título y contenido" : "Please complete title and content");
                                    return;
                                  }

                                  if (notiForm.id) {
                                    // Edit
                                    setNotifications(prev => prev.map(n => n.id === notiForm.id ? { ...notiForm } : n));
                                  } else {
                                    // Add
                                    const newId = String(Date.now());
                                    setNotifications(prev => [
                                      { ...notiForm, id: newId },
                                      ...prev
                                    ]);
                                  }

                                  // Reset form
                                  setNotiForm({
                                    id: "",
                                    title: "",
                                    content: "",
                                    type: "update",
                                    date: new Date().toISOString().slice(0, 10),
                                    active: true
                                  });
                                }}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Save size={12} />
                                {notiForm.id ? (language === "es" ? "Guardar" : "Save") : (language === "es" ? "Publicar" : "Publish")}
                              </button>

                              {notiForm.id && (
                                <button
                                  onClick={() => {
                                    setNotiForm({
                                      id: "",
                                      title: "",
                                      content: "",
                                      type: "update",
                                      date: new Date().toISOString().slice(0, 10),
                                      active: true
                                    });
                                  }}
                                  className="px-3 py-2 bg-gray-200 dark:bg-gray-850 text-gray-600 dark:text-gray-450 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  {language === "es" ? "Cancelar" : "Cancel"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* LIST: Current Notifications (3 Columns on MD) */}
                        <div className="md:col-span-3 space-y-3">
                          <h5 className="font-extrabold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide flex items-center justify-between">
                            <span>{language === "es" ? "📋 Mensajes Existentes" : "📋 Existing Announcements"}</span>
                            <span className="text-[10px] text-indigo-500 font-mono font-bold">({notifications.length})</span>
                          </h5>

                          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                            {notifications.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 italic">
                                {language === "es" ? "No hay anuncios guardados." : "No saved announcements."}
                              </div>
                            ) : (
                              notifications.map((noti) => (
                                <div 
                                  key={noti.id}
                                  className={`p-3 rounded-xl border transition-all ${
                                    noti.active 
                                      ? "bg-white dark:bg-[#15161a] border-gray-150 dark:border-gray-850" 
                                      : "bg-gray-100/50 dark:bg-gray-900/30 border-dashed border-gray-200 dark:border-gray-800 opacity-60"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                          noti.type === "success" 
                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                            : noti.type === "warning"
                                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                            : noti.type === "update"
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                                        }`}>
                                          {noti.type}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-mono font-bold">{noti.date}</span>
                                        {!noti.active && (
                                          <span className="px-1.5 py-0.2 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-[8px] font-bold uppercase rounded-sm">
                                            {language === "es" ? "Inactivo" : "Draft"}
                                          </span>
                                        )}
                                      </div>
                                      <h6 className="font-extrabold text-xs text-gray-800 dark:text-gray-100">{noti.title}</h6>
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{noti.content}</p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setNotiForm({ ...noti });
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                                        title={language === "es" ? "Editar" : "Edit"}
                                      >
                                        <Sliders size={12} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, active: !n.active } : n));
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                        title={language === "es" ? "Alternar Estado" : "Toggle Visibility"}
                                      >
                                        <Info size={12} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm(language === "es" ? "¿Seguro que deseas eliminar este anuncio?" : "Are you sure you want to delete this?")) {
                                            setNotifications(prev => prev.filter(n => n.id !== noti.id));
                                          }
                                        }}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                        title={language === "es" ? "Eliminar" : "Delete"}
                                      >
                                        <Trash size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Signature */}
                      <div className="pt-4 border-t border-gray-150 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                        {language === "es"
                          ? "Canal de difusión administrado bajo estándares de Conceptos AI MX."
                          : "Broadcasting feed managed under Conceptos AI MX framework standards."}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: RAG KNOWLEDGE BASE & COMPLETE ARCHITECTURE */}
                  {activeSecretTab === "knowledge" && (
                    <div className="space-y-6">
                      {/* Intro Banner */}
                      <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Compass size={18} className="animate-spin-slow text-indigo-200" />
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                            {language === "es" ? "Base de Conocimiento RAG & Guía de Integración" : "RAG Knowledge Base & Integration Guide"}
                          </h4>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed">
                          {language === "es"
                            ? "Documentación oficial, patrones de arquitectura de integración completa backend + frontend y código fuente listo para el ecosistema TECLINGO AI."
                            : "Official documentation, complete backend + frontend integration architecture patterns, and source code ready for the TECLINGO AI ecosystem."}
                        </p>
                      </div>

                      {/* Sub tab selector */}
                      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl gap-1">
                        <button
                          onClick={() => setKnowledgeSubTab("architecture")}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                            knowledgeSubTab === "architecture"
                              ? "bg-white dark:bg-[#1a1b20] text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          🏗️ {language === "es" ? "Arquitectura" : "Architecture"}
                        </button>
                        <button
                          onClick={() => setKnowledgeSubTab("backend")}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                            knowledgeSubTab === "backend"
                              ? "bg-white dark:bg-[#1a1b20] text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          🐍 {language === "es" ? "Backend (FastAPI)" : "Backend (FastAPI)"}
                        </button>
                        <button
                          onClick={() => setKnowledgeSubTab("frontend")}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                            knowledgeSubTab === "frontend"
                              ? "bg-white dark:bg-[#1a1b20] text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          ⚛️ {language === "es" ? "Frontend (React)" : "Frontend (React)"}
                        </button>
                        <button
                          onClick={() => setKnowledgeSubTab("deploy")}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                            knowledgeSubTab === "deploy"
                              ? "bg-white dark:bg-[#1a1b20] text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          🚀 {language === "es" ? "Despliegue" : "Deploy"}
                        </button>
                      </div>

                      {/* SUB-TAB 1: ARCHITECTURE */}
                      {knowledgeSubTab === "architecture" && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-[#0e0f12] p-5 rounded-2xl border border-gray-150 dark:border-gray-850 space-y-3">
                            <h5 className="font-extrabold text-xs text-gray-800 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                              {language === "es" ? "Flujo de Arquitectura y Comunicación" : "Architecture & Communication Flow"}
                            </h5>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                              {language === "es"
                                ? "El sistema integra el frontend SPA (React + Vite + TanStack Query) con la API RESTful de FastAPI como compuerta para los microservicios de RAG, embeddings y orquestación con modelos como Llama-3 en Groq y pgvector en Supabase."
                                : "The system integrates the SPA frontend (React + Vite + TanStack Query) with FastAPI's RESTful API acting as a gateway for RAG, embeddings, and orchestration services powered by models like Llama-3 on Groq and pgvector on Supabase."}
                            </p>
                            <div className="relative">
                              <button
                                onClick={() => {
                                  const archText = `┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite + TanStack)                         │
│  ─────────────────────────────────────                      │
│  useTutor() hook  →  ChatTutor.tsx  →  Dashboard.tsx        │
│  useSearch()      →  SearchBar.tsx                          │
│  useExercise()    →  ExerciseGenerator.tsx                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TU BACKEND (API Gateway)                                   │
│  ─────────────────────────────                              │
│  • Auth middleware (JWT)                                    │
│  • Rate limiting por estudiante                             │
│  • Cache de respuestas frecuentes                           │
│  • Logs de interacciones                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TECLINGO ENGINE (FastAPI + Python)                         │
│  ─────────────────────────────────────                      │
│  POST /api/ask           →  Tutor response                  │
│  POST /api/correct       →  Error detection                 │
│  GET  /api/search        →  Semantic search                 │
│  GET  /api/concept/:code →  Concept detail                  │
│  GET  /api/path/:level   →  Learning path                  │
│  POST /api/exercise      →  Generate exercise               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE + GROQ                                            │
│  knowledge_nodes  •  concept_fragments  •  intents          │
│  examples  •  common_mistakes  •  faq  •  ai_prompts        │
│  pgvector (embeddings)  →  Groq (redacción)                 │
└─────────────────────────────────────────────────────────────┘`;
                                  navigator.clipboard.writeText(archText);
                                  setCopiedFile("architecture");
                                  setTimeout(() => setCopiedFile(null), 2000);
                                }}
                                className="absolute right-2 top-2 px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-[10px] text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-lg transition-all font-black cursor-pointer shadow-xs"
                              >
                                {copiedFile === "architecture" ? (language === "es" ? "¡Copiado!" : "Copied!") : (language === "es" ? "Copiar" : "Copy")}
                              </button>
                              <pre className="p-4 bg-gray-100 dark:bg-gray-950 rounded-xl overflow-x-auto text-[9px] font-mono text-gray-700 dark:text-gray-300 leading-tight border border-gray-150 dark:border-gray-850 whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite + TanStack)                         │
│  ─────────────────────────────────────                      │
│  useTutor() hook  →  ChatTutor.tsx  →  Dashboard.tsx        │
│  useSearch()      →  SearchBar.tsx                          │
│  useExercise()    →  ExerciseGenerator.tsx                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TU BACKEND (API Gateway)                                   │
│  ─────────────────────────────                              │
│  • Auth middleware (JWT)                                    │
│  • Rate limiting por estudiante                             │
│  • Cache de respuestas frecuentes                           │
│  • Logs de interacciones                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TECLINGO ENGINE (FastAPI + Python)                         │
│  ─────────────────────────────────────                      │
│  POST /api/ask           →  Tutor response                  │
│  POST /api/correct       →  Error detection                 │
│  GET  /api/search        →  Semantic search                 │
│  GET  /api/concept/:code →  Concept detail                  │
│  GET  /api/path/:level   →  Learning path                  │
│  POST /api/exercise      →  Generate exercise               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE + GROQ                                            │
│  knowledge_nodes  •  concept_fragments  •  intents          │
│  examples  •  common_mistakes  •  faq  •  ai_prompts        │
│  pgvector (embeddings)  →  Groq (redacción)                 │
└─────────────────────────────────────────────────────────────┘`}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#111216] border border-gray-150 dark:border-gray-850 p-4 rounded-xl space-y-2 shadow-2xs">
                              <h6 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                                {language === "es" ? "🎯 ¿Qué consigues con esto?" : "🎯 Key Achievements"}
                              </h6>
                              <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                <li className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span>
                                    <strong>{language === "es" ? "Respuestas Oficiales:" : "Official Answers:"}</strong>{" "}
                                    {language === "es"
                                      ? "Respaldadas por Supabase y Groq sin divagaciones falsas."
                                      : "Backed by Supabase and Groq without hallucinations."}
                                  </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span>
                                    <strong>{language === "es" ? "Análisis de Errores:" : "Error Diagnostics:"}</strong>{" "}
                                    {language === "es"
                                      ? "Búsqueda semántica inteligente de errores gramaticales comunes."
                                      : "Intelligent semantic search targeting frequent grammatical pitfalls."}
                                  </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span>
                                    <strong>{language === "es" ? "Ejercicios Dinámicos:" : "Dynamic Exercises:"}</strong>{" "}
                                    {language === "es"
                                      ? "Generación adaptativa de material pedagógico por nivel."
                                      : "Adaptive generation of study material aligned with CEFR levels."}
                                  </span>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-white dark:bg-[#111216] border border-gray-150 dark:border-gray-850 p-4 rounded-xl space-y-2 shadow-2xs">
                              <h6 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                                {language === "es" ? "📋 Checklist de Integración" : "📋 Integration Checklist"}
                              </h6>
                              <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                <li className="flex items-start gap-1.5">
                                  <span className="text-indigo-500 font-extrabold">1.</span>
                                  <span>{language === "es" ? "Configurar el Backend de FastAPI con credenciales de Supabase y Groq." : "Configure FastAPI backend with Supabase, Groq, and OpenAI environment credentials."}</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                  <span className="text-indigo-500 font-extrabold">2.</span>
                                  <span>{language === "es" ? "Establecer la capa del cliente API HTTP y el Hook de TanStack Query." : "Establish the HTTP API Client layer and integrate the TanStack Query hook."}</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                  <span className="text-indigo-500 font-extrabold">3.</span>
                                  <span>{language === "es" ? "Vincular el componente ChatTutor a la interfaz de alumno." : "Link the interactive ChatTutor component to the primary student layout."}</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 2: BACKEND (FASTAPI) */}
                      {knowledgeSubTab === "backend" && (
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/50 p-3.5 rounded-xl text-amber-800 dark:text-amber-400 text-[11px] flex gap-2">
                            <span className="text-base">💡</span>
                            <div>
                              <strong className="font-bold">{language === "es" ? "Nota de Configuración:" : "Setup Note:"}</strong>{" "}
                              {language === "es"
                                ? "Asegúrate de instalar FastAPI, Uvicorn, Pydantic, Groq y las dependencias asociadas listadas en requirements.txt en tu contenedor de Python."
                                : "Ensure that FastAPI, Uvicorn, Pydantic, Groq, and other dependencies declared in requirements.txt are installed in your Python environment."}
                            </div>
                          </div>

                          {/* File: main.py */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">/engine/main.py</span>
                              <button
                                onClick={() => {
                                  const codeMain = `"""
TECLINGO AI - API Engine
FastAPI que expone los endpoints para tu app React
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

# Importar el sistema RAG que ya construimos
from rag.pipeline import RAGPipeline
from engine.tutor import TECLINGOTutor, TutorResponse

load_dotenv()

app = FastAPI(
    title="TECLINGO AI Engine",
    version="1.0.0",
    description="API del tutor inteligente de TECLINGO AI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "https://webapptecligoversioncomercial.vercel.app",  # Producción
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tutor = TECLINGOTutor()

class AskRequest(BaseModel):
    query: str
    student_level: str = "B1"
    language: str = "es"
    session_id: Optional[str] = None

class AskResponse(BaseModel):
    answer: str
    concept_id: Optional[str] = None
    concept_title: Optional[str] = None
    confidence: float
    source: str  # 'intent' | 'fragment' | 'fallback'
    latency_ms: int
    references: List[dict]
    follow_up_questions: List[str] = []

class CorrectRequest(BaseModel):
    text: str
    student_level: str = "B1"
    language: str = "en"

class CorrectResponse(BaseModel):
    corrected_text: str
    errors_found: List[dict]
    explanation: str
    related_concepts: List[str]

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    fragment_types: Optional[List[str]] = None
    cefr_level: Optional[str] = None

class ExerciseRequest(BaseModel):
    concept_code: str
    exercise_type: str = "fill_blank"
    difficulty: str = "medium"
    quantity: int = 5

async def verify_auth(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    return {"student_id": "demo", "level": "B1"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "teclingo-engine",
        "version": "1.0.0",
    }

@app.post("/api/ask", response_model=AskResponse)
async def ask_tutor(
    req: AskRequest,
    student: dict = Depends(verify_auth),
):
    try:
        response = tutor.answer(
            query=req.query,
            student_level=req.student_level,
            language=req.language,
        )
        return AskResponse(
            answer=response.answer,
            concept_id=response.concept_id,
            concept_title=response.concept_topic,
            confidence=response.confidence,
            source=response.source,
            latency_ms=response.latency_ms,
            references=response.references,
            follow_up_questions=["¿Puedes darme más ejemplos?", "¿Cuáles son los errores más comunes?"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/correct", response_model=CorrectResponse)
async def correct_text(
    req: CorrectRequest,
    student: dict = Depends(verify_auth),
):
    try:
        result = tutor.correct_text(
            text=req.text,
            student_level=req.student_level,
            language=req.language,
        )
        return CorrectResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "engine.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )`;
                                  navigator.clipboard.writeText(codeMain);
                                  setCopiedFile("main_py");
                                  setTimeout(() => setCopiedFile(null), 2000);
                                }}
                                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-600 rounded-lg transition-all font-black cursor-pointer"
                              >
                                {copiedFile === "main_py" ? (language === "es" ? "¡Copiado!" : "Copied!") : (language === "es" ? "Copiar" : "Copy")}
                              </button>
                            </div>
                            <pre className="p-3 bg-gray-950 text-gray-200 text-[10px] font-mono rounded-xl overflow-y-auto max-h-[220px] leading-relaxed border border-gray-850">
{`# /engine/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

from rag.pipeline import RAGPipeline
from engine.tutor import TECLINGOTutor, TutorResponse

load_dotenv()
app = FastAPI(title="TECLINGO AI Engine", version="1.0.0")

# (Haga clic en 'Copiar' arriba para guardar el archivo completo)`}
                            </pre>
                          </div>

                          {/* requirements.txt & .env */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">requirements.txt</span>
                                <button
                                  onClick={() => {
                                    const codeReq = `fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
python-dotenv==1.0.1
psycopg2-binary==2.9.9
openai==1.51.0
groq==0.11.0
numpy==1.26.4`;
                                    navigator.clipboard.writeText(codeReq);
                                    setCopiedFile("req_txt");
                                    setTimeout(() => setCopiedFile(null), 2000);
                                  }}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-600 rounded-lg transition-all font-black cursor-pointer"
                                >
                                  {copiedFile === "req_txt" ? "¡Copiado!" : "Copiar"}
                                </button>
                              </div>
                              <pre className="p-3 bg-gray-950 text-gray-200 text-[10px] font-mono rounded-xl overflow-x-auto border border-gray-850">
{`fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
python-dotenv==1.0.1
psycopg2-binary==2.9.9
openai==1.51.0
groq==0.11.0
numpy==1.26.4`}
                              </pre>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">.env</span>
                                <button
                                  onClick={() => {
                                    const codeEnv = `# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres

# OpenAI (para embeddings)
OPENAI_API_KEY=sk-xxxxx

# Groq (para redacción)
GROQ_API_KEY=gsk_xxxxx

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173`;
                                    navigator.clipboard.writeText(codeEnv);
                                    setCopiedFile("env_txt");
                                    setTimeout(() => setCopiedFile(null), 2000);
                                  }}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-600 rounded-lg transition-all font-black cursor-pointer"
                                >
                                  {copiedFile === "env_txt" ? "¡Copiado!" : "Copiar"}
                                </button>
                              </div>
                              <pre className="p-3 bg-gray-950 text-gray-200 text-[10px] font-mono rounded-xl overflow-x-auto border border-gray-850">
{`SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-xxxxx
GROQ_API_KEY=gsk_xxxxx
ENVIRONMENT=development`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: FRONTEND (REACT) */}
                      {knowledgeSubTab === "frontend" && (
                        <div className="space-y-4">
                          {/* File: api.ts */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">/src/lib/api.ts</span>
                              <button
                                onClick={() => {
                                  const codeApi = `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class TeclingoAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: \`Bearer \${this.token}\` }),
      ...options.headers,
    };

    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || \`HTTP \${response.status}\`);
    }

    return response.json();
  }

  async ask(params: {
    query: string;
    student_level?: string;
    language?: string;
    session_id?: string;
  }) {
    return this.request<AskResponse>('/api/ask', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async correct(params: {
    text: string;
    student_level?: string;
    language?: string;
  }) {
    return this.request<CorrectResponse>('/api/correct', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async search(params: {
    query: string;
    top_k?: number;
    fragment_types?: string[];
    cefr_level?: string;
  }) {
    return this.request<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getConcept(nodeCode: string) {
    return this.request<Concept>(\`/api/concept/\${encodeURIComponent(nodeCode)}\`);
  }
}

export interface AskResponse {
  answer: string;
  concept_id: string | null;
  concept_title: string | null;
  confidence: number;
  source: string;
  latency_ms: number;
  references: Array<{
    concept_id: string;
    topic: string;
    level: string;
  }>;
  follow_up_questions: string[];
}

export interface CorrectResponse {
  corrected_text: string;
  errors_found: Array<{
    incorrect: string;
    correct: string;
    explanation: string;
    concept_code: string;
  }>;
  explanation: string;
  related_concepts: string[];
}

export interface SearchResponse {
  query: string;
  results: Array<{
    concept_id: string;
    title: string;
    node_code: string;
    cefr_level: string;
    category: string;
    similarity: number;
    preview: string;
  }>;
}

export interface Concept {
  id: string;
  node_code: string;
  title: string;
  cefr_level: string;
  category: string;
  description: string;
  explanation: string;
  formula: string;
  study_time_min: number;
  difficulty: string;
}

export const api = new TeclingoAPI();`;
                                  navigator.clipboard.writeText(codeApi);
                                  setCopiedFile("api_ts");
                                  setTimeout(() => setCopiedFile(null), 2000);
                                }}
                                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-600 rounded-lg transition-all font-black cursor-pointer"
                              >
                                {copiedFile === "api_ts" ? (language === "es" ? "¡Copiado!" : "Copied!") : (language === "es" ? "Copiar" : "Copy")}
                              </button>
                            </div>
                            <pre className="p-3 bg-gray-955 text-gray-200 text-[10px] font-mono rounded-xl overflow-y-auto max-h-[160px] leading-relaxed border border-gray-850">
{`// /src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class TeclingoAPI {
  // Manejador del cliente unificado de FastAPI...
}`}
                            </pre>
                          </div>

                          {/* Hook: useTutor.ts */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">/src/hooks/useTutor.ts</span>
                              <button
                                onClick={() => {
                                  const codeHook = `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type AskResponse } from '@/lib/api';

interface UseTutorOptions {
  studentLevel?: string;
  language?: string;
}

export function useTutor(options: UseTutorOptions = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<AskResponse, Error, string>({
    mutationFn: (query: string) =>
      api.ask({
        query,
        student_level: options.studentLevel || 'B1',
        language: options.language || 'es',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  return {
    ask: mutation.mutate,
    askAsync: mutation.mutateAsync,
    answer: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}`;
                                  navigator.clipboard.writeText(codeHook);
                                  setCopiedFile("hook_ts");
                                  setTimeout(() => setCopiedFile(null), 2000);
                                }}
                                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-600 rounded-lg transition-all font-black cursor-pointer"
                              >
                                {copiedFile === "hook_ts" ? (language === "es" ? "¡Copiado!" : "Copied!") : (language === "es" ? "Copiar" : "Copy")}
                              </button>
                            </div>
                            <pre className="p-3 bg-gray-955 text-gray-200 text-[10px] font-mono rounded-xl overflow-y-auto max-h-[165px] leading-relaxed border border-gray-850">
{`// /src/hooks/useTutor.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTutor(options = {}) { ... }`}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 4: DEPLOY */}
                      {knowledgeSubTab === "deploy" && (
                        <div className="space-y-4">
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/50 p-4 rounded-xl space-y-2">
                            <h6 className="font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                              {language === "es" ? "⚡ Comando de Verificación Rápida" : "⚡ Rapid Verification Command"}
                            </h6>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                              {language === "es"
                                ? "Verifica instantáneamente la orquestación bilingüe enviando un paquete de prueba al puerto del motor:"
                                : "Instantly test the bilingual model orchestration by sending a mock frame to the target local server:"}
                            </p>
                            <pre className="p-3 bg-gray-950 text-gray-200 font-mono text-[9px] rounded-lg overflow-x-auto select-all">
{`curl -X POST http://localhost:8000/api/ask \\
  -H "Content-Type: application/json" \\
  -d '{"query": "¿Cuándo uso Present Perfect?", "student_level": "B1"}'`}
                            </pre>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">docker-compose.yml</span>
                            <pre className="p-3 bg-gray-955 text-gray-200 font-mono rounded-xl text-[10px] border border-gray-850">
{`version: '3.8'
services:
  engine:
    build: ./engine
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_KEY=\${SUPABASE_KEY}
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - GROQ_API_KEY=\${GROQ_API_KEY}
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - engine`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discrete action button */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
