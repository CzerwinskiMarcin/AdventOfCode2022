import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as solvers from './solutions';
import {getFileData} from './utils';
import metaData from './structure.json';
import * as Winston from "winston";

const createLogger = (day: string): Winston.Logger => {
    return Winston.createLogger({
        level: 'info',
        format: Winston.format.json(),
        transports: [
            new Winston.transports.File({filename: `errors.log`, level: 'error'}),
            new Winston.transports.File({filename: `combined.log`}),
        ]
    });
}

const createInputFiles = (day: string, data: any): void => {
    const logger = createLogger(day);
    logger.log({
        level: 'info',
        message: 'Preparing input files'
    });
    const inputFilePath = path.join(__dirname, ...data.inputFilePath);
    const devInputFilePath = path.join(__dirname, '..', ...data.inputFilePath);
    data.inputFileSuffixes
        .forEach((suffix: string): void => {
            const specificPuzzleInputFilePath = path.join(inputFilePath, `${day}-${suffix}.txt`);
            const specificDevPuzzleInputFilePath = path.join(devInputFilePath, `${day}-${suffix}.txt`);
            try {
                fs.readFileSync(specificPuzzleInputFilePath);
                logger.log({
                    level: 'info',
                    message: `Input file '${specificPuzzleInputFilePath}' already exists...`
                });
            } catch (e) {
                logger.log({
                    level: 'info',
                    message: `Input file '${specificPuzzleInputFilePath} doesn't exist. Creating....`
                });
                fs.writeFileSync(specificPuzzleInputFilePath, '');
            }

            try {
                fs.readFileSync(specificDevPuzzleInputFilePath);
                logger.log({
                    level: 'info',
                    message: `Input dev file '${specificDevPuzzleInputFilePath}' already exists...`
                });
            } catch (e) {
                logger.log({
                    level: 'info',
                    message: `Input dev file '${specificDevPuzzleInputFilePath} doesn't exist. Creating....`
                });
                fs.writeFileSync(specificDevPuzzleInputFilePath, '');
            }
        });
}

const createSolver = (day: string, data: any): void => {
    const logger = createLogger(day);
    logger.log({
        level: 'info',
        message: 'Preparing solver...'
    });
    const solverDirPath = path.join(__dirname, '..', 'src', ...data.solverDirPath).replace(data.solverDayMarker, `${day}`);
    const solverFilePath = path.join(__dirname, '..', 'src', ...data.solverFilePath).replace(data.solverDayMarker, `${day}`);
    const generalFilePath = path.join(__dirname, '..', 'src', ...data.solverGeneralExportPath).replace(data.solverDayMarker, `${day}`);

    console.log(solverDirPath, solverFilePath, generalFilePath);

    if (!fs.existsSync(solverDirPath)) {
        logger.log({
            level: 'info',
            message: `Adding new solver for day ${day}...`
        });
        fs.mkdirSync(solverDirPath);
        fs.writeFileSync(solverFilePath, data.solverTemplate);
        fs.appendFileSync(generalFilePath, data.solverGeneralExport.replace(new RegExp(data.solverDayMarker, 'gm'), day));
    }
}

yargs.version('1.1.0');
yargs.command('solver', 'Solve AoC 2022', yargs => {
    yargs.option('day', {
        alias: 'd',
        describe: 'Day of puzzle'
    })
        .option('type', {
            alias: 't',
            default: 'example',
            choices: ['puzzle', 'example', 'test'],
        })
        .demandOption('day', 'Please provide day of the puzzle to solve')
}, argv => {
    const {day, type} = argv;
    const input = getFileData(path.resolve(__dirname, 'static', `${day}-${type}.txt`));
    const logger = createLogger(`${day}`);
    console.log(solvers[`_${day}`].default(input, logger));
})
    .command('preparer', 'Prepare structure for the puzzle', yargs => {
            yargs.option('day', {
                alias: 'd',
                describe: 'Day of puzzle'
            })
                .demandOption('day', 'Please provide day of the puzzle to prepara')
        },
        argv => {
            createInputFiles(argv.d as string, metaData);
            createSolver(argv.d as string, metaData);
        })
    .help()
    .argv

