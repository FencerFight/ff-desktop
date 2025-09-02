// store.ts
import { Gender, ParticipantType } from '@/typings';
import { atom } from 'jotai';

export const fightTimeDefault = 120;
export const hitZonesDefault = {
  head: 3,
  torso: 2,
  arms: 2,
  legs: 1
}
export const fighterDefault: ParticipantType = {
  id: "null",
  name: "—",
  gender: Gender.MALE,
  wins: 0,
  losses: 0,
  draws: 0,
  warnings: 0,
  protests: 0,
  doubleHits: 0,
  opponents: [],
  buchholz: 0
}

// Основные атомы таймера
export const fightTimeAtom = atom(fightTimeDefault); // Время боя в секундах (по умолчанию 3 минуты)
export const isRunningAtom = atom(false); // Состояние таймера (запущен/остановлен)
export const languageAtom = atom<"en"|"ru"|"cn">('ru'); // Язык интерфейса ('en', 'ru', 'cn')
export const sameGenderOnlyAtom = atom(false); // Сортировка по полу
export const isSwissAtom = atom(false); // Швейцарская система

export const winsAtom = atom([0, 0]); // Очки первого бойца
export const score1Atom = atom(0); // Количество очков 1 бойца
export const score2Atom = atom(0); // Количество очков 2 бойца
export const doubleHitsAtom = atom(0); // Флаг учета обоюдных попаданий
export const protests1Atom = atom(0); // Флаг учета протестов для бойца 1
export const protests2Atom = atom(0); // Флаг учета протестов для бойца 2
export const warnings1Atom = atom(0); // Счетчик предупреждений для бойца 1
export const warnings2Atom = atom(0); // Счетчик предупреждений для бойца 2


// Атомы для управления парами бойцов
export const fighterPairsAtom = atom<ParticipantType[][]>([
  // Массив пар бойцов по умолчанию
  [{ ...fighterDefault, name: 'Fighter A', gender: Gender.MALE }, { ...fighterDefault, name: 'Fighter B', gender: Gender.MALE }],
  [{ ...fighterDefault, name: 'Fighter C', gender: Gender.FEMALE }, { ...fighterDefault, name: 'Fighter D', gender: Gender.FEMALE }]
]);

export const duelsAtom = atom<ParticipantType[][][]>([])

export const hitZonesAtom = atom(hitZonesDefault);

export const hotKeysAtom = atom({
  plus1: "KeyQ",
  minus1: "KeyA",
  plus2: "BracketRight",
  minus2: "Quote",
  history: "KeyH",
  start: "Space"
})

export const currentPairIndexAtom = atom(0); // Индекс текущей выбранной пары