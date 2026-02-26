import { Network, Settings, Timer } from "lucide-react";
import styles from "./index.module.css"
import Setting from "../Settings";
import Fight from "../Fight";
import Grid from "../Grid";
import { useState } from "react";

enum Pages {
    SETTINGS = 'settings',
    TIMER = 'timer',
    GRID = 'grid'
}

export default function Layout() {
    const [page, setPage] = useState<Pages>(Pages.SETTINGS)

    const renderPage = () => {
        switch(page) {
            case Pages.SETTINGS:
                return <Setting />;
            case Pages.TIMER:
                return <Fight />;
            case Pages.GRID:
                return <Grid fightActivate={()=>setPage(Pages.TIMER)} />;
            default:
                return <Setting />;
        }
    }

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

            {/* Рендерим только активную страницу */}
            {renderPage()}
        </main>
    )
}