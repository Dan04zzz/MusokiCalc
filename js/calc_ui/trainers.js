(function () {
    let trainersInitialized = false;
    let activeLocation = null;
    let searchTerm = '';
    
    // Extracted data
    let locationsMap = new Map(); // location -> [ trainers ]

    function getSpriteFilename(species) {
        if (!species) return 'default';
        return species.toLowerCase()
            .replace(/[ :'.-]+/g, '-')
            .replace(/-totem$/g, '')
            .replace(/^-|-glitched$|-$/g, '');
    }

    function loadTrainerPokemon(speciesName, setName) {
        // Search option in set selector
        const selector = $('.opposing.set-selector');
        let foundValue = null;
        selector.find('option').each(function() {
            const val = $(this).val();
            // The exact value in the dropdown is usually "Species (SetName)"
            if (val === `${speciesName} (${setName})`) {
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
        
        // Redirect to calculator tab
        if (typeof window.setMainPageView === 'function') {
            window.setMainPageView('calculator');
        } else {
            $('.main-view-tab[data-view="calculator"]').click();
        }
    }

    function parseTrainersData() {
        locationsMap.clear();
        const trainersData = window.backup_data;
        if (!trainersData || !trainersData.order || !setdex) return false;

        const trainerMap = {};
        for (const speciesName in setdex) {
            const sets = setdex[speciesName];
            for (const setName in sets) {
                const setDetails = sets[setName];
                if (setDetails.tr_id) {
                    const trId = setDetails.tr_id;
                    if (!trainerMap[trId]) {
                        let extractedName = setName.replace(/^Lvl\s+\d+\s+/, '').trim();
                        trainerMap[trId] = {
                            id: trId,
                            name: extractedName,
                            location: setDetails.location || "Sconosciuto",
                            pokemons: []
                        };
                    }
                    trainerMap[trId].pokemons.push({
                        species: speciesName,
                        level: setDetails.level,
                        setName: setName,
                        details: setDetails
                    });
                }
            }
        }

        const orderDict = trainersData.order;
        let currentTrId = null;
        for (const key in orderDict) {
            if (orderDict[key].prev == 0 || orderDict[key].prev == "0") {
                currentTrId = key;
                break;
            }
        }
        
        if (!currentTrId && Object.keys(orderDict).length > 0) {
            currentTrId = Object.keys(orderDict)[0];
        }

        const locationNamesInOrder = [];

        while (currentTrId) {
            const trIdNum = parseInt(currentTrId, 10);
            const trainer = trainerMap[trIdNum];
            if (trainer) {
                trainer.pokemons.sort((a, b) => (a.level || 0) - (b.level || 0));

                if (!locationsMap.has(trainer.location)) {
                    locationsMap.set(trainer.location, []);
                    locationNamesInOrder.push(trainer.location);
                }
                locationsMap.get(trainer.location).push(trainer);
            }
            const nextNode = orderDict[currentTrId];
            if (nextNode && nextNode.next && nextNode.next != 0 && nextNode.next != "0") {
                currentTrId = String(nextNode.next);
            } else {
                currentTrId = null;
            }
        }
        
        if (locationNamesInOrder.length > 0) {
            activeLocation = locationNamesInOrder[0];
            return true;
        }
        return false;
    }

    function renderTrainersView() {
        const slot = document.getElementById('trainers-view-frame-slot');
        if (!slot) return;

        let baseShell = slot.querySelector('.custom-encounters-container');
        if (!baseShell) {
            slot.innerHTML = '';
            
            const styleId = 'custom-trainers-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .custom-encounters-container {
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 65px);
                        background: #111116;
                        color: #e2e8f0;
                        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                        box-sizing: border-box;
                        padding: 15px 20px;
                    }
                    .encounters-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        gap: 15px;
                    }
                    .encounters-header h2 {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        color: #ff5a5f;
                        letter-spacing: 0.5px;
                    }
                    .encounters-search-bar {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex-grow: 1;
                        max-width: 400px;
                    }
                    .encounters-search-input {
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
                    .encounters-search-input:focus {
                        border-color: #ff5a5f;
                        box-shadow: 0 0 0 2px rgba(255,90,95,0.2);
                    }
                    .encounters-body {
                        display: flex;
                        flex-grow: 1;
                        gap: 20px;
                        overflow: hidden;
                        margin-top: 10px;
                    }
                    .encounters-nav {
                        width: 260px;
                        flex-shrink: 0;
                        display: flex;
                        flex-direction: column;
                        background: #191924;
                        border-radius: 8px;
                        border: 1px solid #2a2a40;
                        overflow: hidden;
                    }
                    .encounters-routes {
                        overflow-y: auto;
                        flex-grow: 1;
                        padding: 8px;
                    }
                    .encounters-routes::-webkit-scrollbar { width: 6px; }
                    .encounters-routes::-webkit-scrollbar-thumb { background: #3f3f5a; border-radius: 3px; }
                    .route-btn {
                        width: 100%;
                        text-align: left;
                        padding: 10px 12px;
                        background: transparent;
                        border: none;
                        color: #a0aec0;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        transition: all 0.2s;
                        margin-bottom: 2px;
                    }
                    .route-btn:hover {
                        background: #232336;
                        color: #fff;
                    }
                    .route-btn.active {
                        background: rgba(255,90,95,0.15);
                        color: #ff5a5f;
                        font-weight: 600;
                    }
                    .encounters-main {
                        flex-grow: 1;
                        background: #191924;
                        border-radius: 8px;
                        border: 1px solid #2a2a40;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .encounters-list-header {
                        padding: 15px 20px;
                        background: rgba(0,0,0,0.2);
                        border-bottom: 1px solid #2a2a40;
                    }
                    .encounters-list-header h3 {
                        margin: 0;
                        font-size: 16px;
                        color: #fff;
                    }
                    .encounters-grid {
                        flex-grow: 1;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    .trainer-block {
                        margin-bottom: 30px;
                    }
                    .trainer-block-title {
                        font-size: 15px;
                        color: #ff5a5f;
                        margin-bottom: 12px;
                        padding-bottom: 6px;
                        border-bottom: 1px solid #2a2a40;
                    }
                    .trainer-pokemon-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                        gap: 15px;
                    }
                    .poke-panel {
                        background: #232336;
                        border: 1px solid #33334c;
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
                        position: relative;
                        overflow: hidden;
                    }
                    .poke-panel:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        border-color: #ff5a5f;
                    }
                    .poke-sprite-container {
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        background: rgba(0,0,0,0.2);
                        border-radius: 6px;
                    }
                    .poke-sprite {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    .poke-info {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                        gap: 2px;
                    }
                    .poke-species {
                        font-weight: 600;
                        color: #fff;
                        font-size: 13px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .poke-lvl {
                        color: #a0aec0;
                        font-size: 11px;
                        background: #1e1e2f;
                        padding: 2px 6px;
                        border-radius: 4px;
                        align-self: flex-start;
                        border: 1px solid #2a2a40;
                    }
                `;
                document.head.appendChild(style);
            }

            slot.innerHTML = `
                <div class="custom-encounters-container">
                    <div class="encounters-header">
                        <h2>Trainers</h2>
                        <div class="encounters-search-bar">
                            <input type="text" class="encounters-search-input" placeholder="Cerca un Pokémon o un allenatore..." id="trainers-search-input">
                        </div>
                    </div>
                    <div class="encounters-body">
                        <div class="encounters-nav">
                            <div class="encounters-routes" id="trainers-locations-list"></div>
                        </div>
                        <div class="encounters-main">
                            <div class="encounters-list-header">
                                <h3 id="trainers-list-title">Seleziona una Location</h3>
                            </div>
                            <div class="encounters-grid" id="trainers-grid"></div>
                        </div>
                    </div>
                </div>
            `;

            const searchInput = document.getElementById('trainers-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchTerm = e.target.value.toLowerCase();
                    updateTrainersList();
                });
            }
        }

        const locationsListEl = document.getElementById('trainers-locations-list');
        if (locationsListEl && locationsMap.size > 0) {
            locationsListEl.innerHTML = '';
            
            for (const [locationName, trainers] of locationsMap.entries()) {
                const btn = document.createElement('button');
                btn.className = 'route-btn';
                if (locationName === activeLocation) {
                    btn.classList.add('active');
                }
                btn.textContent = locationName;
                btn.onclick = () => {
                    activeLocation = locationName;
                    locationsListEl.querySelectorAll('.route-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateTrainersList();
                };
                locationsListEl.appendChild(btn);
            }
        }

        updateTrainersList();
    }

    function updateTrainersList() {
        const grid = document.getElementById('trainers-grid');
        const title = document.getElementById('trainers-list-title');
        if (!grid || !title) return;

        grid.innerHTML = '';
        
        if (!activeLocation || !locationsMap.has(activeLocation)) {
            title.textContent = 'Nessuna location selezionata';
            return;
        }

        title.textContent = activeLocation;
        
        const trainers = locationsMap.get(activeLocation);
        let visibleCount = 0;

        trainers.forEach(trainer => {
            const trainerMatches = trainer.name.toLowerCase().includes(searchTerm);
            const filteredPokemons = trainer.pokemons.filter(p => 
                trainerMatches || 
                p.species.toLowerCase().includes(searchTerm)
            );

            if (filteredPokemons.length === 0) return;
            visibleCount++;

            const block = document.createElement('div');
            block.className = 'trainer-block';
            
            const blockTitle = document.createElement('div');
            blockTitle.className = 'trainer-block-title';
            blockTitle.textContent = trainer.name;
            block.appendChild(blockTitle);
            
            const pokeGrid = document.createElement('div');
            pokeGrid.className = 'trainer-pokemon-grid';

            filteredPokemons.forEach(poke => {
                const spriteFile = getSpriteFilename(poke.species);
                const spriteSrc = `https://play.pokemonshowdown.com/sprites/gen5/${spriteFile}.png`;
                
                const pokePanel = document.createElement('div');
                pokePanel.className = 'poke-panel';
                pokePanel.innerHTML = `
                    <div class="poke-sprite-container">
                        <img src="${spriteSrc}" class="poke-sprite" onerror="this.src='./img/pokemon/default.png'; this.onerror=null;" alt="${poke.species}">
                    </div>
                    <div class="poke-info">
                        <span class="poke-species">${poke.species}</span>
                        <span class="poke-lvl">Lv. ${poke.level}</span>
                    </div>
                `;
                
                pokePanel.onclick = () => {
                    loadTrainerPokemon(poke.species, poke.setName);
                };
                
                pokeGrid.appendChild(pokePanel);
            });
            
            block.appendChild(pokeGrid);
            grid.appendChild(block);
        });

        if (visibleCount === 0) {
            grid.innerHTML = '<div style="color: #a0aec0; padding: 20px; text-align: center;">Nessun risultato trovato.</div>';
        }
    }

    function initTrainers() {
        if (trainersInitialized) return;
        
        $(document).on('click', '.main-view-tab', function() {
            const view = $(this).data('view');
            if (view === 'trainers') {
                if (locationsMap.size === 0) {
                    parseTrainersData();
                }
                renderTrainersView();
            }
        });
        
        trainersInitialized = true;
    }

    $(document).ready(function() {
        initTrainers();
    });

})();
