import type { SeedNote } from "./seed-types";

/**
 * Rehab starter content: physio-style strengthening for the small stabilising
 * muscles that the main lifts under-train.
 *
 * Not injuries and not diagnosis. The framing is always "this feels weak, here
 * is what tends to help".
 *
 * No videos yet — the Ideas library came from a hypertrophy channel with no PT
 * coverage, and an unverified link is worse than none. Every exercise carries
 * full instructions so the notes stand on their own until links are added. To
 * add one, put a `videos:` list on the exercise in the note's frontmatter:
 *
 *   - name: "Clamshell"
 *     note: "..."
 *     videos:
 *       - id: <11 character youtube id>
 *         title: "..."
 *         source: "..."
 */
export const SEED_REHAB: readonly SeedNote[] = [
  // ----------------------------------------------------------------- upper --
  {
    category: "rehab",
    group: "upper",
    slug: "rotator-cuff",
    title: "Rotator cuff",
    subtitle: "Shoulder feeling loose or weak?",
    exercises: [
      { name: "Banded external rotation", note: "Elbow pinned to your side, forearm rotates out. Slow. 2-3 sets of 15." },
      { name: "Side-lying external rotation", note: "Lie on your side, elbow on your ribs, rotate the top arm up. 2kg is plenty." },
      { name: "Full can raise", note: "Thumb up, raise to shoulder height at 45 degrees out front. 2 sets of 12." },
      { name: "Prone Y raise", note: "Face down on an incline, arms overhead in a Y. Lower traps and cuff together." },
      { name: "Isometric external rotation", note: "Press the back of your hand into a doorframe and hold 20 seconds. 5 rounds." },
      { name: "Banded internal rotation", note: "The other half of the pair. Same setup, rotate toward your belly." },
      { name: "Bottoms-up carry", note: "Kettlebell upside down, elbow bent. The cuff works hard to keep it there." },
      { name: "Sleeper stretch", note: "Only if range is the problem rather than strength. Gentle, 30 seconds." },
    ],
  },
  {
    category: "rehab",
    group: "upper",
    slug: "shoulder-blades",
    title: "Shoulder blades",
    subtitle: "Scapular control",
    exercises: [
      { name: "Wall slide", note: "Forearms on the wall, slide up while pushing away. 10 slow reps." },
      { name: "Scapular push-up", note: "Top of a push-up, arms locked, only the shoulder blades move. 2 sets of 15." },
      { name: "Band pull-apart", note: "Arms straight, pull the band to your chest. 3 sets of 20." },
      { name: "Prone T raise", note: "Face down, arms out wide, squeeze the blades together. Light or empty hands." },
      { name: "Scapular pull-up", note: "Hang, pull the shoulders down without bending the arms. 3 sets of 8." },
      { name: "Serratus punch", note: "On your back, press a weight to the ceiling and reach an inch further." },
      { name: "Bear hug hold", note: "Band across the back, arms wrapped forward. Holds the blades in protraction." },
    ],
  },
  {
    category: "rehab",
    group: "upper",
    slug: "neck",
    title: "Neck",
    subtitle: "Stiff or weak neck",
    caution:
      "The neck is a vulnerable joint. Start with no added weight, move slowly, and never work through pain. With any history of neck injury, get clearance from a clinician first.",
    exercises: [
      { name: "Chin tuck", note: "Make a double chin without tilting. Hold 5 seconds, 10 reps. Do it often." },
      { name: "Isometric neck hold", note: "Hand on your head, press and resist. Nothing moves. 10 seconds each direction." },
      { name: "Upper trap stretch", note: "Ear to shoulder, opposite hand under your seat. 30 seconds a side." },
      { name: "Levator scapulae stretch", note: "Look into your armpit, light hand pressure on the back of the head." },
      { name: "Prone neck extension", note: "Face down off the edge of a bed, lift the head slowly. Bodyweight only." },
      { name: "Banded chin tuck", note: "Light band around the back of the head. Only once bodyweight is easy." },
    ],
  },
  {
    category: "rehab",
    group: "upper",
    slug: "thoracic-spine",
    title: "Thoracic spine",
    subtitle: "Upper back stiff?",
    exercises: [
      { name: "Foam roller extension", note: "Roller across the mid back, hands behind the head, extend over it. 10 reps." },
      { name: "Open book", note: "Side lying, knees bent, rotate the top arm open. 8 slow reps a side." },
      { name: "Quadruped rotation", note: "Hand behind the head, rotate the elbow to the ceiling. 10 a side." },
      { name: "Cat cow", note: "Spinal warm-up in both directions. 10 slow cycles." },
      { name: "Wall angel", note: "Back flat to the wall, arms slide up and down. Harder than it looks." },
      { name: "Thread the needle", note: "Reach one arm under the body and rotate. 30 seconds a side." },
    ],
  },
  {
    category: "rehab",
    group: "upper",
    slug: "wrists",
    title: "Wrists",
    subtitle: "Sore when pressing?",
    exercises: [
      { name: "Wrist CARs", note: "Slow controlled circles, both directions, 10 each. Do this before you load." },
      { name: "Wrist curl", note: "Light, full range, 3 sets of 20." },
      { name: "Reverse wrist curl", note: "The extensors. Even lighter. 3 sets of 20." },
      { name: "Loaded wrist extension hold", note: "Hands flat on the floor, rock forward gently. Builds tolerance for pressing." },
      { name: "Wrist flexion hold", note: "Backs of the hands on the floor. Go very carefully at first." },
      { name: "False grip hang", note: "Wrist over the bar. Start with your feet on the floor." },
      { name: "Rice bucket dig", note: "Open and close the hands in a bucket of rice. Cheap and surprisingly effective." },
    ],
  },
  {
    category: "rehab",
    group: "upper",
    slug: "elbows",
    title: "Elbows",
    subtitle: "Nagging elbow pain",
    exercises: [
      { name: "Eccentric wrist extension", note: "Lower slowly with the sore side, lift with the other. 3 sets of 15." },
      { name: "Reverse curl", note: "Palms down. Builds the extensor side of the forearm. 3 sets of 12." },
      { name: "Towel twist", note: "Wring a towel in both directions. 3 sets of 10 each way." },
      { name: "Isometric grip hold", note: "Squeeze and hold 30 seconds. Often calms an irritated tendon fast." },
      { name: "Supination and pronation", note: "Hammer or light dumbbell held at one end, rotate slowly." },
      { name: "Tyler twist", note: "Flexbar version of the eccentric. The standard protocol for tennis elbow." },
    ],
  },

  // ----------------------------------------------------------------- spine --
  {
    category: "rehab",
    group: "spine",
    slug: "deep-core",
    title: "Deep core",
    subtitle: "Bracing rather than crunching",
    exercises: [
      { name: "Dead bug", note: "On your back, opposite arm and leg. Ribs down, low back flat. 3 sets of 8 a side." },
      { name: "Pallof press", note: "Resist the band pulling you sideways. 3 sets of 10 a side." },
      { name: "Side plank", note: "Obliques and hip together. 3 sets of 30 seconds a side." },
      { name: "90/90 breathing", note: "Feet up on a chair, exhale fully. Resets rib position before lifting." },
      { name: "Bird dog", note: "Opposite arm and leg, no rotation. 3 sets of 8 a side." },
      { name: "Hollow body hold", note: "Low back pinned to the floor. Bend the knees to scale it down." },
      { name: "Suitcase carry", note: "One heavy weight, walk tall. 4 lengths a side." },
    ],
  },
  {
    category: "rehab",
    group: "spine",
    slug: "lower-back",
    title: "Lower back",
    subtitle: "Cranky back",
    exercises: [
      { name: "Bird dog", note: "Low load coordination. Teaches you to resist rotation. 3 sets of 8 a side." },
      { name: "Glute bridge", note: "Weak glutes make the low back do their job. 3 sets of 15." },
      { name: "Cat cow", note: "Gentle movement in both directions. Good first thing in the morning." },
      { name: "Walking", note: "The most consistently useful thing for a stiff back. 20 minutes." },
      { name: "McGill curl-up", note: "One knee bent, hands under the low back, lift only the head and shoulders." },
      { name: "Side plank", note: "The third of McGill's big three. Loads the trunk without bending the spine." },
      { name: "Prone press-up", note: "Push the chest up, hips stay down. 10 reps if extension feels good." },
      { name: "Hip hinge drill", note: "Dowel along the spine, push the hips back. Learn this before you load it." },
    ],
  },

  // ----------------------------------------------------------------- lower --
  {
    category: "rehab",
    group: "lower",
    slug: "hips",
    title: "Hips",
    subtitle: "Hip collapsing on one leg?",
    exercises: [
      { name: "Clamshell", note: "Side lying, knees bent, open the top knee. Band around the knees. 3 sets of 20." },
      { name: "Side-lying leg raise", note: "Straight leg, slightly behind you, toe pointed down. 3 sets of 15." },
      { name: "Monster walk", note: "Band above the knees, stay low, step sideways. 3 sets of 20 steps." },
      { name: "Single-leg glute bridge", note: "Exposes exactly which side is weaker. 3 sets of 10 a side." },
      { name: "Copenhagen plank", note: "The adductor side of the same problem. Bent knee version first." },
      { name: "Banded hip abduction", note: "Standing, band at the ankles, sweep the leg out. 3 sets of 15." },
      { name: "Lateral step-down", note: "Stand on one leg on a step, lower the other foot slowly to the side." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "hip-flexors",
    title: "Hip flexors",
    subtitle: "Always tight?",
    exercises: [
      { name: "Psoas march", note: "On your back, band on the feet, march slowly. 3 sets of 10 a side." },
      { name: "Standing knee hold", note: "Knee above hip, hold 20 seconds. Harder than it sounds." },
      { name: "Couch stretch", note: "For when it genuinely is short rather than weak. 2 minutes a side." },
      { name: "90/90 hip switch", note: "Internal and external rotation together. 10 switches." },
      { name: "Half kneeling hip flexor stretch", note: "Squeeze the back glute, tuck the pelvis, then lean." },
      { name: "Seated leg lift", note: "Sit tall, lift one foot off the floor without leaning back." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "knees",
    title: "Knees",
    subtitle: "Aching on stairs?",
    exercises: [
      { name: "Terminal knee extension", note: "Banded, low load, easy to do daily. 3 sets of 20." },
      { name: "Step-down", note: "Slow off a low step. Control the descent, do not drop. 3 sets of 8 a side." },
      { name: "Spanish squat", note: "Band behind the knees, sit back. Loads the quad, spares the joint. 3 x 30s." },
      { name: "Wall sit", note: "Isometric holds often calm an irritated knee. 3 sets of 30 seconds." },
      { name: "Single-leg balance", note: "Knees track better when the whole leg is stable. 30 seconds a side." },
      { name: "Reverse Nordic", note: "Kneel and lean back. Loads the quad at long lengths. Go slowly." },
      { name: "Poliquin step-up", note: "Small step, heel elevated, very controlled. Builds the VMO." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "hamstrings",
    title: "Hamstrings",
    subtitle: "Feel fragile?",
    exercises: [
      { name: "Single-leg Romanian deadlift", note: "Balance and hinge together. Very light to start. 3 sets of 8." },
      { name: "Hamstring bridge walkout", note: "Heels on the floor, walk them out a step at a time. 3 sets of 8." },
      { name: "Nordic curl", note: "The strongest eccentric there is. Start with a big band assist." },
      { name: "Sliding leg curl", note: "Heels on sliders, bridge up and extend. 3 sets of 10." },
      { name: "Single-leg hamstring bridge", note: "Heel on a bench, drive the hips up. 3 sets of 12 a side." },
      { name: "Long lever bridge", note: "Straight legs, heels down, hips up. Much harder than the bent knee version." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "calves",
    title: "Calves and achilles",
    subtitle: "Tendon complaining?",
    exercises: [
      { name: "Slow eccentric heel drop", note: "Up on two, down on one over three seconds. 3 sets of 12." },
      { name: "Seated calf raise", note: "Bent knee, so the soleus does the work. 3 sets of 15." },
      { name: "Isometric heel raise hold", note: "Hold at the top 30 seconds. Calms an angry tendon. 5 rounds." },
      { name: "Tiptoe walk", note: "Low load endurance for the whole calf complex. 4 lengths." },
      { name: "Single-leg calf raise", note: "Full range, pause at the bottom. 3 sets to near failure." },
      { name: "Bent knee heel drop", note: "Targets the soleus eccentrically, which the straight leg version misses." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "ankles",
    title: "Ankles",
    subtitle: "Rolling or unstable?",
    exercises: [
      { name: "Tibialis raise", note: "Back against a wall, heels down, lift the toes. 3 sets of 25." },
      { name: "Banded ankle eversion", note: "Turn the foot outward against a band. 3 sets of 15." },
      { name: "Banded ankle inversion", note: "The other half of the pair. Do both sides evenly." },
      { name: "Single-leg balance", note: "Stand on one foot 30 seconds. Then on a cushion. Then eyes closed." },
      { name: "Ankle dorsiflexion rock", note: "Knee over the toes against a wall. Restores squat depth. 15 a side." },
      { name: "Ankle alphabet", note: "Trace the letters with your toes. Easy, and you can do it anywhere." },
      { name: "Heel walk", note: "Walk on your heels, toes lifted. 3 lengths." },
    ],
  },
  {
    category: "rehab",
    group: "lower",
    slug: "feet",
    title: "Feet",
    subtitle: "Arches or heels sore?",
    exercises: [
      { name: "Short foot exercise", note: "Draw the ball of the foot toward the heel without curling the toes. 3 x 10." },
      { name: "Toe splay", note: "Spread the toes apart and hold 5 seconds. Harder than it looks. 15 reps." },
      { name: "Towel scrunch", note: "Scrunch a towel toward you with the toes. 3 sets." },
      { name: "Heel raise", note: "Strong calves take load off the foot. 3 sets of 15." },
      { name: "Big toe extension", note: "Lift only the big toe, then only the other four. Trains toe control." },
      { name: "Ball roll", note: "Roll a ball under the arch. Two minutes, gently." },
    ],
  },

  // ------------------------------------------------------------ whole body --
  {
    category: "rehab",
    group: "whole body",
    slug: "balance",
    title: "Balance",
    subtitle: "Not what it was?",
    exercises: [
      { name: "Single-leg stance", note: "30 seconds a side. Then on a cushion. Then eyes closed." },
      { name: "Tandem walk", note: "Heel to toe in a straight line, slowly. 10 metres, three times." },
      { name: "Star reach", note: "Stand on one leg, reach the other foot out in each direction. 5 per direction." },
      { name: "Bear crawl hold", note: "Four points of contact, knees an inch off the floor. 3 x 30 seconds." },
      { name: "Single-leg deadlift reach", note: "Hinge on one leg and touch the floor. Balance under movement." },
      { name: "Eyes-closed march", note: "March on the spot with your eyes shut. Near a wall to begin with." },
    ],
  },
];
