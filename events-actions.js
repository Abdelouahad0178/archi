// events-actions.js - Actions et raccourcis ArchiDraw avec redimensionnement

// Fonctions utilitaires pour les actions
function handleToolAction(x, y) {
    switch (currentTool) {
        case 'select':
            handleSelectAction(x, y);
            break;
        case 'erase':
            eraseAtPoint(x, y);
            break;
        case 'text':
            addText(x, y);
            isDrawing = false;
            break;
        case 'dimension':
            handleDimensionAction(x, y);
            break;
        default:
            // Autres outils de dessin - ne rien faire ici, le dessin se fait au move/up
            break;
    }
}

function handleSelectAction(x, y) {
    // Vérifier si on clique sur une poignée de redimensionnement
    const resizeHandleClicked = getResizeHandleAt(x, y);
    if (resizeHandleClicked && selectedShape) {
        startResize(resizeHandleClicked, selectedShape);
        isDrawing = false;
        updateCursorClass('cursor-resize');
        return;
    }
    
    // Vérifier si on clique sur une poignée de rotation
    const rotationHandle = getRotationHandleAt(x, y);
    if (rotationHandle && selectedShape) {
        isRotating = true;
        isDrawing = false;
        rotationCenter = getShapeCenter(selectedShape);
        initialRotation = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
        updateCursorClass('cursor-rotate');
        return;
    }
    
    // Vérifier si on clique sur une forme sélectionnée pour la déplacer
    if (selectedShape && isPointInShape(x, y, selectedShape)) {
        isDragging = true;
        isDrawing = false;
        dragStartX = x;
        dragStartY = y;
        updateCursorClass('cursor-move');
        return;
    }
    
    // Sinon, sélectionner une nouvelle forme
    selectShape(x, y);
    isDrawing = false;
}

function handleDimensionAction(x, y) {
    if (!dimensionStart) {
        dimensionStart = { x: x, y: y };
        isDrawing = false;
    } else {
        createDimension(dimensionStart.x, dimensionStart.y, x, y);
        dimensionStart = null;
        isDrawing = false;
    }
}

function handleMove(x, y) {
    if (isDragging && selectedShape) {
        const deltaX = x - dragStartX;
        const deltaY = y - dragStartY;
        moveShape(selectedShape, deltaX, deltaY);
        dragStartX = x;
        dragStartY = y;
        updateShapePropertiesPanel();
        redraw();
    } else if (isRotating && selectedShape) {
        const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
        const rotationAngle = currentAngle - initialRotation;
        rotateShape(selectedShape, rotationAngle, rotationCenter);
        initialRotation = currentAngle;
        redraw();
    } else if (isResizing && selectedShape) {
        performResize(x, y);
    } else if (isDrawing && shouldDrawTempShape()) {
        if (currentTool === 'erase') {
            eraseAtPoint(x, y);
        } else {
            redraw();
            drawTempShape(x, y);
        }
    }
}

function shouldDrawTempShape() {
    return currentTool !== 'select' && 
           currentTool !== 'erase' && 
           currentTool !== 'text' && 
           currentTool !== 'dimension';
}

function finishDrawing(endX, endY) {
    if (shouldDrawTempShape()) {
        createShape(endX, endY);
    }
    isDrawing = false;
}

function finishTransformation() {
    if (isDragging || isRotating || isResizing) {
        saveHistory();
    }
    
    if (isResizing) {
        finishResize();
    }
    
    isDragging = false;
    isRotating = false;
    resetCursor();
}

function updateCursorClass(newCursorClass) {
    // Supprimer les classes de curseur temporaires
    canvas.classList.remove('cursor-move', 'cursor-rotate', 'cursor-select', 'cursor-resize');
    
    // Réinitialiser le style de curseur personnalisé
    canvas.style.cursor = '';
    
    if (newCursorClass) {
        canvas.classList.add(newCursorClass);
    }
}

function resetCursor() {
    canvas.classList.remove('cursor-move', 'cursor-rotate', 'cursor-select', 'cursor-resize');
    canvas.style.cursor = '';
    
    if (currentTool !== 'erase') {
        canvas.classList.add(`cursor-${currentTool}`);
    }
}

