import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
    const formattedInput = stringToArray(input);
    const pairSections = getPairsSections(formattedInput);
    const areFullSectionsOverlapping = arePairSectionsOverlapping(pairSections);
    const numberOfOverlappingSections  = countOverlappingSections(areFullSectionsOverlapping);
    const areSectionsPartialOverlapping = arePairSectionsOverlapping(pairSections, false);
    const numberOfPartiallyOverlappingSections = countOverlappingSections(areSectionsPartialOverlapping);

    return {first: numberOfOverlappingSections, second: numberOfPartiallyOverlappingSections};
}

const getPairsSections = (input: string[]): number[][][] => {
    return input
        .map((rawPair: string) => rawPair
            .split(',')
            .map((rawSection: string) => rawSection
                .split('-')
                .map(section => +section)
                .sort((a: number, b: number) => a - b)
            )
            .sort((first, second) => first[0] - second[0])
        )
}

const areEntireSectionsOverlapping = (sections: number[][]): boolean => {
    const areRightOverlapping = sections[0][0] <= sections[1][0] && sections[0][1] >= sections[1][1];
    const areLeftOverlapping = sections[1][0] <= sections[0][0] && sections[1][1] >= sections[0][1]
    return areRightOverlapping || areLeftOverlapping;
}

const arePartSectionsOverlapping = ([first, second]: number[][]): boolean => {
    const isFirstStartOverlapping = first[0] >= second[0] && first[0] <= second[1];
    const isFirstEndOverlapping = first[1] >= second[0] && first[1] <= second[1];
    const isSecondStartOverlapping = second[0] >= first[0] && second[0] <= first[1];
    const isSecondEndOverlapping = second[1] >= first[0] && second[1] <= first[1];
    return isFirstStartOverlapping || isFirstEndOverlapping || isSecondStartOverlapping || isSecondEndOverlapping;
}

const arePairSectionsOverlapping = (pairSections: number[][][], fullSectionCoverage: boolean = true): boolean[] => {
    return pairSections
        .map((sections) => {
            if (fullSectionCoverage) return areEntireSectionsOverlapping(sections);
            return arePartSectionsOverlapping(sections);
        });
}

const countOverlappingSections = (areSectionsOverlapping: boolean[]): number => {
    return areSectionsOverlapping
        .filter(isSectionOverlapping => isSectionOverlapping)
        .length;
}