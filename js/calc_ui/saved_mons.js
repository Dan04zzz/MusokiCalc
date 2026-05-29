(function () {
    // Manage Saved Mons persistent tab
    
    function getSavedCustomSets() {
        if (!localStorage.saved_mons) {
            return {};
        }
        try {
            return JSON.parse(localStorage.saved_mons);
        } catch (e) {
            return {};
        }
    }

    function getSavedDeadMons() {
        if (!localStorage.saved_dead_mons) {
            return [];
        }
        try {
            return JSON.parse(localStorage.saved_dead_mons);
        } catch (e) {
            return [];
        }
    }

    function generateShowdownText(customsets) {
        var speciesNames = Object.keys(customsets || {}).sort();
        var exportedSets = [];
        for (var i = 0; i < speciesNames.length; i++) {
            var speciesName = speciesNames[i];
            var myBoxSet = customsets[speciesName] && customsets[speciesName]["My Box"];
            if (myBoxSet && typeof window.buildShowdownExportText === "function") {
                var exportedText = window.buildShowdownExportText(speciesName, myBoxSet);
                if (exportedText) {
                    exportedSets.push(exportedText);
                }
            }
        }
        return exportedSets.join("\n\n");
    }

    function renderSavedMonsList() {
        const grid = document.getElementById('saved-mons-cards-grid');
        const textarea = document.getElementById('saved-mons-showdown');
        if (!grid) return;

        const savedMons = getSavedCustomSets();
        const showdownText = generateShowdownText(savedMons);
        
        if (textarea) {
            textarea.value = showdownText;
        }

        grid.innerHTML = '';
        const speciesNames = Object.keys(savedMons).sort();

        if (speciesNames.length === 0) {
            grid.innerHTML = '<div class="saved-mons-placeholder">No Pokémon saved yet. Click "Save Current Box" or paste Showdown format sets.</div>';
            return;
        }

        speciesNames.forEach(speciesName => {
            const setData = savedMons[speciesName]["My Box"];
            if (!setData) return;

            var spriteName = speciesName.toLowerCase().replace(" ", "-").replace(".", "").replace("’", "").replace(":", "-");
            if (typeof window.getPreviewSpriteName === "function") {
                spriteName = window.getPreviewSpriteName(speciesName);
            }

            const card = document.createElement('div');
            card.className = 'saved-mon-card';

            let movesHtml = '';
            const moves = setData.moves || [];
            for (let i = 0; i < 4; i++) {
                movesHtml += `<div class="saved-mon-move">${moves[i] || '-'}</div>`;
            }

            card.innerHTML = `
                <div class="saved-mon-card-header">
                    <img src="./img/sprites/${spriteName}.png" onerror="this.src='./img/fade.png'" class="saved-mon-sprite" alt="${speciesName}">
                    <div class="saved-mon-meta">
                        <div class="saved-mon-name">${setData.nn || speciesName}</div>
                        <div class="saved-mon-species">${speciesName}</div>
                        <div class="saved-mon-level">Lv. ${setData.level || 50}</div>
                    </div>
                    <button type="button" class="saved-mon-delete-btn" data-species="${speciesName}">&times;</button>
                </div>
                <div class="saved-mon-details">
                    <div class="saved-mon-detail"><strong>Item:</strong> ${setData.item || 'None'}</div>
                    <div class="saved-mon-detail"><strong>Ability:</strong> ${setData.ability || 'None'}</div>
                    <div class="saved-mon-detail"><strong>Nature:</strong> ${setData.nature || 'None'}</div>
                </div>
                <div class="saved-mon-moves-grid">
                    ${movesHtml}
                </div>
            `;

            grid.appendChild(card);
        });

        // Bind individual delete button
        grid.querySelectorAll('.saved-mon-delete-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const species = this.getAttribute('data-species');
                if (confirm(`Remove ${species} from saved Pokémon?`)) {
                    delete savedMons[species];
                    localStorage.saved_mons = JSON.stringify(savedMons);
                    renderSavedMonsList();
                }
            });
        });
    }

    function saveActiveBoxToSavedMons() {
        if (!localStorage.customsets || localStorage.customsets === '{}') {
            alert('Your active box is empty! Import a save file or some sets first.');
            return;
        }
        localStorage.saved_mons = localStorage.customsets;
        if (localStorage.deadMons) {
            localStorage.saved_dead_mons = localStorage.deadMons;
        }
        renderSavedMonsList();
        alert('Active box successfully saved to local browser storage!');
    }

    function loadSavedMonsToActiveBox() {
        if (!localStorage.saved_mons || localStorage.saved_mons === '{}') {
            alert('No saved Pokémon found in this browser!');
            return;
        }
        
        if (confirm('This will replace your current active box in the calculator. Continue?')) {
            localStorage.customsets = localStorage.saved_mons;
            if (localStorage.saved_dead_mons) {
                localStorage.deadMons = localStorage.saved_dead_mons;
            } else {
                localStorage.deadMons = '[]';
            }

            // Sync with calculator state
            const customsets = JSON.parse(localStorage.customsets);
            const deadMons = JSON.parse(localStorage.deadMons);
            
            if (typeof window.applyImportedBoxPreview === 'function') {
                window.applyImportedBoxPreview(customsets);
            }
            if (typeof window.syncImportedEncounterState === 'function') {
                window.syncImportedEncounterState(customsets, deadMons);
            }

            alert('Saved Pokémon loaded successfully into your active box!');
        }
    }

    function clearSavedMons() {
        if (confirm('Are you sure you want to permanently delete all saved Pokémon from this browser?')) {
            localStorage.removeItem('saved_mons');
            localStorage.removeItem('saved_dead_mons');
            renderSavedMonsList();
        }
    }

    function saveShowdownTextToSavedMons() {
        const textarea = document.getElementById('saved-mons-showdown');
        if (!textarea) return;
        
        const text = textarea.value.trim();
        if (!text) {
            alert('Please paste some showdown sets first.');
            return;
        }

        // Temporary backup active box
        const oldCustomsets = localStorage.customsets;
        const oldDeadMons = localStorage.deadMons;

        // Use the existing addSets flow to parse it
        try {
            if (typeof window.addSets === 'function') {
                // Clear active box temporarily to parse clean
                localStorage.customsets = '{}';
                localStorage.deadMons = '[]';
                
                window.addSets(text);

                // Now read what was parsed into customsets and save it to saved_mons
                localStorage.saved_mons = localStorage.customsets;
                localStorage.saved_dead_mons = localStorage.deadMons;

                alert('Showdown sets successfully parsed and saved!');
            } else {
                throw new Error('Showdown parser is unavailable');
            }
        } catch (e) {
            alert('Failed to parse Showdown sets. Please make sure the format is valid.');
        } finally {
            // Restore active box
            localStorage.customsets = oldCustomsets;
            localStorage.deadMons = oldDeadMons;
            
            // Render list
            renderSavedMonsList();
        }
    }

    function initializeSavedMonsView() {
        const saveBtn = document.getElementById('save-active-box');
        const loadBtn = document.getElementById('load-saved-box');
        const clearBtn = document.getElementById('clear-saved-mons');
        const saveShowdownBtn = document.getElementById('save-showdown-text');

        if (saveBtn) saveBtn.addEventListener('click', saveActiveBoxToSavedMons);
        if (loadBtn) loadBtn.addEventListener('click', loadSavedMonsToActiveBox);
        if (clearBtn) clearBtn.addEventListener('click', clearSavedMons);
        if (saveShowdownBtn) saveShowdownBtn.addEventListener('click', saveShowdownTextToSavedMons);

        renderSavedMonsList();
    }

    window.renderSavedMons = renderSavedMonsList;

    // Wait until document ready to initialize
    $(document).ready(initializeSavedMonsView);
})();
