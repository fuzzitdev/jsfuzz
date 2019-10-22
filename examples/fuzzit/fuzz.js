
function fuzz(buf) {
    const string = buf.toString();
    if (string.length === 3) {
        if (string[0] === 'f' && string[1] === 'u' && string[2] === 'z') {
                    throw Error("error")
        }
    }
}

module.exports = {
    fuzz
};
