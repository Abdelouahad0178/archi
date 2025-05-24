// main.js - Initialisation principale ArchiDraw

// Initialisation - Version finale avec canvas maximisé
function init() {
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
    console.log('  ✅ Canvas maximisé plein écran');
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

// Export des fonctions principales pour debug
window.ArchiDraw = {
    version: '2.1.0',
    shapes: () => shapes,
    selectedShape: () => selectedShape,
    currentTool: () => currentTool,
    zoom: () => zoom,
    canvasSize: () => ({ width: canvas.width, height: canvas.height }),
    redraw: redraw,
    saveDrawing: saveDrawing,
    loadDrawing: loadDrawing,
    clearCanvas: clearCanvas,
    toggleFullscreen: toggleFullscreen
};