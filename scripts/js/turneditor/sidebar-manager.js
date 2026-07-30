import { renderDirectionSelect, restoreTextInput } from './direction-helpers.js';
import { addCriteriaRow, getLastTargetRow, isRowBlank, MAX_CRITERIA_ROWS, renumberCriteria, setActiveRow, updateAddButton } from './row-manager.js';
import { ORDER_VALIDATION } from './validation-rules.js';

export function setSidebarTab(tab) {
	document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
	const el = document.getElementById(`sidebar-tab-${tab}`);
	if (el) el.classList.add('active');
}

export function toggleTree(item) {
	const arrow = item.querySelector('.tree-arrow');
	if (arrow && arrow.classList.contains('spacer')) return;
	if (arrow) arrow.classList.toggle('expanded');
	const children = item.nextElementSibling;
	if (children && children.classList.contains('tree-children')) {
		children.classList.toggle('open');
	}
}

export function expandAllTree() {
	setSidebarTab('expand');
	const treeView = document.getElementById('tree-view');
	if (!treeView) return;
	const headings = treeView.querySelectorAll(':scope > .tree-item');
	headings.forEach(heading => {
		const arrow = heading.querySelector('.tree-arrow');
		if (arrow && !arrow.classList.contains('spacer')) {
			arrow.classList.add('expanded');
		}
		const children = heading.nextElementSibling;
		if (children && children.classList.contains('tree-children')) {
			children.classList.add('open');
		}
	});
}

export function collapseAllTree() {
	setSidebarTab('collapse');
	const treeView = document.getElementById('tree-view');
	if (!treeView) return;
	const headings = treeView.querySelectorAll(':scope > .tree-item');
	headings.forEach(heading => {
		const arrow = heading.querySelector('.tree-arrow');
		if (arrow && !arrow.classList.contains('spacer')) {
			arrow.classList.remove('expanded');
		}
		const children = heading.nextElementSibling;
		if (children && children.classList.contains('tree-children')) {
			children.classList.remove('open');
		}
	});
}

export function selectSidebarOrder(item, code) {
	document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
	item.classList.add('selected');

	const criteriaContainer = document.getElementById('criteria-rows');
	if (!criteriaContainer) return;

	let lastTargetRow = getLastTargetRow();
	let targetRow = lastTargetRow && document.body.contains(lastTargetRow) ? lastTargetRow : null;

	// If current target row is not blank, search for a blank row or create a new row
	if (!targetRow || !isRowBlank(targetRow)) {
		const rows = Array.from(criteriaContainer.querySelectorAll('.criteria-row'));
		const blankRow = rows.find(r => isRowBlank(r));
		if (blankRow) {
			targetRow = blankRow;
		} else {
			if (rows.length < MAX_CRITERIA_ROWS) {
				addCriteriaRow(criteriaContainer);
				targetRow = getLastTargetRow();
			} else {
				targetRow = rows[rows.length - 1];
			}
		}
	}

	if (targetRow) {
		setActiveRow(targetRow);

		// Store the order name for validation lookup
		const orderName = item.getAttribute('data-order-name') ||
			item.querySelector('.tree-label')?.textContent?.replace(/\s*\(.*\)$/, '').trim() || '';
		targetRow.setAttribute('data-order-name', orderName);

		// Clear any previous validation errors on this row
		targetRow.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error'));

		const orderCode = code ? code.toUpperCase() : '';
		const schema = ORDER_VALIDATION[orderName];
		const isPath = !!(schema && schema.prepend === 9);

		const wrappers = targetRow.querySelectorAll('.criteria-field .criteria-input-wrapper');

		// Handle field 0 (Order Code)
		let firstInput = wrappers[0] ? wrappers[0].querySelector('input') : null;
		if (firstInput) {
			firstInput.value = orderCode;
			firstInput.dispatchEvent(new Event('input', { bubbles: true }));
			firstInput.dispatchEvent(new Event('change', { bubbles: true }));
		}

		if (orderCode === 'H' || orderCode === 'T') {
			for (let fi = 1; fi <= 2; fi++) {
				if (wrappers[fi]) {
					const elem = wrappers[fi].querySelector('input, select');
					const curVal = elem ? elem.value : '';
					renderDirectionSelect(wrappers[fi], elem ? elem.id : '', elem ? elem.name : '', isPath, curVal, () => updateAddButton(criteriaContainer));
				}
			}
			renumberCriteria(criteriaContainer);
		} else {
			// Restore text inputs for non-H/T orders
			for (let fi = 1; fi <= 2; fi++) {
				if (wrappers[fi]) {
					const elem = wrappers[fi].querySelector('input, select');
					if (elem) {
						restoreTextInput(wrappers[fi], elem.id, elem.name);
					}
				}
			}
			renumberCriteria(criteriaContainer);

			const inputs = targetRow.querySelectorAll('.criteria-field input, .criteria-field select');

			// Re-enable any previously locked fields before applying new order
			for (let i = 1; i < inputs.length; i++) {
				inputs[i].disabled = false;
				inputs[i].classList.remove('locked-field');
			}

			if (schema) {
				// Auto-fill values
				if (schema.autofill) {
					Object.keys(schema.autofill).forEach(idx => {
						const fi = Number(idx) + 1; // fields[0] maps to inputs[1]
						if (inputs[fi]) {
							inputs[fi].value = String(schema.autofill[idx]);
						}
					});
				}
				// Lock fields that should not be editable
				if (schema.lockFields) {
					schema.lockFields.forEach(idx => {
						const fi = idx + 1;
						if (inputs[fi]) {
							inputs[fi].disabled = true;
							inputs[fi].classList.add('locked-field');
						}
					});
				}
				// Disable fields not required by the order (null in schema)
				if (schema.fields[0] === null && inputs[1]) {
					inputs[1].value = '';
					inputs[1].disabled = true;
					inputs[1].classList.add('locked-field');
				}
				if (schema.fields[1] === null && inputs[2]) {
					inputs[2].value = '';
					inputs[2].disabled = true;
					inputs[2].classList.add('locked-field');
				}
			}
		}

		// Focus the first enabled non-order input
		const inputs = targetRow.querySelectorAll('.criteria-field input, .criteria-field select');
		const focusTarget = Array.from(inputs).slice(1).find(inp => !inp.disabled);
		if (focusTarget) {
			focusTarget.focus();
		} else if (firstInput) {
			firstInput.focus();
		}
	}
}

