// drawing.js - Fonctions de dessin ArchiDraw avec curseur de prévisualisation

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
    ctx.save();
    ctx.strokeStyle = shape.strokeColor || '#000';
    ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
    ctx.fillStyle = shape.fillColor || '#fff';

    // Appliquer la rotation pour le texte si nécessaire
    if (shape.type === 'text' && shape.rotation) {
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.translate(-shape.x, -shape.y);
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
            // Nouvelle forme de porte plus réaliste
            const doorWidth = 80;
            const doorHeight = 15;
            
            // Cadre de porte
            ctx.strokeStyle = shape.strokeColor || '#8B4513';
            ctx.lineWidth = 3 / zoom;
            ctx.strokeRect(shape.startX - doorWidth/2, shape.startY - doorHeight/2, doorWidth, doorHeight);
            
            // Porte elle-même
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(shape.startX - doorWidth/2 + 2, shape.startY - doorHeight/2 + 2, doorWidth - 4, doorHeight - 4);
            
            // Arc de mouvement de la porte
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(shape.startX - doorWidth/2, shape.startY, doorWidth * 0.8, 0, Math.PI / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Poignée
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(shape.startX + doorWidth/3, shape.startY, 2, 0, 2 * Math.PI);
            ctx.fill();
            break;

        case 'window':
            const winWidth = Math.abs(shape.endX - shape.startX);
            const winHeight = 15;
            const winX = Math.min(shape.startX, shape.endX);
            const winY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#cce6ff';
            ctx.fillRect(winX, winY, winWidth, winHeight);
            ctx.strokeRect(winX, winY, winWidth, winHeight);
            
            ctx.beginPath();
            ctx.moveTo(winX + winWidth/2, winY);
            ctx.lineTo(winX + winWidth/2, winY + winHeight);
            ctx.stroke();
            break;

        case 'stairs':
            const stairsWidth = Math.abs(shape.endX - shape.startX);
            const stairsHeight = Math.abs(shape.endY - shape.startY);
            const stairsX = Math.min(shape.startX, shape.endX);
            const stairsY = Math.min(shape.startY, shape.endY);
            
            ctx.strokeRect(stairsX, stairsY, stairsWidth, stairsHeight);
            
            const numSteps = 8;
            const stepHeight = stairsHeight / numSteps;
            
            for (let i = 0; i < numSteps; i++) {
                ctx.beginPath();
                ctx.moveTo(stairsX, stairsY + i * stepHeight);
                ctx.lineTo(stairsX + stairsWidth, stairsY + i * stepHeight);
                ctx.stroke();
            }
            
            ctx.save();
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.moveTo(stairsX + stairsWidth/2, stairsY + 10);
            ctx.lineTo(stairsX + stairsWidth/2, stairsY + stairsHeight - 10);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(stairsX + stairsWidth/2 - 8, stairsY + stairsHeight - 20);
            ctx.lineTo(stairsX + stairsWidth/2, stairsY + stairsHeight - 10);
            ctx.lineTo(stairsX + stairsWidth/2 + 8, stairsY + stairsHeight - 20);
            ctx.stroke();
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
            
            ctx.beginPath();
            ctx.moveTo(elevX + elevWidth/2 - 2, elevY);
            ctx.lineTo(elevX + elevWidth/2 - 2, elevY + elevHeight);
            ctx.moveTo(elevX + elevWidth/2 + 2, elevY);
            ctx.lineTo(elevX + elevWidth/2 + 2, elevY + elevHeight);
            ctx.stroke();
            
            ctx.save();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1 / zoom;
            ctx.beginPath();
            ctx.moveTo(elevX + 5, elevY + 5);
            ctx.lineTo(elevX + elevWidth - 5, elevY + elevHeight - 5);
            ctx.moveTo(elevX + elevWidth - 5, elevY + 5);
            ctx.lineTo(elevX + 5, elevY + elevHeight - 5);
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
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(techX, techY, techWidth, techHeight);
            ctx.clip();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1 / zoom;
            const spacing = Math.min(techWidth, techHeight) / 10;
            
            for (let i = -techHeight; i < techWidth + techHeight; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(techX + i, techY);
                ctx.lineTo(techX + i + techHeight, techY + techHeight);
                ctx.stroke();
            }
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.font = `bold ${12 * zoom}px Arial`;
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
            
            const midX = (shape.startX + shape.endX) / 2;
            const midY = (shape.startY + shape.endY) / 2;
            ctx.fillStyle = shape.strokeColor || '#ff0000';
            ctx.font = `${(shape.fontSize || 12) * zoom}px Arial`;
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
            
            ctx.strokeStyle = '#666';
            ctx.strokeRect(furX + 5, furY + 5, furWidth - 10, furHeight - 10);
            break;

        case 'bathroom':
            const bathWidth = Math.abs(shape.endX - shape.startX);
            const bathHeight = Math.abs(shape.endY - shape.startY);
            const bathX = Math.min(shape.startX, shape.endX);
            const bathY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#E6F3FF';
            ctx.fillRect(bathX, bathY, bathWidth, bathHeight);
            ctx.strokeRect(bathX, bathY, bathWidth, bathHeight);
            
            ctx.strokeStyle = '#666';
            ctx.strokeRect(bathX + 5, bathY + 5, bathWidth - 10, bathHeight - 10);
            
            ctx.beginPath();
            ctx.arc(bathX + bathWidth/2, bathY + 10, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#666';
            ctx.fill();
            ctx.stroke();
            break;

        case 'kitchen':
            const kitWidth = Math.abs(shape.endX - shape.startX);
            const kitHeight = Math.abs(shape.endY - shape.startY);
            const kitX = Math.min(shape.startX, shape.endX);
            const kitY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(kitX, kitY, kitWidth, kitHeight);
            ctx.strokeRect(kitX, kitY, kitWidth, kitHeight);
            
            ctx.strokeStyle = '#666';
            const plateSize = Math.min(kitWidth, kitHeight) / 3;
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.beginPath();
                    ctx.arc(kitX + plateSize * (i + 0.5) + 10, 
                           kitY + plateSize * (j + 0.5) + 10, 
                           plateSize/3, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
            break;

        case 'tree':
            const treeX = (shape.startX + shape.endX) / 2;
            const treeY = (shape.startY + shape.endY) / 2;
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), 
                                       Math.abs(shape.endY - shape.startY)) / 2;
            
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(treeX, treeY, treeRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#006400';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i;
                const x = treeX + Math.cos(angle) * treeRadius * 0.6;
                const y = treeY + Math.sin(angle) * treeRadius * 0.6;
                ctx.beginPath();
                ctx.arc(x, y, treeRadius * 0.3, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;

        case 'text':
            ctx.font = `${shape.fontSize * zoom}px ${shape.fontFamily || 'Arial'}`;
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
            const tempDoorWidth = 80;
            const tempDoorHeight = 15;
            ctx.strokeRect(startX - tempDoorWidth/2, startY - tempDoorHeight/2, tempDoorWidth, tempDoorHeight);
            break;
    }

    ctx.restore();
}

function highlightShape(shape) {
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
            ctx.strokeRect(shape.startX - 42, shape.startY - 10, 84, 20);
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
            ctx.font = `${shape.fontSize * zoom}px ${shape.fontFamily}`;
            const metrics = ctx.measureText(shape.text);
            ctx.strokeRect(shape.x - 2/zoom, shape.y - shape.fontSize - 2/zoom, 
                         metrics.width / zoom + 4/zoom, shape.fontSize + 4/zoom);
            break;
    }

    ctx.restore();
    
    // Dessiner les poignées de rotation
    drawRotationHandles(shape);
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

// Règles améliorées - Version adaptée au canvas maximisé
function drawRulers() {
    if (!showRuler) return;
    
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    // Réinitialiser les règles
    rulerH.innerHTML = '';
    rulerV.innerHTML = '';
    
    // Règle horizontale - adaptée à la taille réelle du canvas
    const rulerWidth = canvas.width;
    const step = 50; // Marques tous les 50px
    
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

function drawShape(shape) {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor || '#000';
    ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
    ctx.fillStyle = shape.fillColor || '#fff';

    // Appliquer la rotation pour le texte si nécessaire
    if (shape.type === 'text' && shape.rotation) {
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.translate(-shape.x, -shape.y);
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
            // Nouvelle forme de porte plus réaliste
            const doorWidth = 80;
            const doorHeight = 15;
            
            // Cadre de porte
            ctx.strokeStyle = shape.strokeColor || '#8B4513';
            ctx.lineWidth = 3 / zoom;
            ctx.strokeRect(shape.startX - doorWidth/2, shape.startY - doorHeight/2, doorWidth, doorHeight);
            
            // Porte elle-même
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(shape.startX - doorWidth/2 + 2, shape.startY - doorHeight/2 + 2, doorWidth - 4, doorHeight - 4);
            
            // Arc de mouvement de la porte
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(shape.startX - doorWidth/2, shape.startY, doorWidth * 0.8, 0, Math.PI / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Poignée
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(shape.startX + doorWidth/3, shape.startY, 2, 0, 2 * Math.PI);
            ctx.fill();
            break;

        case 'window':
            const winWidth = Math.abs(shape.endX - shape.startX);
            const winHeight = 15;
            const winX = Math.min(shape.startX, shape.endX);
            const winY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#cce6ff';
            ctx.fillRect(winX, winY, winWidth, winHeight);
            ctx.strokeRect(winX, winY, winWidth, winHeight);
            
            ctx.beginPath();
            ctx.moveTo(winX + winWidth/2, winY);
            ctx.lineTo(winX + winWidth/2, winY + winHeight);
            ctx.stroke();
            break;

        case 'stairs':
            const stairsWidth = Math.abs(shape.endX - shape.startX);
            const stairsHeight = Math.abs(shape.endY - shape.startY);
            const stairsX = Math.min(shape.startX, shape.endX);
            const stairsY = Math.min(shape.startY, shape.endY);
            
            ctx.strokeRect(stairsX, stairsY, stairsWidth, stairsHeight);
            
            const numSteps = 8;
            const stepHeight = stairsHeight / numSteps;
            
            for (let i = 0; i < numSteps; i++) {
                ctx.beginPath();
                ctx.moveTo(stairsX, stairsY + i * stepHeight);
                ctx.lineTo(stairsX + stairsWidth, stairsY + i * stepHeight);
                ctx.stroke();
            }
            
            ctx.save();
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.moveTo(stairsX + stairsWidth/2, stairsY + 10);
            ctx.lineTo(stairsX + stairsWidth/2, stairsY + stairsHeight - 10);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(stairsX + stairsWidth/2 - 8, stairsY + stairsHeight - 20);
            ctx.lineTo(stairsX + stairsWidth/2, stairsY + stairsHeight - 10);
            ctx.lineTo(stairsX + stairsWidth/2 + 8, stairsY + stairsHeight - 20);
            ctx.stroke();
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
            
            ctx.beginPath();
            ctx.moveTo(elevX + elevWidth/2 - 2, elevY);
            ctx.lineTo(elevX + elevWidth/2 - 2, elevY + elevHeight);
            ctx.moveTo(elevX + elevWidth/2 + 2, elevY);
            ctx.lineTo(elevX + elevWidth/2 + 2, elevY + elevHeight);
            ctx.stroke();
            
            ctx.save();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1 / zoom;
            ctx.beginPath();
            ctx.moveTo(elevX + 5, elevY + 5);
            ctx.lineTo(elevX + elevWidth - 5, elevY + elevHeight - 5);
            ctx.moveTo(elevX + elevWidth - 5, elevY + 5);
            ctx.lineTo(elevX + 5, elevY + elevHeight - 5);
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
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(techX, techY, techWidth, techHeight);
            ctx.clip();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1 / zoom;
            const spacing = Math.min(techWidth, techHeight) / 10;
            
            for (let i = -techHeight; i < techWidth + techHeight; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(techX + i, techY);
                ctx.lineTo(techX + i + techHeight, techY + techHeight);
                ctx.stroke();
            }
            ctx.restore();
            
            ctx.fillStyle = '#333';
            ctx.font = `bold ${12 * zoom}px Arial`;
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
            
            const midX = (shape.startX + shape.endX) / 2;
            const midY = (shape.startY + shape.endY) / 2;
            ctx.fillStyle = shape.strokeColor || '#ff0000';
            ctx.font = `${(shape.fontSize || 12) * zoom}px Arial`;
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
            
            ctx.strokeStyle = '#666';
            ctx.strokeRect(furX + 5, furY + 5, furWidth - 10, furHeight - 10);
            break;

        case 'bathroom':
            const bathWidth = Math.abs(shape.endX - shape.startX);
            const bathHeight = Math.abs(shape.endY - shape.startY);
            const bathX = Math.min(shape.startX, shape.endX);
            const bathY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#E6F3FF';
            ctx.fillRect(bathX, bathY, bathWidth, bathHeight);
            ctx.strokeRect(bathX, bathY, bathWidth, bathHeight);
            
            ctx.strokeStyle = '#666';
            ctx.strokeRect(bathX + 5, bathY + 5, bathWidth - 10, bathHeight - 10);
            
            ctx.beginPath();
            ctx.arc(bathX + bathWidth/2, bathY + 10, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#666';
            ctx.fill();
            ctx.stroke();
            break;

        case 'kitchen':
            const kitWidth = Math.abs(shape.endX - shape.startX);
            const kitHeight = Math.abs(shape.endY - shape.startY);
            const kitX = Math.min(shape.startX, shape.endX);
            const kitY = Math.min(shape.startY, shape.endY);
            
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(kitX, kitY, kitWidth, kitHeight);
            ctx.strokeRect(kitX, kitY, kitWidth, kitHeight);
            
            ctx.strokeStyle = '#666';
            const plateSize = Math.min(kitWidth, kitHeight) / 3;
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.beginPath();
                    ctx.arc(kitX + plateSize * (i + 0.5) + 10, 
                           kitY + plateSize * (j + 0.5) + 10, 
                           plateSize/3, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
            break;

        case 'tree':
            const treeX = (shape.startX + shape.endX) / 2;
            const treeY = (shape.startY + shape.endY) / 2;
            const treeRadius = Math.min(Math.abs(shape.endX - shape.startX), 
                                       Math.abs(shape.endY - shape.startY)) / 2;
            
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(treeX, treeY, treeRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#006400';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i;
                const x = treeX + Math.cos(angle) * treeRadius * 0.6;
                const y = treeY + Math.sin(angle) * treeRadius * 0.6;
                ctx.beginPath();
                ctx.arc(x, y, treeRadius * 0.3, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;

        case 'text':
            ctx.font = `${shape.fontSize * zoom}px ${shape.fontFamily || 'Arial'}`;
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
            const tempDoorWidth = 80;
            const tempDoorHeight = 15;
            ctx.strokeRect(startX - tempDoorWidth/2, startY - tempDoorHeight/2, tempDoorWidth, tempDoorHeight);
            break;
    }

    ctx.restore();
}

function highlightShape(shape) {
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
            ctx.strokeRect(shape.startX - 42, shape.startY - 10, 84, 20);
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
            ctx.font = `${shape.fontSize * zoom}px ${shape.fontFamily}`;
            const metrics = ctx.measureText(shape.text);
            ctx.strokeRect(shape.x - 2/zoom, shape.y - shape.fontSize - 2/zoom, 
                         metrics.width / zoom + 4/zoom, shape.fontSize + 4/zoom);
            break;
    }

    ctx.restore();
    
    // Dessiner les poignées de rotation
    drawRotationHandles(shape);
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

// Règles améliorées - Version adaptée au canvas maximisé
function drawRulers() {
    if (!showRuler) return;
    
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    // Réinitialiser les règles
    rulerH.innerHTML = '';
    rulerV.innerHTML = '';
    
    // Règle horizontale - adaptée à la taille réelle du canvas
    const rulerWidth = canvas.width;
    const step = 50; // Marques tous les 50px
    
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