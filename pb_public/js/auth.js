// auth.js
// Handles the two forms on login.html: "Log in" and "Sign up".

import pb from './pb.js';

// Turn a PocketBase error into a readable message.
// When a form is rejected (status 400), err.response.data lists the problem
// per field, e.g. { email: { message: "Value must be unique." } }.
function errorMessage(err) {
  const fieldErrors = err.response?.data || {};
  const details = Object.entries(fieldErrors).map(
    ([field, problem]) => `${field}: ${problem.message}`
  );
  return details.length > 0 ? details.join(' ') : err.message;
}

// ---- Log in ----
$('#login-form').on('submit', async function (event) {
  // Stop the normal form submit (which would reload the page); JS sends the data instead.
  event.preventDefault();

  try {
    // POST /api/collections/users/auth-with-password
    // On success the SDK stores the token and user record in pb.authStore.
    await pb.collection('users').authWithPassword(
      $('#login-email').val(),
      $('#login-password').val()
    );
    window.location.href = 'index.html';
  } catch (err) {
    $('#login-message').text('Login failed: ' + errorMessage(err));
  }
});

// ---- Sign up ----
$('#signup-form').on('submit', async function (event) {
  event.preventDefault();

  const email = $('#signup-email').val();
  const password = $('#signup-password').val();

  try {
    // Signing up = creating a record in the users (auth) collection.
    // POST /api/collections/users/records
    await pb.collection('users').create({
      name: $('#signup-name').val(),
      email: email,
      password: password,
      passwordConfirm: $('#signup-password-confirm').val(),
      role: 'member', // the users Create rule rejects any other value
    });

    // create() does not log you in, so log in with the same email and password.
    await pb.collection('users').authWithPassword(email, password);
    window.location.href = 'index.html';
  } catch (err) {
    $('#signup-message').text('Sign up failed: ' + errorMessage(err));
  }
});
