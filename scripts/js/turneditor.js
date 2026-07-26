/* ===== GLOBAL ELEMENTS & STATE ===== */
const criteriaContainer = document.getElementById('criteria-rows');
const MAX_CRITERIA_ROWS = 15;
let criteriaIdCounter = 1;
let lastTargetRow = null;

/* ===== ORDER VALIDATION REGISTRY ===== */
const NAMED_TYPES = {
	item:      { min: 1, max: 500,   err: 'Please enter a valid Item# or Creature# (1-500)' }, // also used for creature#
	tower:     { min: 380, max: 399, err: 'Please enter a valid Tower# (380-399)' },
	group:     { min: 700, max: 799, err: 'Please enter a valid Group# (700-799)' },
	monster:   { min: 1000, max: 9999, err: 'Please enter a valid Monster# (1000-9,999)' },
	ap:        { min: 1, max: 1000,  err: 'Action Points spent must be between 1-1,000' },
	qty:       { min: 1, max: 10000, err: 'Please enter a valid quantity between 1-10,000' },
	yell:      { min: 1, max: 100,   err: 'Please enter a valid Yell# (1-100)' },
	direction: { isDirection: true,  err: 'Invalid value for order.' },
	combo:     { min: 1, max: 9999, err: 'Please enter a value between 1-9,999'}
};

