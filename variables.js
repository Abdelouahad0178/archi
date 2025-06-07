// variables.js - Variables globales ArchiDraw avec redimensionnement et rotation universelle

// Canvas et contexte
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// État du dessin
let isDrawing = false;
let currentTool = 'select';
let startX = 0;
let startY = 0;
let shapes = [];
let selectedShape = null;
let tempShape = null;

// Événements tactiles
let lastTap = 0;
let isPinching = false;
let initialPinchDistance = 0;

// Variables pour le déplacement, la rotation et le redimensionnement
let isDragging = false;
let isRotating = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let rotationCenter = { x: 0, y: 0 };
let initialRotation = 0;
let rotationHandles = [];
let resizeHandle = null;
let initialShapeState = null;

// Historique pour undo/redo
let history = [];
let historyStep = -1;

// Clipboard pour copier/coller
let clipboard = null;

// Options de l'application
let showGrid = true;
let snapToGrid = false;
let showRuler = false;
let zoom = 1;
let eraserSize = 20;

// Dimension en cours
let dimensionStart = null;

// Variable pour l'outil temporaire
let temporaryTool = null;

// Liste des outils supportant la rotation universelle
const ROTATABLE_TOOLS = [
    'line', 'wall', 'rectangle', 'window', 'door', 'stairs', 
    'elevator', 'technical', 'furniture', 'bathroom', 'kitchen',
    'duct', 'gaine', 'column', 'poteau', 'pipe', 'conduit', 
    'beam', 'poutre', 'tree', 'dimension', 'text'
];

// Liste des outils rectangulaires (avec startX, startY, endX, endY)
const RECTANGULAR_TOOLS = [
    'rectangle', 'window', 'door', 'stairs', 'elevator', 
    'technical', 'furniture', 'bathroom', 'kitchen',
    'duct', 'gaine', 'column', 'poteau', 'pipe', 'conduit', 
    'beam', 'poutre', 'tree'
];

// Liste des outils linéaires (avec startX, startY, endX, endY mais rendus comme lignes)
const LINEAR_TOOLS = [
    'line', 'wall', 'dimension'
];

// Liste des outils circulaires
const CIRCULAR_TOOLS = [
    'circle'
];

// Liste des outils avec position x,y
const POSITIONED_TOOLS = [
    'text'
];

// Nouveaux outils techniques
const TECHNICAL_TOOLS = [
    'duct', 'gaine', 'column', 'poteau', 'pipe', 'conduit', 'beam', 'poutre'
];

// Outils architecturaux
const ARCHITECTURAL_TOOLS = [
    'wall', 'door', 'window', 'stairs', 'elevator', 'technical'
];

// Outils d'aménagement
const FURNISHING_TOOLS = [
    'furniture', 'bathroom', 'kitchen', 'tree'
];

// Configuration des couleurs par défaut selon l'outil
const TOOL_DEFAULT_COLORS = {
    'wall': { stroke: '#000000', fill: '#ffffff' },
    'door': { stroke: '#8B4513', fill: '#D2B48C' },
    'window': { stroke: '#000000', fill: '#cce6ff' },
    'stairs': { stroke: '#000000', fill: '#f0f0f0' },
    'elevator': { stroke: '#666666', fill: '#f0f0f0' },
    'technical': { stroke: '#666666', fill: '#e8e8e8' },
    'furniture': { stroke: '#654321', fill: '#8B4513' },
    'bathroom': { stroke: '#0099CC', fill: '#E6F3FF' },
    'kitchen': { stroke: '#333333', fill: '#F5F5DC' },
    'tree': { stroke: '#228B22', fill: '#228B22' },
    'duct': { stroke: '#666666', fill: '#E0E0E0' },
    'gaine': { stroke: '#666666', fill: '#E0E0E0' },
    'column': { stroke: '#333333', fill: '#CCCCCC' },
    'poteau': { stroke: '#333333', fill: '#CCCCCC' },
    'pipe': { stroke: '#4682B4', fill: '#87CEEB' },
    'conduit': { stroke: '#4682B4', fill: '#87CEEB' },
    'beam': { stroke: '#2F4F4F', fill: '#D3D3D3' },
    'poutre': { stroke: '#2F4F4F', fill: '#D3D3D3' },
    'dimension': { stroke: '#ff0000', fill: '#ff0000' },
    'text': { stroke: '#000000', fill: '#000000' }
};

// Configuration des tailles minimales par outil
const TOOL_MIN_SIZES = {
    'door': { width: 20, height: 10 },
    'window': { width: 30, height: 15 },
    'stairs': { width: 50, height: 80 },
    'elevator': { width: 60, height: 60 },
    'technical': { width: 40, height: 40 },
    'furniture': { width: 30, height: 30 },
    'bathroom': { width: 80, height: 80 },
    'kitchen': { width: 100, height: 60 },
    'duct': { width: 20, height: 15 },
    'gaine': { width: 20, height: 15 },
    'column': { width: 15, height: 15 },
    'poteau': { width: 15, height: 15 },
    'pipe': { width: 20, height: 10 },
    'conduit': { width: 20, height: 10 },
    'beam': { width: 40, height: 20 },
    'poutre': { width: 20, height: 40 },
    'tree': { width: 30, height: 30 },
    'default': { width: 20, height: 20 }
};

