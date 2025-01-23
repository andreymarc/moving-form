const affiliates = [];

// Navigation
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('step-1-next').addEventListener('click', fetchMovers);
  document.getElementById('step-2-next').addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });
  document.getElementById('step-2-back').addEventListener('click', () => goToStep(1));
  document.getElementById('step-3-next').addEventListener('click', () => goToStep(4));
  document.getElementById('step-3-back').addEventListener('click', () => goToStep(2));
  document.getElementById('step-4-back').addEventListener('click', () => goToStep(3));
  document.getElementById('submit-form').addEventListener('click', submitForm);
});

// Helper Functions for Navigation
function goToStep(step) {
  document.querySelectorAll('.form-section').forEach((section) =>
    section.classList.remove('active')
  );
  const targetStep = document.getElementById(`step-${step}`);
  if (targetStep) {
    targetStep.classList.add('active');
    if (step === 4) {
      populateAffiliates(); // Populate affiliates on Step 4
    }
  }
}

// Helper Functions for Validation
function isValidZipCode(zip) {
  return /^\d{5}$/.test(zip); // Ensure ZIP code is exactly 5 digits
}

function isValidDate(date) {
  const today = new Date();
  return new Date(date) >= today; // Ensure the date is today or in the future
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
  const formData = {
    zip_code: document.getElementById('zip_code').value.trim(),
    move_to_zip_code: document.getElementById('move_to_zip_code').value.trim(),
    move_to_state: document.getElementById('move_to_state').value.trim(),
    move_date: document.getElementById('move_date').value.trim(),
    moving_size: document.getElementById('moving_size').value.trim(),
  };

  // Validate Step 1 Inputs
  if (!validateStep1(formData)) return;

  // Clear previous errors
  displayErrors('step-1-errors', []);

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    // Log response for debugging
    console.log('API Response:', result);

    if (result.result === 'success' && result.brands) {
      // Populate affiliates
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

const limitedAffiliates = affiliates.slice(0,4);

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
  const selectedAffiliates = Array.from(document.querySelectorAll('input[name="affiliate"]:checked'))
    .map((checkbox) => checkbox.value);

  if (selectedAffiliates.length === 0) {
    alert('Please select at least one affiliate to proceed.');
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

//   if (!document.getElementById('terms').checked) {
//     alert('You must agree to the terms of service to continue.');
//     return;
//   }

  const disclaimerAccepted = document.getElementById('disclaimer').checked;
  if (!disclaimerAccepted) {
    alert('You must accept the terms of service and consent to be contacted to continue.');
    return;
  }
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
    //alert('Form submitted successfully!');
    console.log(result);

    // Redirect to thank you page
    window.location.href = '/thank-you.html';
    
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while submitting the form.');
  }
}
