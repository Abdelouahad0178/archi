// variables.js - Variables globales ArchiDraw
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

// Variables pour le déplacement et la rotation
let isDragging = false;
let isRotating = false;
let dragStartX = 0;
let dragStartY = 0;
let rotationCenter = { x: 0, y: 0 };
let initialRotation = 0;
let rotationHandles = [];

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