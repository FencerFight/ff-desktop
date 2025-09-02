import { Network, Settings, Timer } from "lucide-react";
import styles from "./index.module.css"
import Setting from "../Settings";
import { useState } from "react";
import Fight from "../Fight";
import Grid from "../Grid";

enum Pages {
    SETTINGS,
    TIMER,
    GRID
}

const pages = {
    [Pages.SETTINGS]: <Setting />,
    [Pages.TIMER]: <Fight />,
    [Pages.GRID]: <Grid />
}

export default function Layout() {
    const [page, setPage] = useState<Pages>(Pages.SETTINGS)
    return (
    <main style={{ background: "var(--bg)" }}>
    <header className={styles.header}>
      <div className={styles.nav}>
        <button
          className={`${styles.navButton} ${page === Pages.SETTINGS ? styles.active : ''}`}
          onClick={() => setPage(Pages.SETTINGS)}
          aria-label="Настройки"
        >
          <Settings size={28} />
        </button>

        <button
          className={`${styles.navButton} ${page === Pages.TIMER ? styles.active : ''}`}
          onClick={() => setPage(Pages.TIMER)}
          aria-label="Таймер"
        >
          <Timer size={28} />
        </button>

        <button
          className={`${styles.navButton} ${page === Pages.GRID ? styles.active : ''}`}
          onClick={() => setPage(Pages.GRID)}
          aria-label="Сетка"
        >
          <Network size={28} />
        </button>
      </div>
    </header>
      {pages[page]}
    </main>
    )
}