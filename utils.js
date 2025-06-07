// utils.js - Fonctions utilitaires ArchiDraw avec support rotation universelle

// Historique (Undo/Redo)
function saveHistory() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    // Limiter l'historique pour éviter la consommation excessive de mémoire
    if (history.length > PERFORMANCE_CONFIG.historyLimit) {
        history.shift();
        historyStep = PERFORMANCE_CONFIG.historyLimit - 1;
    }
    history.push(JSON.parse(JSON.stringify(shapes)));
    updateHistoryButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        shapes = JSON.parse(JSON.stringify(history[historyStep]));
        selectedShape = null;
        // Supprimer les infos de transformation
        const existingInfo = document.getElementById('transformInfo');
        if (existingInfo) {
            existingInfo.remove();
        }
        redraw();
        updateHistoryButtons();
        updateShapePropertiesPanel();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        shapes = JSON.parse(JSON.stringify(history[historyStep]));
        selectedShape = null;
        // Supprimer les infos de transformation
        const existingInfo = document.getElementById('transformInfo');
        if (existingInfo) {
            existingInfo.remove();
        }
        redraw();
        updateHistoryButtons();
        updateShapePropertiesPanel();
    }
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) undoBtn.disabled = historyStep <= 0;
    if (redoBtn) redoBtn.disabled = historyStep >= history.length - 1;
}

// Copier/Coller/Dupliquer avec préservation de la rotation
function copySelected() {
    if (selectedShape) {
        clipboard = JSON.parse(JSON.stringify(selectedShape));
        // Créer une notification visuelle
        showNotification('✅ Élément copié !', 'success');
    } else {
        showNotification('⚠️ Aucune forme sélectionnée', 'warning');
    }
}

function pasteSelected() {
    if (clipboard) {
        const newShape = JSON.parse(JSON.stringify(clipboard));
        
        // Décaler la position pour éviter le chevauchement
        const offset = 20;
        if (newShape.startX !== undefined) {
            newShape.startX += offset;
            newShape.startY += offset;
        }
        if (newShape.endX !== undefined) {
            newShape.endX += offset;
            newShape.endY += offset;
        }
        if (newShape.x !== undefined) {
            newShape.x += offset;
            newShape.y += offset;
        }
        
        // Préserver la rotation si elle existe
        if (newShape.rotation === undefined) {
            newShape.rotation = 0;
        }
        
        shapes.push(newShape);
        selectedShape = newShape;
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('📋 Élément collé !', 'success');
    } else {
        showNotification('⚠️ Aucun élément dans le presse-papier', 'warning');
    }
}

function duplicateSelected() {
    if (selectedShape) {
        const newShape = JSON.parse(JSON.stringify(selectedShape));
        
        // Décaler la position
        const offset = 30;
        if (newShape.startX !== undefined) {
            newShape.startX += offset;
            newShape.startY += offset;
        }
        if (newShape.endX !== undefined) {
            newShape.endX += offset;
            newShape.endY += offset;
        }
        if (newShape.x !== undefined) {
            newShape.x += offset;
            newShape.y += offset;
        }
        
        shapes.push(newShape);
        selectedShape = newShape;
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('⧉ Élément dupliqué !', 'success');
    } else {
        showNotification('⚠️ Aucune forme sélectionnée', 'warning');
    }
}

function deleteSelected() {
    if (selectedShape) {
        const shapeType = selectedShape.type;
        shapes = shapes.filter(s => s !== selectedShape);
        selectedShape = null;
        // Supprimer les infos de transformation
        const existingInfo = document.getElementById('transformInfo');
        if (existingInfo) {
            existingInfo.remove();
        }
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification(`🗑️ ${shapeType} supprimé`, 'info');
    } else {
        showNotification('⚠️ Aucune forme sélectionnée', 'warning');
    }
}

// Arrangement avec préservation de la rotation
function bringToFront() {
    if (selectedShape) {
        const index = shapes.indexOf(selectedShape);
        if (index > -1) {
            shapes.splice(index, 1);
            shapes.push(selectedShape);
            saveHistory();
            redraw();
            showNotification('⬆️ Élément au premier plan', 'info');
        }
    }
}

function sendToBack() {
    if (selectedShape) {
        const index = shapes.indexOf(selectedShape);
        if (index > -1) {
            shapes.splice(index, 1);
            shapes.unshift(selectedShape);
            saveHistory();
            redraw();
            showNotification('⬇️ Élément à arrière-plan', 'info');
        }
    }
}

