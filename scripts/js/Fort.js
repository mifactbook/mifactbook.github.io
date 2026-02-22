// Extract data from DOM and store references
const innsData = [];
const container = document.getElementById('locationsContainer');
const rows = container.querySelectorAll('.location-row');

rows.forEach(row => {
	const cells = row.querySelectorAll('div');
	innsData.push({
		coordinates: cells[0]?.textContent.trim() || '',
		name: cells[1]?.textContent.trim() || '',
		element: row
	});
});

// Search functionality
const searchInput = document.getElementById('searchInput');

if (searchInput) {
	searchInput.addEventListener('input', (e) => {
		const query = e.target.value.toLowerCase();
		innsData.forEach(inn => {
			const matches = inn.coordinates.toLowerCase().includes(query) || inn.name.toLowerCase().includes(query);
			inn.element.style.display = matches ? 'grid' : 'none';
		});
	});
}

// Sorting functionality
let sortOrder = { coordinates: 1, name: 1 };

document.querySelectorAll('.sortable').forEach(header => {
	header.addEventListener('click', () => {
		const col = header.dataset.sort;

		// Toggle sort order
		sortOrder[col] *= -1;

		// Sort data
		const sorted = [...innsData].sort((a, b) => {
			let valA = a[col];
			let valB = b[col];

			// String comparison (case-insensitive)
			valA = valA.toLowerCase();
			valB = valB.toLowerCase();

			if (valA < valB) return -1 * sortOrder[col];
			if (valA > valB) return 1 * sortOrder[col];
			return 0;
		});

		// Re-render
		container.innerHTML = '';
		sorted.forEach(inn => {
			container.appendChild(inn.element);
		});
	});
});