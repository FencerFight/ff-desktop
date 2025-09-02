import { ParticipantType } from '@typings';

export function incWin(
    winnerId: string,
    opponent: string,
    pairIndex: number,
    setter: React.Dispatch<React.SetStateAction<ParticipantType[][]>>,
    warnings: number,
    protests: number,
    doubleHits: number,
    isLosse=false,
    draws=0
)
{
  setter(prev =>
      prev.map((pair, i) =>{
            if (pairIndex === i) {
                return pair.map(p =>
                    p.id === winnerId ? { ...p, wins: (isLosse && !draws) ? p.wins : p.wins + 1, losses: (isLosse && !draws) ? p.losses + 1: p.losses, draws: p.draws + draws, opponents: [...p.opponents, opponent], warnings, protests, doubleHits } : p
                )
            }
            return pair
        }
      )
  );
}