// Alignement avec support de tous les outils
function alignLeft() {
    if (selectedShape && shapes.length > 1) {
        let minX = Infinity;
        
        // Trouver la position X minimale
        shapes.forEach(s => {
            if (s.startX !== undefined) minX = Math.min(minX, s.startX);
            if (s.x !== undefined) minX = Math.min(minX, s.x);
        });
        
        // Appliquer l'alignement
        if (selectedShape.startX !== undefined) {
            const diff = selectedShape.startX - minX;
            selectedShape.startX = minX;
            if (selectedShape.endX !== undefined) selectedShape.endX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = minX;
        }
        
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('⇤ Aligné à gauche', 'info');
    }
}

function alignCenter() {
    if (selectedShape && shapes.length > 1) {
        let totalX = 0;
        let count = 0;
        
        // Calculer le centre moyen
        shapes.forEach(s => {
            if (s.startX !== undefined && s.endX !== undefined) {
                totalX += (s.startX + s.endX) / 2;
                count++;
            } else if (s.x !== undefined) {
                totalX += s.x;
                count++;
            }
        });
        
        const avgX = totalX / count;
        
        // Appliquer l'alignement
        if (selectedShape.startX !== undefined && selectedShape.endX !== undefined) {
            const currentCenter = (selectedShape.startX + selectedShape.endX) / 2;
            const diff = currentCenter - avgX;
            selectedShape.startX -= diff;
            selectedShape.endX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = avgX;
        }
        
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('≡ Centré horizontalement', 'info');
    }
}

function alignRight() {
    if (selectedShape && shapes.length > 1) {
        let maxX = -Infinity;
        
        // Trouver la position X maximale
        shapes.forEach(s => {
            if (s.endX !== undefined) maxX = Math.max(maxX, s.endX);
            else if (s.startX !== undefined) maxX = Math.max(maxX, s.startX);
            if (s.x !== undefined) maxX = Math.max(maxX, s.x);
        });
        
        // Appliquer l'alignement
        if (selectedShape.endX !== undefined) {
            const diff = selectedShape.endX - maxX;
            selectedShape.endX = maxX;
            if (selectedShape.startX !== undefined) selectedShape.startX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = maxX;
        }
        
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('⇥ Aligné à droite', 'info');
    }
}

// Zoom amélioré
function zoomIn() {
    const newZoom = Math.min(zoom * 1.2, ZOOM_CONFIG.max);
    if (newZoom !== zoom) {
        zoom = newZoom;
        redraw();
        if (showRuler) drawRulers();
        showNotification(`🔍+ Zoom: ${Math.round(zoom * 100)}%`, 'info');
    }
}

function zoomOut() {
    const newZoom = Math.max(zoom * 0.8, ZOOM_CONFIG.min);
    if (newZoom !== zoom) {
        zoom = newZoom;
        redraw();
        if (showRuler) drawRulers();
        showNotification(`🔍- Zoom: ${Math.round(zoom * 100)}%`, 'info');
    }
}

