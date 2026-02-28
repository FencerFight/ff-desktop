// components/Layout/index.tsx
import { Network, Radio, RadioTower, Settings, Timer } from "lucide-react";
import styles from "./index.module.css"
import Setting from "../Settings";
import Fight from "../Fight";
import Grid from "../Grid";
import { useState, useEffect } from "react";
import FightViewerWindow from "../FightViewerWindow";
import { storage } from "@/utils/storage";
import ModalWindow from "../ModalWindow";
import DirectP2P from "../DirectP2P";
import Button from "../Button";

enum Pages {
    SETTINGS = 'settings',
    TIMER = 'timer',
    GRID = 'grid',
    TIMER_VIEW = 'timer-view'
}

export default function Layout() {
    const [page, setPage] = useState<Pages>(Pages.SETTINGS);
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [showP2P, setShowP2P] = useState(false);

    // Проверяем URL параметры при загрузке
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'true') {
            setPage(Pages.TIMER_VIEW);
        }
        (async ()=>{
            await storage.init()
            setIsStorageReady(true)
        })()
    }, []);

    const renderPage = () => {
        switch(page) {
            case Pages.SETTINGS:
                return <Setting />;
            case Pages.TIMER:
                return <Fight />;
            case Pages.TIMER_VIEW:
                return <FightViewerWindow />
            case Pages.GRID:
                return <Grid fightActivate={()=>setPage(Pages.TIMER)} />;
            default:
                return <Setting />;
        }
    }

    // В окне просмотра скрываем навигацию
    const isViewerMode = page === Pages.TIMER_VIEW;

    return isStorageReady && (
        <main style={{ background: "var(--bg)" }}>
            {!isViewerMode && (
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
                    <Button stroke onClick={()=>setShowP2P(!showP2P)} style={{ minWidth: "8px", position: "absolute", top: "12px", right: "15px", padding: "10px 10px" }}>
                        <Radio size={28} color="var(--fg)" />
                    </Button>
                </header>
            )}

            {/* Рендерим только активную страницу */}
            {renderPage()}
            <ModalWindow isOpen={showP2P} onClose={()=>setShowP2P(!showP2P)} style={{ maxWidth: "38rem" }} hidden>
                <DirectP2P />
            </ModalWindow>
        </main>
    )
}