import {Coordinate} from "../../interfaces";
import {stringToArray} from "../../utils";
import yargs from "yargs";
import {unorderedRemoveItem} from "ts-loader/dist/utils";
import {jsonRegex} from "ts-loader/dist/constants";

type SensorBeanData = [Coordinate, Coordinate, number] // Number if for range
type ScreenData = {xMin: number, yMin: number, xMax: number, yMax: number};

export default function (input: string): { first: any, second: any } {
    const coveredPointsCount = countPlacesNotHavingBean(input, 2000000)
    const distressSignalPosition = getDistressSignalPosition(input, 0, 4000000);
    const tuningFreq = distressSignalPosition[0] * 4000000 + distressSignalPosition[1];

	return {first: coveredPointsCount, second: tuningFreq};
}

const countPlacesNotHavingBean = (input: string, targetY: number): number => {
    const sensorBeanPairs = formatInput(input);
    const reachableSensors = getSensorsWithEnoughRange(sensorBeanPairs, targetY);
    const coverageRanges = getCoverageRanges(reachableSensors, targetY);
    const coveredPointsQuantity = countCoveragePoints(coverageRanges) ;
    const occupiedPointsQuantity = countOccupiedPositionsInRanges(coverageRanges, targetY, sensorBeanPairs);
    return coveredPointsQuantity - occupiedPointsQuantity;
}

const getDistressSignalPosition = (input: string, minPos: number, maxLength: number): Coordinate => {
    const sensorBeanPairs = formatInput(input);
    let foundPosition: Coordinate;
    let currentRow = minPos;
    while (!foundPosition && currentRow <= maxLength) {
        console.log('Row', currentRow);
        // console.log(currentRow);
        const reachableSensors = getSensorsWithEnoughRange(sensorBeanPairs, currentRow);
        // console.log(reachableSensors);
        const coverageRanges = getCoverageRanges(reachableSensors, currentRow);
        const vacantPoint = getVacantPosition(coverageRanges, minPos, maxLength);
        if (vacantPoint) {
            console.log('Vacan point:', vacantPoint);
            foundPosition = [vacantPoint, currentRow];
        }
        currentRow++;
    }
    return foundPosition;
}

const getVacantPosition = (ranges: [number, number][], minPos: number, maxPos: number): number | null => {
    ranges.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < ranges.length - 1; i++) {
        const currRange = ranges[i];
        const nextRange = ranges[i+1];

        if (nextRange[0] - currRange[1] === 2) return currRange[1] + 1;
    }
    return null;
}

const formatInput = (input: string): SensorBeanData[] => {
     return stringToArray(input)
        .map(row => row.split(': ')
            .map(s => s.split(',')
                .map(s => s.replace(/[a-zA-Z= ]/g, ''))
                .map(s => +s)
            ) as [Coordinate, Coordinate]
        )
         .map(([sensor, bean]) => {
             const xDist = Math.abs(sensor[0] - bean[0]);
             const yDist = Math.abs(sensor[1] - bean[1]);
             return [sensor, bean, xDist + yDist];
         });
}

const findDimensions = (sensorBeanPairs: SensorBeanData[]): ScreenData => {
    return sensorBeanPairs
        .reduce((acc, [[sensorX, sensorY], [beanX, beanY]]) =>
            [...acc, [sensorX, sensorY], [beanX, beanY]], [])
        .reduce((acc, [x, y]) => {
            const xMin = Math.min(acc.xMin, x);
            const yMin = Math.min(acc.yMin, y);
            const xMax = Math.max(acc.xMax, x);
            const yMax = Math.max(acc.yMax, y);
            return {xMin, yMin, xMax, yMax };
            }, {xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity});
}

const findHeighestSensorBeanRange = (sensorBeanPairs: SensorBeanData[]): number => {
    return sensorBeanPairs
        .reduce((acc, [_, __, range]) => {
            return acc > range ? acc : range;
        }, -Infinity);

}

const getSensorsWithEnoughRange = (sensorBeanData: SensorBeanData[], targetY: number): SensorBeanData[] => {
    return sensorBeanData.filter(([[x, y], _, range]) => y + range >= targetY && y - range <= targetY);
}

