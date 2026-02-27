// components/DirectP2P.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeCanvas as QRCode} from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAtom } from 'jotai';
import { fighterPairsAtom, duelsAtom, playoffAtom, participantsAtom, poolsAtom } from '@/store';
import Button from '@/components/Button';
import styles from './index.module.css';
import InputText from '../InputText';
import { useTranslation } from 'react-i18next';
import { encodeToBase64, decodeFromBase64 } from '@/utils/helpers';

const STUNservers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Альтернативные публичные STUN-серверы
  { urls: 'stun:stun.voipstunt.com:3478' },
  { urls: 'stun:stun.ekiga.net:3478' },
  { urls: 'stun:stun.ideasip.com:3478' },
  { urls: 'stun:stun.schlund.de:3478' },
  { urls: 'stun:stun.voipbuster.com:3478' },
  { urls: 'stun:stun.1und1.de:3478' },
  { urls: 'stun:stun.gmx.net:3478' },

  // Российские STUN-серверы
  { urls: 'stun:stun.rt.ru:3478' },
  { urls: 'stun:stun.mts.ru:3478' },
  { urls: 'stun:stun.sipnet.ru:3478' },

  // Китайские STUN-серверы
  { urls: 'stun:stun.chinaunix.com:3478' },
  { urls: 'stun:stun.qq.com:3478' },
]

interface DirectP2PProps {
  onPeerConnected?: () => void;
}

