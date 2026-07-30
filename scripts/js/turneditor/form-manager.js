import { clearValidationErrors, showValidationErrors, validateForm } from './validation-engine.js';

let allowFormSubmission = false;

export function toggleSection(id) {
	const header = document.querySelector(`#section-${id} .section-header`);
	const body = document.getElementById(`body-${id}`);
	if (header && body) {
		header.classList.toggle('collapsed');
		body.classList.toggle('collapsed');
	}
}

export function setLogic(mode) {
	document.querySelectorAll('.logic-btn').forEach(btn => btn.classList.remove('active'));
	const btn = document.getElementById(`logic-${mode}`);
	if (btn) btn.classList.add('active');
}

export function syncSpecialCodes() {
	const sc1 = document.querySelector('select[name="MI_TURN_SC1"]');
	const sc2 = document.querySelector('select[name="MI_TURN_SC2"]');
	if (!sc1 || !sc2) return;

	const val1 = sc1.value;
	const val2 = sc2.value;

	if (val1 && val1 === val2) {
		if (document.activeElement === sc1) {
			sc2.value = "";
		} else {
			sc1.value = "";
		}
	}

	const currentVal1 = sc1.value;
	const currentVal2 = sc2.value;

	Array.from(sc2.options).forEach(opt => {
		opt.disabled = !!(opt.value && opt.value === currentVal1);
	});

	Array.from(sc1.options).forEach(opt => {
		opt.disabled = !!(opt.value && opt.value === currentVal2);
	});
}

export function submitTurnForm() {
	const form = document.getElementById('turncard-form');
	if (!form) return;

	const orderedFields = [
		'return_link_url',
		'return_link_title',
		'recipient',
		'subject',
		'required',
		'print_config',
		'realname',
		'email',
		'Monster_Number',
		'Account_Number',
		'MI_TURN_SC1',
		'MI_TURN_SC2',
		'MI_TURN_SC3',
		'MI_TURN_SC4',
		'1st_Order', 'MI_TURN_1B', 'MI_TURN_1C',
		'MI_TURN_2A', 'MI_TURN_2B', 'MI_TURN_2C',
		'MI_TURN_3A', 'MI_TURN_3B', 'MI_TURN_3C',
		'MI_TURN_4A', 'MI_TURN_4B', 'MI_TURN_4C',
		'MI_TURN_5A', 'MI_TURN_5B', 'MI_TURN_5C',
		'MI_TURN_6A', 'MI_TURN_6B', 'MI_TURN_6C',
		'MI_TURN_7A', 'MI_TURN_7B', 'MI_TURN_7C',
		'MI_TURN_8A', 'MI_TURN_8B', 'MI_TURN_8C',
		'MI_TURN_9A', 'MI_TURN_9B', 'MI_TURN_9C',
		'MI_TURN_10A', 'MI_TURN_10B', 'MI_TURN_10C',
		'MI_TURN_11A', 'MI_TURN_11B', 'MI_TURN_11C',
		'MI_TURN_12A', 'MI_TURN_12B', 'MI_TURN_12C',
		'MI_TURN_13A', 'MI_TURN_13B', 'MI_TURN_13C',
		'MI_TURN_14A', 'MI_TURN_14B', 'MI_TURN_14C',
		'MI_TURN_15A', 'MI_TURN_15B', 'MI_TURN_15C'
	];

	const turnData = {};
	orderedFields.forEach(fieldName => {
		const el = form.querySelector(`[name="${fieldName}"]`);
		turnData[fieldName] = el ? el.value : '';
	});

	const actionUrl = form.getAttribute('action');
	const hiddenForm = document.createElement('form');
	hiddenForm.method = 'POST';
	hiddenForm.action = actionUrl;
	hiddenForm.style.display = 'none';

	orderedFields.forEach(name => {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = turnData[name];
		hiddenForm.appendChild(input);
	});

	document.body.appendChild(hiddenForm);
	hiddenForm.submit();
}

export function initFormSubmission() {
	const sendTurnBtn = document.querySelector('.btn-send-turn');
	if (sendTurnBtn) {
		sendTurnBtn.addEventListener('click', function (e) {
			e.preventDefault();
			clearValidationErrors();
			const errors = validateForm();
			if (errors.length > 0) {
				showValidationErrors(errors);
				return;
			}
			allowFormSubmission = true;
			submitTurnForm();
		});
	}

	const turnForm = document.getElementById('turncard-form');
	if (turnForm) {
		turnForm.addEventListener('submit', function (e) {
			if (!allowFormSubmission) {
				e.preventDefault();
				return false;
			}
			allowFormSubmission = false;
		});

		turnForm.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.keyCode === 13) {
				e.preventDefault();
				return false;
			}
		});
	}
}
