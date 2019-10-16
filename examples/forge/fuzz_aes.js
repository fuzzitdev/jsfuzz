const forge = require('node-forge');
forge.options.usePureJavaScript = true;


function fuzz(buf) {
    const size = 8;
    const block = 8;
    if (buf.length < size+2*block) {
        return;
    }
    const cipher = forge.cipher.createCipher('DES-ECB', buf.slice(0,size));
    cipher.start();
    cipher.update(forge.util.createBuffer(buf.slice(size, size+block)));
    cipher.update(forge.util.createBuffer(buf.slice(size+block, size+block*2)));
    const encrypted = cipher.output;

    const decipher = forge.cipher.createDecipher('DES-ECB', buf.slice(0,size));
    decipher.start();
    decipher.update(encrypted);
    const decrypted = decipher.output;

    if (!encrypted.toHex().localeCompare(decrypted.toHex())) {
        throw Error("data changed!!");
    }


}

module.exports = {
    fuzz
};