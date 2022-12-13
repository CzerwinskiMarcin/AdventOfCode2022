import {stringToArray} from "../../utils";

type Coordinate = [number, number]; // x, y

class Node {
    id: number;
    coordinate: Coordinate;
    height: number = Infinity;
    gCost: number = Infinity;                  // Cost of going from start
    hCost: number = Infinity;                  // Cost of going to target
    fCost: number = Infinity;                  // Sum of h and g costs
    parentNodeId: number | null

    constructor(id: number, coordinate: Coordinate, parentNodeId: number | null, height: number) {
        this.id = id;
        this.parentNodeId = parentNodeId;
        this.coordinate = coordinate;
        this.height = height;
    }

    updateNodeCosts(node: Node | null, end: Coordinate): Node {
        // Start point
        if (!node) {
            this.gCost = 0;
            this.hCost = 0;
            this.fCost = 0;
        } else {
            this.gCost = this.calculateGCost(node);
            this.hCost = this.calculateHCost(end);
            this.fCost = this.gCost + this.hCost;
            this.parentNodeId = node.id;
        }
        return this;
    }

    calculateGCost(node: Node): number {
        return node.gCost + Math.abs(this.coordinate[0] - node.coordinate[0]) + Math.abs(this.coordinate[1] - node.coordinate[1]);
    }

    calculateHCost(end: Coordinate): number {
        const heightDiff = Math.abs(end[0] - this.coordinate[0]);
        const widthDiff = Math.abs(end[1] - this.coordinate[1]);

        return  Math.sqrt(Math.pow(heightDiff, 2) + Math.pow(widthDiff, 2));
    }

    calculateFCost(node: Node, end: Coordinate): number {
        const gCost = this.calculateGCost(node);
        const hCost = this.calculateHCost(end);
        return gCost + hCost;
    }
}

export default function (input: string): { first: any, second: any } {
    // First part
    const map = getMap(input);
    const {start, end} = findStartAndEndCoordinates(map);
    const pathNode = findPath(map, start, end);

    // Second part
    const startPoints = findFieldsInMap(map, 1);
    const pathsLengths = [start, ...startPoints]
        .map((s, i) => {
            console.log(`Testing ${i}/${startPoints.length}`);
            return findPath(map, s, end).length - 1;
        }).sort((a, b) => b - a).filter(l => !!l);
	return {first: pathNode.length - 1, second: pathsLengths.pop()};
}

const START_POINT_VALUE = 0;
const END_POINT_VALUE = 'z'.charCodeAt(0) - 'a'.charCodeAt(0) + 2;

const getMap = (input: string): number[][] => {
    const rows = stringToArray(input);
    return rows.map(row => row.split('').map(sign => {
        if (sign === 'S') return START_POINT_VALUE;
        else if (sign === 'E') return END_POINT_VALUE;
        else return sign.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    }));
}

const findStartAndEndCoordinates = (map: number[][]): {start: [number, number], end: [number, number]} => {
    let start: [number, number] = findFieldsInMap(map, START_POINT_VALUE)[0];
    let end: [number, number] = findFieldsInMap(map, END_POINT_VALUE)[0];
    return {start, end};
}

const findFieldsInMap = (map: number[][], targetValue: number): [number, number][] => {
    let coordinates: [number, number][] = [];
    map.forEach((row, y) => {
        const width = row.length;
        row.forEach((fieldValue, x) => {
            if (fieldValue === targetValue) coordinates.push([x, y])
        });
    });
    return coordinates;
}

const findPath = (map: number[][], start: [number, number], end: [number, number]): Node[] => {
    let openSet: Node[] = [];
    const closedSet: Node[] = [];
    const isNodeInClosedSet = isNodeInSet(closedSet);
    const isNodeInOpenSet = isNodeInSet(openSet);
    const mapWidth = map[0].length;

    const startNode = new Node(start[0] + start[1] * mapWidth, start, null, map[start[1]][start[0]]);
    let endNode: Node;
    startNode.updateNodeCosts(null,  end);
    openSet.push(startNode);

    while (!endNode) {
        openSet = openSet.sort((setA, setB) => setB.fCost - setA.fCost)
        const current = openSet.pop();
        closedSet.push(current);

        if (!current) {
            break;
        }

        if (current.height === END_POINT_VALUE) {
            endNode = current;
            continue;
        }

        const neighbourhoodNodes = getNeighbourNodes(current, map)
            .filter(node => {
                return (!isNodeInClosedSet(node) && canGoBetweenNodes(current, node)) && (node.calculateFCost(current, end) < node.fCost || !isNodeInOpenSet(node))
            })
            .map(node => node.updateNodeCosts(current, end));

        neighbourhoodNodes.forEach(node => {
            if (!isNodeInOpenSet(node)) openSet.push(node);
        })
    }

    if (!endNode) return [];

    return getPathFromEndNote(endNode, closedSet);
}

const getNeighbourNodes = (node: Node, map: number[][]): Node[] => {
    const height = map.length;
    const width = map[0].length;
    const nodes: Node[] = [];
    const neighbourhoodRelativePositions = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    neighbourhoodRelativePositions.forEach(([x, y]) => {
        const [originX, originY] = node.coordinate;
        const relativeX = originX + x;
        const relativeY = originY + y;

        // In the map
        if (!(relativeY < 0 || relativeY >= height || relativeX < 0 || relativeX >= width)) {
            const id = relativeX + relativeY * width;
            nodes.push(new Node(id, [relativeX, relativeY], node.id, map[relativeY][relativeX]));
        }
    });
    return nodes;
}

const canGoBetweenNodes = (from: Node, to: Node): boolean => {
    return to.height - from.height <= 1;
}

const isNodeInSet = (set: Node[]) => (node: Node): boolean => {
    return set.some(n => n.id === node.id);
}

const getPathFromEndNote = (end: Node, set: Node[]): Node[] => {
    let current = end
    const path: Node[] = [end];
    let hasStartNodeFound = false;

    while (!hasStartNodeFound) {
        const next = set.find(n => n.id === current.parentNodeId);
        path.push(next);

        if (next.parentNodeId === null) hasStartNodeFound = true;
        current = next;
    }

    return path;
}
