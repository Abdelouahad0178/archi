// shapes.js - Gestion des formes ArchiDraw avec redimensionnement

// Shape creation
function createShape(endX, endY) {
    const minSize = 20;
    const shape = {
        type: currentTool,
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        strokeColor: document.getElementById('strokeColor').value,
        strokeWidth: parseInt(document.getElementById('strokeWidth').value),
        fillColor: document.getElementById('fillColor').value,
        fill: document.getElementById('fillShape').checked
    };

    if (currentTool === 'circle') {
        shape.radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    } else if (['rectangle', 'stairs', 'elevator', 'technical', 'furniture', 'bathroom', 'kitchen'].includes(currentTool)) {
        shape.endX = startX + Math.max(Math.abs(endX - startX), minSize) * Math.sign(endX - startX);
        shape.endY = startY + Math.max(Math.abs(endY - startY), minSize) * Math.sign(endY - startY);
    }

    shapes.push(shape);
    saveHistory();
    redraw();
}

// Créer une cotation
function createDimension(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const shape = {
        type: 'dimension',
        startX: x1,
        startY: y1,
        endX: x2,
        endY: y2,
        distance: Math.round(distance),
        strokeColor: '#ff0000',
        fontSize: 12
    };
    shapes.push(shape);
    saveHistory();
    redraw();
}

// Text handling
function addText(x, y) {
    const text = prompt('Entrez le texte:');
    if (text && text.trim() !== '') {
        shapes.push({
            type: 'text',
            x: x,
            y: y,
            text: text.trim(),
            fontSize: parseInt(document.getElementById('fontSize').value),
            fontFamily: document.getElementById('fontFamily').value,
            fillColor: document.getElementById('strokeColor').value
        });
        saveHistory();
        redraw();
    }
}

// Selection avec affichage des infos de transformation et mise à jour du panneau
function selectShape(x, y) {
    selectedShape = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(x, y, shapes[i])) {
            selectedShape = shapes[i];
            showTransformInfo();
            updateShapePropertiesPanel();
            break;
        }
    }
    
    if (!selectedShape) {
        updateShapePropertiesPanel();
    }
    
    redraw();
}

function isPointInShape(x, y, shape) {
    switch (shape.type) {
        case 'line':
        case 'wall':
            return isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, 5);
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            const minX = Math.min(shape.startX, shape.endX);
            const minY = Math.min(shape.startY, shape.endY);
            const maxX = Math.max(shape.startX, shape.endX);
            const maxY = Math.max(shape.startY, shape.endY);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        case 'circle':
            const dx = x - shape.startX;
            const dy = y - shape.startY;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        case 'door':
            return Math.abs(x - shape.startX) < 60 && Math.abs(y - shape.startY) < 60;
        case 'dimension':
            return isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, 10);
        case 'tree':
            const treeX = (shape.startX + shape.endX) / 2;
            const treeY = (shape.startY + shape.endY) / 2;
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), Math.abs(shape.endY - shape.startY)) / 2;
            return Math.sqrt(Math.pow(x - treeX, 2) + Math.pow(y - treeY, 2)) <= treeRadius;
        case 'text':
            ctx.font = `${shape.fontSize * zoom}px ${shape.fontFamily}`;
            const metrics = ctx.measureText(shape.text);
            return x >= shape.x && x <= shape.x + metrics.width / zoom &&
                   y >= shape.y - shape.fontSize && y <= shape.y;
    }
    return false;
}

function isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}

// Fonctions de déplacement et rotation - Version corrigée
function moveShape(shape, deltaX, deltaY) {
    if (!shape) return;
    
    switch (shape.type) {
        case 'line':
        case 'wall':
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'tree':
        case 'dimension':
            if (shape.startX !== undefined) shape.startX += deltaX;
            if (shape.startY !== undefined) shape.startY += deltaY;
            if (shape.endX !== undefined) shape.endX += deltaX;
            if (shape.endY !== undefined) shape.endY += deltaY;
            break;
        case 'circle':
        case 'door':
            if (shape.startX !== undefined) shape.startX += deltaX;
            if (shape.startY !== undefined) shape.startY += deltaY;
            break;
        case 'text':
            if (shape.x !== undefined) shape.x += deltaX;
            if (shape.y !== undefined) shape.y += deltaY;
            break;
    }
}