function zoomFit() {
    if (shapes.length === 0) {
        zoom = 1;
        redraw();
        if (showRuler) drawRulers();
        return;
    }
    
    // Calculer les limites de tous les objets
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    shapes.forEach(shape => {
        if (shape.startX !== undefined) {
            minX = Math.min(minX, shape.startX);
            maxX = Math.max(maxX, shape.startX);
            minY = Math.min(minY, shape.startY);
            maxY = Math.max(maxY, shape.startY);
        }
        if (shape.endX !== undefined) {
            minX = Math.min(minX, shape.endX);
            maxX = Math.max(maxX, shape.endX);
            minY = Math.min(minY, shape.endY);
            maxY = Math.max(maxY, shape.endY);
        }
        if (shape.x !== undefined) {
            minX = Math.min(minX, shape.x);
            maxX = Math.max(maxX, shape.x);
            minY = Math.min(minY, shape.y);
            maxY = Math.max(maxY, shape.y);
        }
        if (shape.radius !== undefined) {
            minX = Math.min(minX, shape.startX - shape.radius);
            maxX = Math.max(maxX, shape.startX + shape.radius);
            minY = Math.min(minY, shape.startY - shape.radius);
            maxY = Math.max(maxY, shape.startY + shape.radius);
        }
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;
    
    const zoomX = (canvas.width - padding * 2) / contentWidth;
    const zoomY = (canvas.height - padding * 2) / contentHeight;
    
    zoom = Math.min(zoomX, zoomY, ZOOM_CONFIG.max);
    zoom = Math.max(zoom, ZOOM_CONFIG.min);
    
    redraw();
    if (showRuler) drawRulers();
    showNotification(`⊡ Ajusté: ${Math.round(zoom * 100)}%`, 'info');
}

// Options avec état persistant
function toggleGrid() {
    const gridBtn = document.getElementById('gridBtn');
    const checkbox = document.getElementById('showGrid');
    if (checkbox && gridBtn) {
        checkbox.checked = !checkbox.checked;
        gridBtn.classList.toggle('active', checkbox.checked);
        showGrid = checkbox.checked;
        redraw();
        showNotification(showGrid ? '⊞ Grille activée' : '⊞ Grille désactivée', 'info');
    }
}

function toggleSnap() {
    snapToGrid = !snapToGrid;
    const snapBtn = document.getElementById('snapBtn');
    if (snapBtn) {
        snapBtn.classList.toggle('active', snapToGrid);
        showNotification(snapToGrid ? '🧲 Magnétisme activé' : '🧲 Magnétisme désactivé', 'info');
    }
}

function toggleRuler() {
    showRuler = !showRuler;
    const rulerBtn = document.getElementById('rulerBtn');
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    if (rulerBtn) rulerBtn.classList.toggle('active', showRuler);
    
    if (rulerH && rulerV) {
        if (showRuler) {
            rulerH.style.display = 'flex';
            rulerV.style.display = 'flex';
            drawRulers();
        } else {
            rulerH.style.display = 'none';
            rulerV.style.display = 'none';
        }
        showNotification(showRuler ? '📏 Règles activées' : '📏 Règles désactivées', 'info');
    }
}

function toggleProperties() {
    const properties = document.querySelector('.properties');
    if (properties) {
        properties.classList.toggle('hidden');
        properties.classList.toggle('active');
        interfaceState.propertiesPanelVisible = !properties.classList.contains('hidden');
    }
}

// Export/Import amélioré avec métadonnées
function exportImage() {
    try {
        // Créer un canvas temporaire pour l'export
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copier les dimensions
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Fond blanc pour l'export
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Dessiner le contenu
        tempCtx.drawImage(canvas, 0, 0);
        
        // Ajouter les métadonnées dans un coin
        tempCtx.fillStyle = 'rgba(0,0,0,0.7)';
        tempCtx.fillRect(10, 10, 200, 60);
        tempCtx.fillStyle = 'white';
        tempCtx.font = '12px Arial';
        tempCtx.fillText(`ArchiDraw v${window.ArchiDraw?.version || '3.0'}`, 15, 25);
        tempCtx.fillText(`${shapes.length} formes`, 15, 40);
        tempCtx.fillText(new Date().toLocaleDateString(), 15, 55);
        
        const link = document.createElement('a');
        link.download = `plan_architectural_${new Date().toISOString().split('T')[0]}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0);
        link.click();
        
        showNotification('🖼️ Image exportée avec succès !', 'success');
    } catch (error) {
        console.error('Erreur export:', error);
        showNotification('❌ Erreur lors de l\'export', 'error');
    }
}

// Utility functions
function updateStrokeWidthDisplay() {
    const strokeWidthValue = document.getElementById('strokeWidthValue');
    const strokeWidth = document.getElementById('strokeWidth');
    if (strokeWidthValue && strokeWidth) {
        strokeWidthValue.textContent = strokeWidth.value;
    }
}

function clearCanvas() {
    if (shapes.length === 0) {
        showNotification('⚠️ Le canvas est déjà vide', 'warning');
        return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir effacer tout le dessin ?')) {
        shapes = [];
        selectedShape = null;
        // Supprimer les infos de transformation
        const existingInfo = document.getElementById('transformInfo');
        if (existingInfo) {
            existingInfo.remove();
        }
        history = [];
        historyStep = -1;
        saveHistory();
        redraw();
        updateShapePropertiesPanel();
        showNotification('🗑️ Canvas effacé', 'info');
    }
}

function saveDrawing() {
    try {
        const projectStats = window.ArchiDraw?.stats ? window.ArchiDraw.stats() : {};
        
        const data = {
            version: window.ArchiDraw?.version || '3.0.0',
            timestamp: new Date().toISOString(),
            shapes: shapes,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            zoom: zoom,
            settings: {
                showGrid: showGrid,
                snapToGrid: snapToGrid,
                showRuler: showRuler,
                gridSize: parseInt(document.getElementById('gridSize')?.value || 20)
            },
            stats: projectStats
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `archidraw_projet_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('💾 Projet sauvegardé !', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showNotification('❌ Erreur lors de la sauvegarde', 'error');
    }
}

function loadDrawing() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Vérifier la compatibilité
                if (data.version && data.version.startsWith('3.')) {
                    // Format v3.x compatible
                    shapes = data.shapes || [];
                    
                    // Restaurer les paramètres si disponibles
                    if (data.settings) {
                        if (data.settings.showGrid !== undefined) {
                            const gridCheckbox = document.getElementById('showGrid');
                            if (gridCheckbox) gridCheckbox.checked = data.settings.showGrid;
                            showGrid = data.settings.showGrid;
                        }
                        if (data.settings.snapToGrid !== undefined) {
                            snapToGrid = data.settings.snapToGrid;
                        }
                        if (data.settings.zoom !== undefined) {
                            zoom = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, data.zoom || 1));
                        }
                    }
                } else {
                    // Format ancien ou inconnu
                    shapes = data.shapes || data || [];
                }
                
                selectedShape = null;
                saveHistory();
                redraw();
                updateShapePropertiesPanel();
                
                const shapeCount = shapes.length;
                const version = data.version || 'version inconnue';
                showNotification(`📁 Projet chargé ! (${shapeCount} formes, ${version})`, 'success');
                
            } catch (error) {
                console.error('Erreur chargement:', error);
                showNotification('❌ Erreur lors du chargement du fichier', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function printDrawing() {
    // Optimiser pour l'impression
    const originalZoom = zoom;
    zoom = 1; // Zoom optimal pour l'impression
    redraw();
    
    setTimeout(() => {
        window.print();
        // Restaurer le zoom après impression
        zoom = originalZoom;
        redraw();
    }, 100);
}

// Système de notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `archidraw-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease, slideUp 0.3s ease 2.7s forwards;
        max-width: 400px;
        text-align: center;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #4CAF50, #45a049)',
        error: 'linear-gradient(135deg, #f44336, #d32f2f)',
        warning: 'linear-gradient(135deg, #ff9800, #f57c00)',
        info: 'linear-gradient(135deg, #2196f3, #1976d2)'
    };
    return colors[type] || colors.info;
}

