// This is ported from go-fuzz versifier
import * as assert from "assert";

const DeepEqual = require('deep-equal');

const CHAR_CODE_A = 65;
const CHAR_CODE_Z = 90;
const CHAR_CODE_a = 97;
const CHAR_CODE_z = 122;
const CHAR_CODE__ = 95;
const CHAR_CODE_0 = 48;
const CHAR_CODE_9 = 57;
const CHAR_CODE_SPACE = 32;
const CHAR_CODE_TAB = 9;
const CHAR_CODE_MINUS = 45;
const CHAR_CODE_DOT = 46;
const CHAR_CODE_NEWLINE = 10;
const CHAR_CODE_WIN_NEWLINE = 13;

interface Node {
    Visit : any,
    Generate: (w: DynamicBuffer, v: Verse) => void,
}

interface Elem {
    tok: {number: boolean},
    done: boolean,
    pos: number,
    inc: number
}

interface Brk {
    open: number,
    clos: number,
    pos: number,
}

class DynamicBuffer {
    private len: number;
    private buffer: Buffer;
    private offset: number;
    constructor(len?: number) {
        this.len = len ? len : 1024;
        this.buffer = Buffer.alloc(this.len);
        this.offset = 0;
    }

    Write(p: Buffer) {
        if (this.offset + p.length > this.len) {
            this.buffer = Buffer.concat([this.buffer, Buffer.alloc(this.len)]);
            this.len = this.len * 2;
        }
        p.copy(this.buffer, this.offset);
        this.offset += p.length;
    }

    Bytes(): Buffer {
        return this.buffer.slice(0, this.offset);
    }
}

function makeDict(s : Buffer): {string: {}} {
    // @ts-ignore
    let res : {string: {}} = {};
    // @ts-ignore
    res[s.toString()] = {};
    return res;
}

function randTerm(v: Verse, dict: {string: {}}): Buffer {
    const terms = Object.keys(dict);
    return Buffer.from(terms[v.Rand(terms.length)]);
}

function singleTerm(dict: {string: {}}): string {
    for (let k in dict) {
        return k;
    }
    return 'BAD'
}

export class BlockNode {
    public nodes : Node[];
    constructor(nodes: Node[]) {
        this.nodes = nodes;
    }
    Visit(f: (n: Node)=>void) {
        f(this);
        for (let i of this.nodes) {
            i.Visit(f);
        }
    }

    Generate(w: DynamicBuffer, v: Verse) {
        let nodes = this.nodes;
        if (v.Rand(10) == 0) {
            while (nodes.length > 0 && v.Rand(2) == 0) {
                const idx = v.Rand(nodes.length);
                nodes.copyWithin(0, idx+1, Math.min(idx, nodes.length - (idx+1)));
                nodes = nodes.slice(0, nodes.length-1);
            }
        }
        if (v.Rand(10) == 0) {
            while (nodes.length > 0 && v.Rand(2) == 0) {
                const idx = v.Rand(nodes.length);
                nodes.copyWithin(idx+1, idx)
            }
        }
        if (v.Rand(10) == 0) {
            while (nodes.length > 0 && v.Rand(2) == 0) {
                const idx1 = v.Rand(nodes.length);
                const idx2 = v.Rand(nodes.length);
                [nodes[idx1], nodes[idx2]] = [nodes[idx2], nodes[idx1]]
            }
        }
        for (let n of this.nodes) {
            if (v.Rand(20) == 0) {
                continue
            }
            if (v.Rand(20) == 0) {

            }
            n.Generate(w, v);
        }
    }
}

export function BuildVerse(oldv: Verse | null, data: Buffer): Verse | null {
    let printable = 0;
    for (let b of data) {
        if ( b >= 0x20 && b < 0x7f) {
            printable++;
        }
    }
    if (printable < (data.length*9/10)) {
        return oldv
    }
    const newv = new Verse();
    if (oldv != null) {
        newv.blocks = oldv.blocks;
        newv.allNodes = oldv.allNodes
    }
    let n = tokenize(data);
    n = structure(n);
    const b = new BlockNode(n);
    newv.blocks = newv.blocks.concat(b);
    b.Visit((n) => {
        newv.allNodes = newv.allNodes.concat(n);
    });
    return newv;
}

