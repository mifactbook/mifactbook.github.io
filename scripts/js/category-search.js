
// Search functionality
const searchInput = document.getElementById('searchInput');
const cards = document.querySelectorAll('.item-card');

searchInput.addEventListener('input', (e) => {
	const query = e.target.value.toLowerCase();
	cards.forEach(card => {
		const text = card.textContent.toLowerCase();
		card.style.display = text.includes(query) ? 'block' : 'none';
	});
});