import type { LifePath } from '../../engine'

/**
 * PATH 01 -- "Ten Digits"
 *
 * Anchor act: at 23:41 on an ordinary Tuesday, Nadia either dials her father or
 * puts the phone face down.
 *
 * Why this act, for the first path:
 *  - The stakes are entirely interior. Nobody dies because of the choice, no
 *    law is broken, so the player cannot retreat into moral scorekeeping. The
 *    only question available is *why can a person not press ten buttons*.
 *  - It admits the whole ladder cleanly: a thrown plate, a shift pattern, a
 *    blood sugar level, a thumb already moving.
 *  - It contains the cheapest possible lever (last night's bedtime), which is
 *    how the rewind mechanic teaches itself.
 *
 * The meritocracy thread runs underneath rather than on top: she was sorted at
 * eleven, sorted again at twenty-four, and has been told twice that the sorting
 * was deserved. That belief is a factor with a weight like any other.
 *
 * STATUS: draft for review. Numbers are first-pass and tuned by
 * `npm run validate` against the bands in docs/KEY-QUESTION.md, not by feel.
 */
export const tenDigits: LifePath = {
  id: 'ten-digits',
  title: 'Ten Digits',
  anchorAct: 'Nadia calls her father, or she does not.',
  character: { name: 'Nadia', pronoun: 'she' },
  intent:
    'Land the claim that an act requiring no money, no strength and no skill can still be ' +
    'unavailable, and that the reasons are all findable and none of them are her.',

  baselineTraits: {
    impulseControl: 52,
    stressLoad: 30,
    threatSensitivity: 40,
    trust: 50,
    noveltySeeking: 48,
    empathyReach: 50,
    belonging: 45,
    conscientiousness: 50,
  },

  baselineResources: {
    energy: 64, // read as the base cap; sleep debt and stress cut into it
    money: 300,
    health: 70,
    sleepDebt: 20,
    hindsight: 0, // the roll decides this, and does not mention that it has
  },

  /* ================================================================ *
   * THE ROLL
   * Everything below happened to her. The narrator finds it funny.
   * ================================================================ */
  roll: [
    {
      id: 'ancestry',
      label: 'Ancestry',
      prompt: 'Four generations you will never meet are about to vote on your temperament.',
      outcomes: [
        {
          id: 'famine-line',
          label: 'Three generations of not enough',
          quip: 'Ooh. Your great-grandmother spent a winter hungry and your stress axis still has the receipt.',
          weight: 3,
          hindsightDelta: 5,
          traitBaselineDeltas: { stressLoad: 10, threatSensitivity: 6, conscientiousness: 4 },
          factors: [
            {
              id: 'f.famine',
              scale: 'ancestry',
              label: 'A hungry winter, four generations up',
              detail:
                'Nutritional stress leaves methylation marks that outlive the people who were hungry. ' +
                'She inherited a thermostat set by a famine she has never heard about.',
              tags: ['inherited-stress'],
              traitDeltas: { stressLoad: 6 },
            },
          ],
        },
        {
          id: 'settled-line',
          label: 'Dull, uninterrupted, safe',
          quip: 'Nice! Nothing happened to your ancestors. That is worth more than a degree.',
          weight: 2,
          hindsightDelta: 9,
          traitBaselineDeltas: { stressLoad: -6, trust: 6 },
          factors: [
            {
              id: 'f.settled',
              scale: 'ancestry',
              label: 'Four generations in the same unremarkable town',
              tags: ['inherited-calm'],
              traitDeltas: { trust: 4 },
            },
          ],
        },
        {
          id: 'displaced-line',
          label: 'Moved at gunpoint, twice',
          quip: 'Your family learned that leaving quietly is a survival skill. Congratulations on the inheritance.',
          weight: 2,
          hindsightDelta: 4,
          traitBaselineDeltas: { threatSensitivity: 10, trust: -8, noveltySeeking: 4 },
          factors: [
            {
              id: 'f.displaced',
              scale: 'ancestry',
              label: 'A family habit of leaving without saying goodbye',
              detail: 'Twice in eighty years, the correct move was to go and not explain.',
              tags: ['inherited-flight', 'silence'],
              traitDeltas: { trust: -5 },
            },
          ],
        },
      ],
    },
    {
      id: 'family',
      label: 'The house she was put in',
      prompt: 'You did not pick this. Nobody has ever picked this.',
      outcomes: [
        {
          id: 'loud-father',
          label: 'A father with a temper and a pension worry',
          quip: 'Oops! I guess you were born in the wrong family!',
          weight: 4,
          hindsightDelta: 4,
          traitBaselineDeltas: { threatSensitivity: 12, trust: -8, impulseControl: -4 },
          factors: [
            {
              id: 'f.loud-house',
              scale: 'prenatal',
              label: 'A house where volume preceded consequence',
              detail:
                'She was calibrating to his voice through the abdominal wall. Maternal cortisol crosses ' +
                'the placenta; the calibration started before she had a face.',
              tags: ['threat-home'],
              traitDeltas: { threatSensitivity: 8, stressLoad: 5 },
            },
          ],
        },
        {
          id: 'tired-mother',
          label: 'A mother working two jobs, mostly absent',
          quip: 'She loved you in the eleven minutes a day she was awake for it. Those minutes count, just not for much.',
          weight: 3,
          hindsightDelta: 6,
          traitBaselineDeltas: { belonging: -8, conscientiousness: 6 },
          factors: [
            {
              id: 'f.absent-mother',
              scale: 'infancy',
              label: 'Eleven minutes a day of undivided attention',
              tags: ['thin-attachment'],
              traitDeltas: { belonging: -6, trust: -4 },
            },
          ],
        },
        {
          id: 'steady-house',
          label: 'Boring parents who stayed married',
          quip: 'Well look at you. You have been handed the single best predictor in the whole dataset.',
          weight: 2,
          hindsightDelta: 10,
          traitBaselineDeltas: { trust: 10, belonging: 10, threatSensitivity: -8 },
          factors: [
            {
              id: 'f.steady-house',
              scale: 'infancy',
              label: 'Two adults who were reliably in the next room',
              tags: ['secure-base'],
              traitDeltas: { trust: 8, belonging: 6 },
            },
          ],
        },
      ],
    },
    {
      id: 'neighbourhood',
      label: 'Postcode',
      prompt: 'A number that will follow her onto every form for the rest of her life.',
      outcomes: [
        {
          id: 'stimulating',
          label: 'A library, a park, and nothing much happening',
          quip: 'Nice! Your neighbourhood was chill and stimulating. That helps, I guess!',
          weight: 2,
          hindsightDelta: 8,
          traitBaselineDeltas: { impulseControl: 8, noveltySeeking: 6, stressLoad: -6 },
          factors: [
            {
              id: 'f.good-postcode',
              scale: 'childhood',
              label: 'A library within walking distance',
              tags: ['enrichment'],
              traitDeltas: { impulseControl: 5, conscientiousness: 4 },
            },
          ],
        },
        {
          id: 'loud-street',
          label: 'A main road, sirens, damp',
          quip: 'Lead in the pipes, noise at 3am. Your frontal cortex is going to develop around all of that.',
          weight: 3,
          hindsightDelta: 5,
          traitBaselineDeltas: { impulseControl: -10, stressLoad: 10 },
          resourceDeltas: { health: -5 },
          factors: [
            {
              id: 'f.bad-postcode',
              scale: 'childhood',
              label: 'Sirens at three in the morning, for eleven years',
              detail:
                'Chronic noise exposure in childhood tracks with adult impulse control about as reliably ' +
                'as anything in the literature. She did not choose the road.',
              tags: ['chronic-noise'],
              traitDeltas: { impulseControl: -6, stressLoad: 6 },
            },
          ],
        },
      ],
    },
    {
      id: 'body',
      label: 'Body',
      prompt: 'The machine she has to do all of this with.',
      outcomes: [
        {
          id: 'short-sleeper',
          label: 'Needs nine hours, will never get them',
          quip: 'Rough. Your sleep requirement is genetic and your shift pattern is not negotiable.',
          weight: 3,
          hindsightDelta: 5,
          traitBaselineDeltas: { impulseControl: -4 },
          factors: [
            {
              id: 'f.long-sleep-need',
              scale: 'genes',
              label: 'A nine-hour sleep requirement',
              tags: ['sleep-fragile'],
              resourceDeltas: { sleepDebt: 10 },
            },
          ],
        },
        {
          id: 'resilient',
          label: 'Sleeps badly, functions anyway',
          quip: 'You got the useful allele. You did not earn it. Enjoy.',
          weight: 2,
          hindsightDelta: 8,
          traitBaselineDeltas: { impulseControl: 6, stressLoad: -4 },
          factors: [
            {
              id: 'f.short-sleep-gene',
              scale: 'genes',
              label: 'Six hours is genuinely enough for her',
              tags: ['sleep-robust'],
              resourceDeltas: { sleepDebt: -10 },
            },
          ],
        },
        {
          id: 'reactive',
          label: 'A startle response like a tripwire',
          quip: 'Amygdala came pre-tuned. Nothing you do will retune it much.',
          weight: 2,
          hindsightDelta: 4,
          traitBaselineDeltas: { threatSensitivity: 12, empathyReach: 4 },
          factors: [
            {
              id: 'f.reactive-amygdala',
              scale: 'genes',
              label: 'A startle response like a tripwire',
              tags: ['hyperreactive'],
              traitDeltas: { threatSensitivity: 6 },
            },
          ],
        },
      ],
    },
  ],

  /* ================================================================ *
   * THE FORKS -- descending the ladder toward 23:41.
   * ================================================================ */
  forks: [
    /* ---------------- childhood ---------------- */
    {
      id: 'the-quiet',
      scale: 'childhood',
      when: 'She is seven. The hallway.',
      prose:
        'Something breaks in the kitchen and then her father starts, and the sound of him has a shape ' +
        'she already knows: it goes up, and then it goes flat, and the flat part is the part to be ' +
        'somewhere else for. There is a gap under the desk in the back room. She has measured it.',
      options: [
        {
          id: 'go-in',
          label: 'Go into the kitchen',
          narration:
            'She goes in. She does not remember what she said, only that she said it in a voice that was ' +
            'trying to be an adult voice, and that the room stopped for a second first.',
          confabulation:
            'She stayed under the desk. She was being sensible. She was seven and she was being sensible, ' +
            'and she will describe it that way for thirty years.',
          grants: [
            {
              id: 'f.learned-voice',
              scale: 'childhood',
              label: 'Once, at seven, saying something anyway',
              detail: 'It did not help. It is still load-bearing.',
              tags: ['voice', 'contact'],
              traitDeltas: { trust: 5, belonging: 4, threatSensitivity: 3 },
            },
          ],
        },
        {
          id: 'stay-under',
          label: 'Stay under the desk',
          narration:
            'She stays under the desk with her knees up and counts the flat part until it stops. It works. ' +
            'It keeps working. It will still be working at thirty-one.',
          confabulation:
            'She went in. She will not be able to explain why, later, and will settle on "I was a brave kid", ' +
            'which is not what the tape shows.',
          grants: [
            {
              id: 'f.learned-quiet',
              scale: 'childhood',
              label: 'Learning that going quiet works',
              detail:
                'A strategy that succeeds at seven is not evaluated again. It is installed.',
              tags: ['avoidance', 'silence'],
              traitDeltas: { threatSensitivity: 10, trust: -8, belonging: -4 },
            },
          ],
        },
      ],
      weighing: {
        base: -14,
        baseLabel: 'She is seven and the sound is already moving her',
        traitTerms: [
          { trait: 'threatSensitivity', coef: -20, label: 'A startle response she was issued' },
          { trait: 'trust', coef: 10, label: 'Whatever trust she came with' },
        ],
        tagTerms: [
          { tag: 'threat-home', coef: -8 },
          { tag: 'secure-base', coef: 7 },
          { tag: 'hyperreactive', coef: -6 },
        ],
      },
      aside:
        'You wanted her to go in. Have a look at what you were asking a seven-year-old to overrule.',
    },
    {
      id: 'the-report-card',
      scale: 'childhood',
      when: 'She is eleven. The corridor outside 4B.',
      prose:
        'Mrs Aldridge says it kindly, which is the part that lands: that Nadia is a hard worker, and that ' +
        'not everyone is going to be one of the bright ones, and that there is no shame in it. Nadia says ' +
        'thank you. There is a form in her bag with a number on it that decides which corridor she walks ' +
        'down for the next five years.',
      options: [
        {
          id: 'show-it',
          label: 'Show the form to someone',
          narration:
            'She shows it to her mother, who is tired, and who says they will look at it at the weekend. ' +
            'They do not look at it at the weekend. But Nadia said it out loud once.',
          confabulation:
            'The form stayed in the bag until the bag was thrown out. She has no memory of deciding that.',
          grants: [
            {
              id: 'f.said-it-aloud',
              scale: 'childhood',
              label: 'Once saying out loud that the number was wrong',
              tags: ['voice'],
              traitDeltas: { belonging: 4, conscientiousness: 3 },
            },
          ],
        },
        {
          id: 'bury-it',
          label: 'Put it at the bottom of the bag',
          narration:
            'She puts it under her PE kit. By Friday she has stopped thinking about it, and by fourteen she ' +
            'believes the number, and believing it is the load-bearing part, not the number.',
          confabulation:
            'She showed it to someone. It changed nothing, and she has folded that into her general sense ' +
            'that speaking up is for other people.',
          grants: [
            {
              id: 'f.sorted-at-eleven',
              scale: 'childhood',
              label: 'Being sorted at eleven, and agreeing with the sorting',
              detail:
                'This is the meritocratic wound, installed early: not "they were unfair to me" but ' +
                '"they measured me correctly". Everything after this is downstream of her believing it.',
              tags: ['meritocratic-wound', 'silence'],
              traitDeltas: { belonging: -6, conscientiousness: 5, trust: -4 },
            },
          ],
        },
      ],
      weighing: {
        base: -8,
        baseLabel: 'Mrs Aldridge was kind about it, which makes it harder to argue with',
        traitTerms: [
          { trait: 'belonging', coef: 14, label: 'Whether anyone was going to back her up' },
          { trait: 'threatSensitivity', coef: -10, label: 'How much a corridor costs her' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -9 },
          { tag: 'enrichment', coef: 6 },
          { tag: 'thin-attachment', coef: -6 },
          { tag: 'voice', coef: 7 },
        ],
      },
    },

    /* ---------------- adolescence ---------------- */
    {
      id: 'the-plate',
      scale: 'adolescence',
      when: 'She is fourteen. Sunday, the middle of the afternoon.',
      prose:
        'The plate goes past her shoulder and hits the doorframe, not her, and in the silence afterwards ' +
        'everyone in the room understands that it was not aimed. Her father is breathing through his nose. ' +
        'Her sister Rosa is nine and has gone the colour of paper.',
      options: [
        {
          id: 'say-it',
          label: 'Say the thing out loud',
          narration:
            'She says: you do not get to do that. Her voice cracks in the middle of it, which she will be ' +
            'embarrassed about for years, and which is not the important part. Rosa heard her say it.',
          confabulation:
            'She took Rosa upstairs and put the television on. She has told herself this was for Rosa. ' +
            'Partly it was.',
          grants: [
            {
              id: 'f.said-it-at-fourteen',
              scale: 'adolescence',
              label: 'Saying it out loud at fourteen, badly',
              tags: ['voice', 'contact'],
              traitDeltas: { trust: 4, belonging: 6, threatSensitivity: -4 },
            },
          ],
        },
        {
          id: 'take-rosa-upstairs',
          label: 'Take Rosa upstairs',
          narration:
            'She takes Rosa upstairs and puts the television on loud. It is the correct move. It is the ' +
            'move she has been rehearsing since she was seven, and it works, and nobody in the house ever ' +
            'says anything about the plate again.',
          confabulation:
            'She said it out loud. It cracked in the middle. She does not think about it, because the ' +
            'version where she managed the room is the one that fits who she is.',
          grants: [
            {
              id: 'f.managed-the-room',
              scale: 'adolescence',
              label: 'Becoming the one who manages the room',
              detail:
                'Ten years of competence at de-escalation, which is a real skill, and which is built ' +
                'entirely out of not being in the conversation.',
              tags: ['avoidance', 'silence', 'caretaking'],
              traitDeltas: { threatSensitivity: 8, empathyReach: 6, trust: -5 },
            },
          ],
        },
      ],
      weighing: {
        base: -10,
        baseLabel: 'Rosa is nine and standing right there',
        traitTerms: [
          { trait: 'threatSensitivity', coef: -18, label: 'What a raised voice does to her' },
          { trait: 'impulseControl', coef: -8, label: 'Fourteen: the cortex is not finished' },
          { trait: 'belonging', coef: 12, label: 'Whether she has anyone' },
          { trait: 'empathyReach', coef: -6, label: 'Rosa needs the television on' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -12 },
          { tag: 'voice', coef: 10 },
          { tag: 'threat-home', coef: -7 },
        ],
      },
      aside: 'Fourteen. Her prefrontal cortex has another eleven years of construction to go.',
    },
    {
      id: 'the-exam',
      scale: 'adolescence',
      when: 'She is seventeen. The week before.',
      prose:
        'The exam is on Thursday and the shift is on Wednesday night, and the shift is nine hours at the ' +
        'distribution centre, and the money is not optional in the way that the exam is optional.',
      options: [
        {
          id: 'study',
          label: 'Call in sick and study',
          narration:
            'She calls in sick. She studies until two and sits the exam on four hours of sleep and does ' +
            'adequately, and the adequacy is filed, by everyone including her, as the ceiling.',
          confabulation:
            'She worked the shift. She has always said she chose the money, and she has always said it ' +
            'the way you say something you decided.',
          grants: [
            {
              id: 'f.sat-it',
              scale: 'adolescence',
              label: 'Sitting the exam on four hours of sleep',
              tags: ['credential'],
              traitDeltas: { conscientiousness: 5, belonging: 3 },
              resourceDeltas: { money: -120 },
            },
          ],
        },
        {
          id: 'take-the-shift',
          label: 'Work the shift',
          narration:
            'She works the shift. She sits the exam anyway, on two hours, and does badly, and the badly ' +
            'is filed by everyone including her as information about Nadia rather than information about ' +
            'Wednesday.',
          confabulation:
            'She called in sick and studied. She cannot reconstruct the decision and does not try.',
          grants: [
            {
              id: 'f.chose-the-money',
              scale: 'adolescence',
              label: 'Wednesday night, nine hours, and then Thursday',
              detail:
                'The result went on a form. The form did not have a box for Wednesday.',
              tags: ['meritocratic-wound'],
              traitDeltas: { conscientiousness: 4, stressLoad: 6, belonging: -4 },
              resourceDeltas: { money: 140, sleepDebt: 6 },
            },
          ],
        },
      ],
      weighing: {
        base: -9,
        baseLabel: 'The rent is a number and Thursday is a feeling',
        traitTerms: [
          { trait: 'conscientiousness', coef: 12, label: 'The habit of finishing things, installed by someone else' },
          { trait: 'stressLoad', coef: -12, label: 'What she is already carrying' },
          { trait: 'belonging', coef: 8, label: 'Whether anyone expects her at the exam' },
        ],
        tagTerms: [
          { tag: 'meritocratic-wound', coef: -10 },
          { tag: 'enrichment', coef: 8 },
          { tag: 'inherited-stress', coef: -5 },
        ],
      },
    },

    /* ---------------- years ---------------- */
    {
      id: 'leaving',
      scale: 'years',
      when: 'She is nineteen. Six in the morning.',
      prose:
        'Everything she is taking fits in one bag, which she notices, and which she will think about ' +
        'later more than she expects to. There is paper on the kitchen table and a pen in the drawer ' +
        'and forty minutes before anyone gets up.',
      options: [
        {
          id: 'leave-a-note',
          label: 'Write something and leave it',
          narration:
            'She writes four lines. Three of them are logistics. The fourth one is not, and it is the ' +
            'reason the phone number stays in her phone for the next twelve years.',
          confabulation:
            'She left without writing anything. She has described this as clean. It was not clean, it was ' +
            'practised.',
          grants: [
            {
              id: 'f.left-a-note',
              scale: 'years',
              label: 'Four lines on the kitchen table',
              detail: 'A thread. Thin, but the only one.',
              tags: ['contact', 'voice'],
              traitDeltas: { trust: 5, belonging: 7 },
            },
          ],
        },
        {
          id: 'leave-clean',
          label: 'Leave without writing anything',
          narration:
            'She pulls the door to instead of closing it, so the latch does not wake anyone. Four years ' +
            'of silence start here, and at no point in those four years does anyone decide on them.',
          confabulation:
            'She wrote four lines. She does not remember what was in them, which tells you roughly how ' +
            'much of this she is running.',
          grants: [
            {
              id: 'f.four-years-silence',
              scale: 'years',
              label: 'Four years of silence, never actually decided on',
              detail:
                'Nobody chose this. It accumulated, one unremarkable Tuesday at a time, which is how ' +
                'most of the important things in a life get done.',
              tags: ['silence', 'avoidance'],
              traitDeltas: { trust: -6, belonging: -10 },
            },
          ],
        },
      ],
      weighing: {
        base: -6,
        baseLabel: 'The latch is quieter if you pull it',
        traitTerms: [
          { trait: 'trust', coef: 16, label: 'Whether saying something has ever paid' },
          { trait: 'threatSensitivity', coef: -12, label: 'What the house taught her about leaving' },
          { trait: 'belonging', coef: 10, label: 'Whether there is anyone to write to' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -11 },
          { tag: 'voice', coef: 9 },
          { tag: 'inherited-flight', coef: -8 },
          { tag: 'secure-base', coef: 8 },
        ],
      },
    },
    {
      id: 'the-promotion',
      scale: 'years',
      when: 'She is twenty-four. A Thursday, by the lockers.',
      prose:
        'The shift supervisor post is going internal and Derek says she should put her name down, and ' +
        'then says, not unkindly, that they will probably give it to someone with the paperwork. He means ' +
        'it as solidarity. It functions as a forecast.',
      options: [
        {
          id: 'put-her-name-in',
          label: 'Put her name in anyway',
          narration:
            'She puts her name in. They give it to someone with the paperwork. In the corridor afterwards ' +
            'the area manager tells her, warmly, that the right person got it, and that she should be proud ' +
            'of how far she has come from where she started.',
          confabulation:
            'She did not put her name in. She has always said she did not want it. She has said it enough ' +
            'times that it has the texture of a preference.',
          grants: [
            {
              id: 'f.asked-and-was-told',
              scale: 'years',
              label: 'Being told, warmly, that the right person got it',
              detail:
                'Sandel\'s point, delivered by an area manager in a corridor: the winners believe the ' +
                'sorting was earned, and they say so to the sorted, kindly, as encouragement.',
              tags: ['meritocratic-wound', 'voice'],
              traitDeltas: { belonging: -5, stressLoad: 5, conscientiousness: 4 },
            },
          ],
        },
        {
          id: 'let-it-go',
          label: 'Let it go',
          narration:
            'She does not put her name in. Derek does, and does not get it either, and the two of them ' +
            'agree in the car park that the whole thing was decided before it was announced. They are right. ' +
            'Being right about it does not do anything.',
          grants: [
            {
              id: 'f.did-not-put-name-in',
              scale: 'years',
              label: 'Not putting her name down for something she wanted',
              tags: ['avoidance', 'meritocratic-wound'],
              traitDeltas: { belonging: -6, conscientiousness: -3 },
            },
          ],
          confabulation:
            'She put her name in and did not get it. She remembers this as having gone for it, which is ' +
            'the more comfortable of the two available memories.',
        },
      ],
      weighing: {
        base: -5,
        baseLabel: 'Derek has already said what is going to happen',
        traitTerms: [
          { trait: 'conscientiousness', coef: 12, label: 'The habit of putting her name on things' },
          { trait: 'belonging', coef: 11, label: 'Whether anyone at work is hers' },
          { trait: 'threatSensitivity', coef: -9, label: 'The cost of being looked at' },
        ],
        tagTerms: [
          { tag: 'meritocratic-wound', coef: -12, label: 'Already knowing what she is worth' },
          { tag: 'voice', coef: 10 },
          { tag: 'credential', coef: 9 },
        ],
      },
      aside:
        '"Be proud of how far you have come from where you started." Note the grammar: where she started ' +
        'is a thing she is being congratulated for having been given.',
    },

    /* ---------------- months ---------------- */
    {
      id: 'rosas-call',
      scale: 'months',
      when: 'Eight months ago. Tuesday, ten past six.',
      prose:
        'Rosa calls, which she does not do, and says that their father has been in for tests, and then ' +
        'there is a pause with a question in it that Rosa has decided not to say out loud.',
      options: [
        {
          id: 'ask',
          label: 'Ask what the tests were for',
          narration:
            'She asks. Rosa tells her. The call goes on for another nineteen minutes and neither of them ' +
            'says anything about four years, and at the end Rosa says, all right, and means something ' +
            'larger than all right.',
          confabulation:
            'She said she had to go. She was on the platform, the train was coming, it was a real train ' +
            'and a real platform, and that is what she has on file.',
          grants: [
            {
              id: 'f.asked-rosa',
              scale: 'months',
              label: 'Nineteen minutes with Rosa',
              tags: ['contact', 'rosa-open'],
              traitDeltas: { belonging: 8, trust: 5, empathyReach: 4 },
            },
          ],
        },
        {
          id: 'has-to-go',
          label: 'Say she has to go',
          narration:
            'She says the train is coming. The train is coming. Both things are true and only one of them ' +
            'is why she said it, and she will never be sure which, and neither will you.',
          confabulation:
            'She asked. They talked for nineteen minutes. She is fairly sure of this and she is wrong.',
          grants: [
            {
              id: 'f.let-the-pause-go',
              scale: 'months',
              label: 'The pause she let go past',
              tags: ['avoidance', 'silence'],
              traitDeltas: { belonging: -5, trust: -4 },
            },
          ],
        },
      ],
      weighing: {
        base: -7,
        baseLabel: 'There is a train and it is genuinely coming',
        traitTerms: [
          { trait: 'trust', coef: 15, label: 'Whether reaching out has ever been free' },
          { trait: 'belonging', coef: 12, label: 'Rosa' },
          { trait: 'stressLoad', coef: -11, label: 'What she is carrying this month' },
          { trait: 'empathyReach', coef: 8, label: 'How far the circle goes' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -12 },
          { tag: 'silence', coef: -8 },
          { tag: 'contact', coef: 11 },
          { tag: 'caretaking', coef: 6 },
        ],
      },
    },

    /* ---------------- weeks ---------------- */
    {
      id: 'the-diagnosis',
      scale: 'weeks',
      when: 'Three weeks ago. 22:50.',
      prose:
        'Rosa forwards the letter. It is a photograph of a letter, slightly crooked, taken on a kitchen ' +
        'table, and the word is in the second paragraph. The notification sits there.',
      options: [
        {
          id: 'read-it',
          label: 'Read it',
          narration:
            'She reads it twice and then looks up the five-year figures, which she should not have done, ' +
            'and then sits on the edge of the bath for a while. She knows the word now. Knowing it is ' +
            'worse and load-bearing.',
          confabulation:
            'She archived it. She meant to read it at the weekend. There have been three weekends.',
          grants: [
            {
              id: 'f.read-it',
              scale: 'weeks',
              label: 'Reading the second paragraph',
              detail: 'You cannot make a call about something you have decided not to know.',
              tags: ['knows', 'contact'],
              traitDeltas: { stressLoad: 10, empathyReach: 8, belonging: 4 },
            },
          ],
        },
        {
          id: 'archive-it',
          label: 'Archive it, read it at the weekend',
          narration:
            'She archives it. There have been three weekends. She has not thought about it in a way she ' +
            'would describe as thinking about it, and she has thought about it constantly.',
          confabulation:
            'She read it. She has the five-year figures somewhere. She does not, but she believes she does, ' +
            'which is nearly the same problem.',
          grants: [
            {
              id: 'f.unread',
              scale: 'weeks',
              label: 'Three weeks of not opening it',
              detail:
                'Each individual deferral was reasonable. The sum of them is a decision nobody made.',
              tags: ['unread', 'avoidance'],
              traitDeltas: { stressLoad: 8, empathyReach: -5 },
            },
          ],
        },
      ],
      weighing: {
        base: -6,
        baseLabel: 'It is ten to eleven and she has work at six',
        traitTerms: [
          { trait: 'threatSensitivity', coef: -16, label: 'What she does with an envelope' },
          { trait: 'stressLoad', coef: -12, label: 'Three weeks of this already' },
          { trait: 'empathyReach', coef: 12, label: 'How far the circle goes' },
          { trait: 'impulseControl', coef: 8, label: 'Whatever cortex is online at 22:50' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -13 },
          { tag: 'rosa-open', coef: 10 },
          { tag: 'contact', coef: 8 },
          { tag: 'caretaking', coef: 7 },
        ],
      },
    },
    {
      id: 'the-overtime',
      scale: 'weeks',
      when: 'Eleven days ago. The rota goes up.',
      prose:
        'Six doubles across two weeks. Nobody makes her take them. The rent went up in March and nobody ' +
        'made that happen either, as far as anyone can establish.',
      options: [
        {
          id: 'refuse',
          label: 'Take four, not six',
          narration:
            'She takes four. It is three hundred short and it is two nights of sleep, and she will not ' +
            'find out which of those mattered until much later, and neither will she then.',
          confabulation: 'She took all six. Of course she took all six.',
          grants: [
            {
              id: 'f.took-four',
              scale: 'weeks',
              label: 'Two nights she did not sell',
              tags: ['slack'],
              traitDeltas: { stressLoad: -6 },
              resourceDeltas: { money: -300, sleepDebt: -10 },
            },
          ],
        },
        {
          id: 'take-all-six',
          label: 'Take all six',
          narration:
            'She takes all six. The money is real. The sleep is also real, and only one of the two shows ' +
            'up on a payslip.',
          confabulation: 'She took four. She has no idea why she would have done that.',
          grants: [
            {
              id: 'f.took-six',
              scale: 'weeks',
              label: 'Six doubles in a fortnight',
              tags: ['sleep-debt', 'grind'],
              traitDeltas: { stressLoad: 12, impulseControl: -6 },
              resourceDeltas: { money: 300, sleepDebt: 16 },
            },
          ],
        },
      ],
      weighing: {
        base: -8,
        baseLabel: 'The rent went up in March',
        traitTerms: [
          { trait: 'conscientiousness', coef: -9, label: 'The habit of taking the shift' },
          { trait: 'stressLoad', coef: 10, label: 'A body that has started making the argument itself' },
          { trait: 'belonging', coef: 7, label: 'Whether there is anyone to be rested for' },
        ],
        tagTerms: [
          { tag: 'meritocratic-wound', coef: -9, label: 'Believing the money is what she is for' },
          { tag: 'inherited-stress', coef: -6 },
          { tag: 'sleep-fragile', coef: 5, label: 'A body that will make her pay for this' },
        ],
      },
    },

    /* ---------------- days (the continuous band starts) ---------------- */
    {
      id: 'the-rent',
      scale: 'days',
      when: 'Yesterday. 19:20.',
      prose:
        'The rent is nine days late and the app is open. Paying it now leaves her eighty until Friday. ' +
        'Not paying it now leaves her eighty until Friday as well, in a different way.',
      options: [
        {
          id: 'pay-it',
          label: 'Pay it',
          narration: 'She pays it. The number in the app becomes a smaller number and something in her chest lets go about four percent.',
          confabulation: 'She closed the app. She will do it Friday.',
          grants: [
            {
              id: 'f.paid',
              scale: 'days',
              label: 'Paying the rent nine days late',
              tags: ['settled'],
              traitDeltas: { stressLoad: -8 },
              resourceDeltas: { money: -400 },
            },
          ],
        },
        {
          id: 'let-it-ride',
          label: 'Close the app',
          narration:
            'She closes the app. It is now a thing that is happening in the background of everything else ' +
            'she does for the next nine days, at a low volume, using real cortisol.',
          confabulation: 'She paid it. She is fairly sure she paid it.',
          grants: [
            {
              id: 'f.unpaid',
              scale: 'days',
              label: 'Nine days of an unpaid rent running in the background',
              tags: ['background-debt'],
              traitDeltas: { stressLoad: 10, impulseControl: -4 },
            },
          ],
        },
      ],
      weighing: {
        base: 4,
        baseLabel: 'The app is already open',
        traitTerms: [
          { trait: 'conscientiousness', coef: 14, label: 'The habit of finishing things' },
          { trait: 'stressLoad', coef: -12, label: 'What is already running' },
          { trait: 'impulseControl', coef: 10, label: 'Cortex, 19:20, after a shift' },
        ],
        tagTerms: [
          { tag: 'grind', coef: -7 },
          { tag: 'settled', coef: 5 },
        ],
      },
    },
    {
      id: 'bedtime',
      scale: 'days',
      when: 'Last night. 00:40.',
      prose:
        'One more episode is eleven minutes of titles and forty of episode. The alarm is set for 05:40 ' +
        'and has been for eleven years.',
      options: [
        {
          id: 'sleep',
          label: 'Put the phone on the floor and sleep',
          narration:
            'She puts the phone face down on the floor, which is further away than the bedside table, ' +
            'which turns out to be the entire mechanism. Six hours. Not enough, and two hours better than ' +
            'the alternative.',
          confabulation: 'One more episode. She does not remember the end of it.',
          grants: [
            {
              id: 'f.slept',
              scale: 'days',
              label: 'Six hours instead of four',
              detail:
                'This is the cheapest fork in the path and, tonight, one of the loudest. That is the ' +
                'insult: the lever was right there and it was never about wanting it.',
              tags: ['slept'],
              traitDeltas: { impulseControl: 8, stressLoad: -6 },
              resourceDeltas: { sleepDebt: -22 },
            },
          ],
        },
        {
          id: 'one-more',
          label: 'One more episode',
          narration:
            'One more episode. She does not remember the end of it. Four hours and ten minutes, and the ' +
            'part of her that would have argued about it was the part that was already off.',
          confabulation:
            'She put the phone on the floor and went to sleep. She feels like someone who went to bed at ' +
            'a reasonable hour, which is a feeling, not a record.',
          grants: [
            {
              id: 'f.four-hours',
              scale: 'days',
              label: 'Four hours and ten minutes',
              detail:
                'Sleep deprivation hits the prefrontal cortex first and hardest. Every override she ' +
                'attempts tomorrow is being attempted with less machine.',
              tags: ['sleep-debt'],
              traitDeltas: { impulseControl: -12, stressLoad: 8 },
              resourceDeltas: { sleepDebt: 18 },
            },
          ],
        },
      ],
      weighing: {
        base: -11,
        baseLabel: 'Autoplay has already started the next one',
        traitTerms: [
          { trait: 'impulseControl', coef: 20, label: 'Cortex at twenty to one in the morning' },
          { trait: 'stressLoad', coef: -10, label: 'The day she has just had' },
          { trait: 'conscientiousness', coef: 8, label: 'The habit of doing the sensible thing' },
        ],
        tagTerms: [
          { tag: 'sleep-debt', coef: -7 },
          { tag: 'background-debt', coef: -6 },
          { tag: 'slack', coef: 6 },
          { tag: 'enrichment', coef: 5 },
        ],
      },
      aside:
        'Remember this one. It is going to come up again in about four hours of her time and ninety ' +
        'seconds of yours.',
    },

    /* ---------------- hours ---------------- */
    {
      id: 'the-lunch',
      scale: 'hours',
      when: 'Today. 13:05.',
      prose: 'Twenty-five minutes. The queue is eleven deep and there is a bag of something in her locker.',
      options: [
        {
          id: 'eat',
          label: 'Queue and eat properly',
          narration: 'She queues. She eats a hot thing sitting down. Her blood glucose does what blood glucose does, quietly, all afternoon.',
          confabulation: 'She worked through it. She usually works through it.',
          grants: [
            {
              id: 'f.ate',
              scale: 'hours',
              label: 'A hot meal, sitting down, at 13:05',
              detail:
                'Glucose availability tracks with self-control tasks about as well as anything measurable. ' +
                'It is a deeply unflattering finding and it is on the receipt.',
              tags: ['fed'],
              traitDeltas: { impulseControl: 7, stressLoad: -4 },
            },
          ],
        },
        {
          id: 'work-through',
          label: 'Work through it',
          narration:
            'She works through it and has the bag of something at 16:20 standing up. By nine in the evening ' +
            'she is running on almost nothing, and by eleven she will be making a decision on it.',
          confabulation: 'She queued and ate properly. She has a general sense of being someone who looks after herself.',
          grants: [
            {
              id: 'f.did-not-eat',
              scale: 'hours',
              label: 'Nothing until 16:20, standing up',
              tags: ['unfed'],
              traitDeltas: { impulseControl: -8, stressLoad: 5 },
            },
          ],
        },
      ],
      weighing: {
        base: -5,
        baseLabel: 'The queue is eleven deep and the break is twenty-five minutes',
        traitTerms: [
          { trait: 'conscientiousness', coef: 9, label: 'The habit of doing the sensible thing' },
          { trait: 'stressLoad', coef: -10, label: 'Six doubles in a fortnight, or not' },
          { trait: 'impulseControl', coef: 8, label: 'Whatever is online at one in the afternoon' },
        ],
        tagTerms: [
          { tag: 'sleep-debt', coef: -8, label: 'Four hours of sleep makes the queue unbearable' },
          { tag: 'grind', coef: -6 },
          { tag: 'slept', coef: 6 },
        ],
      },
    },
    {
      id: 'the-supervisor',
      scale: 'hours',
      when: 'Today. 17:48.',
      prose:
        'The new supervisor says it across the floor, in front of four people, and it is not a big thing, ' +
        'and it is the specific tone that her body has been trained since she was seven to treat as weather.',
      options: [
        {
          id: 'let-it-go',
          label: 'Let it go',
          narration:
            'She lets it go, which costs nothing visible and is not free. The cortisol has already been ' +
            'released; not responding does not recall it.',
          confabulation: 'She said something. It came out sharper than she meant and she has been replaying it since.',
          grants: [
            {
              id: 'f.absorbed',
              scale: 'hours',
              label: 'Absorbing it in front of four people',
              tags: ['absorbed', 'avoidance'],
              traitDeltas: { stressLoad: 9, threatSensitivity: 4 },
            },
          ],
        },
        {
          id: 'snap-back',
          label: 'Say something',
          narration:
            'She says something. It comes out sharper than she meant, because at 17:48 on four hours of ' +
            'sleep there is no volume control, and she carries it home in the shape of shame.',
          confabulation: 'She let it go. She lets everything go. She is proud of this in a way that costs her.',
          grants: [
            {
              id: 'f.snapped',
              scale: 'hours',
              label: 'Snapping at 17:48',
              tags: ['shame', 'voice'],
              traitDeltas: { stressLoad: 7, belonging: -3, trust: 2 },
            },
          ],
        },
      ],
      weighing: {
        base: -6,
        baseLabel: 'Four people are watching and the tone is familiar',
        traitTerms: [
          { trait: 'threatSensitivity', coef: -14, label: 'Weather, since she was seven' },
          { trait: 'impulseControl', coef: -10, label: 'What is left of the cortex at 17:48' },
          { trait: 'belonging', coef: 8, label: 'Whether anyone on the floor is hers' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -10 },
          { tag: 'unfed', coef: -7, label: 'Nothing since six in the morning' },
          { tag: 'sleep-debt', coef: -7 },
        ],
      },
    },

    /* ---------------- minutes ---------------- */
    {
      id: 'the-text',
      scale: 'minutes',
      when: 'Tonight. 23:12.',
      prose:
        'Rosa: "he\'s awake until about midnight most nights. just so you know." No question mark. Rosa ' +
        'has spent eight months not putting question marks on things.',
      options: [
        {
          id: 'reply',
          label: 'Reply',
          narration:
            'She types "ok" and then deletes it and then types "thank you" and sends that, and the sending ' +
            'of it is a small door being left on the latch.',
          confabulation: 'She read it and put the phone down. She will reply tomorrow.',
          grants: [
            {
              id: 'f.replied',
              scale: 'minutes',
              label: 'Sending "thank you" at 23:13',
              tags: ['contact', 'primed'],
              traitDeltas: { belonging: 5, trust: 3 },
            },
          ],
        },
        {
          id: 'put-it-down',
          label: 'Read it and put the phone down',
          narration:
            'She reads it twice and puts the phone face down on the arm of the sofa and it is still there, ' +
            'face down, at 23:41.',
          confabulation: 'She replied. She thinks she replied.',
          grants: [
            {
              id: 'f.no-reply',
              scale: 'minutes',
              label: 'No reply at 23:13',
              tags: ['avoidance'],
              traitDeltas: { belonging: -3 },
            },
          ],
        },
      ],
      weighing: {
        base: -4,
        baseLabel: 'There is no question mark, so there is nothing to answer',
        traitTerms: [
          { trait: 'trust', coef: 13, label: 'Whether answering has ever been cheap' },
          { trait: 'impulseControl', coef: 9, label: 'Cortex, 23:12, nineteen hours awake' },
          { trait: 'belonging', coef: 10, label: 'Rosa' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -10 },
          { tag: 'rosa-open', coef: 11 },
          { tag: 'unread', coef: -8, label: 'She still has not read the letter' },
          { tag: 'knows', coef: 9, label: 'She knows what the second paragraph said' },
          { tag: 'absorbed', coef: -5 },
        ],
      },
    },
    {
      id: 'the-kitchen',
      scale: 'minutes',
      when: 'Tonight. 23:28.',
      prose:
        'There is most of a bottle in the fridge door and there is a chair at the kitchen table, and she ' +
        'is standing in between them with her coat still on.',
      options: [
        {
          id: 'sit-down',
          label: 'Sit down at the table',
          narration:
            'She sits down at the table with her coat on and does not do anything for eleven minutes, ' +
            'which is not nothing.',
          confabulation: 'She poured a glass. It is a normal amount of wine for a Tuesday.',
          grants: [
            {
              id: 'f.sat',
              scale: 'minutes',
              label: 'Eleven minutes at the kitchen table, sober, coat on',
              tags: ['primed'],
              traitDeltas: { impulseControl: 5 },
            },
          ],
        },
        {
          id: 'pour-one',
          label: 'Pour a glass',
          narration:
            'She pours a glass. It is a normal amount of wine for a Tuesday and it is going into a body ' +
            'that has had four hours of sleep and one bag of something, and it goes straight to the part ' +
            'of her that would have made the call.',
          confabulation: 'She sat at the table with her coat on. She has been sober all evening. She has not been.',
          grants: [
            {
              id: 'f.poured',
              scale: 'minutes',
              label: 'A glass of wine into an empty, unslept body',
              detail: 'Alcohol takes the frontal cortex offline before anything else. It is famously selective.',
              tags: ['drink'],
              traitDeltas: { impulseControl: -11, threatSensitivity: -3 },
            },
          ],
        },
      ],
      weighing: {
        base: -7,
        baseLabel: 'The fridge is nearer than the chair',
        traitTerms: [
          { trait: 'impulseControl', coef: 18, label: 'Cortex at half eleven on four hours of sleep' },
          { trait: 'stressLoad', coef: -13, label: 'Everything the day has already put in' },
        ],
        tagTerms: [
          { tag: 'unfed', coef: -8 },
          { tag: 'sleep-debt', coef: -9 },
          { tag: 'slept', coef: 8 },
          { tag: 'shame', coef: -7, label: 'Carrying 17:48 home' },
          { tag: 'absorbed', coef: -5 },
        ],
      },
    },

    /* ---------------- seconds: THE ANCHOR ---------------- */
    {
      id: 'ten-digits',
      scale: 'seconds',
      anchor: true,
      when: 'Tonight. 23:41.',
      prose:
        'The number is still in her phone under "Dad", which she has never changed and never deleted and ' +
        'has thought about doing both. It is eleven digits, not ten, and it takes one thumb, and there is ' +
        'no version of this where anything physical is stopping her.',
      options: [
        {
          id: 'dial',
          label: 'Dial',
          narration:
            'She dials. It rings four times. He says her name like a question and gets it slightly wrong, ' +
            'the way he did when she was small, and neither of them says anything useful for six minutes, ' +
            'and then they talk about a boiler. It is a conversation about a boiler. It happened.',
          confabulation:
            'She put the phone face down. She has a reason. It is a good reason and she believes it ' +
            'completely: it is late, he will be asleep, she will do it properly at the weekend when she ' +
            'is not this tired. Every clause of that is true. None of it is why.',
        },
        {
          id: 'face-down',
          label: 'Put the phone face down',
          narration:
            'She puts the phone face down and goes to bed and lies there. Tomorrow is a shift. The number ' +
            'is still under "Dad" and will be for another fourteen months.',
          confabulation:
            'She dialled. Four rings. A conversation about a boiler. She cannot account for having done it ' +
            'and will describe it, later, as having finally decided to be the bigger person.',
        },
      ],
      weighing: {
        base: -11,
        baseLabel: 'Her thumb is already moving toward the lock button',
        traitTerms: [
          { trait: 'threatSensitivity', coef: -26, label: 'What his voice has always meant' },
          { trait: 'trust', coef: 18, label: 'Whether reaching out has ever been survivable' },
          { trait: 'impulseControl', coef: 15, label: 'The cortex available at 23:41' },
          { trait: 'empathyReach', coef: 13, label: 'Whether he is inside the circle' },
          { trait: 'stressLoad', coef: -14, label: 'Everything she is already carrying' },
          { trait: 'belonging', coef: 11, label: 'Whether anyone is on her side while she does it' },
          { trait: 'conscientiousness', coef: 6, label: 'The habit of doing the thing' },
        ],
        tagTerms: [
          { tag: 'avoidance', coef: -11, label: 'Twenty-four years of a strategy that has always worked' },
          { tag: 'silence', coef: -8 },
          { tag: 'unread', coef: -9, label: 'She never read the second paragraph' },
          { tag: 'knows', coef: 8, label: 'She read the second paragraph' },
          { tag: 'contact', coef: 5 },
          { tag: 'rosa-open', coef: 6 },
          { tag: 'primed', coef: 5 },
          { tag: 'drink', coef: -9 },
          { tag: 'sleep-debt', coef: -8 },
          { tag: 'slept', coef: 7 },
          { tag: 'unfed', coef: -6 },
          { tag: 'shame', coef: -6 },
          { tag: 'meritocratic-wound', coef: -5, label: 'Some part of her thinks this is what she gets' },
        ],
      },
    },
  ],

  epilogue: {
    onAnchorTaken:
      'She called. They talked about a boiler for nine minutes. He said "right then" at the end, which ' +
      'is what he says, and she sat in the kitchen afterwards and did not feel the thing she had assumed ' +
      'she would feel.',
    onAnchorRefused:
      'She did not call. She went to bed at ten past twelve and was asleep by half past, because she was ' +
      'extremely tired, and being extremely tired is a physical condition and not a verdict.',
    coda:
      'Either way: she did not build the house, or the street, or the rota, or the sleep requirement, or ' +
      'the thing her body does when a voice goes flat. Whatever happened tonight came out of all of it.\n\n' +
      'Don\'t let them tell you it\'s your fault. Don\'t let them tell you you earned it either.',
  },
}
