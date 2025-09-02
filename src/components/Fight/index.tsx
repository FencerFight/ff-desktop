import { useAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

import Button from '@/components/Button';
import Counter from '@/components/Counter';
import {
  currentPairIndexAtom,
  doubleHitsAtom,
  fighterPairsAtom,
  fightTimeAtom,
  hotKeysAtom,
  hitZonesAtom,
  isRunningAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
  winsAtom
} from '@/store';
import { LocalStorage, truncateFullName } from '@/utils/helpers';
import { incWin } from '@/utils/incWin';
import { History, Medal, Minus, Pause, Play, RefreshCw, Trophy, UsersRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

import styles from './index.module.css';
import { useTranslation } from 'react-i18next';
import ModalWindow from '@/components/ModalWindow';
import SelectPair from '@/components/SelectPair';

// Звуковые файлы (замените на ваши пути)
let bellSound = new Howl({ src: ['/sounds/bell.mp3'] });

export default function FightScreen() {
  const { t: translate } = useTranslation()
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [isRunning, setIsRunning] = useAtom(isRunningAtom);
  const [hitZones] = useAtom(hitZonesAtom);
  const [fightTime] = useAtom(fightTimeAtom);
  const [doubleHits, setDoubleHits] = useAtom(doubleHitsAtom);
  const [protests1, setProtests1] = useAtom(protests1Atom);
  const [protests2, setProtests2] = useAtom(protests2Atom);
  const [warnings1, setWarnings1] = useAtom(warnings1Atom);
  const [warnings2, setWarnings2] = useAtom(warnings2Atom);
  const [score1, setScore1] = useAtom(score1Atom);
  const [score2, setScore2] = useAtom(score2Atom);
  const [wins, setWins] = useAtom(winsAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [hotKeys] = useAtom(hotKeysAtom)

  const [isOpen, setIsOpen] = useState(false)
  const [isHistory, setIsHistory] = useState(false)
  const [timeLeft, setTimeLeft] = useState(fightTime);
  const [bellUri, setBellUri] = useState<string>("");
  const [isSounds, setIsSounds] = useState(true)
  const [history, setHistory] = useState<{ score1: number, score2: number }[]>([])
  const fighter1 = fighterPairs[currentPairIndex]?.[0]?.name || '';
  const fighter2 = fighterPairs[currentPairIndex]?.[1]?.name || '';
  const fighterId1 = fighterPairs[currentPairIndex]?.[0]?.id || '';
  const fighterId2 = fighterPairs[currentPairIndex]?.[1]?.id || '';
  // @ts-ignore
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkCustomSounds = async () => {
    const b = await LocalStorage.getItem('bellSound')
    const s = await LocalStorage.getItem("isSounds")

    const baseURL = (url: string) => `http://localhost:9527/${url}`
    if (b) setBellUri(baseURL(b).replace(/\\/g, '/'));
    if (s) setIsSounds(JSON.parse(s))
  };

  const fightStop = () => {
      setIsRunning(false);
      const isDraw = score1 === score2;
      if (!isDraw) {
        if (score1 > score2) {
          incWin(fighterId1, fighterId2, currentPairIndex, setFighterPairs, warnings1, protests1, doubleHits);
          incWin(fighterId2, fighterId1, currentPairIndex, setFighterPairs, warnings2, protests2, doubleHits, true);
          setWins(prev => [prev[0] + 1, prev[1]]);
        } else {
          incWin(fighterId2, fighterId1, currentPairIndex, setFighterPairs, warnings2, protests2, doubleHits);
          incWin(fighterId1, fighterId2, currentPairIndex, setFighterPairs, warnings1, protests1, doubleHits, true);
          setWins(prev => [prev[0], prev[1] + 1]);
        }
      } else {
        incWin(fighterId1, fighterId2, currentPairIndex, setFighterPairs, warnings1, protests1, doubleHits, false, 1);
        incWin(fighterId2, fighterId1, currentPairIndex, setFighterPairs, warnings2, protests2, doubleHits, false, 1);
      }

      toast.success(isDraw ? translate('draw') : `${translate('win')}: ${score1 > score2 ? fighter1 : fighter2}`, {
        duration: 3000,
        style: {
          fontSize: '20px',
          fontFamily: 'OnestSemiBold',
          marginTop: '100px'
        }
      });
  }

  useEffect(() => {
    checkCustomSounds();
  }, []);

  useEffect(() => {
    if (bellUri) {
      bellSound = new Howl({ src: [bellUri] })
    }
  }, [bellUri]);

  /* таймер */
  useEffect(() => {
    // @ts-ignore
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          const next = t - 1;

          if (next === 15) {
            toast(translate("last15seconds"), { icon: "ℹ️", style: { marginTop: '100px' } })
          }

          if (next === 0) {
            if (isSounds) {
              bellSound.play();
              setTimeout(()=>bellSound.stop(), 5000)
            }
            fightStop()

            return fightTime;
          }
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const resetFight = () => {
    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setTimeLeft(fightTime);
    setIsRunning(false);
    setWins([0, 0]);
    setHistory([])
    bellSound.stop();
  };

  /* format time */
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  /* helpers */
  const addPoints = (setter: React.Dispatch<React.SetStateAction<number>>, zone: keyof typeof hitZones) => {
    const p = hitZones[zone];
    setter((s) => s + p);
  };

  const removePoints = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter((s) => Math.max(0, s - 1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { code } = event;

      switch (code) {
        case hotKeys.plus1:
          event.preventDefault();
          setScore1(prev=>prev+1)
          break;
        case hotKeys.plus2:
          event.preventDefault();
          setScore2(prev=>prev+1)
          break;
        case hotKeys.minus1:
          event.preventDefault();
          setScore1(prev=>Math.max(0, prev-1))
          break;
        case hotKeys.minus2:
          event.preventDefault();
          setScore2(prev=>Math.max(0, prev-1))
          break;
        case hotKeys.history:
          event.preventDefault();
          setIsHistory(prev=>!prev)
          break;
        case hotKeys.start:
          event.preventDefault();
          setIsRunning(prev=>!prev)
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(()=>{
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (score1 !== 0 || score2 !== 0)
    timeoutRef.current = setTimeout(()=>setHistory(prev=>[...prev, { score1, score2 }]), 3000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [score1, score2])

  useEffect(() => {
    setTimeLeft(fightTime);
  }, [fightTime]);

  useEffect(() => {
    resetFight();
  }, [currentPairIndex]);

  const fighterData = [
    {
      name: fighter1,
      score: score1,
      setScore: setScore1,
      protests: protests1,
      setProtests: setProtests1,
      warnings: warnings1,
      setWarnings: setWarnings1,
      styleWrap: styles.red
    },
    {
      name: fighter2,
      score: score2,
      setScore: setScore2,
      protests: protests2,
      setProtests: setProtests2,
      warnings: warnings2,
      setWarnings: setWarnings2,
      styleWrap: styles.blue
    }
  ];

  return (
    <div className={styles.container}>
      {/* левая и правая половины */}
      {fighterData.map((data, i) => (
        <div key={i} className={`${styles.side} ${data.styleWrap}`}>
          <div className={styles.name}>
            {truncateFullName(String(data.name), 19).split(' ').map((line, idx) => (
              <span key={idx}>{line}<br /></span>
            ))}
          </div>
          <div className={styles.score}>{data.score}</div>

          {Object.entries(hitZones).map(([zone, pts]) => (
            <button
              key={`${i}-${zone}`}
              className={styles.zoneBtn}
              onClick={() => addPoints(data.setScore, zone as keyof typeof hitZones)}
            >
              <span className={styles.zoneTxt}>
                {translate(zone)} (+{pts})
              </span>
            </button>
          ))}

          <button
            className={styles.zoneBtn}
            onClick={() => removePoints(data.setScore)}
          >
            <Minus size={28} color="var(--fg)" />
          </button>

          <Counter
            label={translate('protests')}
            value={data.protests}
            onInc={data.setProtests}
            onDec={data.setProtests}
          />

          <Counter
            label={translate('warnings')}
            value={data.warnings}
            onInc={data.setWarnings}
            onDec={data.setWarnings}
          />
        </div>
      ))}


      {/* НИЖНЯЯ ПАНЕЛЬ */}
      <div className={styles.bottomBar}>
        <div className={styles.winsBar}>
          <div className={styles.winWrap}>
            <span className={styles.winText}>{wins[0]}</span>
            <Trophy size={28} color="var(--accent)" />
          </div>

          <Counter
            label={translate('doubleHits')}
            value={doubleHits}
            onInc={setDoubleHits}
            onDec={setDoubleHits}
          />

          <div className={styles.winWrap}>
            <span className={styles.winText}>{wins[1]}</span>
            <Trophy size={28} color="var(--accent)" />
          </div>
        </div>

        <div className={styles.timer}>{format(timeLeft)}</div>

        <div className={styles.controls}>
          <Button onClick={resetFight}>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
          <Button onClick={()=>setIsOpen(true)}>
            <UsersRound size={28} color="var(--fg)" />
          </Button>
          <Button onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause size={28} color="var(--fg)" /> : <Play size={28} color="var(--fg)" />}
          </Button>
          <Button onClick={()=>setIsHistory(true)}>
            <History size={28} color="var(--fg)" />
          </Button>
          <Button onClick={fightStop}>
            <Medal size={28} color="var(--fg)" />
          </Button>
        </div>
      </div>
      <ModalWindow isOpen={isOpen} onClose={()=>setIsOpen(false)}>
        <SelectPair fighterPairs={fighterPairs} currentPairIndex={currentPairIndex} selectPair={(idx)=>setCurrentPairIndex(idx)} />
      </ModalWindow>
      <ModalWindow isOpen={isHistory} onClose={()=>setIsHistory(false)}>
        <div className={styles.history}>
          {history.map((his, idx)=>(
            <button onClick={()=>{ setScore1(his.score1); setScore2(his.score2); setIsHistory(false) }} style={{ display: "flex", gap: "5px", width: "60px" }}>
              <span style={{ color: "var(--placeholder)", alignItems: "flex-start", width: "15px" }}>{idx+1}.</span><span style={{ width: "35px" }}>{his.score1} : {his.score2}</span>
            </button>
          ))}
        </div>
      </ModalWindow>
    </div>
  );
}