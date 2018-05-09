function getTextSelection(el) {
    let start = 0, end = 0, normalizedValue, range,
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

function debounce(func, interval) {
    let lastCall = -1;
    return function () {
        clearTimeout(lastCall);
        const args = arguments;
        const self = this;
        lastCall = setTimeout(function () {
            func.apply(self, args);
        }, interval);
    };
}

function getMouseEventCaretRange(evt) {
    let range, x = evt.clientX, y = evt.clientY;

    // Try the simple IE way first
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToPoint(x, y);
    }

    else if (typeof document.createRange !== "undefined") {
        // Try Mozilla's rangeOffset and rangeParent properties,
        // which are exactly what we want
        if (typeof evt.rangeParent !== "undefined") {
            range = document.createRange();
            range.setStart(evt.rangeParent, evt.rangeOffset);
            range.collapse(true);
        }

        // Try the standards-based way next
        else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(x, y);
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
        }

        // Next, the WebKit way
        else if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(x, y);
        }
    }

    return range;
}

function isOffScreen(el) {
    const rect = el.getBoundingClientRect();
    return (
        (rect.x + rect.width) < 0
        || (rect.y + rect.height) < 0
        || (rect.x > window.innerWidth || rect.y + rect.height > window.innerHeight)
    );
}


document.addEventListener('DOMContentLoaded', function () {
        const md = [
            {
                name: 'link',
                text: 'QuickLink',
                delimiterStart: '[',
                delimiterEnd: ']()',
                keyCode: 65,
                ctrlKey: true,
                shiftKey: false,
                endPositionNoSelection: 3,
                endPositionWithSelection: 1,
                displayButton: true,
            },
            {
                name: 'bold',
                text: 'Bold',
                delimiterStart: '**',
                delimiterEnd: '**',
                keyCode: 66,
                ctrlKey: true,
                shiftKey: false,
                endPositionNoSelection: 2,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'italic',
                text: 'Italic',
                delimiterStart: '_',
                delimiterEnd: '_',
                keyCode: 73,
                ctrlKey: true,
                shiftKey: false,
                endPositionNoSelection: 1,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'strikethrough',
                text: 'Strikethrough',
                delimiterStart: '~~',
                delimiterEnd: '~~',
                keyCode: 83,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 2,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'code',
                text: 'Code',
                delimiterStart: '`',
                delimiterEnd: '`',
                keyCode: 67,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 1,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'codeBlock',
                text: 'CodeBlock',
                delimiterStart: "```js\n",
                delimiterEnd: "\n```",
                keyCode: 75,
                ctrlKey: true,
                shiftKey: false,
                endPositionNoSelection: 4,
                endPositionWithSelection: 4,
                displayButton: true,
            },
            {
                name: 'blockquote',
                text: 'Blockquote',
                delimiterStart: "> ",
                delimiterEnd: "",
                keyCode: 81,
                ctrlKey: true,
                shiftKey: false,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h1',
                text: 'H1',
                delimiterStart: "# ",
                delimiterEnd: "",
                keyCode: 49,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h2',
                text: 'H2',
                delimiterStart: "## ",
                delimiterEnd: "",
                keyCode: 50,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h3',
                text: 'H3',
                delimiterStart: "### ",
                delimiterEnd: "",
                keyCode: 51,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h4',
                text: 'H4',
                delimiterStart: "#### ",
                delimiterEnd: "",
                keyCode: 52,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h5',
                text: 'H5',
                delimiterStart: "##### ",
                delimiterEnd: "",
                keyCode: 53,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: true,
            },
            {
                name: 'h6',
                text: 'H6',
                delimiterStart: "###### ",
                delimiterEnd: "",
                keyCode: 54,
                ctrlKey: true,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: false,
            },
            {
                name: 'tab',
                text: 'Tab',
                delimiterStart: '\t',
                delimiterEnd: '',
                keyCode: 9,
                ctrlKey: false,
                shiftKey: false,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: false,
                customCommand: function () {
                    const positions = getTextSelection(content);
                    if (positions.start === positions.end) { //insert tab at start position
                        content.value = content.value.slice(0, positions.start) + '\t' + content.value.slice(positions.start);
                        content.setSelectionRange(++positions.start, positions.start);
                    } else { //insert multiple tabs
                        const selectedLines = content.value.slice(positions.start, positions.end);
                        const numberOfLines = (selectedLines.match(/\n/g) || []).length + 1;
                        content.value = content.value.slice(0, positions.start) + selectedLines.replace(/^(.*)$/gm, '\t$1') + content.value.slice(positions.end);
                        content.setSelectionRange(positions.start, positions.end + numberOfLines);
                    }
                    content.focus();
                    update();
                }
            },
            {
                name: 'untab',
                text: 'Untab',
                delimiterStart: '',
                delimiterEnd: '',
                keyCode: 9,
                ctrlKey: false,
                shiftKey: true,
                endPositionNoSelection: 0,
                endPositionWithSelection: 0,
                displayButton: false,
                customCommand: function () {
                    const positions = getTextSelection(content);
                    if (positions.start > 0) {
                        if (positions.start === positions.end) { //remove tab before start position
                            if (content.value.slice(positions.start - 1, positions.start) === '\t') {
                                content.value = content.value.slice(0, positions.start - 1) + content.value.slice(positions.start);
                                content.setSelectionRange(--positions.start, positions.start);
                            }
                        } else { //delete multiple tabs
                            const selectedLines = content.value.slice(positions.start, positions.end);
                            const numberOfLines = (selectedLines.match(/\n/g) || []).length + 1;
                            content.value = content.value.slice(0, positions.start) + selectedLines.replace(/^\t(.*)$/gm, '$1') + content.value.slice(positions.end);
                            content.setSelectionRange(positions.start, positions.end - numberOfLines);
                        }
                        content.focus();
                        update();
                    }
                }
            }
        ];
        let dirty = false;
        const editor = $1('#editor');
        const displayActivator = $1('#display-activator');
        const editorActivator = $1('#editor-activator');
        const content = $1('#content');
        const title = $1('#title');
        const slug = $1('#slug');
        let latestSaveSlug = slug.value;
        const tags = $1('#tags');
        const preview = $1('#preview');
        const saveButton = $1('#save-button');
        const deleteButton = $1('#delete-button');
        const viewButton = $1('#view-button');
        const viewMaterialButton = $1('#view-material-button');
        const buttonWrapper = $1('#button-wrapper');
        const selectAllButton = $1('.select-all');

        //link wizard fields
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
        let linkSearchEntries = $('#link-search-wrapper .row');
        let linkSearchCurrentlyActive = -1;

        //image wizard fields
        const imageWindow = $1('#image-window');
        const imageText = $1('#image-text');
        const imageUrl = $1('#image-url');
        const imageSelectionStart = $1('#image-selection-start');
        const imageSelectionEnd = $1('#image-selection-end');
        const imageTimestamp = $1('#image-timestamp');
        const imageQuality = $1('#image-quality');
        const imageContainer = $1('#image-container');
        const imageFinishButton = $1('#image-finish-button');
        const imageCancelButton = $1('#image-cancel-button');
        const imageDownloadButton = $1('#image-download-button');
        const imageDeleteButton = $1('#image-delete-button');
        const imageButton = $1('#image');

        //Youtube wizard fields
        const youtubeWindow = $1('#youtube-window');
        const youtubeText = $1('#youtube-text');
        const youtubeUrl = $1('#youtube-url');
        const youtubeSelectionStart = $1('#youtube-selection-start');
        const youtubeSelectionEnd = $1('#youtube-selection-end');
        const youtubeFinishButton = $1('#youtube-finish-button');
        const youtubeCancelButton = $1('#youtube-cancel-button');
        const youtubeButton = $1('#youtube');

        //related wizard fields
        const relatedWindow = $1('#related-window');
        const relatedSearchWrapper = $1('#related-search-wrapper');
        const relatedSearch = $1('#related-search');
        const relatedButton = $1('#related');
        const relatedSelectionStart = $1('#related-selection-start');
        const relatedSelectionEnd = $1('#related-selection-end');
        const relatedFinishButton = $1('#related-finish-button');
        const relatedCancelButton = $1('#related-cancel-button');
        let relatedSearchEntries = $('#related-search-wrapper .row');
        let relatedSearchCurrentlyActive = -1;

        //Color wizard fields
        const colorWindow = $1('#color-window');
        const customColor = $1('#custom-color');
        const colorSelectionStart = $1('#color-selection-start');
        const colorSelectionEnd = $1('#color-selection-end');
        const colorFinishButton = $1('#color-finish-button');
        const colorCancelButton = $1('#color-cancel-button');
        const colorButton = $1('#color');
        const colorButtons = $('.button.color');
        let colorCurrentlyActive = -1;

        const update = function () {
            preview.innerHTML = marked(content.value);
            preview.innerHTML = preview.innerHTML.replace(/\s(href|alt|id)=".*?"/g, '');
            Prism.highlightAll();
            debounce(setCursor, 200)();
        };
        const setCursor = function () {
            const positions = getTextSelection(content);
            let originalText = content.value.substr(0, positions.start);

            //do a first markdown to html conversion to get trailing, unconverted markdown elements (e.g., ** without counterpart)
            let translatedText = marked(originalText).trim();

            //search for unmatched (elements without closing partner) markdown elements
            const matches = translatedText.replace(/\s(src|href)=".+?"/g, '').match(/(\[(.*)])|\[.+](\().*$|(\[)|(~~)|(\*\*\*)|(\*\*)|(___)|(_)|(```)|(`)/g);
            if (matches != null) {
                //close elements in reverse order by appending to the original text
                matches.reverse().forEach(function (markdown) {
                    if (markdown.match(/\[.+]\(.*/)) markdown = ')';
                    if (markdown.match(/\[.*]/)) markdown = '()';
                    if (markdown.match(/\[.*/)) markdown = ']()';
                    originalText += markdown;
                });
            }

            //do a second markdown to html conversion, this time with all tags properly closed
            translatedText = marked(originalText).trim();

            //get rid of links, ids and alternative texts (they are not important for the display of elements and they get in the way of cursor placement)
            translatedText = translatedText.replace(/\s(href|alt|id)=".*?"/g, '');

            //prepare line breaks
            translatedText = translatedText.replace(/<br\/>/g, '<br>');

            //prepare prism
            translatedText = translatedText.replace(/<pre><code class="lang-(.+)">/g, '<pre class=" language-$1"><code class=" language-$1">');

            //use prism
            translatedText = translatedText.replace(/<pre class="\s?language-([a-zA-Z0-9]+)"><code class="\s?language-[a-zA-Z0-9]+">([\s\S]*)<\/code><\/pre>/g, function (match, language, code) {
                return '<pre class=" language-' + language + '"><code class=" language-' + language + '">' + Prism.highlight(code, Prism.languages[language], language).trim() + '</code></pre>';
            });

            //get rid of trailing closing tags
            while (translatedText.match(/<\/[a-zA-Z0-9]{1,10}>$/)) translatedText = translatedText.replace(/<\/[a-zA-Z0-9]{1,10}>$/, '').trim();

            //ensure that cursor is not in an HTML tag
            const prevHtml = preview.innerHTML;
            const prevHtmlLength = prevHtml.length;
            let cursorPosition = translatedText.length - 1;
            let opened = 0;
            const countOpened = function (i) {
                if (prevHtml[i] === '<') {
                    opened++;
                } else if (prevHtml[i] === '>') {
                    opened--;
                }
            };
            do {
                opened = 0;
                cursorPosition++;
                if (cursorPosition > prevHtmlLength / 2) {
                    for (let i = prevHtmlLength - 1; i >= cursorPosition; i--) countOpened(i)
                } else {
                    for (let i = 0; i < cursorPosition; i++) countOpened(i);
                }
            } while (opened !== 0 && cursorPosition <= prevHtmlLength);

            //remove any set cursors and set new cursor
            const cursorHtml = cursorPosition === 0 ? '<p><span id="cursor"></span></p>' : '<span id="cursor"></span>';
            preview.innerHTML = preview.innerHTML.slice(0, cursorPosition) + cursorHtml + preview.innerHTML.slice(cursorPosition);

            const cursor = $1('#cursor', preview);
            if (isOffScreen(cursor)) debounce(scrollIt(cursor), 200);
        };
        const checkSlug = function (callback) {
            getAjax('http://localhost:' + PORT + '/wiki/checkslug/' + slug.value, function (result) {
                callback(result);
            });
        };
        const applyStyle = function (fct) {
            if (fct.customCommand !== undefined) {
                fct.customCommand();
            } else {
                const positions = getTextSelection(content);
                const calculatedSecondPartStart = positions.end + fct.delimiterStart.length;
                content.value = content.value.slice(0, positions.start) + fct.delimiterStart + content.value.slice(positions.start);
                content.value = content.value.slice(0, calculatedSecondPartStart) + fct.delimiterEnd + content.value.slice(calculatedSecondPartStart);
                const calculatedEndPosition = positions.end + fct.delimiterStart.length + fct.delimiterEnd.length - (positions.start === positions.end ?
                                                                                                                     fct.endPositionNoSelection :
                                                                                                                     fct.endPositionWithSelection);
                content.setSelectionRange(calculatedEndPosition, calculatedEndPosition);
                content.focus();
                update();
            }
        };
        const save = function (callback) {
            getAjax('http://localhost:' + PORT + '/wiki/save/' + encodeURIComponent(title.value) + '/' + encodeURIComponent(slug.value) + '/' + encodeURIComponent(latestSaveSlug) + '/' + encodeURIComponent(tags.value) + '/' + encodeURIComponent(content.value), function (result) {
                callback(result);
            });
        };
        const saveCallback = function (result) {
            if (result === 'success') {
                latestSaveSlug = slug.value;
                viewButton.href = '/wiki/view/' + latestSaveSlug;
                viewMaterialButton.href = '/wiki/view/' + latestSaveSlug;
                saveButton.classList.remove('error');
                setDirty(false);
            } else {
                //error while saving
                saveButton.classList.add('error');
            }
            saveButton.classList.remove('saving');
        };
        const attemptSaving = function () {
            saveButton.classList.remove('error');
            if (title !== document.activeElement && slug !== document.activeElement && title.value.length > 0 && slug.value.length > 0 && content.value.length > 0 && title.value !== '{% block title %}' && slug.value !== '{% block slug %}' && tags.value !== '{% block tags %}' && content.value !== '{% block content %}') {
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
            } else {
                saveButton.classList.add('error');
            }
        };
        const setDirty = function (d) {
            dirty = d;
            if (dirty) {
                saveButton.innerText = 'Save Changes!';
                saveButton.classList.remove('success');
                window.onbeforeunload = () => true;
            } else {
                saveButton.innerText = 'Saved';
                saveButton.classList.add('success');
                window.onbeforeunload = null;
            }
        };
        const openLinkWindow = function () {
            const positions = getTextSelection(content);
            linkSelectionStart.value = positions.start;
            linkSelectionEnd.value = positions.end;
            linkText.value = content.value.slice(positions.start, positions.end);
            linkWindow.classList.add('visible');
            linkText.focus();
            linkSearchCurrentlyActive = -1;
        };
        const cancelLinkWindow = function () {
            linkWindow.classList.remove('visible');
            linkText.value = '';
            linkUrl.value = 'http://';
            linkSearch.value = '';
            linkSelectionStart.value = '';
            linkSelectionEnd.value = '';
            linkSearchWrapper.innerHTML = '';
            content.focus();
        };
        const finishLinkWizardWithSearchResult = function (entry) {
            const text = linkText.value.length > 0 ? linkText.value : entry.getAttribute('data-title');
            const link = '](wiki/view/' + entry.getAttribute('data-slug') + ')';
            const calculatedSecondPartStart = parseInt(linkSelectionStart.value) + text.length + 1;
            const calculatedEnd = calculatedSecondPartStart + link.length;
            content.value = content.value.slice(0, parseInt(linkSelectionStart.value)) + '[' + text + content.value.slice(parseInt(linkSelectionEnd.value));
            content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelLinkWindow();
        };
        const finishLinkWizard = function () {
            const activatedSearchResult = $1('#link-search-wrapper .row.active');
            if (activatedSearchResult != null) {
                finishLinkWizardWithSearchResult(activatedSearchResult);
                return;
            }
            if (linkText.value.length <= 0) {
                linkText.classList.add('error');
                linkText.focus();
                return;
            }
            linkText.classList.remove('error');
            if (linkUrl.value.length <= 0 || linkUrl.value === 'http://') {
                linkUrl.classList.add('error');
                linkUrl.focus();
                return;
            }
            linkUrl.classList.remove('error');

            const text = '[' + linkText.value;
            const link = '](' + linkUrl.value + ')';
            const calculatedSecondPartStart = parseInt(linkSelectionStart.value) + text.length;
            const calculatedEnd = calculatedSecondPartStart + link.length;
            content.value = content.value.slice(0, parseInt(linkSelectionStart.value)) + text + content.value.slice(parseInt(linkSelectionEnd.value));
            content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelLinkWindow();
        };
        const openImageWindow = function () {
            const positions = getTextSelection(content);
            imageTimestamp.value = Date.now();
            imageSelectionStart.value = positions.start;
            imageSelectionEnd.value = positions.end;
            imageText.value = content.value.slice(positions.start, positions.end);
            imageWindow.classList.add('visible');
            imageText.focus();
        };
        const cancelImageWindow = function () {
            imageWindow.classList.remove('visible');
            imageText.value = '';
            imageUrl.value = 'http://';
            imageSelectionStart.value = '';
            imageSelectionEnd.value = '';
            imageTimestamp.value = '';
            imageContainer.innerHTML = '';
            imageDownloadButton.classList.remove('error');
            imageDownloadButton.classList.remove('downloading');
            imageDeleteButton.classList.remove('deleting');
            imageDeleteButton.classList.remove('error');
            content.focus();
        };
        const finishImageWizard = function () {
            if (imageText.value.length <= 0) {
                imageText.classList.add('error');
                imageText.focus();
                return;
            }
            imageText.classList.remove('error');
            if (imageUrl.value.length <= 0 || imageUrl.value === 'http://') {
                imageUrl.classList.add('error');
                imageUrl.focus();
                return;
            }
            imageUrl.classList.remove('error');

            const text = '[![' + imageText.value;
            const link = '](' + imageUrl.value + ')](' + imageUrl.value + ')';
            const calculatedSecondPartStart = parseInt(imageSelectionStart.value) + text.length;
            const calculatedEnd = calculatedSecondPartStart + link.length;
            content.value = content.value.slice(0, parseInt(imageSelectionStart.value)) + text + content.value.slice(parseInt(imageSelectionEnd.value));
            content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelImageWindow();
        };
        const openYoutubeWindow = function () {
            const positions = getTextSelection(content);
            youtubeSelectionStart.value = positions.start;
            youtubeSelectionEnd.value = positions.end;
            youtubeText.value = content.value.slice(positions.start, positions.end);
            youtubeWindow.classList.add('visible');
            youtubeText.focus();
        };
        const cancelYoutubeWindow = function () {
            youtubeWindow.classList.remove('visible');
            youtubeText.value = '';
            youtubeUrl.value = '';
            youtubeSelectionStart.value = '';
            youtubeSelectionEnd.value = '';
            content.focus();
        };
        const finishYoutubeWizard = function () {
            if (youtubeText.value.length <= 0) {
                youtubeText.classList.add('error');
                youtubeText.focus();
                return;
            }
            youtubeText.classList.remove('error');
            if (youtubeUrl.value.length <= 0 || youtubeUrl.value === 'http://') {
                youtubeUrl.classList.add('error');
                youtubeUrl.focus();
                return;
            }
            youtubeUrl.classList.remove('error');

            const text = '[![' + youtubeText.value;
            const link = '](http://img.youtube.com/vi/' + youtubeUrl.value.match(/\?v=([a-zA-Z0-9\-_]+)/)[1] + '/0.jpg)](' + youtubeUrl.value + ')';
            const calculatedSecondPartStart = parseInt(youtubeSelectionStart.value) + text.length;
            const calculatedEnd = calculatedSecondPartStart + link.length;
            content.value = content.value.slice(0, parseInt(youtubeSelectionStart.value)) + text + content.value.slice(parseInt(youtubeSelectionEnd.value));
            content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelYoutubeWindow();
        };
        const openRelatedWindow = function () {
            const positions = getTextSelection(content);
            relatedSelectionStart.value = positions.start;
            relatedSelectionEnd.value = positions.end;
            relatedWindow.classList.add('visible');
            relatedSearch.focus();
            relatedSearchCurrentlyActive = 1;
        };
        const cancelRelatedWindow = function () {
            relatedWindow.classList.remove('visible');
            relatedSearch.value = '';
            relatedSelectionStart.value = '';
            relatedSelectionEnd.value = '';
            relatedSearchWrapper.innerHTML = '';
            content.focus();
        };
        const finishRelatedWizard = function (entry) {
            const text = '<a class="related" href="wiki/view/' + entry.getAttribute('data-slug') + '">' + entry.getAttribute('data-title') + '</a>';
            const calculatedEnd = parseInt(relatedSelectionStart.value) + text.length;
            content.value = content.value.slice(0, parseInt(relatedSelectionStart.value)) + text + content.value.slice(parseInt(relatedSelectionStart.value));
            content.setSelectionRange(calculatedEnd, calculatedEnd);
            content.focus();
            update();
            cancelRelatedWindow();
        };

        const openColorWindow = function () {
            const positions = getTextSelection(content);
            colorSelectionStart.value = positions.start;
            colorSelectionEnd.value = positions.end;
            colorWindow.classList.add('visible');
            customColor.setSelectionRange(0, customColor.value.length);
            customColor.focus();
        };
        const cancelColorWindow = function () {
            colorWindow.classList.remove('visible');
            colorSelectionStart.value = '';
            colorSelectionEnd.value = '';
            content.focus();
        };
        const finishColorWizard = function () {
            colorFinishButton.classList.remove('error');
            if (!customColor.value.match(/#([a-zA-Z0-9]{3}|[a-zA-Z0-9]{4}|[a-zA-Z0-9]{6}|[a-zA-Z0-9]{8})$/g)) {
                colorFinishButton.classList.add('error');
                return;
            }
            const firstPart = '<span style="color: ' + customColor.value + '">';
            const secondPart = '</span>';
            const calculatedSecondPartStart = parseInt(colorSelectionEnd.value) + firstPart.length;
            content.value = content.value.slice(0, parseInt(colorSelectionStart.value)) + firstPart + content.value.slice(parseInt(colorSelectionStart.value));
            content.value = content.value.slice(0, calculatedSecondPartStart) + secondPart + content.value.slice(calculatedSecondPartStart);
            content.setSelectionRange(parseInt(colorSelectionStart.value) + firstPart.length, parseInt(colorSelectionEnd.value) + firstPart.length);
            content.focus();
            update();
            cancelColorWindow();
        };
        const updateColorButtons = function () {
            colorButtons.forEach(button => button.classList.remove('active'));
            colorButtons[colorCurrentlyActive].classList.add('active');
            customColor.value = colorButtons[colorCurrentlyActive].getAttribute('data-hex');
            customColor.setSelectionRange(0, customColor.value.length);
            customColor.focus();
        };

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
            if (title.value.length <= 0) {
                title.classList.add('error');
            } else {
                title.classList.remove('error');
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
            if (e.ctrlKey || e.keyCode === 9) { //ctrl key or tab
                md.forEach(function (fct) {
                    if (e.keyCode === fct.keyCode && e.ctrlKey === fct.ctrlKey && e.shiftKey === fct.shiftKey) {
                        e.preventDefault();
                        applyStyle(fct);
                    }
                });
                if (e.shiftKey && e.keyCode === 65) { //Shift + A
                    e.preventDefault();
                    openLinkWindow();
                }
                if (e.shiftKey && e.keyCode === 80) { //Shift + P
                    e.preventDefault();
                    openColorWindow();
                }
                if (e.shiftKey && e.keyCode === 89) { //Shift + Y
                    e.preventDefault();
                    openYoutubeWindow();
                }
                if (e.shiftKey && e.keyCode === 73) { //Shift + I
                    e.preventDefault();
                    openImageWindow();
                }
                if (e.keyCode === 82) { //R
                    e.preventDefault();
                    openRelatedWindow();
                }
            }
        });
        addEvent(content, 'keyup', function (e) {
            if (e.keyCode >= 33 && e.keyCode <= 40) update();
        });
        addEvent(content, 'click', update);
        addEvent(document, 'keydown', function (e) {
            if (e.keyCode === 9 && content === document.activeElement) { //tab
                e.preventDefault();
            }
            if (e.keyCode === 83 && e.ctrlKey) {
                e.preventDefault();
                attemptSaving();
            }
            if (e.keyCode === 27) { //esc
                e.preventDefault();
                cancelLinkWindow();
                cancelImageWindow();
                cancelYoutubeWindow();
                cancelRelatedWindow();
                cancelColorWindow();
            }
            if (linkWindow.classList.contains('visible') && e.keyCode === 13) { //enter
                e.preventDefault();
                finishLinkWizard();
            }
            if (imageWindow.classList.contains('visible') && e.keyCode === 13) { //enter
                e.preventDefault();
                finishImageWizard();
            }
            if (youtubeWindow.classList.contains('visible') && e.keyCode === 13) { //enter
                e.preventDefault();
                finishYoutubeWizard();
            }
            if (relatedWindow.classList.contains('visible') && e.keyCode === 13) { //enter
                e.preventDefault();
                const activatedSearchResult = $1('#related-search-wrapper .row.active');
                if (activatedSearchResult != null) {
                    finishRelatedWizard(activatedSearchResult);
                }
            }
            if (colorWindow.classList.contains('visible')) {
                switch (e.keyCode) {
                    case 13: //enter
                        e.preventDefault();
                        finishColorWizard();
                        break;
                    case 40: //down
                        e.preventDefault();
                        if (++colorCurrentlyActive >= colorButtons.length) colorCurrentlyActive = 0;
                        updateColorButtons();
                        break;
                    case 38: //up
                        e.preventDefault();
                        if (--colorCurrentlyActive < 0) colorCurrentlyActive = colorButtons.length - 1;
                        updateColorButtons();
                        break;
                }
            }
        });
        addEvent(document, 'scroll', function () {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 240) {
                editor.style.top = '0';
            } else {
                editor.style.top = 240 - scrollTop + 'px';
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
            getAjax('http://localhost:' + PORT + '/wiki/delete/' + latestSaveSlug, function (result) {
                if (result === 'success') {
                    location.href = 'http://localhost:' + PORT + '/wiki/index';
                } else {
                    deleteButton.classList.add('error');
                }
            });
        });
        addEvent(linkSearch, 'input', function () {
            getAjax('http://localhost:' + PORT + '/wiki/entries/' + encodeURIComponent(linkSearch.value), function (result) {
                linkSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>Title</strong></div></div>';
                result = JSON.parse(result);
                for (let i = 0, j = result.length; i < j; i++) {
                    const entry = result[i];
                    const row = document.createElement('div');
                    row.classList.add('row');
                    row.setAttribute('data-title', entry.title);
                    row.setAttribute('data-slug', entry.slug);
                    linkSearchWrapper.appendChild(row);

                    const col = document.createElement('div');
                    col.classList.add('col-12');
                    row.appendChild(col);

                    const a = document.createElement('a');
                    a.innerText = entry.title;
                    col.appendChild(a);

                    addEvent(a, 'click', e => {
                        e.preventDefault();
                        finishLinkWizardWithSearchResult(row);
                    });
                }
                linkSearchEntries = $('#link-search-wrapper .row');
            });
        });
        addEvent(linkButton, 'click', openLinkWindow);
        addEvent(linkFinishButton, 'click', e => {
            e.preventDefault();
            finishLinkWizard();
        });
        addEvent(linkCancelButton, 'click', e => {
            e.preventDefault();
            cancelLinkWindow();
        });
        addEvent(linkSearch, 'keydown', e => {
            if (e.keyCode >= 37 && e.keyCode <= 40) {
                if (linkSearchCurrentlyActive === -1) {
                    linkSearchCurrentlyActive = 1;
                } else if (e.keyCode === 39 || e.keyCode === 40) { //right/down arrow
                    if (++linkSearchCurrentlyActive >= linkSearchEntries.length) {
                        linkSearchCurrentlyActive = 1;
                    }
                } else if (e.keyCode === 37 || e.keyCode === 38) { //left/up arrow
                    if (--linkSearchCurrentlyActive <= 0) {
                        linkSearchCurrentlyActive = linkSearchEntries.length - 1;
                    }
                }
                linkSearchEntries.forEach(row => row.classList.remove('active'));
                linkSearchEntries[linkSearchCurrentlyActive].classList.add('active');
                e.preventDefault();
            }
        });
        addEvent(imageButton, 'click', openImageWindow);
        addEvent(imageFinishButton, 'click', function (e) {
            e.preventDefault();
            finishImageWizard();
        });
        addEvent(imageCancelButton, 'click', function (e) {
            e.preventDefault();
            cancelImageWindow();
        });
        addEvent(imageDownloadButton, 'click', function (e) {
            e.preventDefault();
            if (imageUrl.value.length <= 0 || imageUrl.value === 'http://') {
                imageUrl.classList.add('error');
                return;
            }
            imageUrl.classList.remove('error');
            imageDownloadButton.classList.remove('error');
            imageDownloadButton.classList.add('downloading');
            imageDownloadButton.innerText = "Downloading";
            imageContainer.innerHTML = '';
            imageDeleteButton.classList.remove('visible');
            getAjax('http://localhost:' + PORT + '/wiki/download/' + encodeURIComponent(imageUrl.value) + '/' + imageTimestamp.value + '/' + imageQuality.value, function (result) {
                imageDownloadButton.classList.remove('downloading');
                imageDownloadButton.innerText = "Save Image Locally";
                if (result === 'error') {
                    imageDownloadButton.classList.add('error');
                    return;
                }
                imageDownloadButton.classList.remove('error');
                const imagePath = 'http://localhost:' + PORT + '/wiki/img/' + imageTimestamp.value + '.jpg';
                const a = document.createElement('a');
                a.target = '_blank';
                a.href = imagePath;
                imageContainer.appendChild(a);

                const img = document.createElement('img');
                img.src = imagePath;
                a.appendChild(img);

                imageUrl.value = imagePath;
                imageDeleteButton.classList.add('visible');
            });
        });
        addEvent(imageDeleteButton, 'click', function (e) {
            e.preventDefault();
            imageDeleteButton.classList.add('deleting');
            getAjax('http://localhost:' + PORT + '/wiki/deleteImage/' + imageTimestamp.value, function (result) {
                imageDeleteButton.classList.remove('deleting');
                if (result === 'error') {
                    imageDeleteButton.classList.add('error');
                } else {
                    imageContainer.innerHTML = '';
                    imageDeleteButton.classList.remove('visible');
                    imageDeleteButton.classList.remove('error');
                }
            });
        });
        addEvent(youtubeButton, 'click', openYoutubeWindow);
        addEvent(youtubeFinishButton, 'click', function (e) {
            e.preventDefault();
            finishYoutubeWizard();
        });
        addEvent(youtubeCancelButton, 'click', function (e) {
            e.preventDefault();
            cancelYoutubeWindow();
        });
        addEvent(selectAllButton, 'click', function (e) {
            e.preventDefault();
            content.setSelectionRange(0, content.value.length);
            content.focus();
        });
        addEvent(relatedSearch, 'input', function () {
            getAjax('http://localhost:' + PORT + '/wiki/entries/' + encodeURIComponent(relatedSearch.value), function (result) {
                relatedSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>Title</strong></div></div>';
                result = JSON.parse(result);
                for (let i = 0, j = result.length; i < j; i++) {
                    const entry = result[i];
                    const row = document.createElement('div');
                    row.classList.add('row');
                    row.setAttribute('data-title', entry.title);
                    row.setAttribute('data-slug', entry.slug);
                    relatedSearchWrapper.appendChild(row);

                    const col = document.createElement('div');
                    col.classList.add('col-12');
                    row.appendChild(col);

                    const a = document.createElement('a');
                    a.innerText = entry.title;
                    col.appendChild(a);

                    addEvent(a, 'click', function (e) {
                        e.preventDefault();
                        finishRelatedWizard(row);
                    });
                }
                relatedSearchEntries = $('#related-search-wrapper .row');
            });
        });
        addEvent(relatedSearch, 'keydown', function (e) {
            if (e.keyCode >= 37 && e.keyCode <= 40) {
                if (relatedSearchCurrentlyActive === -1) {
                    relatedSearchCurrentlyActive = 1;
                } else if (e.keyCode === 39 || e.keyCode === 40) { //right/down arrow
                    if (++relatedSearchCurrentlyActive >= relatedSearchEntries.length) {
                        relatedSearchCurrentlyActive = 1;
                    }
                } else if (e.keyCode === 37 || e.keyCode === 38) { //left/up arrow
                    if (--relatedSearchCurrentlyActive <= 0) {
                        relatedSearchCurrentlyActive = relatedSearchEntries.length - 1;
                    }
                }
                relatedSearchEntries.forEach(row => row.classList.remove('active'));
                relatedSearchEntries[relatedSearchCurrentlyActive].classList.add('active');
                e.preventDefault();
            }
        });
        addEvent(relatedButton, 'click', openRelatedWindow);
        addEvent(relatedFinishButton, 'click', function (e) {
            e.preventDefault();
            const activatedSearchResult = $1('#related-search-wrapper .row.active');
            if (activatedSearchResult == null) return;
            finishRelatedWizard(activatedSearchResult);
        });
        addEvent(relatedCancelButton, 'click', function (e) {
            e.preventDefault();
            cancelRelatedWindow();
        });
        addEvent(colorButton, 'click', openColorWindow);
        addEvent(colorFinishButton, 'click', function (e) {
            e.preventDefault();
            finishColorWizard();
        });
        addEvent(colorCancelButton, 'click', function (e) {
            e.preventDefault();
            cancelColorWindow();
        });
        addEvent(customColor, 'input', function () {
            colorCurrentlyActive = -1;
            colorButtons.forEach(button => button.classList.remove('active'));
        });

        addEvent(displayActivator, 'mouseover', function () {
            editor.style['z-index'] = '0';
        });
        addEvent(editorActivator, 'mouseover', function () {
            editor.style['z-index'] = '1';
        });
        addEvent(preview, 'click', function (e) {
            const search = getMouseEventCaretRange(e).endContainer.data;
            const contentPosition = content.value.indexOf(search);
            content.setSelectionRange(contentPosition, contentPosition);
            content.focus();
        });

        md.filter(fct => fct.displayButton).forEach(function (fct) {
            const span = document.createElement('span');
            span.classList.add('icon');
            span.setAttribute('id', fct.name);
            span.setAttribute('title', (fct.ctrlKey ? 'Ctrl+' : '') + (fct.shiftKey ? 'Shift+' : '') + String.fromCharCode(fct.keyCode));
            span.textContent = fct.text;
            buttonWrapper.appendChild(span);

            const divider = document.createElement('span');
            divider.textContent = ' ';
            buttonWrapper.appendChild(divider);

            addEvent(span, 'click', () => applyStyle(fct));
        });

        setInterval(attemptSaving, 2000);

        for (let i = 1; i <= 10; i++) {
            const option = document.createElement('option');
            option.text = i * 10 + '%';
            option.value = '' + i * 10;
            imageQuality.appendChild(option);
        }
        imageQuality.value = '60';

        content.focus();
    }
);