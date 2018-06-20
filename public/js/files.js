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

function fileSizeConverter(size) {
    let counter = 0;
    while (size > 1024) {
        size /= 1024;
        counter++;
    }
    return size.toFixed(2) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][counter];
}

addEventListener('DOMContentLoaded', function () {
    const dropArea = $1('.drop-area');
    const overallProgress = $1('#overallProgress');
    const progressBar = $1('#progress');
    const fileInput = $1('#files');
    const totalFileSize = $1('#total-file-size');
    const toastDelete = $1('#delete-toast');
    const optionsPaneTitle = $1('#options-pane strong');
    const optionsPaneDelete = $1('#options-pane a');
    const content = $1('.content');
    const search = $1('#search');

    const dragHoverStart = function () {
        dropArea.classList.add('hover');
    };
    const dragHoverEnd = function () {
        dropArea.classList.remove('hover');
    };
    const base64UrlEncode = function (s) {
        return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };
    const submit = function (files) {
        //prepare user interface for upload
        dropArea.classList.add('uploading');

        //warn user that we are still uploading
        window.onbeforeunload = () => true;

        //start uploading files
        uploadNext(files, 0);

    };
    const uploadNext = function (files, i) {
        if (files.length === i) {
            //reset user interface
            dropArea.classList.remove('uploading');
            $1('.entry-title span.icon').innerText = 'Choose a file';
            $1('.entry-title span:not([class="icon"])').innerText = 'or drag it here.';
            progressBar.classList = '';
            overallProgress.classList.remove('show');
            files = null;

            //remove upload warning
            window.onbeforeunload = null;
            return;
        }

        //display file name in user interface
        $1('.entry-title span.icon').innerText = 'Uploading';
        $1('.entry-title span:not([class="icon"])').innerText = files[i]['name'];
        overallProgress.innerText = (i + 1) + '/' + files.length;
        overallProgress.classList.add('show');

        //divide file into chunks
        const chunks = files[i]['base64'].match(/.{1,10000}/g);

        //send chunks to server
        let numberOfChunksArrived = 0;
        for (let k = 0, l = chunks.length; k < l; k++) {
            getAjax('http://localhost:' + PORT + '/wiki/uploadChunk/' + encodeURIComponent(files[i]['name']) + '/' + chunks[k] + '/' + k, function (result) {
                if (result.split(':')[0] === 'error') console.log('Could not upload chunk ' + result.split(':')[1] + '.');
                if (++numberOfChunksArrived === l) {
                    //updating user interface
                    $1('.entry-title span.icon').innerText = 'Saving';

                    //save to disk
                    getAjax('http://localhost:' + PORT + '/wiki/upload/' + encodeURIComponent(files[i]['name']), function (result) {
                        if (result === 'error') console.log('Could not save file.');

                        //reset user interface
                        progressBar.classList = '';

                        //add file to content
                        const row = new DOMParser().parseFromString(result, 'text/html').firstChild.childNodes[1].firstChild;
                        addEvent(row, 'click', select);
                        addEvent($1('.delete', row), 'click', del);
                        content.insertBefore(row, content.children[1]);
                        setTimeout(function () {
                            row.classList.remove('entering');

                            //update total file size
                            totalFileSize.innerText = fileSizeConverter(getTotalFileSize());
                        }, 100);

                        //upload next file
                        uploadNext(files, ++i);
                    });
                }

                //update progress bar
                progressBar.classList.add('_' + (numberOfChunksArrived / l * 100));
            });
        }
    };
    const deleteFile = function (fileName) {
        getAjax('http://localhost:' + PORT + '/wiki/deleteFile/' + encodeURIComponent(fileName), function (result) {
            if (result === 'error') console.log('Could not delete file.');

            //reset user interface
            const row = $1('#' + fileName.hashCode());

            //hide file
            row.classList.add('deleted');

            //show toast
            toastDelete.classList.add('visible');

            setTimeout(function () {
                //hide toast and remove file from user interface
                toastDelete.classList.remove('visible');
                row.parentNode.removeChild(row);
                updateOptionsPane();

                //update total file size
                totalFileSize.innerText = fileSizeConverter(getTotalFileSize());
            }, 2000);
        });
    };
    const updateOptionsPane = function () {
        const selectedFiles = $('.file-row.active');
        optionsPaneDelete.innerText = 'Delete ' + selectedFiles.length + ' Files';
        if (selectedFiles.length > 1) {
            optionsPaneTitle.classList.add('hide');
            optionsPaneDelete.classList.add('show');
        } else {
            optionsPaneTitle.classList.remove('hide');
            optionsPaneDelete.classList.remove('show');
        }
    };
    const select = function (e) {
        e.stopPropagation();
        if (e.shiftKey) { //select all files in between
            //remove selection
            const fileRows = $('.file-row');
            fileRows.forEach(fr => fr.classList.remove('active'));

            //select in between: attempt direction down
            const start = selectedLast === null ? content.children[1] : selectedLast;
            let current = start;
            do {
                current.classList.add('active');
            } while ((current = current.nextElementSibling) !== null && current.previousElementSibling !== this);

            if (!this.classList.contains('active')) { //select in between: attempt direction down
                fileRows.forEach(fr => fr.classList.remove('active'));

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
    const del = function (e) {
        e.preventDefault();

        const confirm = window.confirm('Are you sure you want to delete this file?');
        if (!confirm) return;

        deleteFile(this.getAttribute('data-filename'));
    };
    const getTotalFileSize = function () {
        let node = $('.file-row')[0];
        let i;
        for (i = parseInt($1('#_filesize' + node.id).getAttribute('data-filesize')); node = node.nextElementSibling; i += parseInt($1('#_filesize' + node.id).getAttribute('data-filesize'))) ;
        return i;
    };

    //file upload functionality
    addEvent(dropArea, ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'], function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    addEvent(dropArea, ['dragover', 'dragenter'], dragHoverStart);
    addEvent(dropArea, ['dragleave', 'dragend', 'drop'], dragHoverEnd);
    addEvent(dropArea, 'drop', function (e) {
        const files = [];

        const dataTransferFiles = e.dataTransfer.items;
        let capturedFiles = 0;
        for (let i = 0, j = dataTransferFiles.length; i < j; i++) {
            const entry = dataTransferFiles[i].webkitGetAsEntry();
            if (!entry.isDirectory) {
                const file = dataTransferFiles[i].getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    files.push({name: file.name, size: file.size, base64: base64UrlEncode(reader.result.split('base64,')[1])});

                    //upload files
                    if (++capturedFiles === j) {
                        submit(files);
                    }
                };
            }
        }
    });
    addEvent(dropArea, 'click', function () {
        fileInput.click();
    });
    addEvent(fileInput, 'change', function () {
        console.log(fileInput.files);
        const files = [];

        const dataTransferFiles = fileInput.files;
        let capturedFiles = 0;
        for (let i = 0, j = dataTransferFiles.length; i < j; i++) {
            const reader = new FileReader();
            reader.readAsDataURL(dataTransferFiles[i]);
            reader.onload = function () {
                files.push({
                    name: dataTransferFiles[i].name,
                    size: dataTransferFiles[i].size,
                    base64: base64UrlEncode(reader.result.split('base64,')[1])
                });

                //upload files
                if (++capturedFiles === j) {
                    submit(files);
                }
            };
        }
    });

    //file delete functionality
    $('.delete').forEach(button => {
        addEvent(button, 'click', del);
    });
    addEvent(optionsPaneDelete, 'click', function (e) {
        e.preventDefault();

        const confirm = window.confirm('Are you sure you want to delete these files?');
        if (!confirm) return;

        $('.file-row.active .delete').forEach(file => deleteFile(file.getAttribute('data-filename')));
    });

    //file select functionality
    let selectedLast = null;
    $('.file-row').forEach(fileRow => {
        addEvent(fileRow, 'click', select);
    });
    addEvent(document, 'click', function () {
        $('.file-row').forEach(fileRow => fileRow.classList.remove('active'));
        updateOptionsPane();
    });

    //filter functionality
    addEvent(search, 'input', function () {
        $('.file-row').forEach(fileRow => {
            fileRow.classList.remove('deleted');
            if ($1('.delete', fileRow).getAttribute('data-filename').match(new RegExp(this.value, 'i')) === null) {
                fileRow.classList.add('deleted');
            }
        });
    });

    //navigation functionality
    addEvent(document, 'keydown', function (e) {
        console.log(e.keyCode);

        const indexRows = $('.index-row');

        switch (e.keyCode) {
            case 13: // enter
                $1('.file-row.active a').click();
                break;
            case 37: // arrow left
            case 38: // arrow up
                if (selectedLast === null) selectedLast = indexRows[1];
                indexRows.forEach(fileRow => fileRow.classList.remove('active'));

                if (selectedLast.previousElementSibling !== indexRows[0] && selectedLast.previousElementSibling !== null) {
                    selectedLast = selectedLast.previousElementSibling;
                } else {
                    selectedLast = indexRows[indexRows.length - 2];
                }
                selectedLast.classList.add('active');
                break;
            case 39: // arrow right
            case 40: // arrow down
                if (selectedLast === null) selectedLast = indexRows[0];
                indexRows.forEach(fileRow => fileRow.classList.remove('active'));

                if (selectedLast.nextElementSibling !== null) {
                    selectedLast = selectedLast.nextElementSibling;
                } else {
                    selectedLast = indexRows[1];
                }
                selectedLast.classList.add('active');
                break;
            case 68: // (d)elete
                const confirm = window.confirm('Are you sure you want to delete these files?');
                if (!confirm) return;

                $('.file-row.active .delete').forEach(file => deleteFile(file.getAttribute('data-filename')));
                break;
        }
    });

    //todo add a fileuploader/fileincluder to the edit screen
    //todo add files to menu somehow
});