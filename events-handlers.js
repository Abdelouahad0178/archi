// events-handlers.js - Gestionnaires d'événements ArchiDraw avec redimensionnement

// Configuration des événements
function setupEventListeners() {
    // Outils avec curseurs personnalisés
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tool-btn').forEach(b => {
                b.classList.remove('active', 'erase-mode');
            });
            this.classList.add('active');
            currentTool = this.dataset.tool;
            
            // Supprimer toutes les classes de curseur précédentes
            canvas.className = canvas.className.split(' ').filter(c => !c.startsWith('cursor-')).join(' ');
            
            // Gestion spéciale pour la gomme
            if (currentTool === 'erase') {
                this.classList.add('erase-mode');
                document.querySelector('.canvas-area').classList.add('erase-mode');
                document.getElementById('eraserSize').classList.add('show');
            } else {
                document.querySelector('.canvas-area').classList.remove('erase-mode');
                document.getElementById('eraserSize').classList.remove('show');
                
                // Appliquer le curseur spécialisé
                canvas.classList.add(`cursor-${currentTool}`);
            }
        });
        
        // Support tactile pour les boutons d'outils
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
    });

    // Canvas events avec correction de position
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('dblclick', handleDoubleClick);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Properties
    document.getElementById('strokeWidth').addEventListener('input', updateStrokeWidthDisplay);
    document.getElementById('showGrid').addEventListener('change', redraw);
    document.getElementById('gridSize').addEventListener('change', redraw);

    // Événements pour les propriétés de forme
    ['shapeWidth', 'shapeHeight', 'shapeX', 'shapeY', 'shapeRadius'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateShapePropertiesDisplay);
        }
    });

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Fonction pour obtenir les coordonnées précises de la souris
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX / zoom,
        y: (e.clientY - rect.top) * scaleY / zoom
    };
}

// Fonction pour obtenir les coordonnées tactiles précises
function getTouchCoordinates(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (touch.clientX - rect.left) * scaleX / zoom,
        y: (touch.clientY - rect.top) * scaleY / zoom
    };
}

// Fonction pour appliquer le magnétisme à la grille
function applyGridSnap(x, y) {
    if (snapToGrid) {
        const gridSize = parseInt(document.getElementById('gridSize').value);
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }
    return { x, y };
}

