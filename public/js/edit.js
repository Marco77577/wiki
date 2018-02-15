function getTextSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() === el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }
    return {start: start, end: end}
}

document.addEventListener('DOMContentLoaded', function () {
        const md = [
            {
                name: 'link',
                text: 'QuickLink',
                delimiterStart: '[',
                delimiterEnd: ']()',
                addedLineBreaks: 0,
                keyCode: 65,
                ctrlKey: true,
                shiftKey: true
            },
            {
                name: 'bold',
                text: 'Bold',
                delimiterStart: '**',
                delimiterEnd: '**',
                addedLineBreaks: 0,
                keyCode: 66,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'italic',
                text: 'Italic',
                delimiterStart: '*',
                delimiterEnd: '*',
                addedLineBreaks: 0,
                keyCode: 73,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'strikethrough',
                text: 'Strikethrough',
                delimiterStart: '~~',
                delimiterEnd: '~~',
                addedLineBreaks: 0,
                keyCode: 83,
                ctrlKey: true,
                shiftKey: true
            },
            {
                name: 'code',
                text: 'Code',
                delimiterStart: '`',
                delimiterEnd: '`',
                addedLineBreaks: 0,
                keyCode: 67,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'codeBlock',
                text: 'CodeBlock',
                delimiterStart: "\n```js\n",
                delimiterEnd: "\n```",
                addedLineBreaks: 3,
                keyCode: 75,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'blockquote',
                text: 'Blockquote',
                delimiterStart: "\n> ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 81,
                ctrlKey: true,
                shiftKey: false
            },
            {name: 'h1', text: 'H1', delimiterStart: "\n# ", delimiterEnd: "", addedLineBreaks: 1, keyCode: 49, ctrlKey: true, shiftKey: false},
            {name: 'h2', text: 'H2', delimiterStart: "\n## ", delimiterEnd: "", addedLineBreaks: 1, keyCode: 50, ctrlKey: true, shiftKey: false},
            {
                name: 'h3',
                text: 'H3',
                delimiterStart: "\n### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 51,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'h4',
                text: 'H4',
                delimiterStart: "\n#### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 52,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'h5',
                text: 'H5',
                delimiterStart: "\n##### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 53,
                ctrlKey: true,
                shiftKey: false
            },
            {
                name: 'h6',
                text: 'H6',
                delimiterStart: "\n###### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 54,
                ctrlKey: true,
                shiftKey: false
            }
        ];
        var dirty = false;
        const content = $1('#content');
        const title = $1('#title');
        const slug = $1('#slug');
        var latestSaveSlug = slug.value;
        const tags = $1('#tags');
        const preview = $1('#preview');
        const saveButton = $1('#save-button');
        const deleteButton = $1('#delete-button');
        const viewButton = $1('#view-button');
        const buttonWrapper = $1('#button-wrapper');

        const linkWindow = $1('#link-window');
        const linkSearchWrapper = $1('#link-search-wrapper');
        const linkText = $1('#link-text');
        const linkUrl = $1('#link-url');
        const linkSearch = $1('#link-search');
        const linkButton = $1('#link-button');
        const linkSelectionStart = $1('#link-selection-start');
        const linkSelectionEnd = $1('#link-selection-end');
        const linkFinishButton = $1('#link-finish-button');
        const linkCancelButton = $1('#link-cancel-button');

        const update = function () {
            preview.innerHTML = marked(content.value);
            Prism.highlightAll();
        };
        const checkSlug = function (callback) {
            getAjax('http://localhost:3000/wiki/checkslug/' + slug.value, function (result) {
                callback(result);
            });
        };
        const applyStyle = function (fct) {
            const positions = getTextSelection(content);
            const calculatedEnd = positions.end + fct.delimiterStart.length + fct.addedLineBreaks;
            content.value = content.value.slice(0, positions.start) + fct.delimiterStart + content.value.slice(positions.start);
            content.value = content.value.slice(0, calculatedEnd) + fct.delimiterEnd + content.value.slice(calculatedEnd);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
        };
        const save = function (callback) {
            getAjax('http://localhost:3000/wiki/save/' + encodeURIComponent(title.value) + '/' + encodeURIComponent(slug.value) + '/' + encodeURIComponent(latestSaveSlug) + '/' + encodeURIComponent(tags.value) + '/' + encodeURIComponent(content.value), function (result) {
                callback(result);
            });
        };
        const saveCallback = function (result) {
            if (result === 'success') {
                latestSaveSlug = slug.value;
                viewButton.href = '/wiki/view/' + latestSaveSlug;
                saveButton.classList.remove('error');
                setDirty(false);
            } else {
                //error while saving
                saveButton.classList.add('error');
            }
            saveButton.classList.remove('saving');
        };
        const attemptSaving = function () {
            if (title.value.length > 0 && slug.value.length > 0 && content.value.length > 0 && title.value !== '{% block title %}' && slug.value !== '{% block slug %}' && tags.value !== '{% block tags %}' && content.value !== '{% block content %}') {
                saveButton.classList.add('saving');
                if (slug.value !== latestSaveSlug) {
                    checkSlug(function (result) {
                        if (result === 'free') {
                            save(saveCallback);
                        }
                    });
                } else {
                    save(saveCallback);
                }
            }
        };
        const setDirty = function (d) {
            dirty = d;
            if (dirty) {
                saveButton.innerText = 'Save Changes!';
                saveButton.classList.remove('success');
            } else {
                saveButton.innerText = 'Saved';
                saveButton.classList.add('success');
            }
        };
        const cancelLinkWindow = function () {
            linkWindow.classList.remove('visible');
            linkText.value = '';
            linkUrl.value = 'http://';
            linkSearch.value = '';
            linkSelectionStart.value = '';
            linkSelectionEnd.value = '';
        };
        const finishLinkWizard = function() {
            if (linkText.value.length <= 0) {
                linkText.classList.add('error');
                linkText.focus();
                return;
            }
            linkText.classList.remove('error');
            if (linkUrl.value.length <= 0) {
                linkUrl.classList.add('error');
                linkUrl.focus();
                return;
            }
            linkText.classList.remove('error');

            const calculatedEnd = parseInt(linkSelectionStart.value) + linkText.value.length + 1;
            console.log(calculatedEnd);
            content.value = content.value.slice(0, parseInt(linkSelectionStart.value)) + '[' + linkText.value + content.value.slice(parseInt(linkSelectionEnd.value));
            content.value = content.value.slice(0, calculatedEnd) + '](' + linkUrl.value + ')' + content.value.slice(calculatedEnd);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelLinkWindow();
        };

        window.addEventListener('beforeunload', function () {
            if (dirty) attemptSaving();
            return !dirty;
        });

        update();

        addEvent(title, 'input', function () {
            setDirty(true);
            slug.value = title.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
            if (slug.value !== latestSaveSlug) {
                checkSlug(function (result) {
                    if (result === 'free') {
                        slug.classList.remove('error');
                    } else {
                        slug.classList.add('error');
                    }
                });
            }
        });
        addEvent(slug, 'input', function () {
            setDirty(true);
            if (slug.value !== latestSaveSlug) {
                checkSlug(function (result) {
                    if (result === 'free') {
                        slug.classList.remove('error');
                    } else {
                        slug.classList.add('error');
                    }
                });
            } else {
                slug.classList.remove('error');
            }
        });
        addEvent(tags, 'input', function () {
            setDirty(true);
        });
        addEvent(content, 'input', function () {
            setDirty(true);
            update();
        });
        addEvent(content, 'keydown', function (e) {
            if (e.ctrlKey) {
                md.forEach(function (fct) {
                    if (e.keyCode === fct.keyCode && e.ctrlKey === fct.ctrlKey && e.shiftKey === fct.shiftKey) {
                        e.preventDefault();
                        applyStyle(fct);
                    }
                });
            }
        });
        addEvent(document, 'keydown', function (e) {
            if (e.keyCode === 83 && e.ctrlKey) {
                e.preventDefault();
                attemptSaving();
            }
            if (e.keyCode === 27) { //esc
                cancelLinkWindow();
            }
            if (linkWindow.classList.contains('visible') && e.keyCode === 13) { //enter
                e.preventDefault();
                finishLinkWizard();
            }
        });
        addEvent(saveButton, 'click', function (e) {
            e.preventDefault();
            attemptSaving();
        });
        addEvent(deleteButton, 'click', function (e) {
            e.preventDefault();
            const confirm = window.confirm('Are you sure you want to delete this entry?');
            if (!confirm) return;
            getAjax('http://localhost:3000/wiki/delete/' + latestSaveSlug, function (result) {
                if (result === 'success') {
                    location.href = 'http://localhost:3000/wiki/index';
                } else {
                    deleteButton.classList.add('error');
                }
            });
        });
        addEvent(linkSearch, 'input', function () {
            getAjax('http://localhost:3000/wiki/entries/' + encodeURIComponent(linkSearch.value), function (result) {
                linkSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>Title</strong></div></div>';
                result = JSON.parse(result);
                for (var i = 0, j = result.length; i < j; i++) {
                    const entry = result[i];
                    const row = document.createElement('div');
                    row.classList.add('row');
                    linkSearchWrapper.appendChild(row);

                    const col = document.createElement('div');
                    col.classList.add('col-12');
                    row.appendChild(col);

                    const a = document.createElement('a');
                    a.innerText = entry.title;
                    col.appendChild(a);

                    addEvent(a, 'click', function (e) {
                        e.preventDefault();
                        const text = linkText.value.length > 0 ? linkText.value : entry.title;
                        const calculatedEnd = parseInt(linkSelectionStart.value) + text.length + 1;
                        content.value = content.value.slice(0, parseInt(linkSelectionStart.value)) + '[' + text + content.value.slice(parseInt(linkSelectionEnd.value));
                        content.value = content.value.slice(0, calculatedEnd) + '](http://localhost:3000/wiki/view/' + entry.slug + ')' + content.value.slice(calculatedEnd);
                        content.setSelectionRange(calculatedEnd, calculatedEnd);
                        content.focus();
                        update();
                        cancelLinkWindow();
                    });
                }
            });
        });
        addEvent(linkButton, 'click', function () {
            const positions = getTextSelection(content);
            console.log(positions);
            linkSelectionStart.value = positions.start;
            linkSelectionEnd.value = positions.end;
            linkText.value = content.value.slice(positions.start, positions.end);
            linkWindow.classList.add('visible');
        });
        addEvent(linkFinishButton, 'click', function (e) {
            e.preventDefault();
            finishLinkWizard();
        });
        addEvent(linkCancelButton, 'click', function (e) {
            e.preventDefault();
            cancelLinkWindow();
        });

        md.forEach(function (fct) {
            const span = document.createElement('span');
            span.classList.add('icon');
            span.setAttribute('id', fct.name);
            span.setAttribute('title', (fct.ctrlKey ? 'Ctrl+' : '') + (fct.shiftKey ? 'Shift+' : '') + String.fromCharCode(fct.keyCode));
            span.textContent = fct.text;
            buttonWrapper.appendChild(span);
            buttonWrapper.innerHTML += ' ';

            addEvent(span, 'click', function () {
                applyStyle(fct);
            });
        });

        setInterval(attemptSaving, 2000);
    }
);