const ORDER_VALIDATION = {
	// Banking
	'Deposit Oculars':             { fields: ['qty', null] },
	'Open Account':                { fields: [null, null] },
	'Withdraw Oculars':            { fields: ['qty', null] },

	// Beastiary
	'Capture Creature':            { fields: ['item', null] },
	'Find Mount':                  { fields: [null, null] },
	'Kill Capture':                { fields: [null, null] },
	'Release Creature':            { fields: [null, null] },
	'Train/Work Mount':            { fields: [null, null] },

	// Chemistry
	'Green Lotus':                 { fields: [{exact: 258}, 'qty'], autofill: { 0:258 }, lockFields: [0] },
	'Pink Lotus':                  { fields: [{exact: 259}, 'qty'], autofill: { 0:259 }, lockFields: [0] },
	'White Lotus':                 { fields: [{exact: 19}, 'qty'], autofill: { 0:19 }, lockFields: [0] },

	// Combat
	'Battle Cry':                  { fields: [{ oneOf: [1, 5, 9] }, null] },
	'Cast Spell':                  { fields: ['ap', 'combo'] },
	'Friendliness/Riskiness':      { fields: [{min: 1, max: 95}, null] },
	'No Attack':                   { fields: ['combo', null] },
	'Weapon Practice':             { fields: ['item', 'ap'] },
	'Wrestle Friend':              { fields: [null, null] },

	// Commerce
	'Automatic Sell':              { fields: ['item', null] },
	'Buy From Far Post':           { fields: ['item', 'qty'] },
	'Collect Bounty':              { fields: [null, null] },
	'Pay Troll':                   { fields: [null, null] },
	'Purchase From Far Inn/Forge': { fields: ['item', null] },
	'Purchase Ticket From Station':{ fields: [{ oneOf: [50, 100, 150] }, null] },
	'Repair Item at Forge':        { fields: ['item', null] },
	'Sell Item':                   { fields: ['item', 'qty'] },

	// Construction
	'Call Wizard':                 { fields: [null, null] },
	'Ceremony of Santification':   { fields: [null, null] },
	'Rebuild Ruins':               { fields: ['ap', null] },
	'Use Xanxu Construct':         { fields: [{ exact: 466 }, 'ap'], autofill: { 0: 466 }, lockFields: [0] },

	// Dogma
	'Follow Dark':                 { fields: [null, null] },
	'Follow Fuvah':                { fields: [null, null] },
	'Follow Light':                { fields: [null, null] },
	'Kowtow Kowtow':               { fields: [null, null] },

	// Fortifications
	'Enhance Fort':                { fields: [null, null] },
	'Fort Stay':                   { fields: [null, null] },
	'Guard Fort':                  { fields: [null, null] },

	// General
	'Bathe in Pond':               { fields: [null, null] },
	'Dig':                         { fields: [{ min: 1, max: 24 }, null] },
	'Jazzercize Aerobics':         { fields: [{ min: 1, max: 50 }, null], autofill: { 0: 50 } },
	'Leverage Boulder':            { fields: [null, null] },
	"Loot 'n' Vandalize":          { fields: [null, null] },
	'Make Item':                   { fields: ['item', null] },
	'Nasty Fart':                  { fields: [null, null] },
	'Quest for Knowledge':         { fields: ['ap', null] },
	'Transfer Item':               { fields: ['item', 'monster'] },
	'Trap Pit':                    { fields: [null, null] },
	'Use/Consume Item':            { fields: ['item', null] },
	'Yell Loudly':                 { fields: ['yell', null] },

	// Group Mgmt
	'Get From Cache':              { fields: ['item', 'qty'] },
	'Glean Cache':                 { fields: [null, null] },
	'Group Leader':                { fields: ['monster', null] },
	'Initiation Ceremony':         { fields: ['monster', null] },
	'Join Group':                  { fields: ['group', null] },
	'Origin on Monster':           { fields: ['monster', null] },
	'Totem Marking':               { fields: [null, null] },

	// Holy Rites
	'Guard Temple':                { fields: [null, null] },
	'Kowtow':                      { fields: ['ap', null] },
	'Temple Sacrifice':            { fields: [null, null] },
	'Transfer Treasure':           { fields: ['item', 'qty'] },

	// Informational
	'List Knowledge':              { fields: [null, null] },
	'List Temples':                { fields: [null, null] },
	'Recenter Map':                { fields: [null, null] },
	'Reprint Creature Blurb':      { fields: ['item', null] },
	'Reprint Item Blurb':          { fields: ['item', null] },
	'Reprint Knowledge Blurb':     { fields: [{ min: 1, max: 2400 }, null] },
	'Reprint Spell Blurb':         { fields: ['ap', null] },

	// Inventory Mgmt
	'Bring From Store Room':       { fields: ['item', 'qty'] },
	'Equip':                       { fields: ['item', null] },
	'Item Pickup Limits':          { fields: [{ min: 11, max: 20 }, { min: 21, max: 40 }] },
	'Permanently Rid':             { fields: ['item', null] },
	'Place in Store Room':         { fields: ['item', 'qty'] },
	'Rid':                         { fields: ['item', null] },
	'Weekly Rid':                  { fields: ['item', null] },

	// Inn Services
	'Appraise Possessions':        { fields: [null, null] },
	'Inn Knowledge':               { fields: [{ min: 1, max: 9 }, null] },
	'Inn Stay':                    { fields: [{ min: 1, max: 7 }, null] },
	'Inn Weapon Training':         { fields: [{ oneOf: [1, 3, 5] }, null] },
	'Voodoo Instruction':          { fields: [{ oneOf: [2, 4, 6] }, null] },
	'Voodoo Master':               { fields: [null, null] },

	// Miscellaneous
	'Ancestral Ceremony':          { fields: [null, null] },
	'Diet':                        { fields: [null, null] },
	'Gather Items for AC':         { fields: [null, null] },
	'Gather Hairy Coconuts':       { fields: [null, null] },
	'Inform Zoingot':              { fields: [null, null] },
	'Learn Xanxu Construct':       { fields: [null, null] },

	// Movement
	'Cross Railway Bridge':        { fields: [null, null] },
	'Enter Hidey-Hole':            { fields: [null, null] },
	'High Jungle Entry':           { fields: [null, null] },
	'Hunt Along Trail/Path':       { fields: ['direction', 'direction'], prepend: 9 },
	'Hunt and Forage':             { fields: ['direction', 'direction'] },
	'Track: Attack':               { fields: ['combo', null] },
	'Track: Locate':               { fields: ['combo', null] },
	'Track: Snatch':               { fields: ['combo', null] },
	'Travel':                      { fields: ['direction', 'direction'] },
	'Travel Along Trail/Path':     { fields: ['direction', 'direction'], prepend: 9 },

	// Tower Services
	'Tower Admit Group':           { fields: ['tower', 'group'] },
	'Tower Admit Monster':         { fields: ['tower', 'monster'] },
	'Tower Skill Training':        { fields: [{ min: 1, max: 7 }, null] },
	'Tower Spell Training':        { fields: [{ min: 7, max: 9 }, null] },
	'Tower Stay':                  { fields: [{ min: 1, max: 7 }, null] },
	'Tower Teleport':              { fields: ['tower', null] },
	'Troll Voodoo':                { fields: [{ min: 1, max: 3 }, null] },
};

