document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = $('.delete');
    deleteButtons.forEach(function (deleteButton) {
        addEvent(deleteButton, 'click', function (e) {
            e.preventDefault();
            const confirm = window.confirm('Are you sure you want to delete this entry?');
            if (!confirm) return;
            getAjax('http://localhost:3000/wiki/delete/' + deleteButton.getAttribute('data-slug'), function (result) {
                if (result === 'success') {
                    location.href = 'http://localhost:3000/wiki/index';
                } else {
                    this.classList.add('error');
                }
            });
        });
    });
});