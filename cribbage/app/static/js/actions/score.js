import { renderCurrentCrib } from "./start.js";

export function displayScoredHand(player) {
  let playerCardsArea = $('#' + player + '-cards');
  let playerCards = $(playerCardsArea).children();
  $.each(playerCards, function(index, playerCard) {
    $(playerCard).removeClass('played').addClass('scored');
    playerCardsArea.append(playerCard);
  });
}

export function awardPoints(player, amount, reason) {
  let winningScore = sessionStorage.getItem('ws');
  let playerPoints = $("#scoreboard-" + player + "-points");
  $(playerPoints).animate({color: '#7FFF00'}, 500);
  $(playerPoints).animate({color: 'white)'}, 1000);

  let current = parseInt(playerPoints.text());
  $({someValue: current}).animate({someValue: current + amount}, {
    duration: 200,
    easing:'swing',
    step: function() {
      $(playerPoints).text(Math.round(this.someValue));
    }
  });

  let totalPoints = current + amount;
  let width = (totalPoints / winningScore * 100) + '%';
  $('#' + player + '-player-progress-bar').css('width', width).text(totalPoints);
}

export function revealCrib(crib, dealer) {
  $('.card').remove();

  $.each(crib, function(index, cardId) {
    let card = $('<img/>', {
      class: 'crib-card',
      src: '/static/img/cards/' + cardId
    });
    $('#' + dealer + "-cards").append(card);
  });
}

export function clearTable(next_dealer) {
  $('.crib-card').remove();
  $('.cut-card').remove();
  $('#deck').show();
  $('#play-total').text('');
  renderCurrentCrib(next_dealer);
}