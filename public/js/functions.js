String.prototype.hashCode = function () {
    let hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return '_' + Math.abs(hash);
};

function getNextSibling(row) {
    while((row = row.nextElementSibling) !== null && row.classList.contains('deleted')) {}
    return row;
}

function getPreviousSibling(row) {
    while((row = row.previousElementSibling) !== null && row.classList.contains('deleted')) {}
    return row;
}

function fileSizeConverter(size) {
    let counter = 0;
    while (size > 1024) {
        size /= 1024;
        counter++;
    }
    return size.toFixed(2) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][counter];
}

function scrollIt(destination, duration = 200, easing = 'linear', callback) {
    const easings = {
        linear(t) {
            return t;
        },
        easeInQuad(t) {
            return t * t;
        },
        easeOutQuad(t) {
            return t * (2 - t);
        },
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },
        easeInCubic(t) {
            return t * t * t;
        },
        easeOutCubic(t) {
            return (--t) * t * t + 1;
        },
        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        },
        easeInQuart(t) {
            return t * t * t * t;
        },
        easeOutQuart(t) {
            return 1 - (--t) * t * t * t;
        },
        easeInOutQuart(t) {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        },
        easeInQuint(t) {
            return t * t * t * t * t;
        },
        easeOutQuint(t) {
            return 1 + (--t) * t * t * t * t;
        },
        easeInOutQuint(t) {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
        }
    };

    const start = window.pageYOffset;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
    const destinationOffset = typeof destination === 'number' ? destination :
                              destination.getBoundingClientRect().top + document.body.scrollTop - 200;
    const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight :
                                                 destinationOffset);

    if ('requestAnimationFrame' in window === false) {
        window.scroll(0, destinationOffsetToScroll);
        if (callback) {
            callback();
        }
        return;
    }

    function scroll() {
        const now = 'now' in window.performance ? performance.now() : new Date().getTime();
        const time = Math.min(1, ((now - startTime) / duration));
        const timeFunction = easings[easing](time);
        window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

        if (window.pageYOffset === destinationOffsetToScroll) {
            if (callback) {
                callback();
            }
            return;
        }

        requestAnimationFrame(scroll);
    }

    scroll();
}

function $(selector, context) {
    return (context || document).querySelectorAll(selector);
}

function $1(selector, context) {
    return (context || document).querySelector(selector);
}

function addEvent(el, type, handler) {
    const addEvent = function (eventName) {
        if (el.attachEvent) el.attachEvent('on' + eventName, handler); else el.addEventListener(eventName, handler);
    };
    if (type.constructor === Array) {
        type.forEach(t => addEvent(t))
    } else {
        addEvent(type);
    }
}

function getAjax(url, success) {
    const xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
        if (xhr.readyState > 3 && xhr.status === 200) {
            success(xhr.responseText);
        }
    };
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send();
    return xhr;
}


document.addEventListener('DOMContentLoaded', function () {
    const searchForm = $1('#search-form');
    const search = $1('#search');
    const deleteSearchButton = $1('#delete-search');
    const header = $1('header');
    const scrollObject = {x: 0, y: 0};

    addEvent(searchForm, 'submit', function (e) {
        e.preventDefault();
        if (search.value.length === 0) return;
        let c;
        if ((c = /^files?:(.+)/.exec(search.value))) {
            location.href = '/wiki/attachments/' + c[1];
        } else if ((c = /^entries:(.+)/.exec(search.value))) {
            location.href = '/wiki/index/' + c[1];
        } else {
            if(location.pathname.startsWith("/wiki/attachments")) {
	            location.href = '/wiki/attachments/' + search.value;
            } else {
	            location.href = '/wiki/index/' + search.value;
            }
        }
    });
    addEvent(search, 'input', function () {
        if (search.value.length > 0) {
            deleteSearchButton.classList.add('visible');
        } else {
            deleteSearchButton.classList.remove('visible');
        }
    });
    addEvent(deleteSearchButton, 'click', function () {
        search.value = '';
    });
    addEvent(document, 'keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.keyCode === 70) { // Ctrl + Shift + F
            e.preventDefault();
            search.setSelectionRange(0, search.value.length);
            search.focus();
        }
    });
    addEvent(window, 'scroll', function () {
        if (scrollObject.y < window.pageYOffset)
            header.classList.add('hide');
        else
            header.classList.remove('hide');

        scrollObject.x = window.pageXOffset;
        scrollObject.y = window.pageYOffset;
    });
});