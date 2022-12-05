import * as path from 'path';
import * as yargs from 'yargs';
import * as solvers from './solutions';
import {getFileData} from './utils';

const PuzzlePaths = path.join(__dirname, 'src', 'static');
const SolversPath = path.join(__dirname, 'src', 'solutions');
const InputFormats = ['__DAY__-puzzle.txt', '__DAY__-example.txt', '__DAY__-test.txt']

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
    console.log(solvers[`_${day}`].default(input));
})
    .command('preparer', 'Prepare structure for the puzzle', yargs => {
            yargs.option('day', {
                alias: 'd',
                describe: 'Day of puzzle'
            })
                .demandOption('day', 'Please provide day of the puzzle to prepara')
        },
        argv => {
            console.log('Checking if structure already exists...')

        })
    .help()
    .argv