import { pool } from './pool.js';
import { hashPassword } from '../utils/password.js';

const DEMO_PASSWORD = 'quizcraft123';

const quizzes = [
  {
    creator: 'northstar',
    title: 'Everyday Science',
    description:
      'Ten small questions about the science hiding in ordinary days: the colour of the sky, the fizz in a glass and the reason bread smells so good.',
    category: 'Science',
    difficulty: 'easy',
    isPublic: true,
    ageDays: 2,
    questions: [
      {
        text: 'Why does the sky look blue on a clear day?',
        explanation:
          'Tiny gas molecules scatter short blue wavelengths of sunlight far more than long red ones. This is called Rayleigh scattering.',
        options: [
          ['The ocean reflects its colour into the air', false],
          ['Blue light is scattered more than red light', true],
          ['The atmosphere contains blue gas', false],
          ['Clouds absorb every colour except blue', false],
        ],
      },
      {
        text: 'Which gas do plants take from the air for photosynthesis?',
        explanation:
          'Plants use carbon dioxide and water to make sugars, releasing oxygen as a by-product.',
        options: [
          ['Oxygen', false],
          ['Nitrogen', false],
          ['Carbon dioxide', true],
          ['Hydrogen', false],
        ],
      },
      {
        text: 'What lets a paperclip rest on the surface of water?',
        explanation:
          'Water molecules pull on one another at the surface, creating a skin called surface tension.',
        options: [
          ['Surface tension', true],
          ['The paperclip is lighter than air', false],
          ['Magnetism in the water', false],
          ['Tiny air bubbles inside the clip', false],
        ],
      },
      {
        text: 'Which colour of visible light carries the most energy per photon?',
        explanation:
          'Violet light has the shortest wavelength in the visible spectrum, so each photon carries more energy than a red one.',
        options: [
          ['Red', false],
          ['Green', false],
          ['Yellow', false],
          ['Violet', true],
        ],
      },
      {
        text: 'What is the main reason hot food smells stronger than cold food?',
        explanation:
          'Heat gives molecules more energy, so more of them leave the food and reach the receptors in your nose.',
        options: [
          ['Warm air carries smells faster', false],
          ['More scent molecules escape into the air', true],
          ['Cold food has no scent molecules', false],
          ['Your nose works harder when food is hot', false],
        ],
      },
      {
        text: 'Why does ice float on water?',
        explanation:
          'Water expands as it freezes. The open crystal lattice of ice is less dense than the liquid around it.',
        options: [
          ['It traps air inside the block', false],
          ['It is less dense than liquid water', true],
          ['It is always warmer than the water', false],
          ['It repels water at the surface', false],
        ],
      },
      {
        text: 'Which gas is released when baking soda reacts with vinegar?',
        explanation:
          'The acid and the bicarbonate react to produce carbon dioxide, which forms the bubbles you see.',
        options: [
          ['Oxygen', false],
          ['Hydrogen', false],
          ['Carbon dioxide', true],
          ['Nitrogen', false],
        ],
      },
      {
        text: 'Why do chopped onions make your eyes water?',
        explanation:
          'Cutting an onion releases sulfur compounds. They react with the moisture in your eyes to form a mild acid.',
        options: [
          ['They release pepper oil', false],
          ['Sulfur compounds react with moisture in the eyes', true],
          ['They are colder than the air', false],
          ['They release oxygen into the air', false],
        ],
      },
      {
        text: 'Which gas makes up most of Earth\'s atmosphere?',
        explanation:
          'Nitrogen makes up about 78 percent of the air. Oxygen is roughly 21 percent.',
        options: [
          ['Oxygen', false],
          ['Nitrogen', true],
          ['Carbon dioxide', false],
          ['Argon', false],
        ],
      },
      {
        text: 'Why does a metal spoon feel colder than a wooden one?',
        explanation:
          'Both are at room temperature, but metal carries heat away from your hand much faster, so it feels colder.',
        options: [
          ['The metal is actually colder', false],
          ['Metal conducts heat away faster', true],
          ['Wood stores warmth from the room', false],
          ['Metal reflects body heat', false],
        ],
      },
    ],
  },
  {
    creator: 'northstar',
    title: '1969: A Year in Motion',
    description:
      'A Moon landing, a muddy farm and a very large aeroplane. Ten questions about a year that kept moving.',
    category: 'History',
    difficulty: 'medium',
    isPublic: true,
    ageDays: 5,
    questions: [
      {
        text: 'Who was the first person to walk on the Moon?',
        explanation:
          'Neil Armstrong stepped onto the lunar surface on 20 July 1969 during the Apollo 11 mission.',
        options: [
          ['Buzz Aldrin', false],
          ['Neil Armstrong', true],
          ['Michael Collins', false],
          ['Yuri Gagarin', false],
        ],
      },
      {
        text: 'Which music festival took place on a dairy farm in August 1969?',
        explanation:
          'Woodstock was held at Yasgur\'s farm near Bethel, New York, and drew an estimated 400,000 people.',
        options: [
          ['Monterey Pop', false],
          ['Glastonbury', false],
          ['Woodstock', true],
          ['Isle of Wight', false],
        ],
      },
      {
        text: 'Which airliner made its first flight in February 1969?',
        explanation:
          'The Boeing 747, often called the jumbo jet, first flew on 9 February 1969.',
        options: [
          ['Concorde', false],
          ['Boeing 747', true],
          ['Airbus A300', false],
          ['Douglas DC-10', false],
        ],
      },
      {
        text: 'Which two countries fought a brief border conflict in 1969?',
        explanation:
          'The Sino-Soviet border conflict flared around Zhenbao Island in March 1969.',
        options: [
          ['India and Pakistan', false],
          ['The Soviet Union and China', true],
          ['North and South Korea', false],
          ['Egypt and Israel', false],
        ],
      },
      {
        text: 'Which rocket launched the Apollo 11 mission?',
        explanation:
          'The Saturn V carried the Apollo 11 crew away from Earth on 16 July 1969.',
        options: [
          ['Atlas V', false],
          ['Saturn V', true],
          ['Falcon 9', false],
          ['Titan II', false],
        ],
      },
      {
        text: 'Which country sent the Venera 5 probe to Venus in 1969?',
        explanation:
          'The Soviet Union sent Venera 5 and Venera 6 to Venus in 1969. Both entered the planet\'s atmosphere.',
        options: [
          ['The United States', false],
          ['The Soviet Union', true],
          ['France', false],
          ['Japan', false],
        ],
      },
      {
        text: 'Who was president of the United States when Apollo 11 landed?',
        explanation:
          'Richard Nixon took office in January 1969 and spoke to the crew by radio from the White House.',
        options: [
          ['Lyndon Johnson', false],
          ['John F. Kennedy', false],
          ['Richard Nixon', true],
          ['Gerald Ford', false],
        ],
      },
      {
        text: 'Which supersonic airliner made its first flight in 1969?',
        explanation:
          'Concorde first flew on 2 March 1969. It went on to carry passengers for 27 years.',
        options: [
          ['Concorde', true],
          ['Boeing 707', false],
          ['Airbus A300', false],
          ['Lockheed TriStar', false],
        ],
      },
      {
        text: 'Which children\'s programme debuted on American television in November 1969?',
        explanation:
          'Sesame Street first aired on 10 November 1969, mixing puppets, animation and early literacy.',
        options: [
          ['Mister Rogers\' Neighborhood', false],
          ['Sesame Street', true],
          ['The Electric Company', false],
          ['Blue\'s Clues', false],
        ],
      },
      {
        text: 'What name is given to the period of conflict in Northern Ireland that intensified in 1969?',
        explanation:
          'British troops were deployed in August 1969. The following decades of sectarian conflict are known as the Troubles.',
        options: [
          ['The Boer War', false],
          ['The Troubles', true],
          ['The Falklands War', false],
          ['The Spanish Civil War', false],
        ],
      },
    ],
  },
  {
    creator: 'northstar',
    title: 'Before the Browser',
    description:
      'A short history of early computing, from a moth in a relay to the first message sent across the ARPANET.',
    category: 'Technology',
    difficulty: 'hard',
    isPublic: true,
    ageDays: 8,
    questions: [
      {
        text: 'What were the first characters sent over the ARPANET in 1969?',
        explanation:
          'The team tried to send "LOGIN" but the system crashed after "LO". The first message was therefore just "LO".',
        options: [
          ['LO', true],
          ['Hello', false],
          ['LOGIN', false],
          ['PING', false],
        ],
      },
      {
        text: 'Who is often credited with writing the first published computer algorithm?',
        explanation:
          'Ada Lovelace described an algorithm for Charles Babbage\'s Analytical Engine in the 1840s.',
        options: [
          ['Grace Hopper', false],
          ['Ada Lovelace', true],
          ['Alan Turing', false],
          ['John von Neumann', false],
        ],
      },
      {
        text: 'What did the 1971 Creeper program do?',
        explanation:
          'Creeper moved between ARPANET computers and printed a message, making it an early self-replicating program.',
        options: [
          ['It encrypted files for the military', false],
          ['It moved between computers and printed a message', true],
          ['It drew the first computer animation', false],
          ['It sorted punched cards', false],
        ],
      },
      {
        text: 'What was found in the Harvard Mark II logbook in 1947?',
        explanation:
          'A moth trapped in a relay was taped into the logbook with the note "first actual case of bug being found".',
        options: [
          ['A moth', true],
          ['A broken vacuum tube', false],
          ['A handwritten virus', false],
          ['A lost punch card', false],
        ],
      },
      {
        text: 'Which company released the first commercially available microprocessor?',
        explanation:
          'Intel released the 4004 in 1971. It packed a CPU onto a single chip.',
        options: [
          ['IBM', false],
          ['Intel', true],
          ['Motorola', false],
          ['AMD', false],
        ],
      },
      {
        text: 'What does ENIAC stand for?',
        explanation:
          'ENIAC was the Electronic Numerical Integrator and Computer, completed in 1945.',
        options: [
          ['Electronic Numerical Integrator and Computer', true],
          ['Electric Network Interface and Controller', false],
          ['Early Numeric Input and Calculation', false],
          ['Electronic Node for Integrated Arithmetic Circuits', false],
        ],
      },
      {
        text: 'Which programming language did Grace Hopper help develop?',
        explanation:
          'Hopper worked on the design of COBOL, a language meant to read more like English than machine code.',
        options: [
          ['Fortran', false],
          ['COBOL', true],
          ['C', false],
          ['Java', false],
        ],
      },
      {
        text: 'What material was the first computer mouse made from?',
        explanation:
          'Douglas Engelbart\'s prototype in the 1960s had a carved wooden shell and two metal wheels.',
        options: [
          ['Bakelite', false],
          ['Wood', true],
          ['Aluminium', false],
          ['Hard rubber', false],
        ],
      },
      {
        text: 'Which 1977 computer helped bring personal computing into homes?',
        explanation:
          'The Apple II was one of the first successful mass-market home computers, sold with colour graphics and an expandable case.',
        options: [
          ['Altair 8800', false],
          ['Apple II', true],
          ['Commodore PET', false],
          ['IBM PC', false],
        ],
      },
      {
        text: 'What does HTTP stand for?',
        explanation:
          'Hypertext Transfer Protocol is the set of rules a browser and a web server use to exchange pages.',
        options: [
          ['High Transfer Text Protocol', false],
          ['Hypertext Transfer Protocol', true],
          ['Hosted Text Transport Process', false],
          ['Hyperlink Transmission Type Protocol', false],
        ],
      },
    ],
  },
  {
    creator: 'paper_plane',
    title: 'Rivers and Their Cities',
    description:
      'Cities grow around water. Match ten rivers to the places they run through.',
    category: 'Geography',
    difficulty: 'medium',
    isPublic: true,
    ageDays: 1,
    questions: [
      {
        text: 'Which river runs through Cairo?',
        explanation:
          'Cairo sits on the Nile, just south of the river\'s wide delta.',
        options: [
          ['The Nile', true],
          ['The Euphrates', false],
          ['The Niger', false],
          ['The Jordan', false],
        ],
      },
      {
        text: 'Which river runs through Vienna?',
        explanation:
          'The Danube flows through Vienna, Bratislava, Budapest and Belgrade before reaching the Black Sea.',
        options: [
          ['The Rhine', false],
          ['The Elbe', false],
          ['The Danube', true],
          ['The Vistula', false],
        ],
      },
      {
        text: 'Which river runs through Baghdad?',
        explanation:
          'Baghdad stands on the Tigris, close to where it approaches the Euphrates.',
        options: [
          ['The Tigris', true],
          ['The Indus', false],
          ['The Amu Darya', false],
          ['The Orontes', false],
        ],
      },
      {
        text: 'Which river runs through Seoul?',
        explanation:
          'The Han River divides Seoul into north and south and continues to the Yellow Sea.',
        options: [
          ['The Han', true],
          ['The Mekong', false],
          ['The Pearl', false],
          ['The Irrawaddy', false],
        ],
      },
      {
        text: 'Which river runs through Lisbon?',
        explanation:
          'Lisbon looks out over the Tagus, the longest river on the Iberian Peninsula.',
        options: [
          ['The Douro', false],
          ['The Tagus', true],
          ['The Ebro', false],
          ['The Guadalquivir', false],
        ],
      },
      {
        text: 'Which river runs through Paris?',
        explanation:
          'The Seine curves through Paris, passing the Louvre and Notre-Dame before reaching the English Channel.',
        options: [
          ['The Seine', true],
          ['The Loire', false],
          ['The Rhone', false],
          ['The Garonne', false],
        ],
      },
      {
        text: 'Which river runs through Rome?',
        explanation:
          'The Tiber runs through Rome. The ancient city grew on its banks and on the hills beside it.',
        options: [
          ['The Po', false],
          ['The Tiber', true],
          ['The Arno', false],
          ['The Adige', false],
        ],
      },
      {
        text: 'Which river runs through New Orleans?',
        explanation:
          'New Orleans sits on the Mississippi, near the river\'s long delta at the Gulf of Mexico.',
        options: [
          ['The Missouri', false],
          ['The Mississippi', true],
          ['The Colorado', false],
          ['The Rio Grande', false],
        ],
      },
      {
        text: 'Which river runs through London?',
        explanation:
          'The Thames flows through central London and east to the North Sea.',
        options: [
          ['The Severn', false],
          ['The Thames', true],
          ['The Mersey', false],
          ['The Tyne', false],
        ],
      },
      {
        text: 'Which river runs through Delhi?',
        explanation:
          'Delhi stands beside the Yamuna, a tributary of the Ganges.',
        options: [
          ['The Ganges', false],
          ['The Yamuna', true],
          ['The Brahmaputra', false],
          ['The Godavari', false],
        ],
      },
    ],
  },
  {
    creator: 'paper_plane',
    title: 'Kitchen Chemistry',
    description:
      'Why bread browns, apples darken and vinegar tastes sharp. Ten questions for anyone who has stood at a stove.',
    category: 'Food',
    difficulty: 'easy',
    isPublic: true,
    ageDays: 12,
    questions: [
      {
        text: 'What turns a slice of bread golden brown in a toaster?',
        explanation:
          'The Maillard reaction between sugars and amino acids creates the colour and many of the toasted flavours.',
        options: [
          ['Caramelisation of sugar alone', false],
          ['The Maillard reaction', true],
          ['Steam escaping the crumb', false],
          ['Burning off the flour', false],
        ],
      },
      {
        text: 'Why does a cut apple turn brown?',
        explanation:
          'Enzymes in the apple react with oxygen when the fruit is cut, producing brown compounds.',
        options: [
          ['It dries out', false],
          ['Enzymes react with oxygen', true],
          ['Sugar turns to salt', false],
          ['The seeds release starch', false],
        ],
      },
      {
        text: 'Which gas makes bread dough rise?',
        explanation:
          'Yeast ferments sugars and releases carbon dioxide, which gets trapped in the gluten network.',
        options: [
          ['Oxygen', false],
          ['Carbon dioxide', true],
          ['Nitrogen', false],
          ['Hydrogen', false],
        ],
      },
      {
        text: 'What is the main acid in vinegar?',
        explanation:
          'Vinegar is mostly water with acetic acid, usually between 4 and 8 percent.',
        options: [
          ['Citric acid', false],
          ['Lactic acid', false],
          ['Acetic acid', true],
          ['Tartaric acid', false],
        ],
      },
      {
        text: 'What gives chilli peppers their heat?',
        explanation:
          'Capsaicin binds to heat receptors on the tongue and makes the brain register burning without real heat.',
        options: [
          ['Capsaicin', true],
          ['Caffeine', false],
          ['Gluten', false],
          ['Pectin', false],
        ],
      },
      {
        text: 'Why does salt melt ice on a road?',
        explanation:
          'Salt lowers the freezing point of water, so the ice turns to liquid at temperatures where it would otherwise stay solid.',
        options: [
          ['It heats the ice directly', false],
          ['It lowers the freezing point of water', true],
          ['It absorbs the water', false],
          ['It turns the ice into sugar', false],
        ],
      },
      {
        text: 'What happens to sugar when it caramelises?',
        explanation:
          'Heat breaks the sugar molecules apart and they recombine into brown, bitter-sweet compounds.',
        options: [
          ['It turns into salt', false],
          ['It breaks down and browns', true],
          ['It becomes a protein', false],
          ['It freezes solid', false],
        ],
      },
      {
        text: 'Why does lemon juice stop a cut apple turning brown?',
        explanation:
          'The vitamin C in lemon juice reacts with oxygen before the apple\'s enzymes can, so the browning reaction slows.',
        options: [
          ['It coats the fruit in sugar', false],
          ['Its vitamin C reacts with oxygen first', true],
          ['It kills every enzyme permanently', false],
          ['It adds a red colour', false],
        ],
      },
      {
        text: 'What makes whisked egg whites hold air?',
        explanation:
          'Whisking unfolds the proteins, which then link into a network that traps air bubbles.',
        options: [
          ['Fat molecules trap the air', false],
          ['Proteins unfold and form a foam', true],
          ['Sugar crystals harden', false],
          ['Water turns to steam', false],
        ],
      },
      {
        text: 'Which two ingredients react in baking powder to make bubbles?',
        explanation:
          'Baking powder pairs sodium bicarbonate with an acid. When moisture and heat arrive, they release carbon dioxide.',
        options: [
          ['Salt and pepper', false],
          ['Sodium bicarbonate and an acid', true],
          ['Flour and water', false],
          ['Sugar and butter', false],
        ],
      },
    ],
  },
  {
    creator: 'paper_plane',
    title: 'Art in a Frame',
    description:
      'Ten questions about painters, movements and the places their work lives now.',
    category: 'Arts',
    difficulty: 'easy',
    isPublic: true,
    ageDays: 3,
    questions: [
      {
        text: 'Who painted The Starry Night?',
        explanation:
          'Vincent van Gogh painted it in 1889 while staying at an asylum in Saint-Remy-de-Provence.',
        options: [
          ['Claude Monet', false],
          ['Vincent van Gogh', true],
          ['Paul Gauguin', false],
          ['Henri Matisse', false],
        ],
      },
      {
        text: 'Which art movement is Claude Monet associated with?',
        explanation:
          'Monet was a founder of Impressionism, a movement that focused on light and immediate perception.',
        options: [
          ['Cubism', false],
          ['Impressionism', true],
          ['Surrealism', false],
          ['Baroque', false],
        ],
      },
      {
        text: 'Where is the Mona Lisa displayed?',
        explanation:
          'The painting hangs in the Louvre in Paris, behind protective glass.',
        options: [
          ['The Uffizi', false],
          ['The Prado', false],
          ['The Louvre', true],
          ['The Met', false],
        ],
      },
      {
        text: 'Who painted Guernica?',
        explanation:
          'Pablo Picasso painted Guernica in 1937 in response to the bombing of the Basque town.',
        options: [
          ['Pablo Picasso', true],
          ['Salvador Dali', false],
          ['Joan Miro', false],
          ['Diego Rivera', false],
        ],
      },
      {
        text: 'Who painted the ceiling of the Sistine Chapel?',
        explanation:
          'Michelangelo painted the chapel ceiling between 1508 and 1512 for Pope Julius II.',
        options: [
          ['Raphael', false],
          ['Michelangelo', true],
          ['Leonardo da Vinci', false],
          ['Titian', false],
        ],
      },
      {
        text: 'Which art movement is Salvador Dali associated with?',
        explanation:
          'Dali was one of the best-known Surrealists, painting dreamlike scenes with precise, realistic detail.',
        options: [
          ['Impressionism', false],
          ['Surrealism', true],
          ['Cubism', false],
          ['Realism', false],
        ],
      },
      {
        text: 'Who sculpted The Thinker?',
        explanation:
          'Auguste Rodin made The Thinker as part of a larger work, The Gates of Hell, and later cast it on its own.',
        options: [
          ['Auguste Rodin', true],
          ['Michelangelo', false],
          ['Gian Lorenzo Bernini', false],
          ['Constantin Brancusi', false],
        ],
      },
      {
        text: 'Which artist made Campbell\'s Soup Cans?',
        explanation:
          'Andy Warhol turned everyday consumer products into Pop Art, including his 1962 series of soup cans.',
        options: [
          ['Roy Lichtenstein', false],
          ['Andy Warhol', true],
          ['Jasper Johns', false],
          ['Robert Rauschenberg', false],
        ],
      },
      {
        text: 'Which New York museum is known for its modern art collection?',
        explanation:
          'The Museum of Modern Art, or MoMA, holds one of the best-known collections of modern and contemporary art.',
        options: [
          ['The Met', false],
          ['MoMA', true],
          ['The Guggenheim', false],
          ['The Whitney', false],
        ],
      },
      {
        text: 'Who painted Las Meninas?',
        explanation:
          'Diego Velazquez painted Las Meninas in 1656. It hangs in the Prado in Madrid.',
        options: [
          ['Francisco Goya', false],
          ['Diego Velazquez', true],
          ['El Greco', false],
          ['Bartolome Murillo', false],
        ],
      },
    ],
  },
  {
    creator: 'northstar',
    title: 'Clouds, Draft',
    description:
      'A private work in progress about cloud names and the weather they bring.',
    category: 'Science',
    difficulty: 'easy',
    isPublic: false,
    ageDays: 0,
    questions: [
      {
        text: 'Which cloud type forms the flat base of a thunderstorm?',
        explanation:
          'A cumulonimbus cloud often has a dark, flat base and a tall, anvil-shaped top.',
        options: [
          ['Cirrus', false],
          ['Cumulonimbus', true],
          ['Stratus', false],
          ['Altocumulus', false],
        ],
      },
      {
        text: 'What does the prefix "cirro" usually describe?',
        explanation:
          'Cirro- refers to high, wispy clouds made mostly of ice crystals.',
        options: [
          ['Low and grey', false],
          ['High and wispy', true],
          ['Rain-bearing', false],
          ['Fog-like', false],
        ],
      },
      {
        text: 'Which cloud is high, thin and made mostly of ice crystals?',
        explanation:
          'Cirrus clouds form high in the troposphere, where the air is cold enough for ice crystals to grow.',
        options: [
          ['Stratus', false],
          ['Cirrus', true],
          ['Cumulus', false],
          ['Nimbostratus', false],
        ],
      },
      {
        text: 'Which cloud produces steady, grey rain?',
        explanation:
          'Nimbostratus is a thick, layered cloud that can cover the sky and release continuous rain or snow.',
        options: [
          ['Cirrocumulus', false],
          ['Nimbostratus', true],
          ['Altocumulus', false],
          ['Cirrus', false],
        ],
      },
      {
        text: 'What is fog?',
        explanation:
          'Fog is simply a cloud that has formed at ground level, close enough to reduce visibility.',
        options: [
          ['A cloud at ground level', true],
          ['Rain that never reaches the ground', false],
          ['A layer of dust in the air', false],
          ['Steam from warm soil', false],
        ],
      },
      {
        text: 'What does the cloud name "cumulus" mean?',
        explanation:
          'Cumulus comes from the Latin for heap or pile, which describes the cloud\'s rounded shape.',
        options: [
          ['Layer', false],
          ['Heap', true],
          ['Rain', false],
          ['Feather', false],
        ],
      },
      {
        text: 'What causes clouds to form?',
        explanation:
          'Rising air cools. When it reaches its dew point, water vapour condenses onto tiny particles and becomes visible droplets.',
        options: [
          ['Air warms and expands', false],
          ['Rising air cools and water vapour condenses', true],
          ['Sunlight turns oxygen into water', false],
          ['Wind pushes dust into the upper atmosphere', false],
        ],
      },
      {
        text: 'Which prefix means a middle-level cloud?',
        explanation:
          'Alto- sits between the high cirro- clouds and the low strato- clouds.',
        options: [
          ['Cirro-', false],
          ['Alto-', true],
          ['Strato-', false],
          ['Nimbo-', false],
        ],
      },
      {
        text: 'Which cloud is a uniform grey layer that can cover the whole sky?',
        explanation:
          'Stratus forms a flat, featureless layer. It can bring drizzle or simply a grey day.',
        options: [
          ['Cumulus', false],
          ['Stratus', true],
          ['Cirrus', false],
          ['Cumulonimbus', false],
        ],
      },
      {
        text: 'What are clouds made of?',
        explanation:
          'Clouds are visible collections of tiny water droplets, ice crystals, or a mixture of both.',
        options: [
          ['Dust and smoke', false],
          ['Tiny water droplets or ice crystals', true],
          ['Liquid oxygen', false],
          ['Compressed air', false],
        ],
      },
    ],
  },
{
    creator: 'northstar',
    title: 'The Small Screen',
    description:
      'Ten questions about the shows people quote, binge and argue about long after the credits.',
    category: 'Film and TV',
    difficulty: 'easy',
    isPublic: true,
    ageDays: 4,
    questions: [
      {
        text: 'Which sitcom is set in the fictional town of Pawnee, Indiana?',
        explanation:
          'Parks and Recreation follows the parks department of Pawnee, led by Leslie Knope.',
        options: [
          ['The Office', false],
          ['Parks and Recreation', true],
          ['Brooklyn Nine-Nine', false],
          ['Community', false],
        ],
      },
      {
        text: 'What is the coffee shop in Friends called?',
        explanation:
          'Central Perk is the group\'s regular meeting place, complete with the orange sofa.',
        options: [
          ['Central Perk', true],
          ['The Coffee Bean', false],
          ['Monk\'s Cafe', false],
          ['Cafe Nervosa', false],
        ],
      },
      {
        text: 'Which animated family lives in Springfield?',
        explanation:
          'The Simpsons has been set in Springfield since its first full episode in 1989.',
        options: [
          ['The Griffins', false],
          ['The Simpsons', true],
          ['The Belchers', false],
          ['The Smiths', false],
        ],
      },
      {
        text: 'Which series follows Walter White\'s descent into crime?',
        explanation:
          'Breaking Bad begins with a chemistry teacher diagnosed with cancer and ends with a drug empire.',
        options: [
          ['Better Call Saul', false],
          ['Breaking Bad', true],
          ['The Wire', false],
          ['Narcos', false],
        ],
      },
      {
        text: 'Which company employs the characters in The Office (US)?',
        explanation:
          'Dunder Mifflin is the paper company at the centre of the mockumentary.',
        options: [
          ['Initech', false],
          ['Dunder Mifflin', true],
          ['Wernham Hogg', false],
          ['Prestige Worldwide', false],
        ],
      },
      {
        text: 'Which series is set in the town of Hawkins, Indiana?',
        explanation:
          'Stranger Things begins in 1983 in Hawkins, where a boy disappears and a girl with powers appears.',
        options: [
          ['Dark', false],
          ['Stranger Things', true],
          ['Twin Peaks', false],
          ['Riverdale', false],
        ],
      },
      {
        text: 'Which science fiction series features the starship Enterprise?',
        explanation:
          'Star Trek follows the crew of the Enterprise across several series and films.',
        options: [
          ['Battlestar Galactica', false],
          ['Star Trek', true],
          ['Firefly', false],
          ['The Expanse', false],
        ],
      },
      {
        text: 'Which British series follows the Crawley family and their servants?',
        explanation:
          'Downton Abbey runs from the sinking of the Titanic through the 1920s.',
        options: [
          ['Downton Abbey', true],
          ['Poldark', false],
          ['The Crown', false],
          ['Call the Midwife', false],
        ],
      },
      {
        text: 'Who created and stars in the series Fleabag?',
        explanation:
          'Phoebe Waller-Bridge wrote and starred in Fleabag, which began as a one-woman stage show.',
        options: [
          ['Michaela Coel', false],
          ['Phoebe Waller-Bridge', true],
          ['Sharon Horgan', false],
          ['Issa Rae', false],
        ],
      },
      {
        text: 'Which series is based on the novels of George R. R. Martin?',
        explanation:
          'Game of Thrones adapts A Song of Ice and Fire, beginning with the novel A Game of Thrones.',
        options: [
          ['The Witcher', false],
          ['Game of Thrones', true],
          ['The Wheel of Time', false],
          ['His Dark Materials', false],
        ],
      },
    ],
  },
  {
    creator: 'northstar',
    title: 'Everyday Inventions',
    description:
      'Ten objects and ideas that quietly rearranged ordinary life, from the telephone to the web.',
    category: 'General',
    difficulty: 'easy',
    isPublic: true,
    ageDays: 6,
    questions: [
      {
        text: 'Who is credited with inventing the telephone?',
        explanation:
          'Alexander Graham Bell received the first US patent for the telephone in 1876.',
        options: [
          ['Thomas Edison', false],
          ['Alexander Graham Bell', true],
          ['Nikola Tesla', false],
          ['Guglielmo Marconi', false],
        ],
      },
      {
        text: 'What did Johannes Gutenberg introduce to Europe?',
        explanation:
          'Gutenberg combined movable metal type, oil-based ink and a press to make books far faster.',
        options: [
          ['Movable-type printing', true],
          ['The steam engine', false],
          ['Paper money', false],
          ['The compass', false],
        ],
      },
      {
        text: 'Who built the first successful powered aeroplane?',
        explanation:
          'Orville and Wilbur Wright made the first controlled, powered flight at Kitty Hawk in 1903.',
        options: [
          ['The Wright brothers', true],
          ['Otto Lilienthal', false],
          ['Samuel Langley', false],
          ['Louis Bleriot', false],
        ],
      },
      {
        text: 'What did Thomas Edison make practical for homes?',
        explanation:
          'Edison developed a long-lasting incandescent bulb and the electrical systems needed to supply it.',
        options: [
          ['The incandescent light bulb', true],
          ['The telephone', false],
          ['The radio', false],
          ['The television', false],
        ],
      },
      {
        text: 'Who invented the World Wide Web?',
        explanation:
          'Tim Berners-Lee proposed the web at CERN in 1989 and built the first browser and server.',
        options: [
          ['Vint Cerf', false],
          ['Tim Berners-Lee', true],
          ['Alan Turing', false],
          ['Steve Wozniak', false],
        ],
      },
      {
        text: 'What garment did Levi Strauss popularise?',
        explanation:
          'Levi Strauss made durable work trousers from denim, which became the blue jeans we know today.',
        options: [
          ['The trench coat', false],
          ['Blue jeans', true],
          ['The bowler hat', false],
          ['The silk tie', false],
        ],
      },
      {
        text: 'Who improved the steam locomotive called Rocket?',
        explanation:
          'George Stephenson\'s Rocket won the Rainhill Trials in 1829 and helped set the pattern for later locomotives.',
        options: [
          ['James Watt', false],
          ['George Stephenson', true],
          ['Richard Trevithick', false],
          ['Isambard Kingdom Brunel', false],
        ],
      },
      {
        text: 'What did John Logie Baird demonstrate in 1926?',
        explanation:
          'Baird gave the first public demonstration of a working television system in London.',
        options: [
          ['Television', true],
          ['Radar', false],
          ['The fax machine', false],
          ['The tape recorder', false],
        ],
      },
      {
        text: 'What did Percy Spencer\'s radar work lead to?',
        explanation:
          'Spencer noticed a chocolate bar melting near a magnetron, which led to the microwave oven.',
        options: [
          ['The microwave oven', true],
          ['The mobile phone', false],
          ['The GPS receiver', false],
          ['The X-ray machine', false],
        ],
      },
      {
        text: 'Who patented the first practical sewing machine in the United States?',
        explanation:
          'Elias Howe patented his lockstitch sewing machine in 1846. Isaac Singer later improved and popularised it.',
        options: [
          ['Elias Howe', true],
          ['Isaac Singer', false],
          ['Samuel Morse', false],
          ['Cyrus McCormick', false],
        ],
      },
    ],
  },
  {
    creator: 'paper_plane',
    title: 'Songs That Changed the Room',
    description:
      'Ten questions about the songs, voices and records that can fill a room in seconds.',
    category: 'Music',
    difficulty: 'medium',
    isPublic: true,
    ageDays: 7,
    questions: [
      {
        text: 'Which band recorded Bohemian Rhapsody?',
        explanation:
          'Queen released Bohemian Rhapsody in 1975. Its six-minute structure and operatic section were unusual for a single.',
        options: [
          ['The Beatles', false],
          ['Queen', true],
          ['Led Zeppelin', false],
          ['Pink Floyd', false],
        ],
      },
      {
        text: 'Who is known as the Queen of Soul?',
        explanation:
          'Aretha Franklin earned the title through hits such as Respect and Think.',
        options: [
          ['Diana Ross', false],
          ['Aretha Franklin', true],
          ['Etta James', false],
          ['Tina Turner', false],
        ],
      },
      {
        text: 'Which Beatles album includes Come Together?',
        explanation:
          'Come Together opens Abbey Road, released in 1969.',
        options: [
          ['Let It Be', false],
          ['Abbey Road', true],
          ['Revolver', false],
          ['Sgt. Pepper\'s Lonely Hearts Club Band', false],
        ],
      },
      {
        text: 'What instrument does Yo-Yo Ma play?',
        explanation:
          'Yo-Yo Ma is a cellist known for both classical repertoire and cross-genre collaborations.',
        options: [
          ['Violin', false],
          ['Cello', true],
          ['Viola', false],
          ['Double bass', false],
        ],
      },
      {
        text: 'Which artist released Bad Guy?',
        explanation:
          'Billie Eilish released Bad Guy in 2019 on her debut album, When We All Fall Asleep, Where Do We Go?',
        options: [
          ['Billie Eilish', true],
          ['Lorde', false],
          ['Halsey', false],
          ['Dua Lipa', false],
        ],
      },
      {
        text: 'Which genre is Bob Marley most associated with?',
        explanation:
          'Bob Marley brought reggae to a global audience with songs such as No Woman, No Cry and Three Little Birds.',
        options: [
          ['Ska', false],
          ['Reggae', true],
          ['Calypso', false],
          ['Soul', false],
        ],
      },
      {
        text: 'Who composed The Four Seasons?',
        explanation:
          'Antonio Vivaldi wrote the four violin concertos in 1725, each representing a season.',
        options: [
          ['Johann Sebastian Bach', false],
          ['Antonio Vivaldi', true],
          ['Wolfgang Amadeus Mozart', false],
          ['Joseph Haydn', false],
        ],
      },
      {
        text: 'What was the first music video shown on MTV?',
        explanation:
          'MTV launched on 1 August 1981 with Video Killed the Radio Star by The Buggles.',
        options: [
          ['Thriller', false],
          ['Video Killed the Radio Star', true],
          ['Money for Nothing', false],
          ['Take On Me', false],
        ],
      },
      {
        text: 'Which Motown group featured Diana Ross?',
        explanation:
          'Diana Ross sang with The Supremes before starting a solo career.',
        options: [
          ['The Marvelettes', false],
          ['The Supremes', true],
          ['The Temptations', false],
          ['The Four Tops', false],
        ],
      },
      {
        text: 'Which composer wrote the Ninth Symphony with Ode to Joy?',
        explanation:
          'Beethoven completed the Ninth Symphony in 1824. Its final movement sets Schiller\'s poem Ode to Joy.',
        options: [
          ['Mozart', false],
          ['Beethoven', true],
          ['Brahms', false],
          ['Tchaikovsky', false],
        ],
      },
    ],
  },
  {
    creator: 'paper_plane',
    title: 'Rules of the Game',
    description:
      'Ten rules, records and rituals from the games people play, watch and argue about.',
    category: 'Sports',
    difficulty: 'medium',
    isPublic: true,
    ageDays: 9,
    questions: [
      {
        text: 'How many players does a football (soccer) team field?',
        explanation:
          'A team fields eleven players, including the goalkeeper.',
        options: [
          ['Nine', false],
          ['Ten', false],
          ['Eleven', true],
          ['Twelve', false],
        ],
      },
      {
        text: 'In tennis, what is a score of zero called?',
        explanation:
          'Zero is called love, a term whose origin is debated but long established in the sport.',
        options: [
          ['Nil', false],
          ['Love', true],
          ['Duck', false],
          ['Blank', false],
        ],
      },
      {
        text: 'How many points is a touchdown worth in American football?',
        explanation:
          'A touchdown is worth six points. The team can then attempt a one- or two-point conversion.',
        options: [
          ['Three', false],
          ['Six', true],
          ['Seven', false],
          ['Eight', false],
        ],
      },
      {
        text: 'What is the maximum break in snooker?',
        explanation:
          'A maximum break is 147: fifteen reds, each followed by a black, then the colours in order.',
        options: [
          ['100', false],
          ['120', false],
          ['147', true],
          ['155', false],
        ],
      },
      {
        text: 'How many players are in a cricket team?',
        explanation:
          'Each side fields eleven players. The batting side sends two batters out at a time.',
        options: [
          ['Nine', false],
          ['Ten', false],
          ['Eleven', true],
          ['Twelve', false],
        ],
      },
      {
        text: 'Which sport uses a shuttlecock?',
        explanation:
          'Badminton players hit a shuttlecock, also called a birdie, across a high net.',
        options: [
          ['Squash', false],
          ['Badminton', true],
          ['Table tennis', false],
          ['Padel', false],
        ],
      },
      {
        text: 'How long is an Olympic swimming pool?',
        explanation:
          'An Olympic pool is 50 metres long. Short-course pools are 25 metres.',
        options: [
          ['25 metres', false],
          ['40 metres', false],
          ['50 metres', true],
          ['100 metres', false],
        ],
      },
      {
        text: 'What colour card sends a footballer off?',
        explanation:
          'A red card means dismissal. A second yellow card in the same match also produces a red.',
        options: [
          ['Yellow', false],
          ['Red', true],
          ['Green', false],
          ['Black', false],
        ],
      },
      {
        text: 'How many points is a basketball free throw worth?',
        explanation:
          'A free throw is worth one point. Shots made from beyond the arc are worth three.',
        options: [
          ['One', true],
          ['Two', false],
          ['Three', false],
          ['Four', false],
        ],
      },
      {
        text: 'Which country won the first FIFA World Cup in 1930?',
        explanation:
          'Uruguay hosted and won the 1930 tournament, beating Argentina 4-2 in the final.',
        options: [
          ['Brazil', false],
          ['Argentina', false],
          ['Uruguay', true],
          ['Italy', false],
        ],
      },
    ],
  },
];

