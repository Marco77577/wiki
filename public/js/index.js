function slideDown(elem) {
    elem.style.maxHeight = '1000px';
    // We're using a timer to set opacity = 0 because setting max-height = 0 doesn't (completely) hide the element.
    elem.style.opacity = '1';
}

function slideUp(elem) {
    elem.style.maxHeight = '0';
    once(1, function () {
        elem.style.opacity = '0';
    });
}

function once(seconds, callback) {
    let counter = 0;
    const time = window.setInterval(function () {
        counter++;
        if (counter >= seconds) {
            callback();
            window.clearInterval(time);
        }
    }, 400);
}

document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = $('.delete');
    const tagsContainer = $1('#tag-cloud-container');
    const tagsHeader = $1('#tag-cloud-header');
    const search = $1('#search');
    deleteButtons.forEach(function (deleteButton) {
        addEvent(deleteButton, 'click', function (e) {
            e.preventDefault();
            const confirm = window.confirm('Are you sure you want to delete this entry?');
            if (!confirm) return;
            getAjax('http://localhost:' + PORT + '/wiki/delete/' + deleteButton.getAttribute('data-slug'), function (result) {
                if (result === 'success') {
                    location.href = 'http://localhost:' + PORT + '/wiki/index';
                } else {
                    this.classList.add('error');
                }
            });
        });
    });

    const entries = $('.index:not(.size) .row');
    let currentlyActive = -1;
    addEvent(document, 'keydown', function (e) {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            if (e.keyCode === 39 || e.keyCode === 40) { //right/down arrow
                if (++currentlyActive >= entries.length || currentlyActive <= 0) {
                    currentlyActive = 1;
                }
            } else if (e.keyCode === 37 || e.keyCode === 38) { //left/up arrow
                if (--currentlyActive <= 0) {
                    currentlyActive = entries.length - 1;
                }
            }
            entries.forEach(function (row) {
                row.classList.remove('active');
            });
            entries[currentlyActive].classList.add('active');
            scrollIt($1('.row.active div a'));
        }
        if (e.keyCode === 13) { //enter
            location.href = $1('.row.active div a').href;
        }
        if (e.keyCode === 69 && search !== document.activeElement) { //E
            location.href = $1('.row.active div.option-wrapper a.edit').href;
        }
    });
    addEvent(tagsHeader, 'click', function () {
        if (tagsContainer.classList.contains('opened')) {
            tagsContainer.classList.remove('opened');
            tagsHeader.classList.remove('opened');
            slideUp(tagsContainer);
        } else {
            tagsContainer.classList.add('opened');
            tagsHeader.classList.add('opened');
            slideDown(tagsContainer);
        }
    });

    $1('header').classList.add('fixed');
});