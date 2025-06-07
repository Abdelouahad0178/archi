// main.js - Initialisation principale ArchiDraw avec rotation universelle

// main.js - Initialisation principale ArchiDraw avec rotation universelle

// Fonction de vérification des dépendances
function checkDependencies() {
    const requiredFunctions = [
        'createShape', 'rotateShape', 'getShapeCenter', 'moveShape',
        'selectShape', 'updateShapePropertiesPanel', 'saveHistory',
        'redraw', 'drawGrid', 'updateStrokeWidthDisplay', 'setupEraserControls',
        'getResizeHandles', 'getResizeHandleAt', 'getRotationHandles', 'getRotationHandleAt',
        'isPointInShape', 'addText', 'createDimension'
    ];
    
    const missing = requiredFunctions.filter(func => typeof window[func] === 'undefined');
    
    if (missing.length > 0) {
        console.warn('⚠️ Fonctions manquantes:', missing);
        return false;
    }
    
    return true;
}

// Initialisation - Version finale avec canvas maximisé et rotation universelle
function init() {
    try {
        // Vérifier les dépendances
        if (!checkDependencies()) {
            console.error('❌ Dépendances manquantes - initialisation reportée');
            setTimeout(init, 100); // Réessayer dans 100ms
            return;
        }
        
        // Calculer la taille maximale du canvas
        const toolbarWidth = window.innerWidth > 768 ? 70 : 60;
        const propertiesWidth = 250;
        const headerHeight = window.innerWidth > 768 ? 80 : 70;
        
        canvas.width = window.innerWidth - toolbarWidth - propertiesWidth;
        canvas.height = window.innerHeight - headerHeight;
        
        // Assurer une taille minimale
        canvas.width = Math.max(canvas.width, 800);
        canvas.height = Math.max(canvas.height, 600);

        setupEventListeners();
        saveHistory();
        updateHistoryButtons();
        drawGrid();
        updateStrokeWidthDisplay();
        setupEraserControls();
        
        console.log(`Canvas maximisé: ${canvas.width}x${canvas.height}px`);
        console.log('✅ ArchiDraw initialisé avec succès - Rotation universelle activée');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        setTimeout(init, 100); // Réessayer dans 100ms
    }
}

// Démarrage de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier que tous les éléments nécessaires sont présents
    if (!canvas) {
        console.error('Canvas non trouvé !');
        return;
    }
    
    // Initialiser l'application
    init();
    
    console.log('🎨 ArchiDraw - Plateforme de Dessin Architectural');
    console.log('📐 Fonctionnalités activées:');
    console.log('  ✅ Canvas maximisé plein écran');
    console.log('  ✅ Dessin de formes géométriques');
    console.log('  ✅ Outils architecturaux avancés:');
    console.log('    • Portes, fenêtres, escaliers, ascenseurs');
    console.log('    • Gaines techniques, conduits, tuyaux');
    console.log('    • Poteaux, colonnes, poutres');
    console.log('    • Meubles, cuisine, salle de bain');
    console.log('  ✅ Rotation universelle - TOUS les outils peuvent tourner');
    console.log('  ✅ Redimensionnement intelligent avec poignées');
    console.log('  ✅ Gomme intelligente avec effacement partiel');
    console.log('  ✅ Déplacement et rotation 2D');
    console.log('  ✅ Grille et magnétisme');
    console.log('  ✅ Règles et cotations');
    console.log('  ✅ Historique undo/redo');
    console.log('  ✅ Copier/coller/dupliquer');
    console.log('  ✅ Export PNG et sauvegarde JSON');
    console.log('  ✅ Raccourcis clavier intuitifs');
});

// Gestion du redimensionnement de la fenêtre - Version optimisée
window.addEventListener('resize', function() {
    // Recalculer la taille maximale du canvas
    const toolbarWidth = window.innerWidth > 768 ? 70 : 60;
    const propertiesWidth = document.querySelector('.properties').classList.contains('hidden') 
        ? 0 : (window.innerWidth > 768 ? 250 : 0);
    const headerHeight = window.innerWidth > 768 ? 80 : 70;
    
    const newWidth = window.innerWidth - toolbarWidth - propertiesWidth;
    const newHeight = window.innerHeight - headerHeight;
    
    // Assurer une taille minimale
    const finalWidth = Math.max(newWidth, 800);
    const finalHeight = Math.max(newHeight, 600);
    
    if (canvas.width !== finalWidth || canvas.height !== finalHeight) {
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        redraw();
        console.log(`Canvas redimensionné: ${canvas.width}x${canvas.height}px`);
    }
    
    // Redessiner les règles si elles sont actives
    if (showRuler) {
        drawRulers();
    }
});

// Fonction pour basculer le mode plein écran
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            // Redimensionner le canvas en plein écran
            setTimeout(() => {
                const event = new Event('resize');
                window.dispatchEvent(event);
            }, 100);
        });
    } else {
        document.exitFullscreen();
    }
}

// Prévenir la perte de données lors de la fermeture de la page
window.addEventListener('beforeunload', function(e) {
    if (shapes.length > 0) {
        const message = 'Vous avez des dessins non sauvegardés. Êtes-vous sûr de vouloir quitter ?';
        e.returnValue = message;
        return message;
    }
});

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur ArchiDraw:', e.error);
    alert('Une erreur s\'est produite. Veuillez sauvegarder votre travail et recharger la page.');
});

