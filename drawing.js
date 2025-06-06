// drawing.js - PARTIE 1 - Fonctions de dessin ArchiDraw avec redimensionnement

// Fonctions de rendu principal
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(zoom, zoom);
    
    if (document.getElementById('showGrid').checked) {
        drawGrid();
    }

    shapes.forEach(shape => drawShape(shape));

    if (selectedShape) {
        highlightShape(selectedShape);
        drawResizeHandles(selectedShape);
        drawRotationHandles(selectedShape);
    }
    
    ctx.restore();
}

function drawGrid() {
    const gridSize = parseInt(document.getElementById('gridSize').value);
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5 / zoom;

    for (let x = 0; x <= canvas.width / zoom; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height / zoom);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height / zoom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width / zoom, y);
        ctx.stroke();
    }

    ctx.restore();
}

// Fonction pour dessiner une croix de visée au curseur
function drawCrosshair(x, y) {
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([]);
    
    const size = 10 / zoom;
    
    // Croix horizontale
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
    
    // Croix verticale
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    
    // Point central
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, 2 / zoom, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
}

// Fonction pour dessiner une prévisualisation de l'outil au curseur
function drawToolPreview(x, y) {
    if (currentTool === 'select' || currentTool === 'erase') return;
    
    ctx.save();
    ctx.strokeStyle = '#0066ff';
    ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([2, 2]);
    
    const previewSize = 20 / zoom;
    
    switch (currentTool) {
        case 'rectangle':
        case 'window':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
        case 'stairs':
        case 'elevator':
        case 'technical':
            ctx.strokeRect(x - previewSize/2, y - previewSize/2, previewSize, previewSize);
            ctx.fillRect(x - previewSize/2, y - previewSize/2, previewSize, previewSize);
            break;
            
        case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, previewSize/2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            break;
            
        case 'door':
            const doorW = 30 / zoom;
            const doorH = 8 / zoom;
            ctx.strokeRect(x - doorW/2, y - doorH/2, doorW, doorH);
            ctx.fillRect(x - doorW/2, y - doorH/2, doorW, doorH);
            break;
            
        case 'text':
            ctx.font = `${12 / zoom}px Arial`;
            ctx.fillStyle = '#0066ff';
            ctx.textAlign = 'center';
            ctx.fillText('ABC', x, y);
            break;
    }
    
    ctx.restore();
}

