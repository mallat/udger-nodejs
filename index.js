const Database = require('better-sqlite3');

class UdgerParser {
    constructor(file) {
        this.db = new Database(file, {readonly:true, fileMustExist:true});
    }

    setUA(ua) {
        this.ua = ua;
    }

    setIP(ip) {
        this.ip = ip;
    }

    parse() {
        return {}
    }
}

module.exports = function(file) {
    return new (UdgerParser)(file);
};