// Fonctions de redimensionnement
function startResize(handle, shape) {
    isResizing = true;
    resizeHandle = handle;
    initialShapeState = JSON.parse(JSON.stringify(shape));
    showResizeInfo(true);
}

function performResize(x, y) {
    if (!isResizing || !resizeHandle || !selectedShape) return;
    
    const preserveAspectRatio = false; // Peut être modifié avec Shift dans le futur
    
    switch (selectedShape.type) {
        case 'line':
        case 'wall':
            resizeLine(selectedShape, resizeHandle, x, y);
            break;
            
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            resizeRectangle(selectedShape, resizeHandle, x, y, preserveAspectRatio);
            break;
            
        case 'circle':
            resizeCircle(selectedShape, x, y);
            break;
            
        case 'tree':
            resizeTree(selectedShape, resizeHandle, x, y);
            break;
    }
    
    updateResizeInfo();
    updateShapePropertiesPanel();
    redraw();
}

function resizeLine(shape, handle, x, y) {
    if (handle.type === 'start') {
        shape.startX = x;
        shape.startY = y;
    } else if (handle.type === 'end') {
        shape.endX = x;
        shape.endY = y;
    }
}

function resizeRectangle(shape, handle, x, y, preserveAspectRatio) {
    const minX = Math.min(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxX = Math.max(shape.startX, shape.endX);
    const maxY = Math.max(shape.startY, shape.endY);
    
    let newMinX = minX, newMinY = minY, newMaxX = maxX, newMaxY = maxY;
    
    switch (handle.type) {
        case 'nw': // Nord-Ouest
            newMinX = x;
            newMinY = y;
            break;
        case 'ne': // Nord-Est
            newMaxX = x;
            newMinY = y;
            break;
        case 'se': // Sud-Est
            newMaxX = x;
            newMaxY = y;
            break;
        case 'sw': // Sud-Ouest
            newMinX = x;
            newMaxY = y;
            break;
        case 'n': // Nord
            newMinY = y;
            break;
        case 'e': // Est
            newMaxX = x;
            break;
        case 's': // Sud
            newMaxY = y;
            break;
        case 'w': // Ouest
            newMinX = x;
            break;
    }
    
    // Assurer une taille minimale
    const minSize = 10;
    if (newMaxX - newMinX < minSize) {
        if (handle.type.includes('e')) {
            newMaxX = newMinX + minSize;
        } else if (handle.type.includes('w')) {
            newMinX = newMaxX - minSize;
        }
    }
    
    if (newMaxY - newMinY < minSize) {
        if (handle.type.includes('s')) {
            newMaxY = newMinY + minSize;
        } else if (handle.type.includes('n')) {
            newMinY = newMaxY - minSize;
        }
    }
    
    // Appliquer le nouveau rectangle
    shape.startX = newMinX;
    shape.startY = newMinY;
    shape.endX = newMaxX;
    shape.endY = newMaxY;
}

function resizeCircle(shape, x, y) {
    const dx = x - shape.startX;
    const dy = y - shape.startY;
    const newRadius = Math.sqrt(dx * dx + dy * dy);
    shape.radius = Math.max(5, newRadius); // Rayon minimum de 5px
}

function resizeTree(shape, handle, x, y) {
    // Pour les arbres, redimensionner comme un cercle
    const centerX = (shape.startX + shape.endX) / 2;
    const centerY = (shape.startY + shape.endY) / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const newRadius = Math.sqrt(dx * dx + dy * dy);
    const minRadius = 10;
    const finalRadius = Math.max(minRadius, newRadius);
    
    shape.startX = centerX - finalRadius;
    shape.startY = centerY - finalRadius;
    shape.endX = centerX + finalRadius;
    shape.endY = centerY + finalRadius;
}

function finishResize() {
    if (isResizing) {
        isResizing = false;
        resizeHandle = null;
        initialShapeState = null;
        showResizeInfo(false);
        updateShapePropertiesPanel();
    }
}

// Fonctions d'interface pour le redimensionnement
function showResizeInfo(show) {
    const resizeInfo = document.getElementById('resizeInfo');
    if (resizeInfo) {
        if (show) {
            resizeInfo.classList.add('show');
            updateResizeInfo();
        } else {
            resizeInfo.classList.remove('show');
        }
    }
}

function updateResizeInfo() {
    if (!selectedShape || !isResizing) return;
    
    const details = document.getElementById('resizeDetails');
    if (!details) return;
    
    let info = '';
    
    switch (selectedShape.type) {
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            const width = Math.abs(selectedShape.endX - selectedShape.startX);
            const height = Math.abs(selectedShape.endY - selectedShape.startY);
            info = `<div><strong>Largeur:</strong> ${Math.round(width)}px</div>
                   <div><strong>Hauteur:</strong> ${Math.round(height)}px</div>`;
            break;
            
        case 'circle':
            info = `<div><strong>Rayon:</strong> ${Math.round(selectedShape.radius)}px</div>
                   <div><strong>Diamètre:</strong> ${Math.round(selectedShape.radius * 2)}px</div>`;
            break;
            
        case 'line':
        case 'wall':
            const length = Math.sqrt(
                Math.pow(selectedShape.endX - selectedShape.startX, 2) + 
                Math.pow(selectedShape.endY - selectedShape.startY, 2)
            );
            info = `<div><strong>Longueur:</strong> ${Math.round(length)}px</div>`;
            break;
            
        case 'tree':
            const treeWidth = Math.abs(selectedShape.endX - selectedShape.startX);
            const treeHeight = Math.abs(selectedShape.endY - selectedShape.startY);
            const treeRadius = Math.min(treeWidth, treeHeight) / 2;
            info = `<div><strong>Rayon:</strong> ${Math.round(treeRadius)}px</div>`;
            break;
    }
    
    details.innerHTML = info;
}

// Fonctions d'outils temporaires
function activateTemporaryTool(tool) {
    temporaryTool = currentTool;
    
    // Changer visuellement l'outil
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tool === tool) {
            btn.classList.add('active');
        }
    });
    
    currentTool = tool;
    canvas.classList.remove(...Array.from(canvas.classList).filter(c => c.startsWith('cursor-')));
    canvas.classList.add(`cursor-${tool}`);
}

