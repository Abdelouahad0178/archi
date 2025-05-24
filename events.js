// events.js - Gestion des événements ArchiDraw

// Configuration des événements
function setupEventListeners() {
    // Outils
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tool-btn').forEach(b => {
                b.classList.remove('active', 'erase-mode');
            });
            this.classList.add('active');
            currentTool = this.dataset.tool;
            
            // Gestion spéciale pour la gomme
            if (currentTool === 'erase') {
                this.classList.add('erase-mode');
                document.querySelector('.canvas-area').classList.add('erase-mode');
                document.getElementById('eraserSize').classList.add('show');
            } else {
                document.querySelector('.canvas-area').classList.remove('erase-mode');
                document.getElementById('eraserSize').classList.remove('show');
            }
            
            canvas.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
        });
    });

    // Canvas events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Properties
    document.getElementById('strokeWidth').addEventListener('input', updateStrokeWidthDisplay);
    document.getElementById('showGrid').addEventListener('change', redraw);
    document.getElementById('gridSize').addEventListener('change', redraw);

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);
}

// Touch handlers avec déplacement et rotation
function handleTouchStart(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    if (touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        let x = (touches[0].clientX - rect.left) / zoom;
        let y = (touches[0].clientY - rect.top) / zoom;

        if (snapToGrid) {
            const gridSize = parseInt(document.getElementById('gridSize').value);
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        const currentTime = new Date().getTime();
        const tapInterval = currentTime - lastTap;
        if (tapInterval < 300 && tapInterval > 0) {
            handleDoubleTap({ clientX: touches[0].clientX, clientY: touches[0].clientY });
            lastTap = 0;
        } else {
            lastTap = currentTime;
            startX = x;
            startY = y;
            isDrawing = true;

            if (currentTool === 'select') {
                // Vérifier rotation handle
                const rotationHandle = getRotationHandleAt(x, y);
                if (rotationHandle && selectedShape) {
                    isRotating = true;
                    isDrawing = false;
                    rotationCenter = getShapeCenter(selectedShape);
                    initialRotation = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
                    return;
                }
                
                // Vérifier déplacement
                if (selectedShape && isPointInShape(x, y, selectedShape)) {
                    isDragging = true;
                    isDrawing = false;
                    dragStartX = x;
                    dragStartY = y;
                    return;
                }
                
                selectShape(startX, startY);
            } else if (currentTool === 'erase') {
                eraseAtPoint(startX, startY);
            } else if (currentTool === 'text') {
                addText(startX, startY);
            } else if (currentTool === 'dimension') {
                if (!dimensionStart) {
                    dimensionStart = { x: startX, y: startY };
                } else {
                    createDimension(dimensionStart.x, dimensionStart.y, startX, startY);
                    dimensionStart = null;
                }
            }
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
        const rect = canvas.getBoundingClientRect();
        let x = (touches[0].clientX - rect.left) / zoom;
        let y = (touches[0].clientY - rect.top) / zoom;

        if (snapToGrid && (isDrawing || isDragging)) {
            const gridSize = parseInt(document.getElementById('gridSize').value);
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        document.getElementById('coords').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;

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
        } else if (isDrawing) {
            if (currentTool === 'erase') {
                eraseAtPoint(x, y);
            } else if (currentTool !== 'select' && currentTool !== 'text' && currentTool !== 'dimension') {
                redraw();
                drawTempShape(x, y);
            }
        }
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
            saveHistory();
            isDragging = false;
            isRotating = false;
            return;
        }
        
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            let endX = (touches[0].clientX - rect.left) / zoom;
            let endY = (touches[0].clientY - rect.top) / zoom;

            if (snapToGrid) {
                const gridSize = parseInt(document.getElementById('gridSize').value);
                endX = Math.round(endX / gridSize) * gridSize;
                endY = Math.round(endY / gridSize) * gridSize;
            }

            if (currentTool !== 'select' && currentTool !== 'erase' && currentTool !== 'text' && currentTool !== 'dimension') {
                createShape(endX, endY);
            }

            isDrawing = false;
        }
    }
    isPinching = false;
}

