const affiliates = [];
console.log('Scripts loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');
  initializeDateInput();
  setupEventListeners();
});

// Native date input initialization function
function initializeDateInput() {
  const moveDateInput = document.getElementById('move_date');
  if (moveDateInput) {
    const today = new Date().toISOString().split('T')[0];
    moveDateInput.min = today;
  } else {
    console.log('Move date input not found');
  }
}

function setupEventListeners() {
  document.getElementById('step-1-next').addEventListener('click', () => fetchMovers());
  document.getElementById('step-2-next').addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });
  document.getElementById('step-2-back').addEventListener('click', () => goToStep(1));
  document.getElementById('step-3-next').addEventListener('click', () => {
    if (validateStep3()) goToStep(4);
  });
  document.getElementById('step-3-back').addEventListener('click', () => goToStep(2));
  document.getElementById('step-4-back').addEventListener('click', () => goToStep(3));
  document.getElementById('submit-form').addEventListener('click', submitForm);
}

function goToStep(step) {
  console.log(`Attempting to go to step ${step}`);
  document.querySelectorAll('.form-section').forEach((section) => {
    section.classList.remove('active');
    console.log(`Removed 'active' class from ${section.id}`);
  });
  const targetStep = document.getElementById(`step-${step}`);
  if (targetStep) {
    targetStep.classList.add('active');
    console.log(`Added 'active' class to step-${step}`);
    if (step === 4) {
      populateAffiliates();
    }
  } else {
    console.error(`Target step (step-${step}) not found`);
  }
}

// Validation helper functions
function isValidZipCode(zipCode) {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
}

function isValidDate(dateString) {
  const selectedDate = new Date(dateString);
  const today = new Date();
  return selectedDate > today;
}

function isValidName(name) {
  return /^[a-zA-Z\s-]+$/.test(name);
}