// États de l'interface
let interfaceState = {
    propertiesPanelVisible: false,
    rulersVisible: false,
    gridVisible: true,
    snapEnabled: false,
    eraserMode: false,
    fullscreen: false
};

// Configuration du zoom
const ZOOM_CONFIG = {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    wheelSensitivity: 0.001
};

// Configuration de la grille
const GRID_CONFIG = {
    defaultSize: 20,
    minSize: 5,
    maxSize: 100,
    color: '#e0e0e0',
    majorLineInterval: 5
};

// Configuration des poignées
const HANDLE_CONFIG = {
    resize: {
        size: 6,
        color: '#FF9800',
        borderColor: '#F57C00',
        tolerance: 5
    },
    rotation: {
        size: 8,
        color: '#2196F3',
        borderColor: '#1976D2',
        distance: 50,
        tolerance: 5
    }
};

// Performance et optimisation
const PERFORMANCE_CONFIG = {
    maxShapes: 1000,
    redrawThrottle: 16, // 60 FPS
    autoSaveInterval: 300000, // 5 minutes
    historyLimit: 50
};

// Raccourcis clavier
const KEYBOARD_SHORTCUTS = {
    'v': 'select',
    'l': 'line',
    't': 'text',
    'e': 'erase',
    'r': 'rectangle',
    'c': 'circle',
    'w': 'wall',
    'd': 'door',
    'f': 'furniture',
    'g': 'toggleGrid',
    's': 'toggleSnap',
    'Delete': 'deleteSelected',
    'Escape': 'deselectAll',
    ' ': 'temporarySelect'
};

// Messages d'aide
const HELP_MESSAGES = {
    'select': 'Cliquez pour sélectionner • Glissez pour déplacer • Poignées pour redimensionner/rotation',
    'line': 'Cliquez et glissez pour tracer une ligne',
    'rectangle': 'Cliquez et glissez pour créer un rectangle',
    'circle': 'Cliquez et glissez pour créer un cercle',
    'wall': 'Cliquez et glissez pour créer un mur',
    'door': 'Cliquez et glissez pour créer une porte (supporte la rotation)',
    'window': 'Cliquez et glissez pour créer une fenêtre',
    'text': 'Cliquez pour ajouter du texte',
    'stairs': 'Cliquez et glissez pour créer un escalier',
    'elevator': 'Cliquez et glissez pour créer un ascenseur',
    'technical': 'Cliquez et glissez pour créer un espace technique',
    'furniture': 'Cliquez et glissez pour créer un meuble',
    'bathroom': 'Cliquez et glissez pour créer une salle de bain',
    'kitchen': 'Cliquez et glissez pour créer une cuisine',
    'tree': 'Cliquez et glissez pour créer un arbre',
    'duct': 'Cliquez et glissez pour créer une gaine technique',
    'gaine': 'Cliquez et glissez pour créer une gaine',
    'column': 'Cliquez et glissez pour créer une colonne',
    'poteau': 'Cliquez et glissez pour créer un poteau',
    'pipe': 'Cliquez et glissez pour créer un conduit',
    'conduit': 'Cliquez et glissez pour créer un tuyau',
    'beam': 'Cliquez et glissez pour créer une poutre',
    'poutre': 'Cliquez et glissez pour créer une poutre',
    'dimension': 'Cliquez deux points pour créer une cotation',
    'erase': 'Cliquez et glissez pour effacer (effacement partiel)'
};

// Fonctions utilitaires pour les variables
function isToolRotatable(toolType) {
    return ROTATABLE_TOOLS.includes(toolType);
}

function isToolRectangular(toolType) {
    return RECTANGULAR_TOOLS.includes(toolType);
}

function isToolLinear(toolType) {
    return LINEAR_TOOLS.includes(toolType);
}

function isToolCircular(toolType) {
    return CIRCULAR_TOOLS.includes(toolType);
}

function isToolPositioned(toolType) {
    return POSITIONED_TOOLS.includes(toolType);
}

function isToolTechnical(toolType) {
    return TECHNICAL_TOOLS.includes(toolType);
}

function getToolDefaultColors(toolType) {
    return TOOL_DEFAULT_COLORS[toolType] || TOOL_DEFAULT_COLORS['default'] || { stroke: '#000000', fill: '#ffffff' };
}

function getToolMinSize(toolType) {
    return TOOL_MIN_SIZES[toolType] || TOOL_MIN_SIZES['default'];
}

function getHelpMessage(toolType) {
    return HELP_MESSAGES[toolType] || 'Outil de dessin architectural';
}

// Export des variables pour debug
window.ArchiDrawVariables = {
    shapes: () => shapes,
    currentTool: () => currentTool,
    selectedShape: () => selectedShape,
    ROTATABLE_TOOLS,
    RECTANGULAR_TOOLS,
    TECHNICAL_TOOLS,
    TOOL_DEFAULT_COLORS,
    interfaceState,
    PERFORMANCE_CONFIG
};

// Export des fonctions utilitaires
window.isToolRotatable = isToolRotatable;
window.isToolRectangular = isToolRectangular;
window.isToolLinear = isToolLinear;
window.isToolCircular = isToolCircular;
window.isToolPositioned = isToolPositioned;
window.isToolTechnical = isToolTechnical;
window.getToolDefaultColors = getToolDefaultColors;
window.getToolMinSize = getToolMinSize;
window.getHelpMessage = getHelpMessage;