const http = require('http');
const fs = require('fs');
const config = require('./config');
const router = require('./router');
const marked = require('marked');
const childProcess = require('child_process');
const jimp = require('jimp');

const loadTemplateSync = function (name) {
    return fs.readFileSync('./public/' + name + '.html');
};

const loadTemplateAsync = function (name, callback) {
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
    return container.replace(/(href|src)="(?!http|mailto:|tel:)(.+?)"/g, '$1="http://localhost:' + config.PORT + '/$2"');
};

const loadEnvVarTemplate = function () {
    return '<script>const PORT = ' + config.PORT + '; const WIKI_NAME = \'' + config.WIKI_NAME + '\';</script>';
};

const preparePageForDisplay = function (res, html, pageTitle) {
    html = replaceBlock('head', html, loadTemplateSync('head'));
    html = replaceBlock('title', html, pageTitle);
    html = replaceBlock('wikiname', html, config.WIKI_NAME, true);
    html = replaceBlock('envvars', html, loadEnvVarTemplate());
    html = replaceBlock('header', html, loadTemplateSync('header'));
    html = prepareUrls(html);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
};

const doesSearchTermMatch = function (needle, haystack) {
    if (needle.length <= 0) return true;
    needle = needle.toLowerCase();
    haystack = haystack.toLowerCase();
    const title = haystack.match(/title: (.+)(?:\r\n|\r|\n)/)[1];
    const tags = haystack.match(/tags: (.*)(?:\r\n|\r|\n)/)[1];
    let c;
    if ((c = needle.match(/^all:(.+)/)) !== null) {
        return haystack.indexOf(c[1]) !== -1;
    } else if ((c = needle.match(/^title:(.+)/)) !== null) {
        return title.indexOf(c[1]) !== -1;
    } else if ((c = needle.match(/^tags:(.+)/)) !== null) {
        return tags.indexOf(c[1]) !== -1;
    } else {
        return title.indexOf(needle) !== -1 || tags.indexOf(needle) !== -1;
    }
};

const getEntryList = function (search, callback) {
    fs.readdir('./public/wiki', function (err, files) {
        if (err) throw err;
        search = decodeURIComponent(search);
        const list = [];
        for (let i = 0, j = files.length; i < j; i++) {
            if (files[i].split('.').pop() !== 'md') continue;
            try {
                const file = fs.readFileSync('./public/wiki/' + files[i], 'utf8');
                if (!doesSearchTermMatch(search, file)) continue;
                list.push({
                    title: file.match(/title: (.+)(?:\r\n|\r|\n)/)[1],
                    tags: file.match(/tags: (.*)(?:\r\n|\r|\n)/)[1],
                    slug: files[i].replace('.md', '')
                });
            } catch (err) {
                //ignore
            }
        }
        callback(list);
    });
};

const fileSizeConverter = function (size) {
    let counter = 0;
    while (size > 1024) {
        size /= 1024;
        counter++;
    }
    return size.toFixed(2) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][counter];
};

const loadTagCloud = function (files) {
    const tags = [];
    files.forEach(file => {
        const fileContent = fs.readFileSync('./public/wiki/' + file, 'utf-8');
        const match = fileContent.match(/tags: (.*)(?:\r\n|\r|\n)/)[1].replace(/\s*,\s*/g, ',');
        if (match.length <= 0) return;
        match.split(',').forEach(tag => {
            if (!tags.includes(tag)) tags.push(tag);
        });
    });
    return tags.map(tag => '<a class="tag' + (tag === 'publish' ? ' publish' :
                                              '') + '" href="wiki/index/' + tag + '">' + tag + '</a>').join(' ');
};

const emptyDirectory = function (path) {
    fs.readdir(path, (err, files) => {
        if (err) throw err;
        files.forEach(file => fs.unlink(path + '/' + file));
    });
};

const createDirectory = function () {
    fs.mkdir('./public/publish', err => {
    });
};