// Mouse handlers
function handleMouseDown(e) {
    if (e.type === 'mousedown') {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        let x = (e.clientX - rect.left) / zoom;
        let y = (e.clientY - rect.top) / zoom;

        if (snapToGrid) {
            const gridSize = parseInt(document.getElementById('gridSize').value);
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        startX = x;
        startY = y;
        isDrawing = true;

        if (currentTool === 'select') {
            // Vérifier si on clique sur une poignée de rotation
            const rotationHandle = getRotationHandleAt(x, y);
            if (rotationHandle && selectedShape) {
                isRotating = true;
                isDrawing = false;
                rotationCenter = getShapeCenter(selectedShape);
                initialRotation = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
                return;
            }
            
            // Vérifier si on clique sur une forme sélectionnée pour la déplacer
            if (selectedShape && isPointInShape(x, y, selectedShape)) {
                isDragging = true;
                isDrawing = false;
                dragStartX = x;
                dragStartY = y;
                canvas.style.cursor = 'move';
                return;
            }
            
            // Sinon, sélectionner une nouvelle forme
            selectShape(startX, startY);
        } else if (currentTool === 'erase') {
            eraseAtPoint(startX, startY);
        } else if (currentTool === 'text') {
            addText(startX, startY);
        } else if (currentTool === 'dimension') {
            if (!dimensionStart) {
                dimensionStart = { x: startX, y: startY };
            } else {
                createDimension(dimensionStart.x, dimensionStart.y, startX, startY);
                dimensionStart = null;
            }
        }
    }
}

function handleMouseMove(e) {
    if (e.type === 'mousemove') {
        const rect = canvas.getBoundingClientRect();
        let x = (e.clientX - rect.left) / zoom;
        let y = (e.clientY - rect.top) / zoom;

        if (snapToGrid && (isDrawing || isDragging)) {
            const gridSize = parseInt(document.getElementById('gridSize').value);
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        document.getElementById('coords').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;

        // Gestion du curseur selon le contexte
        if (currentTool === 'select' && !isDragging && !isRotating) {
            const rotationHandle = getRotationHandleAt(x, y);
            if (rotationHandle && selectedShape) {
                canvas.style.cursor = 'grab';
            } else if (selectedShape && isPointInShape(x, y, selectedShape)) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }

        if (isDragging && selectedShape) {
            // Déplacement de la forme
            const deltaX = x - dragStartX;
            const deltaY = y - dragStartY;
            moveShape(selectedShape, deltaX, deltaY);
            dragStartX = x;
            dragStartY = y;
            redraw();
        } else if (isRotating && selectedShape) {
            // Rotation de la forme
            const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
            const rotationAngle = currentAngle - initialRotation;
            rotateShape(selectedShape, rotationAngle, rotationCenter);
            initialRotation = currentAngle;
            redraw();
        } else if (isDrawing) {
            if (currentTool === 'erase') {
                eraseAtPoint(x, y);
            } else if (currentTool !== 'select' && currentTool !== 'text' && currentTool !== 'dimension') {
                redraw();
                drawTempShape(x, y);
            }
        }
    }
}

function handleMouseUp(e) {
    if (e.type === 'mouseup') {
        if (isDragging || isRotating) {
            // Sauvegarder l'historique après déplacement/rotation
            saveHistory();
            isDragging = false;
            isRotating = false;
            canvas.style.cursor = 'default';
            return;
        }
        
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            let endX = (e.clientX - rect.left) / zoom;
            let endY = (e.clientY - rect.top) / zoom;

            if (snapToGrid) {
                const gridSize = parseInt(document.getElementById('gridSize').value);
                endX = Math.round(endX / gridSize) * gridSize;
                endY = Math.round(endY / gridSize) * gridSize;
            }

            if (currentTool !== 'select' && currentTool !== 'erase' && currentTool !== 'text' && currentTool !== 'dimension') {
                createShape(endX, endY);
            }
        }

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
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        selectShape(x, y);
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

function handleKeyDown(e) {
    if (e.key === 'Delete' && selectedShape) {
        deleteSelected();
    } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
    } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
    } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
    } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
    } else if (e.key === 'r' && selectedShape && currentTool === 'select') {
        // Rotation rapide de 90° avec la touche R
        e.preventDefault();
        const center = getShapeCenter(selectedShape);
        rotateShape(selectedShape, Math.PI / 2, center);
        saveHistory();
        redraw();
    } else if (e.key === 'Escape') {
        // Désélectionner avec Échap
        selectedShape = null;
        redraw();
    }
}