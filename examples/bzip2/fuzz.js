const decompress = require('decompress');

async function fuzz(buf) {
    try {
        await decompress(buf)
        // console.log(image)

    } catch (e) {
        //Those are "valid" exceptions. we can't catch them in one line as
        if (e.message.indexOf('unknown header flags') !== -1) {
        } else {
            throw e;
        }
    }
}


module.exports = {
    fuzz
};