const loadIndex = function (req, res, urlOptions) {
    loadTemplateAsync('entryIndex', function (err, html) {
        if (err) throw err;
        fs.readdir('./public/wiki', function (err2, files) {
            if (err2) throw err2;
            let imageSize = 0, fileSize = 0;
            const images = fs.readdirSync('./public/wiki/img');
            for (let i = 0, j = images.length; i < j; i++) {
                imageSize += fs.statSync('./public/wiki/img/' + images[i]).size;
            }
            let list = '';
            let tagCloudFiles = [];
            for (i = 0, j = files.length; i < j; i++) {
                if (files[i].split('.').pop() !== 'md') continue;
                try {
                    const file = fs.readFileSync('./public/wiki/' + files[i], 'utf8');
                    urlOptions[1] = decodeURIComponent(urlOptions[1]);
                    if (urlOptions[1] !== 'undefined' && !doesSearchTermMatch(urlOptions[1], file)) continue;
                    tagCloudFiles.push(files[i]);
                    const stats = fs.statSync('./public/wiki/' + files[i]);
                    fileSize += stats.size;
                    list += '<div class="row index-row"><div class="col-12 col-md-8"><a href="wiki/view/' + files[i].replace('.md', '') + '">' + file.replace(/title: (.+)(?:.|\s)*/, '$1') + '</a><div class="option-wrapper"><a href="wiki/edit/' + files[i].replace('.md', '') + '" class="edit">Edit</a><a href="#" class="delete" data-slug="' + files[i].replace('.md', '') + '">Delete</a></div></div><div class="col-12 col-md-2">' + fileSizeConverter(stats.size) + '</div><div class="col-12 col-md-2" onclick="location.href=\'/wiki/view/' + files[i].replace('.md', '') + '\'">' + (stats.mtime.getDate() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  '') + stats.mtime.getDate() + '.' + (stats.mtime.getMonth() + 1 < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       '') + (stats.mtime.getMonth() + 1) + '.' + stats.mtime.getFullYear() + ', ' + (stats.mtime.getHours() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      '') + stats.mtime.getHours() + ':' + (stats.mtime.getMinutes() < 10 ?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            '0' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            '') + stats.mtime.getMinutes() + '</div></div>';
                } catch (ex) {
                    //ignore
                }
            }

            const pageTitle = (urlOptions[1] !== 'undefined' ? 'Search' : 'Index');
            html = replaceBlock('title', html, pageTitle);
            html = replaceBlock('totalfilesize', html, fileSizeConverter(fileSize + imageSize));
            html = replaceBlock('filesize', html, fileSizeConverter(fileSize));
            html = replaceBlock('imagesize', html, fileSizeConverter(imageSize));
            html = replaceBlock('tags', html, (urlOptions[1] !== 'undefined' ?
                                               '<a class="tag" href="wiki/index"><i class="fas fa-times"></i></a><a class="tag' + (urlOptions[1] === 'publish' ?
                                                                                                                                   ' publish' :
                                                                                                                                   '') + '" href="wiki/index/' + urlOptions[1] + '">' + urlOptions[1] + '</a>' :
                                               ''));
            html = replaceBlock('tagcloud', html, loadTagCloud(tagCloudFiles));
            html = replaceBlock('content', html, list);

            preparePageForDisplay(res, html, pageTitle);
        });
    });
};
router.register('\/wiki\/index\/(.*)', loadIndex);
router.register('/wiki/index', loadIndex);
router.register('/wiki/home', loadIndex);
router.register('/wiki', loadIndex);
router.register('/', loadIndex);

router.register('\/wiki\/view\/(.+)', function (req, res, urlOptions) {
    loadTemplateAsync('view', function (err, html) {
        if (err) throw err;

        //load wiki entry
        loadWikiEntryAsync(urlOptions[1], function (wikiErr, wikiEntry) {
            let pageTitle = 'Entry Not Found';
            if (wikiErr && wikiErr.code === 'ENOENT') {
                //fill in data
                html = replaceBlock('title', html, pageTitle, true); //TODO find customizable way to do this
                html = replaceBlock('tags', html, '');
                html = replaceBlock('content', html, '');
            } else {
                //extract title and tags
                const title = wikiEntry.match(/^title: (.+)/);
                if (title) {
                    pageTitle = title[1];
                    html = replaceBlock('title', html, pageTitle, true);
                    wikiEntry = wikiEntry.replace(/^title: (.+)/, '');
                }

                const tags = wikiEntry.match(/tags: (.*)/);
                if (tags) {
                    const tagArray = tags[1].replace(/,\s*/g, ',').split(',');
                    for (let i = 0, j = tagArray.length; i < j; i++) {
                        if (tagArray[i] === '') continue;
                        tagArray[i] = tagArray[i].toLowerCase();
                        tagArray[i] = '<a class="tag' + (tagArray[i] === 'publish' ? ' publish' :
                                                         '') + '" href="wiki/index/' + tagArray[i] + '">' + tagArray[i] + '</a>';
                    }

                    html = replaceBlock('tags', html, tagArray.join(''));
                    wikiEntry = wikiEntry.replace(/tags: (.*)/, '');
                }

                //fill in data
                html = replaceBlock('content', html, marked(wikiEntry));
            }

            html = replaceBlock('slug', html, urlOptions[1], true);

            const stats = fs.statSync('./public/wiki/' + urlOptions[1] + '.md');
            html = replaceBlock('filesize', html, '<p>File size: ' + fileSizeConverter(stats.size) + '</p>');
            preparePageForDisplay(res, html, pageTitle);
        });
    });
});

