export const stringToArray = (input: string, splitBy = '\n'): string[] => {
    return input.replace(/\r/gm, '').split(splitBy);
}