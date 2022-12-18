import {stringToArray} from "../../utils";

type Coordinate3D = [number, number, number]

type Map3D<T> = Tile3D<T>[][][];

type Tile3D<T> = {
    coordinate: Coordinate3D;
    data: T;
}

enum PondType {
    WATER = 'water',
    ROCK = 'rock'
}

enum SurfaceType {
    EXTERIOR = 'exterior',
    INTERIOR = 'interior'
}

type PondTile = {
    type: PondType;
    surface?: SurfaceType;
}


export default function (input: string): { first: any, second: any } {
    const coordinates = formatData(input);
    const map = createDropsMap(coordinates);
    const surfaceArea = calculateSurfaceArea(coordinates, map);
	return {first: surfaceArea, second: null};
}

const formatData = (input: string): Coordinate3D[] => {
	return stringToArray(input).map(row => row.split(',').map(p => +p) as Coordinate3D);
}

const createDropsMap = (coordinates: Coordinate3D[]): Map3D<PondTile>=> {
    const maxZ = Math.max(...coordinates.map(([_, __, z]) => z));
    const maxY = Math.max(...coordinates.map(([_, y, __]) => y));
    const maxX = Math.max(...coordinates.map(([x,_, __]) => x));
    const map: Map3D<PondTile> = [];

    for (let z = 0; z <= maxZ; z++) {
        map.push([]);
        for (let y = 0; y <= maxY; y++) {
            map[z].push([]);
            for (let x = 0; x <= maxX; x++) {
                map[z][y].push({coordinate: [x, y, z], data: {type: PondType.WATER}});
            }
        }
    }

    coordinates.forEach(([x, y, z]) => map[z][y][x].data.type = PondType.ROCK);
    return map;
}

const calculateSurfaceArea = (coordinates: Coordinate3D[], map: Map3D<PondTile>): number => {
    const SIDES_NUMBER = 6;
    const MATRIX_COORDINATES = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
    return coordinates.map(([x, y, z]) => {
        let openSurfaces = SIDES_NUMBER;
        MATRIX_COORDINATES.forEach(([diffX, diffY, diffZ]) => {
            const targetX = x + diffX;
            const targetY = y + diffY;
            const targetZ = z + diffZ;

            const outsideMap = (targetX < 0 || targetY < 0 || targetZ < 0) || (targetZ >= map.length || targetY >= map[0].length || targetX >= map[0][0].length);

            if (!outsideMap && map[targetZ][targetY][targetX].data.type === PondType.ROCK) {
                openSurfaces--;
            }
        });
        return openSurfaces;
    })
        .reduce((acc, curr) => acc + curr,0);
}