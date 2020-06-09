import {renderCurrentTurnDisplay} from "./peg.js";

function renderDealerIcon(dealer) {
  $("#" + dealer).find(".player-nickname").prepend('<span class="dealer-icon fas fa-star"></span>');
}

function renderDeck() {
  let deckImage = $('<img/>', {
    id: 'deck',
    src: '/static/img/cards/facedown.png'
  });
  $('#deck-area').append(deckImage);
}

export function start(dealer) {
  renderCurrentTurnDisplay(dealer, 'DEAL');
  renderDealerIcon(dealer);
  renderDeck();
}