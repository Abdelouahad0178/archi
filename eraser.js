// eraser.js - Système de gomme intelligent ArchiDraw avec support des nouveaux outils

// Configuration de la gomme
function setupEraserControls() {
    const slider = document.getElementById('eraserSizeSlider');
    const valueDisplay = document.getElementById('eraserSizeValue');
    
    slider.addEventListener('input', function() {
        eraserSize = parseInt(this.value);
        valueDisplay.textContent = eraserSize;
    });
}

// Fonction de gomme améliorée - Efface localement avec support des nouveaux outils
function eraseAtPoint(x, y) {
    let hasErased = false;
    const newShapes = [];
    
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const eraseResult = erasePartOfShape(x, y, shape);
        
        if (eraseResult.erased) {
            hasErased = true;
            // Ajouter les nouvelles formes résultantes (si il y en a)
            if (eraseResult.newShapes && eraseResult.newShapes.length > 0) {
                newShapes.push(...eraseResult.newShapes);
            }
            // Ne pas ajouter la forme originale
        } else {
            // Garder la forme originale si elle n'a pas été touchée
            newShapes.push(shape);
        }
    }
    
    if (hasErased) {
        shapes = newShapes;
        redraw();
        // Sauvegarder l'historique seulement à la fin du mouvement de gomme
        if (!isDrawing) {
            saveHistory();
        }
    }
}

function erasePartOfShape(x, y, shape) {
    const range = eraserSize / 2;
    
    switch (shape.type) {
        case 'line':
        case 'wall':
            return erasePartOfLine(x, y, shape, range);
            
        case 'rectangle':
        case 'door':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'duct':
        case 'gaine':
        case 'column':
        case 'poteau':
        case 'pipe':
        case 'conduit':
        case 'beam':
        case 'poutre':
            return erasePartOfRectangle(x, y, shape, range);
            
        case 'circle':
            return erasePartOfCircle(x, y, shape, range);
            
        case 'tree':
            return erasePartOfTree(x, y, shape, range);
            
        case 'text':
            // Pour le texte, on supprime complètement si touché
            if (Math.abs(x - shape.x) < 100 + range && Math.abs(y - shape.y) < shape.fontSize + range) {
                return { erased: true, newShapes: [] };
            }
            break;
            
        case 'dimension':
            return erasePartOfLine(x, y, shape, range);
            
        default:
            // Pour les autres formes complexes, supprimer complètement si touchées
            if (isPointInEraserRange(x, y, shape, range)) {
                return { erased: true, newShapes: [] };
            }
            break;
    }
    
    return { erased: false };
}

function erasePartOfLine(x, y, shape, range) {
    if (!isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, range)) {
        return { erased: false };
    }
    
    // Calculer le point le plus proche sur la ligne
    const closestPoint = getClosestPointOnLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY);
    
    // Créer deux nouvelles lignes si la gomme coupe au milieu
    const newShapes = [];
    const eraseRadius = range;
    
    // Distance du point d'effacement aux extrémités
    const distToStart = Math.sqrt(Math.pow(closestPoint.x - shape.startX, 2) + Math.pow(closestPoint.y - shape.startY, 2));
    const distToEnd = Math.sqrt(Math.pow(closestPoint.x - shape.endX, 2) + Math.pow(closestPoint.y - shape.endY, 2));
    
    // Si la gomme est près du début ou de la fin, raccourcir la ligne
    if (distToStart < eraseRadius) {
        // Effacer depuis le début
        const direction = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
        const newStartX = shape.startX + Math.cos(direction) * eraseRadius * 2;
        const newStartY = shape.startY + Math.sin(direction) * eraseRadius * 2;
        
        if (Math.sqrt(Math.pow(newStartX - shape.endX, 2) + Math.pow(newStartY - shape.endY, 2)) > 10) {
            newShapes.push({
                ...shape,
                startX: newStartX,
                startY: newStartY
            });
        }
    } else if (distToEnd < eraseRadius) {
        // Effacer depuis la fin
        const direction = Math.atan2(shape.startY - shape.endY, shape.startX - shape.endX);
        const newEndX = shape.endX + Math.cos(direction) * eraseRadius * 2;
        const newEndY = shape.endY + Math.sin(direction) * eraseRadius * 2;
        
        if (Math.sqrt(Math.pow(shape.startX - newEndX, 2) + Math.pow(shape.startY - newEndY, 2)) > 10) {
            newShapes.push({
                ...shape,
                endX: newEndX,
                endY: newEndY
            });
        }
    } else {
        // Effacer au milieu - créer deux segments
        const direction = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
        
        const gap1X = closestPoint.x - Math.cos(direction) * eraseRadius;
        const gap1Y = closestPoint.y - Math.sin(direction) * eraseRadius;
        const gap2X = closestPoint.x + Math.cos(direction) * eraseRadius;
        const gap2Y = closestPoint.y + Math.sin(direction) * eraseRadius;
        
        // Premier segment (début jusqu'à la zone effacée)
        if (Math.sqrt(Math.pow(shape.startX - gap1X, 2) + Math.pow(shape.startY - gap1Y, 2)) > 10) {
            newShapes.push({
                ...shape,
                endX: gap1X,
                endY: gap1Y
            });
        }
        
        // Deuxième segment (zone effacée jusqu'à la fin)
        if (Math.sqrt(Math.pow(gap2X - shape.endX, 2) + Math.pow(gap2Y - shape.endY, 2)) > 10) {
            newShapes.push({
                ...shape,
                startX: gap2X,
                startY: gap2Y
            });
        }
    }
    
    return { erased: true, newShapes: newShapes };
}

