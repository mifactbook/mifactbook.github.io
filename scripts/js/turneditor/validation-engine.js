import { NAMED_TYPES, ORDER_VALIDATION } from './validation-rules.js';

export function resolveSchema(schema) {
	if (typeof schema === 'string' && NAMED_TYPES[schema]) {
		return NAMED_TYPES[schema];
	}
	return schema;
}

export function validateField(value, schema) {
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

export function validateRow(row) {
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

export function validateForm(criteriaContainer) {
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
	const container = criteriaContainer || document.getElementById('criteria-rows');
	if (container) {
		const rows = container.querySelectorAll('.criteria-row');
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

export function clearValidationErrors() {
	document.querySelectorAll('.validation-error').forEach(el => {
		el.classList.remove('validation-error');
	});
	const modal = document.getElementById('validation-modal');
	if (modal) modal.classList.remove('visible');
}

export function showValidationErrors(errors) {
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
