export interface Emoji {
  name: string;
  shortcode: string;
  path: string;
  category: 'blob' | 'meow' | 'piggy';
}

export const EMOJIS: Emoji[] = [
  // Blob emojis
  { name: 'Aww', shortcode: ':blob-aww:', path: '/emojis/blob/aww.gif', category: 'blob' },
  { name: 'Baby Angel', shortcode: ':blob-angel:', path: '/emojis/blob/babyangel.gif', category: 'blob' },
  { name: 'Bongo', shortcode: ':blob-bongo:', path: '/emojis/blob/bongo.gif', category: 'blob' },
  { name: 'Bored', shortcode: ':blob-bored:', path: '/emojis/blob/bored.gif', category: 'blob' },
  { name: 'Cheers', shortcode: ':blob-cheers:', path: '/emojis/blob/cheers.gif', category: 'blob' },
  { name: 'Confused', shortcode: ':blob-confused:', path: '/emojis/blob/confused.gif', category: 'blob' },
  { name: 'Conga', shortcode: ':blob-conga:', path: '/emojis/blob/conga.gif', category: 'blob' },
  { name: 'Cry', shortcode: ':blob-cry:', path: '/emojis/blob/cry.gif', category: 'blob' },
  { name: 'Dancer', shortcode: ':blob-dancer:', path: '/emojis/blob/dancer.gif', category: 'blob' },
  { name: 'Dun Dun Dun', shortcode: ':blob-dundundun:', path: '/emojis/blob/dundundun.gif', category: 'blob' },
  { name: 'Eye Roll', shortcode: ':blob-eyeroll:', path: '/emojis/blob/eyeroll.gif', category: 'blob' },
  { name: 'Gimme', shortcode: ':blob-gimme:', path: '/emojis/blob/gimme.gif', category: 'blob' },
  { name: 'Goodnight', shortcode: ':blob-goodnight:', path: '/emojis/blob/goodnight.gif', category: 'blob' },
  { name: 'Grimace', shortcode: ':blob-grimace:', path: '/emojis/blob/grimace.gif', category: 'blob' },
  { name: 'Happy', shortcode: ':blob-happy:', path: '/emojis/blob/happy.gif', category: 'blob' },
  { name: 'Hype', shortcode: ':blob-hype:', path: '/emojis/blob/hype.gif', category: 'blob' },
  { name: 'Kiss', shortcode: ':blob-kiss:', path: '/emojis/blob/kiss.gif', category: 'blob' },
  { name: 'Nervous', shortcode: ':blob-nervous:', path: '/emojis/blob/nervous.gif', category: 'blob' },
  { name: 'Nope', shortcode: ':blob-nope:', path: '/emojis/blob/nope.gif', category: 'blob' },
  { name: 'Panic', shortcode: ':blob-panic:', path: '/emojis/blob/panic.gif', category: 'blob' },
  { name: 'Party', shortcode: ':blob-party:', path: '/emojis/blob/party.gif', category: 'blob' },
  { name: 'Rage', shortcode: ':blob-rage:', path: '/emojis/blob/rage.gif', category: 'blob' },
  { name: 'Smile', shortcode: ':blob-smile:', path: '/emojis/blob/smile.gif', category: 'blob' },
  { name: 'Stare', shortcode: ':blob-stare:', path: '/emojis/blob/stare.gif', category: 'blob' },
  { name: 'Triggered', shortcode: ':blob-triggered:', path: '/emojis/blob/triggered.gif', category: 'blob' },
  { name: 'Ugh', shortcode: ':blob-ugh:', path: '/emojis/blob/ugh.gif', category: 'blob' },
  { name: 'Wat', shortcode: ':blob-wat:', path: '/emojis/blob/wat.gif', category: 'blob' },
  { name: 'Wave', shortcode: ':blob-wave:', path: '/emojis/blob/wave.gif', category: 'blob' },
  { name: 'Wink', shortcode: ':blob-wink:', path: '/emojis/blob/wink.gif', category: 'blob' },
  { name: 'Yay', shortcode: ':blob-yay:', path: '/emojis/blob/yay.gif', category: 'blob' },
  { name: 'Yep', shortcode: ':blob-yep:', path: '/emojis/blob/yep.gif', category: 'blob' },

  // Meow emojis
  { name: 'Avicii', shortcode: ':meow-avicii:', path: '/emojis/meow/avicii.gif', category: 'meow' },
  { name: 'Bongo', shortcode: ':meow-bongo:', path: '/emojis/meow/bongo.gif', category: 'meow' },
  { name: 'Bounce', shortcode: ':meow-bounce:', path: '/emojis/meow/bounce.gif', category: 'meow' },
  { name: 'Gimme', shortcode: ':meow-gimme:', path: '/emojis/meow/gimme.gif', category: 'meow' },
  { name: 'Hero', shortcode: ':meow-hero:', path: '/emojis/meow/hero.gif', category: 'meow' },
  { name: 'Maracas', shortcode: ':meow-maracas:', path: '/emojis/meow/maracas.gif', category: 'meow' },
  { name: 'Party', shortcode: ':meow-party:', path: '/emojis/meow/party.gif', category: 'meow' },
  { name: 'Peekaboo', shortcode: ':meow-peekaboo:', path: '/emojis/meow/peekaboo.gif', category: 'meow' },
  { name: 'Popcorn', shortcode: ':meow-popcorn:', path: '/emojis/meow/popcorn.gif', category: 'meow' },
  { name: 'Rage', shortcode: ':meow-rage:', path: '/emojis/meow/rage.gif', category: 'meow' },
  { name: 'Shocked', shortcode: ':meow-shocked:', path: '/emojis/meow/shocked.gif', category: 'meow' },
  { name: 'Sip', shortcode: ':meow-sip:', path: '/emojis/meow/sip.gif', category: 'meow' },
  { name: 'Smug', shortcode: ':meow-smug:', path: '/emojis/meow/smug.gif', category: 'meow' },
  { name: 'Stretch', shortcode: ':meow-stretch:', path: '/emojis/meow/stretch.gif', category: 'meow' },
  { name: 'Thinking', shortcode: ':meow-thinking:', path: '/emojis/meow/thinking.gif', category: 'meow' },
  { name: 'Wat', shortcode: ':meow-wat:', path: '/emojis/meow/wat.gif', category: 'meow' },
  { name: 'Wave', shortcode: ':meow-wave:', path: '/emojis/meow/wave.gif', category: 'meow' },
  { name: 'Yay', shortcode: ':meow-yay:', path: '/emojis/meow/yay.gif', category: 'meow' },

  // Piggy emojis
  { name: 'Angry', shortcode: ':piggy-angry:', path: '/emojis/piggy/angry.gif', category: 'piggy' },
  { name: 'Boom', shortcode: ':piggy-boom:', path: '/emojis/piggy/boom.gif', category: 'piggy' },
  { name: 'Cry', shortcode: ':piggy-cry:', path: '/emojis/piggy/cry.gif', category: 'piggy' },
  { name: 'Happy', shortcode: ':piggy-happy:', path: '/emojis/piggy/happy.gif', category: 'piggy' },
  { name: 'Hello', shortcode: ':piggy-hello:', path: '/emojis/piggy/hello.gif', category: 'piggy' },
  { name: 'Hugs', shortcode: ':piggy-hugs:', path: '/emojis/piggy/hugs.gif', category: 'piggy' },
  { name: 'Kiss', shortcode: ':piggy-kiss:', path: '/emojis/piggy/kiss.gif', category: 'piggy' },
  { name: 'Scoot', shortcode: ':piggy-scoot:', path: '/emojis/piggy/scoot.gif', category: 'piggy' },
  { name: 'Serenade', shortcode: ':piggy-serenade:', path: '/emojis/piggy/serenade.gif', category: 'piggy' },
  { name: 'Silly', shortcode: ':piggy-silly:', path: '/emojis/piggy/silly.gif', category: 'piggy' },
  { name: 'Sparkle', shortcode: ':piggy-sparkle:', path: '/emojis/piggy/sparkle.gif', category: 'piggy' },
  { name: 'Trot', shortcode: ':piggy-trot:', path: '/emojis/piggy/trot.gif', category: 'piggy' },
  { name: 'Wave', shortcode: ':piggy-wave:', path: '/emojis/piggy/wave.gif', category: 'piggy' },
];

// Create a map for quick lookup
export const EMOJI_MAP = new Map(EMOJIS.map(e => [e.shortcode, e]));

// Parse message and replace shortcodes with emoji data
export function parseEmojis(message: string): (string | Emoji)[] {
  const parts: (string | Emoji)[] = [];
  const regex = /:(blob|meow|piggy)-([a-z]+):/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(message)) !== null) {
    // Add text before the emoji
    if (match.index > lastIndex) {
      parts.push(message.slice(lastIndex, match.index));
    }

    // Add the emoji if it exists
    const emoji = EMOJI_MAP.get(match[0]);
    if (emoji) {
      parts.push(emoji);
    } else {
      parts.push(match[0]); // Keep original if not found
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [message];
}
