import React, { useEffect } from 'react';
import styles from "./index.module.css"
import { X } from 'lucide-react';

type ModalWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const ModalWindow: React.FC<ModalWindowProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return isOpen ? (
    <>
      <div
        className={styles.backdrop}
      />

      {/* Modal */}
      <div
        className={styles.modalWrapper}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={styles.modal}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={28} color="var(--fg)" />
          </button>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </>
  ) : null;
};

export default ModalWindow;