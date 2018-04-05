function $(selector, context) {
    return (context || document).querySelectorAll(selector);
}

function $1(selector, context) {
    return (context || document).querySelector(selector);
}

function addEvent(el, type, handler) {
    if (el.attachEvent) el.attachEvent('on' + type, handler); else el.addEventListener(type, handler);
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

    addEvent(searchForm, 'submit', function (e) {
        e.preventDefault();
        if (search.value.length === 0) return;
        location.href = 'http://localhost:' + PORT + '/wiki/index/' + search.value;
    });

    addEvent(document, 'keydown', function(e) {
        if(e.ctrlKey && e.keyCode === 70) { // Ctrl + F
            e.preventDefault();
            search.focus();
        }
    });
});