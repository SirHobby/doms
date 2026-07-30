/**
 * Quote bank for the "Need motivation?" button.
 *
 * Every line here is attributed to a real speaker or a named character. Nothing
 * is invented and nothing is attributed on vibes — this niche is full of
 * generated listicle quotes credited to whoever sounds plausible, and a
 * misattributed line is worse than no line.
 *
 * `category` drives which ASCII piece is drawn above the quote.
 */
import { daysBetween, today, type CivilDate } from "./dates";

export type QuoteCategory =
  | "lifting"
  | "combat"
  | "anime"
  | "games"
  | "philosophy";

export interface Quote {
  /** The short, punchy form. Always present. */
  text: string;
  /**
   * The fuller quotation, where one exists. Both are kept: the short version is
   * what people actually say to each other, the long one carries the argument.
   * The modal shows one or the other at random.
   */
  long?: string;
  author: string;
  /** The work, for characters. Omitted for real people. */
  source?: string;
  category: QuoteCategory;
}

export const QUOTES: readonly Quote[] = [
  // --- golden era ---------------------------------------------------------
  { category: "lifting", author: "Arnold Schwarzenegger", text: "The last three or four reps is what makes the muscle grow.", long: "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "The mind is the limit. As long as the mind can envision it, you can achieve it.", long: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "Strength does not come from winning. Your struggles develop your strengths.", long: "Strength does not come from winning. Your struggles develop your strengths. When you go through hardships and decide not to surrender, that is strength." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "The worst thing I can be is the same as everybody else." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "Milk is for babies. When you grow up you have to drink beer." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "Work your ass off. There are no shortcuts." },
  { category: "lifting", author: "Tom Platz", text: "Nothing compares to squats." },
  { category: "lifting", author: "Tom Platz", text: "The psychological tools I've gained from bodybuilding will never atrophy." },
  { category: "lifting", author: "Tom Platz", text: "I really believe attitude monitors talent." },
  { category: "lifting", author: "Ronnie Coleman", text: "Everybody wants to be a bodybuilder, but don't nobody want to lift no heavy-ass weight." },
  { category: "lifting", author: "Ronnie Coleman", text: "Ain't nothin' but a peanut." },
  { category: "lifting", author: "Ronnie Coleman", text: "Light weight, baby." },
  { category: "lifting", author: "Ronnie Coleman", text: "Yeah buddy!" },
  { category: "lifting", author: "Ronnie Coleman", text: "There's no reason to be alive if you can't do deadlift." },
  { category: "lifting", author: "Lee Haney", text: "Stimulate, don't annihilate." },
  { category: "lifting", author: "Rich Piana", text: "Whatever it takes." },
  { category: "lifting", author: "Kai Greene", text: "The mind is what makes everything else work." },
  { category: "lifting", author: "Kai Greene", text: "Do you know the difference between wanting something and needing it?" },

  // --- modern lifters -----------------------------------------------------
  // "Pressure is a privilege" was coined by Billie Jean King; Bumstead is
  // quoting a line that reached him via Tim Grover. Credited to the origin.
  { category: "lifting", author: "Billie Jean King", text: "Pressure is a privilege." },
  { category: "lifting", author: "Chris Bumstead", text: "Winning doesn't happen on show day." },
  { category: "lifting", author: "Chris Bumstead", text: "Three days on, one day off. Repeat." },
  { category: "lifting", author: "David Goggins", text: "Stay hard." },
  { category: "lifting", author: "David Goggins", text: "When you think you're done, you're only at 40% of what your body is capable of.", long: "When you think that you are done, you're only at 40 percent of what your body is capable of doing. That's just the limits that we put on ourselves." },
  { category: "lifting", author: "David Goggins", text: "Motivation is crap. Motivation comes and goes.", long: "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you will get destroyed." },
  { category: "lifting", author: "David Goggins", text: "Suffering is the true test of life." },
  { category: "lifting", author: "David Goggins", text: "You have to build calluses on your brain.", long: "You have to build calluses on your brain just like how you build calluses on your hands." },
  { category: "lifting", author: "David Goggins", text: "Don't stop when you're tired. Stop when you're done." },
  { category: "lifting", author: "Jocko Willink", text: "Discipline equals freedom." },
  { category: "lifting", author: "Jocko Willink", text: "Good." },
  { category: "lifting", author: "Arnold Schwarzenegger", text: "Trust yourself, break some rules, don't be afraid to fail, ignore the naysayers, work like hell, and give something back." },
  { category: "lifting", author: "David Goggins", text: "The most important conversations you'll ever have are the ones you'll have with yourself." },

  // --- boxing and mma -----------------------------------------------------
  { category: "combat", author: "Mike Tyson", text: "Everybody has a plan until they get punched in the mouth." },
  { category: "combat", author: "Mike Tyson", text: "Discipline is doing what you hate to do, but doing it like you love it." },
  { category: "combat", author: "Mike Tyson", text: "I'm the best ever. I'm the most brutal and vicious.", long: "I'm the most brutal and vicious and most ruthless champion there's ever been." },
  { category: "combat", author: "Muhammad Ali", text: "I don't count my sit-ups. I only start counting when it starts hurting.", long: "I don't count my sit-ups. I only start counting when it starts hurting, because they're the only ones that count." },
  { category: "combat", author: "Muhammad Ali", text: "Suffer now and live the rest of your life as a champion.", long: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion." },
  { category: "combat", author: "Muhammad Ali", text: "Float like a butterfly, sting like a bee.", long: "Float like a butterfly, sting like a bee. Your hands can't hit what your eyes can't see." },
  { category: "combat", author: "Muhammad Ali", text: "It's just a job. Grass grows, birds fly, waves pound the sand. I beat people up." },
  { category: "combat", author: "Conor McGregor", text: "There's no talent here. This is hard work. This is an obsession.", long: "There's no talent here, this is hard work. This is an obsession. Talent does not exist, we are all equals as human beings." },
  { category: "combat", author: "Conor McGregor", text: "We're not here to take part. We're here to take over." },
  { category: "combat", author: "Conor McGregor", text: "Precision beats power, and timing beats speed." },
  { category: "combat", author: "Conor McGregor", text: "Doubt is only removed by action.", long: "Doubt is only removed by action. If you're not working, then that's where doubt comes in." },
  { category: "combat", author: "Tim Notke", text: "Hard work beats talent when talent doesn't work hard." },
  { category: "combat", author: "Rocky Balboa", source: "Rocky", text: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.", long: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward. That's how winning is done." },

  // --- attack on titan ----------------------------------------------------
  { category: "anime", author: "Eren Yeager", source: "Attack on Titan", text: "If you win, you live. If you lose, you die. If you don't fight, you can't win." },
  { category: "anime", author: "Eren Yeager", source: "Attack on Titan", text: "Fight! Fight!" },
  { category: "anime", author: "Erwin Smith", source: "Attack on Titan", text: "Dedicate your hearts!" },
  { category: "anime", author: "Levi Ackerman", source: "Attack on Titan", text: "The only thing we're allowed to do is believe we won't regret the choice we made." },
  { category: "anime", author: "Levi Ackerman", source: "Attack on Titan", text: "Give up on your dreams and die." },
  { category: "anime", author: "Levi Ackerman", source: "Attack on Titan", text: "If you begin to regret, you'll dull your future decisions.", long: "If you begin to regret, you'll dull your future decisions and let others make your choices for you." },
  { category: "anime", author: "Armin Arlert", source: "Attack on Titan", text: "You can't change anything unless you can throw something away." },
  { category: "anime", author: "Armin Arlert", source: "Attack on Titan", text: "A person who can't sacrifice anything can never change anything." },

  // --- dragon ball --------------------------------------------------------
  { category: "anime", author: "Goku", source: "Dragon Ball", text: "Power comes in response to a need, not a desire.", long: "Power comes in response to a need, not a desire. You have to create that need." },
  { category: "anime", author: "Goku", source: "Dragon Ball", text: "I am the hope of the universe." },
  { category: "anime", author: "Vegeta", source: "Dragon Ball", text: "Push through the pain. Giving up hurts more." },
  { category: "anime", author: "Vegeta", source: "Dragon Ball", text: "I do not fear this new challenge. Like a true warrior, I will rise to meet it." },
  { category: "anime", author: "Vegeta", source: "Dragon Ball", text: "It is you who are weak. Only in the face of death does a Saiyan awaken.", long: "It is you who are weak. Only in the face of adversity does a Saiyan truly awaken." },
  { category: "anime", author: "Vegeta", source: "Dragon Ball", text: "I'd rather be a brainless monster than a slave to someone else's will." },

  // --- one piece ----------------------------------------------------------
  { category: "anime", author: "Monkey D. Luffy", source: "One Piece", text: "If you don't take risks, you can't create a future." },
  { category: "anime", author: "Monkey D. Luffy", source: "One Piece", text: "I don't want to conquer anything. I just think the guy with the most freedom in this ocean is the Pirate King.", long: "I don't want to conquer anything. I just think the guy with the most freedom in this whole ocean is the Pirate King." },
  { category: "anime", author: "Roronoa Zoro", source: "One Piece", text: "Nothing happened." },
  { category: "anime", author: "Roronoa Zoro", source: "One Piece", text: "If I die here, then I'm a man that could only make it this far." },
  { category: "anime", author: "Roronoa Zoro", source: "One Piece", text: "Scars on the back are a swordsman's shame." },
  { category: "anime", author: "Portgas D. Ace", source: "One Piece", text: "I don't care what the society says. I've never regretted doing anything." },
  { category: "anime", author: "Dr. Hiluluk", source: "One Piece", text: "When do you think people die? When they are forgotten.", long: "When do you think people die? When they are shot through the heart? No. When they are ravaged by an incurable disease? No. It's when they are forgotten." },

  // --- hunter x hunter ----------------------------------------------------
  { category: "anime", author: "Ging Freecss", source: "Hunter x Hunter", text: "You should enjoy the little detours to the fullest, because that's where you'll find the things more important than what you want." },
  { category: "anime", author: "Killua Zoldyck", source: "Hunter x Hunter", text: "If you're going to do it, do it right." },

  // --- black clover -------------------------------------------------------
  { category: "anime", author: "Asta", source: "Black Clover", text: "My magic is never giving up!" },
  { category: "anime", author: "Asta", source: "Black Clover", text: "Surpass your limits. Right here, right now!" },
  { category: "anime", author: "Asta", source: "Black Clover", text: "I'm going to be the Wizard King!" },
  { category: "anime", author: "Asta", source: "Black Clover", text: "A true magic knight is someone who never gives up." },
  { category: "anime", author: "Fuegoleon Vermillion", source: "Black Clover", text: "Being weak is nothing to be ashamed of. Staying weak is." },

  // --- jujutsu kaisen -----------------------------------------------------
  { category: "anime", author: "Satoru Gojo", source: "Jujutsu Kaisen", text: "Nah, I'd win." },
  { category: "anime", author: "Satoru Gojo", source: "Jujutsu Kaisen", text: "Throughout heaven and earth, I alone am the honored one." },
  { category: "anime", author: "Yuji Itadori", source: "Jujutsu Kaisen", text: "I don't know how I'll feel when I'm dead, but I don't want to regret the way I lived." },
  { category: "anime", author: "Yuji Itadori", source: "Jujutsu Kaisen", text: "I'm not gonna die alone. I'm gonna die surrounded by people." },
  { category: "anime", author: "Aoi Todo", source: "Jujutsu Kaisen", text: "Muscles never betray you." },

  // --- demon slayer -------------------------------------------------------
  { category: "anime", author: "Kyojuro Rengoku", source: "Demon Slayer", text: "Set your heart ablaze." },
  { category: "anime", author: "Kyojuro Rengoku", source: "Demon Slayer", text: "Keep your heart burning, grit your teeth, and go forward.", long: "Keep your heart burning, grit your teeth, and go forward. Your feet may stop, but never let your heart stop." },
  { category: "anime", author: "Tanjiro Kamado", source: "Demon Slayer", text: "No matter how many people you may lose, you have no choice but to go on living.", long: "No matter how many people you may lose, you have no choice but to go on living. No matter how devastating the blows may be." },
  { category: "anime", author: "Tanjiro Kamado", source: "Demon Slayer", text: "The bond between Nezuko and me can't be severed by anyone!" },
  { category: "anime", author: "Tanjiro Kamado", source: "Demon Slayer", text: "Feel the rage. The powerful, pure rage of not being able to forgive." },

  // --- jojo ---------------------------------------------------------------
  { category: "anime", author: "Dio Brando", source: "JoJo's Bizarre Adventure (adapted)", text: "You thought it was your last rep, but it was me, DIO!" },
  { category: "anime", author: "Dio Brando", source: "JoJo's Bizarre Adventure", text: "I reject my humanity, JoJo!" },
  { category: "anime", author: "Dio Brando", source: "JoJo's Bizarre Adventure", text: "MUDA MUDA MUDA!" },
  { category: "anime", author: "Jotaro Kujo", source: "JoJo's Bizarre Adventure", text: "Yare yare daze." },
  { category: "anime", author: "Joseph Joestar", source: "JoJo's Bizarre Adventure", text: "Your next line is..." },

  // --- baki ---------------------------------------------------------------
  // English wording varies between the manga, the older sub and the Netflix
  // dub. These follow the most commonly cited phrasing.
  { category: "anime", author: "Yujiro Hanma", source: "Baki", text: "The strongest creature on earth." },
  { category: "anime", author: "Yujiro Hanma", source: "Baki", text: "Strength is the only thing that matters." },
  { category: "anime", author: "Baki Hanma", source: "Baki", text: "It's not about who's right. It's about who's left standing." },

  // --- invincible ---------------------------------------------------------
  { category: "anime", author: "Omni-Man", source: "Invincible", text: "Think, Mark!" },
  { category: "anime", author: "Omni-Man", source: "Invincible", text: "Look what they need to mimic a fraction of our power." },
  { category: "anime", author: "Omni-Man", source: "Invincible", text: "What will you have after 500 years?", long: "\u201CWhat will you have after 500 years?\u201D \u2014 \u201CYou, dad.\u201D" },
  { category: "anime", author: "Conquest", source: "Invincible", text: "Where's the fight? Where's the FIGHT?" },
  { category: "anime", author: "Conquest", source: "Invincible", text: "You're not fighting. You're just surviving." },

  // --- souls, elden ring, destiny -----------------------------------------
  { category: "games", author: "Solaire of Astora", source: "Dark Souls", text: "Praise the Sun!" },
  { category: "games", author: "Solaire of Astora", source: "Dark Souls", text: "If only I could be so grossly incandescent." },
  { category: "games", author: "Dark Souls", text: "Don't you dare go hollow." },
  { category: "games", author: "Elden Ring", text: "Rise, Tarnished.", long: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring." },
  { category: "games", author: "Melina", source: "Elden Ring", text: "Let us go together.", long: "I offer you an accord. Let us go together, to the foot of the Erdtree." },
  { category: "games", author: "Elden Ring", text: "Put these foolish ambitions to rest." },
  { category: "games", author: "Iron Fist Alexander", source: "Elden Ring", text: "I am Alexander, Iron Fist Alexander!" },
  { category: "games", author: "Demon's Souls", text: "Umbasa." },
  { category: "games", author: "Destiny", text: "Eyes up, Guardian." },
  { category: "games", author: "Destiny", text: "Become legend." },
  { category: "games", author: "Saint-14", source: "Destiny", text: "Be brave." },
  { category: "games", author: "Lord Shaxx", source: "Destiny", text: "You are a monster!" },

  // --- marcus aurelius ----------------------------------------------------
  // Meditations is public domain, so these ship verbatim with no reservations.
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "You have power over your mind, not outside events. Realize this, and you will find strength." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "The impediment to action advances action. What stands in the way becomes the way." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "Waste no more time arguing about what a good man should be. Be one." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "Do every act of your life as though it were the last act of your life." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "The soul becomes dyed with the color of its thoughts." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "Begin at once to live, and count each separate day as a separate life." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "Never let the future disturb you. You will meet it with the same weapons of reason which today arm you against the present." },
  { category: "philosophy", author: "Marcus Aurelius", source: "Meditations", text: "Confine yourself to the present." },

  // --- the other stoics and the greeks ------------------------------------
  { category: "philosophy", author: "Seneca", text: "Difficulties strengthen the mind, as labor does the body." },
  { category: "philosophy", author: "Seneca", text: "It is not because things are difficult that we do not dare, it is because we do not dare that they are difficult." },
  { category: "philosophy", author: "Seneca", text: "We suffer more often in imagination than in reality." },
  { category: "philosophy", author: "Epictetus", text: "No man is free who is not master of himself." },
  { category: "philosophy", author: "Epictetus", text: "First say to yourself what you would be, and then do what you have to do." },
  { category: "philosophy", author: "Epictetus", text: "If you want to improve, be content to be thought foolish and stupid." },
  { category: "philosophy", author: "Plato", text: "The first and greatest victory is to conquer yourself." },
  { category: "philosophy", author: "Plato", text: "Lack of activity destroys the good condition of every human being." },
  // Widely miscredited to Plato. It reaches us through Xenophon, so say so.
  { category: "philosophy", author: "Socrates", source: "Xenophon, Memorabilia", text: "No man has the right to be an amateur in the matter of physical training. It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable." },
  // Durant's paraphrase of Aristotle, not Aristotle. Credited to who wrote it.
  { category: "philosophy", author: "Will Durant", source: "The Story of Philosophy, paraphrasing Aristotle", text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit." },
  { category: "philosophy", author: "Friedrich Nietzsche", text: "He who has a why to live can bear almost any how." },
  { category: "philosophy", author: "Friedrich Nietzsche", text: "That which does not kill us makes us stronger." },
  { category: "philosophy", author: "Friedrich Nietzsche", text: "You must still have chaos in yourself to give birth to a dancing star." },
  { category: "philosophy", author: "Confucius", text: "It does not matter how slowly you go as long as you do not stop." },
  { category: "philosophy", author: "Lao Tzu", source: "Tao Te Ching", text: "A journey of a thousand miles begins with a single step." },
  { category: "philosophy", author: "Miyamoto Musashi", source: "The Book of Five Rings", text: "Today is victory over yourself of yesterday." },
  { category: "philosophy", author: "Miyamoto Musashi", source: "The Book of Five Rings", text: "Think lightly of yourself and deeply of the world." },
  { category: "philosophy", author: "Miyamoto Musashi", source: "The Book of Five Rings", text: "Do nothing which is of no use." },
  { category: "philosophy", author: "Bruce Lee", text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times." },
  { category: "philosophy", author: "Bruce Lee", text: "Be water, my friend." },
  { category: "philosophy", author: "Bruce Lee", text: "If you spend too much time thinking about a thing, you'll never get it done." },

  // --- avatar -------------------------------------------------------------
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "In the darkest times, hope is something you give yourself. That is the meaning of inner strength." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "Sometimes life is like this dark tunnel. You can't always see the light at the end, but if you keep moving, you will come to a better place." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "Pride is not the opposite of shame, but its source. True humility is the only antidote to shame." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "It is important to draw wisdom from many different places." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "Life happens wherever you are, whether you make it or not." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "Destiny is a funny thing. You never know how things are going to work out." },
  { category: "anime", author: "Uncle Iroh", source: "Avatar: The Last Airbender", text: "Sharing tea with a fascinating stranger is one of life's true delights." },
  { category: "anime", author: "Toph Beifong", source: "Avatar: The Last Airbender", text: "I am the greatest earthbender in the world! Don't you two dunderheads ever forget it!" },
  { category: "anime", author: "Toph Beifong", source: "Avatar: The Last Airbender", text: "Sometimes the best way to solve your own problems is to help someone else." },
  { category: "anime", author: "Katara", source: "Avatar: The Last Airbender", text: "I will never, ever turn my back on people who need me!" },
  { category: "anime", author: "Aang", source: "The Legend of Korra", text: "When we hit our lowest point, we are open to the greatest change." },
  { category: "anime", author: "Korra", source: "The Legend of Korra", text: "I'm the Avatar! You gotta deal with it!" },
  { category: "anime", author: "Sokka", source: "Avatar: The Last Airbender", text: "Boomerang! You do always come back!" },
  // --- naruto -------------------------------------------------------------
  // Deliberately omitted: the "Sometimes you must hurt in order to know, fall
  // in order to grow" line attributed to Might Guy all over the internet. It is
  // not from the series — a generic inspirational line with his face on it.
  { category: "anime", author: "Might Guy", source: "Naruto", text: "A dropout will beat a genius through hard work!" },
  { category: "anime", author: "Might Guy", source: "Naruto", text: "I am Might Guy, Konoha's Sublime Green Beast of Prey!" },
  { category: "anime", author: "Might Guy", source: "Naruto", text: "If I can't do it, I'll do 500 laps around Konoha on my hands!" },
  { category: "anime", author: "Might Guy", source: "Naruto", text: "The springtime of youth!" },
  { category: "anime", author: "Might Guy", source: "Naruto", text: "Kakashi, my eternal rival!" },
  { category: "anime", author: "Rock Lee", source: "Naruto", text: "I want to prove that I can be a splendid ninja even if I can't use ninjutsu!" },
  { category: "anime", author: "Rock Lee", source: "Naruto", text: "If I can't do 100 push-ups, then I'll do 200 squats! If I can't do that, then I'll run 300 laps!" },
  { category: "anime", author: "Rock Lee", source: "Naruto", text: "I will show you that hard work can surpass genius!" },
  { category: "anime", author: "Naruto Uzumaki", source: "Naruto", text: "Hard work is worthless for those that don't believe in themselves." },
  { category: "anime", author: "Naruto Uzumaki", source: "Naruto", text: "I never go back on my word. That's my nindo, my ninja way!" },
  { category: "anime", author: "Naruto Uzumaki", source: "Naruto", text: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be." },
  { category: "anime", author: "Naruto Uzumaki", source: "Naruto", text: "I'm not gonna run away. I never go back on my word!" },
  // Kakashi says it, but he is repeating Obito. Both are in the credit.
  { category: "anime", author: "Kakashi Hatake", source: "Naruto, quoting Obito", text: "In the ninja world, those who break the rules are trash. But those who abandon their friends are worse than trash." },
  { category: "anime", author: "Kakashi Hatake", source: "Naruto", text: "The moment people come to know love, they run the risk of carrying hate." },
  { category: "anime", author: "Kakashi Hatake", source: "Naruto", text: "Those who can see the meaning behind the mission are truly first-class shinobi." },
  { category: "anime", author: "Itachi Uchiha", source: "Naruto", text: "Growth occurs when one goes beyond one's limits. Realizing that is also part of training." },
  { category: "anime", author: "Itachi Uchiha", source: "Naruto", text: "You don't become the Hokage to be acknowledged by everyone. The one who is acknowledged by everyone becomes the Hokage." },
  { category: "anime", author: "Itachi Uchiha", source: "Naruto", text: "People live their lives bound by what they accept as correct and true. That's how they define reality." },
  { category: "anime", author: "Itachi Uchiha", source: "Naruto", text: "Those who cannot acknowledge themselves will eventually fail." },
  { category: "anime", author: "Jiraiya", source: "Naruto", text: "A shinobi is one who endures." },
  { category: "anime", author: "Jiraiya", source: "Naruto", text: "When people are protecting something truly special to them, they truly can become as strong as they can be." },
  { category: "anime", author: "Jiraiya", source: "Naruto", text: "Rejection is a part of life. If you can't handle it, you'll never grow as a person." },
  { category: "anime", author: "Jiraiya", source: "Naruto", text: "The true measure of a shinobi is not how he lives, but how he dies." },
  { category: "anime", author: "Haku", source: "Naruto", text: "When a person has something important they want to protect, that's when they can become truly strong." },
  { category: "anime", author: "Pain", source: "Naruto", text: "Those who do not understand true pain can never understand true peace." },
  { category: "anime", author: "Madara Uchiha", source: "Naruto", text: "Wake up to reality. Nothing ever goes as planned in this accursed world." },
  { category: "anime", author: "Madara Uchiha", source: "Naruto", text: "In this world, wherever there is light, there are also shadows." },
  { category: "anime", author: "Gaara", source: "Naruto", text: "I am not alone anymore." },
  { category: "anime", author: "Shikamaru Nara", source: "Naruto", text: "How troublesome." },
  // The commonly circulated "nobody than a somebody" line is uncertain, so this
  // is the one that can actually be stood behind.
  { category: "anime", author: "Sasuke Uchiha", source: "Naruto", text: "My only goal is in the darkness." },
];

/**
 * Day number used to seed the quote of the day.
 *
 * The obvious `Math.floor(Date.now() / 86400000)` is UTC based, so for anyone
 * west of Greenwich the quote would change partway through the afternoon. This
 * counts days from the *local* calendar date instead, so it rolls over at local
 * midnight — still with no timer, no persisted state and no writes.
 */
export function dayNumber(date: CivilDate = today()): number {
  return daysBetween({ year: 1970, month: 1, day: 1 }, date);
}

/**
 * The quote for a given day. Deterministic by construction: same day, same
 * bank, same quote, on every device and every repaint.
 *
 * Filtering happens before indexing, so a category still returns one stable
 * quote per day rather than reshuffling the whole bank.
 */
export function quoteOfTheDay(
  bank: readonly Quote[] = QUOTES,
  category?: QuoteCategory,
  day: number = dayNumber(),
): Quote | null {
  const pool = category ? bank.filter((q) => q.category === category) : bank;
  if (pool.length === 0) return null;

  // Negative days would be a pre-1970 clock, but modulo must not go negative.
  const index = ((day % pool.length) + pool.length) % pool.length;
  return pool[index];
}

const CATEGORY_ALIASES: Record<string, QuoteCategory> = {
  lifting: "lifting",
  bodybuilding: "lifting",
  gym: "lifting",
  combat: "combat",
  boxing: "combat",
  mma: "combat",
  anime: "anime",
  manga: "anime",
  games: "games",
  gaming: "games",
  philosophy: "philosophy",
  stoicism: "philosophy",
  stoic: "philosophy",
};

/** Maps a user-written category onto a real one, or null for "any". */
export function resolveCategory(value: string | undefined): QuoteCategory | null {
  if (!value) return null;
  return CATEGORY_ALIASES[value.trim().toLowerCase()] ?? null;
}

let lastIndex = -1;

/** Random, but never the same line twice in a row. */
export function pickQuote(bank: readonly Quote[] = QUOTES): Quote {
  if (bank.length === 0) return QUOTES[0];

  let index = Math.floor(Math.random() * bank.length);
  if (bank.length > 1 && index === lastIndex) {
    index = (index + 1) % bank.length;
  }
  lastIndex = index;
  return bank[index];
}

/**
 * Which form to show. Both are kept, so both should get airtime — otherwise the
 * long version would only ever exist in the data file.
 */
export function quoteText(quote: Quote): string {
  if (!quote.long) return quote.text;
  return Math.random() < 0.5 ? quote.text : quote.long;
}