function erasePartOfRectangle(x, y, shape, range) {
    const minX = Math.min(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxX = Math.max(shape.startX, shape.endX);
    const maxY = Math.max(shape.startY, shape.endY);
    
    // Vérifier si le point de gomme est à l'intérieur ou près du rectangle
    if (!(x >= minX - range && x <= maxX + range && y >= minY - range && y <= maxY + range)) {
        return { erased: false };
    }
    
    const newShapes = [];
    const eraseRadius = range;
    
    // Créer des lignes pour les bords du rectangle, en évitant la zone effacée
    const edges = [
        { startX: minX, startY: minY, endX: maxX, endY: minY, type: 'top' }, // haut
        { startX: maxX, startY: minY, endX: maxX, endY: maxY, type: 'right' }, // droite
        { startX: maxX, startY: maxY, endX: minX, endY: maxY, type: 'bottom' }, // bas
        { startX: minX, startY: maxY, endX: minX, endY: minY, type: 'left' }  // gauche
    ];
    
    edges.forEach(edge => {
        const lineShape = {
            ...shape,
            type: shape.type === 'wall' ? 'wall' : 'line', // Préserver le type mur si c'était un mur rectangulaire
            startX: edge.startX,
            startY: edge.startY,
            endX: edge.endX,
            endY: edge.endY
        };
        
        const eraseResult = erasePartOfLine(x, y, lineShape, eraseRadius);
        if (eraseResult.erased && eraseResult.newShapes) {
            newShapes.push(...eraseResult.newShapes);
        } else if (!eraseResult.erased) {
            newShapes.push(lineShape);
        }
    });
    
    return { erased: true, newShapes: newShapes };
}

function erasePartOfCircle(x, y, shape, range) {
    const dx = x - shape.startX;
    const dy = y - shape.startY;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    
    // Vérifier si la gomme touche le cercle
    if (Math.abs(distanceToCenter - shape.radius) > range) {
        return { erased: false };
    }
    
    // Pour les cercles, on crée des arcs en évitant la zone effacée
    const angleToErase = Math.atan2(dy, dx);
    const eraseAngle = Math.PI / 4; // 45 degrés d'effacement
    
    const newShapes = [];
    
    // Créer deux arcs
    const arc1Start = angleToErase + eraseAngle;
    const arc1End = angleToErase - eraseAngle + 2 * Math.PI;
    
    // Approximation: créer plusieurs petites lignes pour simuler l'arc
    const numSegments = 20;
    const remainingAngle = (2 * Math.PI - 2 * eraseAngle);
    const segmentAngle = remainingAngle / numSegments;
    
    for (let i = 0; i < numSegments; i++) {
        const startAngle = arc1Start + i * segmentAngle;
        const endAngle = arc1Start + (i + 1) * segmentAngle;
        
        const x1 = shape.startX + Math.cos(startAngle) * shape.radius;
        const y1 = shape.startY + Math.sin(startAngle) * shape.radius;
        const x2 = shape.startX + Math.cos(endAngle) * shape.radius;
        const y2 = shape.startY + Math.sin(endAngle) * shape.radius;
        
        newShapes.push({
            ...shape,
            type: 'line',
            startX: x1,
            startY: y1,
            endX: x2,
            endY: y2
        });
    }
    
    return { erased: true, newShapes: newShapes };
}

function erasePartOfTree(x, y, shape, range) {
    const treeX = (shape.startX + shape.endX) / 2;
    const treeY = (shape.startY + shape.endY) / 2;
    const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), Math.abs(shape.endY - shape.startY)) / 2;
    
    const dx = x - treeX;
    const dy = y - treeY;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    
    // Si la gomme touche l'arbre, le supprimer complètement (les arbres sont complexes à découper)
    if (distanceToCenter <= treeRadius + range) {
        return { erased: true, newShapes: [] };
    }
    
    return { erased: false };
}

