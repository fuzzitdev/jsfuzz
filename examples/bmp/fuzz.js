const Jimp = require('jimp');


async function fuzz(buf) {
    try {
        const promisifiedJimp = new Promise((resolve, reject) => {
            new Jimp(buf, (err, image) => {
                if (err) {
                    reject(err)
                }
                resolve(image)
            });
        })
        const image = await promisifiedJimp;
        // console.log(image)

    } catch (e) {
        // console.log(image)
        // Those are "valid" exceptions. we can't catch them in one line as
        if (e.message.indexOf('MIME') !== -1 ||
            e.message.indexOf('JPEG')) {
        } else {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};