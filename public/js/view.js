document.addEventListener('DOMContentLoaded', function () {
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
});