/* ===== DIRECTION DROPDOWN HELPERS ===== */
const DIRECTION_OPTIONS = [
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

function renderDirectionSelect(wrapper, fieldId, fieldName, isPath, currentValue) {
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
		updateAddButton();
	});

	return select;
}

function restoreTextInput(wrapper, fieldId, fieldName) {
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

/* ===== VALIDATION ENGINE ===== */

function resolveSchema(schema) {
	if (typeof schema === 'string' && NAMED_TYPES[schema]) {
		return NAMED_TYPES[schema];
	}
	return schema;
}

function validateField(value, schema) {
	if (schema === null || schema === undefined) {
		return { valid: true };
	}
	const resolved = resolveSchema(schema);
	if (!resolved) return { valid: true };

	const trimmed = (value || '').trim();

	// If schema defines a required range/oneOf/exact but the field is empty
	if (trimmed === '') {
		const err = resolved.err || 'This field is required';
		return { valid: false, message: err };
	}

	const num = Number(trimmed);
	if (isNaN(num) || !Number.isInteger(num)) {
		return { valid: false, message: resolved.err || 'Please enter a whole number' };
	}

	// Direction check (for H and T orders)
	if (schema === 'direction' || resolved.isDirection) {
		if (num === 0 || (num >= 1 && num <= 8) || (num >= 91 && num <= 98)) {
			return { valid: true };
		}
		return { valid: false, message: resolved.err || 'Invalid value for order.' };
	}

	// Exact match
	if (resolved.exact !== undefined) {
		if (num !== resolved.exact) {
			return { valid: false, message: resolved.err || `Value must be ${resolved.exact}` };
		}
		return { valid: true };
	}

	// oneOf list
	if (resolved.oneOf) {
		if (!resolved.oneOf.includes(num)) {
			return { valid: false, message: resolved.err || `Value must be one of: ${resolved.oneOf.join(', ')}` };
		}
		return { valid: true };
	}

	// Range check
	if (resolved.min !== undefined && resolved.max !== undefined) {
		if (num < resolved.min || num > resolved.max) {
			return { valid: false, message: resolved.err || `Value must be between ${resolved.min}-${resolved.max}` };
		}
	}

	// Excluded sub-range
	if (resolved.exclude) {
		if (num >= resolved.exclude.min && num <= resolved.exclude.max) {
			return { valid: false, message: resolved.err || `Value cannot be between ${resolved.exclude.min}-${resolved.exclude.max}` };
		}
	}

	return { valid: true };
}

function validateRow(row) {
	const errors = [];
	const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
	const orderCode = inputs[0] ? inputs[0].value.trim() : '';

	// Skip blank rows
	if (orderCode === '') return errors;

	const orderName = row.getAttribute('data-order-name') || '';
	const schema = ORDER_VALIDATION[orderName];

	// Enforce numeric-only on 2nd and 3rd textboxes/selects
	for (let fi = 1; fi <= 2; fi++) {
		const input = inputs[fi];
		if (!input) continue;
		const val = input.value.trim();
		if (val === '') continue;
		if (isNaN(Number(val)) || !Number.isInteger(Number(val))) {
			errors.push({ input: input, message: 'Invalid value for order. Please enter a whole number.' });
		}
	}

	if (!schema) return errors;

	// Validate 2nd textbox/select (inputs[1]) against schema.fields[0]
	if (schema.fields[0] !== null && schema.fields[0] !== undefined && inputs[1]) {
		const result = validateField(inputs[1].value, schema.fields[0]);
		if (!result.valid) {
			// Don't duplicate if already flagged as non-numeric
			if (!errors.some(e => e.input === inputs[1])) {
				errors.push({ input: inputs[1], message: result.message });
			}
		}
	}

	// Validate 3rd textbox/select (inputs[2]) against schema.fields[1]
	if (schema.fields[1] !== null && schema.fields[1] !== undefined && inputs[2]) {
		const result = validateField(inputs[2].value, schema.fields[1]);
		if (!result.valid) {
			if (!errors.some(e => e.input === inputs[2])) {
				errors.push({ input: inputs[2], message: result.message });
			}
		}
	}

	return errors;
}

function validateForm() {
	const errors = [];

	// Required header fields
	const requiredFields = [
		{ id: 'realname', label: 'Name' },
		{ id: 'Monster_Number', label: 'Monster#' },
		{ id: 'Account_Number', label: 'Account#' },
		{ id: 'email', label: 'Email' }
	];
	requiredFields.forEach(f => {
		const input = document.getElementById(f.id);
		if (input) {
			const val = input.value.trim();
			if (val === '') {
				errors.push({ input: input, message: `${f.label} is required` });
			} else if (f.id === 'Monster_Number' || f.id === 'Account_Number') {
				if (isNaN(Number(val)) || !Number.isInteger(Number(val)) || Number(val) < 0) {
					errors.push({ input: input, message: `${f.label} must be a valid number` });
				}
			} else if (f.id === 'email') {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(val)) {
					errors.push({ input: input, message: 'Please enter a valid email address' });
				}
			}
		}
	});

	// At least one non-blank order row
	if (criteriaContainer) {
		const rows = criteriaContainer.querySelectorAll('.criteria-row');
		const hasOrder = Array.from(rows).some(r => {
			const firstInput = r.querySelector('.criteria-field input, .criteria-field select');
			return firstInput && firstInput.value.trim() !== '';
		});
		if (!hasOrder) {
			const firstRowInput = rows[0] ? rows[0].querySelector('.criteria-field input, .criteria-field select') : null;
			errors.push({ input: firstRowInput, message: 'At least one order is required' });
		}

		// Validate each non-blank row
		rows.forEach(row => {
			const rowErrors = validateRow(row);
			errors.push(...rowErrors);
		});
	}

	return errors;
}