function isValidPhoneNumber(phoneNumber) {
  return /^\d{10}$/.test(phoneNumber.replace(/\D/g, ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Step 1 Validation
function validateStep1(formData) {
  const errors = [];
  if (!isValidZipCode(formData.zip_code)) errors.push('Invalid ZIP Code.');
  if (!isValidZipCode(formData.move_to_zip_code)) errors.push('Invalid destination ZIP Code.');
  if (!formData.move_to_state) errors.push('State is required.');
  if (!isValidDate(formData.move_date)) errors.push('Move date must be in the future.');
  if (!formData.moving_size) errors.push('Moving size is required.');

  if (errors.length > 0) {
    displayErrors('step-1-errors', errors);
    return false;
  }
  return true;
}

// Step 2 Validation
function validateStep2() {
  const firstName = document.getElementById('first_name').value.trim();
  const lastName = document.getElementById('last_name').value.trim();
  const errors = [];

  if (!firstName) errors.push('First name is required.');
  else if (!isValidName(firstName)) errors.push('First name should only contain letters, spaces, or hyphens.');
  
  if (!lastName) errors.push('Last name is required.');
  else if (!isValidName(lastName)) errors.push('Last name should only contain letters, spaces, or hyphens.');

  if (errors.length > 0) {
    displayErrors('step-2-errors', errors);
    return false;
  }
  return true;
}

// Step 3 Validation
function validateStep3() {
  const phoneNumber = document.getElementById('phone_number').value.trim();
  const emailAddress = document.getElementById('email_address').value.trim();
  const errors = [];

  if (!phoneNumber) errors.push('Phone number is required.');
  else if (!isValidPhoneNumber(phoneNumber)) errors.push('Please enter a valid phone number.');

  if (!emailAddress) errors.push('Email address is required.');
  else if (!isValidEmail(emailAddress)) errors.push('Please enter a valid email address.');

  if (errors.length > 0) {
    displayErrors('step-3-errors', errors);
    return false;
  }
  return true;
}

// Display Errors
function displayErrors(containerId, messages) {
  const errorContainer = document.getElementById(containerId);
  if (!errorContainer) return;

  // Clear previous errors
  errorContainer.innerHTML = '';

  // Append new error messages
  messages.forEach((message) => {
    if (message) {
      const errorElement = document.createElement('p');
      errorElement.textContent = message;
      errorElement.style.color = 'red'; // Optional: style for visibility
      errorContainer.appendChild(errorElement);
    }
  });
}

// Fetch Movers
async function fetchMovers() {
  console.log('fetchMovers function called');
  const formData = {
    zip_code: document.getElementById('zip_code').value.trim(),
    move_to_zip_code: document.getElementById('move_to_zip_code').value.trim(),
    move_to_state: document.getElementById('move_to_state').value.trim(),
    move_date: document.getElementById('move_date').value.trim(),
    moving_size: document.getElementById('moving_size').value.trim(),
  };

  console.log('Form data:', formData);

  // Validate Step 1 Inputs
  if (!validateStep1(formData)) {
    console.log('Step 1 validation failed');
    return;
  }

  // Clear previous errors
  displayErrors('step-1-errors', []);

  try {
    console.log('Sending request to /proxy');
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    // Log response for debugging
    console.log('API Response:', result);

    if (result.results === 'success') {
      // If brands are available, populate them
      if (result.brands) {
        affiliates.length = 0; // Clear existing affiliates
        affiliates.push(...result.brands);
        console.log('Fetched Affiliates:', affiliates);
      } else {
        console.log('No brands data received from API');
      }

      // Proceed to Step 2 regardless of brands data
      goToStep(2);
    } else {
      // Display API error message and reason
      displayErrors('step-1-errors', [result.msg || 'Unknown error occurred', result.reason || '']);
    }
  } catch (err) {
    console.error('Error fetching movers:', err);
    displayErrors('step-1-errors', ['Failed to fetch movers.']);
  }
}

// Populate Affiliates (Step 4)
function populateAffiliates() {
  const affiliateListElement = document.getElementById('affiliates');
  affiliateListElement.innerHTML = ''; // Clear previous content

  if (affiliates && affiliates.length > 0) {
    // Limit the number of affiliates displayed 
    const limitedAffiliates = affiliates.slice(0, 4);

    limitedAffiliates.forEach((affiliate) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div>
          <label>
            <input type="checkbox" name="affiliate" value="${affiliate.lp_brand_id}" checked>
            <strong>${affiliate.name}</strong>
          </label>
          ${
            affiliate.logo_url
              ? `<img src="${affiliate.logo_url}" alt="${affiliate.name}" style="width: 50px; margin-left: 10px;">`
              : ''
          }
          <p style="margin-top: 5px; font-size: 0.9rem;">${affiliate.tcpa}</p>
        </div>
      `;
      affiliateListElement.appendChild(listItem);
    });
  } else {
    // If affiliates are not available, hide or remove the affiliates section
    const affiliatesSection = document.getElementById('affiliate-list');
    if (affiliatesSection) {
      affiliatesSection.style.display = 'none';
    }
  }
}

// Submit the Form
async function submitForm() {
  // Clear previous errors
  displayErrors('step-4-errors', []);

  const selectedAffiliates = Array.from(document.querySelectorAll('input[name="affiliate"]:checked'))
    .map((checkbox) => checkbox.value);

  if (selectedAffiliates.length === 0) {
    displayErrors('step-4-errors', ['Please select at least one affiliate to proceed.']);
    return;
  }

  const disclaimerAccepted = document.getElementById('disclaimer').checked;
  if (!disclaimerAccepted) {
    displayErrors('step-4-errors', ['You must accept the terms of service and consent to be contacted to continue.']);
    return;
  }

  const data = {
    zip_code: document.getElementById('zip_code').value.trim(),
    move_to_zip_code: document.getElementById('move_to_zip_code').value.trim(),
    move_to_state: document.getElementById('move_to_state').value.trim(),
    move_date: document.getElementById('move_date').value.trim(),
    moving_size: document.getElementById('moving_size').value.trim(),
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    phone_number: document.getElementById('phone_number').value.trim(),
    email_address: document.getElementById('email_address').value.trim(),
    selected_affiliates: selectedAffiliates,
  };

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit form');
    }

    const result = await response.json();
    console.log(result);

    // Redirect to thank you page
    window.location.href = '/thank-you.html';
    
  } catch (error) {
    console.error('Error:', error);
    displayErrors('step-4-errors', ['An error occurred while submitting the form. Please try again.']);
  }
}