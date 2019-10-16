const elf_tools = require('elf-tools');

function fuzz(buf) {
    try {
        const image = elf_tools.build({
            code: buf,
        });
    } catch (e) {
        // Those are "valid" exceptions. we can't catch them in one line as
        // jpeg-js doesn't export/inherit from one exception class/style.
        if (e.message.indexOf('code must be') !== -1) {
        } else {
            throw e;
        }
    }
}

module.exports = {
    fuzz
};