export class Verse {
    public blocks : BlockNode[] = [];
    public allNodes : Node[] = [];

    Rhyme(): Buffer {
        let buf = new DynamicBuffer();
        this.blocks[this.Rand(this.blocks.length)].Generate(buf, this);
        return buf.Bytes();
    }

    Rand(n: number): number {
        return Math.floor(Math.random() * Math.floor(n));
    }
}

class  WsNode {
    public dict: {string: any};

    constructor(dict: {string: any}) {
        this.dict = dict;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
    }

    Generate(w: DynamicBuffer, v: Verse) {
        if (v.Rand(5) != 0) {
            w.Write(randTerm(v, this.dict))
        } else {
            while (true) {
                const r = v.Rand(3);
                if (r === 0) {
                    break;
                } else if (r === 1) {
                    w.Write(Buffer.from(' '))
                } else if (r === 2) {
                    w.Write(Buffer.from('\t'))
                }
            }
        }
    }

}

class AlphaNumNode {
    public dict: {string: {}};

    constructor(dict: {string: {}}) {
        this.dict = dict;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
    }

    Generate(w: DynamicBuffer, v: Verse) {
        if (v.Rand(5) != 0) {
            w.Write(randTerm(v, this.dict));
        } else {
            let len = 0;
            const r = v.Rand(3);
            if (r === 0) {
                len = v.Rand(4);
            } else if (r === 1) {
                len = v.Rand(20);
            } else if (r === 2) {
                len = v.Rand(100);
            }
            const res = Buffer.alloc(len);
            for (let i=0; i<res.length; i++) {
                const r = v.Rand(4);
                if (r === 0) {
                    res[i] = '_'.charCodeAt(0);
                } else if (r === 1) {
                    res[i] = '0'.charCodeAt(0) + v.Rand(10);
                } else if (r === 2) {
                    res[i] = 'a'.charCodeAt(0) + v.Rand(26);
                } else if (r === 3) {
                    res[i] = 'A'.charCodeAt(0) + v.Rand(26)
                }
            }
            w.Write(res)
        }
    }
}

class NumNode {
    public dict: {string: {}};
    private hex: boolean;

    constructor(dict: {string: {}}, hex: boolean) {
        this.dict = dict;
        this.hex = hex;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
    }

    Generate(w: DynamicBuffer, v: Verse) {
        if (v.Rand(2) === 0) {
            w.Write(randTerm(v, this.dict))
        } else {
            const randNum = function () {
                const base = [8, 10, 16][v.Rand(3)];
                let len = 0;
                const r = v.Rand(3);
                if (r === 0) {
                    len = v.Rand(4);
                } else if (r === 1) {
                    len = v.Rand(16);
                } else if (r === 2) {
                    len = v.Rand(40);
                }
                let num = Buffer.alloc(len + 1);
                for (let i = 0; i < num.length; i++) {
                    switch (base) {
                        case 8:
                            num[i] = '0'.charCodeAt(0) + v.Rand(8);
                            break;
                        case 10:
                            num[i] = '0'.charCodeAt(0) + v.Rand(10);
                            break;
                        case 16:
                            const r = v.Rand(3);
                            switch (r) {
                                case 0:
                                    num[i] = '0'.charCodeAt(0) + v.Rand(10);
                                    break;
                                case 1:
                                    num[i] = 'a'.charCodeAt(0) + v.Rand(6);
                                    break;
                                case 2:
                                    num[i] = 'A'.charCodeAt(0) + v.Rand(6);
                            }
                    }
                }
                switch (base) {
                    case 8:
                        num = Buffer.concat([Buffer.from('0'), num]);
                        break;
                    case 10:
                    case 16:
                        num = Buffer.concat([Buffer.from('0x'), num]);
                        break;
                    default:
                        assert.fail("bad");
                }
                if (v.Rand(2) == 0) {
                    num = Buffer.concat([Buffer.from('-'), num])
                }
                return num;
            };
            switch (v.Rand(3)) {
                case 0:
                    w.Write(randNum());
                    break;
                case 1:
                    w.Write(randNum());
                    w.Write(Buffer.from('.'));
                    w.Write(randNum());
                    break;
                case 2:
                    w.Write(randNum());
                    w.Write(Buffer.from('e'));
                    w.Write(randNum());
                    break;
            }
        }
    }
}

