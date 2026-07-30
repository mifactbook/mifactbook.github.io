/* ===== DIRECTION DROPDOWN HELPERS ===== */
export const DIRECTION_OPTIONS = [
	{ label: 'Stay Put', num: '0' },
	{ label: 'North {1}', num: '1' },
	{ label: 'Northeast {2}', num: '2' },
	{ label: 'East {3}', num: '3' },
	{ label: 'Southeast {4}', num: '4' },
	{ label: 'South {5}', num: '5' },
	{ label: 'Southwest {6}', num: '6' },
	{ label: 'West {7}', num: '7' },
	{ label: 'Northwest {8}', num: '8' }
];

export function renderDirectionSelect(wrapper, fieldId, fieldName, isPath, currentValue, updateAddButtonFn) {
	let select = wrapper.querySelector('select');
	if (!select) {
		const input = wrapper.querySelector('input');
		select = document.createElement('select');
		if (input) {
			input.replaceWith(select);
		} else {
			wrapper.appendChild(select);
		}
	}
	if (fieldId) select.id = fieldId;
	if (fieldName) select.name = fieldName;
	select.disabled = false;
	select.classList.remove('locked-field');

	select.innerHTML = DIRECTION_OPTIONS.map(opt => {
		let val = '';
		if (opt.num === '0') {
			val = '0';
		} else if (opt.num) {
			val = isPath ? `9${opt.num}` : opt.num;
		}
		return `<option value="${val}">${opt.label}</option>`;
	}).join('');

	if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
		const strVal = String(currentValue).trim();
		if (strVal === '0') {
			select.value = '0';
		} else {
			const lastChar = strVal.slice(-1);
			const targetVal = isPath ? `9${lastChar}` : lastChar;
			if (Array.from(select.options).some(o => o.value === targetVal)) {
				select.value = targetVal;
			} else if (Array.from(select.options).some(o => o.value === strVal)) {
				select.value = strVal;
			}
		}
	}

	select.addEventListener('change', function () {
		select.classList.remove('validation-error');
		if (typeof updateAddButtonFn === 'function') {
			updateAddButtonFn();
		}
	});

	return select;
}

export function restoreTextInput(wrapper, fieldId, fieldName) {
	const select = wrapper.querySelector('select');
	if (select) {
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = '';
		if (fieldId) input.id = fieldId;
		if (fieldName) input.name = fieldName;
		select.replaceWith(input);
		return input;
	}
	return wrapper.querySelector('input');
}