export function initSidebarSearch() {
	const searchInput = document.getElementById('sidebar-search-input');
	const clearBtn = document.getElementById('sidebar-search-clear');

	if (searchInput && clearBtn) {
		searchInput.addEventListener('input', function () {
			const query = this.value.toLowerCase().trim();
			clearBtn.classList.toggle('visible', query !== '');

			const treeView = document.getElementById('tree-view');
			if (!treeView) return;

			const headings = treeView.querySelectorAll(':scope > .tree-item');

			headings.forEach(heading => {
				const childrenContainer = heading.nextElementSibling;
				const isGroup = childrenContainer && childrenContainer.classList.contains('tree-children');
				const headingLabel = heading.querySelector('.tree-label');
				const headingText = headingLabel ? headingLabel.textContent.toLowerCase() : '';

				if (query === '') {
					heading.style.display = '';
					if (isGroup) {
						childrenContainer.style.display = '';
						childrenContainer.classList.remove('open');
						const arrow = heading.querySelector('.tree-arrow');
						if (arrow) arrow.classList.remove('expanded');
						childrenContainer.querySelectorAll('.tree-item').forEach(child => {
							child.style.display = '';
						});
					}
					return;
				}

				const headingMatch = headingText.includes(query);
				let anyChildMatch = false;
				if (isGroup) {
					const children = childrenContainer.querySelectorAll('.tree-item');
					children.forEach(child => {
						const childLabel = child.querySelector('.tree-label');
						const childText = childLabel ? childLabel.textContent.toLowerCase() : '';
						const matches = childText.includes(query);
						child.style.display = (headingMatch || matches) ? '' : 'none';
						if (matches) anyChildMatch = true;
					});
				}

				if (headingMatch || anyChildMatch) {
					heading.style.display = '';
					if (isGroup) {
						childrenContainer.style.display = '';
						childrenContainer.classList.add('open');
						const arrow = heading.querySelector('.tree-arrow');
						if (arrow) arrow.classList.add('expanded');
					}
				} else {
					heading.style.display = 'none';
					if (isGroup) {
						childrenContainer.style.display = 'none';
					}
				}
			});
		});

		clearBtn.addEventListener('click', function () {
			searchInput.value = '';
			searchInput.dispatchEvent(new Event('input', { bubbles: true }));
			searchInput.focus();
		});
	}
}

export function initSidebarResize() {
	const handle = document.getElementById('sidebar-resize-handle');
	const sidebar = document.getElementById('sidebar');
	if (!handle || !sidebar) return;

	let isResizing = false;
	let startX, startWidth;

	handle.addEventListener('mousedown', function (e) {
		isResizing = true;
		startX = e.clientX;
		startWidth = sidebar.offsetWidth;
		handle.classList.add('active');
		document.body.classList.add('resizing');
		e.preventDefault();
	});

	document.addEventListener('mousemove', function (e) {
		if (!isResizing) return;
		const dx = startX - e.clientX;
		const newWidth = Math.min(500, Math.max(180, startWidth + dx));
		sidebar.style.width = newWidth + 'px';
	});

	document.addEventListener('mouseup', function () {
		if (!isResizing) return;
		isResizing = false;
		handle.classList.remove('active');
		document.body.classList.remove('resizing');
	});
}
