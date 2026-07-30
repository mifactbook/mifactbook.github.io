import {
	initFormSubmission,
	setLogic,
	submitTurnForm,
	syncSpecialCodes,
	toggleSection
} from './form-manager.js';

import {
	addCriteriaRow,
	clearCriteriaRow,
	deleteCriteriaRow,
	duplicateCriteriaRow,
	initRowEvents,
	moveRowDown,
	moveRowUp,
	setActiveRow,
	updateAddButton
} from './row-manager.js';

import {
	collapseAllTree,
	expandAllTree,
	initSidebarResize,
	initSidebarSearch,
	selectSidebarOrder,
	setSidebarTab,
	toggleTree
} from './sidebar-manager.js';

import {
	clearValidationErrors,
	showValidationErrors,
	validateForm,
	validateRow
} from './validation-engine.js';

import {
	NAMED_TYPES,
	ORDER_VALIDATION
} from './validation-rules.js';

// Bind methods to window for inline HTML event handler backward-compatibility
window.toggleSection = toggleSection;
window.setLogic = setLogic;
window.setSidebarTab = setSidebarTab;
window.toggleTree = toggleTree;
window.expandAllTree = expandAllTree;
window.collapseAllTree = collapseAllTree;
window.selectSidebarOrder = selectSidebarOrder;
window.addCriteriaRow = addCriteriaRow;
window.deleteCriteriaRow = deleteCriteriaRow;
window.clearCriteriaRow = clearCriteriaRow;
window.duplicateCriteriaRow = duplicateCriteriaRow;
window.moveRowUp = moveRowUp;
window.moveRowDown = moveRowDown;
window.submitTurnForm = submitTurnForm;

export {
	addCriteriaRow,
	clearCriteriaRow,
	clearValidationErrors,
	collapseAllTree,
	deleteCriteriaRow,
	duplicateCriteriaRow,
	expandAllTree,
	moveRowDown,
	moveRowUp,
	NAMED_TYPES,
	ORDER_VALIDATION,
	selectSidebarOrder,
	setLogic,
	setSidebarTab,
	showValidationErrors,
	submitTurnForm,
	syncSpecialCodes,
	toggleSection,
	toggleTree,
	validateForm,
	validateRow
};

export function initTurnEditor() {
	const criteriaContainer = document.getElementById('criteria-rows');
	const firstRow = document.querySelector('.criteria-row');
	if (firstRow) setActiveRow(firstRow);

	initRowEvents(criteriaContainer);
	updateAddButton(criteriaContainer);

	const sc1 = document.querySelector('select[name="MI_TURN_SC1"]');
	const sc2 = document.querySelector('select[name="MI_TURN_SC2"]');
	if (sc1 && sc2) {
		sc1.addEventListener('change', syncSpecialCodes);
		sc2.addEventListener('change', syncSpecialCodes);
		syncSpecialCodes();
	}

	initSidebarSearch();
	initSidebarResize();
	initFormSubmission();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initTurnEditor);
} else {
	initTurnEditor();
}
