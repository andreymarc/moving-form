const affiliates = [];

// Navigation
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('step-1-next').addEventListener('click', fetchMovers);
  document.getElementById('step-2-next').addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });
  document.getElementById('step-2-back').addEventListener('click', () => goToStep(1));
  document.getElementById('step-3-next').addEventListener('click', goToStep.bind(null, 4));
  document.getElementById('step-3-back').addEventListener('click', () => goToStep(2));
  document.getElementById('step-4-back').addEventListener('click', () => goToStep(3));
  document.getElementById('submit-form').addEventListener('click', submitForm);
});

function goToStep(step) {
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');
}

// Helper Functions for Validation
function isValidZipCode(zip) {
  return /^\d{5}$/.test(zip);
}

function isValidDate(date) {
  const today = new Date();
  return new Date(date) >= today;
}

function isValidName(name) {
  return /^[a-zA-Z\s\-]+$/.test(name);
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

function displayErrors(containerId, errors) {
  const errorContainer = document.getElementById(containerId);
  errorContainer.innerHTML = errors.map(error => `<p>${error}</p>`).join('');
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

  if (!validateStep1(formData)) return;

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (result.result === 'success') {
      affiliates.push(...result.brands);
      goToStep(2);
    } else {
      displayErrors('step-1-errors', [result.msg, result.reason]);
    }
  } catch (err) {
    displayErrors('step-1-errors', ['Failed to fetch movers.']);
  }
}

async function submitForm() {
  // Form submission logic
  alert('Form Submitted!');
}
