// utils/importExcel.ts
import { SliceParticipantType } from '@/typings';
import i18n from './i18n';
import { readFile } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { generateId } from './helpers';

export async function importExcel(): Promise<[SliceParticipantType[][], number] | null> {
  try {
    // Диалог выбора файла
    const filePath = await open({
      multiple: false,
      directory: false,
      filters: [{
        name: 'Excel Files',
        extensions: ['xlsx', 'xls']
      }]
    });

    if (!filePath) {
      return null;
    }

    // Читаем файл
    const fileData = await readFile(filePath);

    // Парсим Excel файл
    const workbook = XLSX.read(fileData, { type: 'array' });

    let participants: SliceParticipantType[] = [];
    const pairs: SliceParticipantType[][] = [];
    const namesIds: {[key: string]: string} = {}
    const processedNames = new Set<string>();

    // Проходим по всем листам
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Ищем строки с данными участников (начинаются с 4 строки, так как первые 3 - заголовки)
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 11) continue;

        // Левый участник (колонки 0-5)
        const leftName = row[0]?.toString().trim();
        const leftId = processedNames.has(leftName) ? namesIds[leftName] : generateId(leftName)
        if (!processedNames.has(leftName)) namesIds[leftName] = leftId
        if (leftName) {
          participants.push({
            id: leftId,
            name: leftName,
            warnings: parseInt(row[1]?.toString() || '0') || 0,
            protests: parseInt(row[2]?.toString() || '0') || 0,
            scores: parseInt(row[3]?.toString() || '0') || 0,
            wins: parseInt(row[4]?.toString() || '0') || 0,
            doubleHits: parseInt(row[5]?.toString() || '0') || 0
          });
        }
        processedNames.add(leftName)
        // Правый участник (колонки 6-10)
        const rightName = row[10]?.toString().trim();
        const rightId = processedNames.has(rightName) ? namesIds[rightName] : generateId(rightName)
        if (!processedNames.has(rightName)) namesIds[rightName] = rightId
        if (rightName) {
          participants.push({
            id: rightId,
            name: rightName,
            warnings: parseInt(row[9]?.toString() || '0') || 0,
            protests: parseInt(row[8]?.toString() || '0') || 0,
            scores: parseInt(row[7]?.toString() || '0') || 0,
            wins: parseInt(row[6]?.toString() || '0') || 0,
            doubleHits: parseInt(row[5]?.toString() || '0') || 0
          });
        }
        processedNames.add(rightName)
        pairs.push(participants)
        participants = []
      }
    });

    toast.success(i18n.t("fileImportSuccess"));

    // Возвращаем массив участников
    return [pairs, workbook.SheetNames.length];

  } catch (error) {
    console.error('Import error:', error);
    toast.error(i18n.t("fileImportFail"));
    return null;
  }
}