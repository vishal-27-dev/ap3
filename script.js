document.addEventListener('DOMContentLoaded', function() {

    // --- Mock API Data for Recommendations (Task: Fetch Data from API) ---
    const mockApiData = [
        {
            id: 1,
            title: "3 Idiots",
            posterUrl: "https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UX1000_.jpg",
            rating: 8.4,
            votes: "1.9M",
            year: 2009,
            pgRating: "PG-13",
            genres: "Comedy/Drama"
        },
        {
            id: 2,
            title: "Sacred Games",
            posterUrl: "https://resizing.flixster.com/7mzqzF4P3gPiorR1rSAAwB-EGOY=/206x305/v2/https://resizing.flixster.com/j3Pk-1QBwBZ7_pn6rGObBhi4eoY=/ems.cHJkLWVtcy1hc3NldHMvdHZzZWFzb24vUlRUVjMxNTc1OC53ZWJw",
            rating: 8.5,
            votes: "105k",
            year: 2018,
            pgRating: "TV-MA",
            genres: "Crime/Drama"
        },
        {
            id: 3,
            title: "Mirzapur",
            posterUrl: "https://resizing.flixster.com/nEdw6ADm6SWebo5BEUoO_YD8TTU=/206x305/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p16201104_b_v8_aa.jpg",
            rating: 8.5,
            votes: "90k",
            year: 2018,
            pgRating: "TV-MA",
            genres: "Action/Crime"
        },
        {
            id: 4,
            title: "Lagaan",
            posterUrl: "https://resizing.flixster.com/ISa6F2eD39Tj5r6z9C-_Ok_9NSc=/206x305/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p27923_p_v10_ad.jpg",
            rating: 8.1,
            votes: "198k",
            year: 2001,
            pgRating: "PG",
            genres: "Adventure/Drama"
        },
        {
            id: 5,
            title: "Gangs of Wasseypur",
            posterUrl: "https://m.media-amazon.com/images/M/MV5BMTc5NjY4MjUwNF5BMl5BanBnXkFtZTgwODM3NzM5MzE@._V1_FMjpg_UX1000_.jpg",
            rating: 8.2,
            votes: "105k",
            year: 2012,
            pgRating: "Not Rated",
            genres: "Action/Crime"
        },
        {
            id: 6,
            title: "Paatal Lok",
            posterUrl: "https://resizing.flixster.com/V26CJFvEiM9dU25LLZOrmHuNE10=/206x305/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p18295981_b_v9_ac.jpg",
            rating: 8.5,
            votes: "81k",
            year: 2020,
            pgRating: "TV-MA",
            genres: "Crime/Drama"
        },
        {
            id: 7,
            title: "Special OPS",
            posterUrl: "https://m.media-amazon.com/images/M/MV5BMmMwMGM3ZGQtYTI2ZS00ODA3LWI2NDgtNWRmZTg2Y2YyNTAxXkEyXkFqcGdeQXVyNzkyMTA3MDI@._V1_.jpg",
            rating: 8.6,
            votes: "70k",
            year: 2020,
            pgRating: "TV-14",
            genres: "Action/Thriller"
        }
    ];

    // Function to simulate fetching data from an API
    function fetchRecommendations() {
        return new Promise((resolve) => {
            setTimeout(() => { // Simulate network delay
                resolve(mockApiData);
            }, 1000);
        });
    }

    // Function to display recommendations on the page
    async function displayRecommendations() {
        const container = document.getElementById('recommendationContainer');
        if (!container) return;

        container.innerHTML = '<p class="loading-message">Loading recommendations...</p>'; // Show loading message

        try {
            const recommendations = await fetchRecommendations();
            container.innerHTML = ''; // Clear loading message or old content

            if (recommendations.length === 0) {
                container.innerHTML = '<p class="loading-message">No recommendations found.</p>';
                return;
            }

            recommendations.forEach(item => {
                const card = document.createElement('div');
                card.classList.add('recommendation-card');
                card.innerHTML = `
                    <img src="${item.posterUrl}" alt="${item.title} Poster">
                    <div class="movie-details">
                        <h3>${item.title}</h3>
                        <div class="rating-votes">
                            <span class="rating">⭐ ${item.rating}</span>
                            <span class="votes">(${item.votes} Votes)</span>
                        </div>
                        <p class="metadata">${item.year} | ${item.pgRating} | ${item.genres}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            container.innerHTML = '<p class="loading-message">Failed to load recommendations. Please try again later.</p>';
        }
    }

    // Call function to display recommendations
    displayRecommendations();


    // --- Image Carousel Logic (Task: Build an Image Carousel) ---
    const carouselSlidesContainer = document.querySelector('.carousel-slides');
    const carouselPrevBtn = document.querySelector('.carousel-btn.prev-btn');
    const carouselNextBtn = document.querySelector('.carousel-btn.next-btn');
    const carouselDotsContainer = document.querySelector('.carousel-dots');

    // Use some images from mockApiData for the carousel, or define new ones
    const carouselImages = mockApiData.slice(0, 5).map(item => ({
        src: item.posterUrl,
        alt: `${item.title} Highlight`
    }));
    // Or, for different images:
    // const carouselImages = [
    //     { src: "url_to_image1.jpg", alt: "Highlight 1" },
    //     { src: "url_to_image2.jpg", alt: "Highlight 2" },
    //     // ...
    // ];

    let currentSlide = 0;
    let autoPlayInterval;

    function setupCarousel() {
        if (!carouselSlidesContainer || !carouselImages.length) return;

        // Create slides
        carouselImages.forEach((imgData, index) => {
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');
            slide.innerHTML = `<img src="${imgData.src}" alt="${imgData.alt}">`;
            carouselSlidesContainer.appendChild(slide);

            const dot = document.createElement('span');
            dot.classList.add('carousel-dot');
            dot.setAttribute('data-slide', index);
            dot.addEventListener('click', () => goToSlide(index));
            carouselDotsContainer.appendChild(dot);
        });

        updateCarousel();

        carouselPrevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide > 0) ? currentSlide - 1 : carouselImages.length - 1;
            updateCarousel();
            resetAutoPlay();
        });

        carouselNextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide < carouselImages.length - 1) ? currentSlide + 1 : 0;
            updateCarousel();
            resetAutoPlay();
        });

        startAutoPlay();
    }

    function updateCarousel() {
        carouselSlidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateCarousel();
        resetAutoPlay();
    }

    function startAutoPlay() {
        if(autoPlayInterval) clearInterval(autoPlayInterval); // Clear existing before starting new
        autoPlayInterval = setInterval(() => {
            currentSlide = (currentSlide < carouselImages.length - 1) ? currentSlide + 1 : 0;
            updateCarousel();
        }, 5000); // Change slide every 5 seconds
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    // Initialize carousel
    if(carouselSlidesContainer && carouselPrevBtn && carouselNextBtn && carouselDotsContainer){
        setupCarousel();
    }


    // --- Form Validation Logic ---
    const contactForm = document.getElementById('contactForm');
    const formSuccessMessage = document.getElementById('formSuccessMessage');

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
            fieldObj.input.addEventListener('input', () => clearError(fieldObj.input));
        });
    }

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
        fields.forEach(fieldObj => clearError(fieldObj.input));
    }

    function validateEmailFormat(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }


    // --- To-Do List Logic ---
    const todoInput = document.getElementById('todoInput');
    const addTodoButton = document.getElementById('addTodoButton');
    const todoList = document.getElementById('todoList');

    if (addTodoButton && todoInput && todoList) {
        addTodoButton.addEventListener('click', handleAddTask);
        todoInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                 event.preventDefault();
                handleAddTask();
            }
        });

        todoList.addEventListener('click', function(event) {
            const target = event.target;
             const removeButton = target.closest('.remove-todo-btn');
            if (removeButton) {
                const liToRemove = removeButton.closest('li');
                if (liToRemove) removeTask(liToRemove);
                return;
            }

            const listItem = target.closest('li');
            if (listItem) {
                 if (!target.closest('.remove-todo-btn')) {
                    toggleTaskComplete(listItem);
                 }
            }
        });
    }

    function handleAddTask() {
        const taskText = todoInput.value.trim();
        if (taskText === '') {
            alert('Task cannot be empty!');
            return;
        }
        createTaskElement(taskText);
        todoInput.value = '';
        todoInput.focus();
    }

    function createTaskElement(taskText) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = taskText;
        li.appendChild(span);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.classList.add('remove-todo-btn');
        removeBtn.setAttribute('aria-label', `Remove task: ${taskText}`);
        li.appendChild(removeBtn);
        todoList.appendChild(li);
    }

    function removeTask(taskElement) {
        if (taskElement && taskElement.parentNode === todoList) {
            taskElement.remove();
        }
    }

    function toggleTaskComplete(taskElement) {
        if (taskElement) {
            taskElement.classList.toggle('completed');
            const isCompleted = taskElement.classList.contains('completed');
            taskElement.setAttribute('aria-checked', isCompleted.toString());
        }
    }

}); // End of DOMContentLoaded
