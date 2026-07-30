/* ===== ORDER VALIDATION REGISTRY ===== */
export const NAMED_TYPES = {
	item:      { min: 1, max: 500,   err: 'Please enter a valid Item# or Creature# (1-500)' }, // also used for creature#
	tower:     { min: 380, max: 399, err: 'Please enter a valid Tower# (380-399)' },
	group:     { min: 700, max: 799, err: 'Please enter a valid Group# (700-799)' },
	monster:   { min: 1000, max: 9999, err: 'Please enter a valid Monster# (1000-9,999)' },
	ap:        { min: 1, max: 1000,  err: 'Action Points spent must be between 1-1,000' },
	qty:       { min: 1, max: 10000, err: 'Please enter a valid quantity between 1-10,000' },
	yell:      { min: 1, max: 100,   err: 'Please enter a valid Yell# (1-100)' },
	direction: { isDirection: true,  err: 'Invalid value for order.' },
	combo:     { min: 1, max: 9999, err: 'Please enter a value between 1-9,999'}
};

export const ORDER_VALIDATION = {
	// Banking
	'Deposit Oculars':             { fields: ['qty', null] },
	'Open Account':                { fields: [null, null] },
	'Withdraw Oculars':            { fields: ['qty', null] },

	// Beastiary
	'Capture Creature':            { fields: ['item', null] },
	'Find Mount':                  { fields: [null, null] },
	'Kill Capture':                { fields: [null, null] },
	'Release Creature':            { fields: [null, null] },
	'Riding':                      { fields: [null, null] },

	// Chemistry
	'Green Lotus':                 { fields: [{exact: 258}, 'qty'], autofill: { 0:258 }, lockFields: [0] },
	'Pink Lotus':                  { fields: [{exact: 259}, 'qty'], autofill: { 0:259 }, lockFields: [0] },
	'White Lotus':                 { fields: [{exact: 19}, 'qty'], autofill: { 0:19 }, lockFields: [0] },

	// Combat
	'Battle Cry':                  { fields: [{ oneOf: [1, 5, 9] }, null] },
	'C1':                          { fields: ['ap', null] },
	'C2':                          { fields: ['ap', 'combo'] },
	'Risk':                        { fields: [{min: 1, max: 95}, null] },
	'No Attack':                   { fields: ['combo', null] },
	'Weapon Practice':             { fields: ['item', 'ap'] },
	'Wrestle Friend':              { fields: [null, null] },

	// Commerce
	'Automatic Sell':              { fields: ['item', null] },
	'Buy':                         { fields: ['item', 'qty'] },
	'Collect Bounty':              { fields: [null, null] },
	'Pay Troll':                   { fields: [null, null] },
	'Purchase':                    { fields: ['item', null] },
	'Ticket':                      { fields: [{ oneOf: [1, 2, 3, 4, 9] }, null] },
	'Repair':                      { fields: ['item', null] },
	'Sell':                        { fields: ['item', 'qty'] },

	// Construction
	'Call Wizard':                 { fields: [null, null] },
	'Sanctify':                    { fields: [null, null] },
	'Rebuild Ruins':               { fields: ['ap', null] },
	'Use Xanxu Construct':         { fields: [{ exact: 466 }, 'ap'], autofill: { 0: 466 }, lockFields: [0] },

	// Dogma
	'Follow Dark':                 { fields: [null, null] },
	'Follow Fuvah':                { fields: [null, null] },
	'Follow Light':                { fields: [null, null] },
	'Kowtow Kowtow':               { fields: [null, null] },

	// Fortifications
	'Enhance Fort':                { fields: [null, null] },
	'Fort Stay':                   { fields: [null, null] },
	'Guard Fort':                  { fields: [null, null] },

	// General
	'Bathe':                       { fields: [null, null] },
	'Dig':                         { fields: [{ min: 1, max: 24 }, null] },
	'Jazzercize':                  { fields: [{ min: 1, max: 50 }, null], autofill: { 0: 50 } },
	'Leverage Boulder':            { fields: [null, null] },
	"Loot":                        { fields: [null, null] },
	'Make':                        { fields: ['item', null] },
	'Nasty Fart':                  { fields: [null, null] },
	'Quest':                       { fields: ['ap', null] },
	'Transfer Item':               { fields: ['item', 'monster'] },
	'Trap Pit':                    { fields: [null, null] },
	'Use':                         { fields: ['item', null] },
	'Yell':                        { fields: ['yell', null] },

	// Group Mgmt
	'Get From Cache':              { fields: ['item', 'qty'] },
	'Glean Cache':                 { fields: [null, null] },
	'Group Leader':                { fields: ['monster', null] },
	'Initiation Ceremony':         { fields: ['monster', null] },
	'Join Group':                  { fields: ['group', null] },
	'Origin on Monster':           { fields: ['monster', null] },
	'Totem Marking':               { fields: [null, null] },

	// Holy Rites
	'Guard Temple':                { fields: [null, null] },
	'Kowtow':                      { fields: ['ap', null] },
	'Temple Sacrifice':            { fields: [null, null] },
	'Transfer Treasure':           { fields: ['item', 'qty'] },

	// Informational
	'List Knowledge':              { fields: [null, null] },
	'List Temples':                { fields: [null, null] },
	'Recenter Map':                { fields: [null, null] },
	'Reprint Creature Blurb':      { fields: ['item', null] },
	'Reprint Item Blurb':          { fields: ['item', null] },
	'Reprint Knowledge Blurb':     { fields: [{ min: 1, max: 2400 }, null] },
	'Reprint Spell Blurb':         { fields: ['ap', null] },

	// Inventory Mgmt
	'Bring From Store Room':       { fields: ['item', 'qty'] },
	'Equip':                       { fields: ['item', null] },
	'Item Pickup Limits':          { fields: [{ min: 11, max: 20 }, { min: 21, max: 40 }] },
	'Permanently Rid':             { fields: ['item', null] },
	'Place in Store Room':         { fields: ['item', 'qty'] },
	'Rid':                         { fields: ['item', null] },
	'Weekly Rid':                  { fields: ['item', null] },

	// Inn Services
	'Appraise Possessions':        { fields: [null, null] },
	'Inn Knowledge':               { fields: [{ oneOf: [1, 2, 3, 6, 7, 8, 9]}, null] },
	'Inn Stay':                    { fields: [{ oneOf: [3, 5, 7]}, null] },
	'Inn Weapon Training':         { fields: [{ oneOf: [1, 3, 5] }, null] },
	'Voodoo Instruction':          { fields: [{ oneOf: [2, 4, 6] }, null] },
	'Voodoo Master':               { fields: [null, null] },

	// Miscellaneous
	'Ancestral Ceremony':          { fields: [null, null] },
	'Diet':                        { fields: [null, null] },
	'Gather Items for AC':         { fields: [null, null] },
	'Gather Hairy Coconuts':       { fields: [null, null] },
	'Inform Zoingot':              { fields: [null, null] },
	'Learn Xanxu Construct':       { fields: [null, null] },

	// Movement
	'Cross Railway Bridge':        { fields: [null, null] },
	'Hide':                        { fields: [null, null] },
	'High Jungle Entry':           { fields: [null, null] },
	'Hunt Path':                   { fields: ['direction', 'direction'], prepend: 9 },
	'Hunt':                        { fields: ['direction', 'direction'] },
	'Attack':                      { fields: ['combo', null] },
	'Locate':                      { fields: ['combo', null] },
	'Snatch':                      { fields: ['combo', null] },
	'Travel':                      { fields: ['direction', 'direction'] },
	'Travel Path':                 { fields: ['direction', 'direction'], prepend: 9 },

	// Tower Services
	'Tower Admit Group':           { fields: ['tower', 'group'] },
	'Tower Admit Monster':         { fields: ['tower', 'monster'] },
	'Tower Skill Training':        { fields: [{ min: 1, max: 7 }, null] }, // Non-Spell Instructions
	'Tower Spell Training':        { fields: [{ min: 7, max: 9 }, null] }, // Tower Magic
	'Tower Stay':                  { fields: [{ oneOf: [1, 3, 5, 7] }, null] },
	'Tower Teleport':              { fields: ['tower', null] },
	'Troll Voodoo':                { fields: [{ min: 1, max: 3 }, null] },
};
