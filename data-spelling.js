// SATBot — SPaG Paper 2: Spelling Sets (multiple years)
// Words drawn from the KS2 Year 5/6 statutory spelling list and common patterns.

const SPELLING_SETS = [
  {
    year: "2024",
    words: [
      {id:1,  word:"necessary",     sentence:"It is ___ to have a good breakfast before school.",                         category:"Single/double letters", tip:"One collar (c), two socks (ss): ne-C-e-SS-ary"},
      {id:2,  word:"accommodate",   sentence:"The host was happy to ___ all of the guests' requests.",                   category:"Double letters",         tip:"Two cots, two mattresses: a-CC-o-MM-odate"},
      {id:3,  word:"conscience",    sentence:"He listened to his ___ and decided to tell the truth.",                    category:"Silent letters",         tip:"Silent 'sc' — con-SCIENCE contains the word 'science'"},
      {id:4,  word:"rhythm",        sentence:"She tapped her foot to keep the ___ of the music.",                        category:"No vowel pattern",       tip:"Rhythm Has Your Two Hips Moving — R·H·Y·T·H·M"},
      {id:5,  word:"mischievous",   sentence:"The ___ puppy had chewed all of the sofa cushions.",                       category:"Common misspelling",     tip:"mis-CHIEV-ous — not 'mischeivous', no extra 'i' at the end"},
      {id:6,  word:"embarrass",     sentence:"She hoped the mistake would not ___ her in front of the class.",           category:"Double letters",         tip:"Double r, double s: em-BAR-RASS"},
      {id:7,  word:"relevant",       sentence:"Make sure that all of your points are ___ to the question.",              category:"Common misspelling",     tip:"REL-ev-ant — ends in '-ant' not '-ent': relev-ANT"},
      {id:8,  word:"exaggerate",    sentence:"He tends to ___ whenever he tells stories about his adventures.",           category:"Double letters",         tip:"Double g in the middle: ex-AG-GER-ate"},
      {id:9,  word:"parliament",    sentence:"New laws are debated and voted on in ___.",                                 category:"Hidden letters",         tip:"There is 'I AM' inside par-I-AM-ent? No — par-LIA-ment — spot the 'ia'"},
      {id:10, word:"recommend",     sentence:"I would ___ this book to anyone who enjoys adventure stories.",             category:"Single/double letters",  tip:"One c, two m's: re-C-om-MM-end"},
      {id:11, word:"privilege",     sentence:"Meeting the author in person was a real ___.",                              category:"Common misspelling",     tip:"priv-I-lege — the middle vowel is 'i', not 'e' or 'a'"},
      {id:12, word:"disastrous",    sentence:"The ___ storm caused widespread damage across the entire region.",          category:"Common misspelling",     tip:"dis-AST-rous — no 'e' before '-rous' (unlike 'disaster')"},
      {id:13, word:"immediately",   sentence:"The dog ran to the door ___ when it heard the lead rattle.",               category:"Double letters",         tip:"im-MED-iate-ly — double m, keep the 'e' from 'immediate'"},
      {id:14, word:"apparent",      sentence:"It was ___ to everyone that she had worked extremely hard.",                category:"Double letters",         tip:"Double p: ap-PAR-ent"},
      {id:15, word:"profession",    sentence:"A surgeon follows a very demanding and skilled ___.",                       category:"Word endings",           tip:"pro-FES-sion — built on 'profess'"},
      {id:16, word:"sufficient",    sentence:"There was not ___ food for the whole team.",                               category:"Word endings",           tip:"suf-FICI-ent — double f, then '-icient'"},
      {id:17, word:"temperature",   sentence:"The ___ in the oven had risen to two hundred degrees.",                    category:"Hidden letters",         tip:"tem-PER-a-ture — don't drop the 'a': temp-er-A-ture"},
      {id:18, word:"vehicle",       sentence:"The ___ had stopped in the middle of the narrow country road.",            category:"Silent letters",         tip:"ve-HI-cle — the 'h' is voiced; don't forget the 'e' at the end"},
      {id:19, word:"guarantee",     sentence:"She could not ___ that the parcel would arrive by Thursday.",              category:"Common misspelling",     tip:"guar-AN-TEE — double e at the end, and 'guar' not 'gar'"},
      {id:20, word:"prejudice",     sentence:"It is unkind and unfair to treat others with ___.",                        category:"Prefixes",               tip:"PRE-jud-ice — pre (before) + judice (judging)"}
    ]
  },
  {
    year: "2023",
    words: [
      {id:1,  word:"receive",       sentence:"She could not wait to ___ her birthday present in the post.",             category:"ei/ie rule",             tip:"i before e EXCEPT after c — re-CEI-ve"},
      {id:2,  word:"separate",      sentence:"Please ___ the clean plates from the dirty ones.",                        category:"Common misspelling",     tip:"sep-A-rate — the middle vowel is 'a', not 'e'"},
      {id:3,  word:"muscle",        sentence:"He strained a ___ in his shoulder during training.",                      category:"Silent letters",         tip:"musc-LE — the 'c' is silent: MUS-el"},
      {id:4,  word:"signature",     sentence:"The artist's ___ was written in ink at the corner of the painting.",      category:"Word endings",           tip:"sign-A-ture — built on 'sign', keep the silent 'g'"},
      {id:5,  word:"neighbour",     sentence:"Our ___ brought us fresh soup when we were unwell.",                      category:"ei/ie rule",             tip:"neigh-BOUR — 'ei' not 'ie', plus silent 'gh'"},
      {id:6,  word:"committee",     sentence:"The school ___ voted to plant a new wildlife garden.",                    category:"Double letters",         tip:"Three doubles: com-M-ITT-EE"},
      {id:7,  word:"individual",    sentence:"Each ___ in the group had a different responsibility.",                   category:"Many syllables",         tip:"in-di-VID-u-al — five syllables, say each one clearly"},
      {id:8,  word:"competition",   sentence:"She entered every spelling ___ she could find.",                          category:"Common misspelling",     tip:"com-pe-TI-tion — built on 'compete', not 'competetion'"},
      {id:9,  word:"thorough",      sentence:"The mechanic carried out a ___ check of the entire engine.",              category:"Silent letters",         tip:"thor-OUGH — the '-ough' ending is silent: 'thur-uh'"},
      {id:10, word:"frequently",    sentence:"He ___ visited the local library to find new books.",                     category:"Word endings",           tip:"fre-QUENT-ly — built on 'frequent', add '-ly'"},
      {id:11, word:"variety",       sentence:"The market stall offered a wide ___ of fresh fruits.",                   category:"Word endings",           tip:"var-I-ety — 'i' before '-ety'"},
      {id:12, word:"stomach",       sentence:"She rubbed her ___ after eating far too much cake.",                      category:"Silent letters",         tip:"stom-ACH — the 'ch' makes a 'k' sound"},
      {id:13, word:"curiosity",     sentence:"Her ___ was sparked the moment she spotted the hidden door.",             category:"Word building",          tip:"cur-I-osity — built on 'curious', drop the '-ous' add '-ity'"},
      {id:14, word:"sacrifice",     sentence:"He was willing to ___ his playtime to help his friend finish.",           category:"Word endings",           tip:"sac-ri-FICE — '-fice' ending, like 'office'"},
      {id:15, word:"symbol",        sentence:"The dove has long been a ___ of peace around the world.",                category:"Vowel choices",          tip:"SYM-bol — 'y' not 'i': think 'symbol' not 'simbol'"},
      {id:16, word:"programme",     sentence:"She circled her favourite shows in the television ___.",                  category:"British English",        tip:"pro-GRAMME — British spelling keeps the double 'm' and final 'e'"},
      {id:17, word:"average",       sentence:"Her ___ score across all three tests was eighty-two per cent.",          category:"Common words",           tip:"AV-er-age — three syllables: av·er·age"},
      {id:18, word:"correspond",    sentence:"The email did not ___ with what he had told us in person.",               category:"Prefixes",               tip:"cor-re-SPOND — double 'r' from Latin prefix 'cor-'"},
      {id:19, word:"hindrance",     sentence:"The traffic was a serious ___ to the emergency vehicles.",               category:"Word building",          tip:"HIND-rance — built on 'hinder', drop the '-er' add '-rance'"},
      {id:20, word:"nuisance",      sentence:"The noisy building work next door was a terrible ___.",                  category:"French origin",          tip:"nui-SANCE — 'nui' from French nuire; watch the '-sance' ending"}
    ]
  },
  {
    year: "2022",
    words: [
      {id:1,  word:"lightning",     sentence:"The bright ___ lit up the entire sky during the storm.",                  category:"Common confusion",       tip:"LIGHT-ning — different from 'lightening' (making lighter); no 'e'"},
      {id:2,  word:"language",      sentence:"She was learning a new ___ at her evening class.",                       category:"Silent letters",         tip:"lan-GUAGE — silent 'u' after 'g': lang·u·age"},
      {id:3,  word:"leisure",       sentence:"In his ___ time, he enjoyed painting and reading.",                      category:"ei/ie exception",        tip:"LEI-sure — 'ei' not 'ie'; an exception to the i-before-e rule"},
      {id:4,  word:"marvellous",    sentence:"What a ___ performance the school choir gave!",                          category:"British English",        tip:"mar-VELL-ous — British spelling doubles the 'l' (US: marvelous)"},
      {id:5,  word:"queue",         sentence:"She joined the long ___ and waited patiently for an hour.",             category:"Unusual spelling",       tip:"QUEUE — five letters, only the 'Q' is heard; say: 'kyoo'"},
      {id:6,  word:"ancient",       sentence:"The ___ ruins had stood for over two thousand years.",                   category:"Word endings",           tip:"an-CIENT — '-cient' ending: ancient, efficient, sufficient"},
      {id:7,  word:"definite",      sentence:"There is no ___ answer to that particular question.",                    category:"Common misspelling",     tip:"DEF-in-ite — 'i' in the middle, not 'a': defin-ITE not definATE"},
      {id:8,  word:"desperate",     sentence:"He was ___ to find his lost phone before the long journey.",             category:"Common misspelling",     tip:"des-PER-ate — 'per' in the middle, not 'par': desper-ATE"},
      {id:9,  word:"develop",       sentence:"Scientists hope to ___ a better treatment for the illness.",             category:"Common misspelling",     tip:"de-VEL-op — no 'e' at the end: develop not develope"},
      {id:10, word:"dictionary",    sentence:"She looked up the meaning of the word in the ___.",                     category:"Many syllables",         tip:"DIC-tion-ary — four syllables: dic·tion·ar·y"},
      {id:11, word:"excellent",     sentence:"The teacher was extremely pleased with her ___ work.",                   category:"Word endings",           tip:"EX-cell-ent — double 'l': excel + lent"},
      {id:12, word:"familiar",      sentence:"The smell of fresh bread baking was pleasantly ___.",                   category:"Common misspelling",     tip:"fa-MIL-iar — one 'l', ends in '-iar' not '-er'"},
      {id:13, word:"government",    sentence:"The ___ introduced new measures to help reduce pollution.",              category:"Silent letters",         tip:"gov-ERN-ment — the first 'n' is silent when speaking: 'guvvament'"},
      {id:14, word:"interrupt",     sentence:"It is very rude to ___ when someone else is speaking.",                 category:"Double letters",         tip:"inter-RUPT — double 'r': in·ter·rupt"},
      {id:15, word:"occupy",        sentence:"The builders would ___ the site for at least six months.",              category:"Double letters",         tip:"OC-cu-py — double 'c': oc·cu·py"},
      {id:16, word:"persuade",      sentence:"She tried to ___ her parents to let her get a pet rabbit.",             category:"Word endings",           tip:"per-SUADE — '-suade' ending; think: per-SWAYED"},
      {id:17, word:"physical",      sentence:"The athletes had to pass a strict ___ fitness test.",                   category:"Greek origins",          tip:"PHYS-ical — 'ph' makes an 'f' sound; from Greek 'physis'"},
      {id:18, word:"secretary",     sentence:"The ___ organised all the meetings for the head teacher.",              category:"Hidden letters",         tip:"sec-RE-tary — there is a hidden 're': sec·re·tar·y"},
      {id:19, word:"twelfth",       sentence:"She was delighted to finish in ___ place in the national competition.",  category:"Consonant clusters",     tip:"TWELFTH — say all the consonants: tw·el·f·th"},
      {id:20, word:"vegetable",     sentence:"He made sure to include a ___ in every meal he cooked.",               category:"Many syllables",         tip:"VEG-et-able — three syllables: veg·et·able (the 'e' in 'veg' sounds like a short 'e')"}
    ]
  }
];

if (typeof window !== 'undefined') window.SPELLING_SETS = SPELLING_SETS;
