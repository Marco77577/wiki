const port = 3000;
const http = require('http');
const fs = require('fs');
const router = require('./router');
const marked = require('marked');

const getTemplateSync = function (name) {
    return fs.readFileSync('./public/' + name + '.html');
};

const getTemplateAsync = function (name, callback) {
    fs.readFile('./public/' + name + '.html', 'utf8', function (err, html) {
        callback(err, html);
    });
};

const loadWikiEntryAsync = function (slug, callback) {
    fs.readFile('./public/wiki/' + slug + '.md', 'utf8', function (err, entry) {
        callback(err, entry);
    });
};

const replaceBlock = function (blockName, container, substitute, global) {
    return global ? container.replace(new RegExp('{% block ' + blockName + ' %}', 'g'), substitute)
        : container.replace('{% block ' + blockName + ' %}', substitute);
};

const prepareUrls = function (container) {
    return container.replace(/(href|src)="(?!http)(.+?)"/g, '$1="http://localhost:' + port + '/$2"');
};

const loadIndex = function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    getTemplateAsync('entryIndex', function (err, html) {
        if (err) throw err;
        fs.readdir('./public/wiki', function (err2, files) {
            if (err2) throw err2;
            var list = '';
            for (var i = 0, j = files.length; i < j; i++) {
                if (files[i].split('.').pop() !== 'md') continue;
                try {
                    const file = fs.readFileSync('./public/wiki/' + files[i], 'utf8');
                    if (urlOptions[1] !== undefined && !(file.toLowerCase().indexOf(urlOptions[1]) !== -1 || file.toLowerCase().match(new RegExp(urlOptions[1])))) continue;
                    const stats = fs.statSync('./public/wiki/' + files[i]);
                    list += '<div class="row"><div class="col-12 col-md-8"><a href="wiki/view/' + files[i].replace('.md', '') + '">' + file.replace(/title: (.+)(?:.|\s)*/, '$1') + '</a><div class="option-wrapper"><a href="wiki/edit/' + files[i].replace('.md', '') + '" class="edit">Edit</a><a href="#" class="delete" data-slug="' + files[i].replace('.md', '') + '">Delete</a></div></div><div class="col-12 col-md-2" onclick="location.href=\'/wiki/view/' + files[i].replace('.md', '') + '\'">' + (stats.mtime.getDate() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                '') + stats.mtime.getDate() + '.' + (stats.mtime.getMonth() + 1 < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     '') + (stats.mtime.getMonth() + 1) + '.' + stats.mtime.getFullYear() + ', ' + (stats.mtime.getHours() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    '') + stats.mtime.getHours() + ':' + (stats.mtime.getMinutes() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          '') + stats.mtime.getMinutes() + '</div><div class="col-12 col-md-2" onclick="location.href=\'/wiki/view/' + files[i].replace('.md', '') + '\'">' + (stats.ctime.getDate() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               '') + stats.ctime.getDate() + '.' + (stats.ctime.getMonth() + 1 < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    '') + (stats.ctime.getMonth() + 1) + '.' + stats.mtime.getFullYear() + ', ' + (stats.ctime.getHours() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   '') + stats.ctime.getHours() + ':' + (stats.ctime.getMinutes() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         '') + stats.ctime.getMinutes() + '</div></div>';
                } catch (ex) {
                    //ignore
                }
            }

            html = replaceBlock('header', html, getTemplateSync('header'));
            html = replaceBlock('title', html, (urlOptions[1] !== undefined ? urlOptions[1] : 'Index'));
            html = replaceBlock('tags', html, (urlOptions[1] !== undefined ?
                                               '<a class="tag" href="wiki/index/' + urlOptions[1] + '">' + urlOptions[1] + '</a>' : ''));
            html = replaceBlock('content', html, list);
            html = prepareUrls(html);
            res.write(html);
            res.end();
        });
    });
};
router.register('\/wiki\/index\/(.*)', loadIndex);
router.register('/wiki/index', loadIndex);
router.register('/wiki/home', loadIndex);
router.register('/wiki', loadIndex);
router.register('/', loadIndex);

