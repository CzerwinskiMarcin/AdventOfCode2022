import * as path from 'path';
import * as yargs from 'yargs';
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
            choices: ['puzzle', 'example'],
        })
        .demandOption('day', 'Please provide day of the puzzle to solve')
}, argv => {
    const {day, type} = argv;
    const input = getFileData(path.resolve(__dirname, 'static', `${day}-${type}.txt`));
    console.log(path.resolve(__dirname, 'solutions', '2', 'index'));
    import(`./solutions/2/index`)
        .then(module => {
            console.log(module.default(input));
        });
})
.help()
.argv