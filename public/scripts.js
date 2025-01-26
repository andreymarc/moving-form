const affiliates = [];
console.log('Scripts loaded');

// Native date input initialization function
function initializeDateInput() {
  const moveDateInput = document.getElementById('move_date');
  if (moveDateInput) {
    moveDateInput.type = 'text'; // Change to text input
    moveDateInput.readOnly = true; // Prevent keyboard input
    const today = new Date().toISOString().split('T')[0];
    
    // Create a hidden date input
    const hiddenDateInput = document.createElement('input');
    hiddenDateInput.type = 'date';
    hiddenDateInput.id = 'hidden_move_date';
    hiddenDateInput.style.display = 'none';
    hiddenDateInput.min = today;
    moveDateInput.parentNode.insertBefore(hiddenDateInput, moveDateInput.nextSibling);

    // Open calendar on click
    moveDateInput.addEventListener('click', () => {
      hiddenDateInput.showPicker();
    });

    // Update text input when date is selected
    hiddenDateInput.addEventListener('change', () => {
      const selectedDate = new Date(hiddenDateInput.value);
      moveDateInput.value = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    console.log('Date input initialized successfully');
  } else {
    console.error('Move date input not found');
  }
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  initializeDateInput();

  const step1NextButton = document.getElementById('step-1-next');
  if (step1NextButton) {
    step1NextButton.addEventListener('click', () => {
      console.log('Step 1 Next button clicked');
      fetchMovers();
    });
  } else {
    console.error('Step 1 Next button not found');
  }
  document.getElementById('step-2-next').addEventListener('click', () => {
    console.log('Step 2 Next button clicked');
    if (validateStep2()) goToStep(3);
  });
  document.getElementById('step-2-back').addEventListener('click', () => {
    console.log('Step 2 Back button clicked');
    goToStep(1);
  });
  document.getElementById('step-3-next').addEventListener('click', () => {
    console.log('Step 3 Next button clicked');
    goToStep(4);
  });
  document.getElementById('step-3-back').addEventListener('click', () => {
    console.log('Step 3 Back button clicked');
    goToStep(2);
  });
  document.getElementById('step-4-back').addEventListener('click', () => {
    console.log('Step 4 Back button clicked');
    goToStep(3);
  });
  document.getElementById('submit-form').addEventListener('click', submitForm);
});

// Helper Functions for Navigation
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

// Helper Functions for Validation
function isValidZipCode(zip) {
  return /^\d{5}$/.test(zip); // Ensure ZIP code is exactly 5 digits
}

function isValidDate(date) {
  const hiddenDateInput = document.getElementById('hidden_move_date');
  const selectedDate = new Date(hiddenDateInput.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  return selectedDate >= today;
}

function isValidName(name) {
  return /^[a-zA-Z\s\-]+$/.test(name); // Allows letters, spaces, and hyphens
}

// Step 1 Validation
function validateStep1(formData) {
  const errors = [];
  if (!isValidZipCode(formData.zip_code)) errors.push('Invalid ZIP Code.');
  if (!isValidZipCode(formData.move_to_zip_code)) errors.push('Invalid destination ZIP Code.');
  if (!formData.move_to_state) errors.push('State is required.');
  if (!isValidDate(formData.move_date)) errors.push('Move date must be in the future.');

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

  if (!isValidName(firstName)) errors.push('First name should only contain letters, spaces, or hyphens.');
  if (!isValidName(lastName)) errors.push('Last name should only contain letters, spaces, or hyphens.');

  if (errors.length > 0) {
    displayErrors('step-2-errors', errors);
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
    move_date: document.getElementById('hidden_move_date').value.trim(), // Use hidden input
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

    if (result.results === 'success' && result.brands) {
      // Populate affiliates
      affiliates.length = 0; // Clear existing affiliates
      affiliates.push(...result.brands);
      console.log('Fetched Affiliates:', affiliates);

      // Proceed to Step 2
      goToStep(2);
    } else {
      // Display API error message and reason
      displayErrors('step-1-errors', [result.msg, result.reason]);
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

  // Limit the number of affiliates displayed 
  const limitedAffiliates = affiliates.slice(0, 4);

  if (limitedAffiliates.length > 0) {
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
    affiliateListElement.innerHTML = '<li>No affiliates available.</li>';
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
    move_date: document.getElementById('hidden_move_date').value.trim(), // Use hidden input
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