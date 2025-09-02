export enum Gender {
  MALE,
  FEMALE
}

export type ParticipantType = {
  id: string;               // уникальный идентификатор
  name: string;
  gender: Gender;
  wins: number;             // победы
  losses: number;           // поражения
  draws: number;            // ничьи
  warnings: number;
  protests: number;
  doubleHits: number;
  // для швейцарской
  opponents: string[];     // уже сыгранные соперники (чтобы не повторяться)
  buchholz: number;        // доп. показатель, если понадобится
}
