import {stringToArray} from "../../utils";
import chalk from 'chalk';

type Coordinate3D = [number, number, number]

type Map3D<T> = Tile3D<T>[][][];

type Tile3D<T> = {
    coordinate: Coordinate3D;
    data: T;
}

enum PondType {
    WATER = 'W',
    ROCK = 'R'
}

enum SurfaceType {
    EXTERIOR = 'E',
    INTERIOR = 'I'
}

type PondTile = {
    type: PondType;
    surface?: SurfaceType;
}

const NEIGHBOUR_MATRIX_COORDINATES = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];


export default function (input: string): { first: any, second: any } {
    const [map, rockTiles] = createDropsMap(formatData(input));
    map[0][0][0].data.surface = SurfaceType.EXTERIOR;
    markSurfaceTypeOnMap(map, map[0][0][0]);
    console.log(map.map(z => z.map(y => y.map(d => d.data.type === PondType.ROCK ? chalk.magenta(d.data.type) : chalk.blue(d.data.type)).join(' ')).join('\n')).join('\n\n'));
    console.log('\n\n')
    console.log(map.map(z => z.map(y => y.map(d => (d.data.surface ?? 'X') !== SurfaceType.INTERIOR ? chalk.blue(d.data.surface ?? 'X') : chalk.bgWhite(chalk.black(d.data.surface ?? 'X'))).join(' ')).join('\n')).join('\n\n'));
    const surfaceArea = calculateSurfaceArea(rockTiles, map);
    const surfaceAreaExceptInteriors = calculateSurfaceArea(rockTiles, map, true);
	return {first: surfaceArea, second: surfaceAreaExceptInteriors};
}

const formatData = (input: string): Coordinate3D[] => {
	return stringToArray(input)
        .map(row => row.split(','))
        .filter(row => row.length === 3)
        .map(points => points.map(p => +p) as Coordinate3D);
}

const createDropsMap = (coordinates: Coordinate3D[]): [Map3D<PondTile>, Tile3D<PondTile>[]] => {
    const yPadding = 1;
    const xPadding = 1;
    const maxZ = Math.max(...coordinates.map(([_, __, z]) => z));
    const maxY = Math.max(...coordinates.map(([_, y, __]) => y));
    const maxX = Math.max(...coordinates.map(([x,_, __]) => x));
    const map: Map3D<PondTile> = [];

    for (let z = 0; z <= maxZ; z++) {
        map.push([]);
        for (let y = 0; y <= maxY + yPadding * 2; y++) {
            map[z].push([]);
            for (let x = 0; x <= maxX + xPadding * 2; x++) {
                map[z][y].push({coordinate: [x, y, z], data: {type: PondType.WATER}});
            }
        }
    }

    const rockTiles = [];
    coordinates.forEach(([x, y, z]) => {
        const tile = map[z][y+yPadding][x+yPadding];
        tile.data.type = PondType.ROCK;
        tile.data.surface = SurfaceType.INTERIOR;

        rockTiles.push(tile);
    });
    return [map, rockTiles];
}

const markSurfaceTypeOnMap = (map: Map3D<PondTile>, originPoint: Tile3D<PondTile>): void => {
    const neighbours = getNeighbours(map, originPoint.coordinate);
    for (let i = 0; i < neighbours.length; i++) {
        const neighbour = neighbours[i];
        if (!!neighbour.data.surface) {
            continue;
        }
        if (neighbour.data.type === PondType.ROCK) {
            neighbour.data.surface = SurfaceType.INTERIOR;
            continue;
        }
        else neighbour.data.surface = originPoint.data.surface;
        markSurfaceTypeOnMap(map, neighbour);
    }
}

const getNeighbours = (map: Map3D<PondTile>, [x, y, z]: Coordinate3D): Tile3D<PondTile>[] => {
    const neighbours: Tile3D<PondTile>[] = [];
    NEIGHBOUR_MATRIX_COORDINATES.forEach(([diffX, diffY, diffZ]) => {
        const targetX = x + diffX;
        const targetY = y + diffY;
        const targetZ = z + diffZ;

        const outsideMap = (targetX < 0 || targetY < 0 || targetZ < 0) || (targetZ >= map.length || targetY >= map[0].length || targetX >= map[0][0].length);
        if (!outsideMap) {
            neighbours.push(map[targetZ][targetY][targetX]);
        }
    });
    return neighbours;
}

const calculateSurfaceArea = (coordinates: Tile3D<PondTile>[], map: Map3D<PondTile>, surfaceTypeCheck: boolean = false): number => {
    const SIDES_NUMBER = 6;
    return coordinates.map(({coordinate: [x, y, z]}) => {
        let openSurfaces = SIDES_NUMBER;
        NEIGHBOUR_MATRIX_COORDINATES
            .filter(([diffX, diffY, diffZ]) => {
                const targetX = x + diffX;
                const targetY = y + diffY;
                const targetZ = z + diffZ;
                return !((targetX < 0 || targetY < 0 || targetZ < 0) || (targetZ >= map.length || targetY >= map[0].length || targetX >= map[0][0].length));

            })
            .forEach(([diffX, diffY, diffZ]) => {
            const targetX = x + diffX;
            const targetY = y + diffY;
            const targetZ = z + diffZ;

            const tile = map[targetZ][targetY][targetX];

            const isInterior = surfaceTypeCheck ? !tile.data.surface : false;

            if (tile.data.type === PondType.ROCK || isInterior) {
                openSurfaces--;
            }
        });
        return openSurfaces;
    })
        .reduce((acc, curr) => acc + curr,0);
}