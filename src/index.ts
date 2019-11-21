#!/usr/bin/env node
import {Fuzzer} from './fuzzer';
import yargs from 'yargs';

function startFuzzer(argv: any) {
    const fuzzer = new Fuzzer(
        argv.target,
        argv.dir,
        argv.exactArtifactPath,
        argv.rssLimitMb,
        argv.timeout,
        argv.regression,
        argv.onlyAscii,
        argv.versifier);
    fuzzer.start()
}

require('yargs')
    .scriptName("jsfuzz")
    .command('$0 <target> [dir..]', 'start the fuzzer', (yargs: any) => {
        yargs.positional('target', {
            describe: 'Path to file containing the fuzz target function',
            type: 'string'
        });
        yargs.positional('dir', {
            describe: `Pass zero or more corpus directories as command line arguments. The fuzzer will read test inputs from each of these corpus directories, and any new test inputs that are generated will be written back to the first corpus directory. single files can be passed as well and will be used as seed files`,
            type: 'string'
        });
    }, (argv: any) => startFuzzer(argv))
    .option('regression', {
        type: 'boolean',
        description: 'run the fuzzer through set of files for regression or reproduction',
        default: false
    })
    .option('exact-artifact-path', {
        type: 'string',
        description: 'set exact artifact path for crashes/ooms'
    })
    .option('rss-limit-mb', {
        type: 'number',
        description: 'Memory usage in MB',
        default: 2048,
    })
    .option('timeout', {
        type: 'number',
        description: 'If input takes longer then this timeout (in seconds) the process is treated as failure case',
        default: 30,
    })
    .option('worker', {
        type: 'boolean',
        description: 'run fuzzing worker',
        default: false,
        hidden: true
    })
    .option('versifier', {
        type: 'boolean',
        description: 'use versifier algorithm (good for text based protocols)',
        default: true,
    })
    .option('only-ascii', {
        type: 'boolean',
        description: 'generate only ASCII (isprint+isspace) inputs',
        default: false,
    })
    .help()
    .argv;