import * as path from 'path';
import * as yargs from 'yargs';
import * as solvers from './solutions';
import {getFileData} from './utils';

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
.help()
.argv