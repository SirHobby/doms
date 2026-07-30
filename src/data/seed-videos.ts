import { video, type ContentVideo } from "./content-videos";
import type { SeedNote } from "./seed-types";

/**
 * Video assignments, kept out of the seed files so those stay readable as
 * exercise lists rather than turning into walls of ids.
 *
 * Keys are `category/slug` for a whole section, and `category/slug/Exercise
 * name` for one entry. Every id is looked up through video(), which throws at
 * build time on a typo, and every id in the table was resolved through
 * YouTube's oEmbed endpoint first.
 */
const CATEGORY: Record<string, string[]> = {
  // --- ideas --------------------------------------------------------------
  "ideas/chest": ["8d9kbkAuZGI"],
  "ideas/shoulders": ["B3lGOPPBRFg"],
  "ideas/upper-back": ["4ADvWvgTvnc"],
  "ideas/lower-back": ["6SQxAvi67AY", "PgZjEiB7Zyg"],
  "ideas/quads": ["8Kls95w2jFA", "QKKXd6celO0"],
  "ideas/glutes": ["HVp9ku40t2w"],
  "ideas/forearms": ["sc-iN3hLQQw", "40Q2YSo96E0"],
  "ideas/core": ["qRAxMcjEYd4", "2_e4I-brfqs"],
  "ideas/conditioning": ["pxn34Lx3CYY"],
  "ideas/mobility": ["dBYjU7iBpck", "WQneOolYFbo"],

  // --- rehab --------------------------------------------------------------
  // Squat University is a physio channel, so this is where it earns its place.
  "rehab/knees": ["KGGUnLvVZKI", "MnssBu_cmC0", "w5fXd5FCS_0", "G85uK0Pt5Sc"],
  "rehab/lower-back": ["q4BV_xNYbsY", "1MuKr4XicEY", "WxHrtbmZIEU"],
  "rehab/neck": ["LPWCic92xyU", "A1YQkKC504I"],
  "rehab/hips": ["XkaVLh59mkc", "_3nmuwrb2x8", "9V8oGt2hfCI"],
  "rehab/hip-flexors": ["FRZXl3-TvuY", "D8_teUeUDj0"],
  "rehab/ankles": ["IikP_teeLkI", "2t7w7miSq_k"],
  "rehab/feet": ["S5xKokqeOb4", "N6yISqWUcd4"],
  "rehab/calves": ["c8aPTN_f3co", "LKiWDC8iUAU"],
  "rehab/rotator-cuff": ["xbsjy1Z08pQ", "ci_TidOc990"],
  "rehab/shoulder-blades": ["qaGQlDbFAkE", "_XcDLWaF7n8"],
  "rehab/elbows": ["bXUr2kwWlV4", "60UuEf8IbUo"],
  "rehab/wrists": ["ildCz2OdBeI", "KEBajOTDfLM"],
  "rehab/thoracic-spine": ["5wv670fHuG4", "mwaEHn2mZsE"],
  "rehab/deep-core": ["Zoc4fcUVNjU", "6pvlSkSqVMI"],
  "rehab/hamstrings": ["r-Xw_jfSwnE"],
};

