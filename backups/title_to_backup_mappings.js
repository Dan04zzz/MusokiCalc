backupFiles = {
	"Heart Gold Migliorato By Musoki": "hgimproved"
}

sourceTitleAliases = {
	"hgimproved": "Heart Gold Migliorato By Musoki"
}

if (typeof window !== "undefined") {
	window.romhackSourceTitles = window.romhackSourceTitles || {}

	Object.keys(backupFiles).forEach(function(title) {
		var alias = backupFiles[title]
		if (alias && !window.romhackSourceTitles[alias]) {
			window.romhackSourceTitles[alias] = title
		}
	})

	Object.keys(sourceTitleAliases).forEach(function(sourceId) {
		if (!window.romhackSourceTitles[sourceId]) {
			window.romhackSourceTitles[sourceId] = sourceTitleAliases[sourceId]
		}
	})
}

gameVersions = {}

