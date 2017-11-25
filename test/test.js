const udgerParser = require('../')('db/udgerdb_v3_test.dat');

udgerParser.setUA('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.97 Safari/537.36');
udgerParser.setIP("66.249.64.1");
let ret = udgerParser.parse();
console.log(ret);