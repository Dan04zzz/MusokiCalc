(function () {
    let encountersInitialized = false;
    let activeTab = 'wild'; // 'wild', 'gift', 'trade', 'game_corner'
    let searchTerm = '';
    let activeRouteIndex = 0;

    function shouldAllowOpponentDexSprite($sprite) {
        return true;
    }

    function getPokemonDexPathFromSpriteElement(spriteElement) {
        const $sprite = $(spriteElement);
        if (!$sprite.length) return null;
        const spriteSrc = $sprite.attr('src') || '';
        const spriteParts = spriteSrc.split('/');
        if (spriteParts.length < 2) return null;
        const fileName = spriteParts[spriteParts.length - 1];
        const spriteName = fileName.split('.')[0];
        return spriteName ? `pokemon/${spriteName}` : null;
    }

    function getPokemonDexPathFromPanelElement(panelElement) {
        const spriteElement = $(panelElement).find('.poke-sprite').get(0);
        if (!spriteElement) return null;
        return getPokemonDexPathFromSpriteElement(spriteElement);
    }

    function getSpriteFilename(species) {
        if (!species) return 'default';
        return species.toLowerCase()
            .replace(/[ :'.-]+/g, '-')
            .replace(/-totem$/g, '')
            .replace(/^-|-glitched$|-$/g, '');
    }

    function parseLevel(lvlStr) {
        if (!lvlStr) return 100;
        const parts = String(lvlStr).split('-');
        if (parts.length === 2) {
            const min = parseInt(parts[0], 10);
            const max = parseInt(parts[1], 10);
            return isNaN(max) ? (isNaN(min) ? 100 : min) : max;
        }
        const val = parseInt(lvlStr, 10);
        return isNaN(val) ? 100 : val;
    }

    function loadEncounterPokemon(speciesName, levelStr) {
        const levelVal = parseLevel(levelStr);
        if (typeof window.importDdexTemporaryOpponent === 'function') {
            window.importDdexTemporaryOpponent("### DDEX_TEMP_OPPONENT v1\n" + speciesName + "\nLevel: " + levelVal + "\n### DDEX_TEMP_OPPONENT v1");
        } else {
            // Fallback: search option in set selector
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
        
        // Redirect to calculator tab
        if (typeof window.setMainPageView === 'function') {
            window.setMainPageView('calculator');
        }
    }

    // Function to render custom Encounters view inside the tab
    function renderCustomEncountersView() {
        const slot = document.getElementById('dex-view-frame-slot');
        if (!slot) return;

        // Clear slot and render the base shell if it doesn't exist
        let baseShell = slot.querySelector('.custom-encounters-container');
        if (!baseShell) {
            slot.innerHTML = '';
            
            // Inject CSS Styles
            const styleId = 'custom-encounters-styles';
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
                        color: #2ec4b6;
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
                        border-color: #2ec4b6;
                        box-shadow: 0 0 0 2px rgba(46,196,182,0.2);
                    }
                    .encounters-tab-container {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 12px;
                        border-bottom: 1px solid #2a2a40;
                        padding-bottom: 8px;
                    }
                    .encounters-tab-btn {
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
                    .encounters-tab-btn:hover {
                        color: #fff;
                        background: #1e1e2f;
                    }
                    .encounters-tab-btn.active {
                        color: #fff;
                        background: #2ec4b6;
                        border-color: #2ec4b6;
                    }
                    .encounters-content-slot {
                        flex-grow: 1;
                        min-height: 0;
                    }
                    .encounters-split-layout {
                        display: flex;
                        height: 100%;
                        gap: 15px;
                    }
                    .encounters-sidebar {
                        width: 260px;
                        background: #1e1e2f;
                        border: 1px solid #2a2a40;
                        border-radius: 8px;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .encounters-sidebar-title {
                        padding: 10px 12px;
                        background: #151522;
                        border-bottom: 1px solid #2a2a40;
                        font-size: 12px;
                        font-weight: 700;
                        color: #a0aec0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .encounters-sidebar-list {
                        flex-grow: 1;
                        overflow-y: auto;
                        padding: 5px;
                    }
                    .encounters-sidebar-item {
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        color: #cbd5e0;
                        transition: all 0.15s;
                        margin-bottom: 2px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .encounters-sidebar-item:hover {
                        background: #2a2a40;
                        color: #fff;
                    }
                    .encounters-sidebar-item.active {
                        background: rgba(46,196,182,0.15);
                        color: #2ec4b6;
                        font-weight: 600;
                        border-left: 3px solid #2ec4b6;
                        padding-left: 9px;
                    }
                    .encounters-sidebar-item-match-badge {
                        background: #e71d36;
                        color: #fff;
                        font-size: 10px;
                        padding: 1px 5px;
                        border-radius: 10px;
                        font-weight: bold;
                    }
                    .encounters-details-pane {
                        flex-grow: 1;
                        background: #1e1e2f;
                        border: 1px solid #2a2a40;
                        border-radius: 8px;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .encounters-details-header {
                        padding: 12px 16px;
                        background: #151522;
                        border-bottom: 1px solid #2a2a40;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .encounters-details-header h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 700;
                        color: #fff;
                    }
                    .encounters-details-body {
                        flex-grow: 1;
                        overflow-y: auto;
                        padding: 15px;
                    }
                    .encounters-method-section {
                        margin-bottom: 20px;
                    }
                    .encounters-method-title {
                        font-size: 13px;
                        font-weight: 700;
                        color: #a0aec0;
                        text-transform: uppercase;
                        border-bottom: 1px solid #2a2a40;
                        padding-bottom: 4px;
                        margin-bottom: 10px;
                        letter-spacing: 0.5px;
                    }
                    .encounters-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                        gap: 12px;
                    }
                    .encounters-card {
                        background: #12121a;
                        border: 1px solid #2a2a40;
                        border-radius: 6px;
                        padding: 8px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        position: relative;
                    }
                    .encounters-card:hover {
                        border-color: #2ec4b6;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 10px rgba(46,196,182,0.15);
                    }
                    .encounters-card.highlight {
                        border-color: #e71d36;
                        background: rgba(231,29,54,0.08);
                        box-shadow: 0 0 8px rgba(231,29,54,0.3);
                    }
                    .encounters-card-img {
                        width: 48px;
                        height: 48px;
                        image-rendering: pixelated;
                        margin-bottom: 6px;
                    }
                    .encounters-card-name {
                        font-size: 12px;
                        font-weight: 600;
                        color: #fff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        width: 100%;
                        margin-bottom: 4px;
                    }
                    .encounters-card-lvl {
                        font-size: 11px;
                        color: #ff9f1c;
                        font-weight: 700;
                        margin-bottom: 2px;
                    }
                    .encounters-card-rate {
                        font-size: 11px;
                        color: #ffd166;
                        font-weight: 600;
                    }
                    .encounters-card-location {
                        font-size: 11px;
                        color: #cbd5e0;
                        margin-top: 4px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        width: 100%;
                    }
                    .encounters-badge {
                        position: absolute;
                        top: 4px;
                        right: 4px;
                        font-size: 9px;
                        padding: 1px 4px;
                        border-radius: 3px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .encounters-badge.gift {
                        background: #06d6a0;
                        color: #12121a;
                    }
                    .encounters-badge.static {
                        background: #118ab2;
                        color: #fff;
                    }
                    .encounters-trade-row {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        margin-bottom: 6px;
                    }
                    .encounters-trade-arrow {
                        font-size: 14px;
                        color: #2ec4b6;
                        font-weight: bold;
                    }
                    .encounters-empty-state {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 150px;
                        color: #718096;
                        font-size: 14px;
                    }
                    .encounters-global-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                        gap: 15px;
                        padding: 10px;
                        overflow-y: auto;
                        height: 100%;
                    }
                `;
                document.head.appendChild(style);
            }

            // Create Base Elements
            baseShell = document.createElement('div');
            baseShell.className = 'custom-encounters-container';

            // 1. Header
            const header = document.createElement('div');
            header.className = 'encounters-header';
            
            const title = document.createElement('h2');
            title.textContent = 'Encounter Database';
            header.appendChild(title);

            const searchBar = document.createElement('div');
            searchBar.className = 'encounters-search-bar';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Cerca Pokémon o zona...';
            searchInput.className = 'encounters-search-input';
            searchInput.value = searchTerm;
            
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                updateTabContent();
            });

            searchBar.appendChild(searchInput);
            header.appendChild(searchBar);
            baseShell.appendChild(header);

            // 2. Tab Menu
            const tabs = [
                { id: 'wild', label: 'Aree Selvatiche' },
                { id: 'gift', label: 'Doni & Statici' },
                { id: 'trade', label: 'Scambi' },
                { id: 'game_corner', label: 'Casinò' }
            ];

            const tabContainer = document.createElement('div');
            tabContainer.className = 'encounters-tab-container';
            tabs.forEach(t => {
                const tabBtn = document.createElement('button');
                tabBtn.className = `encounters-tab-btn ${activeTab === t.id ? 'active' : ''}`;
                tabBtn.textContent = t.label;
                tabBtn.dataset.tabId = t.id;
                
                tabBtn.addEventListener('click', () => {
                    tabContainer.querySelectorAll('.encounters-tab-btn').forEach(b => b.classList.remove('active'));
                    tabBtn.classList.add('active');
                    activeTab = t.id;
                    updateTabContent();
                });
                tabContainer.appendChild(tabBtn);
            });
            baseShell.appendChild(tabContainer);

            // 3. Content Slot
            const contentSlot = document.createElement('div');
            contentSlot.className = 'encounters-content-slot';
            baseShell.appendChild(contentSlot);

            slot.appendChild(baseShell);
        }

        updateTabContent();
    }

    // Function to render active tab content
    function updateTabContent() {
        const slot = document.getElementById('dex-view-frame-slot');
        if (!slot) return;
        const contentSlot = slot.querySelector('.encounters-content-slot');
        if (!contentSlot) return;

        // Fetch database
        const db = window.hgimproved_encounters || { routes: [], gifts: [], statics: [], trades: [], game_corner: [] };
        const query = searchTerm.toLowerCase().trim();

        contentSlot.innerHTML = '';

        if (activeTab === 'wild') {
            // Split layout
            const splitLayout = document.createElement('div');
            splitLayout.className = 'encounters-split-layout';

            // Left Sidebar
            const sidebar = document.createElement('div');
            sidebar.className = 'encounters-sidebar';
            
            const sidebarTitle = document.createElement('div');
            sidebarTitle.className = 'encounters-sidebar-title';
            sidebarTitle.textContent = 'Zonario';
            sidebar.appendChild(sidebarTitle);

            const sidebarList = document.createElement('div');
            sidebarList.className = 'encounters-sidebar-list';

            // Filter routes based on search term
            let filteredRoutes = [];
            db.routes.forEach((route, originalIndex) => {
                let matchesName = route.name.toLowerCase().includes(query);
                let matchedPokemonCount = 0;
                
                // Count how many species match the search query in this route
                if (query) {
                    Object.values(route.encounters).forEach(list => {
                        list.forEach(p => {
                            if (p.species.toLowerCase().includes(query)) {
                                matchedPokemonCount++;
                            }
                        });
                    });
                }

                if (!query || matchesName || matchedPokemonCount > 0) {
                    filteredRoutes.push({
                        route: route,
                        index: originalIndex,
                        matchesName: matchesName,
                        matchCount: matchedPokemonCount
                    });
                }
            });

            if (filteredRoutes.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'encounters-empty-state';
                empty.textContent = 'Nessuna zona trovata';
                sidebarList.appendChild(empty);
            } else {
                filteredRoutes.forEach((fr, i) => {
                    const item = document.createElement('div');
                    item.className = `encounters-sidebar-item ${activeRouteIndex === fr.index ? 'active' : ''}`;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = fr.route.name;
                    item.appendChild(nameSpan);

                    if (query && fr.matchCount > 0) {
                        const badge = document.createElement('span');
                        badge.className = 'encounters-sidebar-item-match-badge';
                        badge.textContent = fr.matchCount;
                        item.appendChild(badge);
                    }

                    item.addEventListener('click', () => {
                        activeRouteIndex = fr.index;
                        // Just re-render active panel
                        updateTabContent();
                    });
                    sidebarList.appendChild(item);
                });
            }
            sidebar.appendChild(sidebarList);
            splitLayout.appendChild(sidebar);

            // Right Details pane
            const detailsPane = document.createElement('div');
            detailsPane.className = 'encounters-details-pane';

            const activeRouteData = db.routes[activeRouteIndex];
            if (!activeRouteData) {
                // Fallback to first available or empty
                const empty = document.createElement('div');
                empty.className = 'encounters-empty-state';
                empty.textContent = 'Seleziona una zona per visualizzarne gli incontri.';
                detailsPane.appendChild(empty);
            } else {
                const detailsHeader = document.createElement('div');
                detailsHeader.className = 'encounters-details-header';
                
                const routeTitle = document.createElement('h3');
                routeTitle.textContent = activeRouteData.name;
                detailsHeader.appendChild(routeTitle);
                detailsPane.appendChild(detailsHeader);

                const detailsBody = document.createElement('div');
                detailsBody.className = 'encounters-details-body';

                // Render each method
                let methodCount = 0;
                Object.keys(activeRouteData.encounters).forEach(methodName => {
                    const list = activeRouteData.encounters[methodName];
                    if (!list || list.length === 0) return;

                    methodCount++;
                    const section = document.createElement('div');
                    section.className = 'encounters-method-section';

                    const secTitle = document.createElement('div');
                    secTitle.className = 'encounters-method-title';
                    secTitle.textContent = methodName;
                    section.appendChild(secTitle);

                    const grid = document.createElement('div');
                    grid.className = 'encounters-grid';

                    list.forEach(p => {
                        const spriteName = getSpriteFilename(p.species);
                        const card = document.createElement('div');
                        card.className = 'encounters-card';
                        
                        // Highlight card if species matches search term
                        if (query && p.species.toLowerCase().includes(query)) {
                            card.classList.add('highlight');
                        }

                        const img = document.createElement('img');
                        img.className = 'encounters-card-img';
                        img.src = `./img/pokesprite/${spriteName}.png`;
                        img.onerror = () => { img.src = './img/default.png'; };
                        card.appendChild(img);

                        const name = document.createElement('div');
                        name.className = 'encounters-card-name';
                        name.textContent = p.species;
                        card.appendChild(name);

                        const lvl = document.createElement('div');
                        lvl.className = 'encounters-card-lvl';
                        lvl.textContent = `Lv ${p.level}`;
                        card.appendChild(lvl);

                        const rate = document.createElement('div');
                        rate.className = 'encounters-card-rate';
                        rate.textContent = p.rate;
                        card.appendChild(rate);

                        // Card tooltip
                        card.setAttribute('title', `${p.species}\nLivello: ${p.level}\nTasso: ${p.rate}\n\nClicca per caricare nel Calcolatore`);

                        // Click to load
                        card.addEventListener('click', () => {
                            loadEncounterPokemon(p.species, p.level);
                        });

                        grid.appendChild(card);
                    });

                    section.appendChild(grid);
                    detailsBody.appendChild(section);
                });

                if (methodCount === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'encounters-empty-state';
                    empty.textContent = 'Nessun incontro registrato per questa zona.';
                    detailsBody.appendChild(empty);
                }

                detailsPane.appendChild(detailsBody);
            }

            splitLayout.appendChild(detailsPane);
            contentSlot.appendChild(splitLayout);

        } else if (activeTab === 'gift') {
            const grid = document.createElement('div');
            grid.className = 'encounters-global-grid';

            // Filter gifts & statics
            const list = [];
            db.gifts.forEach(g => {
                if (!query || g.species.toLowerCase().includes(query) || g.location.toLowerCase().includes(query)) {
                    list.push({ ...g, type: 'gift' });
                }
            });
            db.statics.forEach(s => {
                if (!query || s.species.toLowerCase().includes(query) || s.location.toLowerCase().includes(query)) {
                    list.push({ ...s, type: 'static' });
                }
            });

            if (list.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'encounters-empty-state';
                empty.textContent = 'Nessun Pokémon regalo o statico trovato.';
                contentSlot.appendChild(empty);
            } else {
                list.forEach(p => {
                    const spriteName = getSpriteFilename(p.species);
                    const card = document.createElement('div');
                    card.className = 'encounters-card';

                    const badge = document.createElement('span');
                    badge.className = `encounters-badge ${p.type}`;
                    badge.textContent = p.type === 'gift' ? 'Regalo' : 'Statico';
                    card.appendChild(badge);

                    const img = document.createElement('img');
                    img.className = 'encounters-card-img';
                    img.src = `./img/pokesprite/${spriteName}.png`;
                    img.onerror = () => { img.src = './img/default.png'; };
                    card.appendChild(img);

                    const name = document.createElement('div');
                    name.className = 'encounters-card-name';
                    name.textContent = p.species;
                    card.appendChild(name);

                    const lvl = document.createElement('div');
                    lvl.className = 'encounters-card-lvl';
                    lvl.textContent = `Lv ${p.level}`;
                    card.appendChild(lvl);

                    const loc = document.createElement('div');
                    loc.className = 'encounters-card-location';
                    loc.textContent = p.location;
                    card.appendChild(loc);

                    card.setAttribute('title', `${p.species} (${p.type === 'gift' ? 'Regalo' : 'Statico'})\nLivello: ${p.level}\nZona: ${p.location}\n\nClicca per caricare nel Calcolatore`);

                    card.addEventListener('click', () => {
                        loadEncounterPokemon(p.species, p.level);
                    });

                    grid.appendChild(card);
                });
                contentSlot.appendChild(grid);
            }

        } else if (activeTab === 'trade') {
            const grid = document.createElement('div');
            grid.className = 'encounters-global-grid';

            const filteredTrades = db.trades.filter(t => {
                return !query || 
                       t.give.toLowerCase().includes(query) || 
                       t.receive.toLowerCase().includes(query) || 
                       t.location.toLowerCase().includes(query);
            });

            if (filteredTrades.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'encounters-empty-state';
                empty.textContent = 'Nessuno scambio in-game trovato.';
                contentSlot.appendChild(empty);
            } else {
                filteredTrades.forEach(t => {
                    const spriteGive = getSpriteFilename(t.give);
                    const spriteRec = getSpriteFilename(t.receive);
                    
                    const card = document.createElement('div');
                    card.className = 'encounters-card';

                    // Trade Row styling
                    const tradeRow = document.createElement('div');
                    tradeRow.className = 'encounters-trade-row';

                    const imgGive = document.createElement('img');
                    imgGive.style.width = '32px';
                    imgGive.style.height = '32px';
                    imgGive.style.imageRendering = 'pixelated';
                    imgGive.src = `./img/pokesprite/${spriteGive}.png`;
                    imgGive.onerror = () => { imgGive.src = './img/default.png'; };
                    tradeRow.appendChild(imgGive);

                    const arrow = document.createElement('span');
                    arrow.className = 'encounters-trade-arrow';
                    arrow.textContent = '➔';
                    tradeRow.appendChild(arrow);

                    const imgRec = document.createElement('img');
                    imgRec.style.width = '48px';
                    imgRec.style.height = '48px';
                    imgRec.style.imageRendering = 'pixelated';
                    imgRec.src = `./img/pokesprite/${spriteRec}.png`;
                    imgRec.onerror = () => { imgRec.src = './img/default.png'; };
                    tradeRow.appendChild(imgRec);

                    card.appendChild(tradeRow);

                    const name = document.createElement('div');
                    name.className = 'encounters-card-name';
                    name.textContent = `${t.receive}`;
                    card.appendChild(name);

                    const details = document.createElement('div');
                    details.className = 'encounters-card-rate';
                    details.style.fontSize = '10px';
                    details.textContent = `Scambia: ${t.give}`;
                    card.appendChild(details);

                    const loc = document.createElement('div');
                    loc.className = 'encounters-card-location';
                    loc.textContent = t.location;
                    card.appendChild(loc);

                    card.setAttribute('title', `Scambio In-Game a ${t.location}\nDai: ${t.give}\nRicevi: ${t.receive}\n\nClicca per caricare nel Calcolatore`);

                    card.addEventListener('click', () => {
                        // Level isn't specified in trades sheet, default to level 15 or 20, or let's load at level 20
                        loadEncounterPokemon(t.receive, "20");
                    });

                    grid.appendChild(card);
                });
                contentSlot.appendChild(grid);
            }

        } else if (activeTab === 'game_corner') {
            const grid = document.createElement('div');
            grid.className = 'encounters-global-grid';

            const filteredCorner = db.game_corner.filter(p => {
                return !query || p.species.toLowerCase().includes(query);
            });

            if (filteredCorner.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'encounters-empty-state';
                empty.textContent = 'Nessun premio Casinò trovato.';
                contentSlot.appendChild(empty);
            } else {
                filteredCorner.forEach(p => {
                    const spriteName = getSpriteFilename(p.species);
                    const card = document.createElement('div');
                    card.className = 'encounters-card';

                    const img = document.createElement('img');
                    img.className = 'encounters-card-img';
                    img.src = `./img/pokesprite/${spriteName}.png`;
                    img.onerror = () => { img.src = './img/default.png'; };
                    card.appendChild(img);

                    const name = document.createElement('div');
                    name.className = 'encounters-card-name';
                    name.textContent = p.species;
                    card.appendChild(name);

                    const lvl = document.createElement('div');
                    lvl.className = 'encounters-card-lvl';
                    lvl.textContent = `Lv ${p.level}`;
                    card.appendChild(lvl);

                    const price = document.createElement('div');
                    price.className = 'encounters-card-rate';
                    price.textContent = p.price;
                    card.appendChild(price);

                    card.setAttribute('title', `${p.species}\nLivello: ${p.level}\nPrezzo: ${p.price}\n\nClicca per caricare nel Calcolatore`);

                    card.addEventListener('click', () => {
                        loadEncounterPokemon(p.species, p.level);
                    });

                    grid.appendChild(card);
                });
                contentSlot.appendChild(grid);
            }
        }
    }

    function ensureDexViewLoaded() {
        renderCustomEncountersView();
        return null;
    }

    function openDexFullPage(path, options) {
        const settings = options || {};
        const route = typeof path === 'string' ? path.replace(/^\/+/, '') : '';

        // Switch to tab
        if (settings.activateTab !== false && typeof window.setMainPageView === 'function') {
            window.setMainPageView('dex');
        }

        renderCustomEncountersView();

        // If path contains species name (e.g. "pokemon/hoothoot"), set it in search box
        if (route.startsWith('pokemon/')) {
            const speciesClean = route.split('pokemon/')[1];
            const searchInput = document.querySelector('.encounters-search-input');
            if (searchInput) {
                searchInput.value = speciesClean;
                searchTerm = speciesClean;
                // Dispatch input event
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
            }
        }
    }

    function openDexSpeciesLink(path) {
        openDexFullPage(path);
    }

    function syncDexFrameLayout() {}
    function syncDexModalLayout() {}
    function closeDexModal() {}

    $(document).ready(function() {
        if (encountersInitialized) {
            return;
        }
        encountersInitialized = true;

        $('#main-nav-dex').click(function(e) {
            e.preventDefault();
            openDexFullPage('');
        });

        $('#open-dex').click(function(e) {
            e.preventDefault();
            const dexPath = getPokemonDexPathFromPanelElement($(this).closest('.panel'));
            if (dexPath) {
                openDexSpeciesLink(dexPath);
                return;
            }
            openDexFullPage('');
        });

        $('.poke-sprite').click(function() {
            const dexPath = getPokemonDexPathFromSpriteElement(this);
            if (!dexPath) {
                return;
            }
            openDexSpeciesLink(dexPath);
        });

        $('#dex-show').click(function() {
            const dexPath = getPokemonDexPathFromPanelElement($(this).closest('.panel'));
            if (!dexPath) {
                return;
            }
            openDexSpeciesLink(dexPath);
        });

        window.ensureDexViewLoaded = ensureDexViewLoaded;
        window.syncDexFrameLayout = syncDexFrameLayout;
        window.syncDexModalLayout = syncDexModalLayout;
        window.openDexFullPage = openDexFullPage;
        window.openDexSpeciesLink = openDexSpeciesLink;
        window.closeDexModal = closeDexModal;
    });
})();