class ControlNode {
    public ch: number;

    constructor(ch: number) {
        this.ch = ch;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
    }

    Generate(w: DynamicBuffer, v: Verse) {
        if (v.Rand(10) !== 0) {
            w.Write(Buffer.alloc(1, this.ch));
        } else {
            while (true) {
                const b = v.Rand(128);
                if ((b >= CHAR_CODE_0 && b <= CHAR_CODE_9) || (b >= CHAR_CODE_a && b <= CHAR_CODE_z)
                    || (b >= CHAR_CODE_A && b <= CHAR_CODE_Z)) {
                    continue;
                }
                w.Write(Buffer.alloc(1, b));
                break
            }
        }
    }
}

class BracketNode {
    public b: BlockNode;
    private clos: number;
    private open: number;
    constructor(open: number, clos: number, b: BlockNode) {
        this.open = open;
        this.clos = clos;
        this.b = b;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
        this.b.Visit(f)
    }

    Generate(w: DynamicBuffer, v: Verse) {
        if (v.Rand(10) != 0) {
            w.Write(Buffer.alloc(1, this.open));
            this.b.Generate(w, v);
            w.Write(Buffer.alloc(1, this.clos));
        } else {
            const brk = ['<', '[', '(', '{', '\'', '"', '`'];
            const open = brk[v.Rand(brk.length)];
            // @ts-ignore
            let clos = brackets[open];
            if (v.Rand(5) == 0) {
                // @ts-ignore
                clos = brackets[brk[v.Rand(brk.length)]];
            }
            w.Write(Buffer.from(open));
            this.b.Generate(w, v);
            w.Write(Buffer.from(clos))
        }
    }
}

class KeyValNode {
    public value: AlphaNumNode;
    public key: AlphaNumNode;
    private delim: number;
    constructor(delim: number, key: AlphaNumNode, value: AlphaNumNode) {
        this.delim = delim;
        this.key = key;
        this.value = value;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
        this.key.Visit(f);
        this.value.Visit(f);
    }

    Generate(w: DynamicBuffer, v: Verse) {
        const delim = ['='.charCodeAt(0), ':'.charCodeAt(0)];
        this.delim = delim[v.Rand(delim.length)];
        this.key.Generate(w, v);
        w.Write(Buffer.alloc(1, this.delim));
        this.value.Generate(w, v);
    }
}

class ListNode {
    public delim: number;
    public blocks: BlockNode[];
    constructor(delim: number, blocks: BlockNode[]) {
        this.delim = delim;
        this.blocks = blocks;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
        for (let b of this.blocks) {
            b.Visit(f)
        }
    }

    Generate(w: DynamicBuffer, v: Verse) {
        let blocks = this.blocks;
        if (v.Rand(5) === 0) {
            blocks = [];
            while (v.Rand(3) !== 0) {
                blocks = blocks.concat([this.blocks[v.Rand(this.blocks.length)]]);
            }
        }
        for (let i=0; i<this.blocks.length; i++) {
            if (i != 0) {
                w.Write(Buffer.alloc(1, this.delim));
            }
            this.blocks[i].Generate(w, v);
        }
    }
}

class LineNode {
    public r: boolean;
    public b: BlockNode;
    constructor(r: boolean, b: BlockNode) {
        this.r = r;
        this.b = b;
    }

    Visit(f: (n: Node)=>void) {
        f(this);
        this.b.Visit(f)
    }

    Generate(w: DynamicBuffer, v: Verse) {
        this.b.Generate(w, v);
        if (this.r) {
            w.Write(Buffer.from('\r\n'));
        } else {
            w.Write(Buffer.from('\n'));
        }
    }
}

function DecodeRune(data: any): any {
    return [1, 2];
}