function drawShape(shape) {
    if (!shape) return;
    
    ctx.save();
    ctx.strokeStyle = shape.strokeColor || '#000';
    ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
    ctx.fillStyle = shape.fillColor || '#fff';

    // Appliquer la rotation pour les portes et le texte si nécessaire
    if ((shape.type === 'text' || shape.type === 'door') && shape.rotation) {
        ctx.translate(shape.startX || shape.x, shape.startY || shape.y);
        ctx.rotate(shape.rotation);
        ctx.translate(-(shape.startX || shape.x), -(shape.startY || shape.y));
    }

    switch (shape.type) {
        case 'line':
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            break;

        case 'rectangle':
            const rectWidth = shape.endX - shape.startX;
            const rectHeight = shape.endY - shape.startY;
            if (shape.fill) {
                ctx.fillRect(shape.startX, shape.startY, rectWidth, rectHeight);
            }
            ctx.strokeRect(shape.startX, shape.startY, rectWidth, rectHeight);
            break;

        case 'circle':
            ctx.beginPath();
            ctx.arc(shape.startX, shape.startY, shape.radius, 0, 2 * Math.PI);
            if (shape.fill) {
                ctx.fill();
            }
            ctx.stroke();
            break;

        case 'wall':
            ctx.lineWidth = 10 / zoom;
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            break;

        case 'door':
            // Rendu amélioré des portes avec dimensions variables et rotation
            const doorWidth = shape.doorWidth || 80;
            const doorHeight = shape.doorHeight || 15;
            
            // Cadre de porte
            ctx.strokeStyle = shape.strokeColor || '#8B4513';
            ctx.lineWidth = 3 / zoom;
            ctx.strokeRect(shape.startX - doorWidth/2, shape.startY - doorHeight/2, doorWidth, doorHeight);
            
            // Porte elle-même
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(shape.startX - doorWidth/2 + 2, shape.startY - doorHeight/2 + 2, 
                        doorWidth - 4, doorHeight - 4);
            
            // Arc de mouvement de la porte (adapté aux dimensions)
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(shape.startX - doorWidth/2, shape.startY, doorWidth * 0.8, 0, Math.PI / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Poignée (positionnée proportionnellement)
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(shape.startX + doorWidth/3, shape.startY, Math.max(2, doorWidth/40), 0, 2 * Math.PI);
            ctx.fill();
            break;

        case 'window':
            const winWidth = Math.abs(shape.endX - shape.startX);
            const winHeight = Math.max(15, Math.abs(shape.endY - shape.startY));
            const winX = Math.min(shape.startX, shape.endX);
            const winY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#cce6ff';
            ctx.fillRect(winX, winY, winWidth, winHeight);
            ctx.strokeRect(winX, winY, winWidth, winHeight);
            
            // Séparateur central
            ctx.beginPath();
            ctx.moveTo(winX + winWidth/2, winY);
            ctx.lineTo(winX + winWidth/2, winY + winHeight);
            ctx.stroke();
            
            // Poignées
            if (winWidth > 30) {
                ctx.fillStyle = '#666';
                ctx.fillRect(winX + winWidth/4 - 2, winY + winHeight/2 - 1, 4, 2);
                ctx.fillRect(winX + 3*winWidth/4 - 2, winY + winHeight/2 - 1, 4, 2);
            }
            break;

        case 'stairs':
            const stairsWidth = Math.abs(shape.endX - shape.startX);
            const stairsHeight = Math.abs(shape.endY - shape.startY);
            const stairsX = Math.min(shape.startX, shape.endX);
            const stairsY = Math.min(shape.startY, shape.endY);
            
            ctx.strokeRect(stairsX, stairsY, stairsWidth, stairsHeight);
            
            // Nombre de marches adaptatif
            const numSteps = Math.max(3, Math.min(12, Math.floor(stairsHeight / 15)));
            const stepHeight = stairsHeight / numSteps;
            
            for (let i = 0; i < numSteps; i++) {
                ctx.beginPath();
                ctx.moveTo(stairsX, stairsY + i * stepHeight);
                ctx.lineTo(stairsX + stairsWidth, stairsY + i * stepHeight);
                ctx.stroke();
            }
            
            // Flèche directionnelle améliorée
            ctx.save();
            ctx.strokeStyle = shape.strokeColor || '#333';
            ctx.lineWidth = 2 / zoom;
            const centerX = stairsX + stairsWidth/2;
            const startArrowY = stairsY + 15;
            const endArrowY = stairsY + stairsHeight - 15;
            
            if (endArrowY > startArrowY + 20) {
                ctx.beginPath();
                ctx.moveTo(centerX, startArrowY);
                ctx.lineTo(centerX, endArrowY);
                ctx.stroke();
                
                // Pointe de flèche
                ctx.beginPath();
                ctx.moveTo(centerX - 8, endArrowY - 15);
                ctx.lineTo(centerX, endArrowY);
                ctx.lineTo(centerX + 8, endArrowY - 15);
                ctx.stroke();
            }
            ctx.restore();
            break;

        case 'elevator':
            const elevWidth = Math.abs(shape.endX - shape.startX);
            const elevHeight = Math.abs(shape.endY - shape.startY);
            const elevX = Math.min(shape.startX, shape.endX);
            const elevY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(elevX, elevY, elevWidth, elevHeight);
            ctx.strokeRect(elevX, elevY, elevWidth, elevHeight);
            
            // Portes d'ascenseur améliorées
            const doorGap = 2;
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.moveTo(elevX + elevWidth/2 - doorGap, elevY);
            ctx.lineTo(elevX + elevWidth/2 - doorGap, elevY + elevHeight);
            ctx.moveTo(elevX + elevWidth/2 + doorGap, elevY);
            ctx.lineTo(elevX + elevWidth/2 + doorGap, elevY + elevHeight);
            ctx.stroke();
            
            // Symboles haut/bas
            ctx.save();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1.5 / zoom;
            const symbolSize = Math.min(elevWidth, elevHeight) * 0.2;
            const symbolX = elevX + elevWidth/2;
            const symbolY = elevY + elevHeight/2;
            
            // Flèche haut
            ctx.beginPath();
            ctx.moveTo(symbolX - symbolSize/2, symbolY - 8);
            ctx.lineTo(symbolX, symbolY - symbolSize/2 - 5);
            ctx.lineTo(symbolX + symbolSize/2, symbolY - 8);
            ctx.stroke();
            
            // Flèche bas
            ctx.beginPath();
            ctx.moveTo(symbolX - symbolSize/2, symbolY + 8);
            ctx.lineTo(symbolX, symbolY + symbolSize/2 + 5);
            ctx.lineTo(symbolX + symbolSize/2, symbolY + 8);
            ctx.stroke();
            ctx.restore();
            break;

        case 'technical':
            const techWidth = Math.abs(shape.endX - shape.startX);
            const techHeight = Math.abs(shape.endY - shape.startY);
            const techX = Math.min(shape.startX, shape.endX);
            const techY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#e8e8e8';
            ctx.fillRect(techX, techY, techWidth, techHeight);
            ctx.strokeRect(techX, techY, techWidth, techHeight);
            
            // Motif hachuré adaptatif
            ctx.save();
            ctx.beginPath();
            ctx.rect(techX, techY, techWidth, techHeight);
            ctx.clip();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1 / zoom;
            const spacing = Math.max(8, Math.min(techWidth, techHeight) / 8);
            
            for (let i = -techHeight; i < techWidth + techHeight; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(techX + i, techY);
                ctx.lineTo(techX + i + techHeight, techY + techHeight);
                ctx.stroke();
            }
            ctx.restore();
            
            // Texte "TECH" proportionnel
            ctx.fillStyle = '#333';
            ctx.font = `bold ${Math.min(14, techHeight * 0.25)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TECH', techX + techWidth/2, techY + techHeight/2);
            break;

        case 'dimension':
            ctx.save();
            ctx.strokeStyle = shape.strokeColor || '#ff0000';
            ctx.lineWidth = 1 / zoom;
            
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            
            const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
            const arrowLength = 10;
            
            // Flèches aux extrémités
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.startX + arrowLength * Math.cos(angle + 2.5), 
                      shape.startY + arrowLength * Math.sin(angle + 2.5));
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.startX + arrowLength * Math.cos(angle - 2.5), 
                      shape.startY + arrowLength * Math.sin(angle - 2.5));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(shape.endX, shape.endY);
            ctx.lineTo(shape.endX - arrowLength * Math.cos(angle - 2.5), 
                      shape.endY - arrowLength * Math.sin(angle - 2.5));
            ctx.moveTo(shape.endX, shape.endY);
            ctx.lineTo(shape.endX - arrowLength * Math.cos(angle + 2.5), 
                      shape.endY - arrowLength * Math.sin(angle + 2.5));
            ctx.stroke();
            
            // Texte de dimension
            const midX = (shape.startX + shape.endX) / 2;
            const midY = (shape.startY + shape.endY) / 2;
            ctx.fillStyle = shape.strokeColor || '#ff0000';
            ctx.font = `${(shape.fontSize || 12)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            ctx.fillText(`${shape.distance}px`, 0, -5);
            ctx.restore();
            break;

        case 'furniture':
            const furWidth = Math.abs(shape.endX - shape.startX);
            const furHeight = Math.abs(shape.endY - shape.startY);
            const furX = Math.min(shape.startX, shape.endX);
            const furY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(furX, furY, furWidth, furHeight);
            ctx.strokeRect(furX, furY, furWidth, furHeight);
            
            // Détails du meuble
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1 / zoom;
            const margin = Math.min(furWidth, furHeight) * 0.1;
            if (margin > 2) {
                ctx.strokeRect(furX + margin, furY + margin, furWidth - 2*margin, furHeight - 2*margin);
            }
            
            // Poignées proportionnelles
            if (furWidth > 40 && furHeight > 40) {
                ctx.fillStyle = '#333';
                const handleSize = Math.min(6, furWidth * 0.1);
                ctx.fillRect(furX + furWidth - 15, furY + furHeight/2 - handleSize/2, handleSize, handleSize);
            }
            break;

        case 'bathroom':
            const bathWidth = Math.abs(shape.endX - shape.startX);
            const bathHeight = Math.abs(shape.endY - shape.startY);
            const bathX = Math.min(shape.startX, shape.endX);
            const bathY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#E6F3FF';
            ctx.fillRect(bathX, bathY, bathWidth, bathHeight);
            ctx.strokeRect(bathX, bathY, bathWidth, bathHeight);
            
            // Équipements de salle de bain
            ctx.strokeStyle = '#0099CC';
            ctx.lineWidth = 2 / zoom;
            
            // Douche/baignoire
            const bathMargin = Math.min(10, bathWidth * 0.1);
            ctx.strokeRect(bathX + bathMargin, bathY + bathMargin, 
                          bathWidth - 2*bathMargin, bathHeight - 2*bathMargin);
            
            // Pommeau de douche et lignes d'eau
            if (bathWidth > 50 && bathHeight > 50) {
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(bathX + bathWidth/2, bathY + 15, 4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Lignes d'eau animées
                ctx.strokeStyle = '#66CCFF';
                ctx.lineWidth = 1 / zoom;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(bathX + bathWidth/2 - 10 + i*5, bathY + 25);
                    ctx.lineTo(bathX + bathWidth/2 - 8 + i*5, bathY + 35);
                    ctx.stroke();
                }
            }
            break;

        case 'kitchen':
            const kitWidth = Math.abs(shape.endX - shape.startX);
            const kitHeight = Math.abs(shape.endY - shape.startY);
            const kitX = Math.min(shape.startX, shape.endX);
            const kitY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#F5F5DC';
            ctx.fillRect(kitX, kitY, kitWidth, kitHeight);
            ctx.strokeRect(kitX, kitY, kitWidth, kitHeight);
            
            // Plan de travail
            ctx.fillStyle = '#D2B48C';
            const counterHeight = Math.min(kitHeight * 0.3, 20);
            ctx.fillRect(kitX, kitY, kitWidth, counterHeight);
            
            // Plaques de cuisson intelligentes
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2 / zoom;
            const plateSize = Math.min(kitWidth, kitHeight) / 5;
            const plateSpacing = plateSize * 1.3;
            
            if (kitWidth > 80 && kitHeight > 80) {
                const platesX = Math.min(2, Math.floor(kitWidth / plateSpacing));
                const platesY = Math.min(2, Math.floor((kitHeight - counterHeight) / plateSpacing));
                
                for (let i = 0; i < platesY; i++) {
                    for (let j = 0; j < platesX; j++) {
                        const plateX = kitX + 15 + j * plateSpacing;
                        const plateY = kitY + counterHeight + 15 + i * plateSpacing;
                        
                        if (plateX + plateSize < kitX + kitWidth && plateY + plateSize < kitY + kitHeight) {
                            ctx.beginPath();
                            ctx.arc(plateX, plateY, plateSize/2, 0, 2 * Math.PI);
                            ctx.stroke();
                        }
                    }
                }
            }
            break;

        case 'tree':
            const treeX = (shape.startX + shape.endX) / 2;
            const treeY = (shape.startY + shape.endY) / 2;
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), 
                                       Math.abs(shape.endY - shape.startY)) / 2;
            
            // Tronc réaliste
            ctx.fillStyle = '#8B4513';
            const trunkWidth = Math.max(4, treeRadius * 0.25);
            const trunkHeight = Math.max(10, treeRadius * 0.6);
            ctx.fillRect(treeX - trunkWidth/2, treeY + treeRadius/3, trunkWidth, trunkHeight);
            
            // Couronne principale
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(treeX, treeY, treeRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Feuillage détaillé
            ctx.fillStyle = '#32CD32';
            const leafCount = Math.min(8, Math.max(4, Math.floor(treeRadius / 10)));
            for (let i = 0; i < leafCount; i++) {
                const angle = (Math.PI * 2 / leafCount) * i;
                const leafRadius = treeRadius * (0.3 + Math.random() * 0.2);
                const leafDistance = treeRadius * (0.5 + Math.random() * 0.3);
                const leafX = treeX + Math.cos(angle) * leafDistance;
                const leafY = treeY + Math.sin(angle) * leafDistance;
                ctx.beginPath();
                ctx.arc(leafX, leafY, leafRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;

        case 'text':
            ctx.font = `${shape.fontSize}px ${shape.fontFamily || 'Arial'}`;
            ctx.fillStyle = shape.fillColor || '#000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(shape.text, shape.x, shape.y);
            break;
    }

    ctx.restore();
}

function drawTempShape(x, y) {
    ctx.save();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5, 5]);

    switch (currentTool) {
        case 'line':
        case 'wall':
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.stroke();
            break;

        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            ctx.strokeRect(startX, startY, x - startX, y - startY);
            break;

        case 'dimension':
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.stroke();
            break;

        case 'tree':
            const radius = Math.min(Math.abs(x - startX), Math.abs(y - startY)) / 2;
            ctx.beginPath();
            ctx.arc((startX + x) / 2, (startY + y) / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'circle':
            const circleRadius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, circleRadius, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'door':
            // Prévisualisation améliorée avec dimensions variables
            const tempDoorWidth = Math.max(40, Math.abs(x - startX));
            const tempDoorHeight = Math.max(15, Math.abs(y - startY));
            ctx.strokeRect(startX - tempDoorWidth/2, startY - tempDoorHeight/2, 
                          tempDoorWidth, tempDoorHeight);
            break;
    }

    ctx.restore();
}

function highlightShape(shape) {
    if (!shape) return;
    
    ctx.save();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3 / zoom;
    ctx.setLineDash([5, 5]);

    switch (shape.type) {
        case 'line':
        case 'wall':
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            break;

        case 'rectangle':
        case 'window':
        case 'stairs':
        case 'elevator':
        case 'technical':
        case 'furniture':
        case 'bathroom':
        case 'kitchen':
            const width = shape.endX - shape.startX;
            const height = shape.endY - shape.startY;
            ctx.strokeRect(shape.startX - 2/zoom, shape.startY - 2/zoom, width + 4/zoom, height + 4/zoom);
            break;

        case 'circle':
            ctx.beginPath();
            ctx.arc(shape.startX, shape.startY, shape.radius + 2/zoom, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'door':
            // Mise en surbrillance améliorée pour portes avec dimensions variables
            const doorWidth = shape.doorWidth || 80;
            const doorHeight = shape.doorHeight || 15;
            ctx.strokeRect(shape.startX - doorWidth/2 - 2/zoom, shape.startY - doorHeight/2 - 2/zoom, 
                          doorWidth + 4/zoom, doorHeight + 4/zoom);
            break;

        case 'dimension':
            ctx.beginPath();
            ctx.moveTo(shape.startX - 5/zoom, shape.startY - 5/zoom);
            ctx.lineTo(shape.endX + 5/zoom, shape.endY + 5/zoom);
            ctx.stroke();
            break;

        case 'tree':
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), 
                                       Math.abs(shape.endY - shape.startY)) / 2;
            ctx.beginPath();
            ctx.arc((shape.startX + shape.endX) / 2, (shape.startY + shape.endY) / 2, 
                   treeRadius + 5/zoom, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'text':
            if (shape.text) {
                ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
                const metrics = ctx.measureText(shape.text);
                ctx.strokeRect(shape.x - 2/zoom, shape.y - shape.fontSize - 2/zoom, 
                             metrics.width + 4/zoom, shape.fontSize + 4/zoom);
            }
            break;
    }

    ctx.restore();
}

// Fonctions pour les poignées de redimensionnement
function drawResizeHandles(shape) {
    if (!shape) return;
    
    const handles = getResizeHandles(shape);
    ctx.save();
    
    handles.forEach(handle => {
        // Poignée de redimensionnement (carré orange)
        ctx.fillStyle = '#FF9800';
        ctx.strokeStyle = '#F57C00';
        ctx.lineWidth = 2 / zoom;
        
        const handleSize = handle.size / zoom;
        ctx.fillRect(handle.x - handleSize, handle.y - handleSize, 
                    handleSize * 2, handleSize * 2);
        ctx.strokeRect(handle.x - handleSize, handle.y - handleSize, 
                      handleSize * 2, handleSize * 2);
    });
    
    ctx.restore();
}

function getResizeHandles(shape) {
    if (!shape) return [];
    
    const handles = [];
    const handleSize = 6;
    
    switch (shape.type) {
        case 'line':
        case 'wall':
            handles.push(
                { x: shape.startX, y: shape.startY, size: handleSize, type: 'start' },
                { x: shape.endX, y: shape.endY, size: handleSize, type: 'end' }
            );
            break;
            
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
            
            handles.push(
                { x: minX, y: minY, size: handleSize, type: 'nw' },
                { x: maxX, y: minY, size: handleSize, type: 'ne' },
                { x: maxX, y: maxY, size: handleSize, type: 'se' },
                { x: minX, y: maxY, size: handleSize, type: 'sw' },
                { x: (minX + maxX) / 2, y: minY, size: handleSize, type: 'n' },
                { x: maxX, y: (minY + maxY) / 2, size: handleSize, type: 'e' },
                { x: (minX + maxX) / 2, y: maxY, size: handleSize, type: 's' },
                { x: minX, y: (minY + maxY) / 2, size: handleSize, type: 'w' }
            );
            break;
            
        case 'circle':
            handles.push(
                { x: shape.startX + shape.radius, y: shape.startY, size: handleSize, type: 'radius' },
                { x: shape.startX - shape.radius, y: shape.startY, size: handleSize, type: 'radius' },
                { x: shape.startX, y: shape.startY + shape.radius, size: handleSize, type: 'radius' },
                { x: shape.startX, y: shape.startY - shape.radius, size: handleSize, type: 'radius' }
            );
            break;
            
        case 'tree':
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), 
                                       Math.abs(shape.endY - shape.startY)) / 2;
            const treeCenterX = (shape.startX + shape.endX) / 2;
            const treeCenterY = (shape.startY + shape.endY) / 2;
            
            handles.push(
                { x: treeCenterX + treeRadius, y: treeCenterY, size: handleSize, type: 'radius' },
                { x: treeCenterX - treeRadius, y: treeCenterY, size: handleSize, type: 'radius' },
                { x: treeCenterX, y: treeCenterY + treeRadius, size: handleSize, type: 'radius' },
                { x: treeCenterX, y: treeCenterY - treeRadius, size: handleSize, type: 'radius' }
            );
            break;
            
        case 'door':
            // Poignées améliorées pour portes avec dimensions variables et rotation
            const doorWidth = shape.doorWidth || 80;
            const doorHeight = shape.doorHeight || 15;
            const rotation = shape.rotation || 0;
            
            // Fonction pour calculer les positions des poignées avec rotation
            function getDoorHandlePos(localX, localY) {
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                return {
                    x: shape.startX + localX * cos - localY * sin,
                    y: shape.startY + localX * sin + localY * cos
                };
            }
            
            // 8 poignées autour de la porte
            const halfW = doorWidth / 2;
            const halfH = doorHeight / 2;
            
            handles.push(
                { ...getDoorHandlePos(-halfW, -halfH), size: handleSize, type: 'nw' },
                { ...getDoorHandlePos(halfW, -halfH), size: handleSize, type: 'ne' },
                { ...getDoorHandlePos(halfW, halfH), size: handleSize, type: 'se' },
                { ...getDoorHandlePos(-halfW, halfH), size: handleSize, type: 'sw' },
                { ...getDoorHandlePos(0, -halfH), size: handleSize, type: 'n' },
                { ...getDoorHandlePos(halfW, 0), size: handleSize, type: 'e' },
                { ...getDoorHandlePos(0, halfH), size: handleSize, type: 's' },
                { ...getDoorHandlePos(-halfW, 0), size: handleSize, type: 'w' }
            );
            break;
            
        case 'text':
            if (shape.text) {
                ctx.save();
                ctx.font = `${shape.fontSize}px ${shape.fontFamily || 'Arial'}`;
                const metrics = ctx.measureText(shape.text);
                const textWidth = metrics.width;
                const textHeight = shape.fontSize;
                ctx.restore();
                
                handles.push(
                    { x: shape.x, y: shape.y, size: handleSize, type: 'nw' },
                    { x: shape.x + textWidth, y: shape.y, size: handleSize, type: 'ne' },
                    { x: shape.x + textWidth, y: shape.y + textHeight, size: handleSize, type: 'se' },
                    { x: shape.x, y: shape.y + textHeight, size: handleSize, type: 'sw' }
                );
            }
            break;
    }
    
    return handles;
}

