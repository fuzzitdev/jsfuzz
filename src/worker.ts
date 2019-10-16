import * as path from "path";
import {ManageMessageType, ManagerMessage, WorkerMessageType} from "./protocol";

const {createInstrumenter} = require('istanbul-lib-instrument');
const {hookRequire} = require('istanbul-lib-hook');

class Worker {
    private readonly fn: (buf: Buffer) => void;

    constructor(fn: (buf:Buffer) => void) {
        this.fn = fn;
    }

    getTotalCoverage() {
        let total = 0;
        // @ts-ignore
        for (const filePath in global["__coverage__"]) {
            // @ts-ignore
            for (const s in global["__coverage__"][filePath]['s']) {
                // @ts-ignore
                total += global["__coverage__"][filePath]['s'][s] ? 1 : 0;
            }
            // @ts-ignore
            for (const f in global["__coverage__"][filePath]['f']) {
                // @ts-ignore
                total += global["__coverage__"][filePath]['f'][f] ? 1 : 0;
            }
            // @ts-ignore
            for (const b in global["__coverage__"][filePath]['b']) {
                // @ts-ignore
                for (const i of global["__coverage__"][filePath]['b'][b]) {
                    total += i ? 1 : 0;
                }
            }
        }

        return total
    }


    start() {
        process.on('message', async (m: ManagerMessage) => {
            try {
                if (m.type === ManageMessageType.WORK) {
                    if (this.fn.constructor.name === 'AsyncFunction') {
                        // @ts-ignore
                        await this.fn(Buffer.from(m.buf.data));
                    } else {
                        // @ts-ignore
                        this.fn(Buffer.from(m.buf.data));
                    }

                    // @ts-ignore
                    process.send({
                        type: WorkerMessageType.RESULT,
                        coverage: this.getTotalCoverage()
                    })
                }
            } catch (e) {
                console.log("=================================================================");
                console.log(e);
                // @ts-ignore
                process.send({
                    type: WorkerMessageType.CRASH,
                });
                process.exit(1);
            }
        });
    }
}

const instrumenter = createInstrumenter({compact: true});
// @ts-ignore
hookRequire((filePath) => true, (code, {filename}) => {
    const newCode = instrumenter.instrumentSync(code, filename);
    return newCode;
});


// @ts-ignore
const fuzzTargetPath = path.join(process.cwd(), process.argv[2]);
const fuzzTargetFn = require(fuzzTargetPath).fuzz;
const worker = new Worker(fuzzTargetFn);
worker.start();

