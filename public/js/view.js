function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text);
}

document.addEventListener('DOMContentLoaded', function () {
    const codeArray = [];
    const deleteButton = $1('.delete');
    const deleteEntry = function () {
        const confirm = window.confirm('Are you sure you want to delete this entry?');
        if (!confirm) return;
        getAjax('http://localhost:' + PORT + '/wiki/delete/' + deleteButton.getAttribute('data-slug'), function (result) {
            if (result === 'success') {
                location.href = 'http://localhost:' + PORT + '/wiki/index';
            } else {
                this.classList.add('error');
            }
        });
    };

    addEvent(deleteButton, 'click', function (e) {
        e.preventDefault();
        deleteEntry();
    });
    addEvent(document, 'keydown', function (e) {
        if ($1('#search') === document.activeElement) return;
        switch (e.keyCode) {
            case 68: //(D)elete
                deleteEntry();
                break;
            case 69: //(E)dit
                location.href = 'http://localhost:' + PORT + '/wiki/edit/' + deleteButton.getAttribute('data-slug');
                break;
            case 80: //(P)rint
                window.print();
                break;
        }
    });

    var counter = 0;
    $('pre').forEach(function (element) {
        element.classList.add('line-numbers');

        const clickToCopy = document.createElement('span');
        clickToCopy.classList.add('clipboard');
        clickToCopy.innerText = 'Copy to Clipboard';
        const i = counter++;
        addEvent(clickToCopy, 'click', function () {
            copyTextToClipboard(codeArray[i]);
            $1('.toast').classList.add('visible');
            setTimeout(function () {
                $1('.toast').classList.remove('visible');
            }, 1000);
        });

        element.appendChild(clickToCopy);
    });

    $('pre code').forEach(function (element) {
        var counter = 0;
        html = element.innerHTML;
        codeArray.push(element.innerText);
        for (var i = 0, j = html.length; i < j; i++) {
            if (i !== j - 1 && (html[i] === "\n" || i === 0)) {
                var inject = '<span class="line-number">' + (++counter) + '</span>';
                html = html.slice(0, i === 0 ? 0 : i + 1) + inject + html.slice(i === 0 ? 0 : i + 1, j);
                i += inject.length;
                j += inject.length;
            }
        }
        element.innerHTML = html;
    });

    $('a img').forEach(function (element) {
        addEvent(element, 'click', function (e) {
            e.preventDefault();
            if (element.classList.contains('zoom')) {
                element.classList.remove('zoom');
                element.style.left = 0;
            } else {
                element.classList.add('zoom');
                var rect = element.getBoundingClientRect();
                element.style.left = window.innerWidth / 10 - (rect.left + document.body.scrollLeft) + 'px';
            }
        });
    });
});