import { Mars, PictureInPicture2, Plus, RefreshCw, Save, Trash2, Upload, Venus } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next"
import styles from "./index.module.css"
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, mkdir, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import Button from '@/components/Button';
import Section from '@/components/Section';
import InputText from '@/components/InputText';
import { GenderSwitch } from '@/components/GenderSwitch';
import { generateId, getName, LocalStorage } from '@/utils/helpers';
import { useAtom } from 'jotai';
import { currentPairIndexAtom, currentPoolIndexAtom, duelsAtom, fighterDefault, fighterPairsAtom, fightTimeAtom, fightTimeDefault, hitZonesAtom, hitZonesDefault, hotKeysAtom, hotKeysDefault, isPlayoffAtom, isPoolRatingAtom, isSwissAtom, languageAtom, pairsDefault, participantsAtom, poolCountDeleteAtom, poolsAtom, sameGenderOnlyAtom } from '@store';
import { Gender, ParticipantType } from '@typings';
import { langLabels } from '@constants';
import toast from 'react-hot-toast';
import Switch from '@/components/Switch';
import { generatePairs } from '@/utils/generatePairs';
import InputNumber from '@/components/InputNumber';
import TimePicker from '@/components/TimePicker';
import SelectPair from '@/components/SelectPair';
import { importExcel } from '@/utils/importExcel';
import DirectP2P from '@/components/DirectP2P';
import { openFightViewerWindow } from '@/utils/windowManager';

type TrashPairProps = {
  setFighterPairs: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>;
  setPools: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>;
  setСurrentPoolIndex: React.Dispatch<React.SetStateAction<number>>;
  setParticipants: Dispatch<SetStateAction<ParticipantType[][]>>;
  setDuels: Dispatch<SetStateAction<ParticipantType[][][][]>>;
  currentPoolIndex: number;
  pool: number;
}

function PoolControllers({ setFighterPairs, setPools, setDuels, setСurrentPoolIndex, setParticipants, pool, currentPoolIndex }:TrashPairProps) {
  const deleteHandler = ()=>{
    setFighterPairs(state=>{ const buf = [...state].filter((_, index)=>index !== pool); return buf; });
    setPools(state=>{ const buf = [...state].filter((_, index)=>index !== pool); return buf; });
    setСurrentPoolIndex(state=>pool <= currentPoolIndex ? state-1 : state );
    setParticipants(state=>{ const buf = [...state].filter((_, index)=>index !== pool); return buf;})
  }

  const importFile = async ()=>{
    const res = await importExcel()
    if (res) {
      const [data, length] = res
      const stateHandlerWrap = (onlyFirst: boolean) =>
       (state: ParticipantType[][][]) => {
        let firstList: ParticipantType[][] = []
        const allLists: ParticipantType[][][] = []
        if (onlyFirst) {
          for (let i=0; i < Math.floor(data.length / length); i++) {
            firstList.push([
              {
                ...fighterDefault,
                scores: data[i][0].scores,
                warnings: data[i][0].warnings,
                protests: data[i][0].protests,
                doubleHits: data[i][0].doubleHits,
                wins: data[i][0].wins,
                name: data[i][0].name,
                id: data[i][0].id
              },
              {
                ...fighterDefault,
                scores: data[i][1].scores,
                warnings: data[i][1].warnings,
                protests: data[i][1].protests,
                doubleHits: data[i][1].doubleHits,
                wins: data[i][1].wins,
                name: data[i][1].name,
                id: data[i][1].id
              }
            ])
          }
        } else {
          for (let i=0; i < data.length; i++) {
            firstList.push([
              {
                ...fighterDefault,
                scores: data[i][0].scores,
                warnings: data[i][0].warnings,
                protests: data[i][0].protests,
                doubleHits: data[i][0].doubleHits,
                wins: data[i][0].wins,
                name: data[i][0].name,
                id: data[i][0].id
              },
              {
                ...fighterDefault,
                scores: data[i][1].scores,
                warnings: data[i][1].warnings,
                protests: data[i][1].protests,
                doubleHits: data[i][1].doubleHits,
                wins: data[i][1].wins,
                name: data[i][1].name,
                id: data[i][1].id
              }
            ])
            if ((i+1) % Math.floor(data.length / length) === 0) {
              allLists.push([...firstList])
              firstList = []
            }
          }
        }
        if (onlyFirst) {
          const buf = [...state]
          buf[pool] = firstList
          return buf
        } else {
          return allLists
        }
      }
      setFighterPairs(state=>{
        const buf = [...state]
        buf[pool] = stateHandlerWrap(false)(state)[0]
        return buf
      })
      setPools(state=>stateHandlerWrap(true)(state))
      setDuels(state=>{
        const buf = JSON.parse(JSON.stringify(state))
        buf[pool] = []
        buf[pool] = stateHandlerWrap(false)(buf[pool])
        return buf
      })
      setParticipants(state=>{
        const buf = [...state]
        const virtualArr: ParticipantType[][][] = new Array(pool+1)
        virtualArr[pool] = [...buf]
        buf[pool] = stateHandlerWrap(true)(virtualArr)[pool].flat().filter(item=>item.name !== "—")
        return buf
      })
    }
  }

  return (
    <div className={styles.poolController}>
      <Upload className={styles.trashIcon} onClick={importFile} />
      {pool !== 0 ? <Trash2 className={styles.trashIcon} onClick={deleteHandler} /> : <></>}
    </div>
  )
}

