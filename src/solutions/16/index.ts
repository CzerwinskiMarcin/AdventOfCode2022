import {stringToArray} from "../../utils";

const tmpConsoleLog = console.log;

type Node<T> = {
    name: string;
    connectedNodes: {
        node: Node<T>;
        distance: number;
    }[];
    connectedTo: string[];
    distances: {
        pipeName: string;
        distance: number;
        visited: boolean;
    }[];
    data: T;
}

type Pipe = {
    state: boolean // True for open, false -> close
    flowRate: number;
    calculatedFlow: number; // Contains time * flowRate upon opening
}

export default function (input: string): { first: any, second: any } {
    const pipeNodes = formatInput(input);
    calculateDistances(pipeNodes);
    calculateMaxPressureToRelease(pipeNodes, true)
	return {first: null, second: null};
}

const calculateMaxPressureToRelease = (pipeNodes: Node<Pipe>[], debug: boolean = false): void => {
    setDebug(debug);
    let currentPipeNode = pipeNodes[0];
    let remainingTime = 30;
    let valveFlowRateMap: [string, number][] = pipeNodes.map(({name, data: {flowRate}}) => [name, flowRate]);
    let totalPressureReleased = 0;
    let openedPipes: string[] = [];
    console.log('Test of valve flow rate', valveFlowRateMap);
    while (remainingTime > 0) {
        const pipesToSearch = pipeNodes.filter(node => node.name !== currentPipeNode.name && !openedPipes.includes(node.name));
        const [pipeName, pressureReleased, timeElapsed] = findBestPipeForReleasingPressureInTime(currentPipeNode, pipesToSearch, remainingTime, false);
        setDebug(true);
        console.log('Opened pipe:', pipeName);
        console.log('Pressure released from vale:', pressureReleased);
        console.log('Time elapsed', timeElapsed);
        remainingTime = Math.max(0, remainingTime - timeElapsed);
        console.log('Remained time', remainingTime);
        totalPressureReleased += pressureReleased;
        console.log('Total pressure released:', totalPressureReleased);

        if (!!pipeName) {
            currentPipeNode = pipeNodes.find(node => node.name === pipeName);
            openedPipes.push(currentPipeNode.name);
            console.log('Next current pipe:', currentPipeNode.name);
        }

        valveFlowRateMap = valveFlowRateMap.filter(([name]) => name !== pipeName);

        console.log('================\n');
    }
}

const findBestPipeForReleasingPressureInTime = (from: Node<Pipe>, pipeNodes: Node<Pipe>[], timeRemaining: number, debug: boolean = false): [string, number, number] => { // Pipe name, number, time plus open
    setDebug(debug);
    return pipeNodes
        .reduce((acc, curr) => {
            const distanceData = from.distances.find(dist => dist.pipeName === curr.name);

            // We have too little time to go there and open valve
            if (distanceData.distance - 1 > timeRemaining) return acc;
            // Bias for distance
            // const bias  = -((distanceData.distance + 1) * 10)
            const bias = 0;
            const pressureToReleaseToEndOfTime = curr.data.flowRate * (timeRemaining - distanceData.distance - 1);
            console.log(`\tDistance from ${from.name} to ${curr.name}: ${distanceData.distance}`);
            console.log('\tTime spent on action', distanceData.distance + 1);
            console.log('\tRemaining time after action', timeRemaining - distanceData.distance - 1);
            console.log('\tFlow rate:', curr.data.flowRate);
            console.log('\tPressure to release: ', pressureToReleaseToEndOfTime);
            console.log('\tBias', bias);
            console.log('\tCurrent maxPressure data', acc);
            console.log('\t**************************\n');
            return acc[1] < pressureToReleaseToEndOfTime + bias ? [curr.name, pressureToReleaseToEndOfTime, distanceData.distance + 1] : acc;
        }, ['', 0, 1]);
}

const calculateDistances = (pipeNodes: Node<Pipe>[], debug: boolean = false): void => {
    const pipeNames = pipeNodes.map(pipe => pipe.name);
    pipeNodes.forEach(pipeNode => {
        const unvisitedNodes = [...pipeNames].filter(name => name !== pipeNode.name);
        pipeNode.distances = unvisitedNodes.map((nodeName) => ({pipeName: nodeName, distance: Infinity, visited: false}));
        calculateDistanceForNode(pipeNode, pipeNodes, unvisitedNodes, debug);
    });
}

