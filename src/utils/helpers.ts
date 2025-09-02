import { STORAGE_PREFIX } from "@/constants";

export const truncate = (str: string, max = 9) => str?.length > max ? `${str.slice(0, max-2)}…` : (str ? str: '');

export const onlySurname = (name: string, max = 9) => {
    const nameArray = name.split(" ")
    return nameArray[0][0] + ". " + truncate(nameArray[1], max)
}

export const truncateFullName = (name: string, max = 9) => {
    const nameArray = name.split(" ")
    return truncate(nameArray[0], max) + " " + truncate(nameArray[1], max)
}

export const LocalStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(STORAGE_PREFIX + key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  },
  clear: async (): Promise<void> => {
    localStorage.clear();
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
};