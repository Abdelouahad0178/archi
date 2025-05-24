// events-actions.js - Actions et raccourcis ArchiDraw

// Variable pour l'outil temporaire
let temporaryTool = null;

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
        redraw();
    } else if (isRotating && selectedShape) {
        const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
        const rotationAngle = currentAngle - initialRotation;
        rotateShape(selectedShape, rotationAngle, rotationCenter);
        initialRotation = currentAngle;
        redraw();
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
    saveHistory();
    isDragging = false;
    isRotating = false;
    resetCursor();
}

function updateCoordinatesDisplay(x, y) {
    document.getElementById('coords').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
}

function updateCursor(x, y) {
    if (currentTool === 'select' && !isDragging && !isRotating) {
        const rotationHandle = getRotationHandleAt(x, y);
        if (rotationHandle && selectedShape) {
            updateCursorClass('cursor-rotate');
        } else if (selectedShape && isPointInShape(x, y, selectedShape)) {
            updateCursorClass('cursor-move');
        } else {
            updateCursorClass('cursor-select');
        }
    }
}

function updateCursorClass(newCursorClass) {
    // Supprimer les classes de curseur temporaires
    canvas.classList.remove('cursor-move', 'cursor-rotate', 'cursor-select');
    canvas.classList.add(newCursorClass);
}

function resetCursor() {
    canvas.classList.remove('cursor-move', 'cursor-rotate', 'cursor-select');
    if (currentTool !== 'erase') {
        canvas.classList.add(`cursor-${currentTool}`);
    }
}

// Gestion des raccourcis clavier
function handleKeyDown(e) {
    // Prévenir les actions par défaut pour certaines touches
    if (['Delete', 'Escape', ' '].includes(e.key) || 
        (e.ctrlKey && ['z', 'y', 'c', 'v', 'd'].includes(e.key.toLowerCase())) ||
        (e.key >= '1' && e.key <= '9') ||
        (e.key === 'r' && selectedShape && currentTool === 'select')) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'Delete':
            if (selectedShape) {
                deleteSelected();
            }
            break;
            
        case 'Escape':
            selectedShape = null;
            // Supprimer les infos de transformation
            const existingInfo = document.getElementById('transformInfo');
            if (existingInfo) {
                existingInfo.remove();
            }
            redraw();
            break;
            
        case ' ':
            if (currentTool !== 'select' && !temporaryTool) {
                activateTemporaryTool('select');
            }
            break;
            
        case 'r':
        case 'R':
            if (selectedShape && currentTool === 'select') {
                const center = getShapeCenter(selectedShape);
                rotateShape(selectedShape, Math.PI / 2, center);
                saveHistory();
                redraw();
            }
            break;
            
        case 'g':
        case 'G':
            // Basculer la grille
            toggleGrid();
            break;
            
        case 's':
        case 'S':
            if (e.ctrlKey) {
                // Sauvegarder
                saveDrawing();
            } else {
                // Basculer le magnétisme
                toggleSnap();
            }
            break;
            
        case 'l':
        case 'L':
            if (!e.ctrlKey) {
                // Outil ligne
                selectTool('line');
            }
            break;
            
        case 't':
        case 'T':
            if (!e.ctrlKey) {
                // Outil texte
                selectTool('text');
            }
            break;
            
        case 'v':
        case 'V':
            if (!e.ctrlKey) {
                // Outil sélection
                selectTool('select');
            } else {
                // Coller
                pasteSelected();
            }
            break;
            
        case 'e':
        case 'E':
            if (!e.ctrlKey) {
                // Outil gomme
                selectTool('erase');
            }
            break;
            
        default:
            if (e.ctrlKey) {
                handleCtrlShortcuts(e);
            } else if (e.key >= '1' && e.key <= '9') {
                handleNumberShortcuts(e);
            }
            break;
    }
}

function handleKeyUp(e) {
    if (e.key === ' ' && temporaryTool) {
        deactivateTemporaryTool();
    }
}

function handleCtrlShortcuts(e) {
    switch (e.key.toLowerCase()) {
        case 'z':
            undo();
            break;
        case 'y':
            redo();
            break;
        case 'c':
            copySelected();
            break;
        case 'v':
            pasteSelected();
            break;
        case 'd':
            duplicateSelected();
            break;
        case 'a':
            // Sélectionner tout
            selectAll();
            break;
        case 'o':
            // Ouvrir
            loadDrawing();
            break;
        case 's':
            // Sauvegarder
            saveDrawing();
            break;
        case 'n':
            // Nouveau
            if (confirm('Créer un nouveau dessin ? (Le dessin actuel sera perdu)')) {
                clearCanvas();
            }
            break;
        case 'p':
            // Imprimer
            printDrawing();
            break;
        case 'e':
            // Exporter
            exportImage();
            break;
    }
}

function handleNumberShortcuts(e) {
    const toolIndex = parseInt(e.key) - 1;
    const toolButtons = document.querySelectorAll('.tool-btn');
    if (toolIndex < toolButtons.length) {
        toolButtons[toolIndex].click();
    }
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

// Fonctions de validation pour les raccourcis
function canUseShortcut(key) {
    // Vérifier si on est dans un champ de saisie
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return false;
    }
    return true;
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