document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = $('.delete');
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

    const entries = $('.index .row');
    var currentlyActive = -1;
    addEvent(document, 'keydown', function (e) {
        console.log(e.keyCode);
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            if (currentlyActive === -1) {
                currentlyActive = 1;
            } else if (e.keyCode === 39 || e.keyCode === 40) { //right/down arrow
                if (++currentlyActive >= entries.length) {
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
        }
        if (e.keyCode === 13) { //enter
            location.href = $1('.row.active div a').href;
        }
    });
});