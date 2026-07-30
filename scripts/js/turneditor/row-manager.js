import { renderDirectionSelect, restoreTextInput } from './direction-helpers.js';
import { ORDER_VALIDATION } from './validation-rules.js';

export const MAX_CRITERIA_ROWS = 15;
export const FIELD_SUFFIXES = ['A', 'B', 'C'];

let lastTargetRow = null;
let draggedRow = null;

export function getLastTargetRow() {
	return lastTargetRow;
}

export function setLastTargetRow(row) {
	lastTargetRow = row;
}

export function setActiveRow(row) {
	document.querySelectorAll('.criteria-row').forEach(r => r.classList.remove('active-row'));
	if (row) {
		row.classList.add('active-row');
		lastTargetRow = row;
	}
}

export function isRowBlank(row) {
	if (!row) return true;
	const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
	return Array.from(inputs).every(input => input.value.trim() === '');
}

export function isLastRowBlank(criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return false;
	const rows = container.querySelectorAll('.criteria-row');
	if (rows.length === 0) return false;
	return isRowBlank(rows[rows.length - 1]);
}

export function escAttr(s) {
	return (s || '').replace(/"/g, '&quot;');
}

export function buildRowHTML(rowNum, propVal, opVal, valVal) {
	return `
<div class="criteria-handle" title="Drag to reorder" draggable="true">≡</div>
<div class="criteria-num">${rowNum}</div>
<div class="criteria-field">
<div class="criteria-input-wrapper">
	<input type="text" placeholder="" id="MI_TURN_${rowNum}A" name="MI_TURN_${rowNum}A" value="${escAttr(propVal)}" readonly>
</div>
</div>
<div class="criteria-field">
<div class="criteria-input-wrapper">
	<input type="text" placeholder="" id="MI_TURN_${rowNum}B" name="MI_TURN_${rowNum}B" value="${escAttr(opVal)}">
</div>
</div>
<div class="criteria-field">
<div class="criteria-input-wrapper">
	<input type="text" placeholder="" id="MI_TURN_${rowNum}C" name="MI_TURN_${rowNum}C" value="${escAttr(valVal)}">
</div>
</div>
<div class="criteria-actions">
<button type="button" class="criteria-action-btn" data-action="up" title="Move Up">↑</button>
<button type="button" class="criteria-action-btn" data-action="down" title="Move Down">↓</button>
<button type="button" class="criteria-action-btn" data-action="duplicate" title="Duplicate">⧉</button>
<button type="button" class="criteria-action-btn delete" data-action="delete" title="Delete">✕</button>
</div>
`;
}

export function getRowValues(row) {
	const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
	return {
		property: inputs[0] ? inputs[0].value : '',
		operator: inputs[1] ? inputs[1].value : '',
		value: inputs[2] ? inputs[2].value : ''
	};
}

export function createRow(rowNum, propVal, opVal, valVal) {
	const row = document.createElement('div');
	row.className = 'criteria-row';
	row.innerHTML = buildRowHTML(rowNum, propVal || '', opVal || '', valVal || '');
	return row;
}

export function renumberCriteria(criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return;
	const rows = container.querySelectorAll('.criteria-row');
	rows.forEach((row, i) => {
		const num = i + 1;
		const numEl = row.querySelector('.criteria-num');
		if (numEl) numEl.textContent = num;
		const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
		inputs.forEach((input, fi) => {
			const suffix = FIELD_SUFFIXES[fi] || String.fromCharCode(65 + fi);
			const newId = (num === 1 && fi === 0) ? '1st_Order' : `MI_TURN_${num}${suffix}`;
			input.id = newId;
			input.name = newId;
		});
	});
	updateAddButton(container);
}

export function updateAddButton(criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	const btn = document.getElementById('btn-add-criteria');
	const count = container ? container.querySelectorAll('.criteria-row').length : 0;
	const atMax = count >= MAX_CRITERIA_ROWS;
	const blankLast = isLastRowBlank(container);
	const disableAddDup = atMax || blankLast;

	if (btn) {
		btn.disabled = disableAddDup;
		if (atMax) {
			btn.title = 'Maximum of 15 criteria rows reached';
		} else if (blankLast) {
			btn.title = 'Please enter an order in the current row before adding another';
		} else {
			btn.title = '';
		}
	}

	if (container) {
		const rows = container.querySelectorAll('.criteria-row');
		const totalRows = rows.length;
		rows.forEach((row, i) => {
			const isLastRow = (i === totalRows - 1);
			const blank = isRowBlank(row);
			const upBtn = row.querySelector('.criteria-actions .criteria-action-btn[data-action="up"]') || row.querySelector('.criteria-actions .criteria-action-btn:nth-child(1)');
			const downBtn = row.querySelector('.criteria-actions .criteria-action-btn[data-action="down"]') || row.querySelector('.criteria-actions .criteria-action-btn:nth-child(2)');
			const dupBtn = row.querySelector('.criteria-actions .criteria-action-btn[data-action="duplicate"]') || row.querySelector('.criteria-actions .criteria-action-btn:nth-child(3)');
			const deleteBtn = row.querySelector('.criteria-actions .criteria-action-btn[data-action="delete"], .criteria-actions .criteria-action-btn[data-action="clear"]') || row.querySelector('.criteria-actions .criteria-action-btn:nth-child(4)');
			const handle = row.querySelector('.criteria-handle');

			if (upBtn) {
				upBtn.disabled = blank || i === 0;
				upBtn.title = blank ? 'Cannot move a blank row' : (i === 0 ? 'Already at top' : 'Move Up');
			}
			if (downBtn) {
				downBtn.disabled = blank || isLastRow;
				downBtn.title = blank ? 'Cannot move a blank row' : (isLastRow ? 'Already at bottom' : 'Move Down');
			}
			if (handle) {
				handle.setAttribute('draggable', blank ? 'false' : 'true');
				handle.title = blank ? 'Cannot drag a blank row' : 'Drag to reorder';
				handle.style.opacity = blank ? '0.3' : '';
				handle.style.cursor = blank ? 'not-allowed' : 'grab';
			}
			if (dupBtn) {
				if (!isLastRow) {
					dupBtn.disabled = true;
					dupBtn.title = 'Duplicate is only available on the last row';
				} else {
					dupBtn.disabled = disableAddDup;
					if (atMax) {
						dupBtn.title = 'Maximum of 15 criteria rows reached';
					} else if (blankLast) {
						dupBtn.title = 'Cannot duplicate when last row is blank';
					} else {
						dupBtn.title = 'Duplicate';
					}
				}
			}
			if (deleteBtn) {
				const isSoleRow = totalRows <= 1;
				const rowIsBlank = isRowBlank(row);
				if (isSoleRow) {
					deleteBtn.dataset.action = 'clear';
					deleteBtn.disabled = rowIsBlank;
					deleteBtn.title = rowIsBlank ? 'Row is already empty' : 'Clear row';
				} else {
					deleteBtn.dataset.action = 'delete';
					deleteBtn.disabled = false;
					deleteBtn.title = 'Delete';
				}
			}
		});
	}
}

export function addCriteriaRow(criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return;
	const currentCount = container.querySelectorAll('.criteria-row').length;
	if (currentCount >= MAX_CRITERIA_ROWS || isLastRowBlank(container)) return;
	const newRowNum = currentCount + 1;
	const row = createRow(newRowNum, '', '', '');
	row.style.animation = 'fadeIn 0.25s ease forwards';
	container.appendChild(row);
	setActiveRow(row);
	updateAddButton(container);
	const firstInput = row.querySelector('.criteria-field input, .criteria-field select');
	if (firstInput) firstInput.focus();
}

export function deleteCriteriaRow(row, criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return;
	const allRows = container.querySelectorAll('.criteria-row');
	if (allRows.length <= 1) return;
	const remaining = Array.from(allRows).filter(r => r !== row);
	const wasActive = row.classList.contains('active-row') || lastTargetRow === row;
	row.style.opacity = '0';
	row.style.transform = 'translateX(-20px)';
	setTimeout(() => {
		row.remove();
		renumberCriteria(container);
		updateAddButton(container);
		if (wasActive && remaining.length > 0) {
			setActiveRow(remaining[remaining.length - 1]);
		}
	}, 200);
}

export function clearCriteriaRow(row, criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	row.removeAttribute('data-order-name');
	const wrappers = row.querySelectorAll('.criteria-field .criteria-input-wrapper');
	wrappers.forEach((wrapper) => {
		const elem = wrapper.querySelector('input, select');
		if (elem && elem.tagName === 'SELECT') {
			restoreTextInput(wrapper, elem.id, elem.name);
		}
		const input = wrapper.querySelector('input');
		if (input) {
			input.value = '';
			input.disabled = false;
			input.classList.remove('locked-field', 'validation-error');
		}
	});
	row.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error'));
	setActiveRow(row);
	updateAddButton(container);
	const firstInput = row.querySelector('.criteria-field input');
	if (firstInput) firstInput.focus();
}

export function duplicateCriteriaRow(sourceRow, criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return;
	const rows = container.querySelectorAll('.criteria-row');
	if (rows.length === 0 || sourceRow !== rows[rows.length - 1]) return;
	if (rows.length >= MAX_CRITERIA_ROWS || isLastRowBlank(container)) return;
	const vals = getRowValues(sourceRow);
	const orderName = sourceRow.getAttribute('data-order-name') || '';
	const newRow = createRow(0, vals.property, vals.operator, vals.value);
	newRow.setAttribute('data-order-name', orderName);
	newRow.style.animation = 'fadeIn 0.25s ease forwards';
	sourceRow.insertAdjacentElement('afterend', newRow);

	const code = vals.property.trim().toUpperCase();
	if (code === 'H' || code === 'T') {
		const schema = ORDER_VALIDATION[orderName];
		const isPath = !!(schema && schema.prepend === 9);
		const wrappers = newRow.querySelectorAll('.criteria-field .criteria-input-wrapper');
		if (wrappers[1]) renderDirectionSelect(wrappers[1], '', '', isPath, vals.operator, () => updateAddButton(container));
		if (wrappers[2]) renderDirectionSelect(wrappers[2], '', '', isPath, vals.value, () => updateAddButton(container));
	}

	renumberCriteria(container);
	setActiveRow(newRow);
	updateAddButton(container);
	const firstInput = newRow.querySelector('.criteria-field input, .criteria-field select');
	if (firstInput) firstInput.focus();
}

export function moveRowUp(row, criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (isRowBlank(row) || !container) return;
	const prev = row.previousElementSibling;
	if (prev && prev.classList.contains('criteria-row')) {
		container.insertBefore(row, prev);
		renumberCriteria(container);
		setActiveRow(row);
		flashRow(row);
	}
}

export function moveRowDown(row, criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (isRowBlank(row) || !container) return;
	const next = row.nextElementSibling;
	if (next && next.classList.contains('criteria-row')) {
		container.insertBefore(next, row);
		renumberCriteria(container);
		setActiveRow(row);
		flashRow(row);
	}
}

export function flashRow(row) {
	row.style.background = 'rgba(46, 196, 220, 0.12)';
	setTimeout(() => { row.style.background = ''; }, 300);
}

export function clearDragOver(container) {
	const c = container || document.getElementById('criteria-rows');
	if (c) c.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over'));
}

export function initRowEvents(criteriaContainer) {
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (!container) return;

	container.addEventListener('focusin', function (e) {
		const row = e.target.closest('.criteria-row');
		if (row) setActiveRow(row);
	});

	container.addEventListener('click', function (e) {
		const row = e.target.closest('.criteria-row');
		if (row && !e.target.closest('.criteria-action-btn')) {
			setActiveRow(row);
		}
	});

	container.addEventListener('input', function (e) {
		const row = e.target.closest('.criteria-row');
		if (row) {
			const inputs = row.querySelectorAll('.criteria-field input');
			if (e.target === inputs[0]) {
				const start = e.target.selectionStart;
				const end = e.target.selectionEnd;
				e.target.value = e.target.value.toUpperCase();
				if (start !== null && end !== null) {
					e.target.setSelectionRange(start, end);
				}
			}
		}
		updateAddButton(container);
	});

	container.addEventListener('change', () => updateAddButton(container));

	// Event Delegation for Action Buttons
	container.addEventListener('click', function (e) {
		const btn = e.target.closest('.criteria-action-btn');
		if (!btn || btn.disabled) return;
		const row = btn.closest('.criteria-row');
		if (!row) return;

		const action = btn.dataset.action || (btn.title && btn.title.includes('Delete') ? 'delete' : btn.title && btn.title.includes('Duplicate') ? 'duplicate' : btn.title && btn.title.includes('Move Up') ? 'up' : btn.title && btn.title.includes('Move Down') ? 'down' : '');
		if (action === 'delete') deleteCriteriaRow(row, container);
		else if (action === 'clear') clearCriteriaRow(row, container);
		else if (action === 'duplicate') duplicateCriteriaRow(row, container);
		else if (action === 'up') moveRowUp(row, container);
		else if (action === 'down') moveRowDown(row, container);
	});

	// Drag & Drop Listeners
	container.addEventListener('dragstart', function (e) {
		const handle = e.target.closest('.criteria-handle');
		if (!handle) { e.preventDefault(); return; }
		draggedRow = handle.closest('.criteria-row');
		if (!draggedRow || isRowBlank(draggedRow)) {
			e.preventDefault();
			draggedRow = null;
			return;
		}
		draggedRow.classList.add('dragging');
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', ''); // required for Firefox
	});

	container.addEventListener('dragend', function () {
		if (draggedRow) draggedRow.classList.remove('dragging');
		clearDragOver(container);
		draggedRow = null;
	});

	container.addEventListener('dragover', function (e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		const targetRow = e.target.closest('.criteria-row');
		if (!targetRow || targetRow === draggedRow) return;
		clearDragOver(container);
		targetRow.classList.add('drag-over');
	});

	container.addEventListener('dragleave', function (e) {
		const targetRow = e.target.closest('.criteria-row');
		if (targetRow) targetRow.classList.remove('drag-over');
	});

	container.addEventListener('drop', function (e) {
		e.preventDefault();
		const targetRow = e.target.closest('.criteria-row');
		if (!targetRow || !draggedRow || targetRow === draggedRow) return;

		const rect = targetRow.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		if (e.clientY < midY) {
			container.insertBefore(draggedRow, targetRow);
		} else {
			container.insertBefore(draggedRow, targetRow.nextSibling);
		}

		clearDragOver(container);
		draggedRow.classList.remove('dragging');
		renumberCriteria(container);
		flashRow(draggedRow);
		draggedRow = null;
	});
}
