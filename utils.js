// utils.js - Fonctions utilitaires ArchiDraw

// Historique (Undo/Redo)
function saveHistory() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    history.push(JSON.parse(JSON.stringify(shapes)));
    updateHistoryButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        shapes = JSON.parse(JSON.stringify(history[historyStep]));
        selectedShape = null;
        redraw();
        updateHistoryButtons();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        shapes = JSON.parse(JSON.stringify(history[historyStep]));
        selectedShape = null;
        redraw();
        updateHistoryButtons();
    }
}

function updateHistoryButtons() {
    document.getElementById('undoBtn').disabled = historyStep <= 0;
    document.getElementById('redoBtn').disabled = historyStep >= history.length - 1;
}

// Copier/Coller/Dupliquer
function copySelected() {
    if (selectedShape) {
        clipboard = JSON.parse(JSON.stringify(selectedShape));
        alert('Élément copié !');
    }
}

function pasteSelected() {
    if (clipboard) {
        const newShape = JSON.parse(JSON.stringify(clipboard));
        newShape.startX = (newShape.startX || 0) + 20;
        newShape.startY = (newShape.startY || 0) + 20;
        if (newShape.endX !== undefined) newShape.endX += 20;
        if (newShape.endY !== undefined) newShape.endY += 20;
        if (newShape.x !== undefined) newShape.x += 20;
        if (newShape.y !== undefined) newShape.y += 20;
        shapes.push(newShape);
        saveHistory();
        redraw();
    }
}

function duplicateSelected() {
    if (selectedShape) {
        const newShape = JSON.parse(JSON.stringify(selectedShape));
        newShape.startX = (newShape.startX || 0) + 20;
        newShape.startY = (newShape.startY || 0) + 20;
        if (newShape.endX !== undefined) newShape.endX += 20;
        if (newShape.endY !== undefined) newShape.endY += 20;
        if (newShape.x !== undefined) newShape.x += 20;
        if (newShape.y !== undefined) newShape.y += 20;
        shapes.push(newShape);
        selectedShape = newShape;
        saveHistory();
        redraw();
    }
}

function deleteSelected() {
    if (selectedShape) {
        shapes = shapes.filter(s => s !== selectedShape);
        selectedShape = null;
        saveHistory();
        redraw();
    }
}

// Arrangement
function bringToFront() {
    if (selectedShape) {
        const index = shapes.indexOf(selectedShape);
        if (index > -1) {
            shapes.splice(index, 1);
            shapes.push(selectedShape);
            saveHistory();
            redraw();
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
        }
    }
}

// Alignement
function alignLeft() {
    if (selectedShape && shapes.length > 1) {
        const minX = Math.min(...shapes.map(s => s.startX || s.x || 0));
        if (selectedShape.startX !== undefined) {
            const diff = selectedShape.startX - minX;
            selectedShape.startX = minX;
            if (selectedShape.endX !== undefined) selectedShape.endX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = minX;
        }
        saveHistory();
        redraw();
    }
}

function alignCenter() {
    if (selectedShape && shapes.length > 1) {
        const avgX = shapes.reduce((acc, s) => acc + (s.startX || s.x || 0), 0) / shapes.length;
        if (selectedShape.startX !== undefined) {
            const width = (selectedShape.endX || selectedShape.startX) - selectedShape.startX;
            const center = selectedShape.startX + width / 2;
            const diff = center - avgX;
            selectedShape.startX -= diff;
            if (selectedShape.endX !== undefined) selectedShape.endX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = avgX;
        }
        saveHistory();
        redraw();
    }
}

function alignRight() {
    if (selectedShape && shapes.length > 1) {
        const maxX = Math.max(...shapes.map(s => s.endX || s.startX || s.x || 0));
        if (selectedShape.endX !== undefined) {
            const diff = selectedShape.endX - maxX;
            selectedShape.endX = maxX;
            if (selectedShape.startX !== undefined) selectedShape.startX -= diff;
        } else if (selectedShape.x !== undefined) {
            selectedShape.x = maxX;
        }
        saveHistory();
        redraw();
    }
}

// Zoom
function zoomIn() {
    zoom = Math.min(zoom * 1.2, 3);
    redraw();
    if (showRuler) drawRulers();
}

function zoomOut() {
    zoom = Math.max(zoom * 0.8, 0.3);
    redraw();
    if (showRuler) drawRulers();
}

function zoomFit() {
    zoom = 1;
    redraw();
    if (showRuler) drawRulers();
}

// Options
function toggleGrid() {
    const gridBtn = document.getElementById('gridBtn');
    const checkbox = document.getElementById('showGrid');
    checkbox.checked = !checkbox.checked;
    gridBtn.classList.toggle('active', checkbox.checked);
    redraw();
}

function toggleSnap() {
    snapToGrid = !snapToGrid;
    const snapBtn = document.getElementById('snapBtn');
    snapBtn.classList.toggle('active', snapToGrid);
}

function toggleRuler() {
    showRuler = !showRuler;
    const rulerBtn = document.getElementById('rulerBtn');
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    rulerBtn.classList.toggle('active', showRuler);
    
    if (showRuler) {
        rulerH.style.display = 'flex';
        rulerV.style.display = 'flex';
        drawRulers();
    } else {
        rulerH.style.display = 'none';
        rulerV.style.display = 'none';
    }
}

function toggleProperties() {
    const properties = document.querySelector('.properties');
    properties.classList.toggle('hidden');
    properties.classList.toggle('active');
}

// Export image
function exportImage() {
    const link = document.createElement('a');
    link.download = 'plan_architectural.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Utility functions
function updateStrokeWidthDisplay() {
    document.getElementById('strokeWidthValue').textContent = 
        document.getElementById('strokeWidth').value;
}

function clearCanvas() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le dessin ?')) {
        shapes = [];
        selectedShape = null;
        saveHistory();
        redraw();
    }
}

function saveDrawing() {
    const data = {
        shapes: shapes,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan_architectural.json';
    a.click();
    
    URL.revokeObjectURL(url);
}

function loadDrawing() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                shapes = data.shapes || [];
                selectedShape = null;
                saveHistory();
                redraw();
                alert('Dessin chargé avec succès !');
            } catch (error) {
                alert('Erreur lors du chargement du fichier');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function printDrawing() {
    window.print();
}