function clearValidationErrors() {
	document.querySelectorAll('.validation-error').forEach(el => {
		el.classList.remove('validation-error');
	});
	const modal = document.getElementById('validation-modal');
	if (modal) modal.classList.remove('visible');
}

function showValidationErrors(errors) {
	// Apply red glow to invalid fields
	errors.forEach(e => {
		if (e.input) e.input.classList.add('validation-error');
	});

	// Build and show modal
	const modal = document.getElementById('validation-modal');
	const msgContainer = document.getElementById('validation-modal-messages');
	if (!modal || !msgContainer) return;

	// De-duplicate messages
	const seen = new Set();
	const uniqueMessages = [];
	errors.forEach(e => {
		if (!seen.has(e.message)) {
			seen.add(e.message);
			uniqueMessages.push(e.message);
		}
	});

	msgContainer.innerHTML = uniqueMessages.map(m =>
		`<div class="validation-modal-item">&#9888; ${m}</div>`
	).join('');

	modal.classList.add('visible');

	// Focus first invalid field when modal is dismissed
	const dismissBtn = document.getElementById('validation-modal-close');
	if (dismissBtn) {
		dismissBtn.onclick = function () {
			modal.classList.remove('visible');
			const firstErr = errors.find(e => e.input);
			if (firstErr && firstErr.input) firstErr.input.focus();
		};
	}

	// Also close on overlay click
	modal.addEventListener('click', function handler(e) {
		if (e.target === modal) {
			modal.classList.remove('visible');
			modal.removeEventListener('click', handler);
			const firstErr = errors.find(e => e.input);
			if (firstErr && firstErr.input) firstErr.input.focus();
		}
	});
}


