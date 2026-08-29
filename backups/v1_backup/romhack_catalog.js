(function () {
    const games = {
        "hgimproved": {
            id: "hgimproved",
            title: "Heart Gold Migliorato",
            coverImage: "",
            description: "",
            sourceTitle: "Heart Gold Migliorato By Musoki",
            variants: [
                {
                    label: "Heart Gold Migliorato",
                    source: "?data=hgimproved",
                    coverImage: "",
                    description: "",
                    sourceTitle: "Heart Gold Migliorato By Musoki"
                }
            ]
        },
        "fireredimproved": {
            id: "fireredimproved",
            title: "Rosso Fuoco Migliorato",
            coverImage: "",
            description: "",
            sourceTitle: "Rosso Fuoco Migliorato By Musoki",
            variants: [
                {
                    label: "Rosso Fuoco Migliorato",
                    source: "?data=fireredimproved",
                    coverImage: "",
                    description: "",
                    sourceTitle: "Rosso Fuoco Migliorato By Musoki"
                }
            ]
        }
    };

    const sections = [
        {
            id: "featured",
            title: "Featured",
            gameIds: [
                "hgimproved",
                "fireredimproved"
            ]
        }
    ];

    function getDataKey(source) {
        try {
            // Use absolute URL parse fallback for relative paths
            const base = typeof window !== "undefined" ? window.location.href : "https://localhost";
            return new URL(source, base).searchParams.get("data") || "";
        } catch (error) {
            return "";
        }
    }

    const sourceTitles = {};
    const linkOptions = [];
    const seenLinkOptions = new Set();

    Object.keys(games).forEach((gameId) => {
        const game = games[gameId];
        if (!game || !Array.isArray(game.variants)) {
            return;
        }

        game.variants.forEach((variant) => {
            if (!variant || !variant.source || !variant.label) {
                return;
            }

            const dataKey = getDataKey(variant.source);
            if (dataKey && !sourceTitles[dataKey]) {
                sourceTitles[dataKey] = variant.sourceTitle || game.sourceTitle || game.title || variant.label;
            }

            const uniqueKey = `${variant.label}::${variant.source}`;
            if (seenLinkOptions.has(uniqueKey)) {
                return;
            }

            seenLinkOptions.add(uniqueKey);
            linkOptions.push({
                gameId: game.id,
                gameTitle: game.title,
                label: variant.label,
                source: variant.source
            });
        });
    });

    window.romhackCatalog = {
        sections: sections,
        games: games
    };
    window.romhackGameIndex = games;
    window.romhackLinkOptions = linkOptions;
    window.romhackSourceTitles = sourceTitles;
})();
