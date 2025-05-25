document.addEventListener('DOMContentLoaded', function() {

    // --- TMDB API Configuration ---
    const TMDB_API_KEY = '929d161540da6a455e07eb90318d6f42'; // <-- REPLACE WITH YOUR ACTUAL TMDB API KEY
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500'; // For poster images

    // --- Movie Titles from your rec.txt (simulated) ---
    // Replace this array with the actual movie titles from your rec.txt
    // One movie title per string in the array.
    const movieTitlesFromRecTxt = [
        "Inception",
        "The Dark Knight",
        "Interstellar",
        "Pulp Fiction",
        "Fight Club",
        "Forrest Gump",
        "The Shawshank Redemption",
        "Parasite",
        "Mirzapur", // Example of a series (might need specific handling for series vs movies)
        "Sacred Games"
    ];

    // --- Helper: Display Notification ---
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotificationBtn = notificationPanel.querySelector('.close-notification');
    let notificationTimeout;

    function showNotification(message, duration = 4000) {
        if (!notificationPanel || !notificationMessage) return;
        notificationMessage.textContent = message;
        notificationPanel.classList.add('show');
        clearTimeout(notificationTimeout); // Clear existing timeout
        notificationTimeout = setTimeout(() => {
            notificationPanel.classList.remove('show');
        }, duration);
    }
    if (closeNotificationBtn) {
        closeNotificationBtn.addEventListener('click', () => {
            notificationPanel.classList.remove('show');
            clearTimeout(notificationTimeout);
        });
    }

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
            themeToggleBtn.textContent = '☀️';
        } else {
            themeToggleBtn.textContent = '🌙';
        }
    } else { // Default to dark
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '🌙';
    }

    themeToggleBtn.addEventListener('click', () => {
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


    // --- API Fetching for Recommendations (from rec.txt titles) ---
    const recommendationContainer = document.getElementById('recommendationContainer');

    async function fetchMovieOrTVDetails(query, type = 'movie') { // type can be 'movie' or 'tv'
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            console.error("TMDB API Key is not configured.");
            return null;
        }
        // Try searching as a movie first
        let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        try {
            let response = await fetch(searchUrl);
            let data = await response.json();

            if (data.results && data.results.length > 0) {
                return data.results[0]; // Return the first movie result
            } else {
                // If no movie found, try searching as a TV show
                searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
                response = await fetch(searchUrl);
                data = await response.json();
                if (data.results && data.results.length > 0) {
                    // Mark it as TV for different data extraction if needed (e.g., 'name' instead of 'title')
                    return { ...data.results[0], media_type: 'tv' };
                }
            }
            return null; // No result found for movie or TV
        } catch (error) {
            console.error(`Error fetching details for "${query}":`, error);
            return null;
        }
    }

    async function displayRecommendationsFromRecTxt() {
        if (!recommendationContainer) return;
        const spinnerContainer = recommendationContainer.querySelector('.spinner-container');
        
        if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            recommendationContainer.innerHTML = '<p class="api-message">Please add your TMDB API key in script.js to load recommendations.</p>';
            return;
        }
        recommendationContainer.innerHTML = ''; // Clear existing content (including spinner if it was outside)


        let fetchedCount = 0;
        for (const title of movieTitlesFromRecTxt) {
            const itemData = await fetchMovieOrTVDetails(title);
            if (itemData) {
                fetchedCount++;
                const card = document.createElement('div');
                card.classList.add('recommendation-card');

                const isTV = itemData.media_type === 'tv' || !itemData.title; // Heuristic for TV show
                const itemTitle = isTV ? itemData.name : itemData.title;
                const releaseDate = isTV ? itemData.first_air_date : itemData.release_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

                card.innerHTML = `
                    <img src="${itemData.poster_path ? TMDB_IMG_URL + itemData.poster_path : 'https://via.placeholder.com/240x360.png?text=No+Image'}" alt="${itemTitle} Poster">
                    <div class="movie-details">
                        <h3>${itemTitle}</h3>
                        <div class="rating-votes">
                            <span class="rating">⭐ ${itemData.vote_average ? itemData.vote_average.toFixed(1) : 'N/A'}</span>
                            <span class="votes">(${itemData.vote_count ? itemData.vote_count : 0} Votes)</span>
                        </div>
                        <p class="metadata">${year} | ${itemData.original_language ? itemData.original_language.toUpperCase() : ''} | ${isTV ? 'TV Series' : 'Movie'}</p>
                    </div>
                `;
                recommendationContainer.appendChild(card);
            }
        }
        if (spinnerContainer) spinnerContainer.remove(); // Remove spinner if it was separate

        if (fetchedCount === 0 && movieTitlesFromRecTxt.length > 0) {
            recommendationContainer.innerHTML = '<p class="api-message">Could not fetch details for the titles in your list. Check console for errors.</p>';
        } else if (movieTitlesFromRecTxt.length === 0) {
             recommendationContainer.innerHTML = '<p class="api-message">Your recommendation list (rec.txt) is empty.</p>';
        }
        if (fetchedCount > 0) {
            showNotification(`${fetchedCount} recommendations loaded from your list!`);
        }
    }

    // --- Image Carousel with Popular Movies/TV from TMDB ---
    const carouselSlidesContainer = document.querySelector('.carousel-slides');
    const carouselPrevBtn = document.querySelector('.carousel-btn.prev-btn');
    const carouselNextBtn = document.querySelector('.carousel-btn.next-btn');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    let carouselItems = [];
    let currentSlide = 0;
    let autoPlayInterval;

    async function fetchCarouselData() {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') return [];
        const url = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`; // Fetch trending movies and TV
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.results ? data.results.slice(0, 7) : []; // Take top 7 trending
        } catch (error) {
            console.error("Error fetching carousel data:", error);
            return [];
        }
    }

    async function setupCarousel() {
        if (!carouselSlidesContainer) return;
        const spinner = carouselSlidesContainer.querySelector('.spinner-container');

        if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            if(spinner) spinner.innerHTML = "<p>API Key needed for carousel.</p>";
            return;
        }

        carouselItems = await fetchCarouselData();
        if (spinner) spinner.remove();

        if (!carouselItems.length) {
            carouselSlidesContainer.innerHTML = "<p class='api-message' style='margin:auto;'>Could not load highlights.</p>";
            return;
        }

        if(carouselPrevBtn) carouselPrevBtn.style.display = 'block';
        if(carouselNextBtn) carouselNextBtn.style.display = 'block';

        carouselItems.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');
            const title = item.title || item.name; // Movie has 'title', TV has 'name'
            slide.innerHTML = `<img src="${item.poster_path ? TMDB_IMG_URL + item.poster_path : 'https://via.placeholder.com/800x450.png?text=No+Image'}" alt="${title} Highlight">`;
            carouselSlidesContainer.appendChild(slide);

            if (carouselDotsContainer) {
                const dot = document.createElement('span');
                dot.classList.add('carousel-dot');
                dot.setAttribute('data-slide', index);
                dot.addEventListener('click', () => { goToSlide(index); resetAutoPlay(); });
                carouselDotsContainer.appendChild(dot);
            }
        });
        updateCarousel();
        startAutoPlay();
    }

    function updateCarousel() {
        if (!carouselItems.length || !carouselSlidesContainer) return;
        carouselSlidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        if (carouselDotsContainer) {
            const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
        }
    }
    function goToSlide(slideIndex) { currentSlide = slideIndex; updateCarousel(); }
    function nextSlide() { currentSlide = (currentSlide < carouselItems.length - 1) ? currentSlide + 1 : 0; updateCarousel(); }
    function prevSlide() { currentSlide = (currentSlide > 0) ? currentSlide - 1 : carouselItems.length - 1; updateCarousel(); }

    if (carouselPrevBtn) carouselPrevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });
    if (carouselNextBtn) carouselNextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    
    function startAutoPlay(interval = 5000) {
        if (!carouselItems.length) return;
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, interval);
    }
    function resetAutoPlay() { if (carouselItems.length) startAutoPlay(); }


    // --- Form Validation Logic ---
    // (This part is largely unchanged, but ensure it still works with new layout/styles)
    const contactForm = document.getElementById('contactForm');
    const formSuccessMessage = document.getElementById('formSuccessMessage');
    if (contactForm) { /* ... existing form validation code ... */ }
        // Copy your existing contact form validation logic here, it should mostly work.
        // I'm adding a placeholder to keep the script runnable.
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');

        const fieldsToValidate = [
            { input: nameInput, required: true, name: "Name" },
            { input: emailInput, required: true, name: "Email", isEmail: true },
            { input: subjectInput, required: false },
            { input: messageInput, required: true, name: "Message" }
        ];

        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            let isFormValid = true;

            clearAllErrors(fieldsToValidate);
            formSuccessMessage.style.display = 'none';

            fieldsToValidate.forEach(fieldObj => {
                const { input, required, name, isEmail } = fieldObj;
                const value = input.value.trim();

                if (required && value === '') {
                    isFormValid = false;
                    showError(input, `${name} is required.`);
                }
                else if (isEmail && value !== '' && !validateEmailFormat(value)) {
                    isFormValid = false;
                    showError(input, `Please enter a valid email address.`);
                }
            });

            if (isFormValid) {
                console.log('Form is valid. Simulating submission...');
                formSuccessMessage.textContent = 'Thank you! Your message has been received.';
                formSuccessMessage.style.display = 'block';
                showNotification("Contact form submitted (simulated)!", 3000);
                contactForm.reset();
                setTimeout(() => {
                    formSuccessMessage.style.display = 'none';
                }, 5000);
            } else {
                console.log('Form validation failed.');
                 const firstErrorField = contactForm.querySelector('.input-error');
                 if(firstErrorField) firstErrorField.focus();
            }
        });

        fieldsToValidate.forEach(fieldObj => {
            if (fieldObj.input) {
                 fieldObj.input.addEventListener('input', () => clearError(fieldObj.input));
            }
        });
         function showError(inputElement, message) {
            const formGroup = inputElement.closest('.form-group');
            if (formGroup) {
                const errorElement = formGroup.querySelector('.error-message');
                if (errorElement) errorElement.textContent = message;
                inputElement.classList.add('input-error');
            }
        }
        function clearError(inputElement) {
             const formGroup = inputElement.closest('.form-group');
            if (formGroup) {
                const errorElement = formGroup.querySelector('.error-message');
                if (errorElement) errorElement.textContent = '';
                 inputElement.classList.remove('input-error');
            }
        }
        function clearAllErrors(fields) {
            fields.forEach(fieldObj => { if(fieldObj.input) clearError(fieldObj.input); });
        }
        function validateEmailFormat(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }
    }

    // --- To-Do List Logic with LocalStorage Persistence ---
    const todoInput = document.getElementById('todoInput');
    const addTodoButton = document.getElementById('addTodoButton');
    const todoListUL = document.getElementById('todoList'); // Renamed for clarity
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function renderTodos() {
        if (!todoListUL) return;
        todoListUL.innerHTML = ''; // Clear existing list items
        todos.forEach((todo, index) => {
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

    function handleAddTask() {
        if (!todoInput) return;
        const taskText = todoInput.value.trim();
        if (taskText === '') {
            showNotification('Task cannot be empty!', 2000);
            return;
        }
        todos.push({ text: taskText, completed: false });
        saveTodos();
        renderTodos();
        showNotification(`Task "${taskText.substring(0,20)}..." added to To-Do list!`, 3000);
        todoInput.value = '';
        todoInput.focus();
    }

    if (addTodoButton && todoInput && todoListUL) {
        addTodoButton.addEventListener('click', handleAddTask);
        todoInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); handleAddTask(); }
        });

        todoListUL.addEventListener('click', (event) => {
            const target = event.target;
            const li = target.closest('li');
            if (!li) return;

            const index = parseInt(li.dataset.index);

            if (target.classList.contains('remove-todo-btn') || target.closest('.remove-todo-btn')) {
                const removedTodo = todos.splice(index, 1);
                saveTodos();
                renderTodos();
                showNotification(`Task "${removedTodo[0].text.substring(0,20)}..." removed.`, 2000);
            } else { // Click on li itself (not remove button)
                todos[index].completed = !todos[index].completed;
                saveTodos();
                renderTodos(); // Re-render to apply/remove 'completed' class
                showNotification(`Task status updated.`, 1500);
            }
        });
        renderTodos(); // Initial render on page load
    }

    // --- Footer Current Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Initializations ---
    async function initializePage() {
        await setupCarousel(); // Fetch carousel data first
        await displayRecommendationsFromRecTxt(); // Then fetch user's list
        showNotification("Welcome to Vis Recommendations!", 3000);
    }

    initializePage();

}); // End of DOMContentLoaded
