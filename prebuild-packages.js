const glob = require("glob");
const each = require("lodash").each;
const fs = require('fs-extra');

// options is optional
glob("./node_modules/**/*.ts", function (er, files) {
    if (er) console.log(err);

    each(files, (el) => {
        if (el.indexOf('.d.ts') === -1)
            fs.remove(el);
    });
});
