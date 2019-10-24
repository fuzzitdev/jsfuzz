# Jsfuzz: coverage-guided fuzz testing for Javascript
[![Join the chat at https://slack.fuzzit.dev](https://app.fuzzit.dev/static/slack-join.svg)](https://slack.fuzzit.dev)


Jsfuzz is coverage-guided [fuzzer](https://developer.mozilla.org/en-US/docs/Glossary/Fuzzing) for testing javascript/nodejs packages.

Fuzzing for safe languages like nodejs is a powerful strategy for finding bugs like unhandled exceptions, logic bugs,
security bugs that arise from both logic bugs and Denial-of-Service caused by hangs and excessive memory usage.

Fuzzing can be seen as a powerful and efficient strategy in real-world software in addition to classic unit-tests.

## Usage

### Fuzz Target

The first step is to implement the following function (also called a fuzz target):

```javascript
function fuzz(buf) {
  // call your package with buf  
}
module.exports = {
    fuzz
};
```

Features of the fuzz target:

* Jsfuzz will call the fuzz target in an infinite loop with random data (according to the coverage guided algorithm) passed to `buf`( in a separate process).
* The function must catch and ignore any expected exceptions that arise when passing invalid input to the tested package.
* The fuzz target must call the test function/library with wither the passed buffer or a transformation on the test buffer 
if the structure is different or from different type.
* Fuzz functions can also implement application level checks to catch application/logical bugs - For example: 
decode the buffer with the testable library, encode it again, and check that both results are equal. To communicate the results
the result/bug the function should throw an exception.
* jsfuzz will report any unhandled exceptions as crashes as well as inputs that hit the memory limit specified to jsfuzz
or hangs/they run more the the specified timeout limit per testcase.

Here is an example of a simple fuzz function for `jpeg-js` module.

```javascript
const jpeg = require('jpeg-js');

function fuzz(buf) {
    try {
        jpeg.decode(buf);
    } catch (e) {
        // Those are "valid" exceptions. we can't catch them in one line as
        // jpeg-js doesn't export/inherit from one exception class/style.
        if (e.message.indexOf('JPEG') !== -1 ||
            e.message.indexOf('length octect') !== -1 ||
            e.message.indexOf('Failed to') !== -1 ||
            e.message.indexOf('DecoderBuffer') !== -1 ||
            e.message.indexOf('invalid table spec') !== -1 ||
            e.message.indexOf('SOI not found') !== -1) {
        } else {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};
```

### Running

The next step is to download js-fuzz and then run your fuzzer

```bash
npm i -g jsfuzz
jsfuzz ./examples/jpeg/fuzz.js corpus

# Output:
#0 READ units: 0
#1 NEW     cov: 61 corp: 0 exec/s: 1 rss: 23.37 MB
#23320 PULSE     cov: 61 corp: 1 exec/s: 10614 rss: 35.3 MB
#96022 NEW     cov: 70 corp: 1 exec/s: 11320 rss: 129.95 MB
#96971 NEW     cov: 78 corp: 2 exec/s: 10784 rss: 129.95 MB
#97046 NEW     cov: 79 corp: 3 exec/s: 9375 rss: 129.95 MB
#97081 NEW     cov: 81 corp: 4 exec/s: 11666 rss: 129.95 MB
#97195 NEW     cov: 93 corp: 5 exec/s: 9500 rss: 129.95 MB
#97216 NEW     cov: 97 corp: 6 exec/s: 10500 rss: 129.95 MB
#97238 NEW     cov: 102 corp: 7 exec/s: 11000 rss: 129.95 MB
#97303 NEW     cov: 108 corp: 8 exec/s: 10833 rss: 129.96 MB
#97857 PULSE     cov: 108 corp: 9 exec/s: 225 rss: 129.96 MB
#97857 PULSE     cov: 108 corp: 9 exec/s: 0 rss: 940.97 MB
#97857 PULSE     cov: 108 corp: 9 exec/s: 0 rss: 1566.01 MB
#97857 PULSE     cov: 108 corp: 9 exec/s: 0 rss: 2053.49 MB
MEMORY OOM: exceeded 2048 MB. Killing worker
Worker killed
crash was written to crash-819587841e3c275338593b0d195b6163d5208866870e2abf3be8cfc781d2688d
crash(hex)=ffd8ffc09dfdb0ffff0e5296bd7fbbc4f9579096bd7fbbfc0e80d50000ffff36fa400100236701bf73ffaf8003a57f097f5e000000008023c4f9579096bd7fbb008000001500b34e8c018fda5212
```

This example quickly finds an infinite hang which takes all the memory in `jpeg-js`.

### Corpus

Jsfuzz will generate and test various inputs in an infinite loop. `corpus` is optional directory and will be used to
save the generated testcases so later runs can be started from the same point and provided as seed corpus.

JsFuzz can also start with an empty directory (i.e no seed corpus) though some valid test-cases in the seed corpus
may speed up the fuzzing substantially.  

jsfuzz tries to mimic some of the arguments and output style from [libFuzzer](https://llvm.org/docs/LibFuzzer.html).

More fuzz targets examples (for real and popular libraries) are located under the examples directory and
bugs that were found using those targets are listed in the trophies section.

## Other languages

Currently this library is also ported to python via [pythonfuzz](https://github.com/fuzzitdev/jsfuzz)

## Credits & Acknowledgments

jsfuzz logic is heavily based on [go-fuzz](https://github.com/dvyukov/go-fuzz) originally developed by [Dmitry Vyukov's](https://twitter.com/dvyukov).
Which is in turn heavily based on [Michal Zalewski](https://twitter.com/lcamtuf) [AFL](http://lcamtuf.coredump.cx/afl/).

A previous take on that was done by https://github.com/connor4312/js-fuzz with a bit different design, coverage and
interface but it looks like it is currently unmaintained.

For coverage jsfuzz is using [istanbuljs](https://istanbul.js.org) instrumentation and coverage library. 


## Contributions

Contributions are welcome!:) There are still a lot of things to improve, and tests and features to add. We will slowly post those in the
issues section. Before doing any major contribution please open an issue so we can discuss and help guide the process before
any unnecessary work is done.


## Trophies
* [jpeg-js: OOM/DoS](https://github.com/eugeneware/jpeg-js/issues/53)
* [@webassemblyjs/wast-parser: Crash/TypeError](https://github.com/xtuc/webassemblyjs/issues/669)
* [decompress: Crash/TypeError ](https://github.com/kevva/decompress/issues/72)
* [qs: logic bug/inequality](https://github.com/ljharb/qs/issues/340) 

**Feel free to add bugs that you found with jsfuzz to this list via pull-request**