router.register('\/wiki\/edit\/(.+)', function (req, res, urlOptions) {
    loadTemplateAsync('edit', function (err, html) {
        if (err) throw err;

        //load wiki entry
        loadWikiEntryAsync(urlOptions[1], function (wikiErr, wikiEntry) {
            let pageTitle = "Entry Not Found";
            if (wikiErr && wikiErr.code === 'ENOENT') {
                //fill in data
                loadTemplateAsync('view', function (errView) {
                    if (errView) throw errView;

                    html = replaceBlock('title', html, pageTitle, true); //TODO find customizable way to do this
                    html = replaceBlock('slug', html, '');
                    html = replaceBlock('tags', html, '');
                    html = replaceBlock('content', html, '');

                    preparePageForDisplay(res, html, pageTitle);
                });
            } else {
                //extract title and tags
                const title = wikiEntry.match(/^title: (.+)/);
                if (title) {
                    pageTitle = title[1];
                    html = replaceBlock('title', html, pageTitle, true);
                    wikiEntry = wikiEntry.replace(/^title: (.+)/, '');
                }

                html = replaceBlock('slug', html, urlOptions[1], true);

                const tags = wikiEntry.match(/tags: (.*)/);
                if (tags) {
                    html = replaceBlock('tags', html, tags[1]);
                    wikiEntry = wikiEntry.replace(/tags: ?(.*)\s+/, '');
                }

                //fill in data
                html = replaceBlock('content', html, wikiEntry.trim(), true);

                preparePageForDisplay(res, html, pageTitle);
            }
        });
    });
});

router.register('/wiki/new', function (req, res) {
    loadTemplateAsync('edit', function (err, html) {
        if (err) throw err;

        const pageTitle = 'New';
        html = replaceBlock('title', html, '');
        html = replaceBlock('slug', html, '', true);
        html = replaceBlock('tags', html, '');
        html = replaceBlock('content', html, '');

        //prepare links
        preparePageForDisplay(res, html, pageTitle);
    });
});

router.register('/wiki/settings', function (req, res) {
    loadTemplateAsync('settings', function (err, html) {
        if (err) throw err;

        html = replaceBlock('port', html, config.PORT);
        preparePageForDisplay(res, html, 'Settings');
    });
});

