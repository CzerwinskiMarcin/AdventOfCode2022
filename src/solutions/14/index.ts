import {Coordinate} from "../../interfaces";
import {stringToArray} from "../../utils";
import {CommandOptions} from "webpack-cli/lib/types";

export default function (input: string): { first: any, second: any } {
    const mapManager = new MapManager(input, new BaseInputMapConverter([500, 1]));
    mapManager.simulateSandFlow(false);
    // mapManager.printMap();
	return {first: mapManager.sandQuantity, second: null};
}

interface InputConverter {
    get sandOrigin(): Coordinate;
    convert: (input: string) => Tile[][];
}

interface MoveStrategy {
    movementOrder: Coordinate[];
    getPossibleMovements(origin: Coordinate): Coordinate[];
}

class SandMoveStrategy implements MoveStrategy {
    movementOrder: Coordinate[] = [[0, 1], [-1, 1], [1, 1]];
    getPossibleMovements(origin: Coordinate): Coordinate[] {
        return this.movementOrder.map(([x, y]) => [origin[0] + x, origin[1] + y]);
    }
}

interface Moveable {
     coordinate: Coordinate;
}

class BaseInputMapConverter implements InputConverter {
    _sandOrigin: Coordinate;

    constructor(private offset: Coordinate = [0, 0]) {
    }

    get sandOrigin(): Coordinate {
        return this._sandOrigin;
    }

    convert(input: string, sandOrigin: Coordinate = [500, 0]): Tile[][] {
        return this.fillMap(input, sandOrigin)
    }

    private convertToCoordinates (input: string): Coordinate[] {
        const coordinates: Coordinate[] = [];
        stringToArray(input)
            .forEach((row: string) => {
                const points: Coordinate[] = row.split(' -> ')
                    .map(rawCoordinates => rawCoordinates.split(',')
                        .map(position => +position) as Coordinate);

                for (let i = 0; i < points.length - 1; i++) {
                    coordinates.push(...this.generateRockBetweenPoints(points[i], points[i + 1]));
                }
            });
        return coordinates;
    }

    private generateRockBetweenPoints ([startX, startY]: Coordinate, [endX, endY]: Coordinate): Coordinate[] {
        const coordinates: Coordinate[] = [];
        if (startX !== endX) {
            const minX = Math.min(startX, endX);
            const diff = Math.abs(startX - endX);
            for (let i = 0; i <= diff; i++) {
                coordinates.push([minX + i, startY]);
            }
        } else {
            const minY = Math.min(startY, endY);
            const diff = Math.abs(startY - endY);
            for (let i = 0; i <= diff; i++) {
                coordinates.push([startX, minY + i]);
            }
        }
        return coordinates;
    }

    private findRangeOfRocks = (rocks: Coordinate[]): {min: Coordinate, max: Coordinate, diff: Coordinate} => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        rocks.forEach(([x, y]) => {
            if (minX > x) minX = x;
            if (maxX < x) maxX = x;
            if (minY > y) minY = y;
            if (maxY < y) maxY = y;
        });

        return {min: [minX, minY], max: [maxX, maxY], diff: [Math.abs(minX - maxX), Math.abs(0 - maxY)]};
    }

    fillMap(input: string, sandOrigin: Coordinate): Tile[][] {
        const rocks = this.convertToCoordinates(input);
        const rocksRange = this.findRangeOfRocks(rocks);
        const tiles: Tile[][] = [];
        for (let y = 0; y <= rocksRange.diff[1]; y++) {
            tiles.push([]);
            for (let x = 0; x <= rocksRange.diff[0] + this.offset[0]; x++) {
                tiles[y][x] = {coordinate: [x, y], type: TileType.AIR};
            }
        }

        for (let i = 0; i < Math.abs(this.offset[1]); i++) {
            const row = [];
            for (let x = 0; x < tiles[0].length; x++) {
                row.push({coordinate: [tiles.length, x], type: TileType.AIR});
            }
            tiles.push([...row]);
        }

        rocks.forEach(([x, y]) => {
            tiles[y][x - rocksRange.min[0] + Math.floor(this.offset[0]/2)].type = TileType.ROCK;
        });

        this._sandOrigin = [sandOrigin[0] - rocksRange.min[0] + Math.floor(this.offset[0]/2), sandOrigin[1]];
        tiles[sandOrigin[1]][sandOrigin[0] - rocksRange.min[0] + Math.floor(this.offset[0]/2)].type = TileType.SAND_SOURCE;
        return tiles;
    }
}

