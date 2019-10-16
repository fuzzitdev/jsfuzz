import {Mutator} from "./mutator";
import * as fs from "fs";
import * as path from "path";
var crypto = require('crypto');

export class Corpus {
    private inputs: Buffer[];
    private mutator: Mutator;
    private seedPath: string | undefined;
    private corpusPath: string | undefined;

    constructor(dir: string[]) {
        this.inputs = [];
        this.mutator = new Mutator();
        for (let i of dir) {
            if (fs.lstatSync(i).isDirectory()) {
                if (!this.corpusPath) {
                    this.corpusPath = i;
                }
                this.loadFiles(i)
            } else {
                this.inputs.push(fs.readFileSync(i));
            }
        }

    }

    loadFiles(dir: string) {
        fs.readdirSync(dir).forEach(file => {
            const full_path = path.join(dir, file);
            this.inputs.push(fs.readFileSync(full_path))
        });
    }

    getLength() {
        return this.inputs.length;
    }

    generateInput() {
        if (this.inputs.length === 0) {
            return this.mutator.mutate(Buffer.alloc(1, 0))
        }
        const buffer = this.inputs[this.mutator.rand(this.inputs.length)];
        return this.mutator.mutate(buffer);
    }

    putBuffer(buf: Buffer) {
        this.inputs.push(buf);
        if (this.corpusPath) {
            const filename = crypto.createHash('sha256').update(buf).digest('hex');
            const filepath = path.join(this.corpusPath, filename);
            fs.writeFileSync(filepath, buf)
        }
    }
}