function getClosestPointOnLine(px, py, x1, y1, x2, y2) {
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

    return { x: xx, y: yy };
}

function isPointInEraserRange(x, y, shape, range) {
    switch (shape.type) {
        case 'line':
        case 'wall':
            return isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, range);
        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'door':
        case 'duct':
        case 'gaine':
        case 'column':
        case 'poteau':
        case 'pipe':
        case 'conduit':
        case 'beam':
        case 'poutre':
            const minX = Math.min(shape.startX, shape.endX) - range;
            const minY = Math.min(shape.startY, shape.endY) - range;
            const maxX = Math.max(shape.startX, shape.endX) + range;
            const maxY = Math.max(shape.startY, shape.endY) + range;
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        case 'circle':
            const dx = x - shape.startX;
            const dy = y - shape.startY;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius + range;
        case 'dimension':
            return isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, range);
        case 'tree':
            const treeX = (shape.startX + shape.endX) / 2;
            const treeY = (shape.startY + shape.endY) / 2;
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), Math.abs(shape.endY - shape.startY)) / 2;
            return Math.sqrt(Math.pow(x - treeX, 2) + Math.pow(y - treeY, 2)) <= treeRadius + range;
        case 'text':
            return Math.abs(x - shape.x) < 100 + range && Math.abs(y - shape.y) < shape.fontSize + range;
    }
    return false;
}

// Fonction spécialisée pour effacer les nouveaux outils techniques
function eraseSpecializedShape(x, y, shape, range) {
    // Gestion spécialisée pour les nouveaux outils
    switch (shape.type) {
        case 'duct':
        case 'gaine':
            // Pour les gaines, créer des segments plus courts
            return erasePartOfRectangle(x, y, shape, range);
            
        case 'column':
        case 'poteau':
            // Pour les poteaux, soit tout soit rien (structure importante)
            if (isPointInEraserRange(x, y, shape, range)) {
                return { erased: true, newShapes: [] };
            }
            return { erased: false };
            
        case 'pipe':
        case 'conduit':
            // Pour les conduits, permettre la segmentation
            return erasePartOfRectangle(x, y, shape, range);
            
        case 'beam':
        case 'poutre':
            // Pour les poutres, soit tout soit rien (structure importante)
            if (isPointInEraserRange(x, y, shape, range)) {
                return { erased: true, newShapes: [] };
            }
            return { erased: false };
            
        default:
            return { erased: false };
    }
}

// Amélioration de la fonction principale avec gestion spécialisée
function erasePartOfShapeEnhanced(x, y, shape) {
    const range = eraserSize / 2;
    
    // Vérifier d'abord si c'est un outil spécialisé
    if (TECHNICAL_TOOLS.includes(shape.type)) {
        return eraseSpecializedShape(x, y, shape, range);
    }
    
    // Sinon utiliser la fonction standard
    return erasePartOfShape(x, y, shape);
}

// Fonction pour prévisualiser la zone d'effacement
function drawEraserPreview(x, y) {
    if (currentTool !== 'erase') return;
    
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(x, y, eraserSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

// Statistiques d'effacement pour debug
function getEraserStats() {
    return {
        size: eraserSize,
        mode: currentTool === 'erase' ? 'active' : 'inactive',
        supportedShapes: Object.keys(TOOL_DEFAULT_COLORS).length,
        specializedTools: TECHNICAL_TOOLS.length
    };
}

// Export pour debug
window.ArchiDrawEraser = {
    stats: getEraserStats,
    previewErase: drawEraserPreview,
    erasePartOfShape: erasePartOfShape
};

// Export des fonctions globales pour compatibilité
window.setupEraserControls = setupEraserControls;
window.eraseAtPoint = eraseAtPoint;