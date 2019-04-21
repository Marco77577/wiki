function fallbackCopyTextToClipboard(text) {
	const textArea = document.createElement("textarea");
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
	const editButton = $1('.editbutton');
	const deleteButton = $1('.delete');
	const searchField = $1('#search');
	const deleteEntry = function () {
		const confirm = window.confirm('Are you sure you want to delete this entry?');
		if (!confirm) return;
		getAjax('/wiki/delete/' + editButton.getAttribute('data-slug'), function (result) {
			if (result === 'error') {
				this.classList.add('error');
			} else {
				location.href = '/wiki/index';
			}
		});
	};
	const showClipBoardToast = function () {
		$1('.toast').classList.add('visible');
		setTimeout(function () {
			$1('.toast').classList.remove('visible');
		}, 1000);
	};
	const prepareView = function () {
		let counter = 0;
		$('pre').forEach(function (element) {
			element.classList.add('line-numbers');

			const div = document.createElement('div');
			div.classList.add('code-container');
			const clickToCopy = document.createElement('span');
			clickToCopy.classList.add('clipboard');
			clickToCopy.innerText = 'Copy to Clipboard';
			const i = counter++;
			addEvent(clickToCopy, 'click', function () {
				copyTextToClipboard(codeArray[i]);
				showClipBoardToast();
			});

			element.parentNode.insertBefore(div, element);
			element.parentNode.removeChild(element);
			div.appendChild(element);
			div.appendChild(clickToCopy);
		});

		$('pre code').forEach(function (element) {
			let counter = 0;
			html = element.innerHTML;
			codeArray.push(element.innerText);
			for (let i = 0, j = html.length; i < j; i++) {
				if (i !== j - 1 && (html[i] === "\n" || i === 0)) {
					const inject = '<span class="line-number">' + (++counter) + '</span>';
					html = html.slice(0, i === 0 ? 0 : i + 1) + inject + html.slice(i === 0 ? 0 : i + 1, j);
					i += inject.length;
					j += inject.length;
				}
			}
			element.innerHTML = html;
		});

		$('a img').forEach(function (element) {
			element.parentNode.classList.add('image-link');
			addEvent(element, 'click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				if (element.classList.contains('zoom')) {
					element.classList.remove('zoom');
					element.style.left = 0;
				} else {
					element.classList.add('zoom');
					const rect = element.getBoundingClientRect();
					const formerWidth = element.width;
					element.style.width = (formerWidth + 1) + 'px';
					if (element.width === formerWidth) {
						element.style.width = '';
						element.style.left = window.innerWidth / 10 - (rect.left + document.body.scrollLeft) + 'px';
					} else {
						element.style.left = (window.innerWidth - rect.width) / 2 - (rect.left + document.body.scrollLeft) + 'px';
					}
				}
			});

			addEvent(element.parentNode, 'click', function (e) {
				e.preventDefault();
			});
		});

		$('a[href*="https://www.youtube.com"]').forEach(video => {
			const id = video.href.match(/https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9\-_]+)/);
			const div = document.createElement('div');
			div.classList.add('iframe-wrapper');

			const iframe = document.createElement('iframe');
			iframe.src = 'https://www.youtube.com/embed/' + id[1] + '?rel=0';
			iframe.setAttribute('frameborder', '0');
			iframe.setAttribute('allowfullscreen', 'true');
			iframe.setAttribute('allow', 'autoplay; encrypted-media;');
			div.appendChild(iframe);
			if (video.parentNode === undefined) return;
			video.parentNode.insertBefore(div, video);
			video.parentNode.removeChild(video);
		});

		$('a[href^="wiki"]').forEach(element => {
			element.setAttribute('href', '/' + element.getAttribute('href'));
		});

		$('img[src^="wiki"]').forEach(element => {
			element.setAttribute('src', '/' + element.href);
		});

		$('a[href^="/wiki/view"]').forEach(element => {
			getAjax('/wiki/checkslug/' + element.getAttribute('href').replace('/wiki/view/', ''), function (result) {
				if(result === 'free') {
					element.classList.add('not-available');
				}
			});
		});

		$('code').forEach(code => {
			addEvent(code, 'click', function () {
				copyTextToClipboard(code.innerText);
				showClipBoardToast();
			});
		});

		$1('header').classList.add('fixed');

		$('.related').forEach(related => {
			const span = document.createElement('span');
			span.textContent = 'Related Entry';

			related.appendChild(span);
		})
	};

	addEvent(document, 'click', function (e) {
		$('a img').forEach(function (element) {
			element.classList.remove('zoom');
			element.style.left = 0;
		});
	});

	addEvent(document, 'keydown', function (e) {
		if (searchField === document.activeElement && e.keyCode !== 27) return;
		switch (e.keyCode) {
			case 27: // Esc
				searchField.value = '';
				$('a img').forEach(function (element) {
					element.classList.remove('zoom');
					element.style.left = 0;
				});
				break;
			case 68: //(D)elete
				deleteEntry();
				break;
			case 69: //(E)dit
				location.href = '/wiki/edit/' + editButton.getAttribute('data-slug');
				break;
			case 78: //(N)ew
				location.href = '/wiki/new';
				break;
			case 80: //(P)rint
				window.print();
				break;
		}
	});
	addEvent(deleteButton, 'click', function (e) {
		e.preventDefault();
		deleteEntry();
	});

	prepareView();
});