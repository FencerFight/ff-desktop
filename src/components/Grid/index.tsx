import Button from '@/components/Button';
import Table from '@/components/Table';
import {
  currentPairIndexAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterPairsAtom,
  isSwissAtom,
  protests1Atom,
  protests2Atom,
  sameGenderOnlyAtom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
  winsAtom
} from "@/store";
import { generatePairs } from '@/utils/generatePairs';
import { truncate } from '@/utils/helpers';
import { useAtom } from 'jotai';
import { Save } from 'lucide-react';
import { useState } from 'react';

import styles from './index.module.css';
import { ParticipantType } from '@/typings';
import { useTranslation } from 'react-i18next';
import { getTopThreeFighters } from '@/utils/getTopThreeFighters';
import { exportExcel } from '@/utils/exportExcel';

export default function TournamentGridScreen() {
  const { t } = useTranslation()
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [sameGenderOnly] = useAtom(sameGenderOnlyAtom);
  const [isSwiss] = useAtom(isSwissAtom);
  const [winners, setWinners] = useState<string[]>([])
  const [, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setWins] = useAtom(winsAtom);

  const headers = [t('name'), t("warnings"), t("protests"), t('win'), t("doubleHits"), t('win'), t("protests"), t("warnings"), t('name')];

  const genPairs = async () => {
    const endTournament = () => {
      const winnersArr = getTopThreeFighters([...duels, fighterPairs]);
      setFighterPairs([[]]);
      setWinners(winnersArr)
    }
    const newFighters = !isSwiss ? fighterPairs.map(pair => {
      if (pair[0]?.name === "—") {
        return pair[1];
      } else if (pair[1]?.name === "—") {
        return pair[0];
      } else {
        return pair[0].wins > pair[1].wins ? { ...pair[0], wins: 0 } : { ...pair[1], wins: 0 };
      }
    }).filter(Boolean) as ParticipantType[] : fighterPairs.map(pair => {
      const buchholz1 = pair[0].buchholz + pair[0].wins
      const buchholz2 = pair[1].buchholz + pair[1].wins
      return [{...pair[0], wins: 0, buchholz: buchholz1 }, {...pair[1], wins: 0, buchholz: buchholz2 }]
    }).flat();
    setDuels(prev => [...prev, fighterPairs]);
    if (newFighters.length > 1) {
      const newPairs = generatePairs(newFighters, sameGenderOnly, isSwiss, setFighterPairs, setCurrentPairIndex);
      if (isSwiss) {
        const pairs = newPairs.flat()
        if (pairs.filter(pair=>pair.name === "—").length === pairs.filter(pair=>pair.name !== "—").length) {
          endTournament()
        }
      }
    } else {
      endTournament()
    }

    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setScore1(0);
    setScore2(0);
    setWins([0, 0]);
  };

  const getDataTable = (data: ParticipantType[][]) =>
    data.map(([f1, f2]) => [
      truncate(f1?.name || ""),
      f1.warnings.toString(),
      f1.protests.toString(),
      f1.wins.toString(),
      f1.doubleHits.toString(),
      f2.wins.toString(),
      f2.protests.toString(),
      f2.warnings.toString(),
      truncate(f2?.name || "")
    ]);

  const sections = [
    ...(fighterPairs.filter(p => p.length).length
      ? [
          {
            key: 'current',
            title: t('currentStage'),
            data: getDataTable(fighterPairs)
          },
        ]
      : []),
    ...duels.map((duel, i) => ({
      key: `duel-${i}`,
      title: `${i + 1} ${t('stage')}`,
      data: getDataTable(duel),
    })),
  ];

  return (
    <div className={styles.container}>
        {winners.length &&
        <div className={styles.winners}>
            <span className={styles.winner}><span>2</span><span>{winners[1]}</span></span>
            <span className={styles.first}><span>1</span><span>{winners[0]}</span></span>
            <span className={styles.winner}><span>3</span><span>{winners[2]}</span></span>
        </div>
        }
      {sections.map((item, index) => (
        <div key={item.key} className={styles.duelWrap}>
          <h2 className={styles.duelTitle}>{item.title}</h2>
          <Table data={item.data} headers={headers} />

          {index === 0 && fighterPairs.filter(p => p.length).length ? (
            <Button
              title={t('stageEnd')}
              onClick={genPairs}
              disabled={
               !isSwiss && fighterPairs.length !== fighterPairs.filter(pairs=>pairs.filter(pair=>pair.wins && pair.name !== "—").length).length
              }
            />
          ) : null}
        </div>
      ))}
        <Button onClick={() => exportExcel(duels)} style={{ width: "100%" }}>
            <Save size={28} />
        </Button>
    </div>
  );
}