function getResizeHandleAt(x, y) {
    if (!selectedShape) return null;
    
    const handles = getResizeHandles(selectedShape);
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

function drawRotationHandles(shape) {
    if (!shape) return;
    
    const handles = getRotationHandles(shape);
    ctx.save();
    
    handles.forEach(handle => {
        // Poignée de rotation (cercle bleu)
        ctx.fillStyle = '#2196F3';
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, handle.size / zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Icône de rotation
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5 / zoom;
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, (handle.size - 2) / zoom, 0.5, 5.5);
        ctx.stroke();
    });
    
    // Dessiner le centre de rotation
    const center = getShapeCenter(shape);
    ctx.fillStyle = '#FF5722';
    ctx.strokeStyle = '#D84315';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3 / zoom, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

function getRotationHandles(shape) {
    if (!shape) return [];
    
    const center = getShapeCenter(shape);
    const handles = [];
    const handleSize = 8;
    const distance = 50; // Distance des poignées du centre
    
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

// Règles améliorées - Version adaptée au canvas maximisé
function drawRulers() {
    if (!showRuler) return;
    
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    if (!rulerH || !rulerV) return;
    
    // Réinitialiser les règles
    rulerH.innerHTML = '';
    rulerV.innerHTML = '';
    
    // Règle horizontale - adaptée à la taille réelle du canvas
    const rulerWidth = canvas.width;
    const step = Math.max(25, Math.round(50 / zoom)); // Adapter l'espacement au zoom
    
    for (let i = 0; i <= rulerWidth; i += step) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        
        if (i % (step * 2) === 0) {
            mark.classList.add('major');
            
            const number = document.createElement('div');
            number.className = 'ruler-number';
            number.textContent = Math.round(i / zoom);
            number.style.left = i + 'px';
            rulerH.appendChild(number);
        }
        mark.style.left = i + 'px';
        rulerH.appendChild(mark);
    }
    
    // Règle verticale - adaptée à la taille réelle du canvas
    const rulerHeight = canvas.height;
    
    for (let i = 0; i <= rulerHeight; i += step) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        mark.style.transform = 'rotate(90deg)';
        
        if (i % (step * 2) === 0) {
            mark.classList.add('major');
            
            const number = document.createElement('div');
            number.className = 'ruler-number';
            number.textContent = Math.round(i / zoom);
            number.style.top = i + 'px';
            number.style.transform = 'rotate(90deg) translateX(-50%)';
            rulerV.appendChild(number);
        }
        mark.style.top = i + 'px';
        rulerV.appendChild(mark);
    }
}