router.register('\/wiki\/view\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    getTemplateAsync('view', function (err, html) {
        if (err) throw err;

        //load wiki entry
        loadWikiEntryAsync(urlOptions[1], function (wikiErr, wikiEntry) {
            if (wikiErr && wikiErr.code === 'ENOENT') {
                //fill in data
                html = replaceBlock('title', html, 'Entry Not Found', true); //TODO find customizable way to do this
                html = replaceBlock('tags', html, '');
                html = replaceBlock('content', html, '');
            } else {
                //extract title and tags
                const title = wikiEntry.match(/^title: (.+)/);
                if (title) {
                    html = replaceBlock('title', html, title[1], true);
                    wikiEntry = wikiEntry.replace(/^title: (.+)/, '');
                }

                const tags = wikiEntry.match(/tags: (.*)/);
                if (tags) {
                    const tagArray = tags[1].replace(/,\s*/g, ',').split(',');
                    for (var i = 0, j = tagArray.length; i < j; i++) {
                        if (tagArray[i] === '') continue;
                        tagArray[i] = tagArray[i].toLowerCase();
                        tagArray[i] = '<a class="tag" href="wiki/index/' + tagArray[i] + '">' + tagArray[i] + '</a>';
                    }

                    html = replaceBlock('tags', html, tagArray.join(''));
                    wikiEntry = wikiEntry.replace(/tags: (.*)/, '');
                }

                //fill in data
                html = replaceBlock('content', html, marked(wikiEntry));
            }

            //prepare links
            html = replaceBlock('header', html, getTemplateSync('header'));
            html = replaceBlock('slug', html, urlOptions[1], true);
            html = prepareUrls(html);
            res.write(html);
            res.end();
        });
    });
});

router.register('\/wiki\/edit\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    getTemplateAsync('edit', function (err, html) {
        if (err) throw err;

        //load wiki entry
        loadWikiEntryAsync(urlOptions[1], function (wikiErr, wikiEntry) {
            if (wikiErr && wikiErr.code === 'ENOENT') {
                //fill in data
                getTemplateAsync('view', function (errView, htmlView) {
                    if (errView) throw errView;

                    html = replaceBlock('header', htmlView, getTemplateSync('header'));
                    html = replaceBlock('title', html, 'Entry Not Found', true); //TODO find customizable way to do this
                    html = replaceBlock('slug', html, '');
                    html = replaceBlock('tags', html, '');
                    html = replaceBlock('content', html, '');

                    //prepare links
                    html = prepareUrls(html);
                    res.write(html);
                    res.end();
                });
            } else {
                //extract title and tags
                const title = wikiEntry.match(/^title: (.+)/);
                if (title) {
                    html = replaceBlock('title', html, title[1], true);
                    wikiEntry = wikiEntry.replace(/^title: (.+)/, '');
                }

                html = replaceBlock('slug', html, urlOptions[1], true);

                const tags = wikiEntry.match(/tags: (.*)/);
                if (tags) {
                    html = replaceBlock('tags', html, tags[1]);
                    wikiEntry = wikiEntry.replace(/tags: ?(.*)\s+/, '');
                }

                //fill in data
                html = replaceBlock('header', html, getTemplateSync('header'));
                html = replaceBlock('content', html, wikiEntry.trim(), true);

                //prepare links
                html = prepareUrls(html);
                res.write(html);
                res.end();
            }
        });
    });
});

router.register('/wiki/new', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    getTemplateAsync('edit', function (err, html) {
        if (err) throw err;

        html = replaceBlock('header', html, getTemplateSync('header'));
        html = replaceBlock('title', html, 'New');
        html = replaceBlock('title', html, '');
        html = replaceBlock('slug', html, '');
        html = replaceBlock('tags', html, '');
        html = replaceBlock('content', html, '');

        //prepare links
        html = prepareUrls(html);
        res.write(html);
        res.end();
    });
});

router.register('\/wiki\/save\/(.+?)\/(.+?)\/(.*?)\/(.*?)\/((?:.|\s)+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    urlOptions[5] = decodeURI(urlOptions[5]).replace(/\|\|/g, '#');
    const saveText = "title: " + decodeURI(urlOptions[1]) + "\ntags: " + (urlOptions[4].length > 0 ? decodeURI(urlOptions[4]) :
                                                                          '') + "\n\n" + urlOptions[5];
    const save = function () {
        fs.writeFile('./public/wiki/' + urlOptions[2] + '.md', saveText, function (err) {
            if (err) {
                res.write('Error: Could not save file.');
            } else {
                res.write('success');
            }
            res.end();
        });
    };

    if (urlOptions[2] === urlOptions[3] || urlOptions[3].length === 0) { //old and new slug are the same or there was no old slug, just (re)write file
        save();
    } else { //new slug, delete old file, write to new file
        fs.unlink('./public/wiki/' + urlOptions[3] + '.md', function (err) {
            if (err) {
                res.write('Error: Could not delete old file.')
            } else {
                save();
            }
        });
    }
});

router.register('\/wiki\/delete\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    fs.unlink('./public/wiki/' + urlOptions[1] + '.md', function (err) {
        if (err) {
            res.write('Error: Could not delete file.')
        } else {
            res.write('success');
        }
        res.end();
    });
});

router.register('\/wiki\/checkslug\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    fs.access('./public/wiki/' + urlOptions[1] + '.md', fs.constants.F_OK, function (err) {
        res.write(err ? 'free' : 'taken');
        res.end();
    });
});

const server = http.createServer(function (req, res) {
    const handler = router.route(req);
    handler.method.process(req, res, handler.urlOptions);
});
server.listen(port, function () {
    console.log('listening on port ' + port);
});