function rotateShape(shape, angle, center) {
    if (!shape || !center) return;
    
    // Initialiser la rotation si elle n'existe pas
    if (shape.rotation === undefined) shape.rotation = 0;
    
    // Fonction pour faire tourner un point autour d'un centre
    function rotatePoint(px, py, cx, cy, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = px - cx;
        const dy = py - cy;
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    }

    // Appliquer la rotation selon le type de forme
    switch (shape.type) {
        case 'line':
        case 'wall':
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'tree':
        case 'dimension':
            if (shape.startX !== undefined && shape.startY !== undefined) {
                const start = rotatePoint(shape.startX, shape.startY, center.x, center.y, angle);
                shape.startX = start.x;
                shape.startY = start.y;
            }
            if (shape.endX !== undefined && shape.endY !== undefined) {
                const end = rotatePoint(shape.endX, shape.endY, center.x, center.y, angle);
                shape.endX = end.x;
                shape.endY = end.y;
            }
            break;
        case 'circle':
        case 'door':
            if (shape.startX !== undefined && shape.startY !== undefined) {
                const rotated = rotatePoint(shape.startX, shape.startY, center.x, center.y, angle);
                shape.startX = rotated.x;
                shape.startY = rotated.y;
            }
            break;
        case 'text':
            if (shape.x !== undefined && shape.y !== undefined) {
                const textRotated = rotatePoint(shape.x, shape.y, center.x, center.y, angle);
                shape.x = textRotated.x;
                shape.y = textRotated.y;
                // Pour le texte, stocker aussi l'angle de rotation pour l'affichage
                shape.rotation += angle;
            }
            break;
    }
}

function getShapeCenter(shape) {
    if (!shape) return { x: 0, y: 0 };
    
    switch (shape.type) {
        case 'line':
        case 'wall':
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'tree':
        case 'dimension':
            return {
                x: (shape.startX + shape.endX) / 2,
                y: (shape.startY + shape.endY) / 2
            };
        case 'circle':
        case 'door':
            return {
                x: shape.startX,
                y: shape.startY
            };
        case 'text':
            return {
                x: shape.x || 0,
                y: shape.y || 0
            };
        default:
            return { x: 0, y: 0 };
    }
}

function getRotationHandles(shape) {
    if (!shape) return [];
    
    const center = getShapeCenter(shape);
    const handles = [];
    const handleSize = 8;
    const distance = 40; // Distance des poignées du centre

    // Créer 4 poignées de rotation autour de la forme
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        handles.push({
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance,
            size: handleSize,
            angle: angle
        });
    }

    return handles;
}

function getRotationHandleAt(x, y) {
    if (!selectedShape) return null;
    
    const handles = getRotationHandles(selectedShape);
    for (let handle of handles) {
        const dx = x - handle.x;
        const dy = y - handle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= handle.size + 5) { // Tolérance de 5px
            return handle;
        }
    }
    return null;
}

function rotateSelected(degrees) {
    if (!selectedShape) {
        alert('Aucune forme sélectionnée');
        return;
    }
    
    const center = getShapeCenter(selectedShape);
    const radians = (degrees * Math.PI) / 180;
    rotateShape(selectedShape, radians, center);
    updateShapePropertiesPanel();
    saveHistory();
    redraw();
}

// Mise à jour du panneau de propriétés des formes
function updateShapePropertiesPanel() {
    const panel = document.getElementById('shapeProperties');
    if (!panel) return;
    
    if (!selectedShape) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    
    const widthInput = document.getElementById('shapeWidth');
    const heightInput = document.getElementById('shapeHeight');
    const xInput = document.getElementById('shapeX');
    const yInput = document.getElementById('shapeY');
    const radiusInput = document.getElementById('shapeRadius');
    const radiusProperty = document.getElementById('radiusProperty');
    
    if (!widthInput || !heightInput || !xInput || !yInput || !radiusInput || !radiusProperty) {
        return;
    }
    
    // Réinitialiser la visibilité
    radiusProperty.style.display = 'none';
    widthInput.parentElement.style.display = 'block';
    heightInput.parentElement.style.display = 'block';
    
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
            const x = Math.min(selectedShape.startX, selectedShape.endX);
            const y = Math.min(selectedShape.startY, selectedShape.endY);
            
            widthInput.value = Math.round(width);
            heightInput.value = Math.round(height);
            xInput.value = Math.round(x);
            yInput.value = Math.round(y);
            break;
            
        case 'circle':
            radiusProperty.style.display = 'block';
            widthInput.parentElement.style.display = 'none';
            heightInput.parentElement.style.display = 'none';
            
            radiusInput.value = Math.round(selectedShape.radius);
            xInput.value = Math.round(selectedShape.startX);
            yInput.value = Math.round(selectedShape.startY);
            break;
            
        case 'line':
        case 'wall':
            widthInput.parentElement.style.display = 'none';
            heightInput.parentElement.style.display = 'none';
            
            xInput.value = Math.round(selectedShape.startX);
            yInput.value = Math.round(selectedShape.startY);
            break;
            
        case 'text':
            widthInput.parentElement.style.display = 'none';
            heightInput.parentElement.style.display = 'none';
            
            xInput.value = Math.round(selectedShape.x);
            yInput.value = Math.round(selectedShape.y);
            break;
            
        default:
            if (selectedShape.startX !== undefined && selectedShape.endX !== undefined) {
                const w = Math.abs(selectedShape.endX - selectedShape.startX);
                const h = Math.abs(selectedShape.endY - selectedShape.startY);
                const sx = Math.min(selectedShape.startX, selectedShape.endX);
                const sy = Math.min(selectedShape.startY, selectedShape.endY);
                
                widthInput.value = Math.round(w);
                heightInput.value = Math.round(h);
                xInput.value = Math.round(sx);
                yInput.value = Math.round(sy);
            }
            break;
    }
}

