// Central Cabinetry v2

// NAV
function toggleMenu(){document.getElementById('navLinks').classList.toggle('open')}
document.addEventListener('click',function(e){
    var nb=document.querySelector('.navbar');
    if(nb&&!nb.contains(e.target))document.getElementById('navLinks').classList.remove('open');
});

// HOME SHOWCASE
async function initShowcase() {
    const track = document.getElementById('home-showcase-track');
    if (!track) return;

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/home_showcase?order=sort_order`, {
            headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
        });
        const rows = await res.json();
        if (rows.length > 0) {
            track.innerHTML = rows.map(r => `
                <div class="showcase-item">
                    <img src="${r.image_url}" alt="${r.label || 'Product Showcase'}" onclick="openLightbox(this.src)">
                    ${r.label ? `<div class="showcase-label">${r.label}</div>` : ''}
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading showcase:', err);
    }
}

// HERO CAROUSEL
var slideIndex=0;
function initHero(){
    var slides=document.querySelectorAll('.hero-slide');
    var dotsEl=document.getElementById('heroDots');
    if(!slides.length)return;
    slides.forEach(function(_,i){
        var d=document.createElement('button');
        d.className='hero-dot'+(i===0?' active':'');
        d.onclick=function(){goToSlide(i)};
        if(dotsEl)dotsEl.appendChild(d);
    });
    setInterval(function(){changeSlide(1)},5000);
}
function changeSlide(dir){
    var slides=document.querySelectorAll('.hero-slide');
    if(!slides.length)return;
    slides[slideIndex].classList.remove('active');
    slideIndex=(slideIndex+dir+slides.length)%slides.length;
    slides[slideIndex].classList.add('active');
    updateDots();
}
function goToSlide(i){
    var slides=document.querySelectorAll('.hero-slide');
    slides[slideIndex].classList.remove('active');
    slideIndex=i;
    slides[slideIndex].classList.add('active');
    updateDots();
}
function updateDots(){
    document.querySelectorAll('.hero-dot').forEach(function(d,i){
        d.classList.toggle('active',i===slideIndex);
    });
}

// MULTISTEP FORM
function nextStep(n){
    document.querySelectorAll('.form-step').forEach(function(s){s.classList.remove('active')});
    document.querySelectorAll('.step').forEach(function(s){s.classList.remove('active')});
    var step=document.getElementById('step'+n);
    var stepBtn=document.getElementById('step'+n+'btn');
    if(step)step.classList.add('active');
    if(stepBtn)stepBtn.classList.add('active');
}

// LIGHTBOX
function openLightbox(src){
    var lb=document.getElementById('lightbox');
    var img=document.getElementById('lightboxImg');
    if(lb&&img){img.src=src;lb.classList.add('open')}
}
function closeLightbox(){
    var lb=document.getElementById('lightbox');
    if(lb)lb.classList.remove('open');
}

// FORMS
function submitContact(e){e.preventDefault();alert('Thank you! We will get back to you shortly.');e.target.reset()}
function submitAppointment(e){e.preventDefault();alert('Appointment confirmed! We will contact you within 24 hours.');e.target.reset();nextStep(1)}

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
        e.preventDefault();
        var t=document.querySelector(this.getAttribute('href'));
        if(t)t.scrollIntoView({behavior:'smooth'});
    });
});



// SEARCH FUNCTIONALITY
function initSearch() {
    const searchInputs = document.querySelectorAll('.header-search input');
    const searchBtns = document.querySelectorAll('.header-search-btn');

    function handleSearch(input) {
        const query = input.value.trim().toLowerCase();
        if (!query) return;
        
        // Simple redirection to search results or a specific page
        // For now, let's redirect to cabinets if searching for cabinets, etc.
        if (query.includes('cabinet') || query.includes('door')) {
            window.location.href = 'door-styles.html?q=' + encodeURIComponent(query);
        } else if (query.includes('floor')) {
            window.location.href = 'flooring.html?q=' + encodeURIComponent(query);
        } else if (query.includes('outdoor') || query.includes('kitchen')) {
            window.location.href = 'outdoor.html?q=' + encodeURIComponent(query);
        } else {
            // Default to door styles for now
            window.location.href = 'door-styles.html?q=' + encodeURIComponent(query);
        }
    }

    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch(this);
        });
    });

    searchBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            handleSearch(searchInputs[index]);
        });
    });
}

window.addEventListener('DOMContentLoaded', function() {
    initHero();
    initSearch();
    // initShowcase();

    // Inner Image Zoom Feature
    const containers = document.querySelectorAll('.image-zoom-container');
    containers.forEach((container) => {
        const img = container.querySelector('img');
        if (!img) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            img.style.transformOrigin = `${x}% ${y}%`;
        });

        container.addEventListener('mouseleave', () => {
            img.style.transformOrigin = 'center center';
        });
    });
});
// your existing main.js code above...
