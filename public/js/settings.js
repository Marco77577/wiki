document.addEventListener('DOMContentLoaded', function () {
    let dirty = false;
    const port = $1('#port');
    const name = $1('#wikiname');
    const saveButton = $1('#save-button');
    const updateButton = $1('#update-button');
    const publishButton = $1('#publish-button');

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
    const attemptSaving = function () {
        if (port.value.length <= 0 || !port.value.match(/[0-9]{4,5}/)) {
            port.classList.add('error');
            return;
        }
        port.classList.remove('error');
        if (name.value.length <= 0) {
            name.classList.add('error');
            return;
        }
        name.classList.remove('error');

        saveButton.classList.add('saving');
        getAjax('http://localhost:' + PORT + '/wiki/savesettings/' + port.value + '/' + encodeURIComponent(name.value), function (result) {
            saveButton.classList.remove('saving');
            if (result === 'success') {
                setDirty(false);
                saveButton.classList.remove('error');
            } else {
                saveButton.classList.add('error');
            }
        });
    };

    addEvent(port, 'input', function () {
        setDirty(true);
    });
    addEvent(name, 'input', function () {
        setDirty(true);
    });
    addEvent(saveButton, 'click', function (e) {
        e.preventDefault();
        attemptSaving();
    });
    addEvent(document, 'keydown', function (e) {
        if (e.keyCode === 83 && e.ctrlKey) {
            e.preventDefault();
            attemptSaving();
        }
    });
    addEvent(updateButton, 'click', function (e) {
        e.preventDefault();
        updateButton.classList.add('saving');
        getAjax('http://localhost:' + PORT + '/wiki/update', function () {
            updateButton.classList.remove('saving');
        });
    });
    addEvent(publishButton, 'click', function (e) {
        e.preventDefault();
        publishButton.classList.remove('error');
        publishButton.classList.add('saving');
        getAjax('http://localhost:' + PORT + '/wiki/publish', function (result) {
            publishButton.classList.remove('saving');
            if(result !== 'success') {
                publishButton.classList.add('error');
            } else {
                $1('.toast').classList.add('visible');
                setTimeout(function () {
                    $1('.toast').classList.remove('visible');
                }, 1000);
            }
        });
    });

    attemptSaving();
});