export default function DirectP2P({ onPeerConnected }: DirectP2PProps) {
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [answerSignal, setAnswerSignal] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [isInitiator, setIsInitiator] = useState<boolean>(false);

  // Jotai атомы
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [participants, setParticipants] = useAtom(participantsAtom);
  const [pools, setPools] = useAtom(poolsAtom);

  const peerRef = useRef<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const remoteSignalRef = useRef<string>('');

  // Динамический импорт simple-peer с полифиллами
  const initPeer = useCallback(async () => {
    try {
      if (typeof global === 'undefined') {
        window.global = window;
      }

      const SimplePeer = (await import('simple-peer')).default;
      return SimplePeer;
    } catch (error) {
      console.error('Failed to load simple-peer:', error);
      addMessage(t('p2pLoadError') || '❌ P2P module loading error');
      return null;
    }
  }, [t]);

  // Создание P2P соединения как инициатор
  const createPeer = useCallback(async () => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      setIsInitiator(true);
      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: STUNservers
        }
      });

      setupPeer(newPeer);
      peerRef.current = newPeer;
      setConnectionStatus('connecting');
      addMessage(t('p2pCreating') || 'Creating P2P connection...');

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        // Кодируем сигнал в base64
        const encodedSignal = encodeToBase64(signalString);
        setPeerId(encodedSignal);
        addMessage(t('p2pSignalGenerated') || '📱 Signal generated (base64), send it to another device');

        if (remoteSignalRef.current) {
          addMessage(t('p2pSendingSignal') || '📡 Sending signal to remote peer...');
          // Декодируем перед отправкой
          newPeer.signal(JSON.parse(decodeFromBase64(remoteSignalRef.current)));
        }
      });

    } catch (error) {
      console.error('Error creating peer:', error);
      addMessage(`${t('p2pConnectionError') || '❌ Connection error'}: ${error}`);
    }
  }, [initPeer, t]);

  // Подключение к существующему пиру
  const connectToPeer = useCallback(async (signalData: string) => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      setIsInitiator(false);
      // Сохраняем закодированный сигнал
      remoteSignalRef.current = signalData;

      if (peerRef.current) {
        addMessage(t('p2pSendingAnswer') || '📡 Sending answer signal...');
        // Декодируем перед отправкой
        peerRef.current.signal(JSON.parse(decodeFromBase64(signalData)));
        return;
      }

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: STUNservers
        }
      });

      setupPeer(newPeer);
      peerRef.current = newPeer;
      setConnectionStatus('connecting');
      addMessage(t('p2pConnecting') || 'Connecting to remote peer...');

      setTimeout(() => {
        addMessage(t('p2pSendingSignal') || '📡 Sending signal...');
        // Декодируем перед отправкой
        newPeer.signal(JSON.parse(decodeFromBase64(signalData)));
      }, 100);

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        // Кодируем ответный сигнал
        const encodedSignal = encodeToBase64(signalString);
        setRemotePeerId(encodedSignal);
        addMessage(t('p2pAnswerGenerated') || '📱 Answer signal generated (base64), send it to initiator');
      });

    } catch (error) {
      console.error('Error connecting to peer:', error);
      addMessage(`${t('p2pConnectionError') || '❌ Connection error'}: ${error}`);
    }
  }, [initPeer, t]);

  // Отправка ответного сигнала инициатору
  const sendAnswerToInitiator = useCallback(() => {
    if (answerSignal && peerRef.current && isInitiator) {
      try {
        addMessage(t('p2pSendingAnswer') || '📡 Sending answer signal to initiator...');
        // Декодируем ответный сигнал перед отправкой
        peerRef.current.signal(JSON.parse(decodeFromBase64(answerSignal)));
        setAnswerSignal('');
        addMessage(t('p2pAnswerSent') || '✅ Answer signal sent');
      } catch (error) {
        console.error('Error sending answer:', error);
        addMessage(`${t('p2pAnswerError') || '❌ Error sending answer signal'}: ${error}`);
      }
    }
  }, [answerSignal, isInitiator, t]);

  // Настройка обработчиков пира
  const setupPeer = (peer: any) => {
    peer.on('connect', () => {
      setConnectionStatus('connected');
      addMessage(t('p2pConnected') || '✅ P2P connection established!');

      sendData({
        type: 'sync',
        fighterPairs,
        participants,
        pools,
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
        console.error('Error processing data:', error);
      }
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      addMessage(`${t('p2pError') || '❌ Error'}: ${err.message}`);
      setConnectionStatus('disconnected');
    });

    peer.on('close', () => {
      addMessage(t('p2pClosed') || 'Connection closed');
      setConnectionStatus('disconnected');
      peerRef.current = null;
      setPeerId('');
      setRemotePeerId('');
      setAnswerSignal('');
      setIsInitiator(false);
      remoteSignalRef.current = '';
    });
  };

  // Отправка данных
  const sendData = (data: any) => {
    if (peerRef.current && connectionStatus === 'connected') {
      peerRef.current.send(JSON.stringify(data));
      addMessage(`${t('p2pDataSent') || '📤 Data sent'}: ${data.type}`);
    }
  };

  // Обработка полученных данных
  const handleReceivedData = (data: any) => {
    addMessage(`${t('p2pDataReceived') || '📥 Data received'}: ${data.type}`);

    switch (data.type) {
      case 'sync':
        if (data.fighterPairs) setFighterPairs(data.fighterPairs);
        if (data.duels) setDuels(data.duels);
        if (data.participants) setParticipants(data.participants);
        if (data.pools) setPools(data.pools);
        if (data.playoff) setPlayoff(data.playoff);
        addMessage(t('p2pDataSynced') || '✅ Data synchronized');
        break;

      case 'pool':
        const payload = data.payload
        if (payload.poolIndex !== undefined) {
          setFighterPairs(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.fighterPairs[payload.poolIndex]
            return buf
          })
          setDuels(state=>{
            const buf = JSON.parse(JSON.stringify(state))
            buf[payload.poolIndex] = payload.duels[payload.poolIndex]
            return buf
          })
          setParticipants(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.participants[payload.poolIndex]
            return buf
          })
          setPools(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.pools[payload.poolIndex]
            return buf
          })
        }
        break;

      case 'request-sync':
        sendData({
          type: 'sync',
          fighterPairs,
          pools,
          participants,
          duels,
          playoff
        });
        break;

      default:
        alert(`${t('p2pUnknownType') || 'Unknown data type'}: ${data.type}`);
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
        console.warn('Scan error:', error);
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
      participants,
      pools,
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
    addMessage(t('p2pSignalCopied') || '📋 Signal copied to clipboard (base64)');
  };

  // Отключение
  const disconnect = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      setConnectionStatus('disconnected');
      setPeerId('');
      setRemotePeerId('');
      setAnswerSignal('');
      setIsInitiator(false);
      remoteSignalRef.current = '';
      addMessage(t('p2pDisconnected') || 'Disconnected');
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
      <h3 className={styles.title}>{t('p2pDirectConnection') || 'Direct P2P Connection'}</h3>

      {connectionStatus === 'disconnected' && (
        <div className={styles.connectionControls}>
          <Button
            title={t('p2pCreateInitiator') || 'Create connection (Initiator)'}
            onClick={createPeer}
            className={styles.primaryButton}
          />

          <div className={styles.qrControls}>
            <Button
              title={t('p2pScanQR') || 'Scan QR code'}
              onClick={startScanner}
              className={styles.secondaryButton}
            />
          </div>

          <div className={styles.manualConnect}>
            <InputText
              placeholder={t('p2pPasteSignal') || 'Paste remote peer signal (base64)'}
              value={remotePeerId}
              setValue={setRemotePeerId}
              rows={5}
              multiline
            />
            <Button
              title={t('p2pConnect') || 'Connect'}
              onClick={() => connectToPeer(remotePeerId)}
              disabled={!remotePeerId}
            />
          </div>
        </div>
      )}

      {showQR && peerId && (
        <div className={styles.qrContainer}>
          <h4>{t('p2pScanQRToConnect') || 'Scan QR code to connect'}</h4>
          <QRCode value={peerId} size={200} />
          <Button
            title={t('p2pHideQR') || 'Hide QR'}
            onClick={() => setShowQR(false)}
            className={styles.smallButton}
          />
        </div>
      )}

      {showScanner && (
        <div className={styles.scannerContainer}>
          <h4>{t('p2pPointCamera') || 'Point camera at QR code'}</h4>
          <div id="qr-reader" className={styles.scanner}></div>
          <Button
            title={t('p2pCloseScanner') || 'Close scanner'}
            onClick={stopScanner}
            className={styles.smallButton}
          />
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className={styles.connecting}>
          <div className={styles.spinner}></div>
          <p>{t('p2pConnecting') || 'Connecting...'}</p>

          <Button
            title={t('p2pShowQR') || 'Show QR code'}
            onClick={() => setShowQR(!showQR)}
            className={styles.secondaryButton}
          />
          {peerId && isInitiator && (
            <div className={styles.signalData}>
              <h4>{t('p2pSendThisSignal') || 'Send this signal to another device (base64):'}</h4>
              <InputText
                value={peerId}
                rows={5}
                multiline
              />
              <Button
                title={t('p2pCopySignal') || 'Copy signal'}
                onClick={copySignalToClipboard}
                className={styles.smallButton}
              />
            </div>
          )}

          {remotePeerId && !isInitiator && (
            <div className={styles.signalData}>
              <h4>{t('p2pSendAnswerToInitiator') || 'Send this answer signal to initiator (base64):'}</h4>
              <InputText
                value={remotePeerId}
                rows={5}
                multiline
              />
              <Button
                title={t('p2pCopyAnswer') || 'Copy answer signal'}
                onClick={() => navigator.clipboard.writeText(remotePeerId)}
                className={styles.smallButton}
              />
            </div>
          )}

          {isInitiator && (
            <div className={styles.signalData}>
              <h4>{t('p2pPasteAnswer') || 'Paste answer signal from another device (base64):'}</h4>
              <InputText
                placeholder={t('p2pPasteAnswerHere') || 'Paste answer signal here (base64)'}
                value={answerSignal}
                setValue={setAnswerSignal}
                rows={5}
                multiline
              />
              <Button
                title={t('p2pSendAnswer') || 'Send answer signal'}
                onClick={sendAnswerToInitiator}
                disabled={!answerSignal}
                className={styles.primaryButton}
              />
            </div>
          )}
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className={styles.connected}>
          <Button
            title={t('p2pShowQR') || 'Show QR code'}
            onClick={() => setShowQR(!showQR)}
            className={styles.secondaryButton}
          />

          <div className={styles.statusBadge}>{t('p2pConnected') || '✅ Connected'}</div>

          <div className={styles.connectedControls}>
            <Button title={t('p2pSyncAll') || 'Synchronize all data'} onClick={syncAllData} />
            <Button title={t('p2pRequestSync') || 'Request synchronization'} onClick={requestSync} />
            <Button title={t('p2pDisconnect') || 'Disconnect'} onClick={disconnect} className={styles.dangerButton} />
          </div>

          <div className={styles.syncActions}>
            <h4>{t('p2pQuickSync') || 'Quick sync:'}</h4>
            <div className={styles.actionButtons}>
              {fighterPairs.map((_, poolIndex)=>(
                <Button
                  key={poolIndex}
                  title={t("pool") + " " + (poolIndex+1)}
                  onClick={() => sendData({ type: 'pool', payload: {
                    poolIndex,
                    duels,
                    fighterPairs,
                    pools,
                    participants
                  } })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.messageLog}>
        <h4>{t('p2pConnectionLog') || 'Connection log'}:</h4>
        <div className={styles.logEntries}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.logEntry}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}