function updateShapePropertiesDisplay() {
    // Cette fonction est appelée quand l'utilisateur modifie les valeurs dans le panneau
    // La mise à jour se fait via applyShapeProperties()
}

function applyShapeProperties() {
    if (!selectedShape) return;
    
    const widthInput = document.getElementById('shapeWidth');
    const heightInput = document.getElementById('shapeHeight');
    const xInput = document.getElementById('shapeX');
    const yInput = document.getElementById('shapeY');
    const radiusInput = document.getElementById('shapeRadius');
    
    if (!xInput || !yInput) return;
    
    const newX = parseFloat(xInput.value);
    const newY = parseFloat(yInput.value);
    
    switch (selectedShape.type) {
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            if (widthInput && heightInput) {
                const newWidth = Math.max(10, parseFloat(widthInput.value));
                const newHeight = Math.max(10, parseFloat(heightInput.value));
                
                selectedShape.startX = newX;
                selectedShape.startY = newY;
                selectedShape.endX = newX + newWidth;
                selectedShape.endY = newY + newHeight;
            }
            break;
            
        case 'circle':
            if (radiusInput) {
                const newRadius = Math.max(5, parseFloat(radiusInput.value));
                selectedShape.startX = newX;
                selectedShape.startY = newY;
                selectedShape.radius = newRadius;
            }
            break;
            
        case 'line':
        case 'wall':
            const deltaX = newX - selectedShape.startX;
            const deltaY = newY - selectedShape.startY;
            selectedShape.startX = newX;
            selectedShape.startY = newY;
            selectedShape.endX += deltaX;
            selectedShape.endY += deltaY;
            break;
            
        case 'text':
            selectedShape.x = newX;
            selectedShape.y = newY;
            break;
    }
    
    saveHistory();
    redraw();
}

// Fonction pour afficher les informations de transformation - Version corrigée
function showTransformInfo() {
    if (!selectedShape) return;
    
    const center = getShapeCenter(selectedShape);
    const rotation = selectedShape.rotation ? (selectedShape.rotation * 180 / Math.PI).toFixed(1) : 0;
    
    // Supprimer l'ancien panneau s'il existe
    const existingInfo = document.getElementById('transformInfo');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Créer le nouveau panneau d'informations
    const infoDiv = document.createElement('div');
    infoDiv.id = 'transformInfo';
    infoDiv.style.cssText = `
        position: fixed;
        top: 130px;
        right: 280px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 1000;
        border: 1px solid #4CAF50;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        max-width: 250px;
    `;
    
    let dimensionsInfo = '';
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
            dimensionsInfo = `<div><strong>Taille:</strong> ${Math.round(width)} × ${Math.round(height)}px</div>`;
            break;
        case 'circle':
            dimensionsInfo = `<div><strong>Rayon:</strong> ${Math.round(selectedShape.radius)}px</div>`;
            break;
        case 'line':
        case 'wall':
            const length = Math.sqrt(
                Math.pow(selectedShape.endX - selectedShape.startX, 2) + 
                Math.pow(selectedShape.endY - selectedShape.startY, 2)
            );
            dimensionsInfo = `<div><strong>Longueur:</strong> ${Math.round(length)}px</div>`;
            break;
    }
    
    infoDiv.innerHTML = `
        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">
            📐 Forme sélectionnée
        </div>
        <div><strong>Type:</strong> ${selectedShape.type}</div>
        <div><strong>Centre:</strong> (${Math.round(center.x)}, ${Math.round(center.y)})</div>
        ${dimensionsInfo}
        <div><strong>Rotation:</strong> ${rotation}°</div>
        <hr style="margin: 8px 0; opacity: 0.3;">
        <div style="font-size: 11px; color: #ccc; line-height: 1.4;">
            🖱️ <strong>Glisser:</strong> Déplacer<br>
            🟧 <strong>Poignées orange:</strong> Redimensionner<br>
            🔵 <strong>Poignées bleues:</strong> Rotation libre<br>
            ⌨️ <strong>R:</strong> Rotation 90° | <strong>Échap:</strong> Désélectionner
        </div>
    `;
    
    document.body.appendChild(infoDiv);
    
    // Masquer automatiquement après 6 secondes
    setTimeout(() => {
        if (infoDiv && infoDiv.parentNode) {
            infoDiv.remove();
        }
    }, 6000);
}