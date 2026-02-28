import Button from '@/components/Button';
import Table from '@/components/Table';
import {
  currentPairIndexAtom,
  currentPoolIndexAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterPairsAtom,
  isPlayoffAtom,
  isPoolRatingAtom,
  isRobinAtom,
  playoffAtom,
  poolCountDeleteAtom,
  protests1Atom,
  protests2Atom,
  sameGenderOnlyAtom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
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
import { generatePlayoffPairs } from '@/utils/generatePlayoffPairs';
import Playoff from '../Playoff';

export default function TournamentGridScreen({ fightActivate }:{ fightActivate: ()=>void }) {
  const { t } = useTranslation()
  const [poolCountDelete] = useAtom(poolCountDeleteAtom)
  const [isPoolRating] = useAtom(isPoolRatingAtom)
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [sameGenderOnly] = useAtom(sameGenderOnlyAtom);
  const [isRobin] = useAtom(isRobinAtom);
  const [winners, setWinners] = useState<string[]>([])
  const [, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);

  const [isEnd, setIsEnd] = useAtom(isPlayoffAtom)

  const headers = [t('name'), t('win'), t('score'), t('score'), t('win'), t('name')];

  const endTournament = () => {
    const winnersArr = getTopThreeFighters([...duels[currentPoolIndex], fighterPairs[currentPoolIndex]]);
    setFighterPairs(state=>{
      const buf = JSON.parse(JSON.stringify(state))
      buf[currentPoolIndex] = []
      return buf
    });
    setWinners(winnersArr)
    setIsEnd(state=>{
      const buf = [...state];
      buf[currentPoolIndex] = true;
      return buf
    })
  }

  const genPairs = async () => {
    const newFighters = !isRobin ? fighterPairs[currentPoolIndex].map(pair => {
      if (pair[0]?.name === "—") {
        return pair[1];
      } else if (pair[1]?.name === "—") {
        return pair[0];
      } else {
        return pair[0].wins > pair[1].wins ? { ...pair[0], wins: 0, scores: 0 } : { ...pair[1], wins: 0, scores: 0 };
      }
    }).filter(Boolean) as ParticipantType[]
    :
    fighterPairs[currentPoolIndex].map(pair => {
      const buchholz1 = pair[0].buchholz + pair[0].wins
      const buchholz2 = pair[1].buchholz + pair[1].wins
      return [{...pair[0], wins: 0, scores: 0, buchholz: buchholz1 }, {...pair[1], wins: 0, scores: 0, buchholz: buchholz2 }]
    }).flat();
    setDuels(prev =>{ const buf = JSON.parse(JSON.stringify(prev)); buf[currentPoolIndex].push(fighterPairs[currentPoolIndex]); return buf });
    if (newFighters.length > 1) {
      const newPairs = generatePairs(newFighters, sameGenderOnly, isRobin, currentPoolIndex, setFighterPairs, setCurrentPairIndex);
      if (isRobin) {
        const pairs = newPairs[currentPoolIndex].flat()
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
  };

  const getDataTable = (data: ParticipantType[][]) =>
    data.map(([f1, f2]) => [
      truncate(f1?.name || ""),
      f1.wins.toString(),
      f1.scores.toString(),
      f2.scores.toString(),
      f2.wins.toString(),
      truncate(f2?.name || "")
    ]);

  const sections = [
    ...(fighterPairs[currentPoolIndex].filter(p => p.length).length
      ? [
          {
            key: 'current',
            title: t('currentStage'),
            data: getDataTable(fighterPairs[currentPoolIndex])
          },
        ]
      : []),
    ...duels[currentPoolIndex].map((duel, i) => ({
      key: `duel-${i}`,
      title: `${i + 1} ${t('stage')}`,
      data: getDataTable(duel),
    })),
  ];

  return !playoff.length ? (
    <div className={styles.container}>
        {!isEnd.includes(false) && isRobin ?
        <Button onClick={()=>setPlayoff(generatePlayoffPairs(duels, poolCountDelete, isPoolRating))} title={t('playoff')} style={{ width: "100%", marginBottom: "10px" }} />
        :
        <></>
        }
        {!!winners.length && !isRobin &&
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

          {index === 0 && fighterPairs[currentPoolIndex].filter(p => p.length).length && isEnd.includes(false) ? (
            <Button
              title={t('stageEnd')}
              onClick={genPairs}
              disabled={
               fighterPairs[currentPoolIndex].filter(pair=>pair[0].name !== "—" && pair[1].name !== "—").length !== fighterPairs[currentPoolIndex].filter(pair=>(pair[0].wins || pair[1].wins) && pair[0].name !== "—" && pair[1].name !== "—").length
              }
            />
          ) : <></>}
        </div>
      ))}
        <Button onClick={() => exportExcel(duels[currentPoolIndex], `${t('pool') + " " + (currentPoolIndex+1)}.xlsx`)} style={{ width: "100%" }}>
            <Save size={28} />
        </Button>
    </div>
  ) : <Playoff fightActivate={fightActivate} />;
}