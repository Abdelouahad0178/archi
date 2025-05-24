// main.js - Initialisation principale ArchiDraw

// Initialisation - Version finale corrigée
function init() {
    canvas.width = Math.min(1000, window.innerWidth * 0.9);
    canvas.height = Math.min(700, window.innerHeight * 0.7);

    setupEventListeners();
    saveHistory();
    updateHistoryButtons();
    drawGrid();
    updateStrokeWidthDisplay();
    setupEraserControls();
    
    console.log('ArchiDraw initialisé avec succès - Déplacement et rotation 2D activés');
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
    console.log('  ✅ Dessin de formes géométriques');
    console.log('  ✅ Outils architecturaux (portes, fenêtres, escaliers...)');
    console.log('  ✅ Gomme intelligente avec effacement partiel');
    console.log('  ✅ Déplacement et rotation 2D');
    console.log('  ✅ Grille et magnétisme');
    console.log('  ✅ Règles et cotations');
    console.log('  ✅ Historique undo/redo');
    console.log('  ✅ Copier/coller/dupliquer');
    console.log('  ✅ Export PNG et sauvegarde JSON');
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    // Redimensionner le canvas si nécessaire
    const newWidth = Math.min(1000, window.innerWidth * 0.9);
    const newHeight = Math.min(700, window.innerHeight * 0.7);
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        redraw();
    }
    
    // Redessiner les règles si elles sont actives
    if (showRuler) {
        drawRulers();
    }
});

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

// Export des fonctions principales pour debug
window.ArchiDraw = {
    version: '2.0.0',
    shapes: () => shapes,
    selectedShape: () => selectedShape,
    currentTool: () => currentTool,
    zoom: () => zoom,
    redraw: redraw,
    saveDrawing: saveDrawing,
    loadDrawing: loadDrawing,
    clearCanvas: clearCanvas
};