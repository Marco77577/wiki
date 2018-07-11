function expandHtml(container, recipe) {
	recipe.forEach(element => {
		//create element
		const el = document.createElement(element.element);

		//construct element content
		if (element.content !== null && element.content.constructor === Array) {
			expandHtml(el, element.content);
		} else if (element.content !== null) {
			el.textContent = element.content;
		}

		//set attributes
		if (element.properties !== undefined) {
			element.properties.forEach(property => {
				el.setAttribute(property.propertyName, property.value);
			});
		}

		//add events
		if (element.events !== undefined) {
			element.events.forEach(event => {
				addEvent(el, event.eventName, event.action);
			});
		}

		//append element to container
		container.append(el);
	});
}

function getTextSelection(el) {
	let start = 0, end = 0, normalizedValue, range,
		textInputRange, len, endRange;

	if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
		start = el.selectionStart;
		end = el.selectionEnd;
	} else {
		range = document.selection.createRange();

		if (range && range.parentElement() === el) {
			len = el.value.length;
			normalizedValue = el.value.replace(/\r\n/g, "\n");

			// Create a working TextRange that lives only in the input
			textInputRange = el.createTextRange();
			textInputRange.moveToBookmark(range.getBookmark());

			// Check if the start and end of the selection are at the very end
			// of the input, since moveStart/moveEnd doesn't return what we want
			// in those cases
			endRange = el.createTextRange();
			endRange.collapse(false);

			if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
				start = end = len;
			} else {
				start = -textInputRange.moveStart("character", -len);
				start += normalizedValue.slice(0, start).split("\n").length - 1;

				if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
					end = len;
				} else {
					end = -textInputRange.moveEnd("character", -len);
					end += normalizedValue.slice(0, end).split("\n").length - 1;
				}
			}
		}
	}
	return {start: start, end: end}
}

function debounce(func, interval) {
	let lastCall = -1;
	return function () {
		clearTimeout(lastCall);
		const args = arguments;
		const self = this;
		lastCall = setTimeout(function () {
			func.apply(self, args);
		}, interval);
	};
}

function getMouseEventCaretRange(evt) {
	let range, x = evt.clientX, y = evt.clientY;

	// Try the simple IE way first
	if (document.body.createTextRange) {
		range = document.body.createTextRange();
		range.moveToPoint(x, y);
	}

	else if (typeof document.createRange !== "undefined") {
		// Try Mozilla's rangeOffset and rangeParent properties,
		// which are exactly what we want
		if (typeof evt.rangeParent !== "undefined") {
			range = document.createRange();
			range.setStart(evt.rangeParent, evt.rangeOffset);
			range.collapse(true);
		}

		// Try the standards-based way next
		else if (document.caretPositionFromPoint) {
			const pos = document.caretPositionFromPoint(x, y);
			range = document.createRange();
			range.setStart(pos.offsetNode, pos.offset);
			range.collapse(true);
		}

		// Next, the WebKit way
		else if (document.caretRangeFromPoint) {
			range = document.caretRangeFromPoint(x, y);
		}
	}

	return range;
}

function isOffScreen(el) {
	const rect = el.getBoundingClientRect();
	return (
		(rect.x + rect.width) < 0
		|| (rect.y + rect.height) < 0
		|| (rect.x > window.innerWidth || rect.y + rect.height > window.innerHeight)
	);
}