const EXERCISE: Record<string, string[]> = {
  // --- ideas --------------------------------------------------------------
  "ideas/chest/Barbell bench press": ["HnQGKxU3eds"],
  "ideas/chest/Push-up": ["Yd1grZkAark"],
  "ideas/shoulders/Overhead press": ["d2uus7QUt4c"],
  "ideas/quads/Back squat": ["my0tLDaWyDU"],
  "ideas/quads/Front squat": ["7pyxT5hqmQY"],
  "ideas/quads/Bulgarian split squat": ["hPlKPjohFS0"],
  "ideas/lower-back/Conventional deadlift": ["WP0IFHkkRZ0"],
  "ideas/lower-back/Romanian deadlift": ["5bJEigM5iVg"],
  "ideas/lower-back/Good morning": ["qxNuAQknYQI"],
  "ideas/lower-back/Back extension": ["H8Swl1N-uis"],
  "ideas/hamstrings/Romanian deadlift": ["5bJEigM5iVg"],
  "ideas/hamstrings/Single leg Romanian deadlift": ["Zfr6wizR8rs"],
  "ideas/glutes/Romanian deadlift": ["5bJEigM5iVg"],
  "ideas/core/Dead bug": ["0XVbn86Btj0"],
  "ideas/core/Plank": ["LJaq4BS7KpE"],
  "ideas/conditioning/Kettlebell swing": ["LBhaLLc153A"],
  "ideas/conditioning/Sled push": ["QaTrePoCT4g"],
  "ideas/mobility/World's greatest stretch": ["-CiWQ2IvY34"],
  "ideas/mobility/Thoracic rotation": ["5wv670fHuG4"],
  "ideas/mobility/90/90 hip switch": ["O3dzeagyhH8"],
  "ideas/mobility/Ankle dorsiflexion rock": ["IikP_teeLkI"],
  "ideas/mobility/Deep squat hold": ["bjV07PRoGGo"],
  "ideas/mobility/Banded shoulder pass-through": ["_XcDLWaF7n8"],
  "ideas/forearms/Dead hang": ["40Q2YSo96E0"],

  // --- rehab --------------------------------------------------------------
  "rehab/knees/Terminal knee extension": ["BtQ_S-XRP74"],
  "rehab/knees/Step-down": ["lIPLcyE4zfQ"],
  "rehab/knees/Single-leg balance": ["-6PBNTLDtaI"],
  "rehab/hips/Clamshell": ["heplE6tpEwM"],
  "rehab/hips/Single-leg glute bridge": ["VC-yzNTpGK0"],
  "rehab/hips/Monster walk": ["fFCEtGtntPM"],
  "rehab/lower-back/Bird dog": ["SqJJygksQYY"],
  "rehab/lower-back/Glute bridge": ["VC-yzNTpGK0"],
  "rehab/lower-back/Walking": ["ictednuKxvc"],
  "rehab/deep-core/Dead bug": ["0XVbn86Btj0"],
  "rehab/deep-core/90/90 breathing": ["TRmayQcweUc"],
  "rehab/deep-core/Side plank": ["MbdyxnOL2NA"],
  "rehab/neck/Upper trap stretch": ["fL9O6iLiUWI"],
  "rehab/thoracic-spine/Foam roller extension": ["h38BWUB_61k"],
  "rehab/feet/Short foot exercise": ["qyOgFrWq1eY"],
  "rehab/feet/Ball roll": ["rpSThddpSEo"],
  "rehab/ankles/Banded ankle eversion": ["N-OaC0BpPro"],
  "rehab/ankles/Single-leg balance": ["JlImzKN7w-E"],
  "rehab/elbows/Eccentric wrist extension": ["Eth-9cBIlPw"],
  "rehab/elbows/Isometric grip hold": ["La7BAQKlXAk"],
  "rehab/shoulder-blades/Wall slide": ["waOtibCgoHs"],
  "rehab/rotator-cuff/Banded external rotation": ["2tCw2C47ldI"],
  "rehab/hamstrings/Nordic curl": ["J0bEKhnP-Mw"],
  "rehab/knees/Spanish squat": ["PJYGIlht6E4"],
  "rehab/deep-core/Pallof press": ["jO-REHXTkas"],
  "rehab/lower-back/Cat cow": ["_pk-RBh_ocQ"],
  "rehab/hip-flexors/Couch stretch": ["9V8oGt2hfCI"],
};

function merge(
  existing: ContentVideo[] | undefined,
  ids: string[] | undefined,
): ContentVideo[] | undefined {
  if (!ids) return existing;

  const out = [...(existing ?? [])];
  for (const id of ids) {
    // Assignments are additive, so an id already placed inline is not doubled.
    if (out.some((v) => v.id === id)) continue;
    out.push(video(id));
  }
  return out;
}

/** Folds the assignments above into the seed notes. */
export function withVideos(notes: readonly SeedNote[]): SeedNote[] {
  return notes.map((note) => {
    const key = `${note.category}/${note.slug}`;
    return {
      ...note,
      videos: merge(note.videos, CATEGORY[key]),
      exercises: note.exercises.map((exercise) => ({
        ...exercise,
        videos: merge(exercise.videos, EXERCISE[`${key}/${exercise.name}`]),
      })),
    };
  });
}

/** Every key, so a rename in a seed file can be caught rather than silently ignored. */
export const ASSIGNMENT_KEYS = {
  category: Object.keys(CATEGORY),
  exercise: Object.keys(EXERCISE),
};
