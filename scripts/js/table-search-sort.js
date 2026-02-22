// Extract data from DOM and store references
const blurbsData = [];
const container = document.getElementById('blurbsContainer');
const items = container.querySelectorAll('.blurb-item');

items.forEach(item => {
	blurbsData.push({
		text: item.textContent.trim().toLowerCase(),
		element: item
	});
});

// Search functionality
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
	const query = e.target.value.toLowerCase();
	blurbsData.forEach(blurb => {
		blurb.element.style.display = blurb.text.includes(query) ? '' : 'none';
	});
});