document.addEventListener('DOMContentLoaded', function () {
		const md = [
			{
				name: 'link',
				text: 'QuickLink',
				delimiterStart: '[',
				delimiterEnd: ']()',
				keyCode: 65,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 3,
				endPositionWithSelection: 1,
				displayButton: true,
			},
			{
				name: 'bold',
				text: 'Bold',
				delimiterStart: '**',
				delimiterEnd: '**',
				keyCode: 66,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 2,
				endPositionWithSelection: 0,
				displayButton: true,
			},
			{
				name: 'italic',
				text: 'Italic',
				delimiterStart: '_',
				delimiterEnd: '_',
				keyCode: 73,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 1,
				endPositionWithSelection: 0,
				displayButton: true,
			},
			{
				name: 'strikethrough',
				text: 'Strikethrough',
				delimiterStart: '~~',
				delimiterEnd: '~~',
				keyCode: 83,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 2,
				endPositionWithSelection: 0,
				displayButton: true,
			},
			{
				name: 'code',
				text: 'Code',
				delimiterStart: '`',
				delimiterEnd: '`',
				keyCode: 67,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 1,
				endPositionWithSelection: 0,
				displayButton: true,
			},
			{
				name: 'codeBlock',
				text: 'CodeBlock',
				delimiterStart: "```js\n",
				delimiterEnd: "\n```",
				keyCode: 75,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 4,
				endPositionWithSelection: 4,
				displayButton: true,
			},
			{
				name: 'blockquote',
				text: 'Blockquote',
				delimiterStart: "> ",
				delimiterEnd: "",
				keyCode: 81,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					const selectedLines = content.value.slice(positions.start, positions.end);
					const numberOfLines = (selectedLines.match(/\n/g) || []).length + 1;
					if (numberOfLines === 1) {
						let insertAt = positions.start;
						while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
						content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
						content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					} else {
						content.value = content.value.slice(0, positions.start) + selectedLines.replace(/^(.*)$/gm, currentMarkdown.delimiterStart + '$1') + content.value.slice(positions.end);
						content.setSelectionRange(positions.start, positions.end + currentMarkdown.delimiterStart.length * numberOfLines);
					}
					content.focus();
					update();
				}
			},
			{
				name: 'h1',
				text: 'H1',
				delimiterStart: "# ",
				delimiterEnd: "",
				keyCode: 49,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'h2',
				text: 'H2',
				delimiterStart: "## ",
				delimiterEnd: "",
				keyCode: 50,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'h3',
				text: 'H3',
				delimiterStart: "### ",
				delimiterEnd: "",
				keyCode: 51,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'h4',
				text: 'H4',
				delimiterStart: "#### ",
				delimiterEnd: "",
				keyCode: 52,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'h5',
				text: 'H5',
				delimiterStart: "##### ",
				delimiterEnd: "",
				keyCode: 53,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: true,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'h6',
				text: 'H6',
				delimiterStart: "###### ",
				delimiterEnd: "",
				keyCode: 54,
				ctrlKey: true,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: false,
				customCommand: function (currentMarkdown) {
					const positions = getTextSelection(content);
					let insertAt = positions.start;
					while (content.value[insertAt] !== '\n' && insertAt >= 0) insertAt--;
					content.value = content.value.slice(0, ++insertAt) + currentMarkdown.delimiterStart + content.value.slice(insertAt);
					content.setSelectionRange(positions.start + currentMarkdown.delimiterStart.length, positions.end + currentMarkdown.delimiterStart.length);
					content.focus();
					update();
				}
			},
			{
				name: 'tab',
				text: 'Tab',
				delimiterStart: '\t',
				delimiterEnd: '',
				keyCode: 9,
				ctrlKey: false,
				shiftKey: false,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: false,
				customCommand: function () {
					const positions = getTextSelection(content);
					if (positions.start === positions.end) { //insert tab at start position
						content.value = content.value.slice(0, positions.start) + '\t' + content.value.slice(positions.start);
						content.setSelectionRange(++positions.start, positions.start);
					} else { //insert multiple tabs
						const selectedLines = content.value.slice(positions.start, positions.end);
						const numberOfLines = (selectedLines.match(/\n/g) || []).length + 1;
						content.value = content.value.slice(0, positions.start) + selectedLines.replace(/^(.*)$/gm, '\t$1') + content.value.slice(positions.end);
						content.setSelectionRange(positions.start, positions.end + numberOfLines);
					}
					content.focus();
					update();
				}
			},
			{
				name: 'untab',
				text: 'Untab',
				delimiterStart: '',
				delimiterEnd: '',
				keyCode: 9,
				ctrlKey: false,
				shiftKey: true,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: false,
				customCommand: function () {
					const positions = getTextSelection(content);
					if (positions.start > 0) {
						if (positions.start === positions.end) { //remove tab before start position
							if (content.value.slice(positions.start - 1, positions.start) === '\t') {
								content.value = content.value.slice(0, positions.start - 1) + content.value.slice(positions.start);
								content.setSelectionRange(--positions.start, positions.start);
							}
						} else { //delete multiple tabs
							const selectedLines = content.value.slice(positions.start, positions.end);
							const numberOfLines = (selectedLines.match(/\n/g) || []).length + 1;
							content.value = content.value.slice(0, positions.start) + selectedLines.replace(/^\t(.*)$/gm, '$1') + content.value.slice(positions.end);
							content.setSelectionRange(positions.start, positions.end - numberOfLines);
						}
						content.focus();
						update();
					}
				}
			},
			{
				name: 'duplicateLine',
				text: 'Duplicate Line',
				delimiterStart: '',
				delimiterEnd: '',
				keyCode: 68,
				ctrlKey: true,
				shiftKey: false,
				endPositionNoSelection: 0,
				endPositionWithSelection: 0,
				displayButton: false,
				customCommand: function () {
					const positions = getTextSelection(content);
					if (positions.start > 0) {
						if (positions.start === positions.end) { //copy entire line
							let start = positions.start - 1, end = positions.end;
							const text = content.value;
							while (text[start] !== '\n' && start > 0) start--;
							while (text[end] !== '\n' && end < text.length) end++;
							const selectedContent = content.value.slice(start, end);
							content.value = content.value.slice(0, end) + (start === 0 ? '\n' :
								'') + selectedContent + content.value.slice(end);
							content.setSelectionRange(positions.start + end - start, positions.start + end - start);
						} else { //copy content
							const selectedContent = content.value.slice(positions.start, positions.end);
							content.value = content.value.slice(0, positions.end) + selectedContent + content.value.slice(positions.end);
							content.setSelectionRange(positions.start, positions.end);
						}
						content.focus();
						update();
					}
				}
			}
		];
		const wizardObject = {
			start: 0,
			end: 0,
			selected: null,
			functions:
				{
					validateNotEmpty: function (field) {
						if (field.value.length <= 0) {
							field.classList.add('error');
							field.focus();
							return false;
						}
						field.classList.remove('error');
						return true;
					},
					validateSpecial: function (field, fct) {
						if (!fct()) {
							field.classList.add('error');
							field.focus();
							return false;
						}
						field.classList.remove('error');
						return true;
					},
					arrowNavigation: function (wrapper, e) {
						if (wrapper.childNodes.length <= 1) return;
						switch (e.keyCode) {
							case 38: //up
								e.preventDefault();
								wrapper.childNodes.forEach(row => row.classList.remove('active'));

								if (wizardObject.selected === null) wizardObject.selected = wrapper.childNodes[1];
								if (wizardObject.selected.previousElementSibling !== wrapper.childNodes[0] && wizardObject.selected.previousElementSibling !== null) {
									wizardObject.selected = wizardObject.selected.previousElementSibling;
								} else {
									wizardObject.selected = wrapper.childNodes[wrapper.childNodes.length - 1];
								}
								wizardObject.selected.classList.add('active');
								break;
							case 40: //down
								e.preventDefault();
								wrapper.childNodes.forEach(row => row.classList.remove('active'));

								if (wizardObject.selected === null) wizardObject.selected = wrapper.childNodes[0];
								if (wizardObject.selected.nextElementSibling !== null) {
									wizardObject.selected = wizardObject.selected.nextElementSibling;
								} else {
									wizardObject.selected = wrapper.childNodes[1];
								}
								wizardObject.selected.classList.add('active');
								break;
						}
					},
					openWizard: function (wizardWindow, wizard) {
						const positions = getTextSelection(content);
						wizardObject.start = positions.start;
						wizardObject.end = positions.end;

						//open wizard
						wizardWindow.classList.add('visible');

						//initialize wizard
						if (wizard.initialize !== null) {
							wizard.initialize();
						}

						//focus default field
						$1('#' + wizard.autoFocus).focus();
					},
					closeWizard: function (wizardWindow, wizard) {
						//close wizard
						wizardWindow.classList.remove('visible');
						content.focus();

						//update preview
						update();

						//reset fields
						wizardObject.start = 0;
						wizardObject.end = 0;
						wizardObject.selected = null;
						$('input', wizardWindow).forEach(input => {
							input.value = '';
						});

						//destroy wizard
						if (wizard.destroy !== null) {
							wizard.destroy();
						}
					},
					applyWizard: function (wizardWindow, wizard) {
						if (wizard.apply()) {
							content.setSelectionRange(wizardObject.start, wizardObject.end);
							wizardObject.functions.closeWizard(wizardWindow, wizard);
						}
					}
				},
			wizards: [
				{
					id: 'related-wizard',
					name: 'Related',
					keyCode: 82,
					ctrlKey: true,
					shiftKey: false,
					displayButton: true,
					autoFocus: 'related-search',
					initialize: null,
					destroy: function () {
						$1('#related-search-wrapper').innerHTML = '';
					},
					apply: function () {
						if (wizardObject.selected === null) return false;

						//apply wizard
						const text = '<a class="related" href="wiki/view/' + wizardObject.selected.getAttribute('data-slug') + '">' + wizardObject.selected.getAttribute('data-title') + '</a>';
						const calculatedEnd = wizardObject.start + text.length;
						content.value = content.value.slice(0, wizardObject.start) + text + content.value.slice(wizardObject.start);

						//define content selection
						wizardObject.start = wizardObject.end = calculatedEnd;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Related Entry:',
							properties: [
								{propertyName: 'for', value: 'related-search'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'related-search'},
								{propertyName: 'placeholder', value: 'Search ...'}
							],
							events: [
								{
									eventName: 'input',
									action: function () {
										getAjax('http://localhost:' + PORT + '/wiki/entries/' + encodeURIComponent($1('#related-search').value), function (result) {
											//define user interface handles
											const relatedSearchWrapper = $1('#related-search-wrapper');

											//fill wrapper
											relatedSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>Title</strong></div></div>';
											result = JSON.parse(result);
											for (let i = 0, j = result.length; i < j; i++) {
												const entry = result[i];
												const row = document.createElement('div');
												row.classList.add('row');
												row.setAttribute('data-title', entry.title);
												row.setAttribute('data-slug', entry.slug);
												relatedSearchWrapper.appendChild(row);

												const col = document.createElement('div');
												col.classList.add('col-12');
												row.appendChild(col);

												const a = document.createElement('a');
												a.innerText = entry.title;
												col.appendChild(a);

												addEvent(a, 'click', function (e) {
													e.preventDefault();
													wizardObject.selected = row;
													wizardObject.functions.applyWizard($1('#related-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'related-wizard')[0]);
												});
											}
										});
									}
								},
								{
									eventName: 'keydown',
									action: function (e) {
										wizardObject.functions.arrowNavigation($1('#related-search-wrapper'), e);
									}
								}
							]
						},
						{
							element: 'div',
							content: null,
							properties: [
								{propertyName: 'id', value: 'related-search-wrapper'},
								{propertyName: 'class', value: 'index search-wrapper'}
							]
						}
					]
				},
				{
					id: 'youtube-wizard',
					name: 'YouTube Video',
					keyCode: 89,
					ctrlKey: true,
					shiftKey: true,
					displayButton: true,
					autoFocus: 'youtube-alt-text',
					initialize: function () {
						$1('#youtube-alt-text').value = content.value.slice(wizardObject.start, wizardObject.end);
					},
					destroy: null,
					apply: function () {
						//define user interface handles
						const youtubeText = $1('#youtube-alt-text');
						const youtubeUrl = $1('#youtube-url');

						//validate input
						if (!wizardObject.functions.validateNotEmpty(youtubeText)) return false;
						if (!wizardObject.functions.validateNotEmpty(youtubeUrl) || !wizardObject.functions.validateSpecial(youtubeUrl, () => youtubeUrl.value.match(/\?v=([a-zA-Z0-9\-_]+)/) !== null)) return false;

						//apply wizard
						const text = '[![' + youtubeText.value;
						const link = '](http://img.youtube.com/vi/' + youtubeUrl.value.match(/\?v=([a-zA-Z0-9\-_]+)/)[1] + '/0.jpg)](' + youtubeUrl.value + ')';
						const calculatedSecondPartStart = wizardObject.start + text.length;
						const calculatedEnd = calculatedSecondPartStart + link.length;
						content.value = content.value.slice(0, wizardObject.start) + text + content.value.slice(wizardObject.end);
						content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);

						//define content selection
						wizardObject.start = wizardObject.start = calculatedEnd;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Alternative Text*:',
							properties: [
								{propertyName: 'for', value: 'youtube-alt-text'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'youtube-alt-text'},
								{propertyName: 'placeholder', value: 'Youtube Video Title'}
							]
						},
						{
							element: 'label',
							content: 'Video URL*:',
							properties: [
								{propertyName: 'for', value: 'youtube-url'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'youtube-url'},
								{propertyName: 'placeholder', value: 'https://www.youtube.com/watch?v=yr6cp7cppCc'}
							]
						}
					]
				},
				{
					id: 'image-wizard',
					name: 'Image',
					keyCode: 73,
					ctrlKey: true,
					shiftKey: true,
					displayButton: true,
					autoFocus: 'image-alt-text',
					initialize: function () {
						$1('#image-alt-text').value = content.value.slice(wizardObject.start, wizardObject.end);
						$1('#image-timestamp').value = Date.now();

						const imageQuality = $1('#image-quality');
						for (let i = 1; i <= 10; i++) {
							const option = document.createElement('option');
							option.text = i * 10 + '%';
							option.value = '' + i * 10;
							imageQuality.appendChild(option);
						}
						imageQuality.value = '60';
					},
					destroy: function () {
						$1('#image-container').innerHTML = '';
						$1('#image-download-button').classList.remove('error', 'downloading');
						$1('#image-delete-button').classList.remove('error', 'deleting');
					},
					apply: function () {
						//define user interface handles
						const imageText = $1('#image-alt-text');
						const imageUrl = $1('#image-url');

						//validate input
						if (!wizardObject.functions.validateNotEmpty(imageText)) return false;
						if (!wizardObject.functions.validateNotEmpty(imageUrl)) return false;

						//apply wizard
						const text = '[![' + imageText.value;
						const link = '](' + imageUrl.value + ')](' + imageUrl.value + ')';
						const calculatedSecondPartStart = wizardObject.start + text.length;
						const calculatedEnd = calculatedSecondPartStart + link.length;
						content.value = content.value.slice(0, wizardObject.start) + text + content.value.slice(wizardObject.end);
						content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);

						//define content selection
						wizardObject.start = wizardObject.end = calculatedEnd;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Alternative Text*:',
							properties: [
								{propertyName: 'for', value: 'image-alt-text'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'image-alt-text'},
								{propertyName: 'placeholder', value: 'Google Logo'}
							]
						},
						{
							element: 'label',
							content: 'Image URL*:',
							properties: [
								{propertyName: 'for', value: 'image-url'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'image-url'},
								{propertyName: 'placeholder', value: 'https://google.com/image.jpg'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'hidden'},
								{propertyName: 'id', value: 'image-timestamp'}
							]
						},
						{
							element: 'div',
							content: [
								{
									element: 'div',
									content: [
										{
											element: 'label',
											content: 'Quality:',
											properties: [
												{propertyName: 'for', value: 'image-quality'},
												{propertyName: 'class', value: 'hidden'},
											]
										},
										{
											element: 'select',
											content: null,
											properties: [
												{propertyName: 'id', value: 'image-quality'},
												{propertyName: 'dir', value: 'rtl'},
												{propertyName: 'title', value: 'Compression Quality'},
											]
										}
									],
									properties: [
										{propertyName: 'class', value: 'col-4'},
									]
								},
								{
									element: 'div',
									content: [
										{
											element: 'a',
											content: 'Save Image Locally',
											properties: [
												{propertyName: 'id', value: 'image-download-button'},
												{propertyName: 'class', value: 'button download'},
											],
											events: [
												{
													eventName: 'click',
													action: function (e) {
														e.preventDefault();
														//define user interface handles
														const imageUrl = $1('#image-url');
														const imageDownloadButton = $1('#image-download-button');
														const imageDeleteButton = $1('#image-delete-button');
														const imageTimestamp = $1('#image-timestamp');
														const imageContainer = $1('#image-container');
														const imageQuality = $1('#image-quality');

														//validate input
														if (imageUrl.value.length <= 0 || imageUrl.value.match(/https?/i) === null) {
															imageUrl.classList.add('error');
															return;
														}

														//reset user interface
														imageUrl.classList.remove('error');
														imageDownloadButton.classList.remove('error');
														imageDownloadButton.classList.add('downloading');
														imageDownloadButton.innerText = "Downloading";
														imageContainer.innerHTML = '';
														imageDeleteButton.classList.remove('visible');

														//download image
														getAjax('http://localhost:' + PORT + '/wiki/download/' + encodeURIComponent(imageUrl.value) + '/' + imageTimestamp.value + '/' + imageQuality.value, function (result) {
															//update user interface
															imageDownloadButton.classList.remove('downloading');
															imageDownloadButton.innerText = "Save Image Locally";
															if (result === 'error') {
																imageDownloadButton.classList.add('error');
																return;
															}
															imageDownloadButton.classList.remove('error');

															//create image preview
															const imagePath = '/wiki/img/' + imageTimestamp.value + '.jpg';
															const a = document.createElement('a');
															a.target = '_blank';
															a.href = imagePath;
															imageContainer.appendChild(a);

															const img = document.createElement('img');
															img.src = imagePath;
															a.appendChild(img);

															imageUrl.value = imagePath;
															imageDeleteButton.classList.add('visible');
														});
													}
												}
											]
										}
									],
									properties: [
										{propertyName: 'class', value: 'col-8'},
									]
								}
							],
							properties: [
								{propertyName: 'class', value: 'row'}
							]
						},
						{
							element: 'div',
							content: null,
							properties: [
								{propertyName: 'id', value: 'image-container'}
							]
						},
						{
							element: 'a',
							content: 'Delete Image',
							properties: [
								{propertyName: 'id', value: 'image-delete-button'},
								{propertyName: 'class', value: 'button delete'}
							],
							events: [
								{
									eventName: 'click',
									action: function (e) {
										e.preventDefault();

										//define user interface handles
										const imageDeleteButton = $1('#image-delete-button');
										const imageTimestamp = $1('#image-timestamp');
										const imageContainer = $1('#image-container');
										const imageUrl = $1('#image-url');

										//update user interface
										imageDeleteButton.classList.add('deleting');

										//delete image
										getAjax('http://localhost:' + PORT + '/wiki/deleteImage/' + imageTimestamp.value, function (result) {
											//update user interface
											imageDeleteButton.classList.remove('deleting');
											if (result === 'error') {
												imageDeleteButton.classList.add('error');
											} else {
												imageContainer.innerHTML = '';
												imageUrl.value = '';
												imageUrl.focus();
												imageDeleteButton.classList.remove('visible');
												imageDeleteButton.classList.remove('error');
											}
										});
									}
								}
							]
						},
					]
				},
				{
					id: 'link-wizard',
					name: 'Link',
					keyCode: 65,
					ctrlKey: true,
					shiftKey: true,
					displayButton: true,
					autoFocus: 'link-text',
					initialize: function () {
						$1('#link-text').value = content.value.slice(wizardObject.start, wizardObject.end);
					},
					destroy: function () {
						$1('#link-search-wrapper').innerHTML = '';
					},
					apply: function () {
						//define user interface handles
						let text;
						let link;
						const linkText = $1('#link-text');
						const linkUrl = $1('#link-url');

						//validate and prepare input
						if (wizardObject.selected !== null) {
							text = '[' + (linkText.value.length <= 0 ? wizardObject.selected.getAttribute('data-title') : linkText.value);
							link = '](wiki/view/' + wizardObject.selected.getAttribute('data-slug') + ')';
						} else {
							if (!wizardObject.functions.validateNotEmpty(linkText)) return false;
							if (!wizardObject.functions.validateNotEmpty(linkUrl)) return false;

							text = '[' + linkText.value;
							link = '](' + linkUrl.value + ')';
						}

						//apply wizard
						const calculatedSecondPartStart = wizardObject.start + text.length;
						const calculatedEnd = calculatedSecondPartStart + link.length;
						content.value = content.value.slice(0, wizardObject.start) + text + content.value.slice(wizardObject.end);
						content.value = content.value.slice(0, calculatedSecondPartStart) + link + content.value.slice(calculatedSecondPartStart);

						//define content selection
						wizardObject.start = wizardObject.end = calculatedEnd;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Text*:',
							properties: [
								{propertyName: 'for', value: 'link-text'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'link-text'},
								{propertyName: 'placeholder', value: 'Google'}
							]
						},
						{
							element: 'label',
							content: 'URL*:',
							properties: [
								{propertyName: 'for', value: 'link-url'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'link-url'},
								{propertyName: 'placeholder', value: 'https://google.com'}
							]
						},
						{
							element: 'label',
							content: 'Link an entry:',
							properties: [
								{propertyName: 'for', value: 'link-search'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'link-search'},
								{propertyName: 'placeholder', value: 'Search ...'}
							],
							events: [
								{
									eventName: 'input',
									action: function () {
										getAjax('http://localhost:' + PORT + '/wiki/entries/' + encodeURIComponent($1('#link-search').value), function (result) {
											//define user interface handles
											const linkSearchWrapper = $1('#link-search-wrapper');

											//fill wrapper
											linkSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>Title</strong></div></div>';
											result = JSON.parse(result);
											for (let i = 0, j = result.length; i < j; i++) {
												const entry = result[i];
												const row = document.createElement('div');
												row.classList.add('row');
												row.setAttribute('data-title', entry.title);
												row.setAttribute('data-slug', entry.slug);
												linkSearchWrapper.appendChild(row);

												const col = document.createElement('div');
												col.classList.add('col-12');
												row.appendChild(col);

												const a = document.createElement('a');
												a.innerText = entry.title;
												col.appendChild(a);

												addEvent(a, 'click', e => {
													e.preventDefault();
													wizardObject.selected = row;
													wizardObject.functions.applyWizard($1('#link-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'link-wizard')[0]);
												});
											}
										});
									}
								},
								{
									eventName: 'keydown',
									action: function (e) {
										wizardObject.functions.arrowNavigation($1('#link-search-wrapper'), e);
									}
								}
							]
						},
						{
							element: 'div',
							content: null,
							properties: [
								{propertyName: 'id', value: 'link-search-wrapper'},
								{propertyName: 'class', value: 'index search-wrapper'}
							]
						}
					]
				},
				{
					id: 'color-wizard',
					name: 'Color',
					keyCode: 80,
					ctrlKey: true,
					shiftKey: true,
					displayButton: true,
					autoFocus: 'color-custom',
					initialize: function () {
						//define user interface handles
						const customColor = $1('#color-custom');

						customColor.value = '#FF0000';
						customColor.setSelectionRange(0, customColor.value.length);
					},
					destroy: function () {
						$1('#color-search-wrapper').childNodes.forEach(color => color.classList.remove('active'));
					},
					apply: function () {
						//define user interface handles
						const customColor = $1('#color-custom');

						//validate input
						if (wizardObject.selected === null && !wizardObject.functions.validateSpecial(customColor, () => customColor.value.match(/#([a-zA-Z0-9]{3}|[a-zA-Z0-9]{4}|[a-zA-Z0-9]{6}|[a-zA-Z0-9]{8})$/) !== null)) return false;

						//apply wizard
						const firstPart = '<span style="color: ' + (wizardObject.selected !== null ?
							wizardObject.selected.getAttribute('data-color') :
							customColor.value) + '">';
						const secondPart = '</span>';
						const calculatedSecondPartStart = wizardObject.end + firstPart.length;
						content.value = content.value.slice(0, wizardObject.start) + firstPart + content.value.slice(wizardObject.start);
						content.value = content.value.slice(0, calculatedSecondPartStart) + secondPart + content.value.slice(calculatedSecondPartStart);

						//define content selection
						wizardObject.start += firstPart.length;
						wizardObject.end += firstPart.length;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Custom Color:',
							properties: [
								{propertyName: 'for', value: 'color-custom'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'color-custom'},
								{propertyName: 'placeholder', value: '#000000'},
								{propertyName: 'value', value: '#FF0000'}
							],
							events: [
								{
									eventName: 'keydown',
									action: function (e) {
										wizardObject.functions.arrowNavigation($1('#color-search-wrapper'), e);
									}
								}
							]
						},
						{
							element: 'div',
							content: [
								{
									element: 'div',
									content: [
										{
											element: 'div',
											content: [
												{
													element: 'strong',
													content: 'Fast Access Colors'
												}
											],
											properties: [
												{propertyName: 'class', value: 'col-12'}
											]
										}
									],
									properties: [
										{propertyName: 'class', value: 'row'}
									]
								},
								{
									element: 'div',
									content: [
										{
											element: 'div',
											content: [
												{
													element: 'a',
													content: 'Red',
													events: [
														{
															eventName: 'click',
															action: function () {
																wizardObject.selected = $1('#color-red');
																wizardObject.functions.applyWizard($1('#color-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'color-wizard')[0]);
															}
														}
													]
												}
											],
											properties: [
												{propertyName: 'class', value: 'col-12'}
											]
										}
									],
									properties: [
										{propertyName: 'id', value: 'color-red'},
										{propertyName: 'class', value: 'row'},
										{propertyName: 'data-color', value: '#FF0000'}
									]
								},
								{
									element: 'div',
									content: [
										{
											element: 'div',
											content: [
												{
													element: 'a',
													content: 'Yellow',
													events: [
														{
															eventName: 'click',
															action: function () {
																wizardObject.selected = $1('#color-yellow');
																wizardObject.functions.applyWizard($1('#color-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'color-wizard')[0]);
															}
														}
													]
												}
											],
											properties: [
												{propertyName: 'class', value: 'col-12'}
											]
										}
									],
									properties: [
										{propertyName: 'id', value: 'color-yellow'},
										{propertyName: 'class', value: 'row'},
										{propertyName: 'data-color', value: '#FFFF00'}
									]
								},
								{
									element: 'div',
									content: [
										{
											element: 'div',
											content: [
												{
													element: 'a',
													content: 'Green',
													events: [
														{
															eventName: 'click',
															action: function () {
																wizardObject.selected = $1('#color-green');
																wizardObject.functions.applyWizard($1('#color-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'color-wizard')[0]);
															}
														}
													]
												}
											],
											properties: [
												{propertyName: 'class', value: 'col-12'}
											]
										}
									],
									properties: [
										{propertyName: 'id', value: 'color-green'},
										{propertyName: 'class', value: 'row'},
										{propertyName: 'data-color', value: '#00FF00'}
									]
								},
								{
									element: 'div',
									content: [
										{
											element: 'div',
											content: [
												{
													element: 'a',
													content: 'Blue',
													events: [
														{
															eventName: 'click',
															action: function () {
																wizardObject.selected = $1('#color-blue');
																wizardObject.functions.applyWizard($1('#color-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'color-wizard')[0]);
															}
														}
													]
												}
											],
											properties: [
												{propertyName: 'class', value: 'col-12'}
											]
										}
									],
									properties: [
										{propertyName: 'id', value: 'color-blue'},
										{propertyName: 'class', value: 'row'},
										{propertyName: 'data-color', value: '#0000FF'}
									]
								}
							],
							properties: [
								{propertyName: 'id', value: 'color-search-wrapper'},
								{propertyName: 'class', value: 'index search-wrapper'}
							]
						}
					]
				},
				{
					id: 'file-wizard',
					name: 'File',
					keyCode: 71,
					ctrlKey: true,
					shiftKey: false,
					displayButton: true,
					autoFocus: 'file-search',
					initialize: null,
					destroy: function () {
						$1('#file-search-wrapper').innerHTML = '';
					},
					apply: function () {
						//validate input
						if (wizardObject.selected === null) return false;

						//apply wizard
						const link = '<a href="/wiki/files/' + wizardObject.selected.getAttribute('data-filename') + '" target="_blank">' + wizardObject.selected.getAttribute('data-filename') + '</a>';
						const calculatedEnd = wizardObject.start + link.length;
						content.value = content.value.slice(0, wizardObject.start) + link + content.value.slice(wizardObject.start);

						//define content selection
						wizardObject.start = wizardObject.end = calculatedEnd;
						return true;
					},
					content: [
						{
							element: 'label',
							content: 'Attach a file:',
							properties: [
								{propertyName: 'for', value: 'file-search'}
							]
						},
						{
							element: 'input',
							content: null,
							properties: [
								{propertyName: 'type', value: 'text'},
								{propertyName: 'id', value: 'file-search'},
								{propertyName: 'placeholder', value: 'Search ...'}
							],
							events: [
								{
									eventName: 'input',
									action: function () {
										getAjax('http://localhost:' + PORT + '/wiki/filelist/' + encodeURIComponent($1('#file-search').value), function (files) {
											//define user interface handles
											const fileSearchWrapper = $1('#file-search-wrapper');

											fileSearchWrapper.innerHTML = '<div class="row"><div class="col-12"><strong>File Name</strong></div></div>';
											files = JSON.parse(files);
											for (let i = 0, j = files.length; i < j; i++) {
												const row = document.createElement('div');
												row.classList.add('row');
												row.setAttribute('data-filename', files[i]);
												fileSearchWrapper.appendChild(row);

												const col = document.createElement('div');
												col.classList.add('col-12');
												row.appendChild(col);

												const a = document.createElement('a');
												a.innerText = files[i];
												col.appendChild(a);

												addEvent(a, 'click', e => {
													e.preventDefault();
													wizardObject.selected = row;
													wizardObject.functions.applyWizard($1('#file-wizard-window'), wizardObject.wizards.filter(wizard => wizard.id === 'file-wizard')[0]);
												});
											}
										});
									}
								},
								{
									eventName: 'keydown',
									action: function (e) {
										wizardObject.functions.arrowNavigation($1('#file-search-wrapper'), e);
									}
								}
							]
						},
						{
							element: 'div',
							content: null,
							properties: [
								{propertyName: 'id', value: 'file-search-wrapper'},
								{propertyName: 'class', value: 'index search-wrapper'}
							]
						}
					]
				}
			]
		};

		let dirty = false;
		const editor = $1('#editor');
		const displayActivator = $1('#display-activator');
		const editorActivator = $1('#editor-activator');
		const content = $1('#content');
		const title = $1('#title');
		const slug = $1('#slug');
		let latestSaveSlug = slug.value;
		const tags = $1('#tags');
		const preview = $1('#preview');
		const saveButton = $1('#save-button');
		const deleteButton = $1('#delete-button');
		const viewButton = $1('#view-button');
		const viewMaterialButton = $1('#view-material-button');
		const buttonWrapper = $1('#button-wrapper');

		const update = function () {
			preview.innerHTML = marked(content.value);
			preview.innerHTML = preview.innerHTML.replace(/\s(href|alt|id)=".*?"/g, '');
			Prism.highlightAll();
			debounce(setCursor, 200)();
		};
		const setCursor = function () {
			const positions = getTextSelection(content);
			let originalText = content.value.substr(0, positions.start);

			//do a first markdown to html conversion to get trailing, unconverted markdown elements (e.g., ** without counterpart)
			let translatedText = marked(originalText).trim();

			//search for unmatched (elements without closing partner) markdown elements
			const matches = translatedText.replace(/\s(src|href)=".+?"/g, '').match(/(\[(.*)])|\[.+](\().*$|(\[)|(~~)|(\*\*\*)|(\*\*)|(___)|(_)|(```)|(`)/g);
			if (matches != null) {
				//close elements in reverse order by appending to the original text
				matches.reverse().forEach(function (markdown) {
					if (markdown.match(/\[.+]\(.*/)) markdown = ')';
					if (markdown.match(/\[.*]/)) markdown = '()';
					if (markdown.match(/\[.*/)) markdown = ']()';
					originalText += markdown;
				});
			}

			//do a second markdown to html conversion, this time with all tags properly closed
			translatedText = marked(originalText).trim();

			//get rid of links, ids and alternative texts (they are not important for the display of elements and they get in the way of cursor placement)
			translatedText = translatedText.replace(/\s(href|alt|id)=".*?"/g, '');

			//prepare line breaks
			translatedText = translatedText.replace(/<br\/>/g, '<br>');

			//prepare prism
			translatedText = translatedText.replace(/<pre><code class="lang-(.+)">/g, '<pre class=" language-$1"><code class=" language-$1">');

			//use prism
			translatedText = translatedText.replace(/<pre class="\s?language-([a-zA-Z0-9]+)"><code class="\s?language-[a-zA-Z0-9]+">([\s\S]*)<\/code><\/pre>/g, function (match, language, code) {
				return '<pre class=" language-' + language + '"><code class=" language-' + language + '">' + Prism.highlight(code, Prism.languages[language], language).trim() + '</code></pre>';
			});

			//get rid of trailing closing tags
			while (translatedText.match(/<\/[a-zA-Z0-9]{1,10}>$/)) translatedText = translatedText.replace(/<\/[a-zA-Z0-9]{1,10}>$/, '').trim();

			//ensure that cursor is not in an HTML tag
			const prevHtml = preview.innerHTML;
			const prevHtmlLength = prevHtml.length;
			let cursorPosition = translatedText.length - 1;
			let opened = 0;
			const countOpened = function (i) {
				if (prevHtml[i] === '<') {
					opened++;
				} else if (prevHtml[i] === '>') {
					opened--;
				}
			};
			do {
				opened = 0;
				cursorPosition++;
				if (cursorPosition > prevHtmlLength / 2) {
					for (let i = prevHtmlLength - 1; i >= cursorPosition; i--) countOpened(i)
				} else {
					for (let i = 0; i < cursorPosition; i++) countOpened(i);
				}
			} while (opened !== 0 && cursorPosition <= prevHtmlLength);

			//remove any set cursors and set new cursor
			const cursorHtml = cursorPosition === 0 ? '<p><span id="cursor"></span></p>' : '<span id="cursor"></span>';
			preview.innerHTML = preview.innerHTML.slice(0, cursorPosition) + cursorHtml + preview.innerHTML.slice(cursorPosition);

			const cursor = $1('#cursor', preview);
			if (isOffScreen(cursor)) debounce(scrollIt(cursor), 200);
		};
		const checkSlug = function (callback) {
			getAjax('http://localhost:' + PORT + '/wiki/checkslug/' + slug.value, function (result) {
				callback(result);
			});
		};
		const applyStyle = function (fct) {
			if (fct.customCommand !== undefined) {
				fct.customCommand(fct);
			} else {
				const positions = getTextSelection(content);
				const calculatedSecondPartStart = positions.end + fct.delimiterStart.length;
				content.value = content.value.slice(0, positions.start) + fct.delimiterStart + content.value.slice(positions.start);
				content.value = content.value.slice(0, calculatedSecondPartStart) + fct.delimiterEnd + content.value.slice(calculatedSecondPartStart);
				const calculatedEndPosition = positions.end + fct.delimiterStart.length + fct.delimiterEnd.length - (positions.start === positions.end ?
					fct.endPositionNoSelection :
					fct.endPositionWithSelection);
				content.setSelectionRange(calculatedEndPosition, calculatedEndPosition);
				content.focus();
				update();
			}
		};
		const save = function (callback) {
			getAjax('http://localhost:' + PORT + '/wiki/save/' + encodeURIComponent(title.value) + '/' + encodeURIComponent(slug.value) + '/' + encodeURIComponent(latestSaveSlug) + '/' + encodeURIComponent(tags.value) + '/' + encodeURIComponent(content.value), function (result) {
				callback(result);
			});
		};
		const saveCallback = function (result) {
			if (result === 'success') {
				latestSaveSlug = slug.value;
				viewButton.href = '/wiki/view/' + latestSaveSlug;
				viewMaterialButton.href = '/wiki/view/' + latestSaveSlug;
				saveButton.classList.remove('error');
				setDirty(false);
			} else {
				//error while saving
				saveButton.classList.add('error');
			}
			saveButton.classList.remove('saving');
		};
		const attemptSaving = function () {
			saveButton.classList.remove('error');
			if (title !== document.activeElement && slug !== document.activeElement && title.value.length > 0 && slug.value.length > 0 && content.value.length > 0 && title.value !== '{% block title %}' && slug.value !== '{% block slug %}' && tags.value !== '{% block tags %}' && content.value !== '{% block content %}') {
				saveButton.classList.add('saving');
				if (slug.value !== latestSaveSlug) {
					checkSlug(function (result) {
						if (result === 'free') {
							save(saveCallback);
						}
					});
				} else {
					save(saveCallback);
				}
			} else {
				saveButton.classList.add('error');
			}
		};
		const setDirty = function (d) {
			dirty = d;
			if (dirty) {
				saveButton.innerText = 'Save Changes!';
				saveButton.classList.remove('success');
				window.onbeforeunload = () => true;
			} else {
				saveButton.innerText = 'Saved';
				saveButton.classList.add('success');
				window.onbeforeunload = null;
			}
		};

		addEvent(title, 'input', function () {
			setDirty(true);
			slug.value = title.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
			if (slug.value !== latestSaveSlug) {
				checkSlug(function (result) {
					if (result === 'free') {
						slug.classList.remove('error');
					} else {
						slug.classList.add('error');
					}
				});
			}
			if (title.value.length <= 0) {
				title.classList.add('error');
			} else {
				title.classList.remove('error');
			}
		});
		addEvent(slug, 'input', function () {
			setDirty(true);
			if (slug.value !== latestSaveSlug) {
				checkSlug(function (result) {
					if (result === 'free') {
						slug.classList.remove('error');
					} else {
						slug.classList.add('error');
					}
				});
			} else {
				slug.classList.remove('error');
			}
		});
		addEvent(tags, 'input', function () {
			setDirty(true);
		});
		addEvent(content, 'input', function () {
			setDirty(true);
			update();
		});
		addEvent(content, 'keydown', function (e) {
			if (e.ctrlKey || e.keyCode === 9) { //ctrl key or tab
				md.forEach(function (fct) {
					if (e.keyCode === fct.keyCode && e.ctrlKey === fct.ctrlKey && e.shiftKey === fct.shiftKey) {
						e.preventDefault();
						applyStyle(fct);
					}
				});
			}
		});
		addEvent(content, 'keyup', function (e) {
			if (e.keyCode >= 33 && e.keyCode <= 40) update();
		});
		addEvent(content, 'click', update);
		addEvent(document, 'keydown', function (e) {
			if (e.keyCode === 9 && content === document.activeElement) { //tab
				e.preventDefault();
			}
			if (e.keyCode === 83 && e.ctrlKey) {
				e.preventDefault();
				attemptSaving();
			}
		});
		addEvent(document, 'scroll', function () {
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			if (scrollTop > 240) {
				editor.style.top = '0';
			} else {
				editor.style.top = 240 - scrollTop + 'px';
			}
		});
		addEvent(saveButton, 'click', function (e) {
			e.preventDefault();
			attemptSaving();
		});
		addEvent(deleteButton, 'click', function (e) {
			e.preventDefault();
			const confirm = window.confirm('Are you sure you want to delete this entry?');
			if (!confirm) return;
			getAjax('http://localhost:' + PORT + '/wiki/delete/' + latestSaveSlug, function (result) {
				if (result === 'success') {
					location.href = 'http://localhost:' + PORT + '/wiki/index';
				} else {
					deleteButton.classList.add('error');
				}
			});
		});

		addEvent(displayActivator, 'mouseover', function () {
			editor.style['z-index'] = '0';
		});
		addEvent(editorActivator, 'mouseover', function () {
			editor.style['z-index'] = '1';
		});
		addEvent(preview, 'click', function (e) {
			const search = getMouseEventCaretRange(e).endContainer.data;
			const contentPosition = content.value.indexOf(search);
			content.setSelectionRange(contentPosition, contentPosition);
			content.focus();
		});

		addEvent(window, 'resize', function () {
			content.style.height = 'calc(100% - ' + (buttonWrapper.offsetHeight + 50) + 'px)';
		});

		//add wizards to document
		wizardObject['wizards'].filter(wizard => wizard.displayButton).forEach(function (wizard) {
			//create wizard button
			const span = document.createElement('span');
			span.classList.add('icon');
			span.setAttribute('id', wizard.id + '-button');
			span.setAttribute('title', (wizard.ctrlKey ? 'Ctrl+' : '') + (wizard.shiftKey ? 'Shift+' :
				'') + String.fromCharCode(wizard.keyCode));
			span.textContent = wizard.name;
			buttonWrapper.appendChild(span);

			const divider = document.createElement('span');
			divider.textContent = ' ';
			buttonWrapper.appendChild(divider);

			//create wizard window
			const win = document.createElement('div');
			win.classList.add('insertion-wrapper', 'edit');
			win.id = wizard.id + '-window';

			const container = document.createElement('div');
			container.classList.add('container');
			win.appendChild(container);

			const row = document.createElement('div');
			row.classList.add('row');
			container.appendChild(row);

			const col = document.createElement('div');
			col.classList.add('col-12', 'col-md-8', 'offset-md-2', 'col-lg-4', 'offset-lg-4', 'field-container');
			row.appendChild(col);

			const title = document.createElement('h1');
			title.textContent = wizard.name;
			col.appendChild(title);

			expandHtml(col, wizard.content);

			const finishButton = document.createElement('a');
			finishButton.classList.add('button', 'save', 'success');
			finishButton.textContent = 'Finish';
			finishButton.title = 'Enter';
			col.appendChild(finishButton);

			const cancelButton = document.createElement('a');
			cancelButton.classList.add('button', 'delete');
			cancelButton.textContent = 'Cancel';
			cancelButton.title = 'Esc';
			col.appendChild(cancelButton);

			document.body.appendChild(win);

			//open wizard functionality
			addEvent(span, 'click', function () {
				wizardObject.functions.openWizard(win, wizard);
			});
			addEvent(content, 'keydown', function (e) {
				if (e.ctrlKey === wizard.ctrlKey && e.shiftKey === wizard.shiftKey && e.keyCode === wizard.keyCode) {
					e.preventDefault();
					wizardObject.functions.openWizard(win, wizard);
				}
			});

			//wizard navigation functionality
			addEvent(win, 'keydown', function (e) {
				switch (e.keyCode) {
					case 13: //enter
						e.preventDefault();
						wizardObject.functions.applyWizard(win, wizard);
						break;
					case 27: //escape
						wizardObject.functions.closeWizard(win, wizard);
						break;
				}
			});
			addEvent(finishButton, 'click', function () {
					wizardObject.functions.applyWizard(win, wizard);
				}
			);
			addEvent(cancelButton, 'click', function () {
				wizardObject.functions.closeWizard(win, wizard);
			});
		});

		//add markdown shortcuts to document
		md.filter(fct => fct.displayButton).forEach(function (fct) {
			const span = document.createElement('span');
			span.classList.add('icon');
			span.setAttribute('id', fct.name);
			span.setAttribute('title', (fct.ctrlKey ? 'Ctrl+' : '') + (fct.shiftKey ? 'Shift+' : '') + String.fromCharCode(fct.keyCode));
			span.textContent = fct.text;
			buttonWrapper.appendChild(span);

			const divider = document.createElement('span');
			divider.textContent = ' ';
			buttonWrapper.appendChild(divider);

			addEvent(span, 'click', () => applyStyle(fct));
		});

		//update content preview
		update();

		//save document regularly
		setInterval(attemptSaving, 2000);

		//focus content field
		content.focus();
	}
);