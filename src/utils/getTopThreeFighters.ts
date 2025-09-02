import { ParticipantType } from "@/typings";

export const getTopThreeFighters = (duels: ParticipantType[][][]): string[] => {
  // Создаем объект для подсчета побед
  const winsMap: Record<string, { fighter: string; wins: number }> = {};

  // Перебираем все дуэли и бои
  duels.forEach(round => {
    round.forEach(match => {
      match.forEach(fighter => {
        const key = fighter.name;

        if (!winsMap[key]) {
          winsMap[key] = { fighter: key, wins: 0 };
        }

        winsMap[key].wins += fighter.wins;
      });
    });
  });

  // Преобразуем в массив и сортируем по количеству побед
  const fightersWithWins = Object.values(winsMap);
  fightersWithWins.sort((a, b) => b.wins - a.wins);
  if (fightersWithWins.length < 3) fightersWithWins.push({ fighter: "", wins: 0 })

  // Берем топ-3 и возвращаем только информацию о бойцах
  return fightersWithWins.slice(0, 3).map(item => item.fighter);
};