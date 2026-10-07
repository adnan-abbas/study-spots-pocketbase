// list.js
// Loads spots from the "spots" collection and shows each one as a card.
// Module scripts run after the HTML is parsed, so the elements below already exist.

import pb from './pb.js';

// Build the card markup for one spot record.
// We use .text() (never .html()) for anything a user typed, so that
// content like "<script>" is displayed as text instead of run as code.
function renderSpot(spot) {
  const $card = $('<article class="spot-card"></article>');

  $('<h3></h3>').text(spot.title).appendTo($card);

  // category is optional, so only show it when it has a value
  if (spot.category) {
    $('<p class="spot-category"></p>').text(spot.category).appendTo($card);
  }

  $('<p></p>').text(spot.description).appendTo($card);

  return $card;
}

async function loadSpots() {
  const $list = $('#spot-list');
  const $status = $('#status');

  try {
    // GET /api/collections/spots/records?page=1&perPage=20&sort=-created
    // "-created" means newest first. The collection's List rule decides
    // which records (if any) come back.
    const result = await pb.collection('spots').getList(1, 20, {
      sort: '-created',
    });

    if (result.items.length === 0) {
      $status.text('No study spots yet.');
      return;
    }

    $status.text(`Showing ${result.items.length} of ${result.totalItems} spots.`);
    result.items.forEach(function (spot) {
      $list.append(renderSpot(spot));
    });
  } catch (err) {
    // The SDK throws a ClientResponseError. status 0 means no response at all.
    console.error(err);
    if (err.status === 0) {
      $status.text('Cannot reach the server. Is ./pocketbase serve running?');
    } else {
      $status.text(`Could not load spots (error ${err.status}: ${err.message}).`);
    }
  }
}

loadSpots();
