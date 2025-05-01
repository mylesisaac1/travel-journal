// DOM Elements and Constants
const elements = {
    container: document.getElementById('entries-container'),
    form: document.getElementById('travel-form'),
    search: {
        input: document.getElementById('search-input'),
        btn: document.getElementById('search-btn'),
        clear: document.getElementById('clear-search')
    },
    image: {
        url: document.getElementById('image-url'),
        preview: document.getElementById('image-preview')
    },
    counter: {
        current: document.getElementById('current-count'),
        max: document.getElementById('max-entries')
    }
};

const MAX_ENTRIES = 50;
let entries = JSON.parse(localStorage.getItem('travelEntries')) || [];
let isEditing = false, currentEditId = null;

//  Image Conversion Function
const urlToBase64 = async (url) => {
    try {
        // Skip conversion if already Base64 or empty
        if (!url || url.startsWith('data:image')) return url;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image conversion failed:', error);
        return url; // Fallback to original URL
    }
};

//  Core Functions
const init = () => {
    renderEntries(entries);
    updateCounter();
    
    if (elements.form) {
        elements.form.addEventListener('submit', handleSubmit);
        elements.image.url.addEventListener('input', handleImage);
        document.getElementById('cancel-btn').addEventListener('click', () => location.href = 'index.html');
    }
    
    if (elements.search.btn) {
        elements.search.btn.addEventListener('click', handleSearch);
        elements.search.clear.addEventListener('click', clearSearch);
        elements.search.input.addEventListener('keyup', e => e.key === 'Enter' && handleSearch());
    }
    
    checkForEdit();
};

const handleSubmit = async (e) => { // Made async
    e.preventDefault();
    const formData = {
        location: document.getElementById('location').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        image: elements.image.url.value.trim()
    };

    if (!formData.location || !formData.date || !formData.description) {
        return alert('Please fill all required fields');
    }

    if (!isEditing && entries.length >= MAX_ENTRIES) {
        return alert(`Maximum ${MAX_ENTRIES} entries reached. Delete some first.`);
    }

    // Convert image URL to Base64 if needed
    const processedImage = await urlToBase64(formData.image);

    const entry = {
        id: isEditing ? currentEditId : Date.now(),
        ...formData,
        image: processedImage || null
    };

    if (isEditing) {
        const index = entries.findIndex(e => e.id === currentEditId);
        if (index !== -1) {
            entries[index] = entry;
        }
    } else {
        entries.push(entry);
    }
    
    localStorage.setItem('travelEntries', JSON.stringify(entries));
    location.href = 'index.html';
};


const renderEntries = (entriesToRender = entries) => {
    if (!elements.container) return;
    
    elements.container.innerHTML = entriesToRender.length ? entriesToRender.map(entry => `
        <div class="entry-card">
            ${entry.image ? `
            <a href="${entry.image.startsWith('data:image') ? '#' : entry.image}" 
               target="_blank" 
               rel="noopener noreferrer">
                <img src="${entry.image}" 
                     alt="${entry.location}" 
                     class="entry-image" 
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
            </a>` : ''}
            <div class="entry-content">
                <h3>${entry.location}</h3>
                <p class="entry-date">${new Date(entry.date).toLocaleDateString()}</p>
                <p class="entry-description">${entry.description}</p>
                <div class="entry-actions">
                    <button class="edit-btn" data-id="${entry.id}">Edit</button>
                    <button class="delete-btn" data-id="${entry.id}">Delete</button>
                </div>
            </div>
        </div>
    `).join('') : '<p class="no-entries">No travel entries yet. Add your first entry!</p>';

    document.querySelectorAll('.edit-btn').forEach(btn => 
        btn.addEventListener('click', e => location.href = `add-entry.html?edit=${e.target.dataset.id}`)
    );
    
    document.querySelectorAll('.delete-btn').forEach(btn => 
        btn.addEventListener('click', e => confirm('Delete this entry?') && deleteEntry(e.target.dataset.id))
    );
};

const checkForEdit = () => {
    if (location.search.includes('edit=')) {
        isEditing = true;
        currentEditId = parseInt(location.search.split('=')[1]);
        const entry = entries.find(e => e.id === currentEditId);
        if (entry) {
            ['location', 'date', 'description'].forEach(field => 
                document.getElementById(field).value = entry[field]
            );
            elements.image.url.value = entry.image || '';
            document.getElementById('submit-btn').textContent = 'Update Entry';
            handleImage();
        }
    }
};

const handleImage = () => {
    const url = elements.image.url.value.trim();
    elements.image.preview.innerHTML = url ? 
        `<img src="${url}" onerror="this.parentElement.innerHTML='<p>Could not load image</p>'">` : '';
};

const deleteEntry = id => {
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('travelEntries', JSON.stringify(entries));
    renderEntries();
    updateCounter();
};

const handleSearch = () => {
    const term = elements.search.input.value.toLowerCase();
    renderEntries(term ? entries.filter(entry => 
        entry.location.toLowerCase().includes(term) || 
        entry.description.toLowerCase().includes(term)
    ) : entries);
};

const clearSearch = () => {
    elements.search.input.value = '';
    renderEntries();
};

const updateCounter = () => {
    if (elements.counter.current && elements.counter.max) {
        elements.counter.current.textContent = entries.length;
        elements.counter.max.textContent = MAX_ENTRIES;
        elements.counter.current.style.color = entries.length >= MAX_ENTRIES - 3 ? '#e74c3c' : '#2c3e50';
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', init);
