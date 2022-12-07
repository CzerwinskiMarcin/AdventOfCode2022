import {stringToArray} from "../../utils";

interface File {
	name: string;
	parent: File | null;
	children: File[];
	isDir: boolean;
	size: number;
}

const DISC_SPACE = 70_000_000;
const REQUIRED_FREE_SPACE = 30_000_000;

export default function (input: string): { first: any, second: any } {
    const separatedTerminalOutput = stringToArray(input);
    const file = generateFileTree(separatedTerminalOutput.slice(1));
    calculateDirSize(file);
	const directoriesWithLimitedSize = findFiles(file, findDirWithSizeNoMore(100_000));
	const totalSize = directoriesWithLimitedSize.reduce((acc, curr) => acc + curr.size, 0);

	const currentFreeSpace = DISC_SPACE - file.size;
	const neededFreeSpace = REQUIRED_FREE_SPACE - currentFreeSpace;
	const directoriesWithAtLeastRequiredSize = findFiles(file, findDirWithSizeAtLeast(neededFreeSpace))
		.sort((a, b) => a.size - b.size);
	return {first: totalSize, second: directoriesWithAtLeastRequiredSize[0].size};
}

const generateFileTree = (terminalInputs: string[], currentLine: number = 0, parent: File | null = null): File => {
    const rootFile: File = {name: '/', parent, children: [], isDir: true, size: 0};
    let currentFile = rootFile;
    let input = '';

    do {
    	input = terminalInputs[currentLine];
		if (input.startsWith('$')) {
			currentFile = handleCommand(input.replace('$ ', ''), currentFile);
		} else {
		    handleTerminalOutput(input, currentFile);
		}

		currentLine++;
	} while (currentLine < terminalInputs.length)

    return rootFile;
}

const handleCommand = (command: string, currentFile: File): File => {
	switch (true) {
		case command.includes('cd'):
		    return handleChangeDirCommand(command.split(' ')[1], currentFile);
		case command.includes('ls'):
		    return currentFile;
	}
}

const handleChangeDirCommand = (path: string, file: File): File => {
    if (path == '..') {
        return !!file.parent ? file.parent : file;
	}

    const children = file.children.find(child => child.name === path);

    if (!!children) {
		return children
	}

    throw new Error(`No children with name ${path} for file: ${file.name}`);
}

const handleTerminalOutput = (output: string, currentFile: File): void => {
    const [firstPart, secondPart] = output.split(' ');

    const newFile: File = {name: '', parent: currentFile, children: [], isDir: false, size: 0};
    if (firstPart === 'dir') {
    	newFile.name = secondPart;
    	newFile.isDir = true;
	} else {
		newFile.size = +firstPart;
		newFile.name = secondPart;
	}

    currentFile.children.push(newFile);
}

const getFileStructure = (file: File, deep: number = 0): string => {
    let result = '';
    const tab = new Array(deep).fill(' ').join('');
    const name = file.name;
    const details = `${file.isDir ? '(dir, size=' + file.size +')' : '(file, size=' + file.size + ')'}`;
    result += `\n${tab}- ${name} ${details}`;
    result += file.children.map(child => getFileStructure(child, deep+1))
    return result;
}

const calculateDirSize = (file: File): void => {
    file.children
		.filter(({isDir}) => isDir)
		.forEach(child => calculateDirSize(child));

    file.size = file.children.reduce((acc, {size}) => acc + size, 0);
}

const findFiles = (file: File, compareFn: (file: File) => boolean, accumulatedFiles: File[] = []) => {
    file.children.forEach(child => findFiles(child, compareFn, accumulatedFiles));

    if (compareFn(file)) accumulatedFiles.push(file);

    return accumulatedFiles;
}

const findDirWithSizeNoMore = (size: number) => (file: File): boolean => {
	return file.isDir && file.size <= size;
}

const findDirWithSizeAtLeast = (size: number) => (file: File): boolean => {
	return file.isDir && file.size >= size;
}