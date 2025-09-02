import { ParticipantType } from "@/typings"
import Section from "../Section"
import Button from "../Button"
import styles from "./index.module.css"
import { onlySurname } from "@/utils/helpers"
import { useTranslation } from "react-i18next"

type SelectPairProps = {
    fighterPairs: ParticipantType[][];
    currentPairIndex: number;
    selectPair: (idx: number) => void
}

export default function SelectPair({ fighterPairs, currentPairIndex, selectPair }:SelectPairProps) {
    const { t } = useTranslation()
    const getName = (name: string) => name.length <= 14 ? name : onlySurname(name, 14)

    return (
        <>
          {fighterPairs[0] && fighterPairs[0][0] ?
          <Section title={t('pairs')}>
            {fighterPairs.map((pair, idx) => (
              <Button
              key={idx}
              className={styles.pairItem}
              style={currentPairIndex === idx ? {backgroundColor: "var(--accent)"} : { backgroundColor: "var(--accent-transparent)" }}
              title={`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
              onClick={() => selectPair(idx)}
              />
            ))}
          </Section>
          :
          <></>
        }
        </>
    )
}