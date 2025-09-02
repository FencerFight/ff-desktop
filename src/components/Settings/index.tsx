import { Mars, Plus, RefreshCw, Save, Trash2, Venus } from 'lucide-react';
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"
import styles from "./index.module.css"
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, mkdir, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import Button from '@/components/Button';
import Section from '@/components/Section';
import InputText from '@/components/InputText';
import { GenderSwitch } from '@/components/GenderSwitch';
import { LocalStorage } from '@/utils/helpers';
import { useAtom } from 'jotai';
import { currentPairIndexAtom, duelsAtom, fighterDefault, fighterPairsAtom, fightTimeAtom, fightTimeDefault, hitZonesAtom, hitZonesDefault, hotKeysAtom, isSwissAtom, languageAtom, sameGenderOnlyAtom } from '@store';
import { Gender, ParticipantType } from '@typings';
import { langLabels } from '@constants';
import toast from 'react-hot-toast';
import Switch from '@/components/Switch';
import { generatePairs } from '@/utils/generatePairs';
import InputNumber from '@/components/InputNumber';
import TimePicker from '@/components/TimePicker';
import SelectPair from '@/components/SelectPair';

function App() {
  const { t, i18n } = useTranslation()
  /* ---------- атомы ---------- */
  const [fightTime, setFightTime] = useAtom(fightTimeAtom);
  const [hitZones, setHitZones] = useAtom(hitZonesAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [sameGenderOnly, setSameGenderOnly] = useAtom(sameGenderOnlyAtom);
  const [isSwiss, setIsSwiss] = useAtom(isSwissAtom);
  const [, setDuels] = useAtom(duelsAtom);
  const [hotKeys, setHotKeys] = useAtom(hotKeysAtom)

  /* ---------- состояние ---------- */
  const [newName, setNewName] = useState('');
  const [participants, setParticipants] = useState<ParticipantType[]>([]);
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [isSounds, setIsSounds] = useState(true)
  const [fighterId, setFighterId] = useState(0)
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
      if (p) setParticipants(JSON.parse(p || '[]'));
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
    if (idx < 0 || idx >= fighterPairs.length) return;
    setCurrentPairIndex(idx);
  };

  /* ---------- участники ---------- */
  const addParticipant = () => {
    const name = newName.trim();
    if (!name) return;
    setParticipants([...participants, { ...fighterDefault, name, gender, id: String(fighterId) }]);
    setFighterId(state=>state+1)
    setNewName('');
  };
  const removeParticipant = (idx: number) =>
    setParticipants(participants.filter((_, i) => i !== idx));

  const genPairs = () => {
    let newParticipants = participants

    if (newParticipants.length < 2) {
      toast.error(t('addTwoFighters'));
      return;
    }

    setDuels([])
    generatePairs(newParticipants, sameGenderOnly, isSwiss, setFighterPairs, setCurrentPairIndex)
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

          <Button className={styles.addBtn} onClick={addParticipant}>
            <Plus size={28} color="var(--fg)" />
          </Button>

          {participants.map((p, idx) => (
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
          <div className={styles.genderRow}>
            <div className={[styles.genderRow, { marginVertical: 0 }].join(" ")}>
              <Mars size={28} color="var(--fg)" />
              <span className={styles.countTxt}>{participants.filter(p => p.gender === Gender.MALE).length}</span>
            </div>
            <div className={[styles.genderRow, { marginVertical: 0, marginLeft: 30 }].join(" ")}>
              <Venus size={28} color="var(--fg)" />
              <span className={styles.countTxt}>{participants.filter(p => p.gender === Gender.FEMALE).length}</span>
            </div>
          </div>

          <Switch title={t('sameGenderPairs')} value={sameGenderOnly} setValue={setSameGenderOnly} />
          <Switch title={t('swissSystem')} value={isSwiss} setValue={setIsSwiss} />
          </>

          <Button style={{ marginTop: 10 }} onClick={genPairs} title={t('randomizePairs')} stroke />
        </Section>

        <SelectPair fighterPairs={fighterPairs} currentPairIndex={currentPairIndex} selectPair={selectPair} />
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
        </Section>

        {/* --- 5. Сохранить --- */}
        <Section>
          <Button onClick={saveAll}>
            <Save size={28} color="var(--fg)" />
          </Button>
          <Button onClick={resetAll} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>
      </div>
    </div>
  );
}

export default App;