function tokenize(data: Buffer) {
    let res : Node[] = [];
    enum StateType {
        stateControl,
        stateWs ,
        stateAlpha,
        stateNum,
    }
    let state = StateType.stateControl;
    let start = 0;
    for (let i=0; i < data.length; i++) {
        const [r,s] = DecodeRune(data.slice(i));
        if ( (r >= CHAR_CODE_a && r <= CHAR_CODE_z) ||
            (r >= CHAR_CODE_A && r <= CHAR_CODE_Z) ||
            r === CHAR_CODE__) {
            if (state === StateType.stateControl) {
                start = i;
                state = StateType.stateAlpha
            } else if (state === StateType.stateWs) {
                res.push(new WsNode(makeDict(data.slice(start, i))));
                start = i;
                state = StateType.stateAlpha;
            } else if (state === StateType.stateAlpha ||
                        state == StateType.stateNum) {
                state = StateType.stateAlpha;
            }
        } else if (r >= CHAR_CODE_0 && r <= CHAR_CODE_9) {
            if (state === StateType.stateControl) {
                start = i;
                state = StateType.stateNum;
            } else if (state === StateType.stateWs) {
                res.push(new WsNode(makeDict(data.slice(start ,i))));
                start = i;
                state = StateType.stateNum;
            }
        } else if ( r === CHAR_CODE_SPACE || r === CHAR_CODE_TAB) {
            if (state === StateType.stateControl) {
                start = i;
                state = StateType.stateWs;
            } else if (state === StateType.stateAlpha) {
                res.push(new AlphaNumNode(makeDict(data.slice(start, i))));
                start = i;
                state = StateType.stateWs;
            } else if (state == StateType.stateNum) {
                res.push(new NumNode(makeDict(data.slice(start, i)), false));
                start = i;
                state = StateType.stateWs;
            }
        } else {
            if (state === StateType.stateControl || state === StateType.stateWs) {
                res.push(new WsNode(makeDict(data.slice(start, i))));
            } else if (state === StateType.stateAlpha) {
                res.push(new AlphaNumNode(makeDict(data.slice(start, i))))
            } else if (state === StateType.stateNum) {
                res.push(new NumNode(makeDict(data.slice(start, i)), false))
            }
            state = StateType.stateControl;
            res.push(new ControlNode(r));
        }
        i += s;
    }

    if (state === StateType.stateAlpha) {
        res.push(new AlphaNumNode(makeDict(data.slice(start))));
    } else if (state === StateType.stateNum) {
        res.push(new NumNode(makeDict(data.slice(start)), false));
    }

    return res;
}

function structure(nn : Node[]): Node[] {
    nn = extractNumbers(nn);
    nn = structureBrackets(nn);
    nn = structureKeyValue(nn);
    nn = structureLists(nn);
    nn = structureLines(nn);
    return nn
}

function isHexNum(s: string): boolean {
    if (s.length) {
        return false;
    }
    for (let i=0; i<s.length; i++) {
        const c = s[i];
        if ((c >= '0' && c <= '9') ||
            (c >= 'a' && c <= 'f') ||
            (c >= 'A' && c <= 'F')) {
            continue
        }
        return false;
    }
    return true;
}

function isDecNum(s: string) : boolean {
    if (s.length === 0) {
        return false;
    }
    for (let i = 0; i < s.length; i++) {
        if (s[i] >= '0' && s[i] <= '9') {
            continue;
        }
        return false;
    }
    return true;
}


function extractNumbers(nn : Node[]): Node[] {
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < nn.length; i++) {
            const n = nn[i];
            if (n instanceof  AlphaNumNode) {
                const v = singleTerm(n.dict);
                if (v.length >= 3) {
                    if (v[0] === '0' && v[1] === 'x' && isHexNum(v.slice(2))) {
                        nn[i] = new NumNode(n.dict, true);
                        changed = true;
                    }
                    const e = v.indexOf('e');
                    if (e !== -1) {
                        if (isDecNum(v.slice(0, e)) && isDecNum(v.slice(e+1))) {
                            nn[i] = new NumNode(n.dict, false);
                            changed = true;
                            continue;
                        }
                        if (e == (v.length-1) && i !== (nn.length-1)) {
                            const num1 = nn[i+1];
                            if (num1 instanceof  NumNode) {
                                nn[i+1] = new NumNode(makeDict(Buffer.from(v + singleTerm(num1.dict))), false);
                                nn.copyWithin(i, i+1);
                                changed = true;
                                continue;
                            }
                        }
                    }
                }
            }

            if (n instanceof ControlNode && n.ch === CHAR_CODE_MINUS && i !== nn.length-1) {
                const num = nn[i+1];
                if (num instanceof  NumNode) {
                    let prev = undefined;
                    if (i != 0) {
                        prev = nn[i-1]
                    }
                    if (prev instanceof AlphaNumNode &&
                        singleTerm(prev.dict).length > 1 &&
                        singleTerm(prev.dict)[singleTerm(prev.dict).length-1] == 'e') {
                        nn.copyWithin(i, i+1);
                        changed=true;
                        continue;
                    }
                }
            }

            if (n instanceof  ControlNode && n.ch === CHAR_CODE_DOT && i != 0 && i != nn.length-1) {
                const num1 = nn[i-1];
                const num2 = nn[i+1];
                if (num1 instanceof  NumNode && num2 instanceof NumNode) {
                    nn[i+1] = new NumNode(
                        makeDict(
                            Buffer.from(singleTerm(num1.dict) + "." + singleTerm(num2.dict))), false);
                    nn.copyWithin(i-1, i+1);
                    changed = true;
                    continue;
                }
            }
        }
    }
    return nn
}

