import * as fs from 'fs';
export const getFileData = (path: string): string => fs.readFileSync(path).toString();