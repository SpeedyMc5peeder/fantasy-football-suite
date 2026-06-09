/**
 * imagePrompts.js - JARVIS Image Generation Prompts
 * 
 * Contains arrays of prompt variations for each event trigger.
 * All prompts are optimized for a 90s/cinematic aesthetic and include "no text"
 * as requested to prevent gibberish typography from the image model.
 */

const PROMPTS = {
  trades: [
    "Two original 1989 Game Boy systems connected by a glowing purple link cable, trading a pixelated football between their screens, chunky 8-bit sprites, scanlines, CRT glow, dusty bedroom carpet background, 1994 aesthetic, hyper-detailed pixel art, no text",
    "A 1990s holographic sports trading card floating in a dark room, rainbow foil prism effect, chrome borders, action photo of a running back mid-tackle, light refractions on the walls, dust motes, cinematic macro lens, shallow depth of field, no text",
    "A vintage arcade cabinet screen showing a football trade negotiation mini-game, two pixelated GM characters shaking hands, joystick and buttons in foreground, neon arcade lighting, quarter on the cabinet edge, 1987 aesthetic, CRT screen glow, no text"
  ],
  recap: [
    "A 1993 USA Today sports section front page being printed on a massive industrial press, ink rollers spinning, paper flying through machinery, dramatic side lighting, factory atmosphere, the headline photo showing a blurred football action shot, warm tungsten lighting, high detail, no text",
    "An aerial view from a Goodyear blimp camera looking straight down at a packed NFL stadium at twilight, the field glowing under stadium lights, tailgating smoke rising from the parking lot, Monday Night Football atmosphere, 1995 broadcast aesthetic, cinematic wide angle, slight film grain, no text",
    "A battered whiteboard in a dim locker room covered in magnetic player nameplates and red marker lines showing weekly scores, a single overhead fluorescent light buzzing, jerseys hanging on hooks, Gatorade coolers, 1990s NFL Films aesthetic, gritty documentary style, no text"
  ],
  news: [
    "A single football helmet lying upside down in a puddle on a rainy Chicago street at 2 AM, neon bar signs reflecting in the water, steam rising from a manhole, newspaper box in background, gritty 35mm film photography, high contrast, desaturated colors, no text",
    "A vintage 1980s television studio with a glowing red 'ON AIR' sign, empty anchor desk with scattered papers and an old coffee mug, a single spotlight, dust particles in the air, broadcast monitors showing static, cinematic chiaroscuro lighting, no text",
    "A graffiti-covered payphone booth at night with the receiver dangling, a crumpled betting slip and a football ticket on the ground, sodium vapor streetlight casting orange glow, 1990s urban decay aesthetic, documentary photography, no text"
  ],
  faab: [
    "A massive bank vault interior with mountains of gold coins and hundred-dollar bills piled to the ceiling, a single leather football sitting on top like a throne, Scrooge McDuck diving pose mid-air, dramatic god rays from a skylight, cinematic, slightly absurd, no text",
    "A high-stakes underground poker table in a smoke-filled room, a man in a sharp suit pushing a massive stack of blue and red chips across green felt, a football resting on the pot, single overhead lamp, dramatic shadows, 1970s casino aesthetic, no text",
    "A 1990s office desk with a rotary phone where the handset has been replaced by a stack of cash, football-themed mousepad, CRT monitor glowing, coffee stains, Dilbert comic strip on the cubicle wall, overhead fluorescent lighting, corporate satire, no text"
  ],
  fallenLegend: [
    "A weathered bronze bust of a legendary running back on a marble pedestal in a dark museum hall, single dramatic spotlight from above, dust motes floating, a discarded fantasy football roster sheet crumpled at the base, melancholy atmosphere, chiaroscuro, no text",
    "A gold Pro Football Hall of Fame jacket hanging on a rusty nail in a dimly lit, empty locker room, a single shaft of light from a high window, mothballs and dust, a pair of cleats below, cinematic, nostalgic decay, no text",
    "A framed jersey being slowly lowered from the rafters of an empty stadium, spotlight following it down, confetti still on the floor from a ceremony years ago, seats covered in dust, cinematic wide shot, melancholy, end-of-an-era feeling, no text"
  ],
  matchup: [
    "Two battered Roman gladiator helmets sitting face-to-face on the 50-yard line of a pristine modern NFL stadium, dramatic sideline lighting, empty stands, a single football between them, cinematic wide angle, Ridley Scott aesthetic, no text",
    "A massive diamond-encrusted WWE-style championship belt hovering over a smoky football field, stadium lights creating lens flares, Thursday Night Football atmosphere, neon and chrome, 1998 wrestling promo aesthetic, cinematic, no text",
    "A retro arcade game 'VS' screen with two pixelated football player portraits facing off, health bars above, 16-bit graphics, Street Fighter II aesthetic, joystick and buttons in foreground, pizza box and soda can, dorm room lighting, no text"
  ],
  mondayNight: [
    "A massive LED stadium scoreboard clock showing 0:04 remaining, glowing red digits in a dark empty stadium, a single football on the 1-yard line, fog rolling across the field, tense cinematic atmosphere, Monday Night Football 1996 broadcast aesthetic, no text",
    "A close-up of a roulette wheel spinning in a smoky backroom casino, the ball bouncing between red and black, a sweaty hand gripping the table edge, a crumpled fantasy lineup card next to the chips, dramatic tungsten lighting, 1970s gambling den, no text",
    "A 1994 Honda Civic interior at night, dashboard glowing, a portable TV balanced on the dash showing a football game, the driver gripping the steering wheel with white knuckles, streetlights streaking past, AM radio dial glowing, desperate energy, cinematic, no text"
  ],
  injury: [
    "A sterile NFL training room with an ice bath, crutches leaning against a wall, a single MRI scan on a lightbox showing a knee, a football on the examination table, harsh fluorescent lighting, clinical and cold, no text",
    "A close-up of a single football cleat print in fresh turf, a trail of white athletic tape leading off-frame, stadium lights blurred in background, shallow depth of field, medical tragedy aesthetic, no text"
  ]
};

/**
 * Gets a random image prompt for the given trigger category
 */
function getRandomPrompt(triggerType) {
  const options = PROMPTS[triggerType];
  if (!options || options.length === 0) {
    return "A dramatic cinematic sports photography shot, no text"; // Fallback
  }
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

module.exports = { getRandomPrompt, PROMPTS };