// Fonctions de sélection d'outils
function selectTool(toolName) {
    const toolButton = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
    if (toolButton) {
        toolButton.click();
        return true;
    }
    return false;
}

function selectAll() {
    // Sélection multiple (fonctionnalité future)
    if (shapes.length > 0) {
        showNotification(`📋 ${shapes.length} formes disponibles (sélection multiple: bientôt disponible)`, 'info');
    } else {
        showNotification('⚠️ Aucune forme à sélectionner', 'warning');
    }
}

// Statistiques et debug
function getCanvasStats() {
    const stats = {
        formes: shapes.length,
        formesParType: {},
        formesTournees: 0,
        zoom: `${Math.round(zoom * 100)}%`,
        taille: `${canvas.width}×${canvas.height}`,
        grille: showGrid,
        magnetisme: snapToGrid,
        regle: showRuler
    };
    
    shapes.forEach(shape => {
        stats.formesParType[shape.type] = (stats.formesParType[shape.type] || 0) + 1;
        if (shape.rotation && shape.rotation !== 0) {
            stats.formesTournees++;
        }
    });
    
    return stats;
}

// Export des fonctions globales pour compatibilité
window.saveHistory = saveHistory;
window.undo = undo;
window.redo = redo;
window.updateHistoryButtons = updateHistoryButtons;
window.copySelected = copySelected;
window.pasteSelected = pasteSelected;
window.duplicateSelected = duplicateSelected;
window.deleteSelected = deleteSelected;
window.bringToFront = bringToFront;
window.sendToBack = sendToBack;
window.alignLeft = alignLeft;
window.alignCenter = alignCenter;
window.alignRight = alignRight;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomFit = zoomFit;
window.toggleGrid = toggleGrid;
window.toggleSnap = toggleSnap;
window.toggleRuler = toggleRuler;
window.toggleProperties = toggleProperties;
window.exportImage = exportImage;
window.updateStrokeWidthDisplay = updateStrokeWidthDisplay;
window.clearCanvas = clearCanvas;
window.saveDrawing = saveDrawing;
window.loadDrawing = loadDrawing;
window.printDrawing = printDrawing;
window.showNotification = showNotification;
window.selectTool = selectTool;
window.selectAll = selectAll;

// Export des fonctions utilitaires
window.ArchiDrawUtils = {
    stats: getCanvasStats,
    notification: showNotification,
    selectTool: selectTool,
    exportImage: exportImage,
    saveDrawing: saveDrawing,
    loadDrawing: loadDrawing,
    clearCanvas: clearCanvas
};

// CSS pour les animations des notifications
const notificationCSS = `
@keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
}
`;

// Ajouter le CSS si pas déjà présent
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = notificationCSS;
    document.head.appendChild(style);
}