// Fonction pour afficher des statistiques de performance
function showPerformanceStats() {
    const stats = {
        shapesCount: shapes.length,
        canvasSize: `${canvas.width}x${canvas.height}`,
        zoom: `${Math.round(zoom * 100)}%`,
        selectedTool: currentTool,
        rotationSupport: 'Universelle - tous les outils',
        memoryUsage: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Non disponible'
    };
    
    console.table(stats);
    return stats;
}

// Fonction pour exporter les statistiques du projet
function getProjectStats() {
    const toolCounts = {};
    shapes.forEach(shape => {
        toolCounts[shape.type] = (toolCounts[shape.type] || 0) + 1;
    });
    
    const rotatedShapes = shapes.filter(s => s.rotation && s.rotation !== 0).length;
    
    return {
        totalShapes: shapes.length,
        toolDistribution: toolCounts,
        rotatedShapes: rotatedShapes,
        canvasDimensions: { width: canvas.width, height: canvas.height },
        currentZoom: zoom,
        gridEnabled: document.getElementById('showGrid').checked,
        snapEnabled: snapToGrid
    };
}

// Export des fonctions principales pour debug et API
window.ArchiDraw = {
    version: '3.0.0',
    features: [
        'Rotation universelle',
        'Nouveaux outils architecturaux',
        'Redimensionnement intelligent',
        'Canvas plein écran',
        'Gomme partielle',
        'Historique complet'
    ],
    shapes: () => shapes,
    selectedShape: () => selectedShape,
    currentTool: () => currentTool,
    zoom: () => zoom,
    canvasSize: () => ({ width: canvas.width, height: canvas.height }),
    stats: getProjectStats,
    performance: showPerformanceStats,
    
    // Fonctions principales
    redraw: redraw,
    saveDrawing: saveDrawing,
    loadDrawing: loadDrawing,
    clearCanvas: clearCanvas,
    toggleFullscreen: toggleFullscreen,
    
    // Fonctions de rotation (disponibles après chargement de shapes.js)
    get rotateSelected() { return typeof rotateSelected !== 'undefined' ? rotateSelected : null; },
    get getShapeCenter() { return typeof getShapeCenter !== 'undefined' ? getShapeCenter : null; },
    get rotateShape() { return typeof rotateShape !== 'undefined' ? rotateShape : null; },
    
    // Utilitaires
    selectTool: (tool) => {
        const btn = document.querySelector(`[data-tool="${tool}"]`);
        if (btn) btn.click();
    },
    
    // Mode développeur
    debugMode: false,
    enableDebug: () => {
        window.ArchiDraw.debugMode = true;
        console.log('🔧 Mode développeur activé');
        console.log('Utilisez ArchiDraw.stats() pour voir les statistiques');
        console.log('Utilisez ArchiDraw.performance() pour les performances');
    }
};

// Message de bienvenue avec nouvelles fonctionnalités
setTimeout(() => {
    if (shapes.length === 0) {
        console.log('🎯 NOUVELLES FONCTIONNALITÉS ARCHIDRAW 3.0:');
        console.log('🔄 Rotation universelle - TOUS les outils peuvent tourner');
        console.log('🏗️ Nouveaux outils: Gaines, Conduits, Poteaux, Poutres');
        console.log('🎮 Contrôles améliorés: Poignées bleues = rotation libre');
        console.log('⌨️ Raccourci R = rotation 90° sur forme sélectionnée');
        console.log('🖱️ Poignées orange = redimensionnement précis');
        console.log('💡 Tapez ArchiDraw.enableDebug() pour le mode développeur');
    }
}, 1000);

// Auto-sauvegarde en cas de plantage (optionnel)
let autoSaveInterval;

function enableAutoSave(intervalMinutes = 5) {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(() => {
        if (shapes.length > 0) {
            const backup = JSON.stringify({
                shapes: shapes,
                timestamp: new Date().toISOString(),
                version: window.ArchiDraw.version
            });
            
            try {
                localStorage.setItem('archidraw_backup', backup);
                console.log('💾 Sauvegarde automatique effectuée');
            } catch (e) {
                console.warn('⚠️ Impossible de sauvegarder automatiquement');
            }
        }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🔄 Auto-sauvegarde activée (${intervalMinutes} min)`);
}

// Fonction de récupération de backup
function restoreFromBackup() {
    try {
        const backup = localStorage.getItem('archidraw_backup');
        if (backup) {
            const data = JSON.parse(backup);
            if (confirm(`Restaurer la sauvegarde du ${new Date(data.timestamp).toLocaleString()} ?`)) {
                shapes = data.shapes || [];
                selectedShape = null;
                saveHistory();
                redraw();
                console.log('✅ Backup restauré avec succès');
                return true;
            }
        } else {
            alert('Aucune sauvegarde trouvée');
        }
    } catch (e) {
        console.error('❌ Erreur lors de la restauration:', e);
        alert('Erreur lors de la restauration du backup');
    }
    return false;
}

// Ajouter les fonctions de backup à l'API
window.ArchiDraw.enableAutoSave = enableAutoSave;
window.ArchiDraw.restoreFromBackup = restoreFromBackup;

// Initialisation optionnelle de l'auto-sauvegarde
// Décommentez la ligne suivante pour activer l'auto-sauvegarde toutes les 5 minutes
// enableAutoSave(5);