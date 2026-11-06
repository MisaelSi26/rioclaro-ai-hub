import { useEffect, useRef, useState } from 'react';
import { Headphones, Mic, Square } from 'lucide-react';

async function createSpeechConfig() {
  const response = await fetch('/api/speech/token', { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo conectar con Azure Speech.');
  const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');
  const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(result.token, result.region);
  speechConfig.speechRecognitionLanguage = 'es-MX';
  speechConfig.speechSynthesisLanguage = 'es-MX';
  speechConfig.speechSynthesisVoiceName = 'es-MX-DaliaNeural';
  return { SpeechSDK, speechConfig };
}

export default function VoiceModule() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognizerRef = useRef(null);
  const synthesizerRef = useRef(null);

  useEffect(() => () => {
    recognizerRef.current?.close();
    synthesizerRef.current?.close();
  }, []);

  async function readAnswer(text) {
    const { SpeechSDK, speechConfig } = await createSpeechConfig();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(
      speechConfig,
      SpeechSDK.AudioConfig.fromDefaultSpeakerOutput(),
    );
    synthesizerRef.current = synthesizer;
    setSpeaking(true);
    try {
      await new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            synthesizer.close();
            synthesizerRef.current = null;
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
              resolve();
              return;
            }
            reject(new Error(result.errorDetails || 'Azure Speech no pudo leer la respuesta.'));
          },
          (error) => {
            synthesizer.close();
            synthesizerRef.current = null;
            reject(new Error(String(error)));
          },
        );
      });
    } finally {
      setSpeaking(false);
    }
  }

  async function submitQuestion(text, speakResponse = false) {
    const trimmedQuestion = text.trim();
    if (!trimmedQuestion || busy) return;
    setBusy(true);
    setStatus('Consultando al asistente...');
    setAnswer('');
    setSources([]);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo consultar al asistente.');
      setAnswer(result.answer);
      setSources(result.sources || []);
      if (speakResponse) {
        setStatus('Leyendo respuesta con Azure Speech...');
        await readAnswer(result.answer);
      }
      setStatus('Respuesta lista.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function playAnswer() {
    setStatus('Leyendo respuesta con Azure Speech...');
    try {
      await readAnswer(answer);
      setStatus('Respuesta leída.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function recognizeQuestion() {
    setBusy(true);
    setStatus('Conectando con Azure Speech...');
    try {
      const { SpeechSDK, speechConfig } = await createSpeechConfig();
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        SpeechSDK.AudioConfig.fromDefaultMicrophoneInput(),
      );
      recognizerRef.current = recognizer;
      setStatus('Escuchando; habla ahora.');
      const recognizedText = await new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            recognizer.close();
            recognizerRef.current = null;
            if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech && result.text.trim()) {
              resolve(result.text.trim());
              return;
            }
            const details = SpeechSDK.CancellationDetails.fromResult(result).errorDetails;
            reject(new Error(details || 'No se detectó una frase. Inténtalo de nuevo.'));
          },
          (error) => {
            recognizer.close();
            recognizerRef.current = null;
            reject(new Error(String(error)));
          },
        );
      });
      setQuestion(recognizedText);
      setBusy(false);
      await submitQuestion(recognizedText, true);
    } catch (error) {
      setStatus(error.message);
      setBusy(false);
    }
  }

  function stopReading() {
    const synthesizer = synthesizerRef.current;
    if (!synthesizer) return;
    synthesizer.stopSpeakingAsync(
      () => {
        synthesizer.close();
        synthesizerRef.current = null;
        setSpeaking(false);
      },
      (error) => {
        setStatus(String(error));
        synthesizer.close();
        synthesizerRef.current = null;
        setSpeaking(false);
      },
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion(question);
  }

  return (
    <div className="voice-box">
      <p>Dicta una pregunta en español o escríbela; las respuestas se consultan con evidencia del asistente.</p>
      <form className="voice-controls" onSubmit={handleSubmit}>
        <input
          aria-label="Pregunta por voz o texto"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pregunta sobre inventario, ventas o políticas..."
        />
        <button className="primary-button small-button" type="submit" disabled={busy || !question.trim()}>
          Consultar
        </button>
      </form>
      <div className="voice-actions">
        <button className="secondary-button small-button" type="button" onClick={recognizeQuestion} disabled={busy || speaking}>
          <Mic size={17} /> {busy ? 'Procesando...' : 'Preguntar con voz'}
        </button>
        {answer && !speaking && (
          <button className="secondary-button small-button" type="button" onClick={playAnswer} disabled={busy}>
            <Headphones size={17} /> Leer respuesta
          </button>
        )}
        {speaking && (
          <button className="secondary-button small-button" type="button" onClick={stopReading}>
            <Square size={17} /> Detener lectura
          </button>
        )}
      </div>
      {status && <p className="voice-status" role="status">{status}</p>}
      {answer && (
        <div className="voice-answer" aria-live="polite">
          <strong>Respuesta</strong>
          <p>{answer}</p>
          {sources.length > 0 && <small>Fuentes: {sources.join(', ')}</small>}
        </div>
      )}
    </div>
  );
}