function App() {
  const { t, i18n } = useTranslation()
  /* ---------- атомы ---------- */
  const [poolCountDelete, setPoolCountDelete] = useAtom(poolCountDeleteAtom)
  const [isPoolRating, setIsPoolRating] = useAtom(isPoolRatingAtom)
  const [fightTime, setFightTime] = useAtom(fightTimeAtom);
  const [hitZones, setHitZones] = useAtom(hitZonesAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [pools, setPools] = useAtom(poolsAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex, setСurrentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [sameGenderOnly, setSameGenderOnly] = useAtom(sameGenderOnlyAtom);
  const [isSwiss, setIsSwiss] = useAtom(isSwissAtom);
  const [, setDuels] = useAtom(duelsAtom);
  const [hotKeys, setHotKeys] = useAtom(hotKeysAtom)
  const [, setIsPlayoff] = useAtom(isPlayoffAtom)
  const [participants, setParticipants] = useAtom(participantsAtom);

  /* ---------- состояние ---------- */
  const [newName, setNewName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [isSounds, setIsSounds] = useState(true)
  const [showP2P, setShowP2P] = useState(false);
  const hotKeysActions = [t("addScoreRed"), t("removeScoreRed"), t("addScoreBlue"), t("removeScoreBlue"), t("history"), t("start")]
  /* ---------- загрузка ---------- */
  useEffect(() => {
    (async () => {
      const [t, z, p, h, s] = await Promise.all([
        LocalStorage.getItem('fightTime'),
        LocalStorage.getItem('hitZones'),
        LocalStorage.getItem('participants'),
        LocalStorage.getItem('hotKeys'),
        LocalStorage.getItem("isSounds")
      ]);

      if (t) setFightTime(Number(t));
      if (z) setHitZones(JSON.parse(z || '{}'));
      if (p && !participants[0].length) setParticipants(JSON.parse(p || '[]'));
      if (h) setHotKeys(JSON.parse(h || '[]'))
      if (s) setIsSounds(JSON.parse(s))
    })();
  }, []);

  /* ---------- сохранение ---------- */
  const saveAll = async () => {
    await LocalStorage.setItem('fightTime', fightTime.toString());
    await LocalStorage.setItem('hitZones', JSON.stringify(hitZones));
    await LocalStorage.setItem('participants', JSON.stringify(participants));
    await LocalStorage.setItem('hotKeys', JSON.stringify(hotKeys));
    toast.success(t('settingsSaved'));
  };

  const selectPair = (idx: number) => {
    setCurrentPairIndex(state=>{const buf = [...state]; buf[currentPoolIndex] = idx; return buf});
  };

  /* ---------- участники ---------- */
  const addParticipant = () => {
    const name = newName.trim();
    if (!name) return;
    setParticipants(state=>{
      const buf = [...state];
      buf[currentPoolIndex] = [...buf[currentPoolIndex], { ...fighterDefault, name, gender, id: generateId(name) }]
      return buf
    });
    setNewName('');
  };
  const removeParticipant = (idx: number) =>
    setParticipants(state=>{
      const buf = [...state];
      buf[currentPoolIndex] = buf[currentPoolIndex].filter((_, i) => i !== idx)
      return buf;
    });

  const genPairs = () => {
    let newParticipants = [...participants]

    if (newParticipants[currentPoolIndex].length < 2) {
      toast.error(t('addTwoFighters'));
      return;
    }

    setDuels(state=>{
      const buf = JSON.parse(JSON.stringify(state))
      buf[currentPoolIndex] = []
      return buf
    })
    setIsPlayoff(state=>{
      const buf = [...state]
      buf[currentPoolIndex] = false
      return buf
    })
    const pairs = generatePairs(newParticipants[currentPoolIndex], sameGenderOnly, isSwiss, currentPoolIndex, setFighterPairs, setCurrentPairIndex)
    setPools(state=>{
      const buf = [...state]
      buf[currentPoolIndex] = pairs[currentPoolIndex]
      return buf
    });
  };

  /* ---------- звуки ---------- */
  const pickSound = async (type: 'bell') => {
    try {
      // 1. Показываем системный диалог выбора файла
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] }],
      });
      if (!selected) return; // пользователь нажал «отмена»

      const sourcePath = Array.isArray(selected) ? selected[0] : selected;

      // 2. Формируем путь назначения
      const appDir = await appDataDir();
      const destDir = await join(appDir, 'sounds');
      const destPath = await join(destDir, `sound_${type}.mp3`);
      await mkdir(destDir, { recursive: true });
      // 3. Копируем
      await copyFile(sourcePath, destPath);
      toast.success(`Трек загружен:\n${destPath}`);
      LocalStorage.setItem(`${type}Sound`, destPath)
    } catch (err) {
      // @ts-ignore
      toast.error(err);
    }
  };

  const changeLang = async () => {
    const langs = Object.keys(langLabels);
    const currentIndex = langs.indexOf(language);
    const newIndex = currentIndex + 1
    const newLang = langs[newIndex === langs.length ? 0 : newIndex];

    await i18n.changeLanguage(newLang);
    await LocalStorage.setItem('language', newLang);
    // @ts-ignore
    setLanguage(newLang);
  };

  async function deleteCustomSounds(type: 'bell' | 'all') {
    if (type === "bell" || type === "all") {
      const customBellPath = await LocalStorage.getItem('bellSound')
      if (customBellPath)
        await remove(customBellPath);
    }
  }

  const resetAll = async () => {
    setFightTime(fightTimeDefault)
    setHitZones(hitZonesDefault)
    setHotKeys(hotKeysDefault)
    await deleteCustomSounds("all")
    await LocalStorage.clear();

    toast.success(t('reset'));
  }

  useEffect(()=>{
    (async ()=>{
      await LocalStorage.setItem("isSounds", String(isSounds))
    })()
  }, [isSounds])

  useEffect(() => {
    (async () => {
      const savedLang = await LocalStorage.getItem('language');
      if (savedLang) {
        // @ts-ignore
        setLanguage(savedLang);
        await i18n.changeLanguage(savedLang)
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.pool} style={{ paddingLeft: "30px" }}>
        {pools.filter((_, idx)=>idx % 2 === 0).map((pairs, i)=>(
          <Section title={t("pool") + " " + (i * 2 + 1).toString()} key={i}>
           <PoolControllers pool={i * 2} currentPoolIndex={currentPoolIndex} setDuels={setDuels} setPools={setPools} setFighterPairs={setFighterPairs} setСurrentPoolIndex={setСurrentPoolIndex} setParticipants={setParticipants} />
            {
              pairs.map((pair, idx) => (
                <span key={idx}>
                  {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                </span>
              ))
            }
          </Section>
        ))}
      </div>
      <div className={styles.content}>
        {/* Кнопка смены языка */}
        <div className={styles.langRow}>
          <button
            onClick={changeLang}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className={styles.langBtn}>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* --- 1. Участники --- */}
        <Section title={t('participants')}>
          <>
          <InputText
            placeholder={t('name')}
            value={newName}
            setValue={setNewName}
          />

          <GenderSwitch gender={gender} setGender={setGender} />

          <Button className={styles.addBtn} onClick={addParticipant} disabled={participants[currentPoolIndex]?.length > 6}>
            <Plus size={28} color="var(--fg)" />
          </Button>

          {participants[currentPoolIndex]?.map((p, idx) => (
            <div key={idx} className={styles.participantRow}>
              <span className={styles.participantTxt}>{p.name}</span>
              {p.gender === Gender.MALE ?
                <Mars size={15} color="var(--fg)" style={{ marginLeft: '-125px' }} /> :
                <Venus size={15} color="var(--fg)" style={{ marginLeft: '-125px' }} />
              }
              <button
                onClick={() => removeParticipant(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Trash2 size={22} color="var(--fg)" />
              </button>
            </div>
            )
          )}
          <div className={styles.genderRow} style={{ gap: "20px" }}>
            <div className={[styles.genderRow, { marginVertical: 0 }].join(" ")}>
              <Mars size={28} color="var(--fg)" />
              <span className={styles.countTxt}>{participants[currentPoolIndex]?.filter(p => p.gender === Gender.MALE).length}</span>
            </div>
            <div className={[styles.genderRow, { marginVertical: 0, marginLeft: 30 }].join(" ")}>
              <Venus size={28} color="var(--fg)" />
              <span className={styles.countTxt} style={{ marginLeft: "0px" }}>{participants[currentPoolIndex]?.filter(p => p.gender === Gender.FEMALE).length}</span>
            </div>
          </div>

          <div className={styles.zoneRow}>
            {t("pool")}
            <InputNumber
            value={currentPoolIndex + 1}
            onChange={(pool)=>{ if (pool-1 === fighterPairs.length){ setFighterPairs(state=>[...state, ...pairsDefault]); setPools(state=>[...state, ...pairsDefault]); setParticipants(state=>[...state, []]); setCurrentPairIndex(state=>[...state, 0]); setDuels(state=>[...state, []]) }; setСurrentPoolIndex(pool - 1)}}
            min={1}
            />
          </div>
          <Switch title={t('sameGenderPairs')} value={sameGenderOnly} setValue={setSameGenderOnly} />
          <Switch title={t('swissSystem')} value={isSwiss} setValue={setIsSwiss} />
          </>

          <Button style={{ marginTop: 10 }} onClick={genPairs} title={t('randomizePairs')} stroke />
        </Section>

        <SelectPair
        poolIndex={currentPoolIndex}
        fighterPairs={fighterPairs}
        currentPairIndex={currentPairIndex[currentPoolIndex]}
        selectPair={selectPair}
        onPairsReordered={setFighterPairs}
        manualMode
        />
        {/* --- 2. Длительность --- */}
        <Section title={t('fightDuration')}>
          <TimePicker
            onChange={setFightTime}
            value={fightTime}
          />
        </Section>

        {/* --- 3. Зоны поражения --- */}
        <Section title={t('hitZones')}>
          {Object.entries(hitZones).map(([zone, pts]) => (
            <div key={zone} className={styles.zoneRow}>
              <span className={styles.zoneLabel}>{t(zone)}</span>
              <InputNumber
                value={pts}
                onChange={(val) => setHitZones({ ...hitZones, [zone]: Number(val) || 0 })}
              />
            </div>
          ))}
          <Button onClick={()=>setHitZones(hitZonesDefault)} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        {/* --- 4. Системные звуки --- */}
        <Section title={t('sounds')}>
          <Button onClick={() => pickSound('bell')} title={t('changeBellSound')} />
          <Switch title={t("soundsOff")} value={isSounds} setValue={setIsSounds} />
          <Button onClick={()=>deleteCustomSounds("all")} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        <Section title={t("hotKeys")}>
          {Object.keys(hotKeys).map((action, idx)=>(
            <div key={idx} className={styles.zoneRow}>
              {hotKeysActions[idx]}
              <InputText
              //@ts-ignore
              value={hotKeys[action]}
              onKeyDown={(e)=>setHotKeys(prev=>({...prev, [action]: e.code }))}
              style={{ width: "130px" }}
              maxLength={1}
              />
            </div>
          ))}
          <Button onClick={()=>setHotKeys(hotKeysDefault)} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        <Section title={t('pool')}>
          <div className={styles.zoneRow}>
            {t("poolCountDelete")}
            <InputNumber
            value={poolCountDelete}
            onChange={setPoolCountDelete}
            min={1}
            />
          </div>
          <Switch title={t("isPoolRating")} value={isPoolRating} setValue={setIsPoolRating} />
        </Section>

        <Section title='P2P'>
          <Button title={showP2P ? 'Скрыть P2P' : 'P2P Соединение'} onClick={() => setShowP2P(!showP2P)} />
          {showP2P && <DirectP2P />}
        </Section>

        {/* --- 5. Сохранить --- */}
        <Section>
          <Button onClick={saveAll}>
            <Save size={28} color="var(--fg)" />
          </Button>
          <Button onClick={resetAll} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
          <Button onClick={openFightViewerWindow} stroke>
            <PictureInPicture2 size={28} color="var(--fg)" />
          </Button>
        </Section>
      </div>
      <div className={styles.pool} style={{ paddingRight: "30px" }}>
        {pools.filter((_, idx)=>idx % 2 !== 0).map((pairs, i)=>(
          <Section title={t("pool") + " " + ((i + 1) * 2).toString()} key={i}>
            <PoolControllers pool={((i + 1) * 2)-1} currentPoolIndex={currentPoolIndex} setDuels={setDuels} setPools={setPools} setFighterPairs={setFighterPairs} setСurrentPoolIndex={setСurrentPoolIndex} setParticipants={setParticipants} />
            {
              pairs.map((pair, idx) => (
                <span key={idx}>
                  {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                </span>
              ))
            }
          </Section>
        ))}
      </div>
    </div>
  );
}

export default App;
