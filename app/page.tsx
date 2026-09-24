'use client';

import { useState, useEffect } from 'react';
import { TonicNote, SwarDefinition, Saptak, SCALE_OPTIONS } from '@/types/music';
import { ALL_SWARAS } from '@/lib/audio/tuning';
import { getSoundEngine, SoundEngine } from '@/lib/audio/SoundEngine';
import Logo from '@/components/logo';
import Image from 'next/image';

type PracticeMode = 'single' | 'phrase';

export default function Home() {
  const [engine, setEngine] = useState<SoundEngine | null>(null);
  const [rootTonic, setRootTonic] = useState<TonicNote>('C#');
  const [isDroneActive, setIsDroneActive] = useState(false);

  // Volume state
  const [droneVolume, setDroneVolume] = useState<number>(0.7);
  const [harmoniumVolume, setHarmoniumVolume] = useState<number>(0.85);

  // Mode & Phrase Settings
  const [mode, setMode] = useState<PracticeMode>('phrase');
  const [phraseLength, setPhraseLength] = useState<number>(2);

  // Octave & note filter toggles
  const [activeSaptaks, setActiveSaptaks] = useState<Record<Saptak, boolean>>({
    mandra: false,
    madhya: true,
    taar: false,
  });
  const [onlyShuddha, setOnlyShuddha] = useState(true);

  // Quiz states
  const [targetSwar, setTargetSwar] = useState<SwarDefinition | null>(null);
  const [targetPhrase, setTargetPhrase] = useState<SwarDefinition[]>([]);
  const [userPhraseGuess, setUserPhraseGuess] = useState<SwarDefinition[]>([]);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);

  useEffect(() => {
    const sound = getSoundEngine();
    setEngine(sound);
    return () => {
      sound.stopRootDrone();
    };
  }, []);

  const availableSwaras = ALL_SWARAS.filter((s) => {
    if (!activeSaptaks[s.saptak]) return false;
    if (onlyShuddha && s.isKomalOrTeevra) return false;
    return true;
  });

  const toggleSaptak = (saptak: Saptak) => {
    const activeCount = Object.values(activeSaptaks).filter(Boolean).length;
    if (activeSaptaks[saptak] && activeCount === 1) return;

    setActiveSaptaks((prev) => ({
      ...prev,
      [saptak]: !prev[saptak],
    }));
  };

  const toggleDrone = () => {
    if (!engine) return;
    if (isDroneActive) {
      engine.stopRootDrone();
      setIsDroneActive(false);
    } else {
      engine.startRootDrone(rootTonic);
      setIsDroneActive(true);
    }
  };

  const handleDroneVolumeChange = (vol: number) => {
    setDroneVolume(vol);
    engine?.setDroneVolume(vol);
  };

  const handleHarmoniumVolumeChange = (vol: number) => {
    setHarmoniumVolume(vol);
    engine?.setHarmoniumVolume(vol);
  };

  useEffect(() => {
    if (isDroneActive && engine) {
      engine.startRootDrone(rootTonic);
    }
  }, [rootTonic, isDroneActive, engine]);

  const startNewChallenge = () => {
    if (!engine || availableSwaras.length === 0) return;
    setFeedback(null);
    setUserPhraseGuess([]);

    if (mode === 'single') {
      const chosen = availableSwaras[Math.floor(Math.random() * availableSwaras.length)];
      setTargetSwar(chosen);
      setTargetPhrase([]);
      engine.playHarmoniumNote(rootTonic, chosen.semitoneOffset, 1.2);
    } else {
      const phrase: SwarDefinition[] = [];
      for (let i = 0; i < phraseLength; i++) {
        const randNote = availableSwaras[Math.floor(Math.random() * availableSwaras.length)];
        phrase.push(randNote);
      }
      setTargetPhrase(phrase);
      setTargetSwar(null);
      engine.playSwarSequence(
        rootTonic,
        phrase.map((s) => s.semitoneOffset),
        0.7,
        0.25
      );
    }
  };

  const replayAudio = () => {
    if (!engine) return;
    if (mode === 'single' && targetSwar) {
      engine.playHarmoniumNote(rootTonic, targetSwar.semitoneOffset, 1.2);
    } else if (mode === 'phrase' && targetPhrase.length > 0) {
      engine.playSwarSequence(
        rootTonic,
        targetPhrase.map((s) => s.semitoneOffset),
        0.7,
        0.25
      );
    }
  };

  const handleSingleGuess = (swar: SwarDefinition) => {
    if (!targetSwar) return;
    const isMatch = swar.id === targetSwar.id;
    if (isMatch) {
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setStreak((prev) => prev + 1);
      setFeedback({
        message: `Correct! ${targetSwar.devanagari} (${targetSwar.fullName})`,
        isCorrect: true,
      });
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));
      setStreak(0);
      setFeedback({
        message: `Incorrect. It was ${targetSwar.devanagari} (${targetSwar.fullName})`,
        isCorrect: false,
      });
    }

    setTimeout(() => {
      startNewChallenge();
    }, 1400);
  };

  const handlePhraseGuess = (swar: SwarDefinition) => {
    if (targetPhrase.length === 0) return;
    if (userPhraseGuess.length >= phraseLength) return;

    engine?.playHarmoniumNote(rootTonic, swar.semitoneOffset, 0.5);

    const nextGuess = [...userPhraseGuess, swar];
    setUserPhraseGuess(nextGuess);

    if (nextGuess.length === phraseLength) {
      const isAllCorrect = nextGuess.every(
        (guess, idx) => guess.id === targetPhrase[idx].id
      );

      const targetText = targetPhrase.map((s) => s.devanagari).join(' - ');

      if (isAllCorrect) {
        setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        setStreak((prev) => prev + 1);
        setFeedback({
          message: `Shabash! Correct sequence: ${targetText}`,
          isCorrect: true,
        });
      } else {
        setScore((prev) => ({ ...prev, total: prev.total + 1 }));
        setStreak(0);
        setFeedback({
          message: `Incorrect. Correct sequence was: ${targetText}`,
          isCorrect: false,
        });
      }

      setTimeout(() => {
        startNewChallenge();
      }, 2000);
    }
  };

  const handleSwarClick = (swar: SwarDefinition) => {
    if (mode === 'single') {
      handleSingleGuess(swar);
    } else {
      handlePhraseGuess(swar);
    }
  };

  const saptakOrder: Saptak[] = ['mandra', 'madhya', 'taar'];
  const saptakLabels: Record<Saptak, string> = {
    mandra: 'Mandra Saptak (मंद्र सप्तक)',
    madhya: 'Madhya Saptak (मध्य सप्तक)',
    taar: 'Taar Saptak (तार सप्तक)',
  };

  const isChallengeActive = mode === 'single' ? !!targetSwar : targetPhrase.length > 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl py-4 border-b border-neutral-800 mb-6 flex items-center justify-center gap-3.5">
        {/* If using the component: */}
        

        {/* OR if using an image file from public/logo.png: */}
        {
        <Image
          src="/swar_pehchaan_logo.jpeg"
          alt="Swar Pehchaan Logo"
          width={300}
          height={100}
          className="rounded-xl border border-amber-500/30"
          loading='eager'
        /> 
        }

        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-amber-400 leading-tight">
            स्वर पहचान <span className="text-neutral-200 text-lg sm:text-xl font-normal">(Swar Pehchaan)</span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm">Hindustani Classical Ear Training & Riyaz</p>
        </div>
      </header>

      <div className="w-full max-w-4xl space-y-5">
        {/* Drone, Root Sa & Tanpura Volume Controller */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">
                Scale (Root Sa / सुर)
              </label>
              <select
                value={rootTonic}
                onChange={(e) => setRootTonic(e.target.value as TonicNote)}
                className="bg-neutral-800 border border-neutral-700 text-amber-300 font-semibold rounded px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                {SCALE_OPTIONS.map(({ note, label }) => (
                  <option key={note} value={note} className="bg-neutral-900 text-neutral-100">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">
                Tanpura Vol: <span className="text-amber-400">{Math.round(droneVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={droneVolume}
                onChange={(e) => handleDroneVolumeChange(parseFloat(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={toggleDrone}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
              isDroneActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold'
            }`}
          >
            {isDroneActive ? 'Stop Root Sur' : 'Start Root Sur (सा)'}
          </button>
        </section>

        {/* Practice Mode & Phrase Length Selector */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Mode:</span>
            <button
              onClick={() => { setMode('single'); setTargetPhrase([]); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'single'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              Single Note
            </button>
            <button
              onClick={() => { setMode('phrase'); setTargetSwar(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'phrase'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              Phrase / Combination
            </button>
          </div>

          {mode === 'phrase' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider">Notes in Phrase:</span>
              {[2, 3, 4].map((len) => (
                <button
                  key={len}
                  onClick={() => {
                    setPhraseLength(len);
                    setUserPhraseGuess([]);
                    setTargetPhrase([]);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    phraseLength === len
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs uppercase tracking-wider mr-1">Active Saptaks:</span>
            {(['mandra', 'madhya', 'taar'] as Saptak[]).map((saptak) => (
              <button
                key={saptak}
                onClick={() => toggleSaptak(saptak)}
                className={`px-3 py-1 rounded text-xs font-semibold capitalize transition cursor-pointer ${
                  activeSaptaks[saptak]
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {saptak}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyShuddha}
              onChange={(e) => setOnlyShuddha(e.target.checked)}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span className="text-neutral-300 text-xs">Shuddha Swaras Only (Bilawal)</span>
          </label>
        </section>

        {/* Stats */}
        <div className="flex justify-between items-center bg-neutral-900/60 px-4 py-2 rounded-lg border border-neutral-800 text-sm">
          <div className="flex gap-4">
            <span>Score: <strong className="text-amber-400">{score.correct}/{score.total}</strong></span>
            <span>Streak: <strong className="text-emerald-400">{streak} 🔥</strong></span>
          </div>
          <span className="text-xs text-neutral-400">{availableSwaras.length} notes in active pool</span>
        </div>

        {/* Interactive Quiz Console */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center space-y-6">
          {!isChallengeActive ? (
            <div className="py-6">
              <p className="text-neutral-400 mb-4">
                {mode === 'single'
                  ? 'Identify the single mystery swar relative to Sa.'
                  : `Listen to a combination of ${phraseLength} swaras and identify the sequence.`}
              </p>
              <button
                onClick={startNewChallenge}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-3 rounded-lg font-bold shadow-md transition cursor-pointer"
              >
                {mode === 'single' ? 'Begin Single Note Ear Training' : `Begin ${phraseLength}-Note Combination`}
              </button>
            </div>
          ) : (
            <>
              {/* Controls, Notes Volume & Sequence Slots */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => engine?.playHarmoniumNote(rootTonic, 0, 1.0)}
                    className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-neutral-200 px-4 py-2 rounded text-sm font-medium transition cursor-pointer"
                  >
                    Play Madhya Sa (सा)
                  </button>
                  <button
                    onClick={replayAudio}
                    className="bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-500/40 text-amber-300 px-4 py-2 rounded text-sm font-medium transition cursor-pointer"
                  >
                    Replay Combination 🔁
                  </button>

                  {/* Notes / Harmonium Volume Slider */}
                  <div className="flex items-center gap-2 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-400">Notes Vol:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={harmoniumVolume}
                      onChange={(e) => handleHarmoniumVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 w-7 text-right">
                      {Math.round(harmoniumVolume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Slots display for phrase mode */}
                {mode === 'phrase' && (
                  <div className="flex items-center gap-3 my-2">
                    {Array.from({ length: phraseLength }).map((_, idx) => {
                      const guessed = userPhraseGuess[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                            guessed
                              ? 'border-amber-400 bg-neutral-800 shadow-md'
                              : 'border-neutral-700 border-dashed bg-neutral-950/40 text-neutral-500'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400">Note {idx + 1}</span>
                          <span className="text-2xl font-bold mt-1 text-white">
                            {guessed ? guessed.devanagari : '—'}
                          </span>
                        </div>
                      );
                    })}

                    {userPhraseGuess.length > 0 && userPhraseGuess.length < phraseLength && (
                      <button
                        onClick={() => setUserPhraseGuess((prev) => prev.slice(0, -1))}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded border border-neutral-700 ml-2 cursor-pointer"
                      >
                        Undo ⌫
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback Banner */}
              <div className="min-h-6">
                {feedback && (
                  <p className={`text-base font-semibold ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {feedback.message}
                  </p>
                )}
              </div>

              {/* 3-Saptak Swar Grid with Bhatkhande notation */}
              <div className="space-y-4 pt-2">
                {saptakOrder
                  .filter((saptak) => activeSaptaks[saptak])
                  .map((saptak) => {
                    const notesInSaptak = availableSwaras.filter((s) => s.saptak === saptak);
                    return (
                      <div key={saptak} className="text-left bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                        <span className="text-xs font-semibold text-neutral-400 block mb-2">
                          {saptakLabels[saptak]}
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-12 gap-2">
                          {notesInSaptak.map((swar) => (
                            <button
                              key={swar.id}
                              onClick={() => handleSwarClick(swar)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                                swar.isKomalOrTeevra
                                  ? 'bg-neutral-900 border-neutral-700/80 hover:bg-neutral-800 text-neutral-300'
                                  : 'bg-neutral-800 border-neutral-600/80 hover:bg-neutral-700 text-white font-medium'
                              } active:bg-amber-500 active:text-neutral-950`}
                            >
                              <div className="flex flex-col items-center justify-center min-h-[34px]">
                                {swar.saptak === 'taar' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mb-1" />
                                )}

                                <div className="relative inline-block leading-none">
                                  <span className="text-xl font-bold">{swar.devanagari}</span>

                                  {swar.isKomalOrTeevra && swar.baseName !== 'Ma' && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-neutral-300 rounded" />
                                  )}

                                  {swar.baseName === 'Ma' && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-neutral-300" />
                                  )}
                                </div>

                                {swar.saptak === 'mandra' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                                )}
                              </div>

                              <span className="text-[10px] text-neutral-400 mt-1">{swar.latinNotation}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>
                {/* Educational SEO Section */}
        <section className="w-full max-w-4xl mt-16 pt-8 border-t border-neutral-800 text-neutral-400 text-sm space-y-6">
          <h2 className="text-xl font-bold text-amber-400">About Swar Pehchaan (स्वर पहचान रियाज़)</h2>
          
          <div className="space-y-4 leading-relaxed">
            <p>
              <strong>Swar Pehchaan (स्वर पहचान)</strong> is a specialized ear-training web application designed for students and practitioners of Hindustani classical music, semi-classical vocalists, and instrumentalists (Harmonium, Flute, Violin, Sitar).
            </p>

            <h3 className="text-base font-semibold text-neutral-200">How to Improve Swar Gyan in Riyaz</h3>
            <p>
              In Indian classical music, pitch recognition is relative to the tonic drone (<em>Adhara Shadja</em> or <em>Sa</em>). Unlike Western fixed-pitch training, Hindustani ear training requires internalizing the interval relationship of each swar (Komal Re, Shuddha Re, Komal Ga, Shuddha Ga, etc.) against the resonance of the Tanpura.
            </p>

            <h3 className="text-base font-semibold text-neutral-200">Bhatkhande Notation Reference</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Shuddha Swaras (शुद्ध स्वर):</strong> Sa, Re, Ga, Ma, Pa, Dha, Ni</li>
              <li><strong>Komal Swaras (कोमल स्वर):</strong> Underline indicator (e.g., <u>रे</u>, <u>ग</u>, <u>ध</u>, <u>नि</u>)</li>
              <li><strong>Tīvra Swara (तीव्र स्वर):</strong> Vertical stroke above (म॑)</li>
              <li><strong>Mandra Saptak (मंद्र सप्तक):</strong> Dot below the swar</li>
              <li><strong>Taar Saptak (तार सप्तक):</strong> Dot above the swar</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}