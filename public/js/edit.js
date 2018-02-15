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
                text: 'Link',
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
                shiftKey: true
            },
            {
                name: 'codeBlock',
                text: 'Code Block',
                delimiterStart: "\n```js\n",
                delimiterEnd: "\n```",
                addedLineBreaks: 3,
                keyCode: 75,
                ctrlKey: true,
                shiftKey: true
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
            {name: 'h1', text: 'H1', delimiterStart: "\n# ", delimiterEnd: "", addedLineBreaks: 1, keyCode: 49, ctrlKey: true, shiftKey: true},
            {name: 'h2', text: 'H2', delimiterStart: "\n## ", delimiterEnd: "", addedLineBreaks: 1, keyCode: 50, ctrlKey: true, shiftKey: true},
            {
                name: 'h3',
                text: 'H3',
                delimiterStart: "\n### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 51,
                ctrlKey: true,
                shiftKey: true
            },
            {
                name: 'h4',
                text: 'H4',
                delimiterStart: "\n#### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 52,
                ctrlKey: true,
                shiftKey: true
            },
            {
                name: 'h5',
                text: 'H5',
                delimiterStart: "\n##### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 53,
                ctrlKey: true,
                shiftKey: true
            },
            {
                name: 'h6',
                text: 'H6',
                delimiterStart: "\n###### ",
                delimiterEnd: "",
                addedLineBreaks: 1,
                keyCode: 54,
                ctrlKey: true,
                shiftKey: true
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
            getAjax('http://localhost:3000/wiki/save/' + title.value + '/' + slug.value + '/' + latestSaveSlug + '/' + tags.value + '/' + encodeURI(content.value.replace(/#/g, '||')), function (result) {
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
                        applyStyle(fct);
                    }
                });
            }
        });

        addEvent(document, 'keydown', function (e) {
            if (e.keyCode === 83 && e.ctrlKey && e.shiftKey) {
                attemptSaving();
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

        md.forEach(function (fct) {
            const span = document.createElement('span');
            span.classList.add('icon');
            span.setAttribute('id', fct.name);
            span.setAttribute('title', (fct.ctrlKey ? 'Ctrl+' : '') + (fct.shiftKey ? 'Shift+' : '') + String.fromCharCode(fct.keyCode));
            span.textContent = fct.text;
            content.parentNode.insertBefore(span, content);

            addEvent(span, 'click', function () {
                applyStyle(fct);
            });
        });

        setInterval(attemptSaving, 2000);
    }
);