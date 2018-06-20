const handlerFactory = require('./handler');
const fs = require('fs');
const parser = require('url');
let handlers = [];

exports.clear = function () {
    handlers = [];
};

exports.register = function (url, method) {
    handlers.push({method: handlerFactory.createHandler(method), url: url});
};

exports.route = function (req) {
    const url = parser.parse(req.url, true);
    const handler = {method: null, urlOptions: []};
    for (let i = 0, j = handlers.length; i < j; i++) {
        // console.log(url.pathname);
        // console.log(handlers[i].url);
        const regexMatch = url.pathname.match(new RegExp('^' + handlers[i].url + '$'));
        // console.log(regexMatch);
        if (regexMatch === null) continue;
        handler.method = handlers[i].method;
        handler.urlOptions = regexMatch;
        break;
    }
    if (handler.method === null) {
        handler.method = this.missing(req);
    }
    return handler;
};

exports.missing = function (req) {
    // Try to read the file locally, this is a security hole, yo /../../etc/passwd
    const url = parser.parse(req.url, true);
    const path = __dirname + "/public" + decodeURIComponent(url.pathname.replace(/\.\.\//g, ''));
    try {
        data = fs.readFileSync(path);

        let mimeAddition;
        const fileType = path.split('.').pop();
        switch(fileType) {
            case 'css':
                mimeAddition = 'text/css';
                break;
            case 'jpg':
                mimeAddition = 'image';
                break;
            case 'pdf':
                mimeAddition = 'application/pdf';
                break;
            case 'doc':
            case 'docx':
                mimeAddition = 'application/msword';
                break;
            default:
                mimeAddition = 'text/html';
                break;
        }

        mime = req.headers.accepts || mimeAddition;
        return handlerFactory.createHandler(function (req, res) {
            res.writeHead(200, {'Content-Type': mime});
            res.write(data);
            res.end();
        });
    } catch (e) {
        return handlerFactory.createHandler(function (req, res) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write("No route registered for " + url.pathname);
            res.end();
        });
    }
};