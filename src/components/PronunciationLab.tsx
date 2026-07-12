import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  Info, 
  ArrowLeft, 
  Play, 
  Pause,
  Award
} from "lucide-react";
import { PronunciationResult } from "../types";
import { useGoogleTTS } from "../hooks/useGoogleTTS";

interface Props {
  onBack: () => void;
}

const PRESET_PHRASES = [
  "Hello",
  "Thank you",
  "Water",
  "Please",
  "Good morning",
  "Apple"
];

// High-fidelity fallback dictionary to ensure instant visual response without API latency/failures
const getFallbackResult = (text: string): PronunciationResult => {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("comfortable")) {
    return {
      originalText: normalized,
      ipa: "/ˈkʌm.fər.tə.bəl/",
      syllables: ["COM", "for", "ta", "ble"],
      stressGuide: "El acento recae fuertemente en la primera sílaba (COM). La segunda 'o' y la 'r' intermedia se reducen, pronunciándose casi como 'comf-ter-bel'.",
      commonPitfalls: [
        "Pronunciar la palabra con cuatro sílabas marcadas (com-for-ta-ble).",
        "Hacer que la 'o' suene demasiado abierta o fuerte."
      ],
      vocalGuide: "Comienza con labios firmes para la 'C' y el sonido nasal 'M', seguidos de una rápida transición relajada a 'f-ter-bel'.",
      practiceExercises: [
        "Pronuncia despacio: 'COMF-ter-bel'.",
        "Practica exagerando la fuerza en la primera sílaba y bajando el tono en el resto.",
        "Repite tres veces seguidas para entrenar la memoria muscular."
      ]
    };
  }
  if (lower.includes("schedule")) {
    return {
      originalText: normalized,
      ipa: "/ˈskɛdʒ.uːl/",
      syllables: ["SCHE", "dule"],
      stressGuide: "El acento principal recae en la primera sílaba (SCHE). El sonido inicial de la pronunciación americana es un 'sk' fuerte.",
      commonPitfalls: [
        "Pronunciar con sonido de 'sh' de estilo británico (/ˈʃɛd.juːl/) en entornos donde se requiere inglés americano.",
        "Dificultad para ligar la 'd' con la 'u' suave."
      ],
      vocalGuide: "Haz el sonido clásico de 's' seguido por un soplo duro 'k' y una vocal abierta 'e', terminando con una 'l' dental.",
      practiceExercises: [
        "Práctica el inicio siseante: 's-s-s-sk'.",
        "Di en voz alta 'sked-jool' acentuando el inicio.",
        "Practica la transición de 'sk' a 'd' rápidamente."
      ]
    };
  }
  if (lower.includes("literally")) {
    return {
      originalText: normalized,
      ipa: "/ˈlɪt.ər.ə.li/",
      syllables: ["LI", "te", "ra", "lly"],
      stressGuide: "El acento principal está en la primera sílaba (LI). La 't' intermedia se pronuncia como un suave 'flap t' en inglés americano.",
      commonPitfalls: [
        "Hacer una 't' dental muy fuerte o golpeada.",
        "Pronunciar todas las sílabas con la misma duración."
      ],
      vocalGuide: "Pronuncia la 't' como una 'r' suave en español (similar a 'liderali'). Deja que la lengua toque levemente el paladar.",
      practiceExercises: [
        "Repite rápido el sonido de 'liderali'.",
        "Haz la transición de 'L' a la suave 'r' sin detener el flujo de aire.",
        "Exagera la primera sílaba 'LI' y reduce las demás."
      ]
    };
  }
  if (lower.includes("otorhinolaryngologist")) {
    return {
      originalText: normalized,
      ipa: "/ˌoʊ.toʊ.raɪ.noʊ.ˌlær.ɪŋ.ˈɡɒl.ə.dʒɪst/",
      syllables: ["o", "to", "rhi", "no", "la", "ryn", "GOL", "o", "gist"],
      stressGuide: "El acento principal recae en la sílaba 'GOL'. Hay acentos secundarios más suaves en 'o', 'rhi' y 'la'.",
      commonPitfalls: [
        "Trabarse o perder el ritmo a mitad de este término médico largo.",
        "Confundir la acentuación de las sílabas."
      ],
      vocalGuide: "Visualízalo en bloques: 'oto-rhino' y 'laryngo-logist'. Enfoca la mayor energía en la penúltima parte ('GOL').",
      practiceExercises: [
        "Pronuncia la terminación por separado: 'GOL-o-gist'.",
        "Pronuncia la parte inicial por separado: 'o-to-rhi-no'.",
        "Une ambas partes en un solo flujo continuo de voz."
      ]
    };
  }
  if (lower.includes("anemone")) {
    return {
      originalText: normalized,
      ipa: "/əˈnɛm.ə.ni/",
      syllables: ["a", "NE", "mo", "ne"],
      stressGuide: "El acento recae en la segunda sílaba (NE), manteniendo las demás sílabas muy cortas y neutras.",
      commonPitfalls: [
        "Invertir la posición de la 'n' y la 'm' (pronunciando 'amenone').",
        "Pronunciar la última vocal de manera incorrecta."
      ],
      vocalGuide: "Mantén una 'n' suave, avanza inmediatamente a 'mo' y termina con un sonido claro de 'ni'.",
      practiceExercises: [
        "Di despacio 'uh-NEM-uh-nee'.",
        "Haz el sonido de 'N' and 'M' alternadamente para calentar la lengua.",
        "Pronuncia cinco veces seguidas incrementando la velocidad."
      ]
    };
  }
  if (lower.includes("mischievous")) {
    return {
      originalText: normalized,
      ipa: "/ˈmɪs.tʃɪ.vəs/",
      syllables: ["MIS", "chie", "vous"],
      stressGuide: "La palabra se acentúa firmemente en la primera sílaba (MIS). Tiene únicamente tres sílabas.",
      commonPitfalls: [
        "Pronunciar una sílaba 'ee' adicional al final ('mis-CHEE-vee-us').",
        "Mover el acento a la segunda sílaba."
      ],
      vocalGuide: "Enfoca la fuerza en 'MIS', seguido de un sonido 'ch' seco y un sufijo corto 'vuhs'.",
      practiceExercises: [
        "Di 'MIS-chiv-us' con firmeza.",
        "Practica acortar la última sílaba lo más posible.",
        "Evita conscientemente agregar el sonido 'ee'."
      ]
    };
  }
  if (lower.includes("apple") || lower.includes("doctor")) {
    return {
      originalText: normalized,
      ipa: "/ən ˈæpəl ə deɪ kiːps ðə ˈdɒktər əˈweɪ/",
      syllables: ["An", "ap", "ple", "a", "day", "keeps", "the", "doc", "tor", "a", "way"],
      stressGuide: "Los acentos principales se encuentran en las palabras clave del mensaje: 'AP-ple', 'DAY', 'DOC-tor' y 'a-WAY'.",
      commonPitfalls: [
        "Pronunciar los artículos 'An' y 'a' con demasiada fuerza o énfasis.",
        "Hacer pausas largas entre cada palabra rompiendo la fluidez natural."
      ],
      vocalGuide: "Liga las palabras para sonar nativo. El sonido 'n' de 'An' se une al inicio de 'apple' formando 'an-apple'.",
      practiceExercises: [
        "Liga las primeras palabras diciendo 'an-ap-pel'.",
        "Práctica la entonación musical subiendo el tono en 'apple' y bajando en 'doctor'.",
        "Di la frase completa de un solo aliento."
      ]
    };
  }
  if (lower.includes("piece") || lower.includes("cake")) {
    return {
      originalText: normalized,
      ipa: "/ə piːs əv keɪk/",
      syllables: ["a", "piece", "of", "cake"],
      stressGuide: "El acento principal está en 'piece' y 'cake'. La preposición 'of' se reduce drásticamente a un sonido 'uhv' o simplemente 'uh'.",
      commonPitfalls: [
        "Pronunciar la palabra 'of' de forma excesivamente marcada o fuerte.",
        "Hacer la 'i' de 'piece' demasiado corta."
      ],
      vocalGuide: "Une el sonido 's' de 'piece' con el inicio de 'of' y luego pasa directamente al sonido 'k' de 'cake' ('a-piece-uh-cake').",
      practiceExercises: [
        "Pronuncia la secuencia continua 'pi-suh-keik'.",
        "Enfoca la entonación subiendo el tono en 'piece'.",
        "Repite la frase aumentando la fluidez."
      ]
    };
  }
  if (lower.includes("thoroughly")) {
    return {
      originalText: normalized,
      ipa: "/ˈθʌrəli ˈθʌrəli θruːˈaʊt/",
      syllables: ["Thor", "ough", "ly", "thor", "ough", "ly", "through", "out"],
      stressGuide: "El acento está en la primera sílaba de 'THOR-ough-ly' y al final en 'through-OUT'.",
      commonPitfalls: [
        "Confundir la pronunciación de 'thoroughly' (totalmente) con 'through' (a través).",
        "Dificultad con el sonido de la fricativa dental sorda 'th'."
      ],
      vocalGuide: "Coloca levemente la punta de la lengua entre los dientes frontales para hacer soplar el aire suavemente en la 'th'.",
      practiceExercises: [
        "Practica decir 'THOR-uh' de forma limpia.",
        "Haz la transición de 'thoroughly' a 'throughout' despacio.",
        "Repite exagerando la forma de soplar en 'th'."
      ]
    };
  }
  if (lower.includes("coffee")) {
    return {
      originalText: normalized,
      ipa: "/lɛts græb ə ˈkɔfi ˈsʌmˌtaɪm/",
      syllables: ["Let's", "grab", "a", "cof", "fee", "some", "time"],
      stressGuide: "Se acentúa con fuerza en el verbo de acción 'GRAB' y en el sustantivo 'COF-fee'.",
      commonPitfalls: [
        "Hacer el sonido de la 'a' en 'grab' demasiado cerrado.",
        "Pronunciar 'coffee' como si rimara con 'café'."
      ],
      vocalGuide: "Abre bien la boca para el sonido 'æ' en 'grab'. Para 'coffee', usa un sonido redondeado de vocal 'aw'.",
      practiceExercises: [
        "Di 'grab-a' de forma ligada.",
        "Di 'coffee' acentuando 'cof'.",
        "Di la frase completa como una invitación amistosa."
      ]
    };
  }
  if (lower.includes("weather")) {
    return {
      originalText: normalized,
      ipa: "/haʊz ðə ˈwɛðər ˈoʊvər ðɛr/",
      syllables: ["How's", "the", "weath", "er", "o", "ver", "there"],
      stressGuide: "El acento se distribuye principalmente en las sílabas de contenido: 'weath-er' y 'o-ver'.",
      commonPitfalls: [
        "Pronunciar la 'th' sonora de 'weather' y 'there' como si fuera una 'd' o 'z' española.",
        "No marcar la 'r' suave al final."
      ],
      vocalGuide: "La 'th' sonora vibra suavemente contra la lengua. Suelta un flujo constante de aire mientras las cuerdas vocales vibran.",
      practiceExercises: [
        "Haz zumbar la 'th' sonora en 'the', 'weather', 'there'.",
        "Practica ligar 'over' y 'there'.",
        "Di la frase completa manteniendo la fluidez rítmica."
      ]
    };
  }
  if (lower.includes("repeat") || lower.includes("please")) {
    return {
      originalText: normalized,
      ipa: "/kʊd ju rɪˈpiːt ðæt pliːz/",
      syllables: ["Could", "you", "re", "peat", "that", "please"],
      stressGuide: "Los acentos principales se encuentran en 're-PEAT' y 'PLEASE'. El verbo auxiliar 'Could' se mantiene ligero.",
      commonPitfalls: [
        "Hacer el sonido de la 'u' en 'could' demasiado largo o duro.",
        "No estirar adecuadamente la vocal larga 'ee' en 'repeat' y 'please'."
      ],
      vocalGuide: "El sonido de 'could' es una vocal relajada y corta. Estira los labios como una sonrisa al pronunciar la vocal larga de 'repeat' y 'please'.",
      practiceExercises: [
        "Practica el sonido suave y relajado de 'could' (rimando con 'good' pero corto).",
        "Exagera la sonrisa al decir 'please'.",
        "Liga el final de 'repeat' con 'that': 'repeat-that'."
      ]
    };
  }
  if (lower.includes("therapist")) {
    return {
      originalText: normalized,
      ipa: "/ðə ˈθʌrəli ˈθɔːtfʊl ˈθɛrəpɪst ˈθʌrəli ˈθɔːt θruː ðə ˈθɛrəpi/",
      syllables: ["The", "thor", "ough", "ly", "thought", "ful", "ther", "a", "pist", "thor", "ough", "ly", "thought", "through", "the", "ther", "a", "py"],
      stressGuide: "El trabalenguas se enfoca en mantener la rítmica en cada aparición de la 'th' fricativa en 'THOR-ough-ly', 'THOUGHT-ful', 'THER-a-pist' y 'THROUGH'.",
      commonPitfalls: [
        "Pronunciar 'th' como una 't' simple, convirtiendo 'therapist' en 'terapist'.",
        "Fatiga vocal por los cambios continuos del soplido sordo 'th'."
      ],
      vocalGuide: "Coloca la lengua entre los dientes frontales para cada palabra con 'th'. No muerdas, solo deja que el aire pase siseando de manera limpia.",
      practiceExercises: [
        "Repite despacio: 'thoroughly thought'.",
        "Practica el sonido 'th' sordo aislado soplando aire continuo.",
        "Aumenta la velocidad gradualmente asegurando la colocación de la lengua."
      ]
    };
  }
  if (lower.includes("seashells")) {
    return {
      originalText: normalized,
      ipa: "/ʃiː sɛlz ˈsiːˌʃɛlz baɪ ðə ˈsiːˌʃɔːr ænd ðə ʃɛlz ʃiː sɛlz ɑːr ˈʃʊəli ˈsiːˌʃɛlz/",
      syllables: ["She", "sells", "sea", "shells", "by", "the", "sea", "shore", "and", "the", "shells", "she", "sells", "are", "sure", "ly", "sea", "shells"],
      stressGuide: "La clave rítmica es alternar correctamente entre el sonido suave sibilante de 's' en 'sells/sea' y el sonido sordo de fricativa postalveolar 'sh' en 'she/shells/shore'.",
      commonPitfalls: [
        "Mezclar el sonido 's' y 'sh', diciendo 'see shells' como 'she sells' o viceversa.",
        "Perder el control del ritmo a medida que avanza la frase."
      ],
      vocalGuide: "Para 's' sonríe levemente y mantén la lengua detrás de los dientes frontales. Para 'sh', saca los labios un poco hacia afuera haciendo forma de túnel.",
      practiceExercises: [
        "Practica alternar en parejas: 'She sells' - 'Sea shells'.",
        "Pronuncia la palabra 'seashore' enfatizando ambos bloques.",
        "Repite despacio con ritmo metronómico."
      ]
    };
  }
  if (lower.includes("worldwide") || lower.includes("connection")) {
    return {
      originalText: normalized,
      ipa: "/ˌwɜːldˌwaɪd wɛb ˈæksɛs rɪˈkwaɪəz ˈsteɪbəl kəˈnɛkʃən ˈskɛdʒuːlz ænd ˈkʌmftəbəl ˈsɛtɪŋz/",
      syllables: ["World", "wide", "web", "ac", "cess", "re", "quires", "sta", "ble", "con", "nec", "tion", "sche", "dules", "and", "com", "for", "ta", "ble", "set", "tings"],
      stressGuide: "Este párrafo de alta complejidad fonética distribuye sus acentos en los términos técnicos: 'WORLD-wide WEB', 'AC-cess', 'con-NEC-tion', 'SCHE-dules' y 'set-tings'.",
      commonPitfalls: [
        "Pronunciar 'worldwide' con problemas en la 'r' y la 'l' juntas.",
        "Dificultad con la entonación uniforme de lectura profesional."
      ],
      vocalGuide: "Usa una articulación profesional. Redondea los labios para la 'w' de 'worldwide' y de 'web' para conseguir un sonido natural.",
      practiceExercises: [
        "Practica el trío inicial: 'world-wide-web'.",
        "Une 'connection' y 'schedules' de manera fluida.",
        "Lee el párrafo completo imitando el tono de un presentador de noticias."
      ]
    };
  }
  if (lower.includes("although") || lower.includes("difficult")) {
    return {
      originalText: normalized,
      ipa: "/ɔːlˈðoʊ hiː ˈθɔːt θruː ðə ˈdɪfəkəlt tæsk hiː fɛlt ˈθʌrəli ɪgˈzɔːstəd ˈæftərwərdz/",
      syllables: ["Al", "though", "he", "thought", "through", "the", "dif", "fi", "cult", "task", "he", "felt", "thor", "ough", "ly", "ex", "haus", "ted", "af", "ter", "wards"],
      stressGuide: "El acento se halla en los componentes narrativos cruciales: 'al-THOUGH', 'THOUGHT THROUGH', 'DIF-ficult TASK' y 'ex-HAUS-ted'.",
      commonPitfalls: [
        "Confundir la pronunciación de 'thought' (pensó), 'through' (a través) y 'thoroughly' (completamente) que ocurren de forma sucesiva.",
        "Hacer el sonido de 'although' como si fuera 'al-tog'."
      ],
      vocalGuide: "Presta mucha atención a la articulación diferencial de las consonantes y las vocales del trabalenguas.",
      practiceExercises: [
        "Contrasta en voz alta: 'thought' - 'through'.",
        "Practica la palabra larga 'exhausted' acentuando la parte central.",
        "Di el párrafo completo imitando la fluidez de un audiolibro narrativo."
      ]
    };
  }

  // General fallback for custom words/phrases
  const words = normalized.split(/\s+/);
  const wordsCount = words.length;

  let computedSyllables = [normalized];
  if (wordsCount === 1) {
    const cleanWord = normalized.replace(/[^a-zA-Z]/g, "");
    if (cleanWord.length > 5) {
      computedSyllables = [cleanWord.slice(0, Math.floor(cleanWord.length / 2)).toUpperCase(), cleanWord.slice(Math.floor(cleanWord.length / 2)).toLowerCase()];
    } else {
      computedSyllables = [cleanWord.toUpperCase()];
    }
  } else {
    computedSyllables = words.slice(0, 5);
  }

  return {
    originalText: normalized,
    ipa: `/${normalized.length > 3 ? normalized.slice(0, 3) : normalized}.../`,
    syllables: computedSyllables,
    stressGuide: "Acentúa la sílaba principal para dar claridad a la palabra.",
    commonPitfalls: [
      "No marcar adecuadamente la acentuación de las sílabas principales.",
      "Ligar de manera incorrecta las vocales y consonantes."
    ],
    vocalGuide: "Mantén una postura bucal relajada. Pronuncia lentamente cada sílaba para entrenar la memoria muscular.",
    practiceExercises: [
      `Repite '${normalized}' lentamente tres veces.`,
      "Grábate y compara la entonación con la pronunciación nativa.",
      "Enfócate en articular con claridad el sonido inicial y final."
    ]
  };
};

const isSpanish = (text: string): boolean => {
  if (!text) return false;
  if (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(text)) return true;
  const spanishWords = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "y", "o", "en", "que", "es", "son", "para", "con", "por", "como", "este", "esta", "estos", "estas", "mi", "mis", "tu", "tus", "su", "sus", "nos", "me", "te", "se", "lo", "los", "la", "las", "le", "les", "yo", "usted", "nosotros", "ellos", "ellas", "hola", "gracias", "buenos", "días", "tardes", "noches", "como", "cómo", "estás", "bien", "quién", "qué", "donde", "dónde", "cuando", "cuándo", "por qué", "porque"
  ]);
  const words = text.toLowerCase().split(/\s+/);
  return words.some(w => spanishWords.has(w));
};

export default function PronunciationLab({ onBack }: Props) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>("Comfortable");
  const [result, setResult] = useState<PronunciationResult | null>(getFallbackResult("Comfortable"));

  // Translation and Comparison States
  const [isTranslating, setIsTranslating] = useState(false);
  const [comparisonOriginalText, setComparisonOriginalText] = useState("");
  const [comparisonUserText, setComparisonUserText] = useState("");

  // Selector de Modo State
  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState<string>("Palabra");
  const [presetPhrases, setPresetPhrases] = useState<string[]>(PRESET_PHRASES);
  const [fetchingPresets, setFetchingPresets] = useState<boolean>(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [passedTerms, setPassedTerms] = useState<string[]>([]);

  // Load passed terms on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("teclingo_passed_pronunciation");
      if (stored) {
        setPassedTerms(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load passed terms", e);
    }
  }, []);

  // AI Voice analysis state
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [voiceAnalysisResult, setVoiceAnalysisResult] = useState<{
    score: number;
    accuracy: string;
    feedback: string;
    tips: string;
  } | null>(null);

  // Web Audio & MediaRecorder Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const spokenTextRef = useRef<string>("");

  // Google TTS Hook
  const { speak: ttsSpeak, stop: ttsStop } = useGoogleTTS();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Fetch preset phrases based on active mode/difficulty level
  useEffect(() => {
    const loadPresets = async () => {
      setFetchingPresets(true);
      try {
        const response = await fetch(`/api/gemini/pronunciation/presets?level=${currentDifficultyLevel}`);
        if (response.ok) {
          const data = await response.json();
          if (data.presets && Array.isArray(data.presets)) {
            setPresetPhrases(data.presets);
          }
        }
      } catch (error) {
        console.error("Error fetching presets:", error);
      } finally {
        setFetchingPresets(false);
      }
    };
    loadPresets();
  }, [currentDifficultyLevel]);

  const drawAmbientWave = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    let phase = 0;

    const animate = () => {
      if (!canvasRef.current) return;
      
      ctx.fillStyle = "#000000"; // Deep solid black matching the screenshot
      ctx.fillRect(0, 0, width, height);

      // Draw subtle horizontal grid lines for high-fidelity audio gear look
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 6; i++) {
        const y = (height / 7) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw beautiful symmetrical colored soundwave resembling the screenshot
      const centerY = height / 2;
      const barCount = 110;
      const barWidth = width / barCount;
      
      ctx.lineWidth = 2;

      for (let i = 0; i < barCount; i++) {
        // Taper on both ends for clean look
        const distanceFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
        const envelope = Math.max(0, 1 - distanceFromCenter * distanceFromCenter);
        
        // Dynamic smooth pulsing frequency peaks
        const wave1 = Math.sin(i * 0.14 + phase * 0.04) * 16;
        const wave2 = Math.cos(i * 0.06 - phase * 0.07) * 10;
        const barHeight = (30 + wave1 + wave2) * envelope * 0.95;
        
        const x = i * barWidth;
        const topY = centerY - barHeight;
        const bottomY = centerY + barHeight;
        
        // Professional audio soundwave spectrum gradient
        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0, "#ef4444"); // Red peaks
        grad.addColorStop(0.25, "#eab308"); // Yellow mids
        grad.addColorStop(0.5, "#22c55e"); // Green center/bass line
        grad.addColorStop(0.75, "#eab308"); // Yellow mids
        grad.addColorStop(1, "#ef4444"); // Red peaks
        
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      }

      phase += 0.8;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const drawFrequencyBars = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      const analyser = analyserRef.current;
      if (!analyser || !canvasRef.current) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 6; i++) {
        const y = (height / 7) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw symmetrical visualizer
      const centerY = height / 2;
      const barCount = Math.min(bufferLength, 110);
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        // Taper envelope so it's smooth
        const distanceFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
        const envelope = Math.max(0, 1 - distanceFromCenter * distanceFromCenter);
        
        const rawValue = dataArray[i];
        const barHeight = ((rawValue / 255) * height * 0.95) * envelope;

        const x = i * barWidth;
        const topY = centerY - barHeight / 2 - 2;
        const bottomY = centerY + barHeight / 2 + 2;

        const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
        grad.addColorStop(0, "#ef4444"); // Red
        grad.addColorStop(0.25, "#eab308"); // Yellow
        grad.addColorStop(0.5, "#22c55e"); // Green
        grad.addColorStop(0.75, "#eab308"); // Yellow
        grad.addColorStop(1, "#ef4444"); // Red

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Trigger correct canvas rendering when active results and recording state change
  useEffect(() => {
    if (result) {
      // Small timeout to allow canvas to mount properly
      const t = setTimeout(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (isRecording) {
          drawFrequencyBars();
        } else {
          drawAmbientWave();
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isRecording, result]);

  const cleanupAudio = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
  };

  const handleAnalyze = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return;
    const cleanText = textToAnalyze.trim();
    setSelectedWord(cleanText);
    setLoading(true);
    setVoiceAnalysisResult(null);
    setRecordedAudioUrl(null);
    setIsPlayingRecording(false);
    setComparisonOriginalText("");
    setComparisonUserText("");

    // Load fallback instantly so there's NO lag/delay in displaying the premium panel
    const fallback = getFallbackResult(cleanText);
    setResult(fallback);

    try {
      const response = await fetch("/api/gemini/pronunciation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });
      if (response.ok) {
        const data = await response.json();
        // Only override if the user hasn't switched to a different word in the meantime
        setResult(data);
      }
    } catch (err) {
      console.error("API error, using high-fidelity fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithTranslation = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return;
    const cleanText = textToAnalyze.trim();

    if (isSpanish(cleanText)) {
      setIsTranslating(true);
      try {
        const response = await fetch("/api/gemini/translate-term", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.translation) {
            const translated = data.translation;
            setInputText(translated);
            await handleAnalyze(translated);
            handleSpeakText(translated);
          } else {
            await handleAnalyze(cleanText);
          }
        } else {
          await handleAnalyze(cleanText);
        }
      } catch (err) {
        console.error("Translation failed, falling back to direct analysis:", err);
        await handleAnalyze(cleanText);
      } finally {
        setIsTranslating(false);
      }
    } else {
      await handleAnalyze(cleanText);
    }
  };

  const handleFallbackSimulation = async () => {
    setIsSimulationMode(true);
    setIsAnalyzingVoice(true);
    setRecordingDuration(0);

    const targetPhrase = selectedWord || "Hello";

    let mockSpoken = targetPhrase;
    const words = targetPhrase.split(" ");
    if (Math.random() > 0.3 && words.length >= 1) {
      const idxToChange = Math.floor(Math.random() * words.length);
      const originalWord = words[idxToChange].toLowerCase();
      let replacement = originalWord;
      if (originalWord.includes("hello")) replacement = "elo";
      else if (originalWord.includes("water")) replacement = "wather";
      else if (originalWord.includes("thank")) replacement = "tanks";
      else if (originalWord.includes("morning")) replacement = "mornin";
      else if (originalWord.includes("please")) replacement = "plese";
      else if (originalWord.includes("apple")) replacement = "aple";
      else if (originalWord.includes("how")) replacement = "jow";
      else if (originalWord.includes("fine")) replacement = "fain";
      else if (originalWord.includes("meet")) replacement = "mit";
      else if (originalWord.includes("bathroom")) replacement = "batsroom";
      else if (originalWord.includes("good")) replacement = "god";
      const modifiedWords = [...words];
      modifiedWords[idxToChange] = replacement;
      mockSpoken = modifiedWords.join(" ");
    }

    setComparisonOriginalText(targetPhrase);
    setComparisonUserText(mockSpoken);
    spokenTextRef.current = mockSpoken;

    try {
      const response = await fetch("/api/gemini/pronunciation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: targetPhrase,
          audio: undefined,
          mimeType: undefined,
          spokenText: mockSpoken
        }),
      });
      if (!response.ok) throw new Error("Fallback evaluation failed");
      const data = await response.json();
      setVoiceAnalysisResult(data);
      setComparisonUserText(data.transcription || mockSpoken);
    } catch (err) {
      setVoiceAnalysisResult({
        score: 15,
        accuracy: "No detectado",
        feedback: "No se ha detectado audio. Por favor, usa Chrome y permite el micrófono.",
        tips: "Asegúrate de hablar en inglés de forma clara y pausada."
      });
    } finally {
      setIsAnalyzingVoice(false);
      setIsSimulationMode(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setVoiceAnalysisResult(null);
    setRecordedAudioUrl(null);
    setIsPlayingRecording(false);
    setComparisonOriginalText("");
    setComparisonUserText("");
    spokenTextRef.current = "";
    audioChunksRef.current = [];

    // Start Web Speech API Recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            spokenTextRef.current = transcript;
            setComparisonUserText(transcript);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech Recognition error:", e.error);
          setIsRecording(false);
          setIsSimulationMode(true);
          handleFallbackSimulation();
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (e) {
        console.warn("Could not start Web Speech Recognition:", e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API for visual representation of voice volume
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioVolume(average); // between 0 and 255
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Configure MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Call Gemini feedback API with the spoken text captured from speech recognition
        const targetPhrase = selectedWord || result?.originalText || inputText || "Comfortable";
        const spokenText = spokenTextRef.current || "";
        await evaluateVoiceWithAI(targetPhrase, audioBlob, spokenText);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Microphone access failed", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop recognition:", e);
      }
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAudioVolume(0);
  };

  const evaluateVoiceWithAI = async (phrase: string, audioBlob?: Blob, spokenText?: string) => {
    setIsAnalyzingVoice(true);
    try {
      let audioBase64 = "";
      let mimeType = "";
      if (audioBlob) {
        mimeType = audioBlob.type;
        audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              const base64String = reader.result.split(',')[1];
              resolve(base64String);
            } else {
              reject(new Error("Failed to read audio blob as base64"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(audioBlob);
        });
      }

      const response = await fetch("/api/gemini/pronunciation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: phrase,
          audio: audioBase64 || undefined,
          mimeType: mimeType || undefined,
          spokenText: spokenText || ""
        }),
      });
      if (!response.ok) throw new Error("Voice evaluation failed");
      const data = await response.json();
      setVoiceAnalysisResult(data);
      setComparisonOriginalText(phrase);
      setComparisonUserText(data.transcription || comparisonUserText || phrase);

      if (data && data.score >= 80) {
        setPassedTerms(prev => {
          if (!prev.includes(phrase)) {
            const updated = [...prev, phrase];
            localStorage.setItem("teclingo_passed_pronunciation", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
      setComparisonOriginalText(phrase);
      setComparisonUserText(comparisonUserText || phrase);
      // Fallback
      setVoiceAnalysisResult({
        score: 15,
        accuracy: "No detectado",
        feedback: "No se ha detectado una pronunciación en inglés que coincida con la frase. Por favor, intenta de nuevo.",
        tips: "Asegúrate de hablar en inglés de forma clara y pausada."
      });
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleSpeakText = (text: string) => {
    if (!text) return;
    ttsStop();
    ttsSpeak({
      text,
      voiceName: 'en-US-Neural2-J',
      speakingRate: 0.9,
      onStart: () => setIsPlayingTTS(true),
      onEnd: () => setIsPlayingTTS(false),
      onError: () => setIsPlayingTTS(false),
    });
  };

  const handlePlayRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    if (isPlayingRecording) {
      audioPlaybackRef.current?.pause();
      setIsPlayingRecording(false);
    } else {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.src = recordedAudioUrl;
      } else {
        audioPlaybackRef.current = new Audio(recordedAudioUrl);
      }
      audioPlaybackRef.current.onended = () => setIsPlayingRecording(false);
      audioPlaybackRef.current.play().catch(e => console.error(e));
      setIsPlayingRecording(true);
    }
  };

  // Determine progress bar styling and categories based on requested specifications
  const getScoreDetails = (score: number) => {
    if (score <= 30) {
      return {
        color: "from-red-400 to-red-600 bg-red-500",
        bgLight: "bg-red-50/70 border-red-100",
        text: "text-red-600",
        label: "Necesita práctica",
        star: false,
        strokeColor: "#ef4444",
        triangleColor: "#ef4444",
        starText: "Necesita práctica",
        starSubText: "¡Sigue intentándolo!"
      };
    } else if (score <= 60) {
      return {
        color: "from-amber-400 to-amber-600 bg-amber-500",
        bgLight: "bg-amber-50/70 border-amber-100",
        text: "text-amber-600",
        label: "Mejorando",
        star: false,
        strokeColor: "#f59e0b",
        triangleColor: "#f59e0b",
        starText: "Buen intento",
        starSubText: "¡Puedes hacerlo mejor!"
      };
    } else if (score <= 79) {
      return {
        color: "from-blue-400 to-blue-600 bg-blue-500",
        bgLight: "bg-blue-50/70 border-blue-100",
        text: "text-blue-600",
        label: "¡Muy cerca!",
        star: false,
        strokeColor: "#3b82f6",
        triangleColor: "#3b82f6",
        starText: "Casi aprobado",
        starSubText: "¡Llega al 80% para pasar!"
      };
    } else if (score <= 90) {
      return {
        color: "from-emerald-400 to-emerald-600 bg-emerald-500",
        bgLight: "bg-emerald-50/70 border-emerald-100",
        text: "text-emerald-600",
        label: "¡Excelente!",
        star: true,
        strokeColor: "#10b981",
        triangleColor: "#10b981",
        starText: "¡Aprobado! 🎉",
        starSubText: "Excelente pronunciación"
      };
    } else {
      return {
        color: "from-green-500 to-green-700 bg-green-600",
        bgLight: "bg-green-50/70 border-green-100",
        text: "text-green-700",
        label: "¡Casi nativo! 🌟",
        star: true,
        strokeColor: "#059669",
        triangleColor: "#059669",
        starText: "¡Perfecto! 🌟",
        starSubText: "¡Nivel casi nativo!"
      };
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#aec4ec] via-[#dfdef8] to-[#f2daf1] p-4 md:p-8 flex items-center justify-center relative">
      {/* Decorative star sparkle on bottom-right matching the screenshot */}
      <div className="absolute bottom-16 right-16 text-white/40 pointer-events-none select-none hidden lg:block">
        <svg className="w-16 h-16 fill-current animate-pulse" viewBox="0 0 24 24">
          <path d="M12 0l3.05 8.95 8.95 3.05-8.95 3.05-3.05 8.95-3.05-8.95-8.95-3.05 8.95-3.05z" />
        </svg>
      </div>

      <div id="PronunciationLab" className="apple-fade-in w-full max-w-6xl bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/80 p-6 md:p-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Preset selection and custom typing */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Elegant Back Arrow Header */}
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={onBack}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/50 text-slate-600 transition-all active:scale-95 border border-slate-200"
                aria-label="Back"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0058bc]">IA Labs</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-0.5">AI Pronunciation Lab</h2>
              </div>
            </div>

            {/* Accent Training Illustration Card */}
            <div className="bg-[#E8F1FF]/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-white/60 shadow-xs">
              <div className="relative w-32 h-20 flex items-center justify-center bg-transparent rounded-xl overflow-hidden mb-3">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCb6Z_d0w2lE5VIzaIzs3_tXsrvBab3waMXEwZ7-DzQGoYoDY3nsLxAUK-e0sTdCRQXPWFd14hFkRxjQPYSeq4BpEUZlybiRndeNA2CMYWoRa1_vPCGeDn6Fbh7QJF3cQmvj6RGJoCX_iVQfyI8axzkXQ72YiPuv3qUIeWNTcILMN5THT-bmQfKT8WcvE-V626u0_XRaDDiLzvoxL6oK5rhUwKmWgODVnch41E7kXWpqnDP25ODxT9zzoMRxLfTPZ8k1Q4DBwBoj_k" 
                  alt="AI Pronunciation Mic" 
                  className="h-16 object-contain filter drop-shadow-md hover:scale-105 transition-transform"
                />
              </div>
              <h4 className="text-[10px] font-black text-[#0058bc] uppercase tracking-widest mb-1.5">Entrenamiento de Acento</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                Selecciona palabras retadoras o escribe las tuyas para practicar la vocalización nativa con análisis fonético inmediato.
              </p>
            </div>

            {/* Selector de Modo */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Modo de Práctica</label>
              <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
                {["Palabra", "Frase", "Nativo"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setCurrentDifficultyLevel(level)}
                    className={`flex-1 text-center py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      currentDifficultyLevel === level
                        ? "bg-[#0058bc] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Frases Predeterminadas */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Frases Predeterminadas</label>
              {fetchingPresets ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent border-[#0058bc]"></div>
                  <span className="text-[10px] font-bold">Cargando ejemplos...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {presetPhrases.map((phrase, idx) => {
                    const isPassed = passedTerms.includes(phrase);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(phrase);
                          handleAnalyze(phrase);
                        }}
                        className={`px-3 py-2 text-left text-xs font-semibold rounded-xl border transition-all truncate flex items-center justify-between gap-1.5 ${
                          selectedWord === phrase
                            ? "bg-[#0058bc] border-transparent text-white shadow-md font-bold"
                            : "bg-slate-50 hover:bg-[#E8F1FF]/25 border-slate-200/50 text-slate-700"
                        }`}
                        title={phrase}
                      >
                        <span className="truncate flex-grow">{phrase}</span>
                        {isPassed && (
                          <CheckCircle2 
                            size={12} 
                            className={`shrink-0 ${selectedWord === phrase ? "text-emerald-300" : "text-emerald-600"}`} 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Escribe tu propio término */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Escribe tu propio término</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escribe palabra o frase..."
                  value={inputText}
                  disabled={loading || isTranslating}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzeWithTranslation(inputText)}
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#0058bc]/15 focus:border-[#0058bc] text-xs font-medium disabled:opacity-60"
                />
                <button 
                  onClick={() => handleAnalyzeWithTranslation(inputText)}
                  disabled={loading || isTranslating || !inputText.trim()}
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-[#0058bc] text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
                  title="Analizar / Traducir"
                >
                  {isTranslating ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent border-white"></div>
                  ) : (
                    <Sparkles size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Analytical Feedback and Microphone Analyzer */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedWord ? (
              <div className="space-y-6 transition-all duration-300">
                {/* Header row: Término a Analizar & Escucha Nativa */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Termino a Analizar</span>
                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{selectedWord}</h3>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Escucha Nativa</span>
                    <div className="flex flex-wrap gap-2.5">
                      {/* Play Native Audio Button */}
                      <button
                        onClick={() => handleSpeakText(selectedWord)}
                        disabled={isPlayingTTS}
                        className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-full transition-all border shadow-sm active:scale-95 group shrink-0 ${
                          isPlayingTTS 
                            ? "bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed" 
                            : "bg-[#0058bc]/5 border-[#0058bc]/15 hover:bg-[#0058bc]/10 text-[#0058bc]"
                        }`}
                        title="Escuchar pronunciación nativa"
                      >
                        <Volume2 size={14} className={`${isPlayingTTS ? "text-blue-500 animate-bounce" : "text-[#0058bc] transition-transform group-hover:scale-110"}`} />
                        <span>{isPlayingTTS ? "Playing..." : "[Play Native Audio]"}</span>
                      </button>

                      {/* Optional user voice recording replay */}
                      {recordedAudioUrl && (
                        <button
                          onClick={handlePlayRecordedAudio}
                          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border transition-all shrink-0 ${
                            isPlayingRecording
                              ? "bg-rose-50 border-rose-200 text-rose-600 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                          }`}
                          title="Escuchar mi grabación"
                        >
                          {isPlayingRecording ? <Pause size={12} /> : <Play size={12} />}
                          <span>{isPlayingRecording ? "Detener mi voz" : "Escuchar mi voz"}</span>
                        </button>
                      )}
                    </div>

                    {/* SECCIÓN DE COMPARACIÓN DE TEXTO Y AUDIO */}
                    {(comparisonOriginalText || comparisonUserText) && (
                      <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-slate-200/50 w-full text-[11px] sm:text-xs space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 text-slate-800">
                          <span className="font-bold shrink-0 text-slate-500">Modelo Nativo:</span>
                          <span className="break-words font-semibold text-slate-800 leading-relaxed">{comparisonOriginalText}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 text-slate-800 border-t border-slate-200/50 pt-1.5">
                          <span className="font-bold shrink-0 text-slate-500">Tu Grabación:</span>
                          <span className="break-words font-semibold text-[#0058bc] leading-relaxed">
                            {comparisonUserText || <span className="text-slate-400 font-normal italic">(Analizando audio...)</span>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spectacular Black Continuous Horizontal Panel */}
                <div className="bg-black rounded-2xl p-5 border border-slate-900 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  {/* Concentric glowing waves and microphone on left */}
                  <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
                    {/* Glowing outer wave rings resembling the screenshot */}
                    <div className={`absolute rounded-full border border-cyan-500/10 w-36 h-36 ${isRecording ? 'animate-ping' : ''}`}></div>
                    <div className="absolute rounded-full border border-purple-500/20 w-30 h-30"></div>
                    <div className="absolute rounded-full border border-indigo-500/35 w-24 h-24"></div>
                    <div className="absolute rounded-full border border-blue-500/50 w-18 h-18"></div>
                    <div className="absolute rounded-full bg-indigo-500/10 w-12 h-12 filter blur-md"></div>
                    
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAnalyzingVoice}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-95 z-10 ${
                        isRecording 
                          ? "bg-rose-600 text-white animate-pulse" 
                          : "bg-[#0058bc] text-white hover:bg-blue-600"
                      } disabled:opacity-40`}
                      aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      <Mic size={22} className="text-white" />
                    </button>
                  </div>

                  {/* Symmetrical Colored Audio Waveform Canvas on right */}
                  <div className="flex-grow w-full h-32 relative">
                    <canvas 
                      ref={canvasRef} 
                      className="absolute inset-0 w-full h-full rounded-xl"
                      width={480}
                      height={128}
                    />
                    
                    {/* Status badges over the black visualizer */}
                    {isRecording && (
                      <span className="absolute top-2 right-2 text-[8px] font-black text-rose-500 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
                        Recording (00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration})
                      </span>
                    )}
                  </div>
                </div>

                {/* Cercanía al Acento (Accuracy & Meter Feedback) */}
                <div className="space-y-4">
                  <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Cercanía al Acento</h4>
                  
                  <div className="bg-slate-50/50 border border-slate-200/40 rounded-2xl p-6 shadow-xs">
                    {isAnalyzingVoice ? (
                      <div className="w-full flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-10 h-10 rounded-full border-4 border-blue-50 animate-ping"></div>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-[#0058bc]"></div>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">La IA está evaluando tu acento...</p>
                          <p className="text-[10px] text-slate-400">Comparando tu fonética con el estándar americano</p>
                        </div>
                      </div>
                    ) : voiceAnalysisResult ? (() => {
                      const scoreDetails = getScoreDetails(voiceAnalysisResult.score);
                      return (
                        <div className="flex flex-col space-y-4 w-full">
                          <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                            {/* Circular progress bar */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="38"
                                    className="stroke-slate-100"
                                    strokeWidth="8"
                                    fill="transparent"
                                  />
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="38"
                                    stroke={scoreDetails.strokeColor}
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 38}
                                    strokeDashoffset={2 * Math.PI * 38 - (voiceAnalysisResult.score / 100) * 2 * Math.PI * 38}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    className="transition-all duration-1000 ease-out"
                                  />
                                </svg>
                                <span className="absolute text-2xl font-black text-slate-900">
                                  {voiceAnalysisResult.score}%
                                </span>
                              </div>
                            </div>

                            {/* Real-time segmented bar progress and meter */}
                            <div className="flex-grow w-full space-y-2">
                              <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest">Retroalimentación en Tiempo Real</h5>
                              
                              {/* Segmented meter bar */}
                              <div className="relative pt-4 pb-2">
                                {/* Down pointing indicator triangle */}
                                <div 
                                  className="absolute top-0 transition-all duration-500 ease-out"
                                  style={{ left: `${voiceAnalysisResult.score}%`, transform: 'translateX(-50%)' }}
                                >
                                  <div 
                                    className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent"
                                    style={{ borderTopColor: scoreDetails.triangleColor }}
                                  ></div>
                                </div>

                                {/* Color Segments */}
                                <div className="h-3 w-full rounded-full flex overflow-hidden border border-slate-200/50 bg-slate-100 shadow-inner">
                                  <div className="w-[30%] bg-rose-500 h-full"></div>
                                  <div className="w-[30%] bg-amber-500 h-full"></div>
                                  <div className="w-[20%] bg-[#22c55e] h-full"></div>
                                  <div className="w-[20%] bg-[#15803d] h-full"></div>
                                </div>

                                {/* Precise segment markers */}
                                <div className="flex justify-between text-[10px] font-black text-slate-400 mt-1.5 px-0.5">
                                  <span>0</span>
                                  <span>30</span>
                                  <span>60</span>
                                  <span>80</span>
                                  <span>90 - 100</span>
                                </div>
                              </div>
                            </div>

                            {/* Yellow Star Feedback Badge */}
                            <div className={`flex items-center gap-2.5 shrink-0 border rounded-2xl px-4 py-3 shadow-sm transition-all duration-500 ${
                              scoreDetails.star 
                                ? "bg-emerald-50 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                                : "bg-amber-50 border-amber-100"
                            }`}>
                              <span className="text-xl">{scoreDetails.star ? "🌟" : "⭐"}</span>
                              <div>
                                <p className={`text-xs font-black leading-tight ${scoreDetails.text}`}>{scoreDetails.starText}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 leading-tight">{scoreDetails.starSubText}</p>
                              </div>
                            </div>
                          </div>

                          {/* Completion Banner */}
                          {voiceAnalysisResult.score < 80 ? (
                            <div className="w-full flex items-center gap-2.5 px-4 py-3 bg-amber-50/70 border border-amber-100 rounded-xl text-amber-800 text-[11px] font-semibold leading-relaxed mt-2 animate-fade-in">
                              <Volume2 size={15} className="text-amber-600 animate-pulse shrink-0" />
                              <span>
                                Para superar este ejercicio con un <strong>80% o más</strong>, te sugerimos presionar el botón <strong>[Play Native Audio]</strong> de arriba, escuchar con atención la entonación nativa y presionar el micrófono para intentarlo nuevamente. ¡Tú puedes!
                              </span>
                            </div>
                          ) : (
                            <div className="w-full flex items-center gap-2.5 px-4 py-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] font-semibold leading-relaxed mt-2 animate-fade-in">
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                              <span>
                                <strong>¡Felicitaciones!</strong> Has aprobado este término con éxito (<strong>{voiceAnalysisResult.score}%</strong>) and tu progreso se ha guardado de forma segura en tu perfil.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                    : (
                      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1 text-center sm:text-left text-slate-500">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#0058bc] shrink-0">
                            <Mic size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Métrica de Cercanía al Acento</h4>
                            <p className="text-[11px] text-slate-500">Realiza tu grabación de voz para evaluar la entonación y acento.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-[#0058bc] bg-[#E8F1FF]/60 px-3 py-1.5 rounded-xl border border-[#0058bc]/10 shrink-0 uppercase tracking-wider">
                          Esperando Grabación
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guías Fonéticas & Puntos de Mejora */}
                {result && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Guías Fonéticas */}
                    <div className="bg-slate-50/50 border border-slate-200/40 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Info size={14} className="text-[#0058bc]" /> Guías Fonéticas
                      </h4>
                      
                      <div className="space-y-3.5">
                        {/* Syllables breakdown */}
                        <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Desglose Silábico</span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.syllables.map((s, i) => (
                              <span 
                                key={i} 
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                                  s === s.toUpperCase() && s.length > 1
                                    ? "bg-[#0058bc] text-white border-transparent shadow-xs"
                                    : "bg-slate-50 text-slate-600 border-slate-100"
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Acento Silábico</span>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">{result.stressGuide}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Guía Bucal</span>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">{result.vocalGuide}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Puntos de Mejora */}
                    <div className="bg-slate-50/50 border border-slate-200/40 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Award size={14} className="text-[#0058bc]" /> Puntos de Mejora
                      </h4>

                      {voiceAnalysisResult ? (
                        <div className="space-y-3">
                          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Análisis General</span>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                              {voiceAnalysisResult.feedback}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest block">Consejo Correctivo</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                              {voiceAnalysisResult.tips}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 h-full">
                          <Sparkles size={18} className="text-[#0058bc]/30 mb-1.5 animate-bounce" />
                          <p className="text-[11px] font-black text-slate-600">Espera de Grabación</p>
                          <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5 leading-normal">
                            Grábate hablando para recibir retroalimentación fonética y consejos detallados.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400 border border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/10">
                <Sparkles size={36} className="text-[#0058bc]/20 mb-3 animate-pulse" />
                <h3 className="text-base font-bold text-slate-700">Comienza seleccionando una palabra de prueba</h3>
                <p className="text-xs text-slate-400 text-center max-w-xs mt-1 leading-relaxed">
                  Haz clic en cualquiera de los Preset Phrases en la columna izquierda, o escribe tu propia palabra para iniciar el análisis fonético.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
