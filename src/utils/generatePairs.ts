import { fighterDefault } from "@/store";
import { Gender, ParticipantType } from "@/typings";

export const generatePairs = (
  participants: ParticipantType[],
  sameGenderOnly: boolean,
  isSwiss: boolean,
  poolIndex: number,
  setFighterPairs: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>,
  setCurrentPairIndex: React.Dispatch<React.SetStateAction<number[]>>
): ParticipantType[][][] => {

  let pairs: ParticipantType[][][] = [];

  /* ---------- ОЛИМПИЙСКАЯ ---------- */
  if (!isSwiss) {
    let shuffled = [...participants].sort(() => Math.random() - 0.5);

    const filter = (group: ParticipantType[]) => {
      for (let i = 0; i < group.length - 1; i += 2) {
        if (!pairs[poolIndex])
          pairs[poolIndex] = []
        pairs[poolIndex].push([group[i], group[i + 1]]);
      }
      if (group.length % 2 !== 0) {
        pairs[poolIndex].push([
          group[group.length - 1],
          {
            ...fighterDefault,
            gender: group[group.length - 1].gender
          },
        ]);
      }
    };

    if (sameGenderOnly) {
      const males = shuffled.filter((p) => p.gender === Gender.MALE);
      const females = shuffled.filter((p) => p.gender === Gender.FEMALE);
      [males, females].forEach(filter);
    } else {
      filter(shuffled);
    }
  }

  /* ---------- ШВЕЙЦАРСКАЯ ---------- */
  else if (isSwiss) {
    // 1. Сортируем по очкам (wins + 0.5*draws)
    const sorted = [...participants].sort((a, b) => {
      const scoreA = a.buchholz + a.draws * 0.5;
      const scoreB = b.buchholz + b.draws * 0.5;
      return scoreB - scoreA;
    });

    // 2. Фильтрация по полу
    const groups = sameGenderOnly
      ? [
          sorted.filter((p) => p.gender === Gender.MALE),
          sorted.filter((p) => p.gender === Gender.FEMALE),
        ]
      : [sorted];

    groups.forEach((group) => {
      const used = new Set<string>();
      const tempPairs: ParticipantType[][] = [];

      for (let i = 0; i < group.length; i++) {
        const p1 = group[i];
        if (used.has(p1.id)) continue;

        // ищем первого подходящего соперника
        let found = -1;
        for (let j = i + 1; j < group.length; j++) {
          const p2 = group[j];
          if (used.has(p2.id)) continue;
          // не играли ли они уже?
          const played = p1.opponents?.includes(p2.id) || p2.opponents?.includes(p1.id);
          if (!played) {
            found = j;
            break;
          }
        }

        if (found !== -1) {
          const p2 = group[found];
          tempPairs.push([p1, p2]);
          used.add(p1.id);
          used.add(p2.id);
        } else {
          // не нашли пары – «пара с null»
          tempPairs.push([
            p1,
            {
              ...fighterDefault,
              gender: p1.gender
            },
          ]);
          used.add(p1.id);
        }
      }
      if (!pairs[poolIndex])
        pairs[poolIndex] = []
      pairs[poolIndex].push(...tempPairs);
    });
  }

  // СОРТИРОВКА: пары с "—" в конец массива
  if (pairs[poolIndex] && pairs[poolIndex].length > 0) {
    pairs[poolIndex] = pairs[poolIndex].sort((a, b) => {
      const aHasDash = a[0]?.name === "—" || a[1]?.name === "—";
      const bHasDash = b[0]?.name === "—" || b[1]?.name === "—";

      // Если у обоих есть "—" или у обоих нет "—", порядок не меняем
      if (aHasDash === bHasDash) return 0;

      // Если у a есть "—", а у b нет, a должно быть после b
      return aHasDash ? 1 : -1;
    });
  }

  setFighterPairs(state=>{
    const buf = [...state]
    buf[poolIndex] = pairs[poolIndex]
    return buf
  });
  setCurrentPairIndex(state=>{ const buf = [...state]; buf[poolIndex] = 0; return buf });
  return pairs;
};