document.addEventListener('DOMContentLoaded', function() {

    // --- TMDB API Configuration ---
    const TMDB_API_KEY = '929d161540da6a455e07eb90318d6f42'; // <-- REPLACE WITH YOUR ACTUAL TMDB API KEY
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500'; // For posters
    const TMDB_BACKDROP_URL = 'https://image.tmdb.org/t/p/w780'; // For backdrop/spotlight

    // --- Movie Titles ---
    const movieTitlesFromRecTxt = [
        "Inception", "The Dark Knight", "Interstellar", "Pulp Fiction",
        "Fight Club", "Forrest Gump", "The Shawshank Redemption",
        "Parasite", "Mirzapur", "Sacred Games", "K.G.F: Chapter 2", "Pushpa: The Rise",
        "Gladiator", "The Matrix", "Spirited Away", "The Godfather", "The Lion King", "Avengers: Endgame",
        "Spiderman: No Way Home", "Dune", "Tenet", "Joker" // Added more for robust testing
    ];

    const spotlightSection = document.getElementById('spotlight-section');
    const recommendationContainer = document.getElementById('recommendationContainer');
    const modalContent = document.getElementById('modalContent');
    const modalTitleElem = document.getElementById('modalTitle');

    // --- Helper: Display Notification ---
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotificationBtn = notificationPanel.querySelector('.close-notification');
    let notificationTimeout;
    function showNotification(message, duration = 4000) { /* ... (same as before) ... */
        if (!notificationPanel || !notificationMessage) return;
        notificationMessage.textContent = message;
        notificationPanel.classList.add('show');
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notificationPanel.classList.remove('show');
        }, duration);
    }
    if (closeNotificationBtn) { /* ... (same as before) ... */
        closeNotificationBtn.addEventListener('click', () => {
            notificationPanel.classList.remove('show');
            clearTimeout(notificationTimeout);
        });
    }

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('themeToggleBtn'); /* ... (same as before) ... */
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) { /* ... (same as before) ... */
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') themeToggleBtn.textContent = '☀️';
        else themeToggleBtn.textContent = '🌙';
    } else { /* ... (same as before) ... */
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '🌙';
    }
    themeToggleBtn.addEventListener('click', () => { /* ... (same as before) ... */
        let currentThemeVal = document.documentElement.getAttribute('data-theme');
        if (currentThemeVal === 'dark') {
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
    async function fetchFromTMDB(endpoint, params = "") { /* ... (same as before) ... */
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
    async function searchTMDB(query) { /* ... (same as before) ... */
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
    async function getItemDetails(id, mediaType) { /* ... (same as before) ... */
        return await fetchFromTMDB(`/${mediaType}/${id}`, '&append_to_response=videos,credits,external_ids');
    }

    // --- Display Spotlight Recommendation ---
    async function displaySpotlightRecommendation() { /* ... (same as before) ... */
        if (!spotlightSection || movieTitlesFromRecTxt.length === 0) {
            if (spotlightSection) spotlightSection.innerHTML = '<p class="api-message">No items for spotlight.</p>';
            return;
        }
        const spotlightTitle = movieTitlesFromRecTxt[0];
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
                    ${itemData.poster_path ? `<div class="spotlight-poster"><img src="${TMDB_IMG_URL + itemData.poster_path}" alt="${title} Poster"></div>` : ''}
                    <div class="spotlight-details">
                        <h2>${title}</h2>
                        <div class="spotlight-meta"><span>⭐ ${rating}</span><span>${year}</span><span>${itemData.original_language ? itemData.original_language.toUpperCase() : ''}</span><span>${isTV ? 'TV Series' : 'Movie'}</span></div>
                        <p class="spotlight-overview">${overview.substring(0, 280)}${overview.length > 280 ? '...' : ''}</p>
                        <div class="spotlight-actions"><button class="btn btn-primary open-modal-btn" data-id="${itemData.id}" data-type="${itemData.media_type}">View Details</button></div>
                    </div>
                </div>`;
            const currentCardBgColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg-color').trim();
            let cardBgRgb = '24,24,24';
            if (currentCardBgColor.startsWith('#')) { const r = parseInt(currentCardBgColor.slice(1, 3), 16); const g = parseInt(currentCardBgColor.slice(3, 5), 16); const b = parseInt(currentCardBgColor.slice(5, 7), 16); cardBgRgb = `${r},${g},${b}`; }
            else if (currentCardBgColor.startsWith('rgb')) { cardBgRgb = currentCardBgColor.match(/\d+/g).join(','); }
            const spotlightCardElement = spotlightSection.querySelector('.spotlight-card');
            if(spotlightCardElement) spotlightCardElement.style.setProperty('--card-bg-color-rgb', cardBgRgb);
        } else { spotlightSection.innerHTML = `<p class="api-message">Could not load spotlight for "${spotlightTitle}".</p>`; }
    }

    // --- Display Curated Recommendations List & AUTO SCROLL (Improved) ---
    let curatedScrollRequestID;
    let isCuratedHovering = false;
    let isCuratedManuallyScrolling = false; // To detect user's manual scroll
    let manualScrollTimeout;
    const SCROLL_SPEED_PIXELS_PER_SECOND = 1024; // Adjust for desired speed (e.g., 50px/sec)
    let lastFrameTime = 0;

    function curatedAutoScrollStep(timestamp) {
        if (!recommendationContainer || isCuratedHovering || isCuratedManuallyScrolling) {
            curatedScrollRequestID = requestAnimationFrame(curatedAutoScrollStep); // Keep checking if paused
            lastFrameTime = timestamp; // Reset lastFrameTime when paused
            return;
        }

        if (lastFrameTime === 0) { // First frame after resuming/starting
            lastFrameTime = timestamp;
            curatedScrollRequestID = requestAnimationFrame(curatedAutoScrollStep);
            return;
        }

        const deltaTime = (timestamp - lastFrameTime) / 1000; // Time difference in seconds
        lastFrameTime = timestamp;
        const scrollAmount = SCROLL_SPEED_PIXELS_PER_SECOND * deltaTime;

        if (recommendationContainer.scrollLeft + recommendationContainer.clientWidth >= recommendationContainer.scrollWidth - 1) { // -1 for subpixel precision
            // Reached the end, instantly jump to the beginning for a loop illusion
            recommendationContainer.scrollLeft = 0;
        } else {
            recommendationContainer.scrollLeft += scrollAmount;
        }
        curatedScrollRequestID = requestAnimationFrame(curatedAutoScrollStep);
    }

    function startCuratedAutoScroll() {
        if (curatedScrollRequestID) { // Already running or requested
            return;
        }
        lastFrameTime = 0; // Reset for new start
        isCuratedManuallyScrolling = false; // Ensure it's not stuck from a previous manual scroll
        curatedScrollRequestID = requestAnimationFrame(curatedAutoScrollStep);
    }

    function stopCuratedAutoScroll() {
        if (curatedScrollRequestID) {
            cancelAnimationFrame(curatedScrollRequestID);
            curatedScrollRequestID = null;
        }
    }

    if (recommendationContainer) {
        recommendationContainer.addEventListener('mouseenter', () => {
            isCuratedHovering = true;
            // stopCuratedAutoScroll(); // Option to stop immediately
        });

        recommendationContainer.addEventListener('mouseleave', () => {
            isCuratedHovering = false;
            // No need to explicitly call start, the animation loop will resume
        });

        // Handle user manually scrolling the container
        recommendationContainer.addEventListener('scroll', () => {
            if (!isCuratedHovering) { // Only if not paused by hover
                // A scroll event means the scrollLeft changed. If the animation loop is also running,
                // this scroll event could be from the animation itself or the user.
                // We'll set a flag and use a timeout to determine if user stopped scrolling.
                isCuratedManuallyScrolling = true;
                clearTimeout(manualScrollTimeout);
                manualScrollTimeout = setTimeout(() => {
                    isCuratedManuallyScrolling = false;
                    // No need to explicitly call start, the animation loop will resume checking
                }, 2000); // Resume auto-scroll if no manual scroll for 2 seconds
            }
        }, { passive: true });
    }

    async function displayCuratedRecommendations() {
        if (!recommendationContainer) return;
        const spinner = recommendationContainer.querySelector('.spinner-container');

        if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') { /* ... (same as before) ... */
             if(spinner) spinner.parentElement.innerHTML = '<p class="api-message">TMDB API Key needed.</p>';
            return;
        }
        if (movieTitlesFromRecTxt.length === 0) { /* ... (same as before) ... */
            if(spinner) spinner.parentElement.innerHTML = '<p class="api-message">Rec list empty.</p>';
            return;
        }

        stopCuratedAutoScroll(); // Stop any existing scroll before reloading
        recommendationContainer.innerHTML = '';
        let fetchedCount = 0;

        for (const titleQuery of movieTitlesFromRecTxt) { /* ... (card creation same as before) ... */
            const itemData = await searchTMDB(titleQuery);
            if (itemData) {
                fetchedCount++;
                const isTV = itemData.media_type === 'tv';
                const title = isTV ? itemData.name : itemData.title;
                const releaseDate = isTV ? itemData.first_air_date : itemData.release_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                const rating = itemData.vote_average ? itemData.vote_average.toFixed(1) : 'N/A';
                const posterPath = itemData.poster_path ? TMDB_IMG_URL + itemData.poster_path : 'https://via.placeholder.com/220x330.png?text=No+Image';
                const card = document.createElement('div');
                card.classList.add('recommendation-card');
                card.setAttribute('data-id', itemData.id);
                card.setAttribute('data-type', itemData.media_type);
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `View details for ${title}`);
                card.innerHTML = `
                    <a href="#" class="card-poster-link" data-id="${itemData.id}" data-type="${itemData.media_type}" aria-hidden="true" tabindex="-1"><img src="${posterPath}" alt="${title} Poster" loading="lazy"></a>
                    <div class="movie-details"><h3>${title}</h3><div class="movie-genres"><span>${isTV ? 'TV Series' : 'Movie'}</span></div><div class="rating-votes"><span class="rating">⭐ ${rating}</span><span class="votes">(${itemData.vote_count || 0})</span></div><p class="movie-metadata">${year} | ${itemData.original_language ? itemData.original_language.toUpperCase() : 'N/A'}</p></div>`;
                recommendationContainer.appendChild(card);
            }
        }
        if (spinner) spinner.remove();

        if (fetchedCount === 0 && movieTitlesFromRecTxt.length > 0) {
            recommendationContainer.innerHTML = '<p class="api-message">Could not fetch details. Check console.</p>';
        }
        if (fetchedCount > 0) {
            showNotification(`${fetchedCount} recommendations loaded!`);
            if (recommendationContainer.children.length > 0 && recommendationContainer.scrollWidth > recommendationContainer.clientWidth) {
                startCuratedAutoScroll();
            }
        }
    }

    // --- Movie Details Modal Logic ---
    MicroModal.init({ /* ... (same as before) ... */
        awaitCloseAnimation: true,
        onShow: (modal) => { document.body.classList.add('modal-open-no-scroll'); },
        onClose: (modal) => { modalContent.innerHTML = '<div class="spinner-container modal-spinner"><div class="spinner"></div><p>Loading details...</p></div>'; document.body.classList.remove('modal-open-no-scroll'); }
    });
    async function populateModal(itemId, itemType) { /* ... (same as before, including imdb link and trailer) ... */
        modalContent.innerHTML = '<div class="spinner-container modal-spinner"><div class="spinner"></div><p>Loading details...</p></div>';
        MicroModal.show('movieDetailModal');
        const details = await getItemDetails(itemId, itemType);
        if (!details) { modalContent.innerHTML = "<p class='api-message'>Sorry, couldn't load details.</p>"; modalTitleElem.textContent = "Error"; return; }
        const isTV = itemType === 'tv';
        const title = isTV ? details.name : details.title;
        const overview = details.overview || "No overview available.";
        const posterPath = details.poster_path ? TMDB_IMG_URL + details.poster_path : 'https://via.placeholder.com/150x225.png?text=N/A';
        const releaseDate = isTV ? details.first_air_date : details.release_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const runtime = isTV ? (details.episode_run_time && details.episode_run_time.length > 0 ? details.episode_run_time[0] + " min/ep" : "N/A") : (details.runtime ? details.runtime + " min" : "N/A");
        const genres = details.genres && details.genres.length > 0 ? details.genres.map(g => `<span>${g.name}</span>`).join('') : '<span>N/A</span>';
        const cast = details.credits && details.credits.cast && details.credits.cast.length > 0 ? details.credits.cast.slice(0, 5).map(c => `<span>${c.name} (${c.character})</span>`).join('') : '<span>N/A</span>';
        let trailerHTML = '<p>No trailer available.</p>';
        if (details.videos && details.videos.results && details.videos.results.length > 0) {
            const officialTrailer = details.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) || details.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || details.videos.results.find(v => v.site === "YouTube");
            if (officialTrailer) { trailerHTML = `<div class="trailer-container"><iframe src="https://www.youtube.com/embed/${officialTrailer.key}" allowfullscreen loading="lazy"></iframe></div>`; }
        }
        let imdbLinkHTML = '';
        if (details.external_ids && details.external_ids.imdb_id) { imdbLinkHTML = `<a href="https://www.imdb.com/title/${details.external_ids.imdb_id}/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary detail-imdb-link" style="margin-right:10px;">View on IMDb</a>`; }
        modalTitleElem.textContent = title;
        modalContent.innerHTML = `
            <div class="detail-main-layout"><div class="detail-poster"><img src="${posterPath}" alt="${title} Poster" loading="lazy"></div><div class="detail-primary-info"><h3>Overview</h3><p>${overview}</p></div></div>
            <div class="detail-secondary-info"><h3>Genres</h3><div class="genres-container">${genres}</div><h3>Cast (Top Billed)</h3><div class="cast-list">${cast}</div><h3>Details</h3><p><strong>Type:</strong> ${isTV ? 'TV Series' : 'Movie'}</p><p><strong>Release:</strong> ${year}</p><p><strong>Rating:</strong> ⭐ ${rating} (${details.vote_count || 0} votes)</p><p><strong>Runtime:</strong> ${runtime}</p><p><strong>Status:</strong> ${details.status || 'N/A'}</p>${details.tagline ? `<p><strong>Tagline:</strong> <em>${details.tagline}</em></p>` : ''}<h3>Trailer</h3>${trailerHTML}<div style="margin-top: calc(var(--spacing-unit) * 2);">${imdbLinkHTML}<a href="https://www.themoviedb.org/${itemType}/${itemId}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary detail-tmdb-link">View on TMDB</a></div></div>`;
    }
    document.body.addEventListener('click', function(event) { /* ... (same as before) ... */
        const targetButton = event.target.closest('.open-modal-btn, .recommendation-card, .card-poster-link');
        if (targetButton) { event.preventDefault(); const itemId = targetButton.dataset.id; const itemType = targetButton.dataset.type; if (itemId && itemType) { populateModal(itemId, itemType); } }
    });
    document.body.addEventListener('keydown', function(event) { /* ... (same as before) ... */
        const targetCard = event.target.closest('.recommendation-card');
        if (targetCard && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); const itemId = targetCard.dataset.id; const itemType = targetCard.dataset.type; if (itemId && itemType) { populateModal(itemId, itemType); } }
    });

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item'); /* ... (same as before) ... */
    faqItems.forEach(item => {
        const questionButton = item.querySelector('.faq-question');
        const answerDiv = item.querySelector('.faq-answer');
        if (questionButton && answerDiv) {
            questionButton.addEventListener('click', () => {
                const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';
                questionButton.setAttribute('aria-expanded', !isExpanded);
                answerDiv.setAttribute('aria-hidden', isExpanded);
            });
        }
    });

    // --- To-Do List Logic (Watchlist) ---
    const todoInput = document.getElementById('todoInput'); /* ... (same as before) ... */
    const addTodoButton = document.getElementById('addTodoButton');
    const todoListUL = document.getElementById('todoList');
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
    function renderTodos() { /* ... (same as before) ... */
        if (!todoListUL) return;
        todoListUL.innerHTML = '';
        if(todos.length === 0) { todoListUL.innerHTML = "<p class='api-message' style='text-align:left; font-size:0.9em; padding:0;'>Your watchlist is empty.</p>"; return; }
        todos.forEach((todo, index) => {
            const li = document.createElement('li'); li.classList.toggle('completed', todo.completed); li.setAttribute('data-index', index);
            const span = document.createElement('span'); span.textContent = todo.text; li.appendChild(span);
            const removeBtn = document.createElement('button'); removeBtn.textContent = '✕'; removeBtn.classList.add('remove-todo-btn'); removeBtn.setAttribute('aria-label', `Remove task: ${todo.text}`); li.appendChild(removeBtn);
            todoListUL.appendChild(li);
        });
    }
    function handleAddTask() { /* ... (same as before) ... */
        if (!todoInput) return;
        const taskText = todoInput.value.trim();
        if (taskText === '') { showNotification('Item name cannot be empty!', 2000); return; }
        todos.push({ text: taskText, completed: false }); saveTodos(); renderTodos();
        showNotification(`"${taskText.substring(0,20)}..." added to watchlist!`, 3000);
        todoInput.value = ''; todoInput.focus();
    }
    if (addTodoButton && todoInput && todoListUL) { /* ... (same as before) ... */
        addTodoButton.addEventListener('click', handleAddTask);
        todoInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddTask(); } });
        todoListUL.addEventListener('click', (event) => {
            const target = event.target; const li = target.closest('li'); if (!li || !li.dataset.index) return;
            const index = parseInt(li.dataset.index);
            if (target.classList.contains('remove-todo-btn') || target.closest('.remove-todo-btn')) {
                const removedTodo = todos.splice(index, 1); saveTodos(); renderTodos();
                if (removedTodo.length > 0) showNotification(`"${removedTodo[0].text.substring(0,20)}..." removed.`, 2000);
            } else { todos[index].completed = !todos[index].completed; saveTodos(); renderTodos(); showNotification(`Watchlist item status updated.`, 1500); }
        });
    }

    // --- Footer Current Year ---
    const currentYearSpan = document.getElementById('currentYear'); /* ... (same as before) ... */
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

    // --- Initializations ---
    async function initializePage() {
        showNotification("Welcome to Vis Recommendations!", 2500);
        renderTodos();
        await displaySpotlightRecommendation();
        await displayCuratedRecommendations();
    }

    initializePage();

}); // End of DOMContentLoaded