async function insertQuiz(client, creatorId, quiz) {
  const quizResult = await client.query(
    `INSERT INTO quizzes
       (creator_id, title, description, category, difficulty, is_public, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now() - make_interval(days => $7::int), now() - make_interval(days => $7::int))
     RETURNING id`,
    [
      creatorId,
      quiz.title,
      quiz.description,
      quiz.category,
      quiz.difficulty,
      quiz.isPublic,
      quiz.ageDays,
    ],
  );

  const quizId = quizResult.rows[0].id;

  for (const [index, question] of quiz.questions.entries()) {
    const questionResult = await client.query(
      `INSERT INTO questions (quiz_id, text, explanation, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [quizId, question.text, question.explanation, index + 1],
    );

    const questionId = questionResult.rows[0].id;

    for (const [optionIndex, [text, isCorrect]] of question.options.entries()) {
      await client.query(
        `INSERT INTO answer_options (question_id, text, is_correct, position)
         VALUES ($1, $2, $3, $4)`,
        [questionId, text, isCorrect, optionIndex + 1],
      );
    }
  }

  return quizId;
}

async function seedAttempt(client, { userId, quizId, correctCount, ageDays }) {
  const questionsResult = await client.query(
    `SELECT id, text, explanation, position
     FROM questions
     WHERE quiz_id = $1
     ORDER BY position`,
    [quizId],
  );

  const attemptResult = await client.query(
    `INSERT INTO quiz_attempts
       (quiz_id, user_id, score, total_questions, started_at, completed_at)
     VALUES ($1, $2, $3, $4,
       now() - make_interval(days => $5) - interval '12 minutes',
       now() - make_interval(days => $5))
     RETURNING id`,
    [quizId, userId, correctCount, questionsResult.rowCount, ageDays],
  );

  const attemptId = attemptResult.rows[0].id;

  for (const [index, question] of questionsResult.rows.entries()) {
    const optionsResult = await client.query(
      `SELECT id, text, is_correct
       FROM answer_options
       WHERE question_id = $1
       ORDER BY position`,
      [question.id],
    );

    const correct = optionsResult.rows.find((option) => option.is_correct);
    const wrong = optionsResult.rows.find((option) => !option.is_correct);
    const selected = index < correctCount ? correct : wrong;

    await client.query(
      `INSERT INTO attempt_answers
         (attempt_id, question_id, answer_option_id, question_position,
          question_text, selected_text, correct_text, explanation, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        attemptId,
        question.id,
        selected.id,
        question.position,
        question.text,
        selected.text,
        correct.text,
        question.explanation,
        selected.is_correct,
      ],
    );
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM users WHERE username = $1',
      ['northstar'],
    );

    if (existing.rowCount > 0) {
      console.log('Demo data is already present. Nothing to do.');
      return;
    }

    await client.query('BEGIN');

    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const users = {};

    for (const username of ['northstar', 'paper_plane']) {
      const result = await client.query(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [username, passwordHash],
      );
      users[username] = result.rows[0].id;
    }

    const quizIds = {};
    for (const quiz of quizzes) {
      quizIds[quiz.title] = await insertQuiz(
        client,
        users[quiz.creator],
        quiz,
      );
    }

    await seedAttempt(client, {
      userId: users.northstar,
      quizId: quizIds['Rivers and Their Cities'],
      correctCount: 8,
      ageDays: 1,
    });

    await seedAttempt(client, {
      userId: users.northstar,
      quizId: quizIds['Art in a Frame'],
      correctCount: 7,
      ageDays: 3,
    });

    await seedAttempt(client, {
      userId: users.paper_plane,
      quizId: quizIds['Everyday Science'],
      correctCount: 9,
      ageDays: 2,
    });

    await client.query('COMMIT');

    console.log('Demo data added.');
    console.log('Log in as northstar with password quizcraft123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Could not seed the database:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