const calculateDistanceForNode = (originNode: Node<Pipe>, nodes: Node<Pipe>[], _unvisitedNodes: string[], debug: boolean = false): void => {
    setDebug(debug);
    let unvisitedNodes = [..._unvisitedNodes];
    let iteration = 0;
    while (!!unvisitedNodes.length) {
        console.log('Unvisited nodes', unvisitedNodes.join(', '));
        let currentPath = [originNode.name];
        let nodesToCalculateDistance = [...originNode.connectedNodes];
        currentPath.push(...nodesToCalculateDistance.map(n => n.node.name));
        console.log('Current path', currentPath.join(', '));
        console.log('Nodes to calculate distance:', nodesToCalculateDistance.map(({node: {name}}) => name));
        let alreadyVisitedNodes = nodesToCalculateDistance.filter(data => !unvisitedNodes.find(visitedNodeName => visitedNodeName === data.node.name));
        let nestedIteration = 0;
        while (!!alreadyVisitedNodes.length) {
            console.log('\tAlready visited nodes:', alreadyVisitedNodes.map(({node: {name}}) => name));
            alreadyVisitedNodes.forEach(({node, distance}) => {
                currentPath.push(node.name);
                node.connectedNodes
                    .filter(({node: n}) => {
                        const isOriginNode = originNode.name === n.name
                        const isVisited = isOriginNode ? true : originNode.distances.find(({pipeName}) => n.name === pipeName).visited;
                        const alreadyInCalculateDistanceArray = nodesToCalculateDistance.some(({node: dist}) => dist.name === n.name);
                        const onPath = currentPath.includes(n.name);
                        console.log('\t\tFiltering node;', n.name);
                        console.log('\t\tIs origin node', isOriginNode);
                        console.log('\t\tAlready visited', isVisited);
                        console.log('\t\tWas on current path:', onPath);
                        console.log('\t\tAlready in nodesToCalculateDistance', alreadyInCalculateDistanceArray);
                        return (!isOriginNode || !isVisited) && !alreadyInCalculateDistanceArray && !onPath;
                    })
                    .forEach(n => {
                        console.log(`\t\tAdding node to nodesToCalculateDistance`, n.node.name);
                        nodesToCalculateDistance.push({node: n.node, distance: n.distance + distance});
                        currentPath.push(n.node.name);
                    })

                console.log(`\t\tRemoving node [${node.name}] from nodesToCalculate`, nodesToCalculateDistance.map(({node: {name}})=> name));
                nodesToCalculateDistance = nodesToCalculateDistance.filter(target => node.name !== target.node.name);
                console.log('\t\tRemoved node from nodesToCalculate', nodesToCalculateDistance.map(({node: {name}})=> name));
            });

            console.log('\tUpdating already visited nodes...');
            alreadyVisitedNodes = nodesToCalculateDistance.filter(data => !unvisitedNodes.find(visitedNodeName => visitedNodeName === data.node.name))
            console.log('\tUpdated already visited nodes', alreadyVisitedNodes.map(({node: {name}}) => name));
            nestedIteration++;
            console.log('\t**************\n');
        }

        console.log('Nodes to calculate: ', nodesToCalculateDistance.map(({node, distance}) => `${node.name} [${distance}]`));
        console.log('Sorting by distance...');
        nodesToCalculateDistance.sort((a, b) => a.distance - b.distance);
        console.log('Sorted');

        console.log('Updating distances to nodes')
        nodesToCalculateDistance.forEach(n => {
            const savedDistance = originNode.distances.find(dist => dist.pipeName === n.node.name);
            savedDistance.distance = n.distance < savedDistance.distance ? n.distance : savedDistance.distance;
        });


        console.log('Getting closed node...');
        const closest = nodesToCalculateDistance[0];
        console.log('Closest one:', closest.node.name);

        console.log('Setting node in distance to visited...');
        originNode.distances.find(dist => dist.pipeName === closest.node.name).visited = true;

        console.log(`Removing closed one [${closest.node.name}] from unvisited...`);
        unvisitedNodes = unvisitedNodes.filter(name => name !== closest.node.name);
        console.log('Removed');
        console.log('====================================\n');
        iteration++;
    }
}

const formatInput = (input: string): Node<Pipe>[] => {
    const formattedData: Node<Pipe>[] = stringToArray(input).map(pipeNode => {
        const [rawPipeData, rawConnectedTo] = pipeNode.split(';');
        const pipeName = getPipeNameFromRawData(rawPipeData);
        const flowRate = getPipeFlowRateFromRawData(rawPipeData);
        const connectedPipeNames = getConnectedPipeNamesFromRawData(rawConnectedTo);
        return {name: pipeName, connectedNodes: [], data: {state: false, flowRate, calculatedFlow: 0}, connectedTo: connectedPipeNames, distances: []};
    })

    formattedData.forEach(pipeNode => {
        pipeNode.connectedTo.forEach(pipeName => {
            const node = formattedData.find(pipe => pipe.name === pipeName);
            pipeNode.connectedNodes.push({
                node,
                distance: 1
            });
        });
        pipeNode.connectedTo.length = 0;
    });
    return formattedData;
}

const getPipeNameFromRawData = (data: string): string => {
    return data.split(' ')[1];
}

const getPipeFlowRateFromRawData = (data: string): number => {
    return +data.replace(/[a-zA-Z=\s]/g, '');
}

const getConnectedPipeNamesFromRawData = (data: string): string[] => {
    return data.replace(/[a-z\s]/g, '').split(',');
}

const setDebug = (debug: boolean): void => {
    console.log = debug ? tmpConsoleLog : () => {};
}