class MapManager {
    private sands: Sand[] = [];
    private sandMap: (Sand | null)[][] = [];
    private map: Tile[][];
    private sandOrigin: Coordinate;
    private width: number;
    private height: number;

    constructor(private input: string, private converter: InputConverter) {
        this.initMap();
        this.initSandMap();
        this.sandOrigin = converter.sandOrigin;
        this.printMap();
    }

    get sandQuantity(): number {
        return this.sands.length;
    }

    initMap(): void {
        this.map = this.converter.convert(this.input);
        this.width = this.map[0].length;
        this.height = this.map.length;
    }

    simulateSandFlow(printMapOnEachSand: boolean = false): void {
        let sandFallingOut = false
        let iteration = 0;

        while (!sandFallingOut) {
            if (printMapOnEachSand) console.log(`\nSand number: ${iteration + 1}`);
            const newSand = this.flowSand(this.generateSand());
            if (newSand.coordinate[0] === this.sandOrigin[0] && newSand.coordinate[1] === this.sandOrigin[1]) {
                this.sands.push(newSand);
                sandFallingOut = true;
                continue;
            }
            if (!newSand) {
                sandFallingOut = true;
                continue;
            }
            this.sands.push(newSand);
            this.putSandOnMap(newSand);
            if (printMapOnEachSand) {
                this.printMap();
                iteration++;
            }
        }
    }

    printMap(): void {
        console.log(this.map.map((row, y) => {
            const sand = this.sandMap[y].map(s => !!s ? 'o' : null);
            const others = this.map[y].map(t => t.type);
            return sand.map((s, x) => !!s ? s : others[x]);
        }).join('\n'));
    }

    private initSandMap(): void {
        for (let y = 0; y < this.height; y++) {
            this.sandMap.push([]);
            for (let x = 0; x < this.width; x++) {
                this.sandMap[y].push(null);
            }
        }
    }

    private generateSand(): Sand {
        return new Sand(this.sandOrigin, new SandMoveStrategy());
    }

    private putSandOnMap(sand: Sand): void {
        this.sandMap[sand.coordinate[1]][sand.coordinate[0]] = sand;
    }

    // Returns sand if stays on map else return null
    private flowSand(sand: Sand): Sand | null {
        while(sand.isMoving) {
            const nextMovement = sand.getPossibleMovements().find((newPosition) => this.isTitlePassable(newPosition));
            if (!nextMovement) {
                sand.isMoving = false;
                continue;
            } else if (!this.isInsideMap(nextMovement)) {
                this.removeSandFromSands(sand);
                return null;
            }

           sand.isMoving = sand.coordinate[0] !== nextMovement[0] || sand.coordinate[1] !== nextMovement[1];
           sand.move(nextMovement);
        }
        return sand;
    }

    private isTitlePassable([x, y]: Coordinate): boolean {
        if (y >= this.height) return false
        if (x >= this.width || y >= this.height || y < 0 || x < 0) return true;
        const isRockTile = this.map[y][x].type === TileType.ROCK;
        const hasSand = !!this.sandMap[y][x];
        return !isRockTile && !hasSand;
    }

    private isInsideMap(coordinate: Coordinate): boolean {
        return (coordinate[0] >= 0 && coordinate[0] < this.width) && (coordinate[1] >= 0 && coordinate[1] < this.height);
    }

    private removeSandFromSands(sand: Sand): void {
        this.sands = this.sands.filter(s => s !== sand);
    }
}

class Sand implements Moveable {
    isMoving = true;

    constructor(public coordinate: Coordinate, private mover: MoveStrategy) {
    }

    getPossibleMovements(): Coordinate[] {
        return this.mover.getPossibleMovements(this.coordinate);
    }

    move(coordinate: Coordinate) {
        this.coordinate = [...coordinate];
    }
}

enum TileType {
    AIR = '.',
    ROCK = '#',
    SAND_SOURCE = '+',
    SAND = 'o'
}

interface Tile {
    coordinate: Coordinate;
    type: TileType;
}