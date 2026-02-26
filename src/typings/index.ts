export enum Gender {
  MALE,
  FEMALE
}

export type ParticipantType = {
  id: string;               // уникальный идентификатор
  name: string;
  gender: Gender;
  wins: number;             // победы
  scores: number;           // очки
  losses: number;           // поражения
  draws: number;            // ничьи
  warnings: number;
  protests: number;
  doubleHits: number;
  // для швейцарской
  opponents: string[];     // уже сыгранные соперники (чтобы не повторяться)
  buchholz: number;        // доп. показатель, если понадобится
}

export type SliceParticipantType = Pick<ParticipantType, "id"|"name"|"wins"|"scores"|"doubleHits"|"protests"|"warnings">

export type ParticipantPlayoffType = {
  id: string;
  name: string;
  differenceWinsLosses: number;
  ratioWinsLosses: number;
  wins: number;
  scores: number;
  warnings: number;
  protests: number;
  doubleHits: number;
}