router.register('\/wiki\/save\/(.+?)\/(.+?)\/(.*?)\/(.*?)\/((?:.|\s)+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});

    for (let i = 1; i <= 5; i++) {
        urlOptions[i] = decodeURIComponent(urlOptions[i]);
    }

    const saveText = "title: " + urlOptions[1] + "\ntags: " + (urlOptions[4].length > 0 ? urlOptions[4] :
                                                               '') + "\n\n" + urlOptions[5];
    const save = function () {
        fs.writeFile('./public/wiki/' + urlOptions[2] + '.md', saveText, 'utf8', function (err) {
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

router.register('\/wiki\/savesettings\/([0-9]{4,5})\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});

    const configText = "exports.PORT = " + urlOptions[1] + ";\nexports.WIKI_NAME = \"" + decodeURIComponent(urlOptions[2]) + "\";";
    fs.writeFile('./config.js', configText, 'utf8', function (err) {
        if (err) {
            res.write('Error: Could not save config file.');
        } else {
            const batchText = "start \"\" http://localhost:" + urlOptions[1] + "\nnpm start";
            fs.writeFile('./start.bat', batchText, 'utf8', function (err2) {
                if (err2) {
                    res.write('Error: Could not save batch file.');
                } else {
                    res.write('success');
                }
                res.end();
            });
        }
    });
});

router.register('/wiki/update', function (req, res) {
    childProcess.exec('update.bat', function () {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('finished');
        res.end();
    });
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

router.register('\/wiki\/entries\/(.*)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/json'});
    getEntryList(urlOptions[1], function (list) {
        res.write(JSON.stringify(list));
        res.end();
    });
});

router.register('\/wiki\/download\/(.+)\/(.+)\/([0-9]{1,3})', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    jimp.read(decodeURIComponent(urlOptions[1]), function (err, image) {
        if (err || image === undefined) {
            res.write('error');
        } else {
            let quality = parseInt(urlOptions[3]);
            if (quality > 100) quality = 100;
            if (quality < 10) quality = 10;
            image.resize(image.bitmap.width, image.bitmap.height).quality(quality).write('public/wiki/img/' + decodeURIComponent(urlOptions[2]) + '.jpg');
            res.write('success');
        }
        res.end();
    });
});

router.register('\/wiki\/deleteImage\/(.+)', function (req, res, urlOptions) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    fs.unlink('./public/wiki/img/' + urlOptions[1] + '.jpg', function (err) {
        if (err) {
            res.write('error');
        } else {
            res.write('success');
        }
        res.end();
    });
});

router.register('/wiki/publish', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    createDirectory('./public/publish');
    emptyDirectory('./public/publish');
    fs.readdir('./public/wiki', function (err, files) {
        if (err) throw err;
        const slugsToBePublished = [];
        for (let i = 0, j = files.length; i < j; i++) {
            if (files[i].split('.').pop() !== 'md') continue;
            try {
                const file = fs.readFileSync('./public/wiki/' + files[i], 'utf8');
                if (!file.match(/tags: (.*)(?:\r\n|\r|\n)/)[1].toLowerCase().replace(/,\s+/g, ',').split(',').includes('publish')) continue;
                slugsToBePublished.push({path: '/wiki/view/' + files[i].replace('.md', ''), slug: files[i].replace('.md', '')});
            } catch (err) {
                //ignore
            }
        }
        slugsToBePublished.push({path: '/wiki/index/publish', slug: 'publishIndex'});
        slugsToBePublished.forEach(file => {
            http.get({host: 'localhost', port: config.PORT, path: file.path}, function (http_res) {
                let data = '';
                http_res.on('data', chunk => data += chunk);
                http_res.on('end', () => {
                    //prepare for online use
                    data = data.replace(/http:\/\/localhost:3000\//g, '');
                    data = data.replace(/<a class="button editbutton" href="wiki\/edit\/.+" title="E">Edit<\/a>/g, '');
                    data = data.replace(/<a class="button delete" href="#" data-slug="k-test">Delete<\/a>/g, '');
                    data = data.replace(/<a href="wiki\/new" class=".+?">.+?<\/a>/g, '');
                    data = data.replace(/<a href="wiki\/settings" class=".+?">.+?<\/a>/g, '');
                    // data = data.replace(/<form id="search-form" class="flex">[\s\S]+<\/form>/g, '');

                    data = data.replace(/<input type="text" placeholder="Search \.\.\." id="search" title="Ctrl\+F"\/>/g, '<input type="text" placeholder="Search ..." id="search" title="Ctrl+F" style="display: none;"/>');
                    data = data.replace(/href="wiki\/index\/?.*?"/g, 'href="?slug=publishIndex"');
                    data = data.replace(/<div class="option-wrapper">.+?<\/div>/g, '');
                    data = data.replace(/href="wiki\/view\/(.+?)"/g, 'href="?slug=$1"');

                    fs.writeFile('./public/publish/' + file.slug + '.php', data, 'utf8', function (err) {
                        if (err) {
                            res.write('error');
                            res.end();
                        }
                    });
                });
            }).on('error', function () {
                res.write('error');
                res.end();
            });
        });
        res.write('success');
        res.end();
    });
});

const server = http.createServer(function (req, res) {
    const handler = router.route(req);
    handler.method.process(req, res, handler.urlOptions);
});
server.listen(config.PORT, function () {
    console.log('listening on port ' + config.PORT);
});