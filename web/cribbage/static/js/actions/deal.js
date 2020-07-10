const JOKERS = ['#joker1', '#joker2'];

export function deal(msg) {
  $.each(msg.hands, function(player, cards) {
    if (player === sessionStorage.getItem('nickname')) {
      $.each(cards, function(index, card) {
        let cardImage = $('<img/>', {
          id: card,
          class: 'player-card',
          src: '/static/img/cards/' + card
        });
        $('#' + player + '-cards').append(cardImage);
      });

      console.log('checking for jokers');
      $.each(JOKERS, function(index, joker) {
        console.log('checking for this one ' + joker);
        if ($('#' + player + '-cards').find(joker).length > 0) {
          console.log('found one!');
          $('#joker-selector').modal({
            backdrop: 'static',
            keyboard: false
          });
        }
      });

    } else {
      $.each(cards, function(index, card) {
        let cardImage = $('<img/>', {
          id: card,
          class: 'opponent-card',
          src: '/static/img/cards/facedown.png'
        });
        $('#' + player + '-cards').append(cardImage);
      });
    }
  });
}

export function showChosenJoker(player, joker, replacementId) {
  $('#' + player).find('#' + joker).remove();
  if (player === sessionStorage.getItem('nickname')) {
    let cardImage = $('<img/>', {
      id: joker,
      class: 'player-card',
      src: '/static/img/cards/' + replacementId
    });
    $('#' + player + '-cards').append(cardImage);
  } else {
    let cardImage = $('<img/>', {
      id: joker,
      class: 'opponent-card',
      src: '/static/img/cards/facedown.png'
    });
    $('#' + player + '-cards').append(cardImage);
  }
}