function structureKeyValue(nn : Node[]) : Node[]{
    const delims = {'=': true, ':': true};
    for (let n of nn) {
        if (n instanceof  BracketNode) {
            n.b.nodes = structureKeyValue(n.b.nodes);
        }
    }

    for (let i=0; i<nn.length; i++) {
        const n = nn[i];
        if (!(n instanceof ControlNode)) {
            continue
        }
        // @ts-ignore
        if (delims[n.ch] && !(i == 0 || i == nn.length-1 )) {
            const key = nn[i-1];
            if (!(key instanceof AlphaNumNode)) {
                continue;
            }
            const value = nn[i+1];
            if (!(value instanceof AlphaNumNode)) {
                continue;
            }
            nn[i+1] = new KeyValNode(n.ch, key, value);
            nn.copyWithin(i-1, i+1);
            nn = nn.slice(0, nn.length-2);
        }
    }
    return nn;
}

const brackets = {
    '<':  '>',
    '[':  ']',
    '(':  ')',
    '{':  '}',
    '\'': '\'',
    '"':  '"',
    '`':  '`',
};

function structureBrackets(nn: Node[]) : Node[]{
    let stk: Brk[] = [];
    loop:
    for (let i=0; i<nn.length; i++) {
        const n = nn[i];
        if (!(n instanceof ControlNode)) {
            continue;
        }
        for (let si=stk.length - 1; si >= 0; si--) {
            if (n.ch === stk[si].clos) {
                const b = new BracketNode(
                    stk[si].open,
                    stk[si].clos,
                    new BlockNode(nn.slice(stk[si].pos+1, i))
                );
                nn[stk[si].pos] = b;
                nn.copyWithin(stk[si].pos+1, i+1);
                nn = nn.slice(0, nn.length - i + stk[si].pos);
                i = stk[si].pos;
                stk = stk.slice(0, si);
                continue loop;
            }
        }
        // @ts-ignore
        const clos = brackets[String.fromCharCode(n.ch)];
        if (clos) {
            stk.push( {
                clos: clos,
                open: n.ch,
                pos: i,
            })
        }
    }
    return nn;
}

