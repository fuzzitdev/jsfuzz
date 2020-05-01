// const cp = require('child_process');
import {Corpus} from "./corpus";
import * as fs from "fs";
import {ChildProcess, fork} from "child_process";
import {ManageMessageType, WorkerMessage, WorkerMessageType} from "./protocol";
import {BuildVerse, Verse} from "./versifier";

const crypto = require('crypto');
const util = require('util');
const pidusage = require('pidusage');
process.on('SIGINT', function() {
    // ignore sigint as this propagates to worker as well.
    console.log('Received SIGINT. shutting down gracefully');
});


export class Fuzzer {
    private corpus: Corpus;
    private total_executions: number;
    private total_coverage: number;
    private exactArtifactPath: string;
    private rssLimitMb: number;
    private timeout: number;
    private target: string;
    private startTime: number | undefined;
    private worker: ChildProcess;
    private workerRss: number;
    private rssInterval: NodeJS.Timeout | null;
    private pulseInterval: NodeJS.Timeout | null;

    private lastSampleTime: number;
    private executionsInSample: number;
    private regression: boolean;
    private verse: Verse | null;
    private readonly versifier: boolean;
    private readonly onlyAscii: boolean;
    private lastNEWTime: number;

    constructor(target: string,
                dir: string[],
                exactArtifactPath: string,
                rssLimitMb: number,
                timeout: number,
                regression: boolean,
                onlyAscii: boolean,
                versifier: boolean) {
        this.target = target;
        this.corpus = new Corpus(dir, onlyAscii);
        this.onlyAscii = onlyAscii;
        this.versifier = versifier;
        this.verse = null;
        this.total_executions = 0;
        this.total_coverage = 0;
        this.exactArtifactPath = exactArtifactPath;
        this.rssLimitMb = rssLimitMb;
        this.timeout = timeout;
        this.regression = regression;
        this.worker = fork(`${__dirname}/worker.js`,
            [this.target],
            {execArgv: [`--max-old-space-size=${this.rssLimitMb}`]});
        this.workerRss = 0;
        this.rssInterval = null;
        this.pulseInterval = null;
        this.lastSampleTime = Date.now();
        this.executionsInSample = 0;
		this.lastNEWTime = Date.now();
    }

    logStats(type: string) {
        const rss = Math.trunc((process.memoryUsage().rss + this.workerRss) / 1024 / 1024 * 100) / 100;

        const endTime = Date.now();
        const execs_per_second = Math.trunc(this.executionsInSample / (endTime - this.lastSampleTime) * 1000);
        this.lastSampleTime = Date.now();
        this.executionsInSample = 0;
	const secs = Math.trunc((endTime - this.lastNEWTime) / 1000);
	const mins = Math.trunc( secs / 60  );
        const hours = Math.trunc( mins / 60  );

        console.log(`#${this.total_executions} ${type}  LastNEW: ${hours}:${mins % 60}:${secs % 60}    cov: ${this.total_coverage} corp: ${this.corpus.getLength()} exec/s: ${execs_per_second} rss: ${rss} MB`);
    }

    writeCrash(buf: Buffer) {
        let filepath = 'crash-' + crypto.createHash('sha256').update(buf).digest('hex');
        if (this.exactArtifactPath) {
            filepath = this.exactArtifactPath;
        }
        fs.writeFileSync(filepath, buf);
        console.log(`crash was written to ${filepath}`);
        if (buf.length < 200) {
            console.log(`crash(hex)=${buf.toString('hex')}`)
        }
    }

    clearIntervals() {
        if (this.rssInterval) {
            clearInterval(this.rssInterval);
            this.rssInterval = null;
        }
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
        pidusage.clear();
    }

    start() {
        console.log(`#0 READ units: ${this.corpus.getLength()}`);
        this.startTime = Date.now();

        this.lastSampleTime = Date.now();
        let executions = 0;
        let buf = this.corpus.generateInput();


        let startTimeOneSample = Date.now();
        this.worker.on('message', (m: WorkerMessage) => {
            this.total_executions++;
            this.executionsInSample++;
            const endTimeOneSample = Date.now();
            const diffOneSample = endTimeOneSample - startTimeOneSample;
            startTimeOneSample = endTimeOneSample;

            if (m.type === WorkerMessageType.CRASH) {
                this.writeCrash(buf);
                this.clearIntervals();
                return;
            } else if (m.coverage > this.total_coverage) {
                this.total_coverage = m.coverage;
                this.corpus.putBuffer(buf);
                this.logStats('NEW');
				this.lastNEWTime = Date.now();
                if (buf.length > 0 && this.versifier) {
                    this.verse = BuildVerse(this.verse, buf);
                }
            } else if ((diffOneSample/1000) > this.timeout) {
                    console.log("=================================================================");
                    console.log(`timeout reached. testcase took: ${diffOneSample}`);
                    this.worker.kill('SIGKILL');
                    return;
            }
            if (this.total_executions % 10 != 0 || this.verse === null || !this.versifier) {
                buf = this.corpus.generateInput();
            } else {
                buf = this.verse.Rhyme();
            }

            this.worker.send({
                type: ManageMessageType.WORK,
                buf: buf
            });
        });

        this.worker.on('error', (e: any) => {
            console.log('error received');
            console.log(e);
        });

        this.worker.on('exit', (code, signal) => {
            if (signal && code !== 0) {
                console.log('Worker killed');
                this.writeCrash(buf);
            }
            console.log('Worker exited');
            this.clearIntervals();
        });

        this.worker.send({
            type: ManageMessageType.WORK,
            buf: buf
        });

        this.pulseInterval = setInterval(() => {
            this.logStats("PULSE");
        }, 3000);

        this.rssInterval = setInterval(async () => {
            const stats = await pidusage(this.worker.pid);
            this.workerRss = stats.memory;
            if (this.workerRss > this.rssLimitMb * 1024 * 1024) {
                this.clearIntervals();
                console.log(`MEMORY OOM: exceeded ${this.rssLimitMb} MB. Killing worker`);
                this.worker.kill('SIGKILL');
            }

            const diffOneSample = Date.now() - startTimeOneSample;
            if ((diffOneSample/1000) > this.timeout) {
                console.log("=================================================================");
                console.log(`timeout reached. testcase took: ${diffOneSample}`);
                this.worker.kill('SIGKILL');
                return;
            }
        }, 3000);

    }
}

//
// process.once('SIGTERM', function (code) {
//     console.log('SIGTERM received...');
// });
