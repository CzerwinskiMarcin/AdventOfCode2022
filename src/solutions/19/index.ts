import {stringToArray} from "../../utils";

enum Material {
	ORE = 'ORE',
	CLAY = 'CLAY',
	OBSIDIAN = 'OBSIDIAN',
}

enum RobotType {
	ORE = 'ORE',
	CLAY = 'CLAY',
	OBSIDIAN = 'OBSIDIAN',
	GEODE = 'GEODE'
}

type Robot = {
	type: RobotType;
}

type MaterialQuantity = {
	[key in Material]: number
}

type MaterialCost = {
	[key in Material]: number
}

type Scheme = {
	[key in RobotType]: MaterialCost;
}

type Factory = {
	id: number;
	scheme: Scheme;
	robots: Robot[];
	constructionQueue: Robot[];
	stockPiles: Partial<MaterialQuantity>;
}

type Node<T> = {
	id: number;
	parent: Node<T>;
	children: Node<T>[];
	data: T;
}

const MAX_TIME = 24;

export default function (input: string): { first: any, second: any } {
	const factories: Factory[] = parseFactories(input)
	populateFactoriesWithInitialRobots(factories, [{type: RobotType.ORE}]);
	const factoryProductions = runFactory(factories[0]);
	const lastChildren = []
	let toCheck = [factoryProductions];
	do {
	    lastChildren.push(...toCheck.filter(f => f.children.length === 0));
	    toCheck = toCheck.filter(f => !!f.children.length).map(f => f.children).reduce((acc, curr) => [...acc, ...curr], []);
	} while (!!toCheck.length)

	console.log('Number of last children:', lastChildren.length);
	return {first: null, second: null};
}

const parseFactories = (input: string): Factory[] => {
	return stringToArray(input)
		.map((row: string) => {
		    const [rawId, ...rawSchemes] = row
				.split(/[:.]/g)
				.filter(chunk => !!chunk)
				.map(chunk => {
					return chunk
						.replace(/\sEach\s/g, '')
						.replace(/\srobot\scosts\s|\sand\s/g, ',')
						.split(',');
				});
			const id = +rawId[0].replace(/[a-zA-Z]/g, '');
			let scheme = {}

			// let scheme: Scheme = {};
			rawSchemes.map(([rawRobotType, ...rawMaterials]) => {
				const robotType = RobotType[rawRobotType.toUpperCase()];
				let materialCost = {};
			    rawMaterials.map(rawMaterial => {
			        const [quantity, rawMaterialType] = rawMaterial.split(' ');
					materialCost = {...materialCost, [Material[rawMaterialType.toUpperCase()]]: +quantity};
				})
                scheme = {...scheme, [robotType]: materialCost};
			});

			return {
			    id,
				scheme,
				robots: [],
				constructionQueue: [],
				stockPiles: {
			        [Material.ORE]: 0,
			    	[Material.CLAY]: 0,
			    	[Material.OBSIDIAN]: 0
				}
			} as Factory
		});
}

const populateFactoriesWithInitialRobots = (factories: Factory[], robots: Robot[]): void => {
    factories.forEach(factory => factory.robots.push(...robots));
}

const cloneFactory = (factory: Factory): Factory => {
	return {
		id: Math.floor(Math.random() * 10_000_000),
        constructionQueue: [...factory.constructionQueue],
		stockPiles: {...factory.stockPiles},
		robots: [...factory.robots],
		scheme: factory.scheme
	}
}

let lastChildrenCount = 0;

const runFactory = (factory: Factory, timer: number = MAX_TIME, parentNode?: Node<Factory>): Node<Factory> => {
	const factoryNode: Node<Factory> = {
		id: Math.floor(Math.random() * 10_000_00),
		data: factory,
	    parent: parentNode,
		children: []
	};

	if (!!timer) {
	    const possibleFactoryStates: Factory[] = [cloneFactory(factory)];

		// Do production
		const possibleProductions = getPossibleProductions(factory);
	    possibleProductions.forEach(production => {
	        const clonedFactory = cloneFactory(factory);
	        queueProduction(clonedFactory, production);
	        possibleFactoryStates.push(clonedFactory);
		});

        // Do collection
		const collectedMaterials = getCollection(factory.robots);
		possibleFactoryStates.forEach(f => Object.entries(collectedMaterials).forEach(([material, quantity]) => f.stockPiles[material] += quantity));

		// Finish production
		possibleFactoryStates.forEach(f => f.robots.push(...f.constructionQueue));
		factoryNode.children = possibleFactoryStates.map(f => runFactory(f, timer - 1, factoryNode));
	} else {
		lastChildrenCount++;
		console.log(lastChildrenCount);
	}

	return factoryNode;
}

const getCollection = (robots: Robot[]): Partial<MaterialQuantity> => {
	let materialQuantity: Partial<MaterialQuantity> = {};
	robots.forEach(robot => materialQuantity[robot.type] = 1);
	return materialQuantity;
}

const getPossibleProductions = (factory: Factory): Robot[] => {
    const possibleProductions: Robot[] = []

    const stockpile = factory.stockPiles;
	Object.entries(factory.scheme).forEach(([robotType, materials]) => {
	    let factoryHasAllMaterials = Object.entries(materials).every(([material, quantity]) => stockpile[material] >= quantity);
	    if (factoryHasAllMaterials) possibleProductions.push({type: RobotType[robotType]});
	});
    return possibleProductions
}

const queueProduction = (factory: Factory, robot: Robot): void => {
    const materialCost = factory.scheme[robot.type];
    Object.entries(materialCost).forEach(([material, quantity]) => factory.stockPiles[material] -= quantity);
    factory.constructionQueue.push(robot);
}