// components/DirectP2P.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeCanvas as QRCode} from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAtom } from 'jotai';
import { fighterPairsAtom, duelsAtom, playoffAtom } from '@/store';
import Button from '@/components/Button';
import styles from './index.module.css';
import InputText from '../InputText';

interface DirectP2PProps {
  onPeerConnected?: () => void;
}

export default function DirectP2P({ onPeerConnected }: DirectP2PProps) {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  // Jotai атомы
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);

  const peerRef = useRef<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Динамический импорт simple-peer с полифиллами
  const initPeer = useCallback(async () => {
    try {
      // Убеждаемся что полифиллы загружены
      if (typeof global === 'undefined') {
        window.global = window;
      }

      // Динамический импорт simple-peer
      const SimplePeer = (await import('simple-peer')).default;
      return SimplePeer;
    } catch (error) {
      console.error('Failed to load simple-peer:', error);
      addMessage('❌ Ошибка загрузки P2P модуля');
      return null;
    }
  }, []);

  // Создание P2P соединения как инициатор
  const createPeer = useCallback(async () => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      setupPeer(newPeer);
      peerRef.current = newPeer;
      setConnectionStatus('connecting');
      addMessage('Создание P2P соединения...');

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        setPeerId(signalString);
        addMessage('📱 Сигнал сгенерирован, готов к обмену');
      });

    } catch (error) {
      console.error('Error creating peer:', error);
      addMessage(`❌ Ошибка создания соединения: ${error}`);
    }
  }, [initPeer]);

  // Подключение к существующему пиру
  const connectToPeer = useCallback(async (signalData: string) => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      const signal = JSON.parse(signalData);

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      setupPeer(newPeer);
      peerRef.current = newPeer;
      setConnectionStatus('connecting');
      addMessage('Подключение к удаленному пиру...');

      newPeer.signal(signal);

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        setRemotePeerId(signalString);
        addMessage('📱 Ответный сигнал сгенерирован');
      });

    } catch (error) {
      console.error('Error connecting to peer:', error);
      addMessage(`❌ Ошибка подключения: ${error}`);
    }
  }, [initPeer]);

  // Настройка обработчиков пира
  const setupPeer = (peer: any) => {
    peer.on('connect', () => {
      setConnectionStatus('connected');
      addMessage('✅ P2P соединение установлено!');

      // Отправляем текущие данные при подключении
      sendData({
        type: 'sync',
        fighterPairs,
        duels,
        playoff
      });

      if (onPeerConnected) {
        onPeerConnected();
      }
    });

    peer.on('data', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        handleReceivedData(parsed);
      } catch (error) {
        console.error('Ошибка при обработке данных:', error);
      }
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      addMessage(`❌ Ошибка: ${err.message}`);
      setConnectionStatus('disconnected');
    });

    peer.on('close', () => {
      addMessage('Соединение закрыто');
      setConnectionStatus('disconnected');
      peerRef.current = null;
      setPeerId('');
      setRemotePeerId('');
    });
  };

  // Отправка данных
  const sendData = (data: any) => {
    if (peerRef.current && connectionStatus === 'connected') {
      peerRef.current.send(JSON.stringify(data));
      addMessage(`📤 Данные отправлены: ${data.type}`);
    }
  };

  // Обработка полученных данных
  const handleReceivedData = (data: any) => {
    addMessage(`📥 Получены данные: ${data.type}`);

    switch (data.type) {
      case 'sync':
        if (data.fighterPairs) setFighterPairs(data.fighterPairs);
        if (data.duels) setDuels(data.duels);
        if (data.playoff) setPlayoff(data.playoff);
        addMessage('✅ Данные синхронизированы');
        break;

      case 'fighterPairs-update':
        setFighterPairs(data.payload);
        addMessage('Обновлены пары бойцов');
        break;

      case 'duels-update':
        setDuels(data.payload);
        addMessage('Обновлены результаты дуэлей');
        break;

      case 'playoff-update':
        setPlayoff(data.payload);
        addMessage('Обновлена сетка плейофф');
        break;

      case 'request-sync':
        sendData({
          type: 'sync',
          fighterPairs,
          duels,
          playoff
        });
        break;

      default:
        alert(`Неизвестный тип данных: ${data.type}`);
    }
  };

  // Инициализация сканера QR
  const startScanner = () => {
    setShowScanner(true);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        connectToPeer(decodedText);
        scanner.clear();
        setShowScanner(false);
      }, (error) => {
        console.warn('Ошибка сканирования:', error);
      });

      scannerRef.current = scanner;
    }, 100);
  };

  // Остановка сканера
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  // Синхронизация всех данных
  const syncAllData = () => {
    sendData({
      type: 'sync',
      fighterPairs,
      duels,
      playoff
    });
  };

  // Запрос синхронизации
  const requestSync = () => {
    sendData({ type: 'request-sync' });
  };

  // Копирование сигнала в буфер обмена
  const copySignalToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    addMessage('📋 Сигнал скопирован в буфер обмена');
  };

  // Отключение
  const disconnect = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      setConnectionStatus('disconnected');
      setPeerId('');
      setRemotePeerId('');
      addMessage('Отключено');
    }
  };

  // Добавление сообщения в лог
  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className={styles.directP2P}>
      <h3 className={styles.title}>Прямое P2P соединение</h3>

      {connectionStatus === 'disconnected' && (
        <div className={styles.connectionControls}>
          <Button
            title="Создать соединение (Инициатор)"
            onClick={createPeer}
            className={styles.primaryButton}
          />

          <div className={styles.qrControls}>
            <Button
              title="Показать QR код"
              onClick={() => setShowQR(!showQR)}
              className={styles.secondaryButton}
            />
            <Button
              title="Сканировать QR код"
              onClick={startScanner}
              className={styles.secondaryButton}
            />
          </div>

          <div className={styles.manualConnect}>
            <InputText
            placeholder='Вставьте сигнал удаленного пира'
            value={remotePeerId}
            setValue={setRemotePeerId}
            rows={5}
            multiline
            />
            <Button
              title="Подключиться"
              onClick={() => connectToPeer(remotePeerId)}
              disabled={!remotePeerId}
            />
          </div>
        </div>
      )}

      {showQR && peerId && (
        <div className={styles.qrContainer}>
          <h4>Отсканируйте QR код для подключения</h4>
          <QRCode value={peerId} size={200} />
          <Button
            title="Скрыть QR"
            onClick={() => setShowQR(false)}
            className={styles.smallButton}
          />
        </div>
      )}

      {showScanner && (
        <div className={styles.scannerContainer}>
          <h4>Наведите камеру на QR код</h4>
          <div id="qr-reader" className={styles.scanner}></div>
          <Button
            title="Закрыть сканер"
            onClick={stopScanner}
            className={styles.smallButton}
          />
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className={styles.connecting}>
          <div className={styles.spinner}></div>
          <p>Подключение...</p>

          {peerId && (
            <div className={styles.signalData}>
              <h4>Отправьте этот сигнал другому устройству:</h4>
              <InputText
              value={peerId}
              rows={5}
              multiline
              />
              <Button
                title="Копировать сигнал"
                onClick={copySignalToClipboard}
                className={styles.smallButton}
              />
            </div>
          )}
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className={styles.connected}>
          <div className={styles.statusBadge}>✅ Подключено</div>

          <div className={styles.connectedControls}>
            <Button title="Синхронизировать все данные" onClick={syncAllData} />
            <Button title="Запросить синхронизацию" onClick={requestSync} />
            <Button title="Отключиться" onClick={disconnect} className={styles.dangerButton} />
          </div>

          <div className={styles.syncActions}>
            <h4>Быстрая синхронизация:</h4>
            <div className={styles.actionButtons}>
              <Button
                title="Синхр. пары"
                onClick={() => sendData({ type: 'fighterPairs-update', payload: fighterPairs })}
              />
              <Button
                title="Синхр. дуэли"
                onClick={() => sendData({ type: 'duels-update', payload: duels })}
              />
              <Button
                title="Синхр. плейофф"
                onClick={() => sendData({ type: 'playoff-update', payload: playoff })}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.messageLog}>
        <h4>Лог соединения:</h4>
        <div className={styles.logEntries}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.logEntry}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}