function deactivateTemporaryTool() {
    if (temporaryTool) {
        // Restaurer l'outil précédent
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === temporaryTool) {
                btn.classList.add('active');
            }
        });
        
        currentTool = temporaryTool;
        canvas.classList.remove(...Array.from(canvas.classList).filter(c => c.startsWith('cursor-')));
        canvas.classList.add(`cursor-${currentTool}`);
        temporaryTool = null;
    }
}

// Fonctions utilitaires pour la sélection d'outils
function selectTool(toolName) {
    const toolButton = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
    if (toolButton) {
        toolButton.click();
    }
}

function selectAll() {
    // Sélectionner toutes les formes (pour une future implémentation)
    if (shapes.length > 0) {
        console.log('Sélection multiple non encore implémentée');
        // TODO: Implémenter la sélection multiple
    }
}

// Aide contextuelle pour les raccourcis
function showShortcutsHelp() {
    const helpInfo = `
    🎯 RACCOURCIS ARCHIDRAW :
    
    📐 OUTILS :
    • V = Sélection
    • L = Ligne  
    • T = Texte
    • E = Gomme
    • 1-9 = Outils par numéro
    
    ✏️ ACTIONS :
    • R = Rotation 90°
    • G = Grille on/off
    • S = Magnétisme on/off
    • Espace = Sélection temporaire
    • Échap = Désélectionner
    
    📏 REDIMENSIONNEMENT :
    • Poignées orange = Redimensionner
    • Shift + poignée = Proportions (futur)
    • Double-clic texte = Modifier
    
    📋 ÉDITION :
    • Ctrl+Z = Annuler
    • Ctrl+Y = Refaire
    • Ctrl+C = Copier
    • Ctrl+V = Coller
    • Ctrl+D = Dupliquer
    • Delete = Supprimer
    
    💾 FICHIER :
    • Ctrl+N = Nouveau
    • Ctrl+O = Ouvrir
    • Ctrl+S = Sauvegarder
    • Ctrl+E = Exporter PNG
    • Ctrl+P = Imprimer
    `;
    
    alert(helpInfo);
}

// Exporter la fonction d'aide pour l'utiliser ailleurs
window.showArchiDrawHelp = showShortcutsHelp;