// Fonctions utilitaires
function updateCoordinatesDisplay(x, y) {
    const coordsElement = document.getElementById('coords');
    if (coordsElement) {
        coordsElement.textContent = `📍 X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }
}

function updateCursor(x, y) {
    if (currentTool === 'select' && !isDragging && !isRotating && !isResizing) {
        const resizeHandle = getResizeHandleAt && getResizeHandleAt(x, y);
        if (resizeHandle && selectedShape) {
            // Définir le curseur selon le type de poignée
            updateResizeCursor(resizeHandle.type);
        } else {
            const rotationHandle = getRotationHandleAt && getRotationHandleAt(x, y);
            if (rotationHandle && selectedShape) {
                updateCursorClass('cursor-rotate');
            } else if (selectedShape && isPointInShape && isPointInShape(x, y, selectedShape)) {
                updateCursorClass('cursor-move');
            } else {
                updateCursorClass('cursor-select');
            }
        }
    }
}

function updateResizeCursor(handleType) {
    // Définir le curseur approprié selon la position de la poignée
    switch (handleType) {
        case 'nw':
        case 'se':
            canvas.style.cursor = 'nw-resize';
            break;
        case 'ne':
        case 'sw':
            canvas.style.cursor = 'ne-resize';
            break;
        case 'n':
        case 's':
            canvas.style.cursor = 'ns-resize';
            break;
        case 'e':
        case 'w':
            canvas.style.cursor = 'ew-resize';
            break;
        default:
            updateCursorClass('cursor-resize');
            break;
    }
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

// Touch handlers avec déplacement, rotation et redimensionnement
function handleTouchStart(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    
    if (touches.length === 1) {
        const coords = getTouchCoordinates(touches[0]);
        const snapped = applyGridSnap(coords.x, coords.y);
        let x = snapped.x;
        let y = snapped.y;

        const currentTime = new Date().getTime();
        const tapInterval = currentTime - lastTap;
        
        if (tapInterval < 300 && tapInterval > 0) {
            handleDoubleTap({ clientX: touches[0].clientX, clientY: touches[0].clientY });
            lastTap = 0;
            return;
        }
        
        lastTap = currentTime;
        startX = x;
        startY = y;
        isDrawing = true;

        if (typeof handleToolAction === 'function') {
            handleToolAction(x, y);
        }
        
    } else if (touches.length === 2) {
        isPinching = true;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    
    if (touches.length === 1 && !isPinching) {
        const coords = getTouchCoordinates(touches[0]);
        const snapped = applyGridSnap(coords.x, coords.y);
        let x = snapped.x;
        let y = snapped.y;

        updateCoordinatesDisplay(x, y);
        if (typeof handleMove === 'function') {
            handleMove(x, y);
        }
        
    } else if (touches.length === 2 && isPinching) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
        const zoomFactor = currentPinchDistance / initialPinchDistance;
        zoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3);
        initialPinchDistance = currentPinchDistance;
        if (typeof redraw === 'function') {
            redraw();
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    
    if (touches.length === 1) {
        if (isDragging || isRotating || isResizing) {
            if (typeof finishTransformation === 'function') {
                finishTransformation();
            }
            return;
        }
        
        if (isDrawing) {
            const coords = getTouchCoordinates(touches[0]);
            const snapped = applyGridSnap(coords.x, coords.y);
            if (typeof finishDrawing === 'function') {
                finishDrawing(snapped.x, snapped.y);
            }
        }
    }
    isPinching = false;
}

// Mouse handlers avec coordonnées corrigées et support du redimensionnement
function handleMouseDown(e) {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    const snapped = applyGridSnap(coords.x, coords.y);
    let x = snapped.x;
    let y = snapped.y;

    startX = x;
    startY = y;
    isDrawing = true;

    if (typeof handleToolAction === 'function') {
        handleToolAction(x, y);
    }
}

function handleMouseMove(e) {
    const coords = getCanvasCoordinates(e);
    const snapped = applyGridSnap(coords.x, coords.y);
    let x = snapped.x;
    let y = snapped.y;

    updateCoordinatesDisplay(x, y);
    updateCursor(x, y);
    if (typeof handleMove === 'function') {
        handleMove(x, y);
    }
}

function handleMouseUp(e) {
    if (isDragging || isRotating || isResizing) {
        if (typeof finishTransformation === 'function') {
            finishTransformation();
        }
        return;
    }
    
    if (isDrawing) {
        const coords = getCanvasCoordinates(e);
        const snapped = applyGridSnap(coords.x, coords.y);
        if (typeof finishDrawing === 'function') {
            finishDrawing(snapped.x, snapped.y);
        }
    }
}

function handleMouseLeave(e) {
    // Arrêter toutes les actions en cours si la souris sort du canvas
    if (isDrawing && currentTool !== 'select') {
        isDrawing = false;
    }
}

function handleDoubleClick(e) {
    if (currentTool === 'select' && selectedShape && selectedShape.type === 'text') {
        const newText = prompt('Modifier le texte:', selectedShape.text);
        if (newText !== null && newText.trim() !== '') {
            selectedShape.text = newText.trim();
            if (typeof saveHistory === 'function') {
                saveHistory();
            }
            if (typeof redraw === 'function') {
                redraw();
            }
        }
    }
}

function handleDoubleTap(e) {
    if (currentTool === 'select') {
        const coords = getCanvasCoordinates(e);
        if (typeof selectShape === 'function') {
            selectShape(coords.x, coords.y);
        }
        if (selectedShape && selectedShape.type === 'text') {
            const newText = prompt('Modifier le texte:', selectedShape.text);
            if (newText !== null && newText.trim() !== '') {
                selectedShape.text = newText.trim();
                if (typeof saveHistory === 'function') {
                    saveHistory();
                }
                if (typeof redraw === 'function') {
                    redraw();
                }
            }
        }
    }
}

// Gestion des raccourcis clavier
function handleKeyDown(e) {
    if (typeof canUseShortcut === 'function' && !canUseShortcut(e.key)) {
        return;
    }

    // Prévenir les actions par défaut pour certaines touches
    if (['Delete', 'Escape', ' '].includes(e.key) || 
        (e.ctrlKey && ['z', 'y', 'c', 'v', 'd'].includes(e.key.toLowerCase())) ||
        (e.key >= '1' && e.key <= '9') ||
        (e.key === 'r' && selectedShape && currentTool === 'select')) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'Delete':
            if (selectedShape && typeof deleteSelected === 'function') {
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
            if (typeof showResizeInfo === 'function') {
                showResizeInfo(false);
            }
            if (typeof updateShapePropertiesPanel === 'function') {
                updateShapePropertiesPanel();
            }
            if (typeof redraw === 'function') {
                redraw();
            }
            break;
            
        case ' ':
            if (currentTool !== 'select' && !temporaryTool && typeof activateTemporaryTool === 'function') {
                activateTemporaryTool('select');
            }
            break;
            
        case 'r':
        case 'R':
            if (selectedShape && currentTool === 'select') {
                if (typeof getShapeCenter === 'function' && typeof rotateShape === 'function') {
                    const center = getShapeCenter(selectedShape);
                    rotateShape(selectedShape, Math.PI / 2, center);
                    if (typeof updateShapePropertiesPanel === 'function') {
                        updateShapePropertiesPanel();
                    }
                    if (typeof saveHistory === 'function') {
                        saveHistory();
                    }
                    if (typeof redraw === 'function') {
                        redraw();
                    }
                }
            }
            break;
            
        case 'g':
        case 'G':
            if (typeof toggleGrid === 'function') {
                toggleGrid();
            }
            break;
            
        case 's':
        case 'S':
            if (e.ctrlKey) {
                if (typeof saveDrawing === 'function') {
                    saveDrawing();
                }
            } else {
                if (typeof toggleSnap === 'function') {
                    toggleSnap();
                }
            }
            break;
            
        case 'l':
        case 'L':
            if (!e.ctrlKey && typeof selectTool === 'function') {
                selectTool('line');
            }
            break;
            
        case 't':
        case 'T':
            if (!e.ctrlKey && typeof selectTool === 'function') {
                selectTool('text');
            }
            break;
            
        case 'v':
        case 'V':
            if (!e.ctrlKey && typeof selectTool === 'function') {
                selectTool('select');
            } else if (typeof pasteSelected === 'function') {
                pasteSelected();
            }
            break;
            
        case 'e':
        case 'E':
            if (!e.ctrlKey && typeof selectTool === 'function') {
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
    if (e.key === ' ' && temporaryTool && typeof deactivateTemporaryTool === 'function') {
        deactivateTemporaryTool();
    }
}

function handleCtrlShortcuts(e) {
    switch (e.key.toLowerCase()) {
        case 'z':
            if (typeof undo === 'function') undo();
            break;
        case 'y':
            if (typeof redo === 'function') redo();
            break;
        case 'c':
            if (typeof copySelected === 'function') copySelected();
            break;
        case 'v':
            if (typeof pasteSelected === 'function') pasteSelected();
            break;
        case 'd':
            if (typeof duplicateSelected === 'function') duplicateSelected();
            break;
        case 'a':
            if (typeof selectAll === 'function') selectAll();
            break;
        case 'o':
            if (typeof loadDrawing === 'function') loadDrawing();
            break;
        case 's':
            if (typeof saveDrawing === 'function') saveDrawing();
            break;
        case 'n':
            if (confirm('Créer un nouveau dessin ? (Le dessin actuel sera perdu)')) {
                if (typeof clearCanvas === 'function') clearCanvas();
            }
            break;
        case 'p':
            if (typeof printDrawing === 'function') printDrawing();
            break;
        case 'e':
            if (typeof exportImage === 'function') exportImage();
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

// Fonctions de validation pour les raccourcis
function canUseShortcut(key) {
    // Vérifier si on est dans un champ de saisie
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return false;
    }
    return true;
}