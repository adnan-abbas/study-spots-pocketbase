// nav.js
// Runs on every page. Fills the #auth-nav spot in the header with either
// a "Log in" link or "Hi, <name> (role)" plus a "Log out" button.

import pb from './pb.js';

function renderAuthNav() {
  const $slot = $('#auth-nav');
  $slot.empty();

  // pb.authStore is the SDK's memory of who is logged in. It is saved in the
  // browser's localStorage, so it survives page reloads and new tabs.
  // isValid only checks that a token exists and hasn't expired.
  if (pb.authStore.isValid) {
    // record = the user's row from the users collection, saved at login time
    const user = pb.authStore.record;
    $('<span class="greeting"></span>')
      .text(`Hi, ${user.name || user.email} (${user.role})`)
      .appendTo($slot);
    $('<button type="button" id="logout-btn">Log out</button>').appendTo($slot);
  } else {
    $('<a href="login.html">Log in / Sign up</a>').appendTo($slot);
  }
}

// The button is created by JS, so we listen on document (event delegation)
// instead of on the button itself.
// Logging out just forgets the token in this browser; no request is sent.
$(document).on('click', '#logout-btn', function () {
  pb.authStore.clear();
});

// Re-draw the nav whenever someone logs in or out (also from another tab).
// The `true` means "also run it once right now", which draws the nav on page load.
pb.authStore.onChange(renderAuthNav, true);
