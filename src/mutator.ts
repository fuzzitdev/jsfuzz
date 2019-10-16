import {uint32, uint16, uint8} from "./math";


const INTERESTING8 = new Uint8Array([-128, -1, 0, 1, 16, 32, 64, 100, 127]);
const INTERESTING16 = new Uint16Array([-32768, -129, 128, 255, 256, 512, 1000, 1024, 4096, 32767]);
const INTERESTING32 = new Uint32Array([-2147483648, -100663046, -32769, 32768, 65535, 65536, 100663045, 2147483647]);

export class Mutator {
    private maxInputSize: number;

    constructor() {
        this.maxInputSize = 4096
    }

    randBool() {
        return Math.random() >= 0.5;
    }

    rand(n: number) {
        return Math.floor(Math.random() * Math.floor(n));
    }

    exp2() {
        return Math.round(Math.log2(this.rand(2**32)));
    }

    chooseLen(n: number) {
        const x = this.rand(100);
        if (x < 90) {
            return this.rand(Math.min(8, n)) + 1
        } else if (x < 99) {
            return this.rand(Math.min(32, n)) + 1
        } else {
            return this.rand(n) + 1;
        }
    }

    mutate(buf: Buffer) {
        let res = Buffer.allocUnsafe(buf.length);
        buf.copy(res, 0, 0, buf.length);
        const nm = 1 + this.exp2();
        for (let i=0; i<nm; i++) {
            const x = this.rand(14);
            if ( x ===0 ) {
                // Remove a range of bytes.
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const pos0 = this.rand(res.length);
                const pos1 = pos0 + this.chooseLen(res.length - pos0);
                res.copy(res, pos0, pos1, res.length);
                res = res.slice(0, res.length - (pos1 - pos0));

            } else if (x === 1) {
                // Insert a range of random bytes.
                const pos = this.rand(res.length + 1);
                const n = this.chooseLen(10);
                res = Buffer.concat([res, Buffer.alloc(n, 0)], res.length + n)
                res.copy(res, pos + n, pos);
                for (let k = 0; k < n; k++) {
                    res[pos + k] = this.rand(256)
                }
            } else if (x === 2) {
                // Duplicate a range of bytes.
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const src = this.rand(res.length);
                let dst = this.rand(res.length);
                while (src === dst) {
                    dst = this.rand(res.length);
                }
                const n = this.chooseLen(res.length - src);
                const tmp = Buffer.alloc(n, 0);
                res.copy(tmp, 0, src);
                res = Buffer.concat([res, Buffer.alloc(n, 0)]);
                res.copy(res, dst+n, dst);
                for (let k=0; k<n; k++) {
                    res[dst+k] = tmp[k]
                }
            } else if (x === 3) {
                // Copy a range of bytes.
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const src = this.rand(res.length);
                let dst = this.rand(res.length);
                while (src === dst) {
                    dst = this.rand(res.length);
                }
                const n = this.chooseLen(res.length - src);
                res.copy(res, dst, src, src+n);
            } else if (x === 4) {
                // Bit flip. Spooky!
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const pos = this.rand(res.length);
                res[pos] ^= 1 << this.rand(8);
            } else if (x === 5) {
                // Set a byte to a random value.
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const pos = this.rand(res.length);
                res[pos] ^=  this.rand(255) + 1;
            } else if (x === 6) {
                // Swap 2 bytes.
                if (res.length <= 1) {
                    i--;
                    continue
                }
                const src = this.rand(res.length);
                let dst = this.rand(res.length);
                while (src === dst) {
                    dst = this.rand(res.length);
                }
                [res[src], res[dst]] = [res[dst], res[src]]
            } else if (x === 7) {
                // Add/subtract from a byte.
                if (res.length === 0) {
                    i--;
                    continue
                }
                const pos = this.rand(res.length);
                const v = this.rand(35) + 1;
                if (this.randBool()) {
                    res[pos] += v;
                } else {
                    res[pos] -= v;
                }
            } else if (x === 8) {
                // Add/subtract from a uint16.
                if (res.length < 2) {
                    i--;
                    continue
                }
                const pos = this.rand(res.length - 1);
                let v = this.rand(35) + 1;
                if (this.randBool()) {
                    v = 0 - v;
                }
                if (this.randBool()) {
                    res.writeUInt16BE(uint16(res.readUInt16BE(pos) + v), pos)
                } else {
                    res.writeUInt16LE(uint16(res.readUInt16LE(pos) + v), pos)
                }
            } else if (x === 9) {
                // Add/subtract from a uint16.
                if (res.length < 4) {
                    i--;
                    continue
                }
                const pos = this.rand(res.length - 3);
                let v = this.rand(35) + 1;
                if (this.randBool()) {
                    v = 0 - v;
                }
                if (this.randBool()) {
                    res.writeUInt32BE(uint32(res.readUInt32BE(pos) + v), pos)
                } else {
                    res.writeUInt32LE(uint32(res.readUInt32LE(pos) + v), pos)
                }
            } else if (x === 10) {
                // Replace a byte with an interesting value.
                if (res.length === 0) {
                    i--;
                    continue;
                }
                const pos = this.rand(res.length);
                res[pos] = INTERESTING8[this.rand(INTERESTING8.length)];
            } else if (x === 11) {
                // Replace an uint16 with an interesting value.
                if (res.length < 2) {
                    i--;
                    continue;
                }
                const pos = this.rand(res.length - 1);
                if (this.randBool()) {
                    res.writeUInt16BE(INTERESTING16[this.rand(INTERESTING8.length)], pos);
                } else {
                    res.writeUInt16LE(INTERESTING16[this.rand(INTERESTING8.length)], pos);
                }
            } else if (x === 12) {
                // Replace an uint32 with an interesting value.
                if (res.length < 4) {
                    i--;
                    continue;
                }
                const pos = this.rand(res.length - 3);
                if (this.randBool()) {
                    res.writeUInt32BE(INTERESTING32[this.rand(INTERESTING8.length)], pos);
                } else {
                    res.writeUInt32LE(INTERESTING32[this.rand(INTERESTING8.length)], pos);
                }
            } else if (x === 13) {
                // Replace an ascii digit with another digit.
                const digits = [];
                for (let k=0; k<res.length; k++) {
                    if (res[k] >= 48 && res[k] <= 57) {
                        digits.push(k)
                    }
                }
                if (digits.length === 0) {
                    i--;
                    continue;
                }
                const pos = this.rand(digits.length);
                const was = res[digits[pos]];
                let now = was;
                while (now === was) {
                    now = this.rand(10) + 48 // '0' === 48
                }
                res[digits[pos]] = now
            }
        }
        if (res.length > this.maxInputSize) {
            res = res.slice(0, this.maxInputSize)
        }
        return res;
    }
}
