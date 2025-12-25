
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, MessageSquare, Loader2, Volume2, VolumeX } from 'lucide-react';
import { getAiInstance } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { useData } from '../context/DataContext';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');

  const { students, attendanceRecords, maintenanceRequests, healthRecords } = useData();

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function to decode audio PCM data
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const startSession = async () => {
    const ai = getAiInstance();
    if (!ai) return;

    try {
      setIsActive(true);
      setTranscript('جاري الاتصال بمساعد مرافقة...');

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setTranscript('أنا أسمعك الآن، كيف يمكنني مساعدتك؟');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setResponse(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
              setTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputAudioContext,
                24000,
                1,
              );
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.turnComplete) {
              setTranscript('');
              setResponse('');
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e: any) => {
            console.error('AI Assistant Error:', e);
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `
            أنت "مرافق"، المساعد الصوتي الذكي لمنصة مرافقة لإدارة الأقسام الداخلية.
            أنت خبير في بيانات المؤسسة وتساعد المدير والمشرفين.
            تحدث باللغة العربية بلهجة مهنية وودودة.
            سياق البيانات الحالية:
            - إجمالي التلاميذ: ${students.length}
            - غيابات اليوم: ${attendanceRecords.filter(a => a.status === 'absent').length}
            - طلبات الصيانة: ${maintenanceRequests.length}
            - حالات صحية: ${healthRecords.length}
            
            أجب على أسئلة المستخدم بوضوح واختصار.
          `,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start AI Assistant session", error);
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsActive(false);
    setIsSpeaking(false);
    setTranscript('');
    setResponse('');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      {isOpen && (
        <div className="w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-slide-up pointer-events-auto">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span className="font-bold">مساعد مرافقة الصوتي</span>
            </div>
            <button onClick={() => { setIsOpen(false); stopSession(); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-6 space-y-4 min-h-[200px] flex flex-col justify-center text-center">
            {!isActive ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-gray-600 text-sm font-medium">مرحباً! أنا "مرافق"، كيف أساعدك اليوم؟</p>
                <button
                  onClick={startSession}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Mic className="w-4 h-4" />
                  ابدأ التحدث
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className={`relative flex items-center justify-center ${isSpeaking ? 'animate-pulse' : ''}`}>
                    <div className={`absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-25 ${isActive ? '' : 'hidden'}`}></div>
                    <div className={`w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white relative z-10 shadow-xl`}>
                      {isSpeaking ? <Volume2 className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">تحدث معي الآن</p>
                  <p className="text-gray-800 text-sm font-bold min-h-[1.5rem]">{transcript || '...'}</p>
                  {response && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-indigo-900 text-sm italic border border-indigo-100">
                      {response}
                    </div>
                  )}
                </div>

                <button
                  onClick={stopSession}
                  className="text-red-500 text-xs font-bold hover:underline"
                >
                  إنهاء الجلسة
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t flex justify-center">
            <span className="text-[10px] text-gray-400 font-mono">POWERED BY GEMINI LIVE AI</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto ${isOpen ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white'
          }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default AIAssistant;
