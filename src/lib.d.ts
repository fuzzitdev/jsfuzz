declare module NodeJS {
  interface Global {
    __coverage__: {
      [filePath: string]: {
        s: { [n: string]: number };
        f: { [n: string]: number };
        b: { [n: string]: number[] };
      };
    };
  }
}
