const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/';
const API_KEY = '6d6ddfc6-d9b7-4f06-afe9-f6cd1194c183';

let allCourses = [];
let allTutors = [];
let currentPage = 1;
const itemsPerPage = 5;
let selectedTutor = null;
let selectedCourse = null;

async function fetchFromAPI(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}?api_key=${API_KEY}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`API Error: ${error.message}`, 'danger');
        throw error;
    }
}


const api = {
    getCourses: () => fetchFromAPI('api/courses'),
    getCourse: (id) => fetchFromAPI(`api/courses/${id}`),
    getTutors: () => fetchFromAPI('api/tutors'),
    getTutor: (id) => fetchFromAPI(`api/tutors/${id}`),
    getOrders: () => fetchFromAPI('api/orders'),
    getOrder: (id) => fetchFromAPI(`api/orders/${id}`),
    createOrder: (data) => fetchFromAPI('api/orders', 'POST', data),
    updateOrder: (id, data) => fetchFromAPI(`api/orders/${id}`, 'PUT', data),
    deleteOrder: (id) => fetchFromAPI(`api/orders/${id}`, 'DELETE')
};

function showNotification(message, type = 'info') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    area.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function getLevelBadge(level) {
    const colors = {
        'Beginner': 'bg-success',
        'Intermediate': 'bg-warning',
        'Advanced': 'bg-danger'
    };
    const color = colors[level] || 'bg-secondary';
    return `<span class="badge ${color} badge-level">${level}</span>`;
}

async function loadCourses() {
    try {
        document.getElementById('courses-loading').classList.remove('d-none');
        
        allCourses = await api.getCourses();
        displayCourses(allCourses);
        setupCoursesPagination(allCourses);
        
        document.getElementById('courses-loading').classList.add('d-none');
        
    } catch (error) {
        document.getElementById('courses-loading').classList.add('d-none');
        document.getElementById('courses-list').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error loading courses. Please try again later.</p>
            </div>
        `;
    }
}

async function loadTutors() {
    try {
        document.getElementById('tutors-loading').classList.remove('d-none');
        
        allTutors = await api.getTutors();
        displayTutors(allTutors);
        populateLanguageFilter(allTutors);
        
        document.getElementById('tutors-loading').classList.add('d-none');
        
    } catch (error) {
        document.getElementById('tutors-loading').classList.add('d-none');
        document.getElementById('tutors-list').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error loading tutors. Please try again later.</p>
            </div>
        `;
    }
}

