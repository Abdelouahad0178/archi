// drawing.js - Fonctions de dessin ArchiDraw avec redimensionnement et rotation universelle

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
        case 'duct':
        case 'gaine':
        case 'pipe':
        case 'conduit':
        case 'beam':
        case 'poutre':
            ctx.strokeRect(x - previewSize/2, y - previewSize/2, previewSize, previewSize);
            ctx.fillRect(x - previewSize/2, y - previewSize/2, previewSize, previewSize);
            break;
            
        case 'column':
        case 'poteau':
            // Aperçu rond pour poteau
            ctx.beginPath();
            ctx.arc(x, y, previewSize/2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
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

    // Appliquer la rotation si nécessaire
    if (shape.rotation && shape.rotation !== 0) {
        const center = getShapeCenter(shape);
        ctx.translate(center.x, center.y);
        ctx.rotate(shape.rotation);
        ctx.translate(-center.x, -center.y);
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
            // Rendu entièrement adaptatif basé sur startX, startY, endX, endY
            const doorMinX = Math.min(shape.startX, shape.endX);
            const doorMinY = Math.min(shape.startY, shape.endY);
            const doorMaxX = Math.max(shape.startX, shape.endX);
            const doorMaxY = Math.max(shape.startY, shape.endY);
            const doorWidth = Math.abs(doorMaxX - doorMinX);
            const doorHeight = Math.abs(doorMaxY - doorMinY);
            const doorCenterX = (doorMinX + doorMaxX) / 2;
            const doorCenterY = (doorMinY + doorMaxY) / 2;
            
            // Assurer des dimensions minimales
            if (doorWidth < 20 || doorHeight < 10) {
                ctx.strokeStyle = shape.strokeColor || '#8B4513';
                ctx.lineWidth = 2 / zoom;
                ctx.strokeRect(doorMinX, doorMinY, Math.max(doorWidth, 20), Math.max(doorHeight, 10));
                break;
            }
            
            // Calculer l'épaisseur du cadre proportionnellement
            const frameThickness = Math.max(2, Math.min(doorWidth, doorHeight) * 0.08);
            
            // Cadre principal de la porte
            ctx.strokeStyle = shape.strokeColor || '#8B4513';
            ctx.lineWidth = Math.max(2, frameThickness) / zoom;
            ctx.strokeRect(doorMinX, doorMinY, doorWidth, doorHeight);
            
            // Panneau intérieur de la porte
            const doorMargin = Math.max(1, frameThickness * 0.4);
            ctx.fillStyle = shape.fill ? shape.fillColor : '#D2B48C';
            ctx.fillRect(doorMinX + doorMargin, doorMinY + doorMargin, 
                        doorWidth - 2*doorMargin, doorHeight - 2*doorMargin);
            
            // Contour interne décoratif
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = Math.max(0.5, frameThickness * 0.25) / zoom;
            ctx.strokeRect(doorMinX + doorMargin, doorMinY + doorMargin, 
                          doorWidth - 2*doorMargin, doorHeight - 2*doorMargin);
            
            // Arc de mouvement d'ouverture (adaptatif)
            if (doorWidth > 25) {
                ctx.strokeStyle = '#999';
                ctx.lineWidth = Math.max(0.5, doorWidth/100) / zoom;
                ctx.setLineDash([Math.max(2, doorWidth/50), Math.max(2, doorWidth/50)]);
                ctx.beginPath();
                
                // Arc depuis le coin gauche, rayon proportionnel
                const arcRadius = doorWidth * 0.75;
                const maxArcAngle = Math.min(Math.PI/2, (doorHeight/doorWidth) * Math.PI/3);
                ctx.arc(doorMinX, doorCenterY, arcRadius, 0, maxArcAngle);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Poignée proportionnelle
            if (doorWidth > 15 && doorHeight > 8) {
                const handleRadius = Math.max(1, Math.min(doorWidth/30, doorHeight/10, 3));
                const handleX = doorMinX + doorWidth * 0.75; // 75% vers la droite
                const handleY = doorCenterY; // Centré verticalement
                
                // Corps de la poignée
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Contour de la poignée
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = Math.max(0.5, handleRadius * 0.25) / zoom;
                ctx.stroke();
            }
            
            // Charnières proportionnelles
            if (doorHeight > 30 && doorWidth > 20) {
                ctx.fillStyle = '#696969';
                const hingeWidth = Math.max(2, doorWidth * 0.04);
                const hingeHeight = Math.max(4, doorHeight * 0.12);
                
                // Nombre de charnières selon la hauteur
                const hingeCount = doorHeight > 70 ? 3 : 2;
                const hingeSpacing = doorHeight / (hingeCount + 1);
                
                for (let i = 0; i < hingeCount; i++) {
                    const hingeY = doorMinY + hingeSpacing * (i + 1);
                    const hingeX = doorMinX + 2; // Légèrement décalé du bord
                    
                    // Charnière rectangulaire
                    ctx.fillRect(hingeX - hingeWidth/2, hingeY - hingeHeight/2, hingeWidth, hingeHeight);
                    
                    // Détail de la charnière (petite ligne centrale)
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 1 / zoom;
                    ctx.beginPath();
                    ctx.moveTo(hingeX - hingeWidth/4, hingeY - hingeHeight/3);
                    ctx.lineTo(hingeX + hingeWidth/4, hingeY + hingeHeight/3);
                    ctx.stroke();
                }
            }
            
            // Panneaux décoratifs pour les grandes portes
            if (doorWidth > 50 && doorHeight > 35) {
                ctx.strokeStyle = shape.strokeColor || '#8B4513';
                ctx.lineWidth = Math.max(0.5, frameThickness * 0.15) / zoom;
                
                const panelMargin = Math.max(6, Math.min(doorWidth, doorHeight) * 0.12);
                
                // Panneau décoratif principal
                ctx.strokeRect(
                    doorMinX + panelMargin,
                    doorMinY + panelMargin,
                    doorWidth - 2*panelMargin,
                    doorHeight - 2*panelMargin
                );
                
                // Divisions internes pour les très grandes portes
                if (doorWidth > 80 && doorHeight > 60) {
                    // Division verticale
                    ctx.beginPath();
                    ctx.moveTo(doorCenterX, doorMinY + panelMargin);
                    ctx.lineTo(doorCenterX, doorMaxY - panelMargin);
                    ctx.stroke();
                    
                    // Division horizontale
                    if (doorHeight > 100) {
                        ctx.beginPath();
                        ctx.moveTo(doorMinX + panelMargin, doorCenterY);
                        ctx.lineTo(doorMaxX - panelMargin, doorCenterY);
                        ctx.stroke();
                    }
                }
            }
            
            // Indicateur de direction d'ouverture (flèche)
            if (doorWidth > 40) {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = Math.max(1, doorWidth/80) / zoom;
                const arrowSize = Math.min(8, doorWidth * 0.1);
                const arrowX = doorMinX + doorWidth * 0.25;
                const arrowY = doorMinY + doorHeight * 0.15;
                
                // Flèche courbe indiquant l'ouverture
                ctx.beginPath();
                ctx.arc(doorMinX, arrowY, doorWidth * 0.2, 0, Math.PI/6);
                ctx.stroke();
                
                // Pointe de flèche
                const arrowEndX = doorMinX + Math.cos(Math.PI/6) * doorWidth * 0.2;
                const arrowEndY = arrowY + Math.sin(Math.PI/6) * doorWidth * 0.2;
                ctx.beginPath();
                ctx.moveTo(arrowEndX - arrowSize/2, arrowEndY - arrowSize/2);
                ctx.lineTo(arrowEndX, arrowEndY);
                ctx.lineTo(arrowEndX - arrowSize/2, arrowEndY + arrowSize/2);
                ctx.stroke();
            }
            break;

        case 'duct':
        case 'gaine':
            // Gaine technique ou conduit
            const ductMinX = Math.min(shape.startX, shape.endX);
            const ductMinY = Math.min(shape.startY, shape.endY);
            const ductMaxX = Math.max(shape.startX, shape.endX);
            const ductMaxY = Math.max(shape.startY, shape.endY);
            const ductWidth = Math.abs(ductMaxX - ductMinX);
            const ductHeight = Math.abs(ductMaxY - ductMinY);
            
            // Fond de la gaine
            ctx.fillStyle = shape.fill ? shape.fillColor : '#E0E0E0';
            ctx.fillRect(ductMinX, ductMinY, ductWidth, ductHeight);
            
            // Contour principal
            ctx.strokeStyle = shape.strokeColor || '#666';
            ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
            ctx.strokeRect(ductMinX, ductMinY, ductWidth, ductHeight);
            
            // Motif de gaine technique (lignes parallèles)
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1 / zoom;
            const ductSpacing = Math.max(5, Math.min(ductWidth, ductHeight) / 8);
            
            for (let i = ductSpacing; i < ductWidth; i += ductSpacing) {
                ctx.beginPath();
                ctx.moveTo(ductMinX + i, ductMinY);
                ctx.lineTo(ductMinX + i, ductMaxY);
                ctx.stroke();
            }
            
            // Texte "GAINE" proportionnel
            if (ductWidth > 40 && ductHeight > 20) {
                ctx.fillStyle = '#333';
                ctx.font = `bold ${Math.min(12, ductHeight * 0.3)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('GAINE', (ductMinX + ductMaxX) / 2, (ductMinY + ductMaxY) / 2);
            }
            break;

        case 'column':
        case 'poteau':
            // Poteau ou colonne
            const colMinX = Math.min(shape.startX, shape.endX);
            const colMinY = Math.min(shape.startY, shape.endY);
            const colMaxX = Math.max(shape.startX, shape.endX);
            const colMaxY = Math.max(shape.startY, shape.endY);
            const colWidth = Math.abs(colMaxX - colMinX);
            const colHeight = Math.abs(colMaxY - colMinY);
            const colCenterX = (colMinX + colMaxX) / 2;
            const colCenterY = (colMinY + colMaxY) / 2;
            
            // Déterminer si c'est rond ou carré selon les proportions
            const isRound = Math.abs(colWidth - colHeight) < Math.min(colWidth, colHeight) * 0.2;
            
            if (isRound) {
                // Colonne ronde
                const radius = Math.min(colWidth, colHeight) / 2;
                ctx.fillStyle = shape.fill ? shape.fillColor : '#CCCCCC';
                ctx.beginPath();
                ctx.arc(colCenterX, colCenterY, radius, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.strokeStyle = shape.strokeColor || '#333';
                ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
                ctx.stroke();
                
                // Détails circulaires
                if (radius > 15) {
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1 / zoom;
                    ctx.beginPath();
                    ctx.arc(colCenterX, colCenterY, radius * 0.7, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            } else {
                // Poteau rectangulaire
                ctx.fillStyle = shape.fill ? shape.fillColor : '#CCCCCC';
                ctx.fillRect(colMinX, colMinY, colWidth, colHeight);
                
                ctx.strokeStyle = shape.strokeColor || '#333';
                ctx.lineWidth = (shape.strokeWidth || 2) / zoom;
                ctx.strokeRect(colMinX, colMinY, colWidth, colHeight);
                
                // Motif hachuré en diagonale
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1 / zoom;
                const colDiagSpacing = Math.max(8, Math.min(colWidth, colHeight) / 6);
                
                for (let i = -colHeight; i < colWidth + colHeight; i += colDiagSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(colMinX + i, colMinY);
                    ctx.lineTo(colMinX + i + colHeight, colMaxY);
                    ctx.stroke();
                }
            }
            break;

        case 'pipe':
        case 'conduit':
            // Conduit ou tuyauterie
            const pipeMinX = Math.min(shape.startX, shape.endX);
            const pipeMinY = Math.min(shape.startY, shape.endY);
            const pipeMaxX = Math.max(shape.startX, shape.endX);
            const pipeMaxY = Math.max(shape.startY, shape.endY);
            const pipeWidth = Math.abs(pipeMaxX - pipeMinX);
            const pipeHeight = Math.abs(pipeMaxY - pipeMinY);
            
            // Détermine si c'est horizontal ou vertical
            const isHorizontal = pipeWidth > pipeHeight;
            
            // Couleur selon le type de conduit
            ctx.fillStyle = shape.fill ? shape.fillColor : '#87CEEB';
            ctx.fillRect(pipeMinX, pipeMinY, pipeWidth, pipeHeight);
            
            ctx.strokeStyle = shape.strokeColor || '#4682B4';
            ctx.lineWidth = Math.max(2, (shape.strokeWidth || 2)) / zoom;
            ctx.strokeRect(pipeMinX, pipeMinY, pipeWidth, pipeHeight);
            
            // Lignes de joints
            ctx.strokeStyle = '#5F9EA0';
            ctx.lineWidth = 1 / zoom;
            
            if (isHorizontal) {
                // Joints verticaux pour conduit horizontal
                const pipeJointSpacing = Math.max(15, pipeWidth / 6);
                for (let x = pipeMinX + pipeJointSpacing; x < pipeMaxX; x += pipeJointSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x, pipeMinY);
                    ctx.lineTo(x, pipeMaxY);
                    ctx.stroke();
                }
            } else {
                // Joints horizontaux pour conduit vertical
                const pipeJointSpacing = Math.max(15, pipeHeight / 6);
                for (let y = pipeMinY + pipeJointSpacing; y < pipeMaxY; y += pipeJointSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(pipeMinX, y);
                    ctx.lineTo(pipeMaxX, y);
                    ctx.stroke();
                }
            }
            break;

        case 'beam':
        case 'poutre':
            // Poutre structurelle
            const beamMinX = Math.min(shape.startX, shape.endX);
            const beamMinY = Math.min(shape.startY, shape.endY);
            const beamMaxX = Math.max(shape.startX, shape.endX);
            const beamMaxY = Math.max(shape.startY, shape.endY);
            const beamWidth = Math.abs(beamMaxX - beamMinX);
            const beamHeight = Math.abs(beamMaxY - beamMinY);
            
            // Fond de la poutre
            ctx.fillStyle = shape.fill ? shape.fillColor : '#D3D3D3';
            ctx.fillRect(beamMinX, beamMinY, beamWidth, beamHeight);
            
            // Contour principal épais
            ctx.strokeStyle = shape.strokeColor || '#2F4F4F';
            ctx.lineWidth = Math.max(3, (shape.strokeWidth || 3)) / zoom;
            ctx.strokeRect(beamMinX, beamMinY, beamWidth, beamHeight);
            
            // Motif de poutre en I ou H
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 2 / zoom;
            
            const isHorizontalBeam = beamWidth > beamHeight;
            
            if (isHorizontalBeam) {
                // Poutre horizontale - motif en I
                const flangeHeight = Math.max(2, beamHeight * 0.15);
                // Semelle supérieure
                ctx.fillRect(beamMinX, beamMinY, beamWidth, flangeHeight);
                // Semelle inférieure  
                ctx.fillRect(beamMinX, beamMaxY - flangeHeight, beamWidth, flangeHeight);
                // Âme centrale
                const webThickness = Math.max(2, beamHeight * 0.1);
                const webY = beamMinY + (beamHeight - webThickness) / 2;
                ctx.fillRect(beamMinX, webY, beamWidth, webThickness);
            } else {
                // Poutre verticale - motif en H
                const flangeWidth = Math.max(2, beamWidth * 0.15);
                // Semelle gauche
                ctx.fillRect(beamMinX, beamMinY, flangeWidth, beamHeight);
                // Semelle droite
                ctx.fillRect(beamMaxX - flangeWidth, beamMinY, flangeWidth, beamHeight);
                // Âme centrale
                const webThickness = Math.max(2, beamWidth * 0.1);
                const webX = beamMinX + (beamWidth - webThickness) / 2;
                ctx.fillRect(webX, beamMinY, webThickness, beamHeight);
            }
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
            const techSpacing = Math.max(8, Math.min(techWidth, techHeight) / 8);
            
            for (let i = -techHeight; i < techWidth + techHeight; i += techSpacing) {
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
            const furnitureMargin = Math.min(furWidth, furHeight) * 0.1;
            if (furnitureMargin > 2) {
                ctx.strokeRect(furX + furnitureMargin, furY + furnitureMargin, furWidth - 2*furnitureMargin, furHeight - 2*furnitureMargin);
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
            // Prévisualisation basée sur les coordonnées rectangulaires
            const tempDoorWidth = Math.abs(x - startX);
            const tempDoorHeight = Math.abs(y - startY);
            const tempMinX = Math.min(startX, x);
            const tempMinY = Math.min(startY, y);
            const tempCenterX = (startX + x) / 2;
            const tempCenterY = (startY + y) / 2;
            
            // Cadre principal
            ctx.strokeRect(tempMinX, tempMinY, tempDoorWidth, tempDoorHeight);
            
            // Contour interne
            const previewMargin = Math.max(1, Math.min(tempDoorWidth, tempDoorHeight) * 0.08);
            if (tempDoorWidth > 10 && tempDoorHeight > 6) {
                ctx.strokeRect(tempMinX + previewMargin, tempMinY + previewMargin,
                              tempDoorWidth - 2*previewMargin, tempDoorHeight - 2*previewMargin);
            }
            
            // Arc de mouvement en pointillés
            if (tempDoorWidth > 20) {
                ctx.beginPath();
                const arcRadius = tempDoorWidth * 0.75;
                ctx.arc(tempMinX, tempCenterY, arcRadius, 0, Math.PI/6);
                ctx.stroke();
            }
            
            // Position de la poignée
            if (tempDoorWidth > 15) {
                ctx.beginPath();
                ctx.arc(tempMinX + tempDoorWidth * 0.75, tempCenterY, 2, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // Charnières approximatives
            if (tempDoorHeight > 25) {
                const hingeCount = tempDoorHeight > 60 ? 3 : 2;
                const hingeSpacing = tempDoorHeight / (hingeCount + 1);
                for (let i = 0; i < hingeCount; i++) {
                    const hingeY = tempMinY + hingeSpacing * (i + 1);
                    ctx.strokeRect(tempMinX + 1, hingeY - 2, 4, 4);
                }
            }
            break;

        case 'duct':
        case 'gaine':
            // Prévisualisation de gaine
            ctx.strokeRect(startX, startY, x - startX, y - startY);
            // Lignes de gaine
            const gSpacing = Math.max(5, Math.abs(x - startX) / 8);
            for (let i = gSpacing; i < Math.abs(x - startX); i += gSpacing) {
                ctx.beginPath();
                ctx.moveTo(startX + i, startY);
                ctx.lineTo(startX + i, y);
                ctx.stroke();
            }
            break;

        case 'column':
        case 'poteau':
            // Prévisualisation de poteau
            const colW = Math.abs(x - startX);
            const colH = Math.abs(y - startY);
            const isRoundPreview = Math.abs(colW - colH) < Math.min(colW, colH) * 0.2;
            
            if (isRoundPreview) {
                const radius = Math.min(colW, colH) / 2;
                ctx.beginPath();
                ctx.arc((startX + x) / 2, (startY + y) / 2, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                ctx.strokeRect(startX, startY, x - startX, y - startY);
                // Motif hachuré
                const diagSpacing = Math.max(8, Math.min(colW, colH) / 6);
                for (let i = -colH; i < colW + colH; i += diagSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(startX + i, startY);
                    ctx.lineTo(startX + i + colH, y);
                    ctx.stroke();
                }
            }
            break;

        case 'pipe':
        case 'conduit':
            // Prévisualisation de conduit
            ctx.strokeRect(startX, startY, x - startX, y - startY);
            // Joints
            const isHorPipe = Math.abs(x - startX) > Math.abs(y - startY);
            if (isHorPipe) {
                const jointSpacing = Math.max(15, Math.abs(x - startX) / 6);
                for (let i = jointSpacing; i < Math.abs(x - startX); i += jointSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(startX + i, startY);
                    ctx.lineTo(startX + i, y);
                    ctx.stroke();
                }
            } else {
                const jointSpacing = Math.max(15, Math.abs(y - startY) / 6);
                for (let i = jointSpacing; i < Math.abs(y - startY); i += jointSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY + i);
                    ctx.lineTo(x, startY + i);
                    ctx.stroke();
                }
            }
            break;

        case 'beam':
        case 'poutre':
            // Prévisualisation de poutre
            ctx.strokeRect(startX, startY, x - startX, y - startY);
            // Motif en I ou H
            const beamW = Math.abs(x - startX);
            const beamH = Math.abs(y - startY);
            const isHorBeam = beamW > beamH;
            
            if (isHorBeam) {
                // Poutre horizontale - motif en I
                const flangeH = Math.max(2, beamH * 0.15);
                ctx.strokeRect(startX, startY, beamW, flangeH);
                ctx.strokeRect(startX, y - flangeH, beamW, flangeH);
            } else {
                // Poutre verticale - motif en H
                const flangeW = Math.max(2, beamW * 0.15);
                ctx.strokeRect(startX, startY, flangeW, beamH);
                ctx.strokeRect(x - flangeW, startY, flangeW, beamH);
            }
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
        case 'door':
        case 'duct':
        case 'gaine':
        case 'column':
        case 'poteau':
        case 'pipe':
        case 'conduit':
        case 'beam':
        case 'poutre':
            const width = shape.endX - shape.startX;
            const height = shape.endY - shape.startY;
            ctx.strokeRect(shape.startX - 2/zoom, shape.startY - 2/zoom, width + 4/zoom, height + 4/zoom);
            break;

        case 'circle':
            ctx.beginPath();
            ctx.arc(shape.startX, shape.startY, shape.radius + 2/zoom, 0, 2 * Math.PI);
            ctx.stroke();
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
    
    if (!rulerH || !rulerV) return;
    
    // Réinitialiser les règles
    rulerH.innerHTML = '';
    rulerV.innerHTML = '';
    
    // Règle horizontale - adaptée à la taille réelle du canvas
    const rulerWidth = canvas.width;
    const rulerStep = Math.max(25, Math.round(50 / zoom)); // Adapter l'espacement au zoom
    
    for (let i = 0; i <= rulerWidth; i += rulerStep) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        
        if (i % (rulerStep * 2) === 0) {
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
    
    for (let i = 0; i <= rulerHeight; i += rulerStep) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        mark.style.transform = 'rotate(90deg)';
        
        if (i % (rulerStep * 2) === 0) {
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

// Export des fonctions globales pour compatibilité
window.redraw = redraw;
window.drawGrid = drawGrid;
window.drawShape = drawShape;
window.drawTempShape = drawTempShape;
window.highlightShape = highlightShape;
window.drawResizeHandles = drawResizeHandles;
window.drawRotationHandles = drawRotationHandles;
window.drawRulers = drawRulers;