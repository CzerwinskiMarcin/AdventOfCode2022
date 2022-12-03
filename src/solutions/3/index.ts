import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
    const formattedInput = stringToArray(input);
    const rucksacksCompartments = getRucksucksCompartments(formattedInput);
    const sharedItems = findSharedItemsInBothCompartments(rucksacksCompartments)
    const priorities = calculatePriority(sharedItems);

    const groupsRucksacks = groupRucksacks(formattedInput);
    const sharedItemsInGroups = getSharedItemsInGroups(groupsRucksacks);
    const groupsPriorities = calculatePriority(sharedItemsInGroups);
    return {first: priorities, second: groupsPriorities};
}

const getRucksucksCompartments = (rucksacksItems: string[]): [string, string][] => {
    return rucksacksItems
        .map(rucksack => {
            const itemsNumber = rucksack.length;
            return [rucksack.slice(0, itemsNumber / 2), rucksack.slice(itemsNumber / 2)];
        });
}

const findSharedItemsInBothCompartments = (rucksacks: [string, string][]): string[] => {
    return rucksacks
        .map(rucksack => {
            const uniqueItems = getUniqueLetters(rucksack[0]);
            const uniqueItemsSecond = getUniqueLetters(rucksack[1]);
            const commonItems = getCommon<string>(uniqueItems, uniqueItemsSecond);
            return commonItems;
        })
        .reduce((acc: string[], curr: string[]) => ([...acc, ...curr]), []);
}

const getUniqueLetters = (text: string): string[] => {
    return Array.from(new Set<string>(text.split('')))
        .sort((a: string, b: string) => a.charCodeAt(0) - b.charCodeAt(0));
}

const getCommon = <T>(firstSet: T[], secondSet: T[]): T[] => {
    return firstSet.filter((item: T) => secondSet.includes(item));
}

const calculatePriority = (items: string[]): number => {
    return items.reduce((acc: number, curr: string) => {
        const itemCharCode = curr.charCodeAt(0);
        // Char code for 'a' equals 97 and for 'A' equals 65
        if (itemCharCode > 96) {
            return acc + itemCharCode - 96
        } else return acc + itemCharCode - 65 + 27;
    }, 0);
}

const groupRucksacks = (rucksacks: string[]): [string, string, string][] => {
    const groupedRucksacks: [string, string, string][] = [];
    for (let i = 0; i < rucksacks.length; i += 3) {
        groupedRucksacks.push([rucksacks[i], rucksacks[i + 1], rucksacks[i + 2]]);
    }
    return groupedRucksacks;
}

const getSharedItemsInGroups = (groups: string[][]): string[] => {
    return groups
        .map(group => {
            let commonItems = getUniqueLetters(group[0]);
            for (let i = 1; i < group.length; i++) {
                commonItems = getCommon<string>(commonItems, getUniqueLetters(group[i]));
            }
            return commonItems;
        })
        .reduce((acc, curr) => [...acc, ...curr], []);
}