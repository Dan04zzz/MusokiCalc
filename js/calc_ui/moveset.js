(function () {
    let movesetInitialized = false;
    let activeTab = 'reminder'; // 'reminder', 'level'
    let searchTerm = '';

    // Database parsed from MOSSE MODIFICATE AI POKEMON.pdf
    const movesetDatabase = {
        "reminder": [
            { "species": "Weavile", "moves": ["Ice Punch", "Ice Shard", "Fake Out"] },
            { "species": "Meganium", "moves": ["Ancient Power", "Leech Seed", "Leaf Storm"] },
            { "species": "Typhlosion", "moves": ["Extrasensory", "Flare Blitz", "Howl", "Reversal"] },
            { "species": "Feraligatr", "moves": ["Aqua Jet", "Dragon Claw"] },
            { "species": "Jumpluff", "moves": ["Encore"] },
            { "species": "Ariados", "moves": ["Toxic Spikes"] },
            { "species": "Honchkrow", "moves": ["Drill Peck"] },
            { "species": "Granbull", "moves": ["Close Combat"] },
            { "species": "Ninetales", "moves": ["Spite", "Power Swap"] },
            { "species": "Azumarill", "moves": ["Perish Song", "Aqua Jet", "Superpower"] },
            { "species": "Persian", "moves": ["Charm"] },
            { "species": "Golduck", "moves": ["Psychic", "Encore"] },
            { "species": "Cloyster", "moves": ["Rock Blast"] },
            { "species": "Tangrowth", "moves": ["Leech Seed", "Leaf Storm"] },
            { "species": "Vaporeon", "moves": ["Wish"] },
            { "species": "Flareon", "moves": ["Wish"] },
            { "species": "Jolteon", "moves": ["Wish"] },
            { "species": "Espeon", "moves": ["Wish"] },
            { "species": "Umbreon", "moves": ["Wish"] },
            { "species": "Leafeon", "moves": ["Wish"] },
            { "species": "Glaceon", "moves": ["Wish"] },
            { "species": "Ursaring", "moves": ["Double-Edge", "Close Combat", "Night Slash"] },
            { "species": "Donphan", "moves": ["Ice Shard", "Counter"] },
            { "species": "Mantine", "moves": ["Mirror Coat"] },
            { "species": "Skarmory", "moves": ["Roost", "Drill Peck", "Curse"] },
            { "species": "Marowak", "moves": ["Detect", "Iron Head"] },
            { "species": "Houndoom", "moves": ["Dark Pulse"] },
            { "species": "Mismagius", "moves": ["Destiny Bond"] },
            { "species": "Wigglytuff", "moves": ["Wish"] },
            { "species": "Venomoth", "moves": ["Morning Sun", "Giga Drain"] },
            { "species": "Furret", "moves": ["Trick", "Substitute", "Charm"] },
            { "species": "Quagsire", "moves": ["Recover", "Counter"] },
            { "species": "Hypno", "moves": ["Role Play"] },
            { "species": "Muk", "moves": ["Shadow Punch", "Shadow Sneak"] },
            { "species": "Weezing", "moves": ["Will-O-Wisp", "Pain Split"] },
            { "species": "Ambipom", "moves": ["Spite", "Fake Out"] },
            { "species": "Hitmontop", "moves": ["Mach Punch", "Bullet Punch"] },
            { "species": "Jynx", "moves": ["Wish", "Nasty Plot"] },
            { "species": "Farfetch'd", "moves": ["Leaf Blade", "Feather Dance"] },
            { "species": "Kingler", "moves": ["Tickle"] },
            { "species": "Octillery", "moves": ["Water Spout"] },
            { "species": "Lickilicky", "moves": ["Substitute"] },
            { "species": "Rapidash", "moves": ["Charm", "Morning Sun"] },
            { "species": "Kangaskhan", "moves": ["Counter", "Hammer Arm", "Double-Edge"] }
        ],
        "level": [
            {
                "species": "Delibird",
                "moves": [
                    { "level": 4, "move": "Quick Attack" },
                    { "level": 8, "move": "Peck" },
                    { "level": 14, "move": "Ice Shard" },
                    { "level": 18, "move": "Ice Ball" },
                    { "level": 25, "move": "Fake Out" },
                    { "level": 28, "move": "Aurora Beam" },
                    { "level": 33, "move": "Future Sight" },
                    { "level": 37, "move": "Ice Punch" },
                    { "level": 41, "move": "Pluck" },
                    { "level": 44, "move": "Ice Beam" },
                    { "level": 50, "move": "Fling" }
                ]
            },
            {
                "species": "Shuckle",
                "moves": [
                    { "level": 87, "move": "Acupressure" }
                ]
            }
        ]
    };

    function getSpriteFilename(species) {
        if (!species) return 'default';
        return species.toLowerCase()
            .replace(/['.]+/g, '')
            .replace(/[ :-]+/g, '-')
            .replace(/-totem$/g, '')
            .replace(/^-|-glitched$|-$/g, '');
    }

    function getTypeColor(type) {
        const colors = {
            'Normal': '#A8A77A',
            'Fire': '#EE8130',
            'Water': '#6390F0',
            'Electric': '#F7D02C',
            'Grass': '#7AC74C',
            'Ice': '#96D9D6',
            'Fighting': '#C22E28',
            'Poison': '#A33EA1',
            'Ground': '#E2BF65',
            'Flying': '#A98FF3',
            'Psychic': '#F95587',
            'Bug': '#A6B91A',
            'Rock': '#B6A136',
            'Ghost': '#735797',
            'Dragon': '#6F35FC',
            'Dark': '#705746',
            'Steel': '#B7B7CE',
            'Fairy': '#D685AD',
            '???': '#68A090'
        };
        return colors[type] || '#718096';
    }

    function getCategoryColor(cat) {
        if (cat === 'Physical') return '#e71d36';
        if (cat === 'Special') return '#3a86c8';
        return '#718096'; // Status
    }

    function loadMovesetPokemon(speciesName, defaultLvl) {
        if (typeof window.importDdexTemporaryOpponent === 'function') {
            window.importDdexTemporaryOpponent("### DDEX_TEMP_OPPONENT v1\n" + speciesName + "\nLevel: " + defaultLvl + "\n### DDEX_TEMP_OPPONENT v1");
        } else {
            // Fallback set selector
            const selector = $('.opposing.set-selector');
            const prefix = speciesName + " (";
            let foundValue = null;
            selector.find('option').each(function() {
                const val = $(this).val();
                if (val && val.startsWith(prefix)) {
                    foundValue = val;
                    return false;
                }
            });
            if (foundValue) {
                selector.val(foundValue).change();
                const select2Chosen = $('.opposing .select2-chosen').first();
                if (select2Chosen.length) {
                    select2Chosen.text(foundValue);
                }
            }
        }
        
        // Go back to calculator view
        if (typeof window.setMainPageView === 'function') {
            window.setMainPageView('calculator');
        }
    }

    // Function to render custom Movesets tab
    function renderMovesetView() {
        const slot = document.getElementById('moveset-view-frame-slot');
        if (!slot) return;

        let baseShell = slot.querySelector('.custom-movesets-container');
        if (!baseShell) {
            slot.innerHTML = '';

            // Inject CSS Styles
            const styleId = 'custom-movesets-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .custom-movesets-container {
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 65px);
                        background: #111116;
                        color: #e2e8f0;
                        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                        box-sizing: border-box;
                        padding: 15px 20px;
                    }
                    .movesets-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        gap: 15px;
                    }
                    .movesets-header h2 {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        color: #2ec4b6;
                        letter-spacing: 0.5px;
                    }
                    .movesets-search-bar {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex-grow: 1;
                        max-width: 400px;
                    }
                    .movesets-search-input {
                        width: 100%;
                        padding: 8px 14px;
                        background: #1e1e2f;
                        border: 1px solid #2a2a40;
                        border-radius: 6px;
                        color: #fff;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }
                    .movesets-search-input:focus {
                        border-color: #2ec4b6;
                        box-shadow: 0 0 0 2px rgba(46,196,182,0.2);
                    }
                    .movesets-tab-container {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 12px;
                        border-bottom: 1px solid #2a2a40;
                        padding-bottom: 8px;
                    }
                    .movesets-tab-btn {
                        padding: 6px 14px;
                        background: transparent;
                        border: 1px solid transparent;
                        border-radius: 4px;
                        color: #a0aec0;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .movesets-tab-btn:hover {
                        color: #fff;
                        background: #1e1e2f;
                    }
                    .movesets-tab-btn.active {
                        color: #fff;
                        background: #2ec4b6;
                        border-color: #2ec4b6;
                    }
                    .movesets-grid {
                        flex-grow: 1;
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 15px;
                        padding: 10px 5px;
                        overflow-y: auto;
                        min-height: 0;
                    }
                    .movesets-card {
                        background: #1e1e2f;
                        border: 1px solid #2a2a40;
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        flex-direction: column;
                        transition: all 0.2s;
                        position: relative;
                        cursor: pointer;
                    }
                    .movesets-card:hover {
                        border-color: #2ec4b6;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(46,196,182,0.15);
                    }
                    .movesets-card-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #2a2a40;
                        padding-bottom: 6px;
                    }
                    .movesets-card-img {
                        width: 40px;
                        height: 40px;
                        image-rendering: pixelated;
                    }
                    .movesets-card-title {
                        font-size: 15px;
                        font-weight: 700;
                        color: #fff;
                    }
                    .movesets-card-body {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        flex-grow: 1;
                    }
                    .moveset-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 12px;
                        background: #151522;
                        padding: 4px 8px;
                        border-radius: 4px;
                    }
                    .moveset-row-left {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .moveset-row-right {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .moveset-lvl-label {
                        color: #ff9f1c;
                        font-weight: 700;
                        margin-right: 2px;
                    }
                    .moveset-row-name {
                        color: #e2e8f0;
                        font-weight: 600;
                    }
                    .move-badge {
                        font-size: 9px;
                        padding: 1px 4px;
                        border-radius: 3px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #fff;
                    }
                    .movesets-empty-state {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 150px;
                        color: #718096;
                        font-size: 14px;
                    }
                `;
                document.head.appendChild(style);
            }

            // Create Base Shell
            baseShell = document.createElement('div');
            baseShell.className = 'custom-movesets-container';

            // 1. Header
            const header = document.createElement('div');
            header.className = 'movesets-header';
            
            const title = document.createElement('h2');
            title.textContent = 'Mosse Modificate';
            header.appendChild(title);

            const searchBar = document.createElement('div');
            searchBar.className = 'movesets-search-bar';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Cerca Pokémon o mossa...';
            searchInput.className = 'movesets-search-input';
            searchInput.value = searchTerm;
            
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                updateMovesetContent();
            });

            searchBar.appendChild(searchInput);
            header.appendChild(searchBar);
            baseShell.appendChild(header);

            // 2. Tab Bar
            const tabContainer = document.createElement('div');
            tabContainer.className = 'movesets-tab-container';

            const tabReminder = document.createElement('button');
            tabReminder.className = `movesets-tab-btn ${activeTab === 'reminder' ? 'active' : ''}`;
            tabReminder.textContent = 'Tramite Ricordamosse';
            tabReminder.addEventListener('click', () => {
                tabReminder.classList.add('active');
                tabLevel.classList.remove('active');
                activeTab = 'reminder';
                updateMovesetContent();
            });

            const tabLevel = document.createElement('button');
            tabLevel.className = `movesets-tab-btn ${activeTab === 'level' ? 'active' : ''}`;
            tabLevel.textContent = 'Tramite Livello';
            tabLevel.addEventListener('click', () => {
                tabLevel.classList.add('active');
                tabReminder.classList.remove('active');
                activeTab = 'level';
                updateMovesetContent();
            });

            tabContainer.appendChild(tabReminder);
            tabContainer.appendChild(tabLevel);
            baseShell.appendChild(tabContainer);

            // 3. Grid Slot
            const grid = document.createElement('div');
            grid.className = 'movesets-grid';
            baseShell.appendChild(grid);

            slot.appendChild(baseShell);
        }

        updateMovesetContent();
    }

    // Update grid contents based on search/tab state
    function updateMovesetContent() {
        const slot = document.getElementById('moveset-view-frame-slot');
        if (!slot) return;
        const grid = slot.querySelector('.movesets-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const query = searchTerm.toLowerCase().trim();
        const list = movesetDatabase[activeTab] || [];

        // Fetch calculator moves object if available
        const calcMoves = window.moves || (window.calc && window.calc.MOVES && window.calc.MOVES[gen]) || {};

        // Filter list
        const filtered = list.filter(item => {
            if (!query) return true;
            if (item.species.toLowerCase().includes(query)) return true;
            
            // Check if any move matches
            if (activeTab === 'reminder') {
                return item.moves.some(m => m.toLowerCase().includes(query));
            } else {
                return item.moves.some(m => m.move.toLowerCase().includes(query));
            }
        });

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'movesets-empty-state';
            empty.textContent = 'Nessun Pokémon o mossa corrisponde ai filtri.';
            grid.appendChild(empty);
            return;
        }

        filtered.forEach(item => {
            const spriteName = getSpriteFilename(item.species);
            const card = document.createElement('div');
            card.className = 'movesets-card';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'movesets-card-header';

            const img = document.createElement('img');
            img.className = 'movesets-card-img';
            img.src = `./img/pokesprite/${spriteName}.png`;
            img.onerror = () => { img.src = './img/default.png'; };
            cardHeader.appendChild(img);

            const title = document.createElement('div');
            title.className = 'movesets-card-title';
            title.textContent = item.species;
            cardHeader.appendChild(title);

            card.appendChild(cardHeader);

            const cardBody = document.createElement('div');
            cardBody.className = 'movesets-card-body';

            let defaultLvl = 50;

            if (activeTab === 'reminder') {
                item.moves.forEach(moveName => {
                    const row = document.createElement('div');
                    row.className = 'moveset-row';

                    const left = document.createElement('div');
                    left.className = 'moveset-row-left';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'moveset-row-name';
                    nameSpan.textContent = moveName;
                    left.appendChild(nameSpan);
                    row.appendChild(left);

                    const right = document.createElement('div');
                    right.className = 'moveset-row-right';

                    // Fetch move stats from database
                    const moveData = calcMoves[moveName];
                    if (moveData) {
                        // Type Badge
                        const tBadge = document.createElement('span');
                        tBadge.className = 'move-badge';
                        tBadge.style.backgroundColor = getTypeColor(moveData.type);
                        tBadge.textContent = moveData.type;
                        right.appendChild(tBadge);

                        // Category Badge
                        const cBadge = document.createElement('span');
                        cBadge.className = 'move-badge';
                        cBadge.style.backgroundColor = getCategoryColor(moveData.category);
                        cBadge.textContent = moveData.category === 'Physical' ? 'Phys' : (moveData.category === 'Special' ? 'Spec' : 'Stat');
                        right.appendChild(cBadge);

                        // Power Badge
                        if (moveData.bp && moveData.bp > 1) {
                            const pBadge = document.createElement('span');
                            pBadge.className = 'move-badge';
                            pBadge.style.backgroundColor = '#2a2a40';
                            pBadge.textContent = `Pwr ${moveData.bp}`;
                            right.appendChild(pBadge);
                        }
                    }
                    row.appendChild(right);
                    cardBody.appendChild(row);
                });
            } else {
                // Find highest level to set as default level for calculator loading
                let maxLvl = 5;
                item.moves.forEach(mInfo => {
                    if (mInfo.level > maxLvl) maxLvl = mInfo.level;

                    const row = document.createElement('div');
                    row.className = 'moveset-row';

                    const left = document.createElement('div');
                    left.className = 'moveset-row-left';

                    const lvlLabel = document.createElement('span');
                    lvlLabel.className = 'moveset-lvl-label';
                    lvlLabel.textContent = `Lv. ${mInfo.level}`;
                    left.appendChild(lvlLabel);
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'moveset-row-name';
                    nameSpan.textContent = mInfo.move;
                    left.appendChild(nameSpan);
                    row.appendChild(left);

                    const right = document.createElement('div');
                    right.className = 'moveset-row-right';

                    const moveData = calcMoves[mInfo.move];
                    if (moveData) {
                        const tBadge = document.createElement('span');
                        tBadge.className = 'move-badge';
                        tBadge.style.backgroundColor = getTypeColor(moveData.type);
                        tBadge.textContent = moveData.type;
                        right.appendChild(tBadge);

                        const cBadge = document.createElement('span');
                        cBadge.className = 'move-badge';
                        cBadge.style.backgroundColor = getCategoryColor(moveData.category);
                        cBadge.textContent = moveData.category === 'Physical' ? 'Phys' : (moveData.category === 'Special' ? 'Spec' : 'Stat');
                        right.appendChild(cBadge);

                        if (moveData.bp && moveData.bp > 1) {
                            const pBadge = document.createElement('span');
                            pBadge.className = 'move-badge';
                            pBadge.style.backgroundColor = '#2a2a40';
                            pBadge.textContent = `Pwr ${moveData.bp}`;
                            right.appendChild(pBadge);
                        }
                    }
                    row.appendChild(right);
                    cardBody.appendChild(row);
                });
                defaultLvl = maxLvl;
            }

            card.appendChild(cardBody);
            card.setAttribute('title', `Clicca per caricare ${item.species} (Lv ${defaultLvl}) nel Calcolatore`);

            card.addEventListener('click', () => {
                loadMovesetPokemon(item.species, defaultLvl);
            });

            grid.appendChild(card);
        });
    }

    // Expose necessary functions for main_nav.js to swap view without crashing
    window.ensureFragsheetControlsInitialized = function() {
        renderMovesetView();
    };
    window.ensureFragsheetGridInitialized = function() {
        renderMovesetView();
    };
    window.setEmbeddedFragsheetMode = function(mode) {};

    // Auto-render when document is ready
    $(document).ready(function() {
        if (movesetInitialized) return;
        movesetInitialized = true;
    });

})();
