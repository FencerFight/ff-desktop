import { ParticipantType } from "@/typings"
import Section from "../Section"
import Button from "../Button"
import styles from "./index.module.css"
import { getName } from "@/utils/helpers"
import { useTranslation } from "react-i18next"

type SelectPairProps = {
    poolIndex: number;
    fighterPairs: ParticipantType[][][];
    currentPairIndex: number;
    selectPair: (idx: number) => void;
    deleteEmptyPairs?: boolean
}

export default function SelectPair({ fighterPairs, poolIndex, currentPairIndex, selectPair, deleteEmptyPairs=false }:SelectPairProps) {
    const { t } = useTranslation()

    return (
        <>
          {fighterPairs[poolIndex] && fighterPairs[poolIndex][0] && fighterPairs[poolIndex][0][0] ?
          <Section title={t('pairs') + ": " + t("pool") + " " + (poolIndex+1).toString()}>
            {(deleteEmptyPairs ? fighterPairs[poolIndex].filter(pair=>pair[0].name !== "—" && pair[1].name !== "—") : fighterPairs[poolIndex]).map((pair, idx) => (
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