const getCoverageRanges = (sensorData: SensorBeanData[], targetY: number): any[] => {
    let coverages = [];
    sensorData.map(([sensor, _, range]) => {
        const usedRange = Math.abs(sensor[1] - targetY);
        coverages.push(getCoverageFromPoint(sensor[0], range - usedRange));
    });
    let neededMerge = false;
    do {
        // console.log('\nMerging loop ##########\n')
        coverages.sort(([prevMin, prevMax], [currMin, currMax]) => prevMin - currMin);
        let previousCoverages = [...coverages];
        let tmpCoverages = [...coverages];
        coverages = [];
        // console.log('Coverages to merge', tmpCoverages);
        // console.log('Coverages container', coverages);
        while (!!tmpCoverages.length) {
            coverages.push(...mergeRanges(tmpCoverages.shift(), tmpCoverages.shift()));
        }
        neededMerge = JSON.stringify(previousCoverages) !== JSON.stringify(coverages);
        // console.log('Merged coverages:', coverages)
        // console.log('\tNeed merge: ', neededMerge);
        // console.log('END Merging loop ##########\n')
    } while (neededMerge && coverages.length > 1);
    // console.log('Merged coverages', coverages);
    return coverages;
}

const getCoverageFromPoint = (point: number, range: number): [number, number] => {
    return [point - range, point + range].sort((a, b) => a - b) as [number, number];

}
const countOccupiedPositionsInRanges = (coveredRanges: [number, number][], targetY: number, sensorBeanData: SensorBeanData[]): number => {
    // console.log('Sensors', sensorBeanData);
    // console.log('CoveredRanges', coveredRanges);
    const counter = sensorBeanData.reduce((acc, [sensor, bean]) => {
        coveredRanges.forEach(([minX, maxX]) => {
            if (sensor[0] >= minX && sensor[0] <= maxX && sensor[1] === targetY) {
                // console.log(sensor, [minX, maxX, targetY]);
                acc[`${sensor[0]}-${sensor[1]}`] = 1;
            }
            if (bean[0] >= minX && bean[0] <= maxX && bean[1] === targetY) {
                // console.log(bean, [minX, maxX, targetY]);
                acc[`${bean[0]}-${bean[1]}`] = 1;
            }
        });
        return acc;
    }, {});
    // console.log('Counter', Object.keys(counter).length);
    return Object.keys(counter).length;
}


const mergeRanges = (_first: [number, number], _second?: [number, number]): [number, number][] => {
    if (!_second) return [_first];
    const first = [..._first].sort((a, b) => a - b);
    const second = _second.sort((a, b) => a - b);
    const merged = [];

    if (first[0] <= second[0] && first[1] >= second[1]) merged.push([...first]);
    else if (second[0] <= first[0] && second[1] >= first[1]) merged.push([...second]);
    else if (first[0] < second[0] && first[1] >= second[0] && first[1] <= second[1]) merged.push([first[0], second[1]])
    else if (second[0] < first[0] && second[1] >= first[0] && second[1] <= first[1]) merged.push([second[0], first[1]])
    else merged.push([...first], [...second]);
    return merged;
}
const countCoveragePoints = (coverageRanges: [number, number][]): number => {
    return coverageRanges.reduce((acc, [min, max]) => {
        acc += Math.abs(min) + Math.abs(max) + 1;
        return acc;
    }, 0);
}

// console.log('Test merged');
// console.log('[-1, 1] and [-2, 2]', mergeRanges([-1, 1], [-2, 2]));
// console.log('[-2, 2] and [-1, 1]', mergeRanges([-2, 2], [-1, 1]));
// console.log('[-1, 1] and [-2, 0]', mergeRanges([-1, 1], [-2, 0]));
// console.log('[-2, 0] and [-1, 1]', mergeRanges([-2, 0], [-1, 1]));
// console.log('[-1, 1] and [0, 2] ', mergeRanges([-1, 1], [0, -2]));
// console.log('[0, 2] and [-1, 1] ', mergeRanges([0, 2], [-1, 1]));
// console.log('[-1, 1] and [4, 6] ', mergeRanges([-1, 1], [4, 6]));
// console.log('[4, 6] and [-1, 1] ', mergeRanges([4, 6], [-1, 1]));
