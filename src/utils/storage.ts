import { load, Store } from '@tauri-apps/plugin-store';

let store: Store | null = null;
let initPromise: Promise<void> | null = null;

const ensureInitialized = () => {
  if (!store) {
    throw new Error('Storage not initialized. Call storage.init() first.');
  }
  return store;
};

export const storage = {
  /**
   * Инициализация хранилища
   */
  init: async (options: {
    filename?: string;
    autoSave?: boolean | number;
  } = {}) => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      store = await load(options.filename ?? 'store.json', {
          autoSave: options.autoSave ?? 100,
          defaults: {}
      });
    })();

    return initPromise;
  },

  /**
   * Сохранить значение любого типа по ключу
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    await ensureInitialized().set(key, value);
  },

  /**
   * Получить значение по ключу с указанием типа
   * @returns значение или null, если ключ не найден
   */
  get: async <T>(key: string): Promise<T | undefined> => {
    return await ensureInitialized().get<T>(key);
  },

  /**
   * Обновить значение через функцию-апдейтер
   */
  update: async <T>(
    key: string,
    updater: (prev: T | null) => T
  ): Promise<void> => {
    const current = await storage.get<T>(key);
    await storage.set(key, updater(current||null));
  },

  /**
   * Проверить наличие ключа
   */
  has: async (key: string): Promise<boolean> => {
    return await ensureInitialized().has(key);
  },

  /**
   * Удалить ключ
   */
  delete: async (key: string): Promise<void> => {
    await ensureInitialized().delete(key);
  },

  /**
   * Получить все ключи
   */
  keys: async (): Promise<string[]> => {
    return await ensureInitialized().keys();
  },

  /**
   * Очистить всё хранилище
   */
  clear: async (): Promise<void> => {
    await ensureInitialized().clear();
  },

  /**
   * Принудительно сохранить изменения на диск
   */
  save: async (): Promise<void> => {
    await ensureInitialized().save();
  },

  /**
   * Перезагрузить данные с диска
   */
  reload: async (): Promise<void> => {
    await ensureInitialized().reload();
  },
};