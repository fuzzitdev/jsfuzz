const htmlparser2 = require("htmlparser2");

function fuzz(buf) {
    try {
        pako.inflate(buf)
        // console.log(image)

    } catch (e) {
        //Those are "valid" exceptions. we can't catch them in one line as
        if (e.indexOf('incorrect') !== -1 ||
            e.indexOf('unknown') !== -1 ||
            e.indexOf('invalid') !== -1 ||
            e.indexOf('need dictionary') !== -1 ||
            e.indexOf('buffer error') !== -1 ||
            e.indexOf('too many length') !== -1 ||
            e.indexOf('crc') !== -1) {
        } else {
            throw e;
        }
    }
}


module.exports = {
    fuzz
};