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
    let searchMode = true;
    const deleteButtons = $('.delete');
    const tagsContainer = $1('#tag-cloud-container');
    const tagsHeader = $1('#tag-cloud-header');
    const toastDelete = $1('#delete-toast');
    const totalSize = $1('#total-size');
    const entrySize = $1('#entry-size');
    const imageSize = $1('#image-size');
    const search = $1('#search');
    const deleteSearchButton = $1('#delete-search');
    const optionsPaneTitle = $1('#options-pane strong');
    const optionsPaneDelete = $1('#options-pane a');

    const getTotalFileSize = function () {
        //todo update total and image file size as well
        let node = $('.entry-row')[0];
        let i;
        for (i = parseInt($1('#_filesize' + node.id).getAttribute('data-size')); node = node.nextElementSibling; i += parseInt($1('#_filesize' + node.id).getAttribute('data-size'))) ;
        return i;
    };
    const select = function (e) {
        e.stopPropagation();
        if (e.shiftKey) { //select all files in between
            //remove selection
            const entryRows = $('.entry-row');
            entryRows.forEach(fr => fr.classList.remove('active'));

            //select in between: attempt direction down
            const start = selectedLast === null ? content.children[1] : selectedLast;
            let current = start;
            do {
                current.classList.add('active');
            } while ((current = current.nextElementSibling) !== null && current.previousElementSibling !== this);

            if (!this.classList.contains('active')) { //select in between: attempt direction down
                entryRows.forEach(fr => fr.classList.remove('active'));

                let current = start;
                do {
                    current.classList.add('active');
                } while ((current = current.previousElementSibling) !== null && current.nextElementSibling !== this);
            }
            selectedLast = this;
        } else {
            //toggle selected
            if (!this.classList.contains('active')) {
                this.classList.add('active');
                selectedLast = this;
            } else {
                this.classList.remove('active');
            }
        }

        //show options for multiple selected files
        updateOptionsPane();
    };
    const updateOptionsPane = function () {
        const selectedFiles = $('.entry-row.active');
        optionsPaneDelete.innerText = 'Delete ' + selectedFiles.length + ' Files';
        if (selectedFiles.length > 1) {
            optionsPaneTitle.classList.add('hide');
            optionsPaneDelete.classList.add('show');
        } else {
            optionsPaneTitle.classList.remove('hide');
            optionsPaneDelete.classList.remove('show');
        }
    };
    const deleteEntry = function (slug) {
        getAjax('http://localhost:' + PORT + '/wiki/delete/' + slug, function (result) {
            if (result === 'error') {
                console.log('Could not delete entry.');
                return;
            }

            //reset user interface
            const row = $1('#' + slug.hashCode());

            //hide file
            row.classList.add('deleted');

            //show toast
            toastDelete.classList.add('visible');

            setTimeout(function () {
                //hide toast and remove entry from user interface
                toastDelete.classList.remove('visible');
                row.parentNode.removeChild(row);
                updateOptionsPane();

                //update file sizes
                entrySize.innerText = fileSizeConverter(getTotalFileSize());
                imageSize.innerText = fileSizeConverter(parseInt(result));
                totalSize.innerText = fileSizeConverter(getTotalFileSize() + parseInt(result));
            }, 2000);
        });
    };
    const applyFilter = function () {
        $('.entry-row').forEach(entryRow => {
            entryRow.classList.remove('deleted');
            if ($1('a', entryRow).innerText.match(new RegExp(search.value, 'i')) === null) {
                entryRow.classList.add('deleted');
            }
        });
    };

    //entry delete functionality
    deleteButtons.forEach(function (deleteButton) {
        addEvent(deleteButton, 'click', function (e) {
            e.preventDefault();

            const confirm = window.confirm('Are you sure you want to delete this entry?');
            if (!confirm) return;

            deleteEntry(deleteButton.getAttribute('data-slug'));
        });
    });
    addEvent(optionsPaneDelete, 'click', function (e) {
        e.preventDefault();

        const confirm = window.confirm('Are you sure you want to delete these entries?');
        if (!confirm) return;

        $('.entry-row.active .delete').forEach(entry => deleteEntry(entry.getAttribute('data-slug')));
    });

    //select functionality
    let selectedLast = null;
    $('.entry-row').forEach(entryRow => {
        addEvent(entryRow, 'click', select);
    });
    addEvent(document, 'click', function () {
        $('.entry-row').forEach(fileRow => fileRow.classList.remove('active'));
        updateOptionsPane();
    });

    //navigation functionality
    addEvent(document, 'keydown', function (e) {
        const indexRows = $('.index-row:not(.deleted)');
        const finalizeArrowNavigation = function () {
            e.preventDefault();
            searchMode = false;
            selectedLast.classList.add('active');
            scrollIt(selectedLast);
        };


        switch (e.keyCode) {
            case 13: // enter
                if (selectedLast === null) return;
                if (document.activeElement === search && searchMode) return;
                e.preventDefault();
                $1('a', selectedLast).click();
                break;
            case 27: // escape
                search.value = '';
                applyFilter();
                break;
            case 37: // arrow left
            case 38: // arrow up
                if (selectedLast === null) selectedLast = indexRows[2];
                indexRows.forEach(fileRow => fileRow.classList.remove('active'));

                if (getPreviousSibling(selectedLast) !== indexRows[1] && getPreviousSibling(selectedLast) !== null) {
                    selectedLast = getPreviousSibling(selectedLast);
                } else {
                    selectedLast = indexRows[indexRows.length - 4];
                }

                finalizeArrowNavigation();
                break;
            case 39: // arrow right
            case 40: // arrow down
                if (selectedLast === null) selectedLast = indexRows[1];
                indexRows.forEach(fileRow => fileRow.classList.remove('active'));

                if (getNextSibling(selectedLast) !== null) {
                    selectedLast = getNextSibling(selectedLast);
                } else {
                    selectedLast = indexRows[2];
                }

                finalizeArrowNavigation();
                break;
            case 68: // (d)elete
                if (document.activeElement === search || selectedLast === null) return;

                const confirm = window.confirm('Are you sure you want to delete these entries?');
                if (!confirm) return;

                $('.entry-row.active .delete').forEach(entry => deleteEntry(entry.getAttribute('data-slug')));
                break;
            case 69: // (e)edit
                if (document.activeElement === search || selectedLast === null) return;
                $1('a.edit', selectedLast).click();
                break;
        }
    });

    //tag cloud functionality
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

    //filter functionality
    addEvent(search, 'input', function () {
        searchMode = true;
        applyFilter();
    });
    addEvent(deleteSearchButton, 'click', applyFilter);

    $1('header').classList.add('fixed');
});