/* ===== SECTION COLLAPSE ===== */
function toggleSection(id) {
	const header = document.querySelector(`#section-${id} .section-header`);
	const body = document.getElementById(`body-${id}`);
	header.classList.toggle('collapsed');
	body.classList.toggle('collapsed');
}

/* ===== LOGIC TOGGLE ===== */
function setLogic(mode) {
	document.querySelectorAll('.logic-btn').forEach(btn => btn.classList.remove('active'));
	document.getElementById(`logic-${mode}`).classList.add('active');
}

/* ===== SIDEBAR TABS ===== */
function setSidebarTab(tab) {
	document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
	const el = document.getElementById(`sidebar-tab-${tab}`);
	if (el) el.classList.add('active');
}

/* ===== TREE VIEW & ORDER SELECTION ===== */
function toggleTree(item) {
	const arrow = item.querySelector('.tree-arrow');
	if (arrow && arrow.classList.contains('spacer')) return;
	if (arrow) arrow.classList.toggle('expanded');
	const children = item.nextElementSibling;
	if (children && children.classList.contains('tree-children')) {
		children.classList.toggle('open');
	}
}

function expandAllTree() {
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

function collapseAllTree() {
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

function setActiveRow(row) {
	document.querySelectorAll('.criteria-row').forEach(r => r.classList.remove('active-row'));
	if (row) {
		row.classList.add('active-row');
		lastTargetRow = row;
	}
}

function selectSidebarOrder(item, code) {
	document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
	item.classList.add('selected');

	if (!criteriaContainer) return;

	let targetRow = lastTargetRow && document.body.contains(lastTargetRow) ? lastTargetRow : null;

	// If current target row is not blank, search for a blank row or create a new row
	if (!targetRow || !isRowBlank(targetRow)) {
		const rows = Array.from(criteriaContainer.querySelectorAll('.criteria-row'));
		const blankRow = rows.find(r => isRowBlank(r));
		if (blankRow) {
			targetRow = blankRow;
		} else {
			if (rows.length < MAX_CRITERIA_ROWS) {
				addCriteriaRow();
				targetRow = lastTargetRow;
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
					renderDirectionSelect(wrappers[fi], elem ? elem.id : '', elem ? elem.name : '', isPath, curVal);
				}
			}
			renumberCriteria();
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
			renumberCriteria();

			const inputs = targetRow.querySelectorAll('.criteria-field input, .criteria-field select');

			// Re-enable any previously locked fields before applying new order
			for (let i = 1; i < inputs.length; i++) {
				inputs[i].disabled = false;
				inputs[i].classList.remove('locked-field');
			}

			if (schema) {
				// Auto-fill values (e.g., Xanxu Construct: 2nd textbox = 466)
				if (schema.autofill) {
					Object.keys(schema.autofill).forEach(idx => {
						const fi = Number(idx) + 1; // fields[0] maps to inputs[1]
						if (inputs[fi]) {
							inputs[fi].value = String(schema.autofill[idx]);
						}
					});
				}
				// Lock fields that should not be editable (e.g., Xanxu Construct 2nd box)
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

if (criteriaContainer) {
	criteriaContainer.addEventListener('focusin', function (e) {
		const row = e.target.closest('.criteria-row');
		if (row) setActiveRow(row);
	});

	criteriaContainer.addEventListener('click', function (e) {
		const row = e.target.closest('.criteria-row');
		if (row && !e.target.closest('.criteria-action-btn')) {
			setActiveRow(row);
		}
	});

	criteriaContainer.addEventListener('input', function (e) {
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
		updateAddButton();
	});

	criteriaContainer.addEventListener('change', updateAddButton);
}

/* ===== SPECIAL CODES MUTUAL EXCLUSION ===== */
function syncSpecialCodes() {
	const sc1 = document.querySelector('select[name="MI_TURN_SC1"]');
	const sc2 = document.querySelector('select[name="MI_TURN_SC2"]');
	if (!sc1 || !sc2) return;

	const val1 = sc1.value;
	const val2 = sc2.value;

	// If both have the same non-empty value, reset the inactive select
	if (val1 && val1 === val2) {
		if (document.activeElement === sc1) {
			sc2.value = "";
		} else {
			sc1.value = "";
		}
	}

	const currentVal1 = sc1.value;
	const currentVal2 = sc2.value;

	// Disable matching non-empty option in SC2
	Array.from(sc2.options).forEach(opt => {
		opt.disabled = !!(opt.value && opt.value === currentVal1);
	});

	// Disable matching non-empty option in SC1
	Array.from(sc1.options).forEach(opt => {
		opt.disabled = !!(opt.value && opt.value === currentVal2);
	});
}

/* ===== FORM SUBMISSION PROTECTION ===== */
let allowFormSubmission = false;

// Set initial active row, button states, & special code listeners
document.addEventListener('DOMContentLoaded', function () {
	const firstRow = document.querySelector('.criteria-row');
	if (firstRow) setActiveRow(firstRow);
	updateAddButton();

	const sc1 = document.querySelector('select[name="MI_TURN_SC1"]');
	const sc2 = document.querySelector('select[name="MI_TURN_SC2"]');
	if (sc1 && sc2) {
		sc1.addEventListener('change', syncSpecialCodes);
		sc2.addEventListener('change', syncSpecialCodes);
		syncSpecialCodes();
	}

	const sendTurnBtn = document.querySelector('.btn-send-turn');
	if (sendTurnBtn) {
		sendTurnBtn.addEventListener('click', function (e) {
			clearValidationErrors();
			const errors = validateForm();
			if (errors.length > 0) {
				e.preventDefault();
				showValidationErrors(errors);
				return;
			}
			allowFormSubmission = true;
		});
	}

	const turnForm = document.getElementById('turncard-form');
	if (turnForm) {
		// Prevent form submission unless Send Turn button was clicked
		turnForm.addEventListener('submit', function (e) {
			if (!allowFormSubmission) {
				e.preventDefault();
				return false;
			}
			allowFormSubmission = false;
		});

		// Block Enter key inside input fields from triggering form submission
		turnForm.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.keyCode === 13) {
				e.preventDefault();
				return false;
			}
		});
	}
});

/* ===== CRITERIA ROW MANAGEMENT ===== */

function isRowBlank(row) {
	if (!row) return true;
	const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
	return Array.from(inputs).every(input => input.value.trim() === '');
}

function isLastRowBlank() {
	if (!criteriaContainer) return false;
	const rows = criteriaContainer.querySelectorAll('.criteria-row');
	if (rows.length === 0) return false;
	return isRowBlank(rows[rows.length - 1]);
}

/* --- Helper: build a row's inner HTML --- */
const FIELD_SUFFIXES = ['A', 'B', 'C'];

function buildRowHTML(rowNum, propVal, opVal, valVal) {
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

function escAttr(s) { return (s || '').replace(/"/g, '&quot;'); }

/* --- Read a row's current field values --- */
function getRowValues(row) {
	const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
	return {
		property: inputs[0] ? inputs[0].value : '',
		operator: inputs[1] ? inputs[1].value : '',
		value: inputs[2] ? inputs[2].value : ''
	};
}

/* --- Create a new row element --- */
function createRow(rowNum, propVal, opVal, valVal) {
	const row = document.createElement('div');
	row.className = 'criteria-row';
	row.innerHTML = buildRowHTML(rowNum, propVal || '', opVal || '', valVal || '');
	return row;
}

/* --- Add Row --- */
function addCriteriaRow() {
	const currentCount = criteriaContainer.querySelectorAll('.criteria-row').length;
	if (currentCount >= MAX_CRITERIA_ROWS || isLastRowBlank()) return;
	const newRowNum = currentCount + 1;
	const row = createRow(newRowNum, '', '', '');
	row.style.animation = 'fadeIn 0.25s ease forwards';
	criteriaContainer.appendChild(row);
	setActiveRow(row);
	updateAddButton();
	const firstInput = row.querySelector('.criteria-field input, .criteria-field select');
	if (firstInput) firstInput.focus();
}

/* --- Delete Row --- */
function deleteCriteriaRow(row) {
	const allRows = criteriaContainer.querySelectorAll('.criteria-row');
	if (allRows.length <= 1) return;
	const remaining = Array.from(allRows).filter(r => r !== row);
	const wasActive = row.classList.contains('active-row') || lastTargetRow === row;
	row.style.opacity = '0';
	row.style.transform = 'translateX(-20px)';
	setTimeout(() => {
		row.remove();
		renumberCriteria();
		updateAddButton();
		if (wasActive && remaining.length > 0) {
			setActiveRow(remaining[remaining.length - 1]);
		}
	}, 200);
}

/* --- Clear Row (used when it's the only row) --- */
function clearCriteriaRow(row) {
	row.removeAttribute('data-order-name');
	const wrappers = row.querySelectorAll('.criteria-field .criteria-input-wrapper');
	wrappers.forEach((wrapper, i) => {
		// Restore text input in case field 1/2 were direction selects
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
	updateAddButton();
	const firstInput = row.querySelector('.criteria-field input');
	if (firstInput) firstInput.focus();
}

/* --- Duplicate Row (with contents) --- */
function duplicateCriteriaRow(sourceRow) {
	const rows = criteriaContainer.querySelectorAll('.criteria-row');
	if (rows.length === 0 || sourceRow !== rows[rows.length - 1]) return;
	if (rows.length >= MAX_CRITERIA_ROWS || isLastRowBlank()) return;
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
		if (wrappers[1]) renderDirectionSelect(wrappers[1], '', '', isPath, vals.operator);
		if (wrappers[2]) renderDirectionSelect(wrappers[2], '', '', isPath, vals.value);
	}

	renumberCriteria();
	setActiveRow(newRow);
	updateAddButton();
	const firstInput = newRow.querySelector('.criteria-field input, .criteria-field select');
	if (firstInput) firstInput.focus();
}

/* --- Move Row Up --- */
function moveRowUp(row) {
	if (isRowBlank(row)) return;
	const prev = row.previousElementSibling;
	if (prev && prev.classList.contains('criteria-row')) {
		criteriaContainer.insertBefore(row, prev);
		renumberCriteria();
		setActiveRow(row);
		flashRow(row);
	}
}

/* --- Move Row Down --- */
function moveRowDown(row) {
	if (isRowBlank(row)) return;
	const next = row.nextElementSibling;
	if (next && next.classList.contains('criteria-row')) {
		criteriaContainer.insertBefore(next, row);
		renumberCriteria();
		setActiveRow(row);
		flashRow(row);
	}
}

/* --- Brief highlight on move --- */
function flashRow(row) {
	row.style.background = 'rgba(46, 196, 220, 0.12)';
	setTimeout(() => { row.style.background = ''; }, 300);
}

/* --- Renumber rows and update MI_TURN IDs --- */
function renumberCriteria() {
	const rows = criteriaContainer.querySelectorAll('.criteria-row');
	rows.forEach((row, i) => {
		const num = i + 1;
		row.querySelector('.criteria-num').textContent = num;
		const inputs = row.querySelectorAll('.criteria-field input, .criteria-field select');
		inputs.forEach((input, fi) => {
			const suffix = FIELD_SUFFIXES[fi] || String.fromCharCode(65 + fi);
			const newId = (num === 1 && fi === 0) ? '1st_Order' : `MI_TURN_${num}${suffix}`;
			input.id = newId;
			input.name = newId;
		});
	});
	updateAddButton();
}

/* --- Update Add, Duplicate, Move, Drag & Delete states --- */
function updateAddButton() {
	const btn = document.getElementById('btn-add-criteria');
	const count = criteriaContainer ? criteriaContainer.querySelectorAll('.criteria-row').length : 0;
	const atMax = count >= MAX_CRITERIA_ROWS;
	const blankLast = isLastRowBlank();
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

	if (criteriaContainer) {
		const rows = criteriaContainer.querySelectorAll('.criteria-row');
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
					// Repurpose as a Clear button
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

/* ===== EVENT DELEGATION for action buttons ===== */
criteriaContainer.addEventListener('click', function (e) {
	const btn = e.target.closest('.criteria-action-btn');
	if (!btn || btn.disabled) return;
	const row = btn.closest('.criteria-row');
	if (!row) return;

	const action = btn.dataset.action || (btn.title && btn.title.includes('Delete') ? 'delete' : btn.title && btn.title.includes('Duplicate') ? 'duplicate' : btn.title && btn.title.includes('Move Up') ? 'up' : btn.title && btn.title.includes('Move Down') ? 'down' : '');
	if (action === 'delete') deleteCriteriaRow(row);
	else if (action === 'clear') clearCriteriaRow(row);
	else if (action === 'duplicate') duplicateCriteriaRow(row);
	else if (action === 'up') moveRowUp(row);
	else if (action === 'down') moveRowDown(row);
});

/* ===== DRAG AND DROP ===== */
let draggedRow = null;

criteriaContainer.addEventListener('dragstart', function (e) {
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

criteriaContainer.addEventListener('dragend', function () {
	if (draggedRow) draggedRow.classList.remove('dragging');
	clearDragOver();
	draggedRow = null;
});

criteriaContainer.addEventListener('dragover', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
	const targetRow = e.target.closest('.criteria-row');
	if (!targetRow || targetRow === draggedRow) return;
	clearDragOver();
	targetRow.classList.add('drag-over');
});

criteriaContainer.addEventListener('dragleave', function (e) {
	const targetRow = e.target.closest('.criteria-row');
	if (targetRow) targetRow.classList.remove('drag-over');
});

criteriaContainer.addEventListener('drop', function (e) {
	e.preventDefault();
	const targetRow = e.target.closest('.criteria-row');
	if (!targetRow || !draggedRow || targetRow === draggedRow) return;

	// Determine insertion position based on mouse Y relative to target center
	const rect = targetRow.getBoundingClientRect();
	const midY = rect.top + rect.height / 2;
	if (e.clientY < midY) {
		criteriaContainer.insertBefore(draggedRow, targetRow);
	} else {
		criteriaContainer.insertBefore(draggedRow, targetRow.nextSibling);
	}

	clearDragOver();
	draggedRow.classList.remove('dragging');
	renumberCriteria();
	flashRow(draggedRow);
	draggedRow = null;
});

function clearDragOver() {
	criteriaContainer.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over'));
}

/* Make initial row's handle draggable */
document.querySelector('.criteria-row .criteria-handle').setAttribute('draggable', 'true');

/* ===== SIDEBAR SEARCH FILTER ===== */
const searchInput = document.getElementById('sidebar-search-input');
const clearBtn = document.getElementById('sidebar-search-clear');

if (searchInput && clearBtn) {
	searchInput.addEventListener('input', function () {
		const query = this.value.toLowerCase().trim();
		clearBtn.classList.toggle('visible', query !== '');

		const treeView = document.getElementById('tree-view');
		if (!treeView) return;

		// Iterate through heading/children pairs
		const headings = treeView.querySelectorAll(':scope > .tree-item');

		headings.forEach(heading => {
			const childrenContainer = heading.nextElementSibling;
			const isGroup = childrenContainer && childrenContainer.classList.contains('tree-children');
			const headingLabel = heading.querySelector('.tree-label');
			const headingText = headingLabel ? headingLabel.textContent.toLowerCase() : '';

			if (query === '') {
				// Reset: show all headings and children, collapse groups
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

			// Check if heading itself matches
			const headingMatch = headingText.includes(query);

			// Check which children match
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
				// Show heading and expand children
				heading.style.display = '';
				if (isGroup) {
					childrenContainer.style.display = '';
					childrenContainer.classList.add('open');
					const arrow = heading.querySelector('.tree-arrow');
					if (arrow) arrow.classList.add('expanded');
				}
			} else {
				// Hide entire group
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

/* ===== SIDEBAR RESIZE ===== */
(function () {
	const handle = document.getElementById('sidebar-resize-handle');
	const sidebar = document.getElementById('sidebar');
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
})();