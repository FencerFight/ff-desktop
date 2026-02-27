// utils/windowManager.ts
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export async function openFightViewerWindow() {
  const windowLabel = 'fight-viewer';

  try {
    const existingWindow = await WebviewWindow.getByLabel(windowLabel);

    if (existingWindow) {
      await existingWindow.show();
      await existingWindow.setFocus();
      return existingWindow;
    }

    // Добавляем параметр view=true в URL
    const viewerWindow = new WebviewWindow(windowLabel, {
      url: '/?view=true', // Передаем параметр
      title: 'Просмотр боя',
      width: 1280,
      height: 720,
      minWidth: 800,
      minHeight: 600,
      center: true,
      resizable: true,
      fullscreen: false,
      visible: true,
      decorations: true,
    });

    return viewerWindow;
  } catch (error) {
    console.error('Ошибка при открытии окна просмотра:', error);
  }
}