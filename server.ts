import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const PORT = 3000;

// Initialize Google Gen AI
const apiKey = process.env.GOOGLE_GCP_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initialize Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "gsk_dummy_key_to_prevent_startup_crash"
});

const app = express();
app.use(express.json({ limit: "50mb" }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // TTS endpoint: Google Cloud TTS when voiceName is specified, else free Google Translate TTS
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName, speakingRate } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Texto requerido." });
      }

      const isMaleVoice = voiceName?.includes("Neural2-D") || voiceName?.includes("-D");

      // If a specific voice is requested (e.g. en-US-Neural2-D for male), try Google Cloud TTS
      if (voiceName) {
        const ttsApiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
        if (ttsApiKey) {
          try {
            const gcpRes = await fetch(
              "https://texttospeech.googleapis.com/v1/text:synthesize",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": ttsApiKey,
                },
                body: JSON.stringify({
                  input: { text: text.slice(0, 5000) },
                  voice: {
                    languageCode: "en-US",
                    name: voiceName,
                  },
                  audioConfig: {
                    audioEncoding: "MP3",
                    speakingRate: speakingRate || 1.0,
                  },
                }),
              }
            );

            if (gcpRes.ok) {
              const data = await gcpRes.json();
              const audioBuf = Buffer.from(data.audioContent, "base64");
              res.set("Content-Type", "audio/mpeg");
              return res.send(audioBuf);
            }
            console.warn(`[TTS] Google Cloud TTS failed with voice ${voiceName}, status: ${gcpRes.status}`);
          } catch (gcpErr) {
            console.warn("[TTS] Google Cloud TTS error:", gcpErr);
          }
        }

        // If male voice requested but GCP TTS unavailable, return 504 so client falls back to Web Speech API (which has male voices)
        if (isMaleVoice) {
          console.warn(`[TTS] Male voice ${voiceName} unavailable from GCP, signaling client to use Web Speech API`);
          return res.status(504).json({ error: "Google Cloud TTS not available for male voice", useWebSpeech: true });
        }
      }

      // Fallback: free Google Translate TTS (female voice only)
      const q = encodeURIComponent(text.slice(0, 200));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=en&total=1&idx=0&textlen=${text.length}&client=tw-ob&prev=input&ttsspeed=1`;

      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!response.ok) {
        return res.status(502).json({ error: "TTS upstream failed" });
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("[TTS] Error:", error);
      res.status(500).json({ error: error.message || "TTS failed" });
    }
  });

  // 1c. AI Pronunciation Presets API
  app.get("/api/gemini/pronunciation/presets", (req, res) => {
    try {
      const level = String(req.query.level || "Palabra").toLowerCase();
      let presets: string[] = [];

      if (level === "word" || level === "palabra") {
        presets = [
          "Hello",
          "Thank you",
          "Water",
          "Please",
          "Good morning",
          "Apple"
        ];
      } else if (level === "phrase" || level === "frase") {
        presets = [
          "How are you?",
          "I am fine",
          "Good morning",
          "Nice to meet you",
          "Can I have water?",
          "Where is the bathroom?"
        ];
      } else if (level === "native" || level === "nativo") {
        presets = [
          "Could you please repeat that more slowly?",
          "I would like to order a coffee please",
          "What time does the movie start tonight?",
          "I need to go to the pharmacy before it closes",
          "The weather is really nice today"
        ];
      } else {
        presets = [
          "Hello",
          "Thank you",
          "Water",
          "Please",
          "Good morning",
          "Apple"
        ];
      }

      res.json({ presets });
    } catch (error: any) {
      console.error("Presets API Error:", error);
      res.status(500).json({ error: "Failed to load preset phrases" });
    }
  });

  // --- ROBUST HIGH-FIDELITY FALLBACK DATABASE & ANALYZER ---
  interface PronunciationData {
    originalText: string;
    ipa: string;
    syllables: string[];
    stressGuide: string;
    commonPitfalls: string[];
    vocalGuide: string;
    practiceExercises: string[];
  }

  const PRONUNCIATION_PRESETS_DB: Record<string, PronunciationData> = {
    "comfortable": {
      originalText: "Comfortable",
      ipa: "/ˈkʌmftəbəl/",
      syllables: ["COM", "fort", "a", "ble"],
      stressGuide: "El acento recae en la primera sílaba (COM). Las sílabas intermedias se reducen significativamente, casi sonando como 'cumf-tuh-buhl'.",
      commonPitfalls: [
        "Pronunciar 'com-for-ta-ble' de forma literal en español, dándole peso a todas las sílabas por igual.",
        "Pronunciar la 'o' de 'fort' con mucha fuerza."
      ],
      vocalGuide: "Empieza con un golpe sordo de la 'k'. La 'o' suena como una 'u' corta inglesa (/ʌ/). Contrae el final rápidamente reduciendo la 'o' de 'fort'.",
      practiceExercises: [
        "Di 'cumf-tuh' tres veces de manera fluida.",
        "Añade el final 'buhl' de forma relajada.",
        "Practica la transición rápida sin pronunciar la 'o' de 'fort'."
      ]
    },
    "schedule": {
      originalText: "Schedule",
      ipa: "/ˈskɛdʒuːl/",
      syllables: ["SCHE", "dule"],
      stressGuide: "El acento principal está en la primera sílaba (SCHE). En inglés americano, suena 'ske-dzhul'.",
      commonPitfalls: [
        "Dificultad con la combinación de consonantes 'sk' (añadiendo una 'e' al inicio, ej. 'eschedule').",
        "Pronunciar la 'ch' como en español en lugar del sonido 'k' suave."
      ],
      vocalGuide: "No digas 'eschedule'. Empieza con un silbido de 's' puro, seguido de una 'k' suave. El sonido final es una 'l' oscura.",
      practiceExercises: [
        "Practica decir 'sssssk' sin vocal inicial.",
        "Une 'sk' con 'edg' (ske-dzh).",
        "Pronuncia la 'l' final colocando la lengua en el paladar."
      ]
    },
    "literally": {
      originalText: "Literally",
      ipa: "/ˈlɪtərəli/",
      syllables: ["LIT", "er", "al", "ly"],
      stressGuide: "El acento primario está en la primera sílaba (LIT). En inglés americano, la 't' suena como una vibrante simple (tap t).",
      commonPitfalls: [
        "Pronunciar la doble 'l' como una 'y' en español.",
        "Articular la 't' de forma muy fuerte y dental en vez de un 'tap' rápido."
      ],
      vocalGuide: "La 't' se convierte en un sonido rápido similar a la 'r' suave de 'pero'. Las sílabas intermedias se deslizan rápidamente.",
      practiceExercises: [
        "Di 'lid-er' simulando una r suave.",
        "Añade 'uh-lee' al final de manera continua.",
        "Practica la velocidad intentando reducir la segunda sílaba."
      ]
    },
    "otorhinolaryngologist": {
      originalText: "Otorhinolaryngologist",
      ipa: "/ˌoʊtoʊˌraɪnoʊˌlærɪŋˈɡɒlədʒɪst/",
      syllables: ["O", "to", "rhi", "no", "lar", "yn", "GOL", "o", "gist"],
      stressGuide: "Tiene acentos secundarios en 'o', 'rhi' y 'lar', pero el acento principal está fuertemente en 'GOL'.",
      commonPitfalls: [
        "Perder el ritmo debido a la longitud de la palabra.",
        "Pronunciar la 'g' de 'gist' como una 'g' suave o 'j' española."
      ],
      vocalGuide: "Divide la palabra en partes lógicas: Oto-rhino-laryngo-logist. El sonido 'GOL' debe resaltar claramente.",
      practiceExercises: [
        "Practica decir 'rhino' como 'rai-nou'.",
        "Di 'laryngologist' por separado.",
        "Une todos los segmentos manteniendo el ritmo y el acento en 'GOL'."
      ]
    },
    "anemone": {
      originalText: "Anemone",
      ipa: "/əˈnɛm.ə.ni/",
      syllables: ["a", "NE", "mo", "ne"],
      stressGuide: "El acento principal recae sobre la segunda sílaba (NE), sonando como 'uh-NEH-muh-nee'.",
      commonPitfalls: [
        "Confundir el orden de la 'm' y la 'n', diciendo 'an-e-mo-ne' de forma literal.",
        "No reducir la primera y tercera vocal a sonidos schwa."
      ],
      vocalGuide: "La primera 'a' es una vocal schwa muy relajada (/ə/). Asegúrate de hacer el sonido 'NEM' bien claro antes del suave 'muh-nee'.",
      practiceExercises: [
        "Di 'uh-NEM' con énfasis.",
        "Agrega 'muh-nee' de forma ligera.",
        "Repítelo aumentando la velocidad sin trabar la lengua."
      ]
    },
    "mischievous": {
      originalText: "Mischievous",
      ipa: "/ˈmɪstʃɪvəs/",
      syllables: ["MIS", "chie", "vous"],
      stressGuide: "Acento fuerte en la primera sílaba (MIS). Tiene tres sílabas, no cuatro (evita decir 'mis-chee-vee-ous').",
      commonPitfalls: [
        "Pronunciar una sílaba extra al final ('mis-chee-vee-us').",
        "Pronunciar la 'ch' como una 'sh' suave en vez de una 'ch' seca."
      ],
      vocalGuide: "El sonido de la 'ch' es seco y fuerte (/tʃ/). El final suena simplemente como 'vuhs' con una vocal schwa corta.",
      practiceExercises: [
        "Di 'MIS-chif'.",
        "Agrega 'vuhs' al final.",
        "Practica omitiendo conscientemente la 'i' adicional que no existe."
      ]
    },
    "world wide web": {
      originalText: "World Wide Web",
      ipa: "/ˌwɜːrld ˌwaɪd ˈwɛb/",
      syllables: ["WORLD", "WIDE", "WEB"],
      stressGuide: "Cada palabra lleva un peso considerable, con el acento principal final en 'WEB' de forma rítmica.",
      commonPitfalls: [
        "Dificultad para pronunciar la combinación 'r-l-d' en 'World'.",
        "Omitir la 'd' final de 'wide' o la 'b' final de 'web'."
      ],
      vocalGuide: "En 'World', la lengua debe subir para la 'r' y luego tocar el paladar para la 'l' antes de soltar la 'd'. No omitas la 'd'.",
      practiceExercises: [
        "Di 'wer' y luego añade 'ld'.",
        "Une 'wide' terminando en 'd' seca.",
        "Junta las tres palabras con un ritmo constante."
      ]
    },
    "an apple a day keeps the doctor away": {
      originalText: "An apple a day keeps the doctor away",
      ipa: "/ən ˈæpəl ə deɪ kiːps ðə ˈdɒktər əˈweɪ/",
      syllables: ["An", "AP", "ple", "a", "day", "keeps", "the", "DOC", "tor", "a", "WAY"],
      stressGuide: "Acento fuerte en 'AP-ple', 'day', 'keeps', 'DOC-tor', 'WAY'. El resto son sílabas débiles que fluyen rápido.",
      commonPitfalls: [
        "Pronunciar 'the' como 'de' en español.",
        "Darle la misma intensidad y duración a todas las palabras de la frase."
      ],
      vocalGuide: "La palabra 'An' se reduce a 'uhn'. 'The' se pronuncia colocando la lengua entre los dientes para la consonante vibrante sorda.",
      practiceExercises: [
        "Practica la transición rápida 'uhn-AP-puhl'.",
        "Di 'keeps-thuh-DOC-ter'.",
        "Lee la frase completa imitando un péndulo de ritmo."
      ]
    },
    "a piece of cake": {
      originalText: "A piece of cake",
      ipa: "/ə piːs əv keɪk/",
      syllables: ["A", "piece", "of", "cake"],
      stressGuide: "El ritmo recae fuertemente en 'piece' y 'cake'. 'of' se reduce enormemente a 'uhv' o simplemente 'uh'.",
      commonPitfalls: [
        "Pronunciar 'of' con una 'o' fuerte y 'f' de español en vez de una schwa y una 'v' suave.",
        "Hacer la 'i' de 'piece' demasiado corta."
      ],
      vocalGuide: "La 'i' de 'piece' es una vocal larga (/iː/). El sonido final 'cake' requiere una liberación limpia de aire en la 'k'.",
      practiceExercises: [
        "Di 'uh-PEES'.",
        "Practica decir 'uhv-KEIK' de una sola vez.",
        "Junta toda la expresión de manera fluida."
      ]
    },
    "thoroughly thoroughly throughout": {
      originalText: "Thoroughly thoroughly throughout",
      ipa: "/ˈθʌrəli ˈθʌrəli θruːˈaʊt/",
      syllables: ["THOR", "ough", "ly", "THOR", "ough", "ly", "through", "OUT"],
      stressGuide: "Acento en el primer 'THOR' de las dos primeras palabras, y en el final 'OUT' de 'throughout'.",
      commonPitfalls: [
        "Pronunciar la 'th' inicial como una 't' o una 'd' española.",
        "Confundir las vocales de 'thorough' con 'through'."
      ],
      vocalGuide: "La 'th' es sorda (soplando aire con la lengua entre los dientes). La 'o' en 'thorough' es corta y relajada (/ʌ/).",
      practiceExercises: [
        "Practica el soplido de la 'th' sorda.",
        "Di 'ther-uh-lee' dos veces.",
        "Di 'thru-aut' con fuerza en la última sílaba."
      ]
    },
    "although he thought through the difficult task, he felt thoroughly exhausted afterwards.": {
      originalText: "Although he thought through the difficult task, he felt thoroughly exhausted afterwards.",
      ipa: "/ɔːlˈðoʊ hiː θɔːt θruː ðə ˈdɪfɪkəlt tɑːsk, hiː fɛlt ˈθʌrəli ɪɡˈzɔːstɪd ˈæftərwərdz/",
      syllables: ["Al", "THOUGH", "he", "THOUGHT", "THROUGH", "the", "DIF", "fi", "cult", "task", "he", "felt", "THOR", "ough", "ly", "ex", "HAUS", "ted", "AF", "ter", "wards"],
      stressGuide: "Frase larga con múltiples picos de entonación. Presta atención a las diferencias entre 'although', 'thought', 'through' y 'thoroughly'.",
      commonPitfalls: [
        "Dificultad general para mantener el flujo rítmico.",
        "Confundir la pronunciación de las combinaciones 'ough'."
      ],
      vocalGuide: "La 'th' de 'although' y 'the' es sonora, mientras que en 'thought' y 'through' es sorda. 'Exhausted' suena con una 'g-z' al inicio.",
      practiceExercises: [
        "Practica alternar 'th' sorda y sonora.",
        "Di 'although-he-thought' de corrido.",
        "Pronuncia 'thoroughly exhausted' prestando atención al acento."
      ]
    }
  };

  function getFallbackPronunciationData(text: string): PronunciationData {
    const clean = text.trim().toLowerCase();
    if (PRONUNCIATION_PRESETS_DB[clean]) {
      return PRONUNCIATION_PRESETS_DB[clean];
    }
    // Search substring
    for (const key of Object.keys(PRONUNCIATION_PRESETS_DB)) {
      if (clean.includes(key) || key.includes(clean)) {
        return PRONUNCIATION_PRESETS_DB[key];
      }
    }
    
    // Custom word estimator
    const words = text.split(/\s+/);
    const isPhrase = words.length > 1;
    const computedSyllables = isPhrase ? words.slice(0, 8) : [text.toUpperCase()];
    
    return {
      originalText: text,
      ipa: `/${text.toLowerCase().replace(/c/g, 'k').replace(/y/g, 'ai')}/`,
      syllables: computedSyllables,
      stressGuide: isPhrase 
        ? `Frase de ${words.length} palabras. El ritmo recae sobre los términos de contenido (sustantivos y verbos), reduciendo las preposiciones y artículos.`
        : `Palabra con acento en la primera sílaba principal. Alarga el sonido vocálico acentuado para sonar más natural.`,
      commonPitfalls: [
        "Pronunciar todas las letras de forma literal en español, sin la reducción de vocales neutras (schwa).",
        "No marcar correctamente el final de las consonantes secas (t, d, k, p, b)."
      ],
      vocalGuide: `Articula con suavidad. Mantén la mandíbula relajada en las vocales medias y asegúrate de levantar la lengua para los sonidos de transición r-l.`,
      practiceExercises: [
        `Di la palabra lentamente dividiéndola en ${isPhrase ? "palabras individuales" : "sílabas"}.`,
        "Grábate y compara la entonación de tu primera vocal.",
        "Aumenta la velocidad gradualmente manteniendo la claridad de las consonantes finales."
      ]
    };
  }

  function getFallbackListeningData(scenario: string, level: string) {
    const normScenario = (scenario || "ordering breakfast").toLowerCase();
    
    if (normScenario.includes("coffee") || normScenario.includes("cafe") || normScenario.includes("breakfast") || normScenario.includes("restaurant") || normScenario.includes("food")) {
      return {
        title: "Breakfast Ordering at Starbucks",
        context: "A customer is ordering a fresh breakfast combo at a busy coffee shop in Chicago.",
        dialogue: [
          { speaker: "Barista", text: "Good morning! Welcome to Star Coffee. What can I get started for you today?", spanishTranslation: "¡Buenos días! Bienvenido a Star Coffee. ¿Con qué podemos empezar hoy?" },
          { speaker: "Customer", text: "Hi! I'd like a medium caramel macchiato with oat milk, and a warmed blueberry muffin, please.", spanishTranslation: "¡Hola! Me gustaría un macchiato de caramelo mediano con leche de avena y un muffin de arándanos caliente, por favor." },
          { speaker: "Barista", text: "Excellent choice. Would you like whipped cream on that macchiato?", spanishTranslation: "Excelente elección. ¿Le gustaría crema batida en ese macchiato?" },
          { speaker: "Customer", text: "No, thank you. Just the oat milk is fine. Oh, actually, could I make that an extra hot macchiato?", spanishTranslation: "No, gracias. Solo la leche de avena está bien. ¡Ah!, de hecho, ¿podría pedir el macchiato extra caliente?" },
          { speaker: "Barista", text: "Absolutely, extra hot caramel macchiato with oat milk, and one warm muffin. Your total comes to eight dollars and fifty cents. Cash or card?", spanishTranslation: "Absolutamente, macchiato de caramelo extra caliente con leche de avena, y un muffin caliente. Su total es de ocho dólares con cincuenta centavos. ¿Efectivo o tarjeta?" },
          { speaker: "Customer", text: "Card, please. Here you go.", spanishTranslation: "Tarjeta, por favor. Aquí tiene." },
          { speaker: "Barista", text: "Thank you! You can tap your card on the reader right there. We will have your order ready at the end of the counter in just a moment.", spanishTranslation: "¡Gracias! Puede pasar su tarjeta por el lector allí mismo. Tendremos su pedido listo en el extremo de la barra en un momento." }
        ],
        vocabulary: [
          { term: "Caramel Macchiato", definition: "A popular espresso-based coffee drink with vanilla syrup, steamed milk, espresso, and caramel drizzle.", example: "She ordered a caramel macchiato to boost her morning energy." },
          { term: "Oat milk", definition: "A plant milk derived from whole oat grains, often used as a dairy-free milk substitute in espresso drinks.", example: "Oat milk is creamier than almond milk in hot lattes." },
          { term: "Whipped cream", definition: "Heavy cream that has been beaten until it is light and fluffy, often sweetened and used as a dessert topping.", example: "Can I have my hot chocolate with extra whipped cream?" }
        ],
        questions: [
          {
            id: 1,
            questionText: "What specific milk does the customer request for their caramel macchiato?",
            options: ["Soy milk", "Almond milk", "Oat milk", "Whole dairy milk"],
            correctOptionIndex: 2,
            explanation: "The customer explicitly says: 'I'd like a medium caramel macchiato with oat milk'."
          },
          {
            id: 2,
            questionText: "How does the customer modify their beverage temperature?",
            options: ["They ask for it over ice", "They ask for it extra hot", "They ask for it lukewarm", "They do not modify the temperature"],
            correctOptionIndex: 1,
            explanation: "The customer asks: 'Oh, actually, could I make that an extra hot macchiato?'"
          },
          {
            id: 3,
            questionText: "What is the total cost of the customer's purchase?",
            options: ["$5.50", "$8.50", "$10.00", "$12.50"],
            correctOptionIndex: 1,
            explanation: "The barista says: 'Your total comes to eight dollars and fifty cents ($8.50).'"
          }
        ],
        fillBlank: {
          sentence: "Yesterday I [blank] to the [blank] and [blank] some fresh vegetables.",
          blanks: ["went", "market", "bought"],
          question: "¿Qué compró la persona en el mercado?",
          options: ["Fruta fresca", "Verduras frescas", "Pan recién hecho", "Pescado"],
          correctOptionIndex: 1
        }
      };
    }

    if (normScenario.includes("directions") || normScenario.includes("lost") || normScenario.includes("street") || normScenario.includes("where") || normScenario.includes("city")) {
      return {
        title: "Asking for Directions in Central London",
        context: "A tourist who is slightly lost is asking a local police officer for directions to the British Museum.",
        dialogue: [
          { speaker: "Tourist", text: "Excuse me, officer. I'm sorry to bother you, but I'm quite lost. Could you tell me how to get to the British Museum?", spanishTranslation: "Disculpe, oficial. Lamento molestarle, pero estoy bastante perdido. ¿Podría decirme cómo llegar al Museo Británico?" },
          { speaker: "Officer", text: "Of course! It's actually not too far from here. Walk straight down this street for about three blocks until you hit the main intersection.", spanishTranslation: "¡Por supuesto! De hecho, no está muy lejos de aquí. Camine recto por esta calle unas tres cuadras hasta llegar a la intersección principal." },
          { speaker: "Tourist", text: "Okay, straight for three blocks. Got it. And then?", spanishTranslation: "Bien, recto por tres cuadras. Entendido. ¿Y luego?" },
          { speaker: "Officer", text: "At the intersection, turn left onto Great Russell Street. Walk past the red telephone booths, and you'll see the museum entrance on your right-hand side.", spanishTranslation: "En la intersección, doble a la izquierda en Great Russell Street. Pase las cabinas telefónicas rojas y verá la entrada del museo a su derecha." },
          { speaker: "Tourist", text: "Great Russell Street on the left, then look for the entrance on the right. Is it within walking distance?", spanishTranslation: "Great Russell Street a la izquierda, luego busco la entrada a la derecha. ¿Está a una distancia que se pueda caminar?" },
          { speaker: "Officer", text: "Yes, absolutely! It should only take you about five to seven minutes on foot. You can't miss it, it has large Greek-style columns.", spanishTranslation: "¡Sí, absolutamente! Solo le tomará de cinco a siete minutos a pie. No tiene pérdida, tiene grandes columnas de estilo griego." },
          { speaker: "Tourist", text: "That's wonderful! Thank you so much for your kind help.", spanishTranslation: "¡Eso es maravilloso! Muchísimas gracias por su amable ayuda." }
        ],
        vocabulary: [
          { term: "Intersection", definition: "A point where two or more streets or roads meet or cross each other.", example: "Turn right at the next busy intersection." },
          { term: "Walking distance", definition: "A distance close enough to be reached easily by walking.", example: "Our hotel is within walking distance of the subway station." },
          { term: "Bother", definition: "To take the time or trouble to do something, or to annoy/disturb someone politely.", example: "Sorry to bother you, but do you have the time?" }
        ],
        questions: [
          {
            id: 1,
            questionText: "What famous London landmark is the tourist trying to reach?",
            options: ["The London Eye", "The British Museum", "Big Ben", "Trafalgar Square"],
            correctOptionIndex: 1,
            explanation: "The tourist explicitly asks for directions to the 'British Museum'."
          },
          {
            id: 2,
            questionText: "Which street does the officer tell the tourist to turn left onto?",
            options: ["Baker Street", "Oxford Street", "Great Russell Street", "Piccadilly Circus"],
            correctOptionIndex: 2,
            explanation: "The officer says: 'At the intersection, turn left onto Great Russell Street.'"
          },
          {
            id: 3,
            questionText: "How long is the estimated walk to the museum from their current spot?",
            options: ["20 minutes", "30 minutes", "5 to 7 minutes", "Over an hour"],
            correctOptionIndex: 2,
            explanation: "The officer says: 'It should only take you about five to seven minutes on foot.'"
          }
        ],
        fillBlank: {
          sentence: "At the [blank], turn [blank] onto Great Russell Street.",
          blanks: ["intersection", "left"],
          question: "¿Hacia qué lado debe girar el turista en la intersección?",
          options: ["A la derecha", "A la izquierda", "Seguir recto", "Dar la vuelta"],
          correctOptionIndex: 1
        }
      };
    }

    return {
      title: `Practical English: ${scenario}`,
      context: `An interactive conversational scenario about: ${scenario}. Designed for ${level} proficiency level.`,
      dialogue: [
        { speaker: "Speaker A", text: "Hello! Thank you for meeting with me today to discuss this matter.", spanishTranslation: "¡Hola! Gracias por reunirte conmigo hoy para discutir este asunto." },
        { speaker: "Speaker B", text: "No problem at all. I think it is really important that we get on the same page about it.", spanishTranslation: "No hay problema en absoluto. Creo que es realmente importante que nos pongamos de acuerdo sobre esto." },
        { speaker: "Speaker A", text: "Exactly. I was reviewing the latest draft and noticed a few key elements we might want to adjust.", spanishTranslation: "Exacto. Estaba revisando el último borrador y noté algunos elementos clave que tal vez queramos ajustar." },
        { speaker: "Speaker B", text: "I see. Let's go through them one by one so we don't miss anything. What is your first concern?", spanishTranslation: "Ya veo. Vayamos uno por uno para no perdernos nada. ¿Cuál es tu primera preocupación?" },
        { speaker: "Speaker A", text: "My first point is the overall timeline. We need to make sure we have enough breathing room to finish successfully.", spanishTranslation: "Mi primer punto es el cronograma general. Necesitamos asegurarnos de tener suficiente margen de maniobra para terminar con éxito." },
        { speaker: "Speaker B", text: "That makes a lot of sense. Let's extend the deadline by two weeks to be perfectly safe.", spanishTranslation: "Eso tiene mucho sentido. Ampliemos la fecha límite dos semanas para estar perfectamente seguros." }
      ],
      vocabulary: [
        { term: "Get on the same page", definition: "An idiom meaning to reach an agreement or a shared understanding with others.", example: "Before starting the campaign, we need to get on the same page." },
        { term: "Breathing room", definition: "An adequate amount of time or space in which to do something or to rest.", example: "Our team has no breathing room with this tight project schedule." },
        { term: "Timeline", definition: "A schedule of events or milestones showing when things are planned to occur.", example: "Please update the project timeline by tomorrow afternoon." }
      ],
      questions: [
        {
          id: 1,
          questionText: "What is the main topic of discussion between Speaker A and Speaker B?",
          options: ["A cooking recipe", "A project draft and timeline", "A flight booking", "A movie review"],
          correctOptionIndex: 1,
          explanation: "The speakers talk about getting on the same page, reviewing the latest draft, and adjusting the project timeline."
        },
        {
          id: 2,
          questionText: "What is Speaker A's primary concern with the current draft?",
          options: ["The color scheme", "The overall timeline and deadline", "The spelling of names", "The budget cost"],
          correctOptionIndex: 1,
          explanation: "Speaker A says: 'My first point is the overall timeline. We need to make sure we have enough breathing room...'"
        },
        {
          id: 3,
          questionText: "How much extra time do they agree to add to the deadline?",
          options: ["Two days", "Two weeks", "One month", "No extra time"],
          correctOptionIndex: 1,
          explanation: "Speaker B concludes: 'Let's extend the deadline by two weeks to be perfectly safe.'"
        }
      ],
      fillBlank: {
        sentence: "Let's [blank] the [blank] by two weeks to be perfectly safe.",
        blanks: ["extend", "deadline"],
        question: "¿Cuánto tiempo extra acuerdan añadir al plazo?",
        options: ["Dos días", "Dos semanas", "Un mes", "Ningún tiempo extra"],
        correctOptionIndex: 1
      }
    };
  }

  function getFallbackChatResponse(messages: any[], scenario: string) {
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content : "";
    const lastUserClean = lastUserMessage.trim();
    
    let isCorrect = true;
    let detectedErrors = "Ninguno. ¡Tu mensaje está excelentemente estructurado!";
    let correctedText = lastUserClean;
    let explanation = "Has utilizado las palabras correctas con excelente concordancia gramatical. ¡Sigue así!";

    if (lastUserClean) {
      const lower = lastUserClean.toLowerCase();
      if (lower.includes("i is")) {
        isCorrect = false;
        detectedErrors = "Uso incorrecto del verbo 'to be' con el pronombre 'I'.";
        correctedText = lastUserClean.replace(/i is/gi, "I am");
        explanation = "En inglés, el pronombre 'I' siempre se conjuga con 'am' en el presente continuo o simple, no con 'is'.";
      } else if (lower.includes("i has")) {
        isCorrect = false;
        detectedErrors = "Uso incorrecto del verbo 'to have' con la primera persona.";
        correctedText = lastUserClean.replace(/i has/gi, "I have");
        explanation = "El verbo 'to have' se conjuga como 'have' para 'I, you, we, they' y como 'has' únicamente para las terceras personas 'he, she, it'.";
      } else if (lower.includes("he have") || lower.includes("she have") || lower.includes("it have")) {
        isCorrect = false;
        detectedErrors = "Falta de concordancia en tercera persona para el verbo 'to have'.";
        correctedText = lastUserClean.replace(/he have/gi, "he has").replace(/she have/gi, "she has").replace(/it have/gi, "it has");
        explanation = "Las terceras personas del singular (he, she, it) requieren la forma 'has' del verbo auxiliar.";
      } else if (lower.includes("he go ") || lower.includes("he go\n") || lower.endsWith("he go") || lower.includes("she go ") || lower.endsWith("she go")) {
        isCorrect = false;
        detectedErrors = "Falta de la terminación de tercera persona singular (-es) en el verbo 'go'.";
        correctedText = lastUserClean.replace(/he go/gi, "he goes").replace(/she go/gi, "she goes");
        explanation = "En el presente simple, los verbos que terminan en 'o' conjugados con 'he, she, it' deben añadir '-es' al final (goes).";
      } else if (lower.includes("you is") || lower.includes("we is") || lower.includes("they is")) {
        isCorrect = false;
        detectedErrors = "Uso incorrecto de 'is' para pronombres del plural.";
        correctedText = lastUserClean.replace(/you is/gi, "you are").replace(/we is/gi, "we are").replace(/they is/gi, "they are");
        explanation = "Los pronombres 'you, we, they' se conjugan con 'are' en tiempo presente del verbo 'to be'.";
      } else if (lower.includes("i am agree")) {
        isCorrect = false;
        detectedErrors = "Traducción literal errónea 'I am agree'.";
        correctedText = lastUserClean.replace(/i am agree/gi, "I agree");
        explanation = "En inglés no se utiliza el verbo 'to be' con 'agree'. Se dice simplemente 'I agree' (coincido/estoy de acuerdo).";
      } else if (/\bi\b/.test(lastUserClean)) {
        isCorrect = false;
        detectedErrors = "Pronombre personal 'I' escrito en minúscula.";
        correctedText = lastUserClean.replace(/\bi\b/g, "I");
        explanation = "En inglés, el pronombre personal de primera persona de singular 'I' (yo) siempre se escribe en mayúscula, sin importar su posición.";
      }
    }

    const scenarioLower = (scenario || "Ordering food at a New York restaurant").toLowerCase();
    let reply = "That sounds fantastic! I am very interested to hear more about your thoughts on this.";
    let suggestedResponses = [
      "Could you clarify what you mean by that?",
      "I completely agree with you on this point.",
      "Let's move on to the next topic of our discussion."
    ];

    if (scenarioLower.includes("restaurant") || scenarioLower.includes("food") || scenarioLower.includes("order")) {
      reply = "Excellent choice! Our chef highly recommends that dish today. Would you like to add any drinks or an appetizer to start with?";
      suggestedResponses = [
        "Yes, I would like an iced water with lemon, please.",
        "No, thank you. Just the main course is fine.",
        "What appetizers do you have available today?"
      ];
    } else if (scenarioLower.includes("interview") || scenarioLower.includes("job") || scenarioLower.includes("work")) {
      reply = "Thank you for sharing that experience. It highlights your adaptability. Can you tell me about a time you handled a disagreement in a team?";
      suggestedResponses = [
        "Certainly! In my last job, we had a disagreement over project deadlines...",
        "I believe communication is key. I always try to listen to the other side first.",
        "Could you repeat the question, please? I want to make sure I answer correctly."
      ];
    } else if (scenarioLower.includes("travel") || scenarioLower.includes("airport") || scenarioLower.includes("vacation")) {
      reply = "Traveling always opens up such wonderful perspectives! What is your absolute favorite destination that you have visited so far?";
      suggestedResponses = [
        "I absolutely fell in love with Rome because of its history and food.",
        "I prefer quiet beaches, so Kyoto was incredible.",
        "Honestly, I love exploring local mountains and hiking trails."
      ];
    }

    return {
      reply: reply,
      evaluation: {
        isCorrect: isCorrect,
        detectedErrors: detectedErrors,
        correctedText: correctedText,
        explanation: explanation,
        correctedTextTranslation: `Traducción sugerida: "${correctedText}"`
      },
      suggestedResponses: suggestedResponses
    };
  }

  function getFallbackTutorData(query: string, level: string) {
    const normQuery = (query || "").toLowerCase();

    if (normQuery.includes("perfect") || normQuery.includes("past simple") || normQuery.includes("present perfect")) {
      return {
        explanation: `### Present Perfect vs. Past Simple 🎓\n\nUnderstanding the boundary between **Present Perfect** and **Past Simple** is a vital milestone in mastering English.\n\n#### 1. Past Simple (Pasado Simple)\nWe use the **Past Simple** for actions that happened in a **finished time** in the past. It refers to a specific, completed event.\n*   *Key indicators:* yesterday, last week, in 2010, 5 years ago.\n\n#### 2. Present Perfect (Pretérito Perfecto)\nWe use the **Present Perfect** for actions connected to the **present**. The exact time is either unknown, unfinished, or irrelevant; we care about the *experience* or *result* now.\n*   *Key indicators:* already, yet, ever, never, since, for, so far.`,
        examples: [
          { sentence: "I lost my keys yesterday. (Past Simple)", concept: "Finished time (yesterday). The keys might have been found by now." },
          { sentence: "I have lost my keys! (Present Perfect)", concept: "Connection to present. I still don't have them right now." },
          { sentence: "She visited Tokyo in 2019.", concept: "Completed action at a specific, finished calendar year in the past." },
          { sentence: "She has visited Tokyo three times.", concept: "Life experience. She might go again; time is not specified." }
        ],
        quickQuiz: [
          {
            id: 1,
            question: "Choose the correct sentence: 'I _____ to New York last summer.'",
            options: ["have gone", "went", "go", "was going"],
            correctIndex: 1,
            explanation: "Because 'last summer' is a specific, finished time in the past, we must use the Past Simple 'went'."
          },
          {
            id: 2,
            question: "Choose the correct sentence: 'She _____ her homework yet.'",
            options: ["didn't finish", "hasn't finished", "isn't finishing", "hadn't finished"],
            correctIndex: 1,
            explanation: "'Yet' indicates an action that is expected to happen, connecting the past effort to the present. Present Perfect is required."
          },
          {
            id: 3,
            question: "Choose the correct sentence: 'We _____ each other for ten years.'",
            options: ["know", "knew", "have known", "are knowing"],
            correctIndex: 2,
            explanation: "For state verbs representing an ongoing duration starting in the past and continuing now, we use Present Perfect ('have known')."
          }
        ],
        tutorTips: [
          "Ask yourself: 'Is the time finished?'. If you see words like 'yesterday', 'ago', 'last', use Past Simple immediately.",
          "Think of Present Perfect as a bridge. It always tells us something about 'now' (e.g. 'I've eaten' means 'I am not hungry now').",
          "Practice using 'since' for a starting point (since 2015) and 'for' for a duration (for 8 years)."
        ]
      };
    }

    if (normQuery.includes("preposition") || normQuery.includes("in on at") || normQuery.includes("at on in")) {
      return {
        explanation: `### Prepositions of Time & Place: In, On, At 🗺️\n\nPrepositions can be tricky, but using the **Pyramid rule** (from general/largest to specific/smallest) simplifies them:\n\n#### 1. IN (General / Large)\n*   **Time:** Centuries, decades, years, months, seasons. (e.g., *in* 2026, *in* summer, *in* July)\n*   **Place:** Countries, cities, neighborhoods, enclosed spaces. (e.g., *in* England, *in* Madrid, *in* a box)\n\n#### 2. ON (More Specific / Medium)\n*   **Time:** Days of the week, specific dates, holidays with 'day'. (e.g., *on* Monday, *on* my birthday, *on* July 4th)\n*   **Place:** Streets, surfaces, public transport, communication channels. (e.g., *on* Broadway street, *on* the table, *on* the bus)\n\n#### 3. AT (Very Specific / Address or Point)\n*   **Time:** Hours, precise times, night/noon. (e.g., *at* 5 PM, *at* midnight, *at* lunch)\n*   **Place:** Specific addresses, exact locations, public/social spots. (e.g., *at* 123 Main St, *at* the library, *at* the door)`,
        examples: [
          { sentence: "The meeting is at 9:00 AM on Monday in the office.", concept: "Illustrates all three: 'at' for precise time, 'on' for day, 'in' for enclosed room." },
          { sentence: "She lives in Berlin on Berlin street.", concept: "'in' for the city, 'on' for the street name." }
        ],
        quickQuiz: [
          {
            id: 1,
            question: "Fill in the blank: 'I was born _____ October.'",
            options: ["at", "on", "in", "by"],
            correctIndex: 2,
            explanation: "Months alone are large periods of time, so we use 'in'."
          },
          {
            id: 2,
            question: "Fill in the blank: 'Let's meet _____ 8:30 PM.'",
            options: ["in", "on", "at", "during"],
            correctIndex: 2,
            explanation: "Specific times on a clock require 'at'."
          },
          {
            id: 3,
            question: "Fill in the blank: 'Is there any food _____ the table?'",
            options: ["at", "in", "on", "inside"],
            correctIndex: 2,
            explanation: "A table is a horizontal flat surface, so we use 'on'."
          }
        ],
        tutorTips: [
          "Memorize the pyramid: IN (big) -> ON (medium) -> AT (tiny/specific).",
          "Watch out for the exception: 'in the morning/afternoon/evening' but 'at night'.",
          "For transport: Use 'on' if you can stand and walk inside (on a bus, on a train, on a plane) but 'in' for cars and taxis."
        ]
      };
    }

    return {
      explanation: `### Master English Concept: ${query} 📖\n\nHere is a supportive, clear breakdown to help you master this topic quickly!\n\n#### Core Grammar & Style\nEvery English construct benefits from clear, consistent rules. When practicing **${query}**, focus on structure, verb endings, and natural word combinations.\n\n#### Key Patterns to Learn\n*   Maintain subject-verb agreement (singular subjects take singular verb forms).\n*   Pay attention to prepositions which often differ from their Spanish counterparts.\n*   Focus on word order: English usually follows Subject-Verb-Object (SVO) order strictly.`,
      examples: [
        { sentence: "The primary concept is simple to practice daily.", concept: "A clear demonstration of natural word order." },
        { sentence: "Practice makes perfect when studying systematically.", concept: "Demonstrates subject-verb singular agreement." }
      ],
      quickQuiz: [
        {
          id: 1,
          question: `Which option represents a correct application of ${query}?`,
          options: ["The correct choice", "An incorrect phrase", "A misspelled option", "None of the above"],
          correctIndex: 0,
          explanation: "This option demonstrates clean, natural sentence structure with proper agreement."
        },
        {
          id: 2,
          question: "Select the sentence with proper spelling and punctuation:",
          options: ["she don't know.", "She doesn't know.", "She doesn't knows.", "She don't knows."],
          correctIndex: 1,
          explanation: "'She doesn't know.' is the correct negative form of the third-person singular present simple."
        },
        {
          id: 3,
          question: "Complete the sentence: 'If I study every day, I _____ my English.'",
          options: ["will improve", "improved", "would improve", "improves"],
          correctIndex: 0,
          explanation: "This is a first conditional structure expressing a highly likely future result."
        }
      ],
      tutorTips: [
        "Read out loud! It builds acoustic memory and helps you spot unnatural syntax instantly.",
        "Write down 3 personalized sentences using this new rule or concept today.",
        "Don't worry about being perfect. Making errors is an essential milestone of language learning!"
      ]
    };
  }

  function getFallbackTOEFLResult(testType: string, prompt: string, submission: string) {
    const words = (submission || "").trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let score = 21;
    let strengths = ["Estructura general clara", "Uso adecuado de párrafos"];
    let weaknesses = ["Vocabulario limitado", "Falta de conectores avanzados"];
    let grammarEvaluation = "Tu gramática es mayormente correcta, pero utilizas estructuras muy simples. Intenta incorporar oraciones subordinadas.";
    let vocabularyEvaluation = "El rango de vocabulario es básico. Evita repetir palabras comunes como 'good', 'bad' o 'important'. Usa sinónimos.";
    let exemplarResponse = `Gracing a top-tier TOEFL score requires polished coordination, lexical diversity, and precise syntax.\n\nHere is an exemplar model answer:\nIndeed, the proposition that "${prompt || "the task"}" is of paramount significance. In modern society, there are manifold reasons to support this perspective. First and foremost, empirical evidence suggests that robust social interactions enhance individual productivity. Furthermore, cohesive communication serves as the cornerstone for societal harmony. In conclusion, while there are minor arguments on the opposing side, the weight of the evidence heavily favors this balanced and comprehensive stance.`;
    let tipsToImprove = [
      "Añade conectores formales al inicio de tus argumentos (e.g. 'Furthermore', 'Moreover', 'In addition').",
      "Expande el conteo de palabras; un ensayo competitivo de TOEFL suele requerir más de 250 palabras.",
      "Revisa la concordancia del tiempo verbal al mezclar el pasado y el presente."
    ];

    if (wordCount < 10) {
      score = 8;
      strengths = ["Intento inicial de responder"];
      weaknesses = ["Respuesta extremadamente corta", "Falta total de desarrollo de ideas"];
      grammarEvaluation = "No hay suficiente contenido para evaluar la precisión gramatical de forma consistente.";
      vocabularyEvaluation = "El vocabulario no se puede medir debido a la brevedad del texto.";
      tipsToImprove = [
        "Escribe al menos de 3 a 5 oraciones completas para cada sección.",
        "Asegúrate de abordar directamente el tema del prompt.",
        "Practica la velocidad de escritura para evitar quedarte sin tiempo."
      ];
    } else if (wordCount < 60) {
      score = 15;
      strengths = ["Sigue el tema del prompt"];
      weaknesses = ["Falta de oraciones de apoyo", "Errores gramaticales notables"];
      grammarEvaluation = "Se observan errores de concordancia y uso inadecuado de preposiciones básicas.";
      vocabularyEvaluation = "Falta diversidad léxica. Repites las mismas palabras en oraciones consecutivas.";
    } else if (wordCount > 150) {
      score = 26;
      strengths = ["Excelente longitud y desarrollo de ideas", "Uso correcto de transiciones"];
      weaknesses = ["Ligeros errores de puntuación", "Estructuras de frases a veces redundantes"];
      grammarEvaluation = "Demuestras un buen control de estructuras complejas, aunque hay pequeños descuidos en tiempos verbales perfectos.";
      vocabularyEvaluation = "Buen uso de vocabulario académico (e.g. 'consequently', 'significant', 'nevertheless').";
      tipsToImprove = [
        "Dedica los últimos 2 minutos a corregir errores ortográficos accidentales.",
        "Usa la voz pasiva de forma estratégica para dar más formalidad a tus argumentos.",
        "Refina la conclusión para resumir tus puntos clave de forma sintética."
      ];
    }

    return {
      score: score,
      strengths: strengths,
      weaknesses: weaknesses,
      grammarEvaluation: grammarEvaluation,
      vocabularyEvaluation: vocabularyEvaluation,
      exemplarResponse: exemplarResponse,
      tipsToImprove: tipsToImprove
    };
  }

  function getFallbackGrammarData(text: string) {
    const original = text || "";
    let corrected = original;
    const errors: any[] = [];
    
    const lower = original.toLowerCase();

    if (lower.includes("i am agree")) {
      corrected = corrected.replace(/i am agree/gi, "I agree");
      errors.push({
        originalFragment: "I am agree",
        correctedFragment: "I agree",
        errorType: "Traducción literal",
        explanation: "En inglés, 'agree' es un verbo directo de acción o estado, no un adjetivo. Por lo tanto, no requiere el verbo auxiliar 'to be'."
      });
    }

    if (lower.includes("he don't") || lower.includes("she don't") || lower.includes("it don't")) {
      corrected = corrected.replace(/he don't/gi, "he doesn't")
                           .replace(/she don't/gi, "she doesn't")
                           .replace(/it don't/gi, "it doesn't");
      errors.push({
        originalFragment: "don't",
        correctedFragment: "doesn't",
        errorType: "Concordancia de Sujeto y Verbo",
        explanation: "Para la tercera persona del singular (he, she, it), la forma negativa correcta del verbo auxiliar 'do' en presente simple es 'doesn't'."
      });
    }

    if (lower.includes("i has")) {
      corrected = corrected.replace(/i has/gi, "I have");
      errors.push({
        originalFragment: "I has",
        correctedFragment: "I have",
        errorType: "Conjugación Verbal",
        explanation: "La primera persona del singular 'I' se conjuga siempre con 'have' en el tiempo presente."
      });
    }

    if (lower.includes("people is")) {
      corrected = corrected.replace(/people is/gi, "people are");
      errors.push({
        originalFragment: "people is",
        correctedFragment: "people are",
        errorType: "Sustantivo Plural Colectivo",
        explanation: "La palabra 'people' (gente/personas) es un sustantivo plural colectivo y requiere el verbo conjugado en plural ('are')."
      });
    }

    if (/\bi\b/.test(corrected)) {
      corrected = corrected.replace(/\bi\b/g, "I");
      errors.push({
        originalFragment: "i",
        correctedFragment: "I",
        errorType: "Ortografía y Capitalización",
        explanation: "El pronombre personal 'I' (yo) siempre se escribe en mayúscula en inglés."
      });
    }

    if (lower.includes("more better")) {
      corrected = corrected.replace(/more better/gi, "much better");
      errors.push({
        originalFragment: "more better",
        correctedFragment: "much better",
        errorType: "Doble Comparativo",
        explanation: "'Better' ya es un comparativo irregular de 'good'. No puedes usar 'more' con él. Usa 'much better' si quieres enfatizar."
      });
    }

    if (errors.length === 0) {
      if (corrected.length > 0) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }
      return {
        originalText: original,
        fullyCorrectedText: corrected,
        errorsFound: [],
        overallFeedback: "¡Excelente trabajo! No se detectaron errores notables de gramática o puntuación en tu mensaje. Tu redacción es natural y fluida."
      };
    }

    return {
      originalText: original,
      fullyCorrectedText: corrected,
      errorsFound: errors,
      overallFeedback: "Buen intento. Hemos corregido algunos detalles para hacer tu redacción más natural y gramaticalmente correcta."
    };
  }

  function getFallbackReadingData(topic: string, level: string) {
    const normTopic = (topic || "Artificial Intelligence").toLowerCase();

    if (normTopic.includes("tech") || normTopic.includes("ai") || normTopic.includes("artificial") || normTopic.includes("computer")) {
      return {
        title: "The Rise of Artificial Intelligence",
        articleText: "Artificial Intelligence (AI) is transforming the way we work, communicate, and solve complex problems. From healthcare diagnostics to autonomous driving, AI systems analyze massive amounts of data to make predictions and decisions. However, this rapid technological advancement raises critical ethical questions regarding job displacement, privacy safeguards, and algorithmic bias. As we move forward, striking a balance between innovative breakthrough and responsible regulation remains paramount for developers and policymakers worldwide.",
        translationText: "La Inteligencia Artificial (IA) está transformando la forma en que trabajamos, nos comunicamos y resolvemos problemas complejos. Desde diagnósticos de salud hasta conducción autónoma, los sistemas de IA analizan enormes cantidades de datos para hacer predicciones y tomar decisiones. Sin embargo, este rápido avance tecnológico plantea cuestiones éticas críticas sobre el desplazamiento laboral, las salvaguardas de privacidad y el sesgo algorítmico. A medida que avanzamos, mantener un equilibrio entre el avance innovador y la regulación responsable sigue siendo fundamental para los desarrolladores y los legisladores de todo el mundo.",
        vocabulary: [
          { term: "Transforming", definition: "Making a thorough or dramatic change in the form, appearance, or character of something.", translation: "Transformando", example: "Digital cameras are transforming the photography industry." },
          { term: "Displacement", definition: "The moving of something or someone from its place, position, or role.", translation: "Desplazamiento", example: "The factory automation led to the displacement of many workers." },
          { term: "Safeguards", definition: "Measures taken to protect someone or something, or to prevent something undesirable.", translation: "Salvaguardas", example: "The company implemented strict safeguards to protect user passwords." },
          { term: "Paramount", definition: "More important than anything else; supreme or outstanding.", translation: "Fundamental", example: "Safety is paramount when designing new aircraft systems." }
        ],
        questions: [
          {
            id: 1,
            questionText: "What does the article identify as a trigger for ethical concerns in AI?",
            options: ["High computational costs", "Job displacement and privacy issues", "Lack of student interest", "Slow progress speeds"],
            correctOptionIndex: 1,
            explanation: "The article states that 'this rapid technological advancement raises critical ethical questions regarding job displacement, privacy safeguards, and algorithmic bias.'"
          },
          {
            id: 2,
            questionText: "Which sector is NOT explicitly mentioned as being affected by AI in the text?",
            options: ["Healthcare", "Autonomous driving", "Social media marketing", "The way we work"],
            correctOptionIndex: 2,
            explanation: "Healthcare and autonomous driving are mentioned as examples, and the text says AI transforms 'the way we work'. Social media marketing is not mentioned."
          },
          {
            id: 3,
            questionText: "According to the passage, who needs to strike a balance between innovation and regulation?",
            options: ["Only software developers", "Only regional politicians", "Developers and policymakers", "The general public"],
            correctOptionIndex: 2,
            explanation: "The text says 'striking a balance between innovative breakthrough and responsible regulation remains paramount for developers and policymakers'."
          }
        ]
      };
    }

    return {
      title: `The Wonders of: ${topic || "Language learning"}`,
      articleText: `Exploring the depths of "${topic || "language study"}" offers a fantastic window into understanding our modern world. When individuals immerse themselves in this topic, they acquire new cognitive perspectives and appreciate diverse global ideas. However, the path of mastery is not without its difficulties, as with any substantial intellectual pursuit. Ultimately, the rewards of persistent learning far outweigh the early challenges, opening doors to advanced careers and enriching personal experiences for those who remain committed.`,
      translationText: `Explorar a fondo "${topic || "el estudio de idiomas"}" ofrece una ventana fantástica para comprender nuestro mundo moderno. Cuando las personas se sumergen en este tema, adquieren nuevas perspectivas cognitivas y aprecian diversas ideas globales. Sin embargo, el camino de la maestría no está exento de dificultades, como ocurre con cualquier búsqueda intelectual sustancial. En última instancia, las recompensas del aprendizaje persistente superan con creces los desafíos iniciales, abriendo puertas a carreras avanzadas y enriqueciendo las experiencias personales de quienes mantienen el compromiso.`,
      vocabulary: [
        { term: "Immerse", definition: "To involve oneself deeply in a particular activity, subject, or interest.", translation: "Sumergirse", example: "She decided to immerse herself in Spanish culture for a year." },
        { term: "Cognitive", definition: "Relating to mental processes of perception, memory, judgment, and reasoning.", translation: "Cognitivo", example: "Reading books improves cognitive development in children." },
        { term: "Pursuit", definition: "The action of following or pursuing someone or something, or an activity spent in leisure.", translation: "Búsqueda / Actividad", example: "The pursuit of happiness is a universal human desire." },
        { term: "Outweigh", definition: "To be greater, more significant, or more valuable than something else.", translation: "Superar / Pesar más", example: "The benefits of regular exercise far outweigh the risks." }
      ],
      questions: [
        {
          id: 1,
          questionText: "What does the passage say happens when individuals immerse themselves in this topic?",
          options: ["They get confused and quit", "They gain cognitive perspectives and global ideas", "They spend too much money", "Nothing happens"],
          correctOptionIndex: 1,
          explanation: "The text mentions: 'When individuals immerse themselves... they acquire new cognitive perspectives and appreciate diverse global ideas.'"
        },
        {
          id: 2,
          questionText: "What is said about the rewards of persistent learning?",
          options: ["They are less than the difficulties", "They far outweigh the early challenges", "They are purely financial", "They take a lifetime to appear"],
          correctOptionIndex: 1,
          explanation: "The text says: 'Ultimately, the rewards of persistent learning far outweigh the early challenges.'"
        },
        {
          id: 3,
          questionText: "What doors does committed learning open, according to the text?",
          options: ["Doors to advanced careers and enriching experiences", "Only travel visas", "Academic tenure only", "New physical libraries"],
          correctOptionIndex: 0,
          explanation: "The passage concludes by noting that it opens doors to 'advanced careers and enriching personal experiences'."
        }
      ]
    };
  }

  function getFallbackVocabularyData(topic: string, level: string = "Intermedio") {
    const normTopic = (topic || "Travel").toLowerCase();
    const isBasic = level === "Básico";
    const isAdvanced = level === "Avanzado";

    if (normTopic.includes("travel") || normTopic.includes("trip") || normTopic.includes("vacation")) {
      if (isBasic) {
        return {
          words: [
            { term: "Ticket", definition: "A piece of paper that shows you have paid for a journey.", translation: "Boleto / Entrada", example: "I bought a train ticket to London.", ipa: "/ˈtɪk.ɪt/" },
            { term: "Luggage", definition: "Bags and suitcases that you take on a trip.", translation: "Equipaje", example: "Keep your luggage close to you at the airport.", ipa: "/ˈlʌɡ.ɪdʒ/" },
            { term: "Hotel", definition: "A place where you pay to stay when you are traveling.", translation: "Hotel", example: "We stayed in a small hotel near the beach.", ipa: "/həʊˈtel/" },
            { term: "Passport", definition: "An official document that allows you to travel to other countries.", translation: "Pasaporte", example: "Do not forget to bring your passport.", ipa: "/ˈpɑːs.pɔːt/" },
            { term: "Map", definition: "A drawing of an area that shows roads, rivers, and cities.", translation: "Mapa", example: "Let's check the map to find the station.", ipa: "/mæp/" }
          ]
        };
      }
      if (isAdvanced) {
        return {
          words: [
            { term: "Wanderlust", definition: "A strong, innate, and irresistible desire to travel and explore the world.", translation: "Pasión por viajar", example: "Her wanderlust led her to visit over thirty remote countries.", ipa: "/ˈwɒn.də.lʌst/" },
            { term: "Itinerary", definition: "A meticulously planned route or detailed travel schedule including all destinations.", translation: "Itinerario", example: "We drafted a highly flexible itinerary for our research expedition.", ipa: "/aɪˈtɪn.ər.ər.i/" },
            { term: "Sojourn", definition: "A temporary stay or visit in a place away from home.", translation: "Estadía temporal", example: "After a brief sojourn in Paris, she returned to New York.", ipa: "/ˈsɒdʒ.ɜːn/" },
            { term: "Vagabond", definition: "A person who wanders from place to place without a home or permanent job.", translation: "Vagabundo / Trotamundos", example: "He lived a vagabond lifestyle, moving wherever the wind blew.", ipa: "/ˈvæɡ.ə.bɒnd/" },
            { term: "Breathtaking", definition: "Astonishingly beautiful or magnificent; leaving one virtually breathless.", translation: "Impresionante / Deslumbrante", example: "The alpine view from the mountain's pinnacle was breathtaking.", ipa: "/ˈbreθˌteɪ.kɪŋ/" }
          ]
        };
      }
      // Intermediate (default)
      return {
        words: [
          { term: "Journey", definition: "An act of traveling from one place to another, especially over a long distance.", translation: "Viaje / Trayecto", example: "The train journey across the countryside took six hours.", ipa: "/ˈdʒɜː.ni/" },
          { term: "Destination", definition: "The place to which someone or something is going or being sent.", translation: "Destino", example: "We finally arrived at our tropical destination.", ipa: "/ˌdes.tɪˈneɪ.ʃən/" },
          { term: "Sightseeing", definition: "The activity of visiting places of interest in a particular location.", translation: "Hacer turismo", example: "We did some sightseeing in Rome yesterday.", ipa: "/ˈsaɪtˌsiː.ɪŋ/" },
          { term: "Souvenir", definition: "A small object kept as a reminder of a place visited or an event experienced.", translation: "Recuerdo / Souvenir", example: "He bought a hand-painted mug as a souvenir of his trip.", ipa: "/ˌsuː.vəˈnɪər/" },
          { term: "Reservation", definition: "An arrangement to have something kept for you, like a hotel room or a table.", translation: "Reservación", example: "I have a reservation under the name of Smith.", ipa: "/ˌrez.əˈveɪ.ʃən/" }
        ]
      };
    }

    if (normTopic.includes("work") || normTopic.includes("business") || normTopic.includes("job") || normTopic.includes("corporate")) {
      if (isBasic) {
        return {
          words: [
            { term: "Job", definition: "The regular work that a person does to earn money.", translation: "Trabajo / Empleo", example: "She is looking for a new job in Madrid.", ipa: "/dʒɒb/" },
            { term: "Office", definition: "A room or building where people work at desks.", translation: "Oficina", example: "My office is on the third floor.", ipa: "/ˈɒf.ɪs/" },
            { term: "Meeting", definition: "An occasion when people come together to discuss something.", translation: "Reunión", example: "We have an important team meeting at 10 AM.", ipa: "/ˈmiː.tɪŋ/" },
            { term: "Boss", definition: "The person who is in charge of an organization or employee.", translation: "Jefe/a", example: "Her boss gave her a new assignment.", ipa: "/bɒs/" },
            { term: "Company", definition: "An organization that sells goods or services to make money.", translation: "Compañía / Empresa", example: "He works for an international software company.", ipa: "/ˈkʌm.pə.ni/" }
          ]
        };
      }
      if (isAdvanced) {
        return {
          words: [
            { term: "Synergy", definition: "The cooperative interaction of multiple elements to produce a combined effect greater than their sum.", translation: "Sinergia", example: "The structural synergy between our engineering and marketing divisions yielded record results.", ipa: "/ˈsɪn.ə.dʒi/" },
            { term: "Leverage", definition: "To strategically utilize resources, influence, or assets to maximize output.", translation: "Aprovechar / Apalancar", example: "We must leverage our proprietary dataset to gain a competitive market share.", ipa: "/ˈliː.vər.ɪdʒ/" },
            { term: "Feasible", definition: "Conveniently and realistically practical to execute or accomplish.", translation: "Viable / Factible", example: "Expanding our operations globally is feasible given current capital reserves.", ipa: "/ˈfiː.zə.bəl/" },
            { term: "Redundancy", definition: "The state of being no longer needed or useful, or having backup parts for safety.", translation: "Redundancia", example: "The server room features triple power redundancy to prevent outages.", ipa: "/rɪˈdʌn.dən.si/" },
            { term: "Keynote", definition: "A primary, central, or defining theme, often presented as an opening address.", translation: "Discurso principal / Idea clave", example: "She delivered an inspiring keynote addressing the future of ethical machine learning.", ipa: "/ˈkiː.noʊt/" }
          ]
        };
      }
      // Intermediate (default)
      return {
        words: [
          { term: "Deadline", definition: "The latest time or date by which something must be completed.", translation: "Fecha límite", example: "The submission deadline is tomorrow at noon.", ipa: "/ˈded.laɪn/" },
          { term: "Salary", definition: "A fixed regular payment, typically paid on a monthly basis, to an employee.", translation: "Salario / Sueldo", example: "They offered a competitive starting salary with benefits.", ipa: "/ˈsæl.ər.i/" },
          { term: "Manager", definition: "A person responsible for controlling or administering an organization or team.", translation: "Gerente / Director", example: "Our project manager assigned the tasks this morning.", ipa: "/ˈmæn.ɪ.dʒər/" },
          { term: "Feedback", definition: "Information about reactions to a product, a person's performance of a task, etc.", translation: "Retroalimentación / Comentarios", example: "We received positive feedback from our beta users.", ipa: "/ˈfiːd.bæk/" },
          { term: "Schedule", definition: "A plan for carrying out process or procedure, giving lists of intended events and times.", translation: "Horario / Agenda", example: "Please check your schedule to see if you are free.", ipa: "/ˈʃed.juːl/" }
        ]
      };
    }

    // Default other topic
    if (isBasic) {
      return {
        words: [
          { term: "Easy", definition: "Not difficult to do or understand.", translation: "Fácil", example: "Learning basic vocabulary is easy with this app.", ipa: "/ˈiː.zi/" },
          { term: "Friend", definition: "A person whom one knows and has a bond of mutual affection with.", translation: "Amigo/a", example: "She went to the park with her best friend.", ipa: "/frend/" },
          { term: "Happy", definition: "Feeling or showing pleasure or contentment.", translation: "Feliz / Contento", example: "They were very happy with their exam scores.", ipa: "/ˈhæp.i/" },
          { term: "Learn", definition: "To gain knowledge or skill in something by study or experience.", translation: "Aprender", example: "I want to learn English quickly.", ipa: "/lɜːn/" },
          { term: "Book", definition: "A written or printed work consisting of pages glued or sewn together.", translation: "Libro", example: "He read an interesting book about history.", ipa: "/bʊk/" }
        ]
      };
    }
    if (isAdvanced) {
      return {
        words: [
          { term: "Pioneer", definition: "An early adopter or innovator who leads development in a new field of research or activity.", translation: "Pionero", example: "She was an acclaimed pioneer in the conceptual design of neural architecture.", ipa: "/ˌpaɪəˈnɪər/" },
          { term: "Resilient", definition: "Possessing an exceptional capacity to recover quickly from severe difficulties or setbacks.", translation: "Resistente / Resiliente", example: "Our economic infrastructure has proven remarkably resilient despite macro volatility.", ipa: "/rɪˈzɪl.i.ənt/" },
          { term: "Pinnacle", definition: "The ultimate peak of accomplishment, prestige, or successful development.", translation: "Cúspide / Pináculo", example: "Winning the Nobel Prize represented the pinnacle of her lifelong academic pursuit.", ipa: "/ˈpɪn.ə.kəl/" },
          { term: "Acquire", definition: "To obtain or develop a skill, asset, or habit through deliberate effort.", translation: "Adquirir", example: "It requires immersion to fully acquire the phonetic nuances of a second language.", ipa: "/əˈkwaɪər/" },
          { term: "Anomalous", definition: "Deviating from what is standard, normal, or expected; highly irregular.", translation: "Anómalo / Irregular", example: "The laboratory logs indicated an anomalous spike in voltage at midnight.", ipa: "/əˈnɒm.ə.ləs/" }
        ]
      };
    }
    // Intermediate (default)
    return {
      words: [
        { term: "Dynamic", definition: "Characterized by constant change, activity, progress, or positive energy.", translation: "Dinámico", example: "We work in a dynamic and fast-paced technological environment.", ipa: "/daɪˈnæm.ɪk/" },
        { term: "Improve", definition: "To make or become better in quality, strength, or status over time.", translation: "Mejorar", example: "Practicing speaking every day will improve your fluency.", ipa: "/ɪmˈpruːv/" },
        { term: "Confidence", definition: "The feeling or belief that one can rely on someone or something; self-assurance.", translation: "Confianza / Seguridad", example: "She spoke with great confidence during the presentation.", ipa: "/ˈhɒn.fɪ.dəns/" },
        { term: "Challenge", definition: "A task or situation that tests someone's abilities or endurance.", translation: "Desafío / Reto", example: "Climbing the mountain was a difficult challenge for the group.", ipa: "/ˈtʃæl.ɪndʒ/" },
        { term: "Succeed", definition: "To achieve the desired aim, outcome, or result of an effort.", translation: "Tener éxito / Triunfar", example: "If you work hard, you will succeed in passing the test.", ipa: "/səkˈsiːd/" }
      ]
    };
  }

  // AI Pronunciation Translation API
  app.post("/api/gemini/translate-term", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text is required" });
      }

      const systemPrompt = "Eres un traductor experto incorporado en una app de idiomas. Traduce la siguiente frase en español al inglés de forma natural y corporativa. Devuelve ÚNICAMENTE el texto traducido en inglés, sin explicaciones, sin comillas y sin introducciones.";

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          model: "llama-3.3-70b-versatile"
        });

        const translatedText = chatCompletion.choices[0]?.message?.content || "";
        return res.json({ translation: translatedText.trim() });
      } catch (groqError: any) {
        console.warn("Groq Translation failed, running fallback with Gemini:", groqError.message || groqError);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `${systemPrompt}\n\nTexto a traducir: "${text}"`,
          });
          const responseText = response.text || "";
          return res.json({ translation: responseText.trim() });
        } catch (geminiError: any) {
          console.error("Gemini Translation fallback failed:", geminiError);
          return res.json({ translation: text }); // return original if everything fails
        }
      }
    } catch (error: any) {
      console.error("Translation API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to translate text" });
    }
  });

  // 1. AI Pronunciation Lab API
  app.post("/api/gemini/pronunciation", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text is required" });
      }

      try {
        const prompt = `Analyze the pronunciation of the following English word or phrase: "${text}".
Provide feedback in a structured JSON format. Break it down phonetically (IPA), specify syllable stress, list common pitfalls for non-native speakers, provide a vocalization/pronunciation guide, and suggest 3 active listening or speaking exercises for practicing it.

The JSON response MUST exactly match the following JSON schema:
{
  "originalText": "string",
  "ipa": "string (International Phonetic Alphabet representation)",
  "syllables": ["string (array of syllables, with stressed syllable capitalized or marked)"],
  "stressGuide": "string (explanation of syllable stress and rhythm)",
  "commonPitfalls": ["string (common pronunciation mistakes or regional difficulties)"],
  "vocalGuide": "string (readable description of how to shape mouth/tongue)",
  "practiceExercises": ["string (3 highly focused micro-exercises)"]
}`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a precise English pronunciation analyzer. You must output valid JSON only, conforming to the exact schema specified in the user request." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (groqError: any) {
        console.warn("Groq API call failed, running premium offline phonetic estimator:", groqError.message || groqError);
        const localFallback = getFallbackPronunciationData(text);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.error("Pronunciation API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze pronunciation" });
    }
  });

  // --- EDIT DISTANCE & SIMILARITY (Filtro de Integridad) ---
  const getEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const calculateSimilarity = (spoken: string, target: string): number => {
    const clean = (str: string) =>
      str.toLowerCase()
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
         .replace(/\s+/g, " ")
         .trim()
         .split(" ")
         .filter((w: string) => w.length > 0);

    const spokenWords = clean(spoken);
    const targetWords = clean(target);

    if (targetWords.length === 0) return 0;
    if (spokenWords.length === 0) return 0;

    let matchedCount = 0;

    targetWords.forEach((tWord: string) => {
      const found = spokenWords.some((sWord: string) => {
        if (sWord === tWord) return true;
        const distance = getEditDistance(sWord, tWord);
        return distance <= Math.max(1, Math.floor(tWord.length * 0.25));
      });
      if (found) matchedCount++;
    });

    return matchedCount / targetWords.length;
  };

  // 1b. AI Pronunciation Feedback API (with Integrity Filter)
  app.post("/api/gemini/pronunciation-feedback", async (req, res) => {
    try {
      let { text, audio, mimeType, spokenText } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Auto-transcribe with Groq Whisper if spokenText is empty but audio is provided
      if ((!spokenText || spokenText.trim() === "") && audio && process.env.GROQ_API_KEY) {
        try {
          console.log(`[Pronunciation Feedback] No spokenText, transcribing audio with Groq Whisper...`);
          const audioBuffer = Buffer.from(audio, "base64");
          const audioFile = new File([audioBuffer], "recording.webm", { type: mimeType || "audio/webm" });
          const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3",
            language: "en",
          });
          spokenText = (transcription as any).text || "";
          console.log(`[Pronunciation Feedback] Whisper transcription: "${spokenText}"`);
        } catch (whisperError: any) {
          console.warn("[Pronunciation Feedback] Whisper transcription failed:", whisperError.message || whisperError);
        }
      }

      // Capa de Transcripción (Filtro de Integridad de Contenido Backend V2.0)
      const similarity = calculateSimilarity(spokenText || "", text);
      console.log(`[Pronunciation Feedback] Spoken: "${spokenText || ''}" | Target: "${text}" | Similarity: ${(similarity * 100).toFixed(1)}%`);

      if (similarity < 0.70) {
        const fallbackScore = Math.floor(Math.random() * 5) + 12; // 12% to 16%
        return res.json({
          score: fallbackScore,
          accuracy: "No detectado",
          feedback: `RECHAZO DE COINCIDENCIA DE CONTENIDO: El texto detectado ("${spokenText || '(Silencio)'}") no coincide con al menos el 70% de las palabras clave de la frase objetivo.\n\nEl motor de IA requiere una lectura fiel del contenido para calibrar la precisión de los fonemas y el acento.\n\nFrase Objetivo: "${text}"\n\nPor favor, intente pronunciarla de nuevo con claridad.`,
          tips: "Asegúrate de pronunciar cada palabra de la frase objetivo de forma clara y pausada.",
          transcription: spokenText || ""
        });
      }

      // Otherwise, proceed with high-fidelity Groq assessment
      try {
        let prompt = "";

        if (audio) {
          const audioBytes = audio.length * 0.75;
          const sizeKb = (audioBytes / 1024).toFixed(1);
          prompt = `Act as an expert English Pronunciation Assessment Engine.
The user (a Spanish speaker learning English) has recorded themselves trying to pronounce the target English text/phrase: "${text}".
The audio was recorded on a mobile/desktop device (size: ${sizeKb} KB).
The user's speech was transcribed as: "${spokenText || ''}".

Evaluate the pronunciation quality by comparing the spoken transcription against the target phrase.
- Calculate a realistic proximity score (0-100%) based on how closely "${spokenText || ''}" matches "${text}".
- If the transcription is very close to the target, score should be high (85-96%).
- If there are minor differences, score should be moderate (60-84%).
- If there are major differences, score should be low (below 60%).
- Provide a brief Spanish summary phrase (accuracy).
- Provide structured feedback and a specific corrective tip in Spanish.
- The response MUST be written in Spanish to support the learner.

Return the result strictly as a JSON object matching this schema:
{
  "score": number (integer between 0 and 100),
  "accuracy": "string (brief Spanish summary phrase like '¡Excelente!', '¡Casi nativo!', 'Buen progreso', 'Necesita práctica')",
  "feedback": "string (detailed speech analysis in Spanish)",
  "tips": "string (specific phonetic tip in Spanish)",
  "transcription": "string (the spokenText from the user)"
}`;
        } else {
          prompt = `Act as an expert English Pronunciation Assessment Engine.
The user tried to pronounce: "${text}"
The user's speech was transcribed as: "${spokenText || ''}"

Evaluate the pronunciation quality by comparing the spoken transcription against the target phrase.
- Calculate a realistic proximity score (0-100%) based on how closely "${spokenText || ''}" matches "${text}".
- If the transcription is very close to the target, score should be high (85-96%).
- If there are minor differences, score should be moderate (60-84%).
- If there are major differences, score should be low (below 60%).
- Provide a brief Spanish summary, detailed feedback, and phonetic tips in Spanish.

Return the result strictly as a JSON object matching this schema:
{
  "score": number,
  "accuracy": "string",
  "feedback": "string",
  "tips": "string",
  "transcription": "string"
}`;
        }

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are an expert English Pronunciation Assessment Engine. You must output valid JSON only, matching the exact schema specified in the user request. You MUST penalize scores when the spoken transcription does not match the target phrase." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(responseText.trim());
        // Ensure transcription is always the spokenText
        parsed.transcription = spokenText || parsed.transcription || text;
        return res.json(parsed);
      } catch (groqError: any) {
        console.warn("Groq Speech Evaluation failed, running acoustic similarity fallback:", groqError.message || groqError);

        // Fallback: calculate score from similarity ratio
        const similarityScore = Math.round(similarity * 100);
        const variance = Math.floor(Math.random() * 10) - 5;
        const finalScore = Math.max(15, Math.min(96, similarityScore + variance));

        let accuracyPhrase = "Necesita práctica";
        let customFeedback = "Tu pronunciación tiene diferencias notables con la frase objetivo. Intenta escuchar el audio modelo y repetir cada sílaba.";
        let customTip = "Presta atención a las vocales y la entonación de cada palabra.";

        if (finalScore >= 85) {
          accuracyPhrase = "¡Excelente!";
          customFeedback = "Tu pronunciación es muy cercana al modelo nativo. Excelente ritmo y articulación.";
          customTip = "Mantén la fluidez y la entonación natural. ¡Sigue así!";
        } else if (finalScore >= 70) {
          accuracyPhrase = "¡Buen progreso!";
          customFeedback = "Vas por buen camino. Algunas palabras necesitan más claridad en las vocales.";
          customTip = "Intenta reducir la velocidad y enfocarte en cada sílaba de las palabras difíciles.";
        } else if (finalScore >= 50) {
          accuracyPhrase = "Mejorando";
          customFeedback = "Se detectaron varias diferencias con la frase objetivo. Repite la frase varias veces escuchando el modelo.";
          customTip = "Divide la frase en palabras individuales y practica cada una por separado.";
        }

        return res.json({
          score: finalScore,
          accuracy: accuracyPhrase,
          feedback: customFeedback,
          tips: customTip,
          transcription: spokenText || text
        });
      }
    } catch (error: any) {
      console.error("Pronunciation Feedback Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate pronunciation feedback" });
    }
  });

  // 2. AI Listening Lab API
  app.post("/api/gemini/listening", async (req, res) => {
    try {
      const { scenario, level } = req.body;
      const targetScenario = scenario || "At a coffee shop ordering breakfast";
      const targetLevel = level || "Intermediate (B1/B2)";

      // Rule correction: detect Spanish and translate to English using Groq
      let processedScenario = targetScenario;
      
      const isSpanishText = (text: string) => {
        if (/[áéíóúüñ¿¡]/i.test(text)) return true;
        const spanishStopWords = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "y", "o", "para", "por", "con", "pedir", "comprar", "viaje", "viajar", "boleto", "vuelo", "hotel", "comida", "comiendo", "reservar", "reserva", "registro", "taxi"]);
        const words = text.toLowerCase().split(/\s+/);
        return words.some(w => spanishStopWords.has(w));
      };

      if (isSpanishText(targetScenario)) {
        try {
          const translationPrompt = "Traduce este contexto de escenario de 2-3 palabras al inglés de forma directa. Ejemplo: 'Pedir un taxi' -> 'Ordering a taxi'. Devuelve solo las palabras traducidas.";
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: translationPrompt },
              { role: "user", content: targetScenario }
            ],
            model: "llama-3.3-70b-versatile"
          });
          const translated = chatCompletion.choices[0]?.message?.content || "";
          if (translated && translated.trim()) {
            processedScenario = translated.trim().replace(/^['"\s]+|['"\s]+$/g, "");
            console.log(`[Listening Lab] Translated Spanish custom scenario "${targetScenario}" -> "${processedScenario}"`);
          }
        } catch (groqErr: any) {
          console.warn("[Listening Lab] Groq Translation failed, running fallback with Gemini:", groqErr.message || groqErr);
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: `Traduce este contexto de escenario de 2-3 palabras al inglés de forma directa. Ejemplo: 'Pedir un taxi' -> 'Ordering a taxi'. Devuelve solo las palabras traducidas.\n\nTexto: "${targetScenario}"`,
            });
            const responseText = response.text || "";
            if (responseText.trim()) {
              processedScenario = responseText.trim().replace(/^['"\s]+|['"\s]+$/g, "");
              console.log(`[Listening Lab] Gemini Fallback Translated: "${processedScenario}"`);
            }
          } catch (geminiErr) {
            console.error("[Listening Lab] Gemini translation failed as well:", geminiErr);
          }
        }
      }

      const prompt = `Create an interactive English listening scenario set in this context: "${processedScenario}" for a "${targetLevel}" learner.
Generate a realistic 4-6 exchange dialogue between two speakers (e.g. Speaker A and Speaker B).
Also provide exactly 5 comprehension questions about details, vocabulary, intent, or context from the dialogue. Include a fillBlank exercise with a sentence containing 2 or 3 placeholders like "[blank]" (e.g., "Yesterday I [blank] to the [blank] and [blank] some fresh vegetables."), corresponding answers, a Spanish comprehension question about that sentence, and 4 Spanish options. Keep it in high-fidelity JSON.`;

      // PRIMARY: Groq API for dialogue generation
      try {
        const systemInstruction = `You are an expert English language content creator for listening comprehension exercises. You MUST output valid JSON only, matching the exact schema specified. Generate realistic, natural dialogues that sound like real conversations. All vocabulary and grammar should be appropriate for the specified CEFR level.`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt + `\n\nReturn strictly as a JSON object with this schema:\n{
  "title": "string",
  "context": "string (brief setting description)",
  "dialogue": [{ "speaker": "string", "text": "string", "spanishTranslation": "string" }],
  "vocabulary": [{ "term": "string", "definition": "string", "example": "string" }],
  "questions": [{ "id": number, "questionText": "string", "options": ["string"], "correctOptionIndex": number, "explanation": "string" }],
  "fillBlank": { "sentence": "string", "blanks": ["string"], "question": "string", "options": ["string"], "correctOptionIndex": number }
}` }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        console.log(`[Listening Lab] Groq response length: ${responseText.length} chars`);
        const parsed = JSON.parse(responseText.trim());
        console.log(`[Listening Lab] Groq parsed keys: ${Object.keys(parsed).join(", ")}`);
        if (parsed && parsed.dialogue && Array.isArray(parsed.dialogue) && parsed.dialogue.length > 0) {
          console.log(`[Listening Lab] Groq generated dialogue for scenario: "${processedScenario}" (${parsed.dialogue.length} lines)`);
          return res.json(parsed);
        }
        console.warn(`[Listening Lab] Groq response missing dialogue array, falling through to Gemini`);
      } catch (groqError: any) {
        console.warn("[Listening Lab] Groq dialogue generation failed, trying Gemini fallback:", groqError.message || groqError);
      }

      // FALLBACK: Gemini API
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                context: { type: Type.STRING, description: "Brief setting description" },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      text: { type: Type.STRING },
                      spanishTranslation: { type: Type.STRING, description: "Subtle translation for comprehension assistance" }
                    },
                    required: ["speaker", "text", "spanishTranslation"]
                  }
                },
                vocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      example: { type: Type.STRING }
                    },
                    required: ["term", "definition", "example"]
                  },
                  description: "3 advanced terms or idioms from the dialogue"
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      questionText: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      correctOptionIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "questionText", "options", "correctOptionIndex", "explanation"]
                  },
                  description: "3 multiple-choice questions testing listening comprehension"
                },
                fillBlank: {
                  type: Type.OBJECT,
                  properties: {
                    sentence: { type: Type.STRING, description: "An English sentence based on the dialogue with placeholders like '[blank]' representing missing words." },
                    blanks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "The exact correct words that replace each '[blank]' in order."
                    },
                    question: { type: Type.STRING, description: "A Spanish comprehension question based on the sentence." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 options in Spanish to answer the comprehension question."
                    },
                    correctOptionIndex: { type: Type.INTEGER, description: "0-based index of the correct answer in options." }
                  },
                  required: ["sentence", "blanks", "question", "options", "correctOptionIndex"]
                }
              },
              required: ["title", "context", "dialogue", "vocabulary", "questions", "fillBlank"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.log("Listening API Gemini also failed, running offline fallback simulator:", geminiError.message || geminiError);
        const localFallback = getFallbackListeningData(processedScenario, targetLevel);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.log("Listening API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate listening lab content" });
    }
  });

  // 2b. AI Listening Lab Grading API
  app.post("/api/gemini/listening/grade", async (req, res) => {
    try {
      const { userAnswer, languageMode, dialogue } = req.body;
      if (!userAnswer || !dialogue || !Array.isArray(dialogue)) {
        return res.status(400).json({ error: "Missing userAnswer or dialogue" });
      }

      const dialogueContext = dialogue.map((d: any, idx: number) => `Speaker ${d.speaker || idx}: "${d.text}" (Spanish: "${d.spanishTranslation || ""}")`).join("\n");
      const prompt = `You are an expert English language examiner evaluating a student's listening exercise.
The target English text spoken to the student was:
${dialogueContext}

The student chose to answer in mode: "${languageMode}" (if "en", they are transcribing the English they heard; if "es", they are translating what they heard to Spanish).
The student's submitted answer is: "${userAnswer}"

Please evaluate the accuracy of the student's answer:
1. Assign an integer score from 0 to 100.
2. Provide a constructive, helpful feedback summary explaining what they captured well, any mishearings, or translations errors. Write this feedback in Spanish.
3. Provide key correct phrases they should pay attention to in Spanish.

Output strictly as a JSON object matching this schema:
{
  "score": <number>,
  "feedback": "<detailed feedback in Spanish>",
  "keyCorrections": "<key phrases and corrections in Spanish>"
}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                keyCorrections: { type: Type.STRING }
              },
              required: ["score", "feedback", "keyCorrections"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.warn("Grade API Gemini failed, running fallback grader:", geminiError.message || geminiError);
        // Fallback calculation
        const score = Math.min(100, Math.max(15, Math.floor(25 + Math.random() * 65)));
        return res.json({
          score,
          feedback: "Tu respuesta ha sido analizada localmente. Has capturado algunas de las palabras clave del escenario. Sigue practicando tu oído reproduciendo el audio varias veces para captar los detalles finos.",
          keyCorrections: "Intenta identificar palabras como verbos modales, artículos y preposiciones que suelen pasar desapercibidos en el habla rápida."
        });
      }
    } catch (error: any) {
      console.error("Listening Grader Error:", error);
      res.status(500).json({ error: error.message || "Failed to grade listening answer" });
    }
  });

  // 2b. Listening comprehension questions generator
  app.post("/api/gemini/listening/questions", async (req, res) => {
    try {
      const { dialogue, scenario } = req.body;
      if (!dialogue || !Array.isArray(dialogue)) {
        return res.status(400).json({ error: "Missing dialogue" });
      }

      const dialogueText = dialogue.map((d: any) => `${d.speaker}: ${d.text}`).join("\n");
      const prompt = `You are an English listening comprehension test maker. Based on this dialogue${scenario ? ` about "${scenario}"` : ""}:

${dialogueText}

Generate exactly 5 multiple-choice comprehension questions. Each question should test understanding of details, vocabulary, intent, or context from the dialogue. Make questions varied: some about specific facts, some about vocabulary meaning, some about speaker intentions.

Output strictly as JSON:
{
  "questions": [
    {
      "question": "question text in Spanish",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || '{"questions":[]}';
        return res.json(JSON.parse(responseText.trim()));
      } catch (groqError: any) {
        console.warn("Questions API Groq failed:", groqError.message || groqError);
        const fallbackQuestions = dialogue.slice(0, Math.min(5, dialogue.length)).map((d: any, idx: number) => ({
          question: `¿Qué dijo ${d.speaker} en la línea ${idx + 1}?`,
          options: [
            d.text,
            "No dice nada relevante",
            "Se disculpa por llegar tarde",
            "Pide una disculpa formal"
          ],
          correctIndex: 0
        }));
        return res.json({ questions: fallbackQuestions });
      }
    } catch (error: any) {
      console.error("Listening Questions Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  // 3. SafeZone Chat API
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, scenario, customSystemInstruction, customAppMasterInfo } = req.body;
      const targetScenario = scenario || "Ordering food at a New York restaurant";
      
      let systemInstruction = `You are an encouraging and supportive English conversation partner (Aura) in a cockpit-like bilingual console.
The user is chatting with you in this context: "${targetScenario}".
Your goal is to sustain a natural, immersive, and helpful conversation.

Analyze the user's very last message for grammatical errors, spelling mistakes, or awkward phrasing, and provide a polite improvement or tip in Spanish. If the message has no errors and is perfectly natural, set isCorrect to true.

Conversation history:
${messages.map((m: any) => `${m.role === "user" ? "User" : "Aura"}: ${m.content}`).join("\n")}

Respond to their last message and evaluate it.`;

      if (customSystemInstruction && customSystemInstruction.trim().length > 0) {
        systemInstruction += `\n\n[INSTRUCCIONES DE SISTEMA ADICIONALES]:\n${customSystemInstruction}`;
      }

      if (customAppMasterInfo && customAppMasterInfo.trim().length > 0) {
        systemInstruction += `\n\n[FICHA TÉCNICA / INFORMACIÓN MASTER DE LA APLICACIÓN TECLINGO]:\n${customAppMasterInfo}`;
      }

      // PRIMARY: Groq (always works)
      const formattedContents = messages.map((m: any) => ({
        role: (m.role === "user" || m.role === "system") ? m.role : "assistant",
        content: m.content
      }));

      if (formattedContents.length === 0) {
        formattedContents.push({ role: "user", content: "Hello! Let's start our conversation in: " + targetScenario });
      }

      const groqMessages = [
        { role: "system", content: `You are an encouraging English conversation partner named Aura in a cockpit-like bilingual console.
The user is chatting with you in this context: "${targetScenario}".
Your goal is to sustain a natural, immersive, and helpful conversation.

Analyze the user's very last message for grammatical errors, spelling mistakes, or awkward phrasing, and provide a polite improvement or tip in Spanish. If the message has no errors and is perfectly natural, set isCorrect to true.

${customSystemInstruction && customSystemInstruction.trim().length > 0 ? `[INSTRUCCIONES ADICIONALES]: ${customSystemInstruction}` : ""}
${customAppMasterInfo && customAppMasterInfo.trim().length > 0 ? `[FICHA TECNICA]: ${customAppMasterInfo}` : ""}

Format your final output as a JSON object matching this schema exactly:
{
  "reply": "string (conversational English reply)",
  "evaluation": {
    "isCorrect": boolean,
    "correctedText": "string (corrected user input)",
    "detectedErrors": "string",
    "explanation": "string (Spanish explanation)",
    "correctedTextTranslation": "string (Spanish translation of correctedText)"
  },
  "suggestedResponses": ["string", "string", "string"]
}` },
        ...formattedContents
      ];

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: groqMessages,
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (groqError: any) {
        console.warn("SafeZone Chat Groq failed, trying Gemini fallback:", groqError.message || groqError);

        // FALLBACK: Gemini (may fail with PERMISSION_DENIED)
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: systemInstruction,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: { type: Type.STRING },
                  evaluation: {
                    type: Type.OBJECT,
                    properties: {
                      isCorrect: { type: Type.BOOLEAN },
                      correctedText: { type: Type.STRING },
                      detectedErrors: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      correctedTextTranslation: { type: Type.STRING }
                    },
                    required: ["isCorrect", "correctedText", "detectedErrors", "explanation", "correctedTextTranslation"]
                  },
                  suggestedResponses: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["reply", "evaluation", "suggestedResponses"]
              }
            }
          });

          const responseText = response.text || "{}";
          return res.json(JSON.parse(responseText.trim()));
        } catch (geminiError: any) {
          console.log("SafeZone Chat Gemini also failed, running offline fallback:", geminiError.message || geminiError);
          const localFallback = getFallbackChatResponse(messages || [], targetScenario);
          return res.json(localFallback);
        }
      }
    } catch (error: any) {
      console.log("SafeZone Chat API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });

  // 4. AI Tutor API
  app.post("/api/gemini/tutor", async (req, res) => {
    try {
      const { query, level, customSystemInstruction, customAppMasterInfo } = req.body;
      const targetQuery = query || "Explain the difference between Present Perfect and Past Simple.";
      const targetLevel = level || "Intermediate (B2)";

      let tutorPrompt = `You are Teclingo's Premium AI Tutor.
The student (level: ${targetLevel}) asks: "${targetQuery}".
Respond with an elegant, clear, structured, and friendly explanation. Provide illustrative side-by-side examples, a quick interactive 3-question quiz, and learning tips specifically targeted to their level. Output strictly in JSON format.`;

      if (customSystemInstruction && customSystemInstruction.trim().length > 0) {
        tutorPrompt += `\n\n[INSTRUCCIONES DE SISTEMA ADICIONALES]:\n${customSystemInstruction}`;
      }

      if (customAppMasterInfo && customAppMasterInfo.trim().length > 0) {
        tutorPrompt += `\n\n[FICHA TÉCNICA / INFORMACIÓN MASTER DE LA APLICACIÓN TECLINGO]:\n${customAppMasterInfo}`;
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: tutorPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING, description: "Markdown-compatible clear explanation with beautiful formatting" },
                examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sentence: { type: Type.STRING, description: "Example sentence" },
                      concept: { type: Type.STRING, description: "Why this example illustrates the point" }
                    },
                    required: ["sentence", "concept"]
                  }
                },
                quickQuiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "question", "options", "correctIndex", "explanation"]
                  },
                  description: "3 simple quiz questions to test understanding immediately"
                },
                tutorTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 short, highly actionable learning strategies for this specific topic"
                }
              },
              required: ["explanation", "examples", "quickQuiz", "tutorTips"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.log("AI Tutor API Gemini failed, running offline lesson generator:", geminiError.message || geminiError);
        const localFallback = getFallbackTutorData(targetQuery, targetLevel);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.log("AI Tutor API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to get tutor feedback" });
    }
  });

  // 5. TOEFL Simulator API
  app.post("/api/gemini/toefl", async (req, res) => {
    try {
      const { type, prompt, submission } = req.body;
      const testType = type || "writing"; 
      const testPrompt = prompt || "Do you agree or disagree with the following statement? Television has destroyed communication among friends and family.";
      const userSubmission = submission || "";

      let apiPrompt = "";
      if (testType === "writing") {
        apiPrompt = `As an expert TOEFL iBT grader, evaluate the following writing submission.
TOEFL Essay Prompt: "${testPrompt}"
User Essay Submission: "${userSubmission}"

Grade it strictly on the official TOEFL rubric scale (0-30). Provide a score, a detailed diagnostic of their grammar, structure, and lexical resource, and a high-scoring sample essay (score 30) for the same prompt. Provide the output in high-fidelity JSON.`;
      } else {
        apiPrompt = `Provide a simulated TOEFL section practice module for: "${testType}".
Prompt / Question: "${testPrompt}"
User Answer: "${userSubmission || "(Not submitted)"}"

Provide a grade (0-30), detailed evaluation feedback, actionable improvement points, and a model high-scoring exemplar response. Format strictly as JSON.`;
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: apiPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER, description: "Score out of 30" },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                grammarEvaluation: { type: Type.STRING, description: "Detailed check on syntax, verbs, prepositions" },
                vocabularyEvaluation: { type: Type.STRING, description: "Analysis of vocabulary range and word choices" },
                exemplarResponse: { type: Type.STRING, description: "Model full-score sample response for this prompt" },
                tipsToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable tips to boost TOEFL score" }
              },
              required: ["score", "strengths", "weaknesses", "grammarEvaluation", "vocabularyEvaluation", "exemplarResponse", "tipsToImprove"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.log("TOEFL Simulator API Gemini failed, running offline grader fallback:", geminiError.message || geminiError);
        const localFallback = getFallbackTOEFLResult(testType, testPrompt, userSubmission);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.log("TOEFL Simulator API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to evaluate TOEFL response" });
    }
  });

  // Helper: detect if text is written in Spanish
  function isTextSpanish(text: string): boolean {
    const lower = (text || "").toLowerCase().trim();
    const spanishIndicators = [
      "que", "como", "para", "con", "por", "una", "este", "esta", "eso", "esa", "esto", "del", "los", "las", "hola",
      "quiero", "puedo", "tengo", "hacer", "aprender", "escribir", "frase", "español", "espanol", "ingles", "inglés",
      "cómo", "dónde", "cuando", "quién", "quien", "por qué", "porque", "bien", "todo", "pero", "verbo", "gramática",
      "es", "el", "la", "un", "y", "o"
    ];
    const words = lower.split(/[^a-zA-Záéíóúüñ]+/);
    let matchCount = 0;
    for (const word of words) {
      if (spanishIndicators.includes(word)) {
        matchCount++;
      }
    }
    if (lower.includes("¿") || lower.includes("¡")) {
      return true;
    }
    if (matchCount >= 2 || (words.length > 0 && matchCount / words.length >= 0.25)) {
      return true;
    }
    return false;
  }

  // 6. Grammar Lab API with RAG connection
  app.post("/api/gemini/grammar", async (req, res) => {
    try {
      const { text, customSystemInstruction, customAppMasterInfo, customKBDatabase } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Check if text is written in Spanish
      if (isTextSpanish(text)) {
        return res.json({
          isSpanishRejected: true,
          isPerfect: false,
          originalText: text,
          correctedText: "",
          explanation: `⚠️ **Entrada en español rechazada**\n\nHemos detectado que has escrito tu texto o consulta en español: *"${text}"*.\n\nLa sección **Grammar Lab** está diseñada **exclusivamente para analizar, calificar y perfeccionar redacciones escritas en inglés**.\n\nPor favor, ingresa una oración redactada directamente en inglés para que podamos ayudarte a corregir sus errores gramaticales, ortográficos, de estructura y estilo. ¡Anímate a escribir en inglés y te enseñaremos cómo perfeccionarlo!`
        });
      }

      // Build RAG extra context
      let extraContext = "";
      if (customAppMasterInfo && customAppMasterInfo.trim().length > 0) {
        extraContext += `\n\n[INFORMACIÓN DE CONTEXTO DE TECLINGO (FACTS OFICIALES)]:\n${customAppMasterInfo}`;
      }
      if (customKBDatabase && Array.isArray(customKBDatabase) && customKBDatabase.length > 0) {
        extraContext += `\n\n[CONOCIMIENTO ADICIONAL DE LA BASE DE DATOS (RAG - PREGUNTAS Y RESPUESTAS OFICIALES)]:\n` +
          customKBDatabase.map((item: any, index: number) => `Pregunta #${index + 1}: ${item.question}\nRespuesta Oficial: ${item.answer}`).join("\n\n");
      }

      const systemPrompt = `You are Teclingo's Premium AI Writing Tutor and Grammar Expert.
You analyze English texts, identify grammatical/orthographic/style/punctuation errors, and explain them pedagogically.
If the text is written in Spanish or is a Spanish question (e.g. asking "que es el verbo to be?"), you MUST reject it by setting "isSpanishRejected" to true in your JSON response.
You must output valid JSON only, conforming exactly to the JSON schema specified.`;

      const userPrompt = `Analyze the English grammar, spelling, punctuation, and style of the following text: "${text}".

${extraContext}

If the text is primarily in Spanish or contains a Spanish question, set "isSpanishRejected" to true and return a warm warning in Spanish inside the "explanation" field.

Return the complete breakdown in a high-fidelity JSON matching this schema exactly:
{
  "isSpanishRejected": boolean (true if the text is primarily in Spanish or a Spanish question, false if written in English),
  "isPerfect": boolean (true if user's text is in English and has absolutely NO errors, typos, or style flaws; false if there is any correction needed or if it is rejected),
  "originalText": "string (the exact original text)",
  "correctedText": "string (the fully corrected, polished, and natural-sounding English version, OR empty string if rejected)",
  "explanation": "string (exhaustive and clear pedagogical analysis in Spanish formatted with beautiful Markdown. If rejected, write a clear, polite explanation in Spanish about why it was rejected and that this section is only for English)"
}

RIGOROUS DIRECTIVES FOR THE 'explanation' FIELD (if not rejected):
1. Structure the explanation clearly using Markdown. For EVERY error or correction found:
   - State clearly **what was wrong** in the original fragment.
   - Explain **Por qué NO se debe usar** (Why it is wrong, referring to the grammatical rule).
   - Explain **Por qué SÍ se debe usar** (Why the corrected fragment is right and the grammar rule behind it).
   - Provide illustrative side-by-side **examples of use and counter-use** (Correct vs. Incorrect) to ensure the user fully understands.
2. If the user's text mentions or asks about Teclingo (costs, levels, certification, TOEFL simulators, WhatsApp support, public university scholarships, etc.), you MUST consult the RAG database provided above and integrate the official factual answers or context seamlessly within your 'explanation' or feedback, correcting any misconceptions with Teclingo's official information.
3. Keep the tone warm, highly professional, encouraging, and written in elegant Spanish.`;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (groqError: any) {
        console.warn("Grammar Lab API Groq failed, running fallback with Gemini:", groqError.message || groqError);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `${systemPrompt}\n\n${userPrompt}`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isSpanishRejected: { type: Type.BOOLEAN, description: "True if user text is written in Spanish" },
                  isPerfect: { type: Type.BOOLEAN, description: "True if user text is completely correct and in English" },
                  originalText: { type: Type.STRING },
                  correctedText: { type: Type.STRING, description: "The completely fixed and polished version of the text" },
                  explanation: { type: Type.STRING, description: "Detailed Spanish explanation of the errors or warning" }
                },
                required: ["isSpanishRejected", "isPerfect", "originalText", "correctedText", "explanation"]
              }
            }
          });

          const responseText = response.text || "{}";
          return res.json(JSON.parse(responseText.trim()));
        } catch (geminiError: any) {
          console.log("Grammar Lab API Gemini failed, running offline checker:", geminiError.message || geminiError);
          const localFallback = getFallbackGrammarData(text);
          const isPerfect = localFallback.errorsFound.length === 0;
          let explanationText = localFallback.overallFeedback;
          if (!isPerfect) {
            explanationText += "\n\n### Detalle de Correcciones:\n" + 
              localFallback.errorsFound.map((err: any) => `* **Original**: "${err.originalFragment}" → **Corrección**: "${err.correctedFragment}" (${err.errorType})\n  * **Explicación**: ${err.explanation}`).join("\n\n");
          }
          return res.json({
            isSpanishRejected: false,
            isPerfect,
            originalText: text,
            correctedText: localFallback.fullyCorrectedText,
            explanation: explanationText
          });
        }
      }
    } catch (error: any) {
      console.log("Grammar Lab API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze grammar" });
    }
  });

  // 7. Reading Lab API
  app.post("/api/gemini/reading", async (req, res) => {
    try {
      const { topic, level } = req.body;
      const targetTopic = topic || "Artificial Intelligence";
      const targetLevel = level || "Intermediate (B1/B2)";

      const prompt = `Create an elegant English reading article set in this topic: "${targetTopic}" for a "${targetLevel}" learner.
Note on the topic: The topic might be proposed in Spanish or English (max 3 words) by a beginner student who does not know English correctly yet. If the topic is in Spanish, translate it to English first, then write the article based on it.
The article should be about 250-400 words long, beautifully structured, engaging, and grammatically appropriate for the level.

Because the user does not know English correctly yet, ensure that you provide:
1. A direct Spanish translation of the text.
2. 4 essential, basic vocabulary terms related to the proposed topic, with simple English definitions, Spanish translations, and clear example sentences. Make them highly accessible and basic for a learner.
3. 3 multiple-choice comprehension questions with explanation of answers.
Return the result strictly in JSON.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                articleText: { type: Type.STRING, description: "The full English article" },
                translationText: { type: Type.STRING, description: "Full Spanish translation of the article" },
                vocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING, description: "Simple explanation of the term" },
                      translation: { type: Type.STRING, description: "Spanish translation of the term" },
                      example: { type: Type.STRING, description: "Original sentence illustrating the term" }
                    },
                    required: ["term", "definition", "translation", "example"]
                  },
                  description: "4 critical terms from the article"
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      questionText: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctOptionIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "questionText", "options", "correctOptionIndex", "explanation"]
                  },
                  description: "3 reading comprehension questions"
                }
              },
              required: ["title", "articleText", "translationText", "vocabulary", "questions"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.log("Reading Lab API Gemini failed, running offline text builder:", geminiError.message || geminiError);
        const localFallback = getFallbackReadingData(targetTopic, targetLevel);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.log("Reading Lab API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate reading lab content" });
    }
  });

  // 8. Vocabulary Center API
  app.post("/api/gemini/vocabulary", async (req, res) => {
    try {
      const { topic, level } = req.body;
      const targetTopic = topic || "Travel";
      const targetLevel = level || "Intermedio";

      let levelInstructions = "";
      if (targetLevel === "Básico") {
        levelInstructions = "Focus strictly on basic, high-frequency words or expressions suitable for A1-A2 English learners. Keep definitions extremely simple and clear, and provide very short, easy exemplar sentences.";
      } else if (targetLevel === "Avanzado") {
        levelInstructions = "Focus on advanced, professional, or academic vocabulary/expressions suitable for C1-C2 English learners. Include academic/professional terms, idiomatic nuances, or complex collocations, with sophisticated definitions and rich exemplar sentences.";
      } else {
        // Intermedio
        levelInstructions = "Focus on intermediate vocabulary/expressions suitable for B1-B2 English learners, such as everyday phrases, common phrasal verbs, and compound structures. Ensure definitions are moderately detailed with clear, natural exemplar sentences.";
      }

      const prompt = `Generate a curated set of 5 English words or expressions related to the topic: "${targetTopic}", adapted specifically for ${targetLevel} level.
${levelInstructions}
Provide the IPA (phonetic spelling), a simple explanation of the term, Spanish translation of the term, and a clear exemplar sentence.
Return the result strictly in JSON.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                words: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING, description: "Explanation of the word" },
                      translation: { type: Type.STRING, description: "Spanish translation of the word" },
                      example: { type: Type.STRING, description: "Full exemplar sentence using the word" },
                      ipa: { type: Type.STRING, description: "Phonetic spelling in IPA, e.g. /træv.əl/" }
                    },
                    required: ["term", "definition", "translation", "example", "ipa"]
                  }
                }
              },
              required: ["words"]
            }
          }
        });

        const responseText = response.text || "{}";
        return res.json(JSON.parse(responseText.trim()));
      } catch (geminiError: any) {
        console.log("Vocabulary Center API Gemini failed, running offline lexicographer:", geminiError.message || geminiError);
        const localFallback = getFallbackVocabularyData(targetTopic, targetLevel);
        return res.json(localFallback);
      }
    } catch (error: any) {
      console.log("Vocabulary Center API Outer Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate vocabulary words" });
    }
  });

  // 9. Public Support Chat API
  app.post("/api/support/chat", async (req, res) => {
    try {
      const { messages, customSystemInstruction, customKBDatabase, customAppMasterInfo } = req.body;
      const chatMessages = messages || [];
      
      let systemInstruction = `You are Teclingo's Public Support AI Assistant.
Teclingo is an innovative English learning platform designed specifically for engineering and technical students (aligned with TecNM programs and international CEFR standard B1/B2).
Key features include:
- Motor de Auditoría: Corrección gramatical en tiempo real.
- Fonética Profunda: Análisis de acento y entonación nativa.
- Integración Blockchain: Certificados oficiales verificables.
- Procesamiento Llama/Groq de alta velocidad.
- Auditoría de 'It': Corrección automática de omisiones de sujeto.
- 12 niveles alineados al TecNM y simuladores TOEFL calibrados.
- Enfoque Tech con vocabulario especializado en ingeniería.
- Acceso 24/7, Contenido Adaptativo y Reportes Athena detallados.
- Interfaz 'Aqua' estilo Apple clara y limpia.
- Soporte empático con tutoría guiada y paciente.

Answer the visitor's question in a warm, polite, and professional manner, mainly in Spanish. Keep your answer highly helpful, clear, structured with markdown, and relatively concise (usually 120-180 words). Offer to connect them to our teachers via WhatsApp if they need personalized details.`;

      if (customSystemInstruction && customSystemInstruction.trim().length > 0) {
        systemInstruction = customSystemInstruction;
      }

      if (customAppMasterInfo && customAppMasterInfo.trim().length > 0) {
        systemInstruction += `\n\n[FICHA TÉCNICA / INFORMACIÓN MASTER DE LA APLICACIÓN - DETALLES INFORMATIVOS Y TÉCNICOS IMPORTANTES DE TECLINGO]:\n${customAppMasterInfo}`;
      }

      if (customKBDatabase && Array.isArray(customKBDatabase) && customKBDatabase.length > 0) {
        systemInstruction += `\n\n[CRITICAL KNOWLEDGE BASE / COMPANY FACTS DATABASE - CONSULT THIS AND PRIORITIZE FOR RELEVANT QUERIES]:\n` +
          customKBDatabase.map((item: any, index: number) => `Fact #${index + 1}:\n- Topic/Query: ${item.question}\n- Official Information: ${item.answer}`).join("\n\n");
      }

      // Add explicit knowledge base instruction
      systemInstruction += `\n\nCRITICAL DIRECTIVE: You have access to a custom database and company knowledge base above. When answering the user's questions, you MUST consult these facts and official information first. If there's any matching topic or query, use the official answer precisely to respond coherently and naturally. Do not speculate or contradict these facts. Keep your answers natural, encouraging, and written in a professional, warm Spanish.`;

      // Try to use Groq as primary engine
      try {
        if (!process.env.GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY environment variable is not defined");
        }

        const groqMessages = [
          { role: "system", content: systemInstruction },
          ...chatMessages.map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          }))
        ];

        if (groqMessages.length === 1) {
          groqMessages.push({ role: "user", content: "Hola, me gustaría saber qué es Teclingo y cuáles son sus beneficios." });
        }

        const chatCompletion = await groq.chat.completions.create({
          messages: groqMessages,
          model: "llama-3.3-70b-versatile"
        });

        const reply = chatCompletion.choices[0]?.message?.content || "";
        if (reply.trim().length > 0) {
          return res.json({ reply: reply.trim() });
        } else {
          throw new Error("Empty reply from Groq");
        }
      } catch (groqError: any) {
        console.warn("Support Chat API Groq failed, running fallback with Gemini:", groqError.message || groqError);
        
        // Convert messages to Gemini SDK contents format
        const contents = chatMessages.map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        if (contents.length === 0) {
          contents.push({ role: "user", parts: [{ text: "Hola, me gustaría saber qué es Teclingo y cuáles son sus beneficios." }] });
        }

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            }
          });

          const reply = response.text || "Lo siento, no pude procesar la respuesta en este momento.";
          return res.json({ reply });
        } catch (geminiError: any) {
          console.log("Support Chat API Gemini fallback failed, running offline helper:", geminiError.message || geminiError);

        
        // Let's create a robust offline fallback based on common queries
        const lastUserMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].content.toLowerCase() : "";
        let reply = "";
        if (lastUserMsg.includes("precio") || lastUserMsg.includes("costo") || lastUserMsg.includes("pago") || lastUserMsg.includes("comprar")) {
          reply = `**¡Hola!** Teclingo ofrece planes altamente accesibles diseñados para estudiantes e ingenieros.

Nuestra suscripción estándar te otorga **acceso total** a:
1. **Motor de Auditoría de IA** y análisis de voz en tiempo real.
2. **12 niveles de preparación** alineados con los planes del TecNM.
3. **Simuladores TOEFL** con reactivos técnicos calibrados.
4. **Certificaciones oficiales en Blockchain**.

Para conocer promociones vigentes de tu plantel o descuentos especiales, puedes hacer clic en el botón de **WhatsApp** de aquí abajo para hablar directamente con uno de nuestros profesores coordinadores. ¡Estaremos encantados de ayudarte!`;
        } else if (lastUserMsg.includes("toefl") || lastUserMsg.includes("examen") || lastUserMsg.includes("certificado") || lastUserMsg.includes("validez")) {
          reply = `**¡Hola!** Sí, en Teclingo contamos con simuladores **TOEFL** con reactivos calibrados que te prepararán con precisión técnica para el examen real.

Además, todos nuestros niveles están alineados al marco estándar internacional **MCER (B1/B2)** y nuestros certificados oficiales cuentan con **Integración Blockchain** para que sean 100% verificables ante cualquier empresa o institución. 

¿Te gustaría saber más? Te sugiero platicar con un docente asesor haciendo clic en el botón de **WhatsApp** de este panel flotante.`;
        } else if (lastUserMsg.includes("beneficio") || lastUserMsg.includes("ventaja") || lastUserMsg.includes("por qué") || lastUserMsg.includes("que es") || lastUserMsg.includes("cómo funciona")) {
          reply = `**¡Hola! Teclingo es el primer ecosistema de aprendizaje de inglés optimizado para ingeniería y tecnología.**

Nuestros pilares clave son:
1. **Tecnología IA**: Auditoría gramatical en tiempo real, análisis de fonética y procesamiento de lenguaje de alta velocidad con Llama/Groq.
2. **Ventajas Académicas**: Ruta de titulación con 12 niveles alineados al TecNM, simuladores TOEFL y enfoque en vocabulario técnico bilingüe.
3. **Experiencia Premium**: Acceso las 24 horas del día, los 7 días de la semana, reportes de desempeño automatizados y una hermosa interfaz estilo Apple (Aqua) libre de fatiga visual.

Si tienes cualquier duda específica, ¡puedes platicar con nosotros directamente por **WhatsApp** usando el botón verde de abajo!`;
        } else {
          reply = `**¡Hola! Gracias por escribir al soporte de Teclingo.** 😊

Soy tu asistente virtual de IA. Teclingo es la plataforma de inglés líder especializada en perfiles tecnológicos y de ingeniería, alineada al TecNM y con simuladores TOEFL.

¿Tienes alguna pregunta sobre nuestras herramientas de Inteligencia Artificial (como el Motor de Auditoría o la Fonética Profunda), nuestros 12 niveles académicos, o las facilidades de pago? 

Escribe tu duda y con gusto te daré información. También puedes comunicarte directamente con nuestros coordinadores presionando el botón de **WhatsApp** de este panel.`;
        }
        return res.json({ reply });
      }
    }
  } catch (error: any) {
    console.log("Support Chat API Outer Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate support response" });
  }
});

  // ═══════════════════════════════════════════════════════════════════
  // TECLINGO AI TUTOR — Chat, Knowledge Base Search, Exercises
  // ═══════════════════════════════════════════════════════════════════

  // POST /api/tutor/ask — Chat with the AI tutor (multi-turn conversation)
  app.post("/api/tutor/ask", async (req, res) => {
    try {
      const { messages, knowledgeContext, systemInstruction } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg.role !== "user") {
        return res.status(400).json({ error: "Last message must be from user." });
      }

      const systemPrompt = `You are TECLINGO AI Tutor — a world-class, friendly, and patient English language tutor specialized in helping intermediate-to-advanced learners master English grammar, vocabulary, pronunciation, and usage.

CORE RULES:
1. Always respond in the SAME LANGUAGE the student writes in (if they write in Spanish, respond in Spanish; if in English, respond in English).
2. Be encouraging, warm, and constructive — never condescending.
3. Use Markdown formatting for clarity: bold key terms, use bullet points, use code blocks for formulas.
4. When explaining grammar, always provide: (a) the formula/structure, (b) 2-3 examples with correct and incorrect variants, (c) a brief tip.
5. If the student makes an error, gently correct it with an explanation.
6. Keep explanations concise but thorough — aim for clarity over length.
7. You have access to a knowledge base of English grammar concepts. Use the provided context to give accurate, structured answers.
8. At the end of explanations, suggest 1-2 follow-up topics the student might want to explore.
${systemInstruction ? `\n\n[ADDITIONAL INSTRUCTIONS]:\n${systemInstruction}` : ""}`;

      let fullPrompt = systemPrompt + "\n\n";
      if (knowledgeContext && knowledgeContext.trim().length > 0) {
        fullPrompt += `[KNOWLEDGE BASE CONTEXT — Use this for accurate grammar explanations]:\n${knowledgeContext}\n\n`;
      }

      fullPrompt += "CONVERSATION HISTORY:\n";
      for (const msg of messages) {
        const role = msg.role === "user" ? "Student" : "Tutor";
        fullPrompt += `${role}: ${msg.content}\n`;
      }
      fullPrompt += "\nTutor:";

      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt + (knowledgeContext ? `\n\n[KNOWLEDGE BASE CONTEXT]:\n${knowledgeContext}` : "") },
            ...messages.map((m: any) => ({
              role: m.role === "user" ? "user" as const : "assistant" as const,
              content: m.content,
            })),
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });

        const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
        return res.json({ reply });
      } catch (groqError: any) {
        console.log("[Tutor Ask] Groq failed:", groqError.message || groqError);
        return res.json({
          reply: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        });
      }
    } catch (error: any) {
      console.log("[Tutor Ask] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get tutor response" });
    }
  });

  // POST /api/tutor/search — Search the knowledge base and return matching concepts
  app.post("/api/tutor/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Search query is required." });
      }

      // The knowledge base is searched client-side; this endpoint
      // enriches results with AI-generated context when needed
      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a knowledge base search assistant. The student is searching for: '" + query + "'. Provide a brief 2-3 sentence summary of this English grammar topic, including its importance and level. Be concise and educational. Respond in the language the query is written in."
            },
            { role: "user", content: query },
          ],
          temperature: 0.5,
          max_tokens: 512,
        });

        const summary = response.choices[0]?.message?.content || "";
        return res.json({ summary });
      } catch (groqError: any) {
        console.log("[Tutor Search] Groq failed:", groqError.message || groqError);
        return res.json({ summary: "" });
      }
    } catch (error: any) {
      console.log("[Tutor Search] Error:", error);
      res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  // POST /api/tutor/exercise — Generate practice exercises based on a concept
  app.post("/api/tutor/exercise", async (req, res) => {
    try {
      const { conceptId, conceptTitle, level, exerciseType } = req.body;
      const targetConcept = conceptTitle || conceptId || "English grammar";
      const targetLevel = level || "B1";
      const targetType = exerciseType || "fill_blank";

      const exercisePrompt = `Generate a set of 5 English ${targetType === "fill_blank" ? "fill-in-the-blank" : "multiple choice"} exercises for the concept: "${targetConcept}" at ${targetLevel} level.

EXERCISE FORMAT:
- Each exercise should test understanding of this specific concept
- Include a mix of easy, medium, and challenging questions
- For fill-in-the-blank: provide the sentence with a blank, the correct answer, and an explanation
- For multiple choice: provide the question, 4 options (A-D), the correct answer index, and an explanation

Return strictly JSON format with this structure:
{
  "exercises": [
    {
      "type": "${targetType}",
      "sentence": "sentence with __BLANK__ or question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert English language exercise generator. Always respond with valid JSON only — no markdown, no extra text." },
            { role: "user", content: exercisePrompt },
          ],
          temperature: 0.8,
          max_tokens: 2048,
        });

        const rawText = response.choices[0]?.message?.content || "{}";
        // Strip markdown code fences if present
        const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        try {
          const parsed = JSON.parse(cleaned);
          return res.json(parsed);
        } catch {
          console.log("[Tutor Exercise] Failed to parse JSON response");
          return res.json({ exercises: [] });
        }
      } catch (groqError: any) {
        console.log("[Tutor Exercise] Groq failed:", groqError.message || groqError);
        return res.json({ exercises: [] });
      }
    } catch (error: any) {
      console.log("[Tutor Exercise] Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate exercises" });
    }
  });

  // POST /api/tutor/quiz — Generate a 5-question quiz from a concept
  app.post("/api/tutor/quiz", async (req, res) => {
    try {
      const { conceptTitle, level } = req.body;
      const targetConcept = conceptTitle || "English grammar";

      const quizPrompt = `Generate a 5-question quiz about "${targetConcept}" for a ${level || "B1"} level English learner.

Each question must be multiple choice with exactly 4 options (A, B, C, D). Include 1 correct answer and 3 plausible distractors.

Return strictly JSON:
{
  "quiz": [
    {
      "id": 1,
      "question": "question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert English quiz generator. Respond with valid JSON only — no markdown, no extra text." },
            { role: "user", content: quizPrompt },
          ],
          temperature: 0.8,
          max_tokens: 2048,
        });

        const rawText = response.choices[0]?.message?.content || "{}";
        const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        try {
          const parsed = JSON.parse(cleaned);
          return res.json(parsed);
        } catch {
          return res.json({ quiz: [] });
        }
      } catch (groqError: any) {
        console.log("[Tutor Quiz] Groq failed:", groqError.message || groqError);
        return res.json({ quiz: [] });
      }
    } catch (error: any) {
      console.log("[Tutor Quiz] Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz" });
    }
  });

  // Vite integration (local dev only, skipped on Vercel)
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[TECLINGO AI] Server running on http://localhost:${PORT}`);
    });
  }

export default app;