function structureLists(nn: Node[]) : Node[] {

    const delims = {',': true, ';': true};
    for (let n of nn) {
        if (n instanceof  BracketNode) {
            n.b.nodes = structureLists(n.b.nodes);
        }
    }
    // TODO: fails on:
    //	"f1": "v1", "f2": "v2", "f3": "v3"
    // the first detected list is "v2", "f3"
    for (let i=nn.length-1; i>=0; i--) {
        const n = nn[i];
        // @ts-ignore
        if (n instanceof ControlNode && delims[n.ch]) {
            const elems = [
                {tok: {}, done: false, pos: i-1, inc: -1},
                {tok: {}, done: false, pos: i+1, inc: 1}
            ];
            while (true) {
              for (let e of elems) {
                  if (e.done || e.pos < 0 || e.pos >= nn.length) {
                      e.done = true;
                      continue;
                  }
                  const ctrl1 = nn[e.pos];
                  if (ctrl1 instanceof ControlNode) {
                      if (ctrl1.ch == n.ch) {
                          e.done = true;
                          continue;
                      }
                      // @ts-ignore
                      e.tok[ctrl1.ch] = true;
                  }
                  const brk1 = nn[e.pos];
                  if (brk1 instanceof BracketNode) {
                      // @ts-ignore
                      e.tok[brk1.open] = true;
                      // @ts-ignore
                      e.tok[brk1.clos] = true;
                  }
                  e.pos += e.inc;
              }
              if (elems[0].done && elems[1].done) {
                  break;
              }
              const union = {};
              for (let k in elems[0].tok) {
                  // @ts-ignore
                  union[k] = true;
              }
              for (let k in elems[1].tok) {
                // @ts-ignore
                union[k] = true;
              }
              if (DeepEqual(elems[0].tok, union) || DeepEqual(elems[1].tok, union)) {
                  break
              }
            }

            for (let k in elems[1].tok) {
                // @ts-ignore
                elems[0].tok[k] = true;
            }

            elemLoop:
            for (let e of elems) {
                for(; e.pos >=0 && e.pos < nn.length; e.pos += e.inc) {
                    const ctrl1 = nn[e.pos];
                    // @ts-ignore
                    if (ctrl1 instanceof ControlNode && !elems[0].tok[ctrl1.ch]) {
                        continue elemLoop;
                    }
                    const brk1 = nn[e.pos];
                    // @ts-ignore
                    if (brk1 instanceof ControlNode && !elems[0].tok[brk1.ch]) {
                        continue elemLoop;
                    }
                }
            }
            for (let e of elems) {
                while (true) {
                    if (e.done || e.pos < 0 || e.pos >= nn.length) {
                        break;
                    }
                    const ctrl1 = nn[e.pos];
                    if (ctrl1 instanceof ControlNode) {
                        if (ctrl1.ch == n.ch) {
                            break
                        }
                        // @ts-ignore
                        if (!elems[0].tok[ctrl1.ch]) {
                            break
                        }
                    }
                    const brk1 = nn[e.pos];
                    if (brk1 instanceof BracketNode) {
                        // @ts-ignore
                        if (!elems[0].tok[brk1.open] || !elems[0].tok[brk1.clos]) {
                            break
                        }
                    }
                    e.pos += e.inc
                }
            }
            const lst = new ListNode(n.ch, [
                new BlockNode(nn.slice(elems[0].pos+1, i)),
                new BlockNode(nn.slice(i+1, elems[1].pos))
            ]);
            let start = elems[0].pos;
            const end = elems[1].pos;
            while (true) {
                if (start < 0) {
                    break;
                }
                const ctrl1 = nn[start];
                if (!(ctrl1 instanceof ControlNode) || ctrl1.ch != n.ch) {
                    break
                }
                let pos = start - 1;
                while (true) {
                    if (pos < 0) {
                        break;
                    }
                    const ctrl1 = nn[pos];
                    if (ctrl1 instanceof ControlNode) {
                        if (ctrl1.ch == n.ch) {
                            break;
                        }
                        // @ts-ignore
                        if (!elems[0].tok[ctrl1.ch]) {
                            break;
                        }
                    }
                    const brk1 = nn[pos];
                    if (brk1 instanceof BracketNode) {
                        // @ts-ignore
                        if (!elems[0].tok[brk1.open] || !elems[0].tok[brk1.clos]) {
                            break
                        }
                    }
                    pos--;
                }
                lst.blocks = [new BlockNode(nn.slice(pos+1, start))].concat(lst.blocks);
                start = pos;
            }
            nn[start+1] = lst;
            nn.copyWithin(start+2, end);
            nn = nn.slice(0, nn.length-end+start+2);
            i = start + 1;
        }
    }
    return nn;
}

function structureLines(nn: Node[]): Node[] {
    let res: Node[] = [];
    for (let i=0; i<nn.length; i++) {
        const n = nn[i];
        if (n instanceof BracketNode) {
            n.b.nodes = structureLines(n.b.nodes);
            continue;
        }
        if (!(n instanceof ControlNode) || n.ch != CHAR_CODE_NEWLINE) {
            continue;
        }
        let r = false;
        let end = i;
        if (i != 0) {
           const prev = nn[i-1];
           if (prev instanceof ControlNode && prev.ch == CHAR_CODE_WIN_NEWLINE) {
                r = true;
                end--;
           }
        }
        res = res.concat(new LineNode(r, new BlockNode(nn.slice(0, end))));
        nn = nn.slice(i+1,nn.length);
        i = -1;
    }
    if (nn.length != 0) {
        res = res.concat(nn);
    }
    return res;
}