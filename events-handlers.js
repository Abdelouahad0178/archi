// events-handlers.js - Gestionnaires d'événements ArchiDraw

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

// Touch handlers avec déplacement et rotation
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

        handleToolAction(x, y);
        
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
        handleMove(x, y);
        
    } else if (touches.length === 2 && isPinching) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
        const zoomFactor = currentPinchDistance / initialPinchDistance;
        zoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3);
        initialPinchDistance = currentPinchDistance;
        redraw();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    
    if (touches.length === 1) {
        if (isDragging || isRotating) {
            finishTransformation();
            return;
        }
        
        if (isDrawing) {
            const coords = getTouchCoordinates(touches[0]);
            const snapped = applyGridSnap(coords.x, coords.y);
            finishDrawing(snapped.x, snapped.y);
        }
    }
    isPinching = false;
}

// Mouse handlers avec coordonnées corrigées
function handleMouseDown(e) {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    const snapped = applyGridSnap(coords.x, coords.y);
    let x = snapped.x;
    let y = snapped.y;

    startX = x;
    startY = y;
    isDrawing = true;

    handleToolAction(x, y);
}

function handleMouseMove(e) {
    const coords = getCanvasCoordinates(e);
    const snapped = applyGridSnap(coords.x, coords.y);
    let x = snapped.x;
    let y = snapped.y;

    updateCoordinatesDisplay(x, y);
    updateCursor(x, y);
    handleMove(x, y);
}

function handleMouseUp(e) {
    if (isDragging || isRotating) {
        finishTransformation();
        return;
    }
    
    if (isDrawing) {
        const coords = getCanvasCoordinates(e);
        const snapped = applyGridSnap(coords.x, coords.y);
        finishDrawing(snapped.x, snapped.y);
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
            saveHistory();
            redraw();
        }
    }
}

function handleDoubleTap(e) {
    if (currentTool === 'select') {
        const coords = getCanvasCoordinates(e);
        selectShape(coords.x, coords.y);
        if (selectedShape && selectedShape.type === 'text') {
            const newText = prompt('Modifier le texte:', selectedShape.text);
            if (newText !== null && newText.trim() !== '') {
                selectedShape.text = newText.trim();
                saveHistory();
                redraw();
            }
        }
    }
}