function displayCourses(courses) {
    const container = document.getElementById('courses-list');
    if (!container) return;
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No courses found.</p>
            </div>
        `;
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCourses = courses.slice(start, end);
    
    container.innerHTML = pageCourses.map(course => `
        <div class="col-md-4">
            <div class="card course-card shadow-sm h-100">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text">
                        ${getLevelBadge(course.level)}
                        <span class="ms-2"><i class="bi bi-person"></i> ${course.teacher}</span>
                    </p>
                    <p class="card-text text-muted small">
                        ${course.description.substring(0, 100)}...
                    </p>
                    <div class="mt-3">
                        <p class="mb-1">
                            <i class="bi bi-clock"></i> ${course.total_length} weeks
                            <span class="ms-3">
                                <i class="bi bi-cash"></i> ${course.course_fee_per_hour}₽/hour
                            </span>
                        </p>
                        <p class="mb-1">
                            <i class="bi bi-calendar"></i> 
                            ${course.start_dates.length} available dates
                        </p>
                    </div>
                    <div class="mt-4">
                        <button class="btn btn-primary w-100" onclick="selectCourse(${course.id})">
                            <i class="bi bi-cart-plus me-1"></i> Apply Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayTutors(tutors) {
    const container = document.getElementById('tutors-list');
    if (!container) return;
    
    if (tutors.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No tutors found.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tutors.map(tutor => `
        <div class="col-md-6 col-lg-4">
            <div class="card course-card shadow-sm h-100 ${selectedTutor === tutor.id ? 'selected-tutor' : ''}" 
                 id="tutor-${tutor.id}">
                <div class="card-body">
                    <div class="d-flex align-items-start mb-3">
                        <div class="flex-shrink-0">
                            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                                 style="width: 60px; height: 60px;">
                                <i class="bi bi-person-fill text-primary" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h5 class="card-title mb-1">${tutor.name}</h5>
                            <p class="card-text text-muted small mb-0">
                                <i class="bi bi-star-fill text-warning"></i> ${tutor.work_experience} years experience
                            </p>
                        </div>
                    </div>
                    
                    <p class="card-text">
                        <strong>Languages:</strong><br>
                        ${tutor.languages_offered.map(lang => 
                            `<span class="badge bg-light text-dark me-1 mb-1">${lang}</span>`
                        ).join('')}
                    </p>
                    
                    <p class="card-text">
                        <strong>Level:</strong> ${getLevelBadge(tutor.language_level)}
                    </p>
                    
                    <p class="card-text">
                        <strong>Hourly Rate:</strong> 
                        <span class="fw-bold text-primary">${tutor.price_per_hour} ₽/hour</span>
                    </p>
                    
                    <div class="mt-4">
                        <button class="btn ${selectedTutor === tutor.id ? 'btn-success' : 'btn-outline-primary'} w-100" 
                                onclick="selectTutor(${tutor.id})">
                            ${selectedTutor === tutor.id ? 
                                '<i class="bi bi-check-circle me-1"></i> Selected' : 
                                '<i class="bi bi-check me-1"></i> Select'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupCoursesPagination(courses) {
    const pagination = document.getElementById('courses-pagination');
    const paginationList = document.getElementById('courses-pagination-list');
    
    if (!pagination || !paginationList) return;
    
    const totalPages = Math.ceil(courses.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.classList.add('d-none');
        return;
    }
    
    pagination.classList.remove('d-none');
    paginationList.innerHTML = '';
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    paginationList.appendChild(prevLi);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        paginationList.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    paginationList.appendChild(nextLi);
}

function changePage(page) {
    const totalPages = Math.ceil(allCourses.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayCourses(allCourses);
    setupCoursesPagination(allCourses);
}

function searchCourses() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const levelFilter = document.getElementById('level-filter').value;
    
    let filtered = allCourses;
    
    if (searchTerm) {
        filtered = filtered.filter(course => 
            course.name.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm) ||
            course.teacher.toLowerCase().includes(searchTerm)
        );
    }
    
    if (levelFilter) {
        filtered = filtered.filter(course => course.level === levelFilter);
    }
    
    currentPage = 1;
    displayCourses(filtered);
    setupCoursesPagination(filtered);
}

function populateLanguageFilter(tutors) {
    const select = document.getElementById('tutor-language');
    if (!select) return;
    const languages = new Set();
    tutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });
    const sortedLanguages = Array.from(languages).sort();
    select.innerHTML = '<option value="">All Languages</option>';
    sortedLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        select.appendChild(option);
    });
}

function filterTutors() {
    const language = document.getElementById('tutor-language').value;
    const level = document.getElementById('tutor-level').value;
    
    let filtered = allTutors;
    
    if (language) {
        filtered = filtered.filter(tutor => 
            tutor.languages_offered.includes(language)
        );
    }
    
    if (level) {
        filtered = filtered.filter(tutor => tutor.language_level === level);
    }
    
    displayTutors(filtered);
}

async function selectCourse(courseId) {
    try {
        selectedCourse = await api.getCourse(courseId);
        selectedTutor = null;
        document.querySelectorAll('.course-card').forEach(card => {
            card.classList.remove('selected-tutor');
        });
        
        openOrderModal('course');
        
    } catch (error) {
        showNotification('Error loading course details', 'danger');
    }
}

async function selectTutor(tutorId) {
    try {
        selectedTutor = await api.getTutor(tutorId);
        selectedCourse = null;
        document.querySelectorAll('.course-card').forEach(card => {
            card.classList.remove('selected-tutor');
        });
        
        const tutorCard = document.getElementById(`tutor-${tutorId}`);
        if (tutorCard) {
            tutorCard.classList.add('selected-tutor');
        }
        
        openOrderModal('tutor');
        
    } catch (error) {
        showNotification('Error loading tutor details', 'danger');
    }
}
function openOrderModal(type = null) {
    if (!selectedCourse && !selectedTutor) {
        showNotification('Please select a course or tutor first', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    const item = selectedCourse || selectedTutor;
    document.getElementById('selected-type').value = selectedCourse ? 'course' : 'tutor';
    document.getElementById('selected-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('instructor-name').value = item.teacher || item.name;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').min = today;
    document.getElementById('start-date').value = '';
    document.getElementById('start-time').innerHTML = '<option value="">Select date first</option>';
    document.getElementById('start-time').disabled = true;
    ['early-registration', 'group-enrollment', 'supplementary', 'intensive-course', 
     'interactive', 'assessment', 'excursions', 'personalized'].forEach(id => {
        document.getElementById(id).checked = false;
    });
    document.getElementById('duration').value = selectedCourse ? 
        selectedCourse.total_length * selectedCourse.week_length : 10;
    document.getElementById('students-number').value = 1;
    document.getElementById('total-cost').textContent = '0 ₽';
    document.getElementById('cost-breakdown').textContent = '';
    
    modal.show();
}
function calculateCost() {
    if (!selectedCourse && !selectedTutor) return;
    const item = selectedCourse || selectedTutor;
    const isCourse = !!selectedCourse;
    const startDate = document.getElementById('start-date').value;
    const startTime = document.getElementById('start-time').value;
    const duration = parseInt(document.getElementById('duration').value) || 10;
    const persons = parseInt(document.getElementById('students-number').value) || 1;
    
    if (!startDate || !startTime) {
        document.getElementById('total-cost').textContent = '0 ₽';
        document.getElementById('cost-breakdown').textContent = 'Please select date and time';
        return;
    }

    const baseRate = isCourse ? 
        selectedCourse.course_fee_per_hour : 
        selectedTutor.price_per_hour;

    let total = baseRate * duration;

    const dateObj = new Date(startDate);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    total *= isWeekend ? 1.5 : 1;

    const hour = parseInt(startTime.split(':')[0]);
    let timeSurcharge = 0;

    if (hour >= 9 && hour < 12) {
        timeSurcharge += 400;
    }

    if (hour >= 18 && hour < 20) {
        timeSurcharge += 1000;
    }
    
    total += timeSurcharge;

    total *= persons;

    let discount = 0;
    let discountReason = '';
    
    if (document.getElementById('early-registration').checked) {
        discount += 0.1;
        discountReason += 'Early registration (-10%)';
    }
    
    if (document.getElementById('group-enrollment').checked && persons >= 5) {
        discount += 0.15;
        discountReason += discountReason ? ', Group enrollment (-15%)' : 'Group enrollment (-15%)';
    }
    
    total *= (1 - discount);

    let surcharge = 0;
    let surchargeReason = '';
    
    if (document.getElementById('intensive-course').checked && duration >= 5) {
        total *= 1.2;
        surchargeReason += 'Intensive course (+20%)';
    }
    
    if (document.getElementById('supplementary').checked) {
        total += 2000 * persons;
        surchargeReason += surchargeReason ? ', Supplementary materials (+2000₽)' : 'Supplementary materials (+2000₽)';
    }
    
    if (document.getElementById('personalized').checked) {
        const weeks = Math.ceil(duration / 10);
        total += 1500 * weeks;
        surchargeReason += surchargeReason ? ', Personalized sessions (+1500₽/week)' : 'Personalized sessions (+1500₽/week)';
    }
    
    if (document.getElementById('excursions').checked) {
        total *= 1.25;
        surchargeReason += surchargeReason ? ', Cultural excursions (+25%)' : 'Cultural excursions (+25%)';
    }
    
    if (document.getElementById('assessment').checked) {
        total += 300;
        surchargeReason += surchargeReason ? ', Assessment (+300₽)' : 'Assessment (+300₽)';
    }
    
    if (document.getElementById('interactive').checked) {
        total *= 1.5;
        surchargeReason += surchargeReason ? ', Interactive platform (+50%)' : 'Interactive platform (+50%)';
    }

    total = Math.round(total);

    document.getElementById('total-cost').textContent = `${total} ₽`;

    let breakdown = `Base: ${baseRate}₽/hour × ${duration} hours`;
    if (isWeekend) breakdown += ' × 1.5 (weekend)';
    if (timeSurcharge > 0) breakdown += ` + ${timeSurcharge}₽ (time surcharge)`;
    if (persons > 1) breakdown += ` × ${persons} persons`;
    if (discount > 0) breakdown += ` - ${Math.round(discount * 100)}% discount`;
    if (surchargeReason) breakdown += ` + ${surchargeReason}`;
    
    document.getElementById('cost-breakdown').textContent = breakdown;
    
    return total;
}

function updateAvailableTimes() {
    const dateSelect = document.getElementById('start-date');
    const timeSelect = document.getElementById('start-time');
    
    if (!dateSelect.value) {
        timeSelect.innerHTML = '<option value="">Select date first</option>';
        timeSelect.disabled = true;
        return;
    }

    
    const times = [
        { start: '09:00', end: '11:00' },
        { start: '12:00', end: '14:00' },
        { start: '17:00', end: '19:00' },
        { start: '19:00', end: '21:00' }
    ];
    
    timeSelect.innerHTML = times.map(time => 
        `<option value="${time.start}">${time.start} - ${time.end}</option>`
    ).join('');
    
    timeSelect.disabled = false;

    calculateCost();
}

async function submitOrder() {
    try {

        const startDate = document.getElementById('start-date').value;
        const startTime = document.getElementById('start-time').value;
        const duration = document.getElementById('duration').value;
        const persons = document.getElementById('students-number').value;
        
        if (!startDate || !startTime) {
            showNotification('Please select date and time', 'warning');
            return;
        }
        
        if (persons < 1 || persons > 20) {
            showNotification('Number of students must be between 1 and 20', 'warning');
            return;
        }
        
        const orderData = {
            date_start: startDate,
            time_start: startTime,
            duration: parseInt(duration),
            persons: parseInt(persons),
            price: parseInt(document.getElementById('total-cost').textContent),
            early_registration: document.getElementById('early-registration').checked,
            group_enrollment: document.getElementById('group-enrollment').checked,
            intensive_course: document.getElementById('intensive-course').checked,
            supplementary: document.getElementById('supplementary').checked,
            personalized: document.getElementById('personalized').checked,
            excursions: document.getElementById('excursions').checked,
            assessment: document.getElementById('assessment').checked,
            interactive: document.getElementById('interactive').checked
        };
        const type = document.getElementById('selected-type').value;
        const id = document.getElementById('selected-id').value;
        
        if (type === 'course') {
            orderData.course_id = parseInt(id);
            orderData.tutor_id = 0;
        } else {
            orderData.tutor_id = parseInt(id);
            orderData.course_id = 0;
        }
        
        showNotification('Creating order...', 'info');
        
        const result = await api.createOrder(orderData);
        
        if (result.id) {
            showNotification('Order created successfully!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            modal.hide();
            document.getElementById('order-form').reset();
            document.getElementById('total-cost').textContent = '0 ₽';
            selectedCourse = null;
            selectedTutor = null;
            document.querySelectorAll('.selected-tutor').forEach(card => {
                card.classList.remove('selected-tutor');
            });
            
        } else {
            showNotification('Error creating order', 'danger');
        }
        
    } catch (error) {
        showNotification('Error creating order: ' + error.message, 'danger');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('courses-list')) {
        loadCourses();
        loadTutors();
    }
    if (document.getElementById('start-date')) {
        document.getElementById('start-date').addEventListener('change', updateAvailableTimes);
    }
    
    if (document.getElementById('start-time')) {
        document.getElementById('start-time').addEventListener('change', calculateCost);
    }
    
    if (document.getElementById('duration')) {
        document.getElementById('duration').addEventListener('input', calculateCost);
    }
    
    if (document.getElementById('students-number')) {
        document.getElementById('students-number').addEventListener('input', calculateCost);
    }

    if (document.getElementById('start-date')) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('start-date').min = today;
    }
    if (API_KEY === '6d6ddfc6-d9b7-4f06-afe9-f6cd1194c183') {
        showNotification('Please set your API key in app.js', 'warning');
    }
});

window.api = api;
window.selectCourse = selectCourse;
window.selectTutor = selectTutor;
window.openOrderModal = openOrderModal;
window.searchCourses = searchCourses;
window.filterTutors = filterTutors;
window.changePage = changePage;
window.calculateCost = calculateCost;
window.submitOrder = submitOrder;
window.updateAvailableTimes = updateAvailableTimes;