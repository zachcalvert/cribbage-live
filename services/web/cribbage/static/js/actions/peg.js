import { awardPoints } from "./score.js";

export function renderCurrentTurnDisplay(player, action) {
  console.log('Time for ' + player + ' to ' + action);
  $('.panel-heading').css('background', 'rgb(21, 32, 43)');
  $('#' + player).find(".panel-heading").css('background', '#1CA1F2');
  $('#action-button').html(action).prop('disabled', true);
  if (player === sessionStorage.getItem('nickname')) {
    $('#action-button').prop('disabled', false);
  }
}

function moveCardFromHandToPlayArea(card, nickname) {
  let handCard = $('#' + card);

  if (nickname === sessionStorage.getItem('nickname')) {
    handCard.parent().removeClass('selected');
    handCard.parent().addClass('played');
    handCard.animate({"margin-top": "0px"}, 200,"linear");
  } else {
    handCard.addClass('playedOpponentCard');
    handCard.attr("src",'/static/img/cards/' + card);
    $('#' + nickname).find('.play-pile').append(handCard);
  }
}


function updateRunningTotal(new_total) {
  let current = $("#play-total").text();

  $({someValue: current}).animate({someValue: new_total}, {
      duration: 200,
      easing:'swing', // can be anything
      step: function() { // called on every step
          // Update the element's text with rounded-up value:
          $('#play-total').text(Math.round(this.someValue));
      }
  });
}

function animatePlayScore(card, points) {
  console.log('playing card ' + card + ' earned ' + points + ' points');
  if (points > 0) {
    let pointsAlert = $('<div/>', {
      id: 'pointsAlert',
      html: '+' + points
    });
    $("#play-pile").append(pointsAlert);
    $("#pointsAlert").animate({"top": "-=50px"}, 500,"linear",function() {
      $(this).remove();
    });
  }
}

export function peg(msg) {
  moveCardFromHandToPlayArea(msg.card, msg.nickname);
  if (msg.points_scored > 0) {
    animatePlayScore(msg.card, msg.points_scored);
    awardPoints(msg.nickname, msg.points_scored);
  }
  updateRunningTotal(msg.new_total);
}

export function clearPeggingArea() {
  let peggingCards = $('.playedCard');
  $('#play-total').text(0);
  $('#prevous-peg-rounds').append(peggingCards);
  $('#play-pile .playedCard').hide();
}