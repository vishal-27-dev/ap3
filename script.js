document.addEventListener('DOMContentLoaded', function() {

    // --- TMDB API Configuration ---
    const TMDB_API_KEY = '929d161540da6a455e07eb90318d6f42'; // <-- REPLACE WITH YOUR ACTUAL TMDB API KEY
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500'; // For posters
    const TMDB_BACKDROP_URL = 'https://image.tmdb.org/t/p/w780'; // For backdrop/spotlight

    // --- Movie Titles from your rec.txt (simulated) ---
    const movieTitlesFromRecTxt = [
        "Inception", "The Dark Knight", "Interstellar", "Pulp Fiction",
        "Fight Club", "Forrest Gump", "The Shawshank Redemption",
        "Parasite", "Mirzapur", "Sacred Games", "K.G.F: Chapter 2", "Pushpa: The Rise"
    ];

    const spotlightSection = document.getElementById('spotlight-section');
    const recommendationContainer = document.getElementById('recommendationContainer');
    const modalContent = document.getElementById('modalContent');
    const modalTitleElem = document.getElementById('modalTitle');


    // --- Helper: Display Notification ---
    // (Same as before, ensure it's present)
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotificationBtn = notificationPanel.querySelector('.close-notification');
    let notificationTimeout;
    function showNotification(message, duration = 4000) { /* ... (keep existing code) ... */
        if (!notificationPanel || !notificationMessage) return;
        notificationMessage.textContent = message;
        notificationPanel.classList.add('show');
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notificationPanel.classList.remove('show');
        }, duration);
    }
    if (closeNotificationBtn) { /* ... (keep existing code) ... */
        closeNotificationBtn.addEventListener('click', () => {
            notificationPanel.classList.remove('show');
            clearTimeout(notificationTimeout);
        });
    }


    // --- Theme Toggle ---
    // (Same as before, ensure it's present)
    const themeToggleBtn = document.getElementById('themeToggleBtn'); /* ... (keep existing code) ... */
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') themeToggleBtn.textContent = '☀️';
        else themeToggleBtn.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '🌙';
    }
    themeToggleBtn.addEventListener('click', () => { /* ... (keep existing code) ... */
        let currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '☀️';
            showNotification("Switched to Light Mode", 2000);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '🌙';
            showNotification("Switched to Dark Mode", 2000);
        }
    });


    // --- API Fetching Utilities ---
    async function fetchFromTMDB(endpoint, params = "") {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            console.error("TMDB API Key is not configured.");
            showNotification("TMDB API Key missing. Please configure.", 5000);
            return null;
        }
        const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}${params}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Error fetching ${endpoint}: ${response.status} ${response.statusText}`);
                const errorData = await response.json();
                console.error("Error details:", errorData);
                showNotification(`API Error: ${errorData.status_message || response.statusText}`, 5000);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Network error or JSON parsing error for ${endpoint}:`, error);
            showNotification("Network error. Check console.", 5000);
            return null;
        }
    }

    async function searchTMDB(query) {
        let movieData = await fetchFromTMDB("/search/movie", `&query=${encodeURIComponent(query)}`);
        if (movieData && movieData.results && movieData.results.length > 0) {
            return { ...movieData.results[0], media_type: 'movie' };
        }
        let tvData = await fetchFromTMDB("/search/tv", `&query=${encodeURIComponent(query)}`);
        if (tvData && tvData.results && tvData.results.length > 0) {
            return { ...tvData.results[0], media_type: 'tv' };
        }
        console.warn(`No results found for "${query}" as movie or TV show.`);
        return null;
    }

    async function getItemDetails(id, mediaType) {
        return await fetchFromTMDB(`/${mediaType}/${id}`, '&append_to_response=videos,credits');
    }


    // --- Display Spotlight Recommendation ---
    async function displaySpotlightRecommendation() {
        if (!spotlightSection || movieTitlesFromRecTxt.length === 0) {
            if (spotlightSection) spotlightSection.innerHTML = '<p class="api-message">No items for spotlight.</p>';
            return;
        }

        const spotlightTitle = movieTitlesFromRecTxt[0]; // Use the first item from your list
        const itemData = await searchTMDB(spotlightTitle);

        const spinner = spotlightSection.querySelector('.spinner-container');
        if(spinner) spinner.remove();

        if (itemData) {
            const isTV = itemData.media_type === 'tv';
            const title = isTV ? itemData.name : itemData.title;
            const overview = itemData.overview || "No overview available.";
            const releaseDate = isTV ? itemData.first_air_date : itemData.release_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            const rating = itemData.vote_average ? itemData.vote_average.toFixed(1) : 'N/A';
            const backdropPath = itemData.backdrop_path ? TMDB_BACKDROP_URL + itemData.backdrop_path : (itemData.poster_path ? TMDB_IMG_URL + itemData.poster_path : 'https://via.placeholder.com/780x439.png?text=No+Image');

            spotlightSection.innerHTML = `
                <div class="spotlight-card" style="background-image: linear-gradient(to right, rgba(var(--card-bg-color-rgb, 24,24,24), 0.95) 30%, rgba(var(--card-bg-color-rgb, 24,24,24), 0.6) 70%), url('${backdropPath}'); background-size: cover; background-position: center top;">
                    ${itemData.poster_path ? `<div class="spotlight-poster">
                        <img src="${TMDB_IMG_URL + itemData.poster_path}" alt="${title} Poster">
                    </div>` : ''}
                    <div class="spotlight-details">
                        <h2>${title}</h2>
                        <div class="spotlight-meta">
                            <span>⭐ ${rating}</span>
                            <span>${year}</span>
                            <span>${itemData.original_language ? itemData.original_language.toUpperCase() : ''}</span>
                            <span>${isTV ? 'TV Series' : 'Movie'}</span>
                        </div>
                        <p class="spotlight-overview">${overview.substring(0, 280)}${overview.length > 280 ? '...' : ''}</p>
                        <div class="spotlight-actions">
                            <button class="btn btn-primary open-modal-btn" data-id="${itemData.id}" data-type="${itemData.media_type}">View Details</button>
                            <!-- Add to watchlist button can be added here -->
                        </div>
                    </div>
                </div>`;
             // Dynamically set --card-bg-color-rgb for gradient (needs to be robust for light/dark)
            const cardBgRgb = getComputedStyle(document.documentElement).getPropertyValue('--card-bg-color').match(/\d+/g).join(',');
            spotlightSection.querySelector('.spotlight-card').style.setProperty('--card-bg-color-rgb', cardBgRgb);


        } else {
            spotlightSection.innerHTML = `<p class="api-message">Could not load spotlight for "${spotlightTitle}".</p>`;
        }
    }


    // --- Display Curated Recommendations List ---
    async function displayCuratedRecommendations() {
        if (!recommendationContainer) return;
        const spinner = recommendationContainer.querySelector('.spinner-container');

        if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
             if(spinner) spinner.parentElement.innerHTML = '<p class="api-message">TMDB API Key needed for recommendations.</p>';
            return;
        }
        if (movieTitlesFromRecTxt.length === 0) {
            if(spinner) spinner.parentElement.innerHTML = '<p class="api-message">Your recommendation list is empty.</p>';
            return;
        }

        recommendationContainer.innerHTML = ''; // Clear existing cards, keep spinner until done
        let fetchedCount = 0;

        for (const titleQuery of movieTitlesFromRecTxt) {
            // Skip the one already in spotlight if you want different items, or just start from index 1
            // if (titleQuery === movieTitlesFromRecTxt[0]) continue;

            const itemData = await searchTMDB(titleQuery);
            if (itemData) {
                fetchedCount++;
                const isTV = itemData.media_type === 'tv';
                const title = isTV ? itemData.name : itemData.title;
                const releaseDate = isTV ? itemData.first_air_date : itemData.release_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                const rating = itemData.vote_average ? itemData.vote_average.toFixed(1) : 'N/A';
                const posterPath = itemData.poster_path ? TMDB_IMG_URL + itemData.poster_path : 'https://via.placeholder.com/220x330.png?text=No+Image';
                
                // Fetch genres for card (simplified, full genres in modal)
                let genresText = 'N/A';
                if (itemData.genre_ids && itemData.genre_ids.length > 0) {
                     // In a real app, map genre_ids to names. For now, just show first few IDs or placeholder.
                    // This would ideally be pre-fetched or looked up from a static list of TMDB genres.
                    genresText = itemData.genre_ids.slice(0,2).join(', ') + (itemData.genre_ids.length > 2 ? '...' : '');
                }


                const card = document.createElement('div');
                card.classList.add('recommendation-card');
                card.setAttribute('data-id', itemData.id);
                card.setAttribute('data-type', itemData.media_type);
                card.setAttribute('tabindex', '0'); // Make it focusable for keyboard nav
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `View details for ${title}`);

                card.innerHTML = `
                    <a href="#" class="card-poster-link" data-id="${itemData.id}" data-type="${itemData.media_type}" aria-hidden="true" tabindex="-1">
                        <img src="${posterPath}" alt="${title} Poster" loading="lazy">
                    </a>
                    <div class="movie-details">
                        <h3>${title}</h3>
                        <div class="movie-genres"><span>${isTV ? 'TV Series' : 'Movie'}</span></div>
                        <div class="rating-votes">
                            <span class="rating">⭐ ${rating}</span>
                            <span class="votes">(${itemData.vote_count || 0})</span>
                        </div>
                        <p class="movie-metadata">${year} | ${itemData.original_language ? itemData.original_language.toUpperCase() : 'N/A'}</p>
                    </div>
                `;
                recommendationContainer.appendChild(card);
            }
        }
        if(spinner) spinner.remove();

        if (fetchedCount === 0 && movieTitlesFromRecTxt.length > 0) {
            recommendationContainer.innerHTML = '<p class="api-message">Could not fetch details for the titles in your list. Check console.</p>';
        }
        if (fetchedCount > 0) {
            showNotification(`${fetchedCount} recommendations loaded!`);
        }
    }


    // --- Movie Details Modal Logic ---
    MicroModal.init({
        awaitCloseAnimation: true, // Optional
        onShow: (modal) => {
             document.body.classList.add('modal-open-no-scroll');
        },
        onClose: (modal) => {
            modalContent.innerHTML = '<div class="spinner-container modal-spinner"><div class="spinner"></div><p>Loading details...</p></div>'; // Reset for next open
            document.body.classList.remove('modal-open-no-scroll');
        }
    });

    async function populateModal(itemId, itemType) {
        modalContent.innerHTML = '<div class="spinner-container modal-spinner"><div class="spinner"></div><p>Loading details...</p></div>'; // Show spinner
        MicroModal.show('movieDetailModal');

        const details = await getItemDetails(itemId, itemType);
        if (!details) {
            modalContent.innerHTML = "<p class='api-message'>Sorry, couldn't load details for this item.</p>";
            modalTitleElem.textContent = "Error";
            return;
        }

        const isTV = itemType === 'tv';
        const title = isTV ? details.name : details.title;
        const overview = details.overview || "No overview available.";
        const posterPath = details.poster_path ? TMDB_IMG_URL + details.poster_path : 'https://via.placeholder.com/150x225.png?text=N/A';
        const releaseDate = isTV ? details.first_air_date : details.release_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const runtime = isTV ? (details.episode_run_time && details.episode_run_time.length > 0 ? details.episode_run_time[0] + " min/ep" : "N/A") : (details.runtime ? details.runtime + " min" : "N/A");
        const genres = details.genres && details.genres.length > 0 ? details.genres.map(g => `<span>${g.name}</span>`).join('') : '<span>N/A</span>';
        const cast = details.credits && details.credits.cast && details.credits.cast.length > 0 ?
            details.credits.cast.slice(0, 5).map(c => `<span>${c.name} (${c.character})</span>`).join('') : '<span>N/A</span>';

        let trailerHTML = '<p>No trailer available.</p>';
        if (details.videos && details.videos.results && details.videos.results.length > 0) {
            const officialTrailer = details.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
                                   details.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") ||
                                   details.videos.results.find(v => v.site === "YouTube"); // Fallback to any YouTube video
            if (officialTrailer) {
                trailerHTML = `<div class="trailer-container"><iframe src="https://www.youtube.com/embed/${officialTrailer.key}" allowfullscreen></iframe></div>`;
            }
        }

        modalTitleElem.textContent = title;
        modalContent.innerHTML = `
            <div class="detail-main-layout">
                <div class="detail-poster">
                    <img src="${posterPath}" alt="${title} Poster">
                </div>
                <div class="detail-primary-info">
                    <h3>Overview</h3>
                    <p>${overview}</p>
                </div>
            </div>
            <div class="detail-secondary-info">
                <h3>Genres</h3>
                <div class="genres-container">${genres}</div>

                <h3>Cast (Top Billed)</h3>
                <div class="cast-list">${cast}</div>

                <h3>Details</h3>
                <p><strong>Type:</strong> ${isTV ? 'TV Series' : 'Movie'}</p>
                <p><strong>Release:</strong> ${year}</p>
                <p><strong>Rating:</strong> ⭐ ${rating} (${details.vote_count || 0} votes)</p>
                <p><strong>Runtime:</strong> ${runtime}</p>
                <p><strong>Status:</strong> ${details.status || 'N/A'}</p>
                 ${details.tagline ? `<p><strong>Tagline:</strong> <em>${details.tagline}</em></p>` : ''}

                <h3>Trailer</h3>
                ${trailerHTML}
                
                <a href="https://www.themoviedb.org/${itemType}/${itemId}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary detail-tmdb-link">View on TMDB</a>
            </div>
        `;
    }

    // Event listener for opening modal (delegated)
    document.body.addEventListener('click', function(event) {
        const targetButton = event.target.closest('.open-modal-btn, .recommendation-card, .card-poster-link');
        if (targetButton) {
            event.preventDefault();
            const itemId = targetButton.dataset.id;
            const itemType = targetButton.dataset.type;
            if (itemId && itemType) {
                populateModal(itemId, itemType);
            }
        }
    });
     document.body.addEventListener('keydown', function(event) {
        const targetCard = event.target.closest('.recommendation-card');
        if (targetCard && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            const itemId = targetCard.dataset.id;
            const itemType = targetCard.dataset.type;
            if (itemId && itemType) {
                populateModal(itemId, itemType);
            }
        }
    });


    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionButton = item.querySelector('.faq-question');
        const answerDiv = item.querySelector('.faq-answer');
        if (questionButton && answerDiv) {
            questionButton.addEventListener('click', () => {
                const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';
                questionButton.setAttribute('aria-expanded', !isExpanded);
                answerDiv.setAttribute('aria-hidden', isExpanded); // if true, it will become false and vice versa
            });
        }
    });


    // --- To-Do List Logic (Watchlist) ---
    // (Mostly same as before, but can be improved with better notifications/item display)
    const todoInput = document.getElementById('todoInput');
    const addTodoButton = document.getElementById('addTodoButton');
    const todoListUL = document.getElementById('todoList');
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
    function renderTodos() { /* ... (keep existing, maybe enhance LI styling or add movie link) ... */
        if (!todoListUL) return;
        todoListUL.innerHTML = '';
        if(todos.length === 0) {
            todoListUL.innerHTML = "<p class='api-message' style='text-align:left; font-size:0.9em; padding:0;'>Your watchlist is empty.</p>";
            return;
        }
        todos.forEach((todo, index) => { /* ... same as before ... */
            const li = document.createElement('li');
            li.classList.toggle('completed', todo.completed);
            li.setAttribute('data-index', index);

            const span = document.createElement('span');
            span.textContent = todo.text;
            li.appendChild(span);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.classList.add('remove-todo-btn');
            removeBtn.setAttribute('aria-label', `Remove task: ${todo.text}`);
            li.appendChild(removeBtn);

            todoListUL.appendChild(li);
        });
    }
    function handleAddTask() { /* ... (keep existing, update notification message for watchlist) ... */
         if (!todoInput) return;
        const taskText = todoInput.value.trim();
        if (taskText === '') {
            showNotification('Item name cannot be empty!', 2000);
            return;
        }
        todos.push({ text: taskText, completed: false });
        saveTodos();
        renderTodos();
        showNotification(`"${taskText.substring(0,20)}..." added to watchlist!`, 3000);
        todoInput.value = '';
        todoInput.focus();
    }
    if (addTodoButton && todoInput && todoListUL) { /* ... (keep existing event listeners) ... */
        addTodoButton.addEventListener('click', handleAddTask);
        todoInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); handleAddTask(); }
        });

        todoListUL.addEventListener('click', (event) => {
            const target = event.target;
            const li = target.closest('li');
            if (!li || !li.dataset.index) return; // Ensure it's a valid task li

            const index = parseInt(li.dataset.index);

            if (target.classList.contains('remove-todo-btn') || target.closest('.remove-todo-btn')) {
                const removedTodo = todos.splice(index, 1);
                saveTodos();
                renderTodos();
                if (removedTodo.length > 0) showNotification(`"${removedTodo[0].text.substring(0,20)}..." removed from watchlist.`, 2000);
            } else {
                todos[index].completed = !todos[index].completed;
                saveTodos();
                renderTodos();
                showNotification(`Watchlist item status updated.`, 1500);
            }
        });
    }


    // --- Footer Current Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

    // --- Initializations ---
    async function initializePage() {
        showNotification("Welcome to Vis Recommendations!", 2500);
        renderTodos(); // Load watchlist first
        await displaySpotlightRecommendation();
        await displayCuratedRecommendations();
    }

    